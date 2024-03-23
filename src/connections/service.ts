import { CustomError } from '@utils/CustomError';
import { connectDb, MONGO_COLLECTIONS } from '@utils/config/db';
import { getFullProfile } from '@utils/linkedin/api/profile';
import { ObjectId } from 'mongodb';

// --------------------------------------------------------------
//             Add Connection
// --------------------------------------------------------------
export async function addConnection(username: string, userId: ObjectId) {
  const dbClient = await connectDb();

  const filter = { userId, username };
  const update = {
    $setOnInsert: { userId, username, created_at: new Date() },
    $set: { follow: true, updated_at: new Date() }
  };
  const options = { upsert: true };

  const result = await dbClient
    .collection(MONGO_COLLECTIONS.CONNECTIONS)
    .findOneAndUpdate(filter, update, options);

  if (result?.follow) {
    throw new CustomError({
      code: 400,
      message: 'User already connected'
    });
  }
}
// --------------------------------------------------------------
//            Remove Connection
// --------------------------------------------------------------
export async function removeConnection(username: string, userId: ObjectId) {
  const dbClient = await connectDb();
  await dbClient
    .collection(MONGO_COLLECTIONS.CONNECTIONS)
    .findOneAndUpdate(
      { userId, username },
      { $set: { follow: false, updated_at: new Date() } }
    );
}

// --------------------------------------------------------------
//              Fetch Connections List
// --------------------------------------------------------------
export async function fetchConnectionsList(userId: ObjectId) {
  const dbClient = await connectDb();

  const pipeline = [
    {
      $match: {
        userId: userId,
        follow: true
      }
    },
    {
      $lookup: {
        from: MONGO_COLLECTIONS.LINKEDIN_PROFILES,
        localField: 'username',
        foreignField: 'username',
        as: 'details'
      }
    },
    {
      $addFields: {
        details: { $arrayElemAt: ['$details', 0] }
      }
    },
    {
      $project: {
        username: 1,
        profileUrn: '$details.profileData.profileUrn',
        lastName: '$details.profileData.lastName',
        firstName: '$details.profileData.firstName',
        company: '$details.profileData.company',
        designation: '$details.profileData.designation',
        headline: '$details.profileData.headline',
        entityUrn: '$details.profileData.entityUrn',
        profileImage: '$details.profileData.profileImage'
      }
    }
  ];

  const data = await dbClient
    .collection(MONGO_COLLECTIONS.CONNECTIONS)
    .aggregate(pipeline)
    .toArray();

  return data;
}

// --------------------------------------------------------------
//             Add Profile to Database
// --------------------------------------------------------------
export async function addProfileToDatabase(
  username: string,
  profileUrn: string,
  profileData: any,
  rawProfile: any
) {
  try {
    const dbClient = await connectDb();
    await dbClient
      .collection(MONGO_COLLECTIONS.LINKEDIN_PROFILES)
      .insertOne({ username, profileUrn, profileData, created_at: new Date() });
    await dbClient
      .collection(MONGO_COLLECTIONS.LINKEDIN_RAW_PROFILES)
      .insertOne({ username, profileUrn, rawProfile, created_at: new Date() });
  } catch (err: any) {
    console.error('Silent Error: Error while saving profile in database', err);
  }
}

// --------------------------------------------------------------
//             Get Full Profile by Username
// --------------------------------------------------------------
export async function findByUsername(username: string) {
  const dbClient = await connectDb();
  const data = await dbClient
    .collection(MONGO_COLLECTIONS.LINKEDIN_PROFILES)
    .findOne({ username });
  return data;
}

// --------------------------------------------------------------
//             Get suggestion list
// --------------------------------------------------------------
export async function getSuggestionList() {
  const dbClient = await connectDb();
  const data = await dbClient
    .collection(MONGO_COLLECTIONS.SUGGESTIONS_DIRECTORY)
    .find()
    .toArray();
  return data;
}

// --------------------------------------------------------------
//             Get suggestion list
// --------------------------------------------------------------
export async function generateSuggestions(
  csrfToken: string,
  cookies: string,
  profileList: any[]
) {
  const profiles = await Promise.all(
    profileList.map(async (profile: any) => {
      try {
        const profileData = await getFullProfile(
          csrfToken,
          cookies,
          profile.username
        );
        return {
          ...profileData,
          industries: profile.industry.map((i: string) => i.trim())
        };
      } catch (err) {
        console.log('Error while generating suggestions', err);
        return null;
      }
    })
  );
  const dbClient = await connectDb();
  const data = await dbClient
    .collection(MONGO_COLLECTIONS.SUGGESTIONS_DIRECTORY)
    .insertMany(profiles.filter((p) => p !== null));
  return data;
}
