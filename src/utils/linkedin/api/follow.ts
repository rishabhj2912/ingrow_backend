import { CustomError } from '@utils/CustomError';
import { createInstance } from '../createInstance';
import { UNAUTHORIZED_ERROR_LINKEDIN } from '@utils/constants/error';

export async function followPersonNotifications(
  csrfToken: string,
  cookies: string,
  id: string
) {
  await followUnFollowPersonNotifications(csrfToken, cookies, id, true);
}

export async function unfollowPersonNotifications(
  csrfToken: string,
  cookies: string,
  id: string
) {
  await followUnFollowPersonNotifications(csrfToken, cookies, id, false);
}

export async function followPerson(
  csrfToken: string,
  cookies: string,
  id: string
) {
  await followUnfollowPerson(csrfToken, cookies, id, true);
}

export async function unfollowPerson(
  csrfToken: string,
  cookies: string,
  id: string
) {
  await followUnfollowPerson(csrfToken, cookies, id, false);
}

async function followUnfollowPerson(
  csrfToken: string,
  cookies: string,
  id: string,
  follow: boolean
) {
  try {
    const instance = createInstance(csrfToken, cookies);
    const result = await instance.post(
      `/feed/dash/followingStates/urn:li:fsd_followingState:urn:li:fsd_profile:${encodeURIComponent(id)}`,
      {
        patch: {
          $set: {
            following: follow
          }
        }
      }
    );
    if (result.status !== 200) throw new Error('Wrong response from LinkedIn');
  } catch (err) {
    console.log('Error in followUnfollowPerson LINKEDIN API', err);
    throw new CustomError(UNAUTHORIZED_ERROR_LINKEDIN);
  }
}

async function followUnFollowPersonNotifications(
  csrfToken: string,
  cookies: string,
  id: string,
  follow: boolean
) {
  try {
    const instance = createInstance(csrfToken, cookies);
    const result = await instance.post(
      `notifications/dash/edgesetting/urn:li:fsd_edgeSetting:urn:li:fsd_profile:${encodeURIComponent(id)}`,
      {
        patch: {
          $set: {
            selectedOptionType: follow === true ? 'ALL' : 'HIGHLIGHTS'
          }
        }
      }
    );
    if (result.status !== 202) throw new Error('Wrong response from LinkedIn');
  } catch (err) {
    console.log('Error in followUnFollowPersonNotifications LINKEDIN API', err);
    throw new CustomError(UNAUTHORIZED_ERROR_LINKEDIN);
  }
}
