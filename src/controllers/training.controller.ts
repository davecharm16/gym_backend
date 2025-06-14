import { Request, Response } from 'express';
import supabase from '../supabase/client';
import { successResponse, errorResponse } from '../utils/response';
import { createTrainingSchema, updateTrainingSchema } from '../validations/training.schema';

export const createTraining = async (req: Request, res: Response): Promise<void> => {
  const { error, value } = createTrainingSchema.validate(req.body);
  if (error) return errorResponse(res, 'Validation failed', error.details[0].message, 400);

  const { title, description, instructor_id, base_fee } = value;

  const { data, error: insertError } = await supabase.from('trainings').insert([
    { title, description, instructor_id, base_fee },
  ]).select('*').single();

  if (insertError) return errorResponse(res, 'Failed to create training', insertError.message, 500);

  return successResponse(res, 'Training created successfully', data, 201);
};

export const getAllTrainings = async (_req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('trainings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return errorResponse(res, 'Failed to retrieve trainings', error.message, 500);

  return successResponse(res, 'Trainings retrieved successfully', data);
};

export const getTrainingById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const { data, error } = await supabase.from('trainings').select('*').eq('id', id).single();

  if (error || !data) return errorResponse(res, 'Training not found', error?.message || '', 404);

  return successResponse(res, 'Training retrieved successfully', data);
};

export const updateTraining = async (req: Request, res: Response): Promise<void> => {
  const { error, value } = updateTrainingSchema.validate(req.body);
  if (error) return errorResponse(res, 'Validation failed', error.details[0].message, 400);

  const { id } = req.params;

  const { error: updateError } = await supabase.from('trainings').update(value).eq('id', id);

  if (updateError) return errorResponse(res, 'Failed to update training', updateError.message, 500);

  return successResponse(res, 'Training updated successfully', null);
};

export const deleteTraining = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const { error } = await supabase.from('trainings').delete().eq('id', id);

  if (error) return errorResponse(res, 'Failed to delete training', error.message, 500);

  return successResponse(res, 'Training deleted successfully', null);
};
