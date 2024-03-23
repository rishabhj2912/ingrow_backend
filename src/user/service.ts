/* eslint-disable indent */
import axios from 'axios';
import { CustomError } from '../utils/CustomError';
import { URL } from '../utils/constants/utils';
import { MONGO_COLLECTIONS, connectDb } from '../utils/config/db';
import { EMAIL_NOT_VERIFIED } from '@utils/constants/error';
import { commentOnLinkedinPost } from '@utils/linkedin/api/comment';
import { ObjectId } from 'mongodb';
import {
  getCommentsOfProfile,
  getFullProfile,
  getMyProfile
} from '@utils/linkedin/api/profile';
import {
  generateRefreshCommentPrompt,
  sendToChat
} from '@utils/langchain/openai';
import uploadImageToCloud from '@utils/uploadImageToCloud';

// --------------------------------------------------------------
//             Get access token from code
// --------------------------------------------------------------
export async function getLinkedinUser(token: string): Promise<any> {
  try {
    const profileResponse = await axios.get(URL.LINKEDIN_PROFILE, {
      headers: {
        Authorization: `Bearer ${token}`,
        // get the response header cookies and csrf token
      }
    });
    const cookies = profileResponse.headers['set-cookie'];
    console.log('cookies', cookies);
    // Retrieve CSRF token from the response headers
    const csrfToken = profileResponse.headers['x-csrf-token'];
    console.log('csrfToken', csrfToken);
    const userProfile = profileResponse.data;
    if (userProfile.email_verified == false) {
      throw new CustomError(EMAIL_NOT_VERIFIED);
    }
    const userData = {
      firstName: userProfile.given_name,
      email: userProfile.email,
      lastName: userProfile.family_name,
      emailVerified: userProfile.email_verified,
      picture: await uploadImageToCloud(userProfile.picture),
      extensionInstalled: false,
      personaSynced: 'pending',
      profileVerified: false,
      created_at: new Date()
    };

    const finalUserData = await upsertUser(userData);

    return finalUserData;
  } catch (err: any) {
    if (err.response?.data) {
      throw new CustomError({
        ...err.response.data,
        code: err.response.data.status
      });
    } else throw new CustomError(err);
  }
}

// --------------------------------------------------------------
//             Get Extension Status
// --------------------------------------------------------------
export async function getUserDetails(userId: ObjectId): Promise<any> {
  const dbClient = await connectDb();
  const user = await dbClient
    .collection(MONGO_COLLECTIONS.USERS)
    .findOne({ _id: userId });
  return user;
}

// --------------------------------------------------------------
//             Update Extension Status
// --------------------------------------------------------------
export async function updateExtensionStatus(
  userId: ObjectId,
  status: boolean
): Promise<any> {
  const dbClient = await connectDb();
  const user = await dbClient
    .collection(MONGO_COLLECTIONS.USERS)
    .findOneAndUpdate(
      { _id: userId },
      {
        $set: { extensionInstalled: status, updated_at: new Date() }
      }
    );
  return user;
}

// --------------------------------------------------------------
//             Comment on a post
// --------------------------------------------------------------
export async function commentOnPost(
  csrfToken: string,
  cookies: string,
  userId: string,
  postUrn: string,
  comment: string
) {
  const dbClient = await connectDb();

  await commentOnLinkedinPost(csrfToken, cookies, postUrn, comment);

  const user = await dbClient
    .collection(MONGO_COLLECTIONS.USER_COMMENTS_POSTS)
    .insertOne({
      user: userId,
      postUrn: postUrn,
      comment: comment,
      created_at: new Date()
    });

  await dbClient
    .collection(MONGO_COLLECTIONS.POSTS_WITH_COMMENTS)
    .findOneAndUpdate(
      { postUrn: postUrn },
      {
        $set: {
          alreadyCommented: true,
          comment_timestamp: new Date(),
          updated_at: new Date()
        }
      }
    );

  return user;
}

// --------------------------------------------------------------
//            Persona Sync
// --------------------------------------------------------------
export async function personaSync(
  userId: ObjectId,
  sessionId: string,
  role: string,
  objective: string,
  includeHastags: boolean,
  includeEmojis: boolean,
  brief: string,
  tone: string,
  characters: string[]
) {
  // Async send to chats.
  // sendToChat(
  //   sessionId,
  //   PERSONA_SYNC(
  //     role,
  //     objective,
  //     includeHastags,
  //     includeEmojis,
  //     brief,
  //     tone,
  //     characters
  //   )
  // );
  // Async send to chats.
  const dbClient = await connectDb();
  await dbClient.collection(MONGO_COLLECTIONS.USERS).findOneAndUpdate(
    { _id: userId },
    {
      $set: {
        personaSynced: 'done',
        personaDetails: {
          role,
          objective,
          includeHastags,
          includeEmojis,
          brief,
          tone,
          characters
        },
        updated_at: new Date()
      }
    }
  );
}

export async function skipPersonaSync(userId: ObjectId) {
  const dbClient = await connectDb();
  await dbClient.collection(MONGO_COLLECTIONS.USERS).findOneAndUpdate(
    { _id: userId },
    {
      $set: { personaSynced: 'skipped', updated_at: new Date() }
    }
  );
}

// --------------------------------------------------------------
//             Initialize GPT Chat
// --------------------------------------------------------------
export async function intializeGpt(
  csrfToken: string,
  cookies: string,
  userId: ObjectId
) {
  const { entityUrn, username, headline } = await getMyProfile(
    csrfToken,
    cookies
  );
  const comments = await getCommentsOfProfile(csrfToken, cookies, entityUrn);
  await fillInitialDataInDb(
    csrfToken,
    cookies,
    comments,
    userId,
    entityUrn,
    headline,
    username
  );
  return comments;
}

async function fillInitialDataInDb(
  csrfToken: string,
  cookies: string,
  comments: any[],
  userId: ObjectId,
  entityUrn: string,
  headline: string,
  username: string
) {
  const pastComments = comments.map((comment: any) => {
    return { userId: userId, ...comment, created_at: new Date() };
  });

  const dbClient = await connectDb();

  // Async process
  dbClient.collection(MONGO_COLLECTIONS.PAST_COMMENTS).insertMany(pastComments);

  // Save profile in db asyncrounously
  getFullProfile(csrfToken, cookies, username);

  await dbClient.collection(MONGO_COLLECTIONS.USERS).findOneAndUpdate(
    { _id: userId },
    {
      $set: {
        profileVerified: true,
        entityUrn,
        headline,
        username,
        updated_at: new Date()
      }
    }
  );
  await dbClient.collection(MONGO_COLLECTIONS.USER_AUTH).findOneAndUpdate(
    { userId: userId },
    {
      $setOnInsert: {
        userId,
        cookies,
        csrfToken,
        isExpired: false,
        updated_at: new Date()
      }
    },
    { upsert: true, returnDocument: 'after' }
  );
}

// --------------------------------------------------------------
//             Generate Comment for Single Post on Refresh
// --------------------------------------------------------------
export async function generateCommentForSinglePostOnRefresh(
  csrfToken: string,
  cookies: string,
  typeOfComment: string,
  userId: ObjectId,
  postUrn: string
) {
  try {
    const dbClient = await connectDb();
    const post = await dbClient
      .collection(MONGO_COLLECTIONS.POSTS_WITH_COMMENTS)
      .findOne({ postUrn });
    if (!post) {
      throw new CustomError({
        code: 404,
        message: 'Post not found'
      });
    }
    const postOwnerName =
      post?.rePostActor?.firstName || post?.actor.firstName || '';

    const userDetails = await getUserDetails(userId);

    const userProfile = await getFullProfile(
      csrfToken,
      cookies,
      userDetails.username
    );

    const result = await sendToChat(
      userId,
      generateRefreshCommentPrompt(
        post.postText,
        postOwnerName,
        userProfile,
        userDetails.personaDetails.role,
        userDetails.personaDetails.objective,
        userDetails.personaDetails.includeHastags,
        userDetails.personaDetails.includeEmojis,
        userDetails.personaDetails.brief,
        userDetails.personaDetails.tone,
        userDetails.personaDetails.characters,
        typeOfComment
      )
    );
    if (!result) {
      throw new CustomError({
        code: 500,
        message: 'Error in generating comments as the result was null.'
      });
    }

    const parsedJSON = JSON.parse(result);

    const updatedComments = [...post.comments, ...parsedJSON];
    await dbClient
      .collection(MONGO_COLLECTIONS.POSTS_WITH_COMMENTS)
      .findOneAndUpdate(
        { urn: postUrn },
        {
          $set: { comments: updatedComments, updated_at: new Date() }
        }
      );

    return parsedJSON;
  } catch (err) {
    console.log(err);
    throw new CustomError({
      code: 500,
      message: 'Error in generating comments'
    });
  }
}

// --------------------------------------------------------------
//             Get Posts from Database = User Feed
// --------------------------------------------------------------
export async function getPostsWithCommentsFromDb(userId: ObjectId) {
  const dbClient = await connectDb();
  const data = await dbClient
    .collection(MONGO_COLLECTIONS.POSTS_WITH_COMMENTS)
    .find({ userId: userId })
    .sort({ created_at: 1, alreadyCommented: 1 })
    .toArray();
  return data;
}

// --------------------------------------------------------------
//            Upsert User
// --------------------------------------------------------------
async function upsertUser(userData: any): Promise<any> {
  const dbClient = await connectDb();
  const user = await dbClient
    .collection(MONGO_COLLECTIONS.USERS)
    .findOneAndUpdate(
      { email: userData.email },
      {
        $setOnInsert: userData
      },
      { upsert: true, returnDocument: 'after' }
    );

  const connections = await dbClient
    .collection(MONGO_COLLECTIONS.CONNECTIONS)
    .find({ userId: user?._id })
    .toArray();
  return { ...user, connectionsCount: connections?.length };
}

// --------------------------------------------------------------
//            Get User Cookies
// --------------------------------------------------------------
export async function getUserCookies(userId: ObjectId) {
  try {
    const dbClient = await connectDb();
    const user = await dbClient
      .collection(MONGO_COLLECTIONS.USER_AUTH)
      .findOne({ userId: userId, isExpired: false });
    return { cookies: user?.cookies, csrfToken: user?.csrfToken };
  } catch (err: any) {
    console.log('Error in getUserCookies', err);
    return null;
  }
}

export async function updateLinkedinCredentials(
  userId: ObjectId,
  csrfToken: string,
  cookies: string
) {
  const dbClient = await connectDb();
  const user = await dbClient
    .collection(MONGO_COLLECTIONS.USER_AUTH)
    .findOneAndUpdate(
      { userId: userId },
      {
        $set: { cookies, csrfToken, updated_at: new Date(), isExpired: false }
      }
    );
  return user;
}

export async function setLinkedinCredentialsAsExpired(userId: ObjectId) {
  const dbClient = await connectDb();
  const user = await dbClient
    .collection(MONGO_COLLECTIONS.USER_AUTH)
    .findOneAndUpdate(
      { userId: userId },
      {
        $set: {
          updated_at: new Date(),
          isExpired: true
        }
      }
    );
  return user;
}
