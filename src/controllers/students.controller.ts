import { Request, Response } from 'express';
import supabase from '../supabase/client';
import { successResponse, errorResponse } from '../utils/response';

export const getStudents = async (req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('students')
    .select(`
      id,
      email,
      first_name,
      last_name,
      middle_name,
      sex,
      address,
      birthdate,
      enrollment_date,
      picture_url,
      subscription_type_id,
      created_at,
      subscription_types (
        id,
        name,
        monthly_fee
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return errorResponse(res, 'Failed to retrieve students', error.message, 500);
  }

  return successResponse(res, 'Students retrieved successfully', data);
};

export const getStudentById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('students')
    .select(`
      id,
      email,
      first_name,
      last_name,
      middle_name,
      sex,
      address,
      birthdate,
      enrollment_date,
      picture_url,
      subscription_type_id,
      created_at, 
      subscription_types (
        id,
        name,
        monthly_fee
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    return errorResponse(res, 'Student not found', error?.message || null, 404);
  }

  return successResponse(res, 'Student retrieved successfully', data);
};
