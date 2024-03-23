export const TOO_MANY_REQUESTS_ERROR = {
  error: 'Too Many Request, Please try after some time!'
};

export const SERVER_ERROR = { code: 500, message: 'Internal Server error' };

export const UNAUTHORIZED_ERROR = {
  code: 401,
  message: "Stop! Unautorized access, You can't proceed further"
};

export const UNAUTHORIZED_ERROR_LINKEDIN = {
  code: 403,
  message: 'Unable to access linkedin account, please re-login and sync!'
};

export const EMAIL_NOT_VERIFIED = {
  code: 403,
  message: 'The given account does not have a verified email'
};
