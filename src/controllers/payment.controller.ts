// src/controllers/paymentController.ts
import { Request, Response } from 'express';
import supabase from '../supabase/client';
import { successResponse, errorResponse } from '../utils/response';
import Joi from 'joi';
import { differenceInWeeks, differenceInMonths } from 'date-fns';

const createPaymentSchema = Joi.object({
  student_id: Joi.string().uuid().required(),
  amount: Joi.number().positive().required(),
  payment_type: Joi.string().required(), // allows any string
  payment_method: Joi.string().valid('cash', 'online').default('cash'),
  amount_to_pay: Joi.number().positive().required(),
});

const updatePaymentSchema = Joi.object({
  amount: Joi.number().positive().optional(),
  payment_method: Joi.string().valid('cash', 'online').optional(),
});

export const createPayment = async (req: Request, res: Response): Promise<void> => {
  const { error, value } = createPaymentSchema.validate(req.body);
  if (error) return errorResponse(res, 'Validation failed', error.details[0].message, 400);

  const { student_id, amount, payment_type, payment_method, amount_to_pay } = value;

  if (amount < amount_to_pay) {
    return errorResponse(res, 'Insufficient payment', 'Amount is less than the required fee.', 400);
  }

  const change = amount - amount_to_pay;

  try {
    const { data, error: insertError } = await supabase
      .from('payments')
      .insert([
        {
          student_id,
          amount,
          payment_type,
          payment_method,
          amount_to_pay,
          change,
        },
      ])
      .select('*')
      .single();

    if (insertError) return errorResponse(res, 'Failed to create payment', insertError.message, 500);

    return successResponse(res, 'Payment recorded successfully', data, 201);
  } catch (e) {
    return errorResponse(res, 'Server error', (e as Error).message, 500);
  }
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

export const getAllPaymentsWithStudent = async (req: Request, res: Response): Promise<void> => {
  const { start_date, end_date, payment_type, payment_method } = req.query;

  try {
    // Base query with joins
    let query = supabase
      .from('payments')
      .select(`
        id,
        amount,
        amount_to_pay,
        change,
        payment_type,
        payment_method,
        paid_at,
        student:students (
          id,
          first_name,
          middle_name,
          last_name,
          email,
          subscription_type:subscription_types (
            id,
            name
          )
        )
      `)
      .order('paid_at', { ascending: false });

    // Apply date range filter (handles same-day properly)
    if (start_date && end_date) {
      const isSameDay = start_date === end_date;

      const startDateISO = new Date(`${start_date}T00:00:00.000Z`).toISOString();
      const endDateISO = isSameDay
        ? new Date(`${end_date}T23:59:59.999Z`).toISOString()
        : new Date(`${end_date}T23:59:59.999Z`).toISOString();

      query = query.gte('paid_at', startDateISO).lte('paid_at', endDateISO);
    }

    // Apply optional filters
    if (payment_type && payment_type !== 'all') {
      query = query.eq('payment_type', payment_type as string);
    }

    if (payment_method && payment_method !== 'all') {
      query = query.eq('payment_method', payment_method as string);
    }

    const { data, error } = await query;

    if (error) return errorResponse(res, 'Failed to fetch payments', error.message, 500);

    // Defensive check
    const safeData = data || [];

    // Compute totals
    const total_amount = safeData.reduce((sum, item) => sum + Number(item.amount), 0);
    const total_amount_to_pay = safeData.reduce((sum, item) => sum + Number(item.amount_to_pay), 0);
    const total_change = safeData.reduce((sum, item) => sum + Number(item.change || 0), 0);

    return successResponse(res, 'Payments with student info fetched successfully', {
      records: safeData,
      summary: {
        total_amount,
        total_amount_to_pay,
        total_change,
      },
    });
  } catch (e) {
    return errorResponse(res, 'Server error', (e as Error).message, 500);
  }
};


export const getPaymentAverages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('amount_to_pay, paid_at');

    if (error) {
      return errorResponse(res, 'Failed to fetch payments', error.message, 500);
    }

    if (!data || data.length === 0) {
      return successResponse(res, 'No payment data found', {
        average_per_week: 0,
        average_per_month: 0,
      });
    }

    // Total amount and date range
    const totalAmount = data.reduce((sum, payment) => sum + Number(payment.amount_to_pay), 0);

    const dates = data.map(p => new Date(p.paid_at));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    const weeks = Math.max(differenceInWeeks(maxDate, minDate) || 1, 1);
    const months = Math.max(differenceInMonths(maxDate, minDate) || 1, 1);

    const averagePerWeek = totalAmount / weeks;
    const averagePerMonth = totalAmount / months;

    return successResponse(res, 'Payment averages calculated successfully', {
      average_per_week: Number(averagePerWeek.toFixed(2)),
      average_per_month: Number(averagePerMonth.toFixed(2)),
    });
  } catch (err) {
    return errorResponse(res, 'Server error', (err as Error).message, 500);
  }
};
