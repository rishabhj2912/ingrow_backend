import { Db, MongoClient } from 'mongodb';

let db: Db | null;

export const connectDb = async () => {
  try {
    if (!db) {
      const client = new MongoClient(process.env.MONGODB_URI || '');
      await client.connect();
      db = client.db('ingrow');
      console.log('Connected to Database');
    }
    return db;
  } catch (err) {
    console.log(err);
    throw Error('Error');
  }
};

export const MONGO_COLLECTIONS = {
  USER_AUTH: 'user_auth',
  USERS: 'users',
  PAST_COMMENTS: 'past_comments',
  USER_COMMENTS_POSTS: 'user_comments_posts',
  CONNECTIONS: 'connections',
  LINKEDIN_PROFILES: 'linkedin_profiles',
  LINKEDIN_RAW_PROFILES: 'linkedin_raw_profiles',
  USER_CHAT_REL: 'user_chat_rel',
  MEMORY: 'memory',
  MEMORY_V2: 'memory_v2',
  POSTS_WITH_COMMENTS: 'posts_with_comments',
  SUGGESTIONS_DIRECTORY: 'suggestions_directory'
};
