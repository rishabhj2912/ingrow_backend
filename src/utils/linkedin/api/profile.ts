import { addProfileToDatabase, findByUsername } from '@connections/service';
import { createInstance } from '../createInstance';
import uploadImageToCloud from '@utils/uploadImageToCloud';
import { UNAUTHORIZED_ERROR_LINKEDIN } from '@utils/constants/error';
import { CustomError } from '@utils/CustomError';

export async function getFullProfile(
  csrfToken: string,
  cookies: string,
  id: string
) {
  // If already exists in database.
  try {
    const dbValue = await findByUsername(id);
    if (dbValue) {
      return dbValue.profileData;
    }
    const instance = createInstance(csrfToken, cookies);

    /**
     * the profileView request gives you a full profile with Jobs, certificates, skills, etc..
     */

    const response = await instance.get(
      `/identity/profiles/${encodeURIComponent(id)}/profileView`
    );
    if (response.status === 401 || response.status === 403)
      throw new CustomError(UNAUTHORIZED_ERROR_LINKEDIN);
    if (response.status !== 200)
      throw new Error('Wrong response from LinkedIn');

    const rawProfile = response.data.included;

    // this array gives us the sorting of the positions. The first element is the current position
    const positionSort = rawProfile.find(
      (x: any) =>
        x.$type === 'com.linkedin.voyager.identity.profile.PositionView'
    )['*elements'];

    const positions = rawProfile.filter(
      (x: any) => x.$type === 'com.linkedin.voyager.identity.profile.Position'
    );
    const currentPosition = positions.find(
      (x: any) => x.entityUrn === positionSort[0]
    );

    const currentProfile = rawProfile.find(
      (x: { $type: string }) =>
        x.$type === 'com.linkedin.voyager.identity.profile.Profile'
    );

    const city = currentProfile?.locationName?.split(',')[0] || null;

    const positionsMap = new Map<string, any>();
    positions.forEach((position: any) => {
      positionsMap.set(position.entityUrn, position);
    });

    // Extracting required fields from positions and sorting based on positionSort array
    const sortedPositions = positionSort
      .map((urn: string) => {
        const position = positionsMap.get(urn);
        if (!position) return null;

        return {
          locationName: position?.locationName,
          companyName: position?.companyName,
          geoUrn: position?.geoUrn,
          description: position?.description,
          title: position?.title,
          companyUrn: position?.companyUrn,
          geoLocationName: position?.geoLocationName,
          employeeCountRangeStart: position?.company?.employeeCountRange?.start,
          employeeCountRangeEnd: position?.company?.employeeCountRange?.end,
          industries: position?.company?.industries
        };
      })
      .filter((position: any) => position);

    const miniProfile = rawProfile.find(
      (x: { $type: string; publicIdentifier: string }) =>
        x.$type === 'com.linkedin.voyager.identity.shared.MiniProfile' &&
        x.publicIdentifier == id
    );

    const simplifiedData = {
      lastName: currentProfile?.lastName || null,
      maidenName: currentProfile?.maidenName || null,
      firstName: currentProfile?.firstName || null,
      username: id || null,
      company: currentPosition?.companyName || null,
      designation: currentPosition?.title || null,
      city: city || null,
      country: currentProfile?.geoCountryName || null,
      geoLocationName: currentProfile?.geoLocationName || null,
      student: currentProfile?.student || null,
      entityUrn:
        currentProfile?.entityUrn?.split('urn:li:fs_profile:')[1] || null,
      headline: currentProfile?.headline || null,
      industryName: currentProfile?.industryName || null,
      summary: currentProfile?.summary || null,
      geoCountryUrn: currentProfile?.geoCountryUrn || null,
      state: currentPosition?.state || null,
      phoneticFirstName: currentPosition?.phoneticFirstName || null,
      birthDate: currentProfile?.birthDate || null,
      industryUrn: currentProfile?.industryUrn || null,
      sortedPositions: sortedPositions,
      profileImage: await uploadImageToCloud(
        miniProfile?.picture?.rootUrl +
          miniProfile?.picture?.artifacts[1]?.fileIdentifyingUrlPathSegment
      ),
      backgroundImage: await uploadImageToCloud(
        miniProfile?.picture?.rootUrl +
          miniProfile?.backgroundImage?.artifacts[1]
            ?.fileIdentifyingUrlPathSegment
      )
    };
    //  Add to database
    await addProfileToDatabase(
      id,
      simplifiedData.entityUrn,
      simplifiedData,
      rawProfile
    );
    return simplifiedData;
  } catch (err: any) {
    if (
      err.code === 401 ||
      err.code === 403 ||
      err.statusCode === 401 ||
      err.statusCode === 403
    ) {
      throw new CustomError(UNAUTHORIZED_ERROR_LINKEDIN);
    }
    console.log('Error while getting full profile from LinkedIn API ', err);
    throw new CustomError(UNAUTHORIZED_ERROR_LINKEDIN);
  }
}

export async function getCommentsOfProfile(
  csrfToken: string,
  cookies: string,
  profileUrn: string
) {
  try {
    const instance = createInstance(csrfToken, cookies);

    const response = await instance.get(
      `/voyagerFeedDashFrameworksMiniUpdates?decorationId=com.linkedin.voyager.dash.deco.feed.miniupdate.MiniUpdates-30&count=3&moduleKey=creator_profile_comments_content_view%3Adesktop&q=vieweeByFeedType&start=0&vieweeUrn=urn%3Ali%3Afsd_profile%3A${profileUrn}`
    );

    const filteredComments = response.data.included.filter(
      (element: any) => element?.commentary?.commentaryText?.text != null
    );

    const comments = filteredComments.map((element: any) => {
      const comment = {
        // TODO: Add post details
        comment: element.commentary.commentaryText.text
      };
      return comment;
    });
    return comments;
  } catch (err) {
    // Silent Error
    console.log(`Failed to fetch comments of a profile: ${profileUrn}`, err);
  }
}

export async function getMyProfile(csrfToken: string, cookies: string) {
  try {
    const instance = createInstance(csrfToken, cookies);

    const response = await instance.get('/me');

    const id = response.data.included[0].publicIdentifier;

    const simplifiedData = await getFullProfile(csrfToken, cookies, id);
    return simplifiedData;
  } catch (err) {
    console.error('Error while getting my profile API LINKEDIN /ME ', err);
    throw new CustomError(UNAUTHORIZED_ERROR_LINKEDIN);
  }
}
