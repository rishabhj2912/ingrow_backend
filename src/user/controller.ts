import { NextFunction, Request, Response, Router } from 'express';
import { authenticate } from '@utils/authenticator';
import { getAccessTokenLinkedin } from './linkedin';
import {
  commentOnPost,
  getLinkedinUser,
  getPostsWithCommentsFromDb,
  intializeGpt,
  personaSync,
  skipPersonaSync,
  updateExtensionStatus,
  updateLinkedinCredentials,
  getUserDetails,
  generateCommentForSinglePostOnRefresh
} from './service';
import { generateResponse } from '@utils/response';
import { validateRequest } from '@utils/validator';
import {
  commentOnPostRequestSchema,
  loginRequestSchema,
  personaSyncRequestSchema,
  refreshCommentRequestSchema,
  updateExtensionStatusRequestSchema
} from './model';

const router = Router();

import { ObjectId } from 'mongodb';


// --------------------------------------------------------------
//                  Get access token from code
// --------------------------------------------------------------
router.get(
  '/login/token',
  validateRequest('query', loginRequestSchema),
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.query;
      const userToken = await getAccessTokenLinkedin(code!!.toString());
      const { access_token, expires_in } = userToken;
      const user = await getLinkedinUser(access_token);
      // Intialize GPT Here
      // Sync comments here
      res.status(200).send(
        generateResponse(200, 'Login Successfull!', {
          ...user,
          access_token: access_token,
          expiry: expires_in
        })
      );
    } catch (err) {
      next(err);
    }
  }
);

// --------------------------------------------------------------
//             User Details API
// --------------------------------------------------------------
router.get(
  '/details',
  authenticate(),
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      res
        .status(200)
        .send(
          generateResponse(200, 'Fetched user profile successfully!', user)
        );
    } catch (err) {
      next(err);
    }
  }
);

// --------------------------------------------------------------
//             Intialize Chat API
// --------------------------------------------------------------
router.post(
  '/initialize',
  authenticate(),
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const csrfToken = res.locals.csrfToken;
      const cookies = res.locals.linkedinCookies;

      const user = res.locals.user;
      const data = await intializeGpt(csrfToken, cookies, user._id);
      res
        .status(200)
        .send(
          generateResponse(200, 'Fetched user comments successfully!', data)
        );
    } catch (err) {
      next(err);
    }
  }
);

// --------------------------------------------------------------
//             Update Extension Status API
// --------------------------------------------------------------
router.put(
  '/extension/:status',
  authenticate(),
  validateRequest('params', updateExtensionStatusRequestSchema),
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      const status = req.params.status;
      await updateExtensionStatus(user._id, status === 'true');
      res.status(200).send(generateResponse(200, 'Updated extension status'));
    } catch (err) {
      next(err);
    }
  }
);

// --------------------------------------------------------------
//             Get Extension Status API
// --------------------------------------------------------------
router.get(
  '/extension-status',
  authenticate(),
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      const userDetails = await getUserDetails(user._id);
      const status = userDetails?.extensionInstalled ?? false;

      res.status(200).send(
        generateResponse(200, 'Fetched extension status sucessfully!', {
          status
        })
      );
    } catch (err) {
      next(err);
    }
  }
);

// --------------------------------------------------------------
//             Persona Sync API
// --------------------------------------------------------------
router.post(
  '/persona-sync',
  authenticate(),
  validateRequest('body', personaSyncRequestSchema),
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const {
        role,
        objective,
        includeHastags,
        includeEmojis,
        brief,
        tone,
        characters
      } = req.body;
      const user = res.locals.user;
      await personaSync(
        user._id,
        user.sessionId,
        role,
        objective,
        includeHastags,
        includeEmojis,
        brief,
        tone,
        characters
      );
      res
        .status(200)
        .send(generateResponse(200, 'Updated persona sync status'));
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/persona-sync/skip',
  authenticate(),
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      await skipPersonaSync(user._id);
      res
        .status(200)
        .send(generateResponse(200, 'Skipped persona sync status'));
    } catch (err) {
      next(err);
    }
  }
);

// --------------------------------------------------------------
//             Get Posts Feed API
// --------------------------------------------------------------
router.get(
  '/posts',
  authenticate(),
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      const data = await getPostsWithCommentsFromDb(user._id);
      res.status(200).send(generateResponse(200, 'Fetched posts', data));
    } catch (err) {
      next(err);
    }
  }
);

// --------------------------------------------------------------
//              Comment on Post API
// --------------------------------------------------------------
router.post(
  '/comment',
  authenticate(),
  validateRequest('body', commentOnPostRequestSchema),
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { postUrn, comment } = req.body;
      const user = res.locals.user;
      const csrfToken = res.locals.csrfToken;
      const cookies = res.locals.linkedinCookies;
      await commentOnPost(csrfToken, cookies, user._id, postUrn, comment);
      res
        .status(200)
        .send(generateResponse(200, 'Posted comment successfully!'));
    } catch (err) {
      next(err);
    }
  }
);

// --------------------------------------------------------------
//             Generate Refreshed Comment for Post
// --------------------------------------------------------------

router.post(
  '/post/comment/refresh/',
  authenticate(),
  validateRequest('body', refreshCommentRequestSchema),
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { postUrn, type } = req.body;
      const user = res.locals.user;
      const csrfToken = res.locals.csrfToken;
      const cookies = res.locals.linkedinCookies;
      const data = await generateCommentForSinglePostOnRefresh(
        csrfToken,
        cookies,
        type,
        user._id,
        postUrn
      );
      res
        .status(200)
        .send(generateResponse(200, 'Updated extension status', data));
    } catch (err) {
      next(err);
    }
  }
);

// --------------------------------------------------------------
//             Update linkedin credentials
// --------------------------------------------------------------

router.put(
  '/linkedin/update',
  authenticate(),
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user;
      const csrfToken = res.locals.csrfToken;
      const cookies = res.locals.linkedinCookies;
      await updateLinkedinCredentials(user._id, csrfToken, cookies);
      res.status(200).send(generateResponse(200, 'Updated linkedin cookies'));
    } catch (err) {
      next(err);
    }
  }
);

export default router;
