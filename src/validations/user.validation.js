import Joi from 'joi';

const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .email()
    .lowercase()
    .required(),
  password: Joi.string()
    .trim()
    .required()
});

const registerSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(3)
    .required(), 
  lastName: Joi.string()
    .trim()
    .min(3)
    .required(),
  username: Joi.string()
    .trim()
    .min(3)
    .required(),
  bio: Joi.string()
    .trim()
    .min(3),
  email: Joi.string()
    .trim()
    .email()
    .lowercase()
    .required(),
  password: Joi.string()
    .trim()
    .min(8)
    .required(),
  confirmPassword: Joi.string()
    .trim()
    .valid(Joi.ref('password'))
    .required()
});

const updateSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(3)
    .required(), 
  lastName: Joi.string()
    .trim()
    .min(3)
    .required(), 
  username: Joi.string()
    .trim()
    .min(3)
    .required(),
  bio: Joi.string()
    .trim()
    .min(3),
  email: Joi.string()
    .trim()
    .email()
    .lowercase()
    .required()
});

const updatePasswordSchema = Joi.object({
  oldPassword: Joi.string()
    .trim(),
  password: Joi.string()
    .trim()
    .min(8)
    .required(),
  confirmPassword: Joi.string()
    .trim()
    .valid(Joi.ref('password'))
    .required()
});

export {
  loginSchema,
  registerSchema,
  updateSchema,
  updatePasswordSchema
}