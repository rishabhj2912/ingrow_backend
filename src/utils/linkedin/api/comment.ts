import { CustomError } from '@utils/CustomError';
import { createInstance } from '../createInstance';
import { UNAUTHORIZED_ERROR_LINKEDIN } from '@utils/constants/error';

export async function commentOnLinkedinPost(
  csrfToken: string,
  cookies: string,
  threadUrn: string,
  text: string
) {
  try {
    const instance = createInstance(csrfToken, cookies);
    const response = await instance.post(
      `voyagerSocialDashNormComments?decorationId=com.linkedin.voyager.dash.deco.social.NormComment-42`,
      {
        commentary: {
          text: text,
          attributesV2: [],
          $type: 'com.linkedin.voyager.dash.common.text.TextViewModel'
        },
        threadUrn: `urn:li:activity:${threadUrn}`
      }
    );

    if (response.status >= 400) throw new Error('Wrong response from LinkedIn');
  } catch (err) {
    console.log('API Error:--- ', err);
    throw new CustomError(UNAUTHORIZED_ERROR_LINKEDIN);
  }
}
// /feed/?highlightedUpdateUrn=urn%3Ali%3Aactivity%3A7157243402860822528
