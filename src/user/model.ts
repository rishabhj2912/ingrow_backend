import * as yup from 'yup';

export const loginRequestSchema = yup.object().shape({
  code: yup.string().trim().required()
});

export const updateExtensionStatusRequestSchema = yup.object().shape({
  status: yup.string().required().oneOf(['true', 'false']).trim()
});

export const commentOnPostRequestSchema = yup.object().shape({
  comment: yup.string().required().trim(),
  postUrn: yup.string().required().trim()
});

export const personaSyncRequestSchema = yup.object().shape({
  role: yup.string().required().trim(),
  objective: yup.string().required().trim(),
  includeHastags: yup.boolean().required().nonNullable(),
  includeEmojis: yup.boolean().required().nonNullable(),
  brief: yup.string().required().trim(),
  tone: yup.string().required().trim(),
  characters: yup.array().of(yup.string().required()).required()
});

export type PeronaDetails = yup.InferType<typeof personaSyncRequestSchema>;

export const refreshCommentRequestSchema = yup.object().shape({
  postUrn: yup.string().required().trim(),
  category: yup.string().required().trim()
});
