import Joi from 'joi';

const communitySchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(4)
    .required(),
  username: Joi.string()
    .trim()
    .min(4)
    .required(),
  image: Joi.array()
    .min(1)
    .max(1),
  bio: Joi.string()
    .trim()
    .min(4),
  communityType: Joi.string()
    .valid("Private", "Public")
    .required(),
  removeProfileImg: Joi.string()
});

export {
  communitySchema,
}