// src/controllers/subscriptionController.ts
import { Request, Response } from 'express';
import supabase from '../supabase/client';
import { successResponse, errorResponse } from '../utils/response';
import Joi from 'joi';

const createSubscriptionSchema = Joi.object({
  name: Joi.string().min(3).required(),
  amount: Joi.number().positive().required(),
});

export const createSubscription = async (req: Request, res: Response): Promise<void> => {
  const { error: validationError, value } = createSubscriptionSchema.validate(req.body);
  if (validationError) {
    return errorResponse(res, 'Validation failed', validationError.details[0].message, 400);
  }

  const userId = (req as any).user?.id;
  if (!userId) {
    return errorResponse(res, 'Unauthorized', 'No user ID in token', 401);
  }

  // Check if user is an admin
  const { data: adminRecord, error: adminError } = await supabase
    .from('admins')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (adminError || !adminRecord) {
    return errorResponse(res, 'Only admins can create subscription types', adminError?.message ?? 'Admin not found', 403);
  }

  const { name, amount } = value;

  // Check for duplicate name
  const { data: existing, error: checkError } = await supabase
    .from('subscription_types')
    .select('id')
    .eq('name', name)
    .maybeSingle();

  if (checkError) {
    return errorResponse(res, 'Error checking existing subscription', checkError.message, 500);
  }

  if (existing) {
    return errorResponse(res, 'Subscription type already exists', `The name "${name}" is already in use.`, 400);
  }

  // Create subscription type
  const { data: typeData, error: typeError } = await supabase
    .from('subscription_types')
    .insert([{ name, created_by: userId }])
    .select('id')
    .single();

  if (typeError || !typeData?.id) {
    return errorResponse(res, 'Failed to create subscription type', typeError?.message, 500);
  }

  const { error: feeError } = await supabase.from('subscription_fees').insert([
    {
      subscription_type_id: typeData.id,
      amount,
    },
  ]);

  if (feeError) {
    return errorResponse(res, 'Subscription type created, but failed to insert fee', feeError.message, 500);
  }

  return successResponse(res, 'Subscription type created successfully', {
    id: typeData.id,
    name,
    amount,
  }, 201);
};

export const getAllSubscriptions = async (_req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('subscription_types')
    .select(`
      id,
      name,
      created_at,
      subscription_fees (
        amount
      )
    `)
    .order('created_at', { ascending: false });

  if (error) return errorResponse(res, 'Failed to fetch subscriptions', error.message, 500);
  return successResponse(res, 'Subscriptions retrieved successfully', data);
};

export const getSubscriptionById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('subscription_types')
    .select(`
      id,
      name,
      created_at,
      subscription_fees (
        amount
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    return errorResponse(res, 'Subscription not found', error?.message || null, 404);
  }

  return successResponse(res, 'Subscription retrieved successfully', data);
};

export const updateSubscription = async (req: Request, res: Response): Promise<void> => {
  const schema = Joi.object({
    name: Joi.string().min(3).optional(),
    amount: Joi.number().positive().optional(),
  });

  const { error: validationError, value } = schema.validate(req.body);
  if (validationError) {
    return errorResponse(res, 'Validation failed', validationError.details[0].message, 400);
  }

  const { id } = req.params;

  if (value.name) {
    const { error } = await supabase
      .from('subscription_types')
      .update({ name: value.name })
      .eq('id', id);

    if (error) {
      return errorResponse(res, 'Failed to update subscription name', error.message, 500);
    }
  }

  if (value.amount) {
    const { error } = await supabase
      .from('subscription_fees')
      .update({ amount: value.amount })
      .eq('subscription_type_id', id);

    if (error) {
      return errorResponse(res, 'Failed to update subscription fee', error.message, 500);
    }
  }

  return successResponse(res, 'Subscription updated successfully', null);
};

export const deleteSubscription = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Check if used by any student
  const { count, error: countError } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('subscription_type_id', id);

  if (countError) {
    return errorResponse(res, 'Failed to validate subscription usage', countError.message, 500);
  }

  if (count && count > 0) {
    return errorResponse(res, 'Cannot delete subscription type', 'It is currently used by one or more students', 400);
  }

  await supabase.from('subscription_fees').delete().eq('subscription_type_id', id);
  const { error: typeError } = await supabase.from('subscription_types').delete().eq('id', id);

  if (typeError) {
    return errorResponse(res, 'Failed to delete subscription type', typeError.message, 500);
  }

  return successResponse(res, 'Subscription deleted successfully', null);
};
