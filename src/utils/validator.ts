import * as yup from 'yup';
import { NextFunction, Response, Request } from 'express';

import { ObjectId } from 'mongodb';
import { generateErrorMessage } from './response';

type RequestLocation = 'query' | 'body' | 'params';

export function validateRequest(
  location: RequestLocation,
  schema: yup.ObjectSchema<any>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    /* ----------------------------------------------------------*
                    Validate Location
    *-----------------------------------------------------------*/
    let _location: any;
    switch (location) {
      case 'query':
        _location = req.query;
        break;
      case 'body':
        _location = req.body;
        break;
      case 'params':
        _location = req.params;
        break;
      default:
        _location = req.body;
        break;
    }
    try {
      const validatedData = await schema.validate(_location, {
        stripUnknown: true
      });
      switch (location) {
        case 'query':
          req.query = validatedData as any;
          break;
        case 'body':
          req.body = validatedData;
          break;
        case 'params':
          req.params = validatedData as any;
          break;
        default:
          break;
      }
      next();
    } catch (error: any) {
      /* ----------------------------------------------------------*
                        Return if error
      *-----------------------------------------------------------*/
      const message = error.errors[0];
      return res.status(400).json(generateErrorMessage({ code: 400, message }));
    }
  };
}

export function validateObjectId(id: string | ObjectId): boolean {
  if (ObjectId.isValid(id) && String(new ObjectId(id)) === id) return true;
  return false;
}
