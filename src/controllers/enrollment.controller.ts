import { Request, Response } from 'express';
import supabase from '../supabase/client';
import { successResponse, errorResponse } from '../utils/response';
import Joi from 'joi';

const enrollSchema = Joi.object({
  student: Joi.string().uuid().required(),
  trainings: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

const unenrollSchema = Joi.object({
  student: Joi.string().uuid().required(),
  trainings: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

const isAdmin = (role: string | undefined) => role?.toLowerCase() === 'admin';

export const enrollTrainings = async (req: Request, res: Response): Promise<void> => {
  if (!isAdmin(req.user?.user_metadata?.role)) {
    return errorResponse(res, 'Forbidden', 'Only admins can enroll students', 403);
  }

  const { error, value } = enrollSchema.validate(req.body);
  if (error) return errorResponse(res, 'Validation failed', error.details[0].message, 400);

  const { student, trainings } = value;

  // Fetch existing training_ids
  const { data: existing, error: existingError } = await supabase
    .from('enrollments')
    .select('training_id')
    .eq('student_id', student);

  if (existingError) {
    return errorResponse(res, 'Failed to check existing enrollments', existingError.message, 500);
  }

  const alreadyEnrolledIds = new Set(existing.map(e => e.training_id));
  const newTrainingIds = trainings.filter((id: any) => !alreadyEnrolledIds.has(id));

  if (newTrainingIds.length === 0) {
    return successResponse(res, 'No new enrollments to process', []);
  }

  const records = newTrainingIds.map((training_id: string) => ({ student_id: student, training_id }));

  const { data, error: insertError } = await supabase.from('enrollments').insert(records).select('*');

  if (insertError) return errorResponse(res, 'Failed to enroll trainings', insertError.message, 500);

  return successResponse(res, 'Enrollments created successfully', data, 201);
};

export const getEnrollmentsByStudent = async (req: Request, res: Response): Promise<void> => {
  const { studentId } = req.params;

  const { data, error } = await supabase
    .from('enrollments')
    .select('*, trainings(*)')
    .eq('student_id', studentId)
    .order('enrolled_at', { ascending: false });

  if (error) return errorResponse(res, 'Failed to fetch enrollments', error.message, 500);

  return successResponse(res, 'Enrollments fetched successfully', data);
};

export const unenrollTrainings = async (req: Request, res: Response): Promise<void> => {
  if (!isAdmin(req.user?.user_metadata?.role)) {
    return errorResponse(res, 'Forbidden', 'Only admins can unenroll students', 403);
  }

  const { error, value } = unenrollSchema.validate(req.body);
  if (error) return errorResponse(res, 'Validation failed', error.details[0].message, 400);

  const { student, trainings } = value;

  const { error: deleteError } = await supabase
    .from('enrollments')
    .delete()
    .eq('student_id', student)
    .in('training_id', trainings);

  if (deleteError) return errorResponse(res, 'Failed to unenroll trainings', deleteError.message, 500);

  return successResponse(res, 'Unenrolled successfully');
};