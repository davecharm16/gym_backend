// src/controllers/profileController.ts
import { Request, Response } from 'express';
import supabase from '../supabase/client';
import { successResponse, errorResponse } from '../utils/response';
export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  const user = req.user;

  if (!user || !user.id || !user.user_metadata?.role) {
    return errorResponse(res, 'Unauthorized', 'Missing user context', 401);
  }

  const role = user.user_metadata.role.toLowerCase();

  try {
    switch (role) {
      case 'student': {
        const { data, error } = await supabase
          .from('students')
          .select(`
            id,
            first_name,
            middle_name,
            last_name,
            email,
            address,
            birthdate,
            subscription_type_id,
            paid_until,
            created_at,
            enrollments:enrollments (
              training:trainings (
                id,
                title,
                description,
                base_fee,
                instructor_id
              )
            )
          `)
          .eq('user_id', user.id)
          .single();
      
        if (error) throw error;
      
        return successResponse(res, 'User profile retrieved successfully', {
          ...data,
          trainings: data.enrollments?.map((e: any) => e.training),
          role: 'student',
        });
      
      }

      case 'instructor': {
        const { data, error } = await supabase
          .from('instructors')
          .select('id, name, created_at')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        return successResponse(res, 'User profile retrieved successfully', {
          ...data,
          role: 'instructor',
        });
      }

      case 'admin': {
        const { data, error } = await supabase
          .from('admins')
          .select('id, full_name, super_admin, created_at')
          .eq('id', user.id) // note: admin's `id` is user_id
          .single();

        if (error) throw error;

        return successResponse(res, 'User profile retrieved successfully', {
          ...data,
          role: 'admin',
        });
      }

      default:
        return errorResponse(res, 'Unsupported role', `Unknown role: ${role}`, 400);
    }
  } catch (err: any) {
    return errorResponse(res, 'Failed to retrieve profile', err.message, 500);
  }
};

