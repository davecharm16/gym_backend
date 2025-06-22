import { Request, Response } from 'express';
import supabase from '../supabase/client';
import { successResponse, errorResponse } from '../utils/response';

export const getTotalRegisteredStudents = async (req: Request, res: Response): Promise<void> => {
  const subscriptionTypeName = (req.query.subscription_type_name as string)?.toLowerCase() || 'all';

  try {
    let subscriptionTypeId: string | undefined;

    if (subscriptionTypeName !== 'all') {
      // Find the ID of the subscription type
      const { data: subTypeData, error: subTypeError } = await supabase
        .from('subscription_types')
        .select('id')
        .ilike('name', subscriptionTypeName);

      if (subTypeError) {
        return errorResponse(res, 'Failed to fetch subscription type', subTypeError.message, 500);
      }

      if (!subTypeData || subTypeData.length === 0) {
        return successResponse(res, 'No students found for given subscription type', {
          total_registered: 0,
          filtered_by: subscriptionTypeName,
        });
      }

      subscriptionTypeId = subTypeData[0].id;
    }

    // Query to count students
    let query = supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    if (subscriptionTypeId) {
      query = query.eq('subscription_type_id', subscriptionTypeId);
    }

    const { count, error } = await query;

    if (error) {
      return errorResponse(res, 'Failed to count students', error.message, 500);
    }

    return successResponse(res, 'Total registered students fetched successfully', {
      total_registered: count || 0,
      filtered_by: subscriptionTypeName,
    });
  } catch (err) {
    return errorResponse(res, 'Server error', err, 500);
  }
};