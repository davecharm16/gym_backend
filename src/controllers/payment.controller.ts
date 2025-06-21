// src/controllers/paymentController.ts
import { Request, Response } from 'express';
import supabase from '../supabase/client';
import { successResponse, errorResponse } from '../utils/response';
import Joi from 'joi';

const createPaymentSchema = Joi.object({
  student_id: Joi.string().uuid().required(),
  amount: Joi.number().positive().required(),
  payment_type: Joi.string().valid('subscription', 'training_fee').required(),
  training_id: Joi.string().uuid().optional().allow(null),
  payment_method: Joi.string().valid('cash', 'online').default('cash'),
});

const updatePaymentSchema = Joi.object({
  amount: Joi.number().positive().optional(),
  payment_method: Joi.string().valid('cash', 'online').optional(),
});

export const createPayment = async (req: Request, res: Response): Promise<void> => {
  const { error, value } = createPaymentSchema.validate(req.body);
  if (error) return errorResponse(res, 'Validation failed', error.details[0].message, 400);

  const { data, error: insertError } = await supabase
    .from('payments')
    .insert([value])
    .select('*')
    .single();

  if (insertError) return errorResponse(res, 'Failed to create payment', insertError.message, 500);

  return successResponse(res, 'Payment recorded successfully', data, 201);
};

export const getPaymentsByStudent = async (req: Request, res: Response): Promise<void> => {
  const { studentId } = req.params;

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('student_id', studentId)
    .order('paid_at', { ascending: false });

  if (error) return errorResponse(res, 'Failed to fetch payments', error.message, 500);

  return successResponse(res, 'Payments retrieved successfully', data);
};

export const updatePayment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { error, value } = updatePaymentSchema.validate(req.body);
  if (error) return errorResponse(res, 'Validation failed', error.details[0].message, 400);

  const { data, error: updateError } = await supabase
    .from('payments')
    .update(value)
    .eq('id', id)
    .select('*')
    .single();

  if (updateError) return errorResponse(res, 'Failed to update payment', updateError.message, 500);

  return successResponse(res, 'Payment updated successfully', data);
};

export const deletePayment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const { error } = await supabase.from('payments').delete().eq('id', id);

  if (error) return errorResponse(res, 'Failed to delete payment', error.message, 500);

  return successResponse(res, 'Payment deleted successfully');
};
