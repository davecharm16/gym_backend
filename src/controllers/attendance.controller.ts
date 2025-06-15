// src/controllers/attendanceController.ts
import { Request, Response } from 'express';
import supabase from '../supabase/client';
import { successResponse, errorResponse } from '../utils/response';

const calculateAge = (birthdate: string): number => {
  const birth = new Date(birthdate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export const getAttendanceLogs = async (req: Request, res: Response): Promise<void> => {
  const studentId = req.query.student_id as string | undefined;

  let query = supabase
    .from('student_checkins')
    .select(`
      id,
      student_id,
      checkin_time,
      created_at,
      students (
        first_name,
        last_name,
        email,
        address,
        birthdate,
        subscription_type_id
      )
    `)
    .order('checkin_time', { ascending: false });

  if (studentId) {
    query = query.eq('student_id', studentId);
  }

  const { data, error } = await query;

  if (error) {
    return errorResponse(res, 'Failed to retrieve attendance logs', error.message, 500);
  }

  const enrichedData = data.map((log: any) => {
    const student = log.students;

    return {
      ...log,
      students: {
        ...student,
        age: student?.birthdate ? calculateAge(student.birthdate) : null,
      },
    };
  });

  return successResponse(res, 'Attendance logs retrieved successfully', enrichedData);
};