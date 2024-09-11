import Joi from 'joi';

const commentSchema = Joi.object({
  content: Joi.string()
    .trim()
    .min(4)
    .required()
});

export {
  commentSchema,
}