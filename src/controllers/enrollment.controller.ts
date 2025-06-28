import { Request, Response } from 'express';
import supabase from '../supabase/client';
import { successResponse, errorResponse } from '../utils/response';
import Joi from 'joi';

const enrollSchema = Joi.object({
  student: Joi.string().uuid().required(),
  trainings: Joi.array().items(Joi.string().uuid()).required(),
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
  if (error) {
    return errorResponse(res, 'Validation failed', error.details[0].message, 400);
  }

  const { student, trainings } = value;

  // Fetch current enrollments
  const { data: existingEnrollments, error: fetchError } = await supabase
    .from('enrollments')
    .select('training_id')
    .eq('student_id', student);

  if (fetchError) {
    return errorResponse(res, 'Failed to fetch existing enrollments', fetchError.message, 500);
  }

  const existingIds = new Set(existingEnrollments.map(e => e.training_id));
  const incomingIds = new Set(trainings);

  // Determine which to add
  const toAdd = trainings.filter((id: any) => !existingIds.has(id));
  const toRemove = [...existingIds].filter(id => !incomingIds.has(id));

  // Perform inserts
  let insertedData = [];
  if (toAdd.length > 0) {
    const records = toAdd.map((training_id: any) => ({
      student_id: student,
      training_id,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('enrollments')
      .insert(records)
      .select('*');

    if (insertError) {
      return errorResponse(res, 'Failed to enroll trainings', insertError.message, 500);
    }

    insertedData = inserted;
  }

  // Perform deletes
  if (toRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from('enrollments')
      .delete()
      .eq('student_id', student)
      .in('training_id', toRemove);

    if (deleteError) {
      return errorResponse(res, 'Failed to unenroll trainings', deleteError.message, 500);
    }
  }

  return successResponse(res, 'Enrollments updated successfully', {
    added: toAdd,
    removed: toRemove,
    inserted: insertedData,
  });
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