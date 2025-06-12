import { Request, Response } from 'express';
import { checkinSchema } from '../validations/checkin.schema';
import supabase from '../supabase/client';

export const createCheckin = async (req: Request, res: Response) => {
  const { error: validationError, value } = checkinSchema.validate(req.body);

  if (validationError) {
    res.status(400).json({ error: validationError.details[0].message });
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
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (user.role !== 'student') {
    res.status(403).json({ error: 'Only students are allowed to check in' });
    return;
  }

  // Step 2: Fetch matching student record
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id')
    .eq('email', student_email)
    .single();

  if (studentError || !student) {
    res.status(404).json({ error: 'Student profile not found' });
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
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json({ message: 'Check-in successful', data });
  return;
};
