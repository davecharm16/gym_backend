// src/validations/register.schema.ts
import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('student', 'instructor', 'admin').required(),

  // Conditional requirements based on role
  full_name: Joi.when('role', {
    is: 'admin',
    then: Joi.string().required().messages({
      'any.required': 'full_name is required for admin registration',
    }),
    otherwise: Joi.forbidden(),
  }),

  name: Joi.when('role', {
    is: 'instructor',
    then: Joi.string().required().messages({
      'any.required': 'name is required for instructor registration',
    }),
    otherwise: Joi.forbidden(),
  }),
});
