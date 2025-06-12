import { Request, Response } from 'express';
import { checkinSchema } from '../validations/checkin.schema';
import supabase from '../supabase/client';
import { successResponse, errorResponse } from '../utils/response';

export const createCheckin = async (req: Request, res: Response) => {
  const { error: validationError, value } = checkinSchema.validate(req.body);

  if (validationError) {
    errorResponse(res, 'Validation error', validationError.details[0].message, 400);
    return;
  }

  const { student_email, checkin_time } = value;

  // Step 1: Fetch user by email
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, role')
    .eq('email', student_email)
    .single();

  if (userError || !user) {
    errorResponse(res, 'User not found', userError?.message || null, 404);
    return;
  }

  if (user.role !== 'student') {
    errorResponse(res, 'Only students are allowed to check in', null, 403);
    return;
  }

  // Step 2: Fetch matching student record
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id')
    .eq('email', student_email)
    .single();

  if (studentError || !student) {
    errorResponse(res, 'Student profile not found', studentError?.message || null, 404);
    return;
  }

  const student_id = student.id;

  // Step 3: Insert check-in record
  const { data, error } = await supabase.from('student_checkins').insert([
    {
      student_id,
      checkin_time: checkin_time
        ? new Date(checkin_time).toISOString()
        : new Date().toISOString(),
    },
  ]);

  if (error) {
    errorResponse(res, 'Failed to record check-in', error.message, 500);
    return;
  }

  successResponse(res, 'Check-in successful', data, 201);
  return;
};
