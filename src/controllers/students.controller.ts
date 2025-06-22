import { Request, Response } from 'express';
import supabase from '../supabase/client';
import { successResponse, errorResponse } from '../utils/response';
import Joi from 'joi';

export const getStudents = async (req: Request, res: Response): Promise<void> => {
  const { subscription_type_name } = req.query;

  try {
    let subscriptionTypeId: string | undefined = undefined;

    // Step 1: Get ID from subscription type name if filter is provided
    if (subscription_type_name) {
      const { data: subTypeData, error: subTypeError } = await supabase
        .from('subscription_types')
        .select('id')
        .ilike('name', `${subscription_type_name}`) // case-insensitive match

      if (subTypeError) {
        return errorResponse(res, 'Failed to find subscription type', subTypeError.message, 500);
      }

      if (!subTypeData || subTypeData.length === 0) {
        return successResponse(res, 'No students found for given subscription type name', []);
      }

      subscriptionTypeId = subTypeData[0].id;
    }

    // Step 2: Query students with optional filtering
    let query = supabase
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
        subscription_type:subscription_types!subscription_type_id (
          name
        )
      `);

    if (subscriptionTypeId) {
      query = query.eq('subscription_type_id', subscriptionTypeId);
    }

    const { data, error } = await query;

    if (error) {
      return errorResponse(res, 'Failed to fetch students', error.message, 500);
    }

    return successResponse(res, 'Students fetched successfully', data);
  } catch (err) {
    return errorResponse(res, 'Server error', err, 500);
  }
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
