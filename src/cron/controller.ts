import { authenticateCron } from '@utils/authenticator';
import { generateResponse } from '@utils/response';
import { NextFunction, Router, Request, Response } from 'express';
import { savePostsAndGenerateCommentsForAllUsers } from './service';
import { generateCronRequestSchema } from './models';
import { validateRequest } from '@utils/validator';

const router = Router();

// --------------------------------------------------------------
//             Save Posts & Generate comments for them API
// --------------------------------------------------------------
router.get(
  '/posts/generate/comments/',
  authenticateCron(),
  validateRequest('query', generateCronRequestSchema),
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const count = req.query.count;
      const data = await savePostsAndGenerateCommentsForAllUsers(+count!!);
      res.status(200).send(generateResponse(200, 'Fetched posts', data));
    } catch (err) {
      next(err);
    }
  }
);

export default router;
