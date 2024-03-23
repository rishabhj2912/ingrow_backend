/* eslint-disable indent */
import uploadImageToCloud from '@utils/uploadImageToCloud';
import { createInstance } from '../createInstance';
import { CustomError } from '@utils/CustomError';
import {
  SERVER_ERROR,
  UNAUTHORIZED_ERROR_LINKEDIN
} from '@utils/constants/error';

interface PostDetails {
  postUrn: string;
  postText: string | null;
  actor: Actor;
  repostDetails?: {
    text: string | null;
  };
  rePostActor?: {
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    headline: string | null;
    profilePicture: string | null;
  };
  media?: {
    video?: {
      videoUrl: string | null;
      mediaType: string | null;
      width: number | null;
      bitRate: number | null;
      aspectRatio: string | null;
      duration: number | null;
      thumbnail: string | null;
    };
    image?: {
      imageUrl: string | null;
    };
    article?: {
      link: string | null;
      accessibilityText: string | null;
      subTitleText: string | null;
      titleText: string | null;
      previewImage: string | null;
    };
    pdf?: {
      pdfUrl: string | null;
      title: string | null;
      subTitle: string | null;
    };
  };
  likes: number | null;
  totalShares: number | null;
  comments: number | null;
  postUrl: string;
  postType: string | null;
  commentsPresent: any[] | null;
}

export async function getPostsDetails(
  csrfToken: string,
  cookies: string,
  postUrn: string
): Promise<PostDetails> {
  try {
    const instance = createInstance(csrfToken, cookies);
    const result = await instance.get(
      `/feed/updatesV2?commentsCount=10&likesCount=10&moduleKey=feed-item%3Adesktop&q=backendUrnOrNss&urnOrNss=urn%3Ali%3Aactivity%3A${postUrn}`
    );

    if (result.status !== 200) {
      throw new Error('Wrong response from LinkedIn');
    }

    const included = result.data.included;

    const postDetailsSection = included.find(
      (el: any) => el.commentary && !el['*resharedUpdate']
    );
    const rePostAuthorSection = included.find(
      (el: any) =>
        el.actor &&
        el.actor.$type == 'com.linkedin.voyager.feed.render.ActorComponent' &&
        el['*resharedUpdate'] != null
    );

    const rePostAuthorDetailsSection = included.find(
      (el: any) =>
        el.dashEntityUrn ===
        'urn:li:fsd_profile:' +
          rePostAuthorSection?.actor?.image?.attributes?.[0]?.[
            '*miniProfile'
          ].split('urn:li:fs_miniProfile:')[1]
    );

    const videoSection = included.find(
      (el: any) => el.progressiveStreams?.length > 0
    );

    const imagesSection = included.find(
      (el: any) => el.content?.images?.length > 0
    );

    const articleSection = included.find((el: any) =>
      el?.content?.urn?.includes('urn:li:article:')
    );

    const pdfSection = included.find(
      (el: any) =>
        el.content?.document?.transcribedDocumentUrl != null ||
        el.content?.document?.transcribedDocumentUrl != undefined
    );

    // Determine post type
    let postType: string | null = null;
    if (included.find((el: any) => el.progressiveStreams?.length > 0)) {
      postType = 'VIDEO';
    } else if (included.find((el: any) => el.content?.images?.length > 0)) {
      postType = 'IMAGE';
    } else if (
      included.find((el: any) => el?.content?.urn?.includes('urn:li:article:'))
    ) {
      postType = 'ARTICLE';
    } else if (
      included.find((el: any) => el.content?.document?.transcribedDocumentUrl)
    ) {
      postType = 'PDF';
    }

    // Extract comments data
    const commentsData = included.find(
      (el: any) =>
        el?.comment?.values[0]?.$type ===
        'com.linkedin.voyager.feed.shared.AnnotatedString'
    );
    const comments = commentsData?.comment?.values.map((el: any) => ({
      commentText: el?.comment?.values?.map((el: any) => el.value).join(' '),
      commentV2Text: el?.commentV2?.text,
      commenterName: el?.commenterForDashConversion?.title?.text,
      commenterUrl: el?.commenterForDashConversion?.navigationUrl,
      headline: el?.commenterForDashConversion?.subtitle,
      profileUrn: el?.commenterProfileId,
      link: el?.permalink
    }));

    // Extract author details
    const authorDetailsSection = included.find(
      (el: any) => el.objectUrn === postDetailsSection?.actor?.urn
    );

    // Extract likes and shares
    const likesSection = included.find(
      (el: any) => el.likes != null || el.likes != undefined
    );

    // Construct post details object
    const postDetails: PostDetails = {
      postUrn: postUrn,
      postText: postDetailsSection?.commentary?.text?.text || null,
      actor: await generateAuthor(postDetailsSection, authorDetailsSection),
      repostDetails: rePostAuthorSection && {
        text: rePostAuthorSection?.commentary?.text?.text || null
      },
      rePostActor:
        rePostAuthorSection &&
        (await generateAuthor(rePostAuthorSection, rePostAuthorDetailsSection)),
      media: {
        video: videoSection && {
          videoUrl:
            videoSection?.progressiveStreams[0]?.streamingLocations[0]?.url ||
            null,
          mediaType: videoSection?.progressiveStreams[0]?.mediaType || null,
          width: videoSection?.progressiveStreams[0]?.width || null,
          bitRate: videoSection?.progressiveStreams[0]?.bitRate || null,
          $type: videoSection?.progressiveStreams[0]?.$type || null,
          aspectRatio: videoSection?.aspectRatio || null,
          duration: videoSection?.duration || null,
          thumbnail: videoSection
            ? await uploadImageToCloud(
                videoSection?.thumbnail?.rootUrl +
                  videoSection?.thumbnail?.artifacts[
                    videoSection?.thumbnail?.artifacts?.length - 1
                  ]?.fileIdentifyingUrlPathSegment
              )
            : null
        },
        image: imagesSection && {
          imageUrl: imagesSection
            ? await uploadImageToCloud(
                imagesSection?.content.images[0].attributes[0].vectorImage
                  .rootUrl +
                  imagesSection?.content?.images[0]?.attributes[0]?.vectorImage
                    .artifacts[
                    imagesSection?.content?.images[0]?.attributes[0]
                      ?.vectorImage.artifacts?.length - 1
                  ]?.fileIdentifyingUrlPathSegment
              )
            : null
        },
        article: articleSection && {
          link:
            articleSection?.content?.navigationContext?.actionTarget || null,
          accessibilityText:
            articleSection?.content?.navigationContext?.accessibilityText ||
            null,
          subTitleText: articleSection?.content?.subtitle?.text || null,
          titleText: articleSection?.content?.title?.text || null,
          previewImage: articleSection
            ? await uploadImageToCloud(
                articleSection?.content?.largeImage?.attributes[0]?.vectorImage
                  ?.rootUrl +
                  articleSection?.content?.largeImage?.attributes[0]
                    ?.vectorImage?.artifacts[
                    articleSection?.content?.largeImage?.attributes[0]
                      ?.vectorImage?.artifacts?.length - 1
                  ]?.fileIdentifyingUrlPathSegment
              )
            : null
        },
        pdf: pdfSection && {
          pdfUrl: pdfSection?.content?.document?.transcribedDocumentUrl || null,
          title: pdfSection?.content?.document?.title || null,
          subTitle: pdfSection?.content?.subtitle?.text || null
        }
      },
      likes: likesSection?.likes?.paging?.count || null,
      totalShares: likesSection?.totalShares || null,
      comments: likesSection?.comments?.paging?.count || null,
      postUrl: `https://www.linkedin.com/feed/update/urn:li:activity:${postUrn}/`,
      postType: postType,
      commentsPresent: comments || null
    };

    return postDetails;
  } catch (err) {
    console.log('Error while getting post details from LinkedIn API ', err);
    throw new CustomError(UNAUTHORIZED_ERROR_LINKEDIN);
  }
}

interface Actor {
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  headline: string | null;
  profilePicture: string | null;
  profileUrn: string | null;
  username: string | null;
  profileUrl: string | null;
  supplementaryInfo: string | null;
}

async function generateAuthor(
  authorSection: any,
  authorDeatilsSection: any
): Promise<Actor> {
  try {
    return {
      name: authorSection?.actor?.name?.text || null,
      firstName: authorDeatilsSection?.firstName || null,
      lastName: authorDeatilsSection?.lastName || null,
      headline: authorDeatilsSection?.occupation || null,
      profilePicture: authorDeatilsSection
        ? await uploadImageToCloud(
            authorDeatilsSection?.picture?.rootUrl +
              authorDeatilsSection?.picture?.artifacts[
                authorDeatilsSection?.picture?.artifacts?.length - 1
              ]?.fileIdentifyingUrlPathSegment
          )
        : null,
      profileUrn: authorDeatilsSection?.entityUrn.split(
        'urn:li:fs_miniProfile:'
      )[1],
      username: authorDeatilsSection?.publicIdentifier,
      profileUrl: `https://www.linkedin.com/in/${authorDeatilsSection?.publicIdentifier}/`,
      supplementaryInfo: authorSection?.actor?.supplementaryActorInfo?.text
    };
  } catch (err) {
    console.log(
      'Error while generating author details from LinkedIn API ',
      err
    );
    throw new CustomError(SERVER_ERROR);
  }
}
