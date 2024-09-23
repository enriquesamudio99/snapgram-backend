import Joi from 'joi';

const postSchema = Joi.object({
  caption: Joi.string()
    .trim()
    .min(3)
    .required(),
  images: Joi.array()
    .min(1)
    .max(10),
  location: Joi.string()
    .trim()
    .min(1)
    .required(),
  tags: Joi.string(),
  imagesToRemove: Joi.array()
});

export {
  postSchema,
}