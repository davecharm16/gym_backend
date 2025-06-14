import Joi from 'joi';

export const createTrainingSchema = Joi.object({
  title: Joi.string().min(3).required(),
  description: Joi.string().allow('', null),
  instructor_id: Joi.string().uuid().allow(null),
  base_fee: Joi.number().positive().required(),
});

export const updateTrainingSchema = Joi.object({
  title: Joi.string().min(3),
  description: Joi.string().allow('', null),
  instructor_id: Joi.string().uuid().allow(null),
  base_fee: Joi.number().positive(),
});

