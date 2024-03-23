import {
  followPerson,
  followPersonNotifications,
  unfollowPerson,
  unfollowPersonNotifications
} from '@utils/linkedin/api/follow';
import { getFullProfile } from '@utils/linkedin/api/profile';
import { generateResponse } from '@utils/response';
import { NextFunction, Request, Response, Router } from 'express';
import {
  addConnection,
  fetchConnectionsList,
  generateSuggestions,
  getSuggestionList,
  removeConnection
} from './service';
import { CustomError } from '@utils/CustomError';
import { authenticate } from '@utils/authenticator';

const router = Router();

// --------------------------------------------------------------
//            Get profile details from username
// --------------------------------------------------------------
router.get(
  '/suggest/:username',
  authenticate(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const username = req.params.username;
      const csrfToken = res.locals.csrfToken;
      const cookies = res.locals.linkedinCookies;
      const profile = await getFullProfile(csrfToken, cookies, username);
      res
        .status(200)
        .send(generateResponse(202, 'Fetched profile successfully!', profile));
    } catch (err) {
      next(err);
    }
  }
);

// --------------------------------------------------------------
//             Follow a user
// --------------------------------------------------------------
router.put(
  '/follow/:username',
  authenticate(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = res.locals.user;
      const username = req.params.username;
      const csrfToken = res.locals.csrfToken;
      const cookies = res.locals.linkedinCookies;
      const profile = await getFullProfile(csrfToken, cookies, username);
      if (!profile) {
        throw new CustomError({
          code: 400,
          message: 'Invalid Linkedin Username'
        });
      }
      await followPerson(csrfToken, cookies, profile.entityUrn);
      await followPersonNotifications(csrfToken, cookies, profile.entityUrn);
      await addConnection(username, user._id);
      res.status(202).send(generateResponse(202, 'Followed successfully!'));
    } catch (err) {
      next(err);
    }
  }
);

// --------------------------------------------------------------
//             Unfollow a user
// --------------------------------------------------------------
router.put(
  '/unfollow/:username',
  authenticate(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = res.locals.user;
      const username = req.params.username;
      const csrfToken = res.locals.csrfToken;
      const cookies = res.locals.linkedinCookies;
      const profile = await getFullProfile(csrfToken, cookies, username);
      if (!profile) {
        throw new CustomError({
          code: 401,
          message: 'Invalid Linkedin Username'
        });
      }
      await unfollowPerson(csrfToken, cookies, profile.entityUrn);
      await unfollowPersonNotifications(csrfToken, cookies, profile.entityUrn);
      await removeConnection(username, user._id);
      res.status(202).send(generateResponse(202, 'Unfollowed successfully!'));
    } catch (err) {
      next(err);
    }
  }
);

// --------------------------------------------------------------
//            Get Connections List
// --------------------------------------------------------------
router.get(
  '/list',
  authenticate(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = res.locals.user;
      const data = await fetchConnectionsList(user._id);
      res
        .status(202)
        .send(
          generateResponse(202, 'Fetched connection list successfully!', data)
        );
    } catch (err) {
      next(err);
    }
  }
);

// --------------------------------------------------------------
//            Get Suggestions List
// --------------------------------------------------------------
router.get(
  '/suggestions',
  authenticate(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await getSuggestionList();
      res
        .status(200)
        .send(
          generateResponse(202, 'Fetched suggestion list successfully!', data)
        );
    } catch (err) {
      next(err);
    }
  }
);

// --------------------------------------------------------------
//            Generate Suggestions List
// --------------------------------------------------------------
router.post(
  '/suggestions/generate',
  authenticate(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const csrfToken = req.body.csrfToken;
      const cookies = req.body.linkedinCookies;
      const data = await generateSuggestions(
        csrfToken,
        cookies,
        req.body.profiles
      );
      res
        .status(200)
        .send(
          generateResponse(202, 'Fetched suggestion list successfully!', data)
        );
    } catch (err) {
      next(err);
    }
  }
);

export default router;
