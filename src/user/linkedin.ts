import { CustomError } from '@utils/CustomError';
import { SERVER_ERROR } from '@utils/constants/error';
import { URL } from '@utils/constants/utils';
import axios from 'axios';

// --------------------------------------------------------------
//                  Get access token from linkedin
// --------------------------------------------------------------
export async function getAccessTokenLinkedin(authorizationCode: string) {
  try {
    const response = await axios({
      url: URL.LINKEDIN_TOKEN,
      method: 'post',
      params: {
        code: authorizationCode,
        client_id: process.env.LINKEDIN_CLIENT_ID || undefined,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET || undefined,
        grant_type: 'authorization_code',
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI || undefined
      }
    });

    const result = response.data;
    return result;
  } catch (err: any) {
    if (err.response.data) {
      throw new CustomError({
        code: 400,
        message: err.response.data.error_description
      });
    } else {
      console.error('Error while getting access token from linkedin', err);
      throw new CustomError(SERVER_ERROR);
    }
  }
}
