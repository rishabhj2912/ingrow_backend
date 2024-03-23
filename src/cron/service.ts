/* eslint-disable indent */
import { PeronaDetails } from '@user/model';
import { setLinkedinCredentialsAsExpired } from '@user/service';
import { connectDb, MONGO_COLLECTIONS } from '@utils/config/db';
import { generatePostCommentPrompt, sendToChat } from '@utils/langchain/openai';
import { getPostsFromNotifications } from '@utils/linkedin/api/notifications';
import { getPostsDetails } from '@utils/linkedin/api/posts';
import { getFullProfile } from '@utils/linkedin/api/profile';
import { ObjectId } from 'mongodb';

// --------------------------------------------------------------
//            Generate Comments for Saved Posts
// --------------------------------------------------------------

export async function savePostsAndGenerateCommentsForAllUsers(count: number) {
  console.log(
    `[[CRON] - ${new Date()} - Step 1 - Generating comments for all users' posts`
  );
  let delay = 1000; // Initial delay in milliseconds (1 second)
  const exponentialFactor = 2; // Factor by which delay increases
  const finalOutput = [];
  const dbClient = await connectDb();

  const pipeline = [
    {
      $lookup: {
        from: MONGO_COLLECTIONS.USER_AUTH,
        localField: '_id',
        foreignField: 'userId',
        as: 'authDetails'
      }
    },
    {
      $addFields: {
        details: { $arrayElemAt: ['$authDetails', 0] }
      }
    }
  ];
  const users = await dbClient
    .collection(MONGO_COLLECTIONS.USERS)
    .aggregate(pipeline)
    .toArray();

  const filteredUsers = users?.filter(
    (user: any) => user?.details?.isExpired == false
  );

  console.log(`[CRON] - ${new Date()} - Step 1 - No of users: ${users.length}`);

  console.log(
    `[CRON] - ${new Date()} - Step 1 - No of filtered users: ${filteredUsers.length}`
  );

  for (const user of filteredUsers) {
    const userProfile = await getFullProfile(
      user.details?.csrfToken,
      user.details?.cookies,
      user.username
    );

    const result = await savePostsAndGenerateCommentsForUserViaUserId(
      user.details?.csrfToken,
      user.details?.cookies,
      user._id,
      user.personaDetails,
      userProfile,
      count
    );
    finalOutput.push(result);
    await sleep(delay);
    delay *= exponentialFactor; // Increase the delay exponentially
  }
  return finalOutput.filter((el) => el !== null);
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function savePostsAndGenerateCommentsForUserViaUserId(
  csrfToken: string,
  cookies: string,
  userId: ObjectId,
  personaDetails: any,
  userProfile: any,
  count: number
) {
  try {
    console.log(
      `[CRON] - ${new Date()} - Step 2 - Starting generating comments for user ${userId}`
    );
    const dbClient = await connectDb();

    let postsNotifcations;
    try {
      postsNotifcations = await getPostsFromNotifications(
        csrfToken,
        cookies,
        count
      );
    } catch (err: any) {
      console.error(
        `[CRON] - ${new Date()} - Error in (getPostsFromNotifications) generating comments for user with userId ${userId} Marking as expired.`,
        err
      );
      await setLinkedinCredentialsAsExpired(userId);
    }

    console.log(
      `[CRON] - ${new Date()} - Step 2 - Fetched Notifications for ${userId} - No of posts from notification: ${postsNotifcations?.length}`
    );

    const postsFromDb = await dbClient
      .collection(MONGO_COLLECTIONS.POSTS_WITH_COMMENTS)
      .find({ userId, alreadyCommented: false })
      .toArray();

    const newPosts = postsNotifcations?.filter(
      (post: any) => postsFromDb.findIndex((el) => el === post.postUrn) == -1
    );

    console.log(
      `[CRON] - ${new Date()} - Step 2 - Fetched DB posts for ${userId} - No of posts from notification: ${postsNotifcations?.length} from DB: ${postsFromDb?.length} New Posts: ${newPosts?.length}`
    );

    if (!newPosts || newPosts?.length === 0) return [];

    const postCommentPromises = newPosts.map(async (postUrn: any) => {
      try {
        const postDetails = await getPostsDetails(csrfToken, cookies, postUrn);
        const comments = postDetails.postText
          ? await generateCommentForSinglePost(
              userId.toString(),
              postDetails.postText,
              postDetails.rePostActor?.firstName ||
                postDetails.actor.firstName ||
                '',
              personaDetails,
              userProfile
            )
          : null;

        // Add a 5-second delay after each post
        await new Promise((resolve) => setTimeout(resolve, 2000));

        console.log(
          `[CRON] - ${new Date()} - Step 2 - Generated comments for userId ${userId} - No of comments for post: ${comments?.length} - PostUrn: ${postUrn}`
        );

        return {
          ...postDetails,
          comments,
          userId,
          created_at: new Date(),
          alreadyCommented: false
        };
      } catch (err) {
        console.log(
          `[CRON] - ${new Date()} - Step 2 - Error in generating comments for post for userId ${userId} PostUrn: ${postUrn}`,
          err
        );
        return null;
      }
    });

    const result = await Promise.all(postCommentPromises);

    const dataToInsert = result.filter((el) => el.comments !== null);
    await dbClient
      .collection(MONGO_COLLECTIONS.POSTS_WITH_COMMENTS)
      .insertMany(dataToInsert, { ordered: false });

    console.log(
      `[CRON] - ${new Date()} - Step 2 - Generated comments for user with userId ${userId} - No of posts: ${dataToInsert.length}`
    );
    return dataToInsert;
  } catch (err) {
    console.error(
      `[CRON] - ${new Date()} - Error in (savePostsAndGenerateCommentsForUserViaUserId) generating comments for user with userId ${userId}`,
      err
    );
    return null;
  }
}

async function generateCommentForSinglePost(
  userId: string,
  postText: string,
  postOwnerName: string,
  personaDetails: PeronaDetails,
  userProfile: any
) {
  try {
    const result = await sendToChat(
      userId,
      generatePostCommentPrompt(
        postOwnerName,
        postText,
        userProfile,
        personaDetails.role,
        personaDetails.objective,
        personaDetails.includeHastags,
        personaDetails.includeEmojis,
        personaDetails.brief,
        personaDetails.tone,
        personaDetails.characters
      )
    );
    // return result;

    return result ? JSON.parse(result) : null;
  } catch (e) {
    console.error(
      'Error while generating comments for post for sessionId: ',
      e
    );
    return null;
  }
}
