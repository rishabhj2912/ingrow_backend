// voyagerIdentityDashNotificationCards?decorationId=com.linkedin.voyager.dash.deco.identity.notifications.CardsCollectionWithInjectionsNoPills-21&count=10&q=filterVanityName

import { CustomError } from '@utils/CustomError';
import { UNAUTHORIZED_ERROR_LINKEDIN } from '@utils/constants/error';
import { createInstance } from '../createInstance';

export async function getPostsFromNotifications(
  csrfToken: string,
  cookies: string,
  count: number
) {
  try {
    const instance = createInstance(csrfToken, cookies);
    const response = await instance.get(
      `/voyagerIdentityDashNotificationCards?decorationId=com.linkedin.voyager.dash.deco.identity.notifications.CardsCollectionWithInjectionsNoPills-21&count=${count}&filterUrn=urn%3Ali%3Afsd_notificationFilter%3AALL&q=notifications`
    );

    const data = response.data.included.filter((element: any) =>
      element.entityUrn.includes('SHARED_BY_YOUR_NETWORK')
    );
    // kNOWN ISSUE  if grouped. https://www.linkedin.com/notifications/aggregate-landing/?groupBy=urn%3Ali%3Amember%3A641538148&notificationType=SHARED_BY_YOUR_NETWORK
    return data
      .map((element: any) => {
        return extractValueFromURL(element?.cardAction?.actionTarget);
      })
      .filter((element: any) => element != null);
  } catch (err) {
    console.error(
      'Error from LINKEDIN API to get Posts from Notifcations',
      err
    );
    throw new CustomError(UNAUTHORIZED_ERROR_LINKEDIN);
  }
}

function extractValueFromURL(url: string | undefined) {
  if (!url) {
    return;
  }
  // Split the URL by '?' to get the query string
  const queryString = url.split('?')[1];

  if (queryString) {
    // Split the query string by '&' to get individual parameters
    const params = queryString.split('&');

    // Loop through the parameters to find the one containing "highlightedUpdateUrn"
    for (let i = 0; i < params.length; i++) {
      const param = params[i];
      // Check if the parameter contains "highlightedUpdateUrn"
      if (param.includes('highlightedUpdateUrn=')) {
        // Split the parameter by '=' to get the key-value pair
        const keyValue = param.split('=');
        // Return the value part which is after '='
        return keyValue[1].split('urn%3Ali%3Aactivity%3A')[1];
      }
    }
  }

  // Return null if the value is not found
  return null;
}
