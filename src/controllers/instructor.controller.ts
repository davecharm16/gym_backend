import { Request, Response } from 'express';
import supabase from '../supabase/client';
import { successResponse, errorResponse } from '../utils/response';
import Joi from 'joi';

const instructorSchema = Joi.object({
  name: Joi.string().min(3).required(),
});

const updateSchema = Joi.object({
  name: Joi.string().min(3).optional(),
});

export const createInstructor = async (req: Request, res: Response): Promise<void> => {
  const { error, value } = instructorSchema.validate(req.body);
  if (error) return errorResponse(res, 'Validation failed', error.details[0].message, 400);

  const user_id = req.user?.id;
  if (!user_id) return errorResponse(res, 'Unauthorized', 'User ID missing from context', 401);

  const { name } = value;

  const { data, error: insertError } = await supabase
    .from('instructors')
    .insert([{ user_id, name }])
    .select('*')
    .single();

  if (insertError) return errorResponse(res, 'Failed to create instructor', insertError.message, 500);

  return successResponse(res, 'Instructor created successfully', data, 201);
};

export const getAllInstructors = async (_req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase.from('instructors').select('*').order('created_at', { ascending: false });

  if (error) return errorResponse(res, 'Failed to fetch instructors', error.message, 500);

  return successResponse(res, 'Instructors fetched successfully', data);
};

export const getInstructorById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const { data, error } = await supabase.from('instructors').select('*').eq('id', id).single();

  if (error || !data) return errorResponse(res, 'Instructor not found', error?.message || '', 404);

  return successResponse(res, 'Instructor fetched successfully', data);
};

export const updateInstructor = async (req: Request, res: Response): Promise<void> => {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return errorResponse(res, 'Validation failed', error.details[0].message, 400);

  const { id } = req.params;

  const { error: updateError } = await supabase.from('instructors').update(value).eq('id', id);

  if (updateError) return errorResponse(res, 'Failed to update instructor', updateError.message, 500);

  const { data, error: fetchError } = await supabase.from('instructors').select('*').eq('id', id).single();

  if (fetchError) return errorResponse(res, 'Instructor updated but failed to retrieve updated record', fetchError.message, 500);

  return successResponse(res, 'Instructor updated successfully', data);
};


export const deleteInstructor = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const { error } = await supabase.from('instructors').delete().eq('id', id);

  if (error) return errorResponse(res, 'Failed to delete instructor', error.message, 500);

  return successResponse(res, 'Instructor deleted successfully');
};