import Joi from 'joi';

export const registerStudentSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('student').required(),
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  middle_name: Joi.string().optional().allow(null, ''),
  sex: Joi.string().valid('male', 'female', 'other').required(),
  address: Joi.string().required(),
  birthdate: Joi.date().iso().required(),
  enrollment_date: Joi.date().iso().required(),
  subscription_type_id: Joi.string().uuid().optional().allow(null, ''),
  picture_url: Joi.string().uri().optional().allow(null, ''),
});
