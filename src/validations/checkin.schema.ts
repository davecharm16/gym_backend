import Joi from 'joi';

export const checkinSchema = Joi.object({
  student_email: Joi.string().email().required(),
  checkin_time: Joi.date().iso().optional()
});