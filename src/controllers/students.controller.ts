import { Request, Response } from 'express';
import supabase from '../supabase/client';
import { successResponse, errorResponse } from '../utils/response';
import Joi from 'joi';



export const getStudents = async (req: Request, res: Response): Promise<void> => {
  const search = req.query.search as string | undefined;

  let query = supabase
    .from('student_with_subscription_details')
    .select('*, enrollments(*, trainings(*))')
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return errorResponse(res, 'Failed to retrieve students', error.message, 500);
  }

  return successResponse(res, 'Students retrieved successfully', data);
};


export const getStudentById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('student_with_subscription_details')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return errorResponse(res, 'Student not found', error?.message || null, 404);
  }

  return successResponse(res, 'Student retrieved successfully', data);
};



export const updateStudent = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const schema = Joi.object({
    first_name: Joi.string().optional(),
    last_name: Joi.string().optional(),
    middle_name: Joi.string().allow(null).optional(),
    address: Joi.string().optional(),
    birthdate: Joi.date().optional(),
    sex: Joi.string().valid('male', 'female', 'other').optional(),
    subscription_type_id: Joi.string().uuid().allow(null).optional(),
    picture_url: Joi.string().uri().allow(null).optional(),
    paid_until: Joi.date().optional()
  });

  const { error: validationError, value } = schema.validate(req.body);
  if (validationError) {
    return errorResponse(res, 'Validation error', validationError.details[0].message, 400);
  }

  const { id } = req.params;
  const { error: updateError } = await supabase
    .from('students')
    .update(value)
    .eq('id', id);

  if (updateError) {
    return errorResponse(res, 'Failed to update student', updateError.message, 500);
  }

  return successResponse(res, 'Student updated successfully', null);
};

export const deleteStudent = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const { id } = req.params;

  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);

  if (error) {
    return errorResponse(res, 'Failed to delete student', error.message, 500);
  }

  return successResponse(res, 'Student deleted successfully', null);
};
