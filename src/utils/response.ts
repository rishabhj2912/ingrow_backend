interface Response {
  status: string;
  statusCode: number;
  message: string;
  data?: any;
}

export const generateResponse = (
  statusCode: number,
  message: string,
  data: any = null
): Response => {
  return {
    status: 'success',
    statusCode,
    message,
    data
  };
};

export const generateErrorMessage = (customError: any): Response => {
  const errorResponse = {
    status: 'error',
    statusCode: customError.code,
    message: customError.message
  };
  return errorResponse;
};
