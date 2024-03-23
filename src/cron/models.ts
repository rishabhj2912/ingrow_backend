import * as yup from 'yup';

export const generateCronRequestSchema = yup.object().shape({
  count: yup.number().required().positive().integer()
});
