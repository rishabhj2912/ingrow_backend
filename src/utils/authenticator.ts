import { Request, Response, NextFunction } from 'express';
import { UNAUTHORIZED_ERROR } from './constants/error';
import { generateErrorMessage } from './response';
import { getLinkedinUser, getUserCookies } from '@user/service';

export function authenticate() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const linkedinCookies = req.headers['x-auth-token'];
    const csrfToken = req.headers['x-csrf-token'];
    if (!authHeader) {
      return res.status(401).json({
        ...generateErrorMessage(UNAUTHORIZED_ERROR),
        isTokenInvalid: true
      });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        ...generateErrorMessage(UNAUTHORIZED_ERROR),
        isTokenInvalid: true
      });
    }

    try {
      const user = await getLinkedinUser(token);
      if (!user) {
        return res
          .status(401)
          .json(
            generateErrorMessage({ ...UNAUTHORIZED_ERROR, userNotFound: true })
          );
      }
      if (linkedinCookies && csrfToken) {
        res.locals.linkedinCookies = linkedinCookies;
        res.locals.csrfToken = csrfToken;
      } else {
        const userAuth = await getUserCookies(user._id);
        res.locals.linkedinCookies = userAuth?.cookies;
        res.locals.csrfToken = userAuth?.csrfToken;
      }
      res.locals.user = user;
      next();
    } catch (err) {
      return res.status(401).json({
        ...generateErrorMessage(UNAUTHORIZED_ERROR),
        isTokenInvalid: true
      });
    }
  };
}

export function authenticateCron() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        ...generateErrorMessage(UNAUTHORIZED_ERROR),
        isTokenInvalid: true
      });
    }
    const token = authHeader.split(' ')[1];
    if (!token || token !== process.env.CRON_AUTH_TOKEN) {
      return res.status(401).json({
        ...generateErrorMessage(UNAUTHORIZED_ERROR),
        isTokenInvalid: true
      });
    }
    next();
  };
}
