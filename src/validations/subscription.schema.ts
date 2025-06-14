import Joi from 'joi';

export const createSubscriptionSchema = Joi.object({
  name: Joi.string().valid('monthly', 'per_session').required(),
  amount: Joi.number().positive().required()
});
