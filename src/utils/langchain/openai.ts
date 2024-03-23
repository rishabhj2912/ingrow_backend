import {
  COMMENT_GENERATE_POST,
  COMMENT_GENERATE_POST_REFRESH,
  ONBOARDING_FLOW,
  PERSONA_SYNC
} from './prompts';
import Portkey from 'portkey-ai';

export async function sendToChat(userId: any, messages: any) {
  const portkey = new Portkey({
    apiKey: process.env.PORTKEY_API_KEY
  });

  const chatCompletion = await portkey.chat.completions.create(
    {
      messages: messages
    },
    {
      config: 'pc-ingrow-b4ec50',
      metadata: {
        _user: userId
      }
    }
  );
  return chatCompletion.choices[0].message?.content;
}

export function generatePostCommentPrompt(
  postText: string,
  postOwner: string,
  userProfile: any,
  role: string,
  objective: string,
  includeHastags: boolean,
  includeEmojis: boolean,
  brief: string,
  tone: string,
  characters: string[]
) {
  return [
    ...generateDefaultMessages(
      userProfile,
      role,
      objective,
      includeHastags,
      includeEmojis,
      brief,
      tone,
      characters
    ),
    { role: 'user', content: COMMENT_GENERATE_POST(postText, postOwner) }
  ];
}

export function generateRefreshCommentPrompt(
  postText: string,
  postOwner: string,
  userProfile: any,
  role: string,
  objective: string,
  includeHastags: boolean,
  includeEmojis: boolean,
  brief: string,
  tone: string,
  characters: string[],
  refreshCategory: string
) {
  return [
    ...generateDefaultMessages(
      userProfile,
      role,
      objective,
      includeHastags,
      includeEmojis,
      brief,
      tone,
      characters
    ),
    {
      role: 'user',
      content: COMMENT_GENERATE_POST_REFRESH(
        refreshCategory,
        postText,
        postOwner
      )
    }
  ];
}

function generateDefaultMessages(
  userProfile: any,
  role: string,
  objective: string,
  includeHastags: boolean,
  includeEmojis: boolean,
  brief: string,
  tone: string,
  characters: string[]
) {
  return [
    { role: 'user', content: ONBOARDING_FLOW(userProfile) },
    { role: 'assistant', content: 'Understood.' },
    {
      role: 'user',
      content: PERSONA_SYNC(
        role,
        objective,
        includeHastags,
        includeEmojis,
        brief,
        tone,
        characters
      )
    },
    { role: 'assistant', content: 'Understood. I will follow these strictly' }
  ];
}
