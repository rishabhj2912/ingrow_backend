import { Request, Response } from 'express';

export interface ErrorResponse {
  message?: string;
  stack?: any; // NOTE  Change Type
  statusCode?: number;
  status: string;
}

/* ----------------------------------------------------------*
                    Error class
*-----------------------------------------------------------*/
export class CustomError extends Error {
  statusCode: number;

  message: string;

  explicit: boolean;

  constructor(error: any) {
    // NOTE type of error
    super();
    this.explicit = true;
    this.statusCode = error.code || 500;
    this.message = error.message;
    if (!this.message) {
      if (this.statusCode === 500) {
        this.message = 'Internal Server error';
      } else {
        this.message = 'Some unknown error occured.';
      }
    }
  }
}

// NOTE type of error
export const handleError = (err: any, req: Request, res: Response) => {
  const { statusCode, message, stack } = err;
  const responseObject: ErrorResponse = { status: 'error', stack };

  /* ----------------------------------------------------------*
                    Message according to error
  *-----------------------------------------------------------*/
  switch (true) {
    case err.constructor.name === 'MongoError': {
      responseObject.message = 'Service Unavailable';
      responseObject.statusCode = 503;
      break;
    }
    case err.constructor.name === 'ValidationError': {
      responseObject.message = err.errors[0];
      responseObject.statusCode = 400;
      break;
    }
    case err.constructor.name === 'MulterError': {
      responseObject.message = err.message;
      responseObject.statusCode = 400;
      break;
    }
    case 'explicit' in err: {
      responseObject.message = message;
      responseObject.statusCode = statusCode;
      break;
    }
    default: {
      responseObject.message = 'Internal Server error';
      responseObject.statusCode = 500;
    }
  }
  /* ----------------------------------------------------------*
                    Include Stack if dev environment
  *-----------------------------------------------------------*/

  console.log('responseObject', responseObject);
  if (process.env.ENVIRONMENT !== 'production') {
    res.status(responseObject.statusCode || 500).json(responseObject);
  } else {
    const { ...prodResponseObject } = responseObject;
    res.status(prodResponseObject.statusCode || 500).json(prodResponseObject);
  }
};
