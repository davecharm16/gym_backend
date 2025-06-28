import { Request, Response } from 'express';
import supabase from '../supabase/client';
import { successResponse, errorResponse } from '../utils/response';
import Joi from 'joi';

export const getStudents = async (req: Request, res: Response): Promise<void> => {
  const { subscription_type_name } = req.query;

  try {
    let subscriptionTypeId: string | undefined = undefined;

    // Step 1: If filtering by subscription name, get ID
    if (subscription_type_name && subscription_type_name !== 'all') {
      const { data: subTypeData, error: subTypeError } = await supabase
        .from('subscription_types')
        .select('id')
        .ilike('name', `${subscription_type_name}`);

      if (subTypeError) {
        return errorResponse(res, 'Failed to find subscription type', subTypeError.message, 500);
      }

      if (!subTypeData || subTypeData.length === 0) {
        return successResponse(res, 'No students found for given subscription type name', []);
      }

      subscriptionTypeId = subTypeData[0].id;
    }

    // Step 2: Query students with joins
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
        ),
        enrollments:enrollments (
          training:trainings (
            id,
            title,
            description
          )
        )
        users!inner(id)
      `)
      .eq('users.is_deleted', false);

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

  try {
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
        subscription_type:subscription_types!subscription_type_id (
          name
        ),
        enrollments:enrollments (
          training:trainings (
            id,
            title,
            description
          )
        )
        users!inner(id)
      `)
      .eq('id', id)
      .eq('users.is_deleted', false)
      .maybeSingle();

    if (error || !data) {
      return errorResponse(res, 'Student not found', error?.message || null, 404);
    }

    return successResponse(res, 'Student retrieved successfully', data);
  } catch (err) {
    return errorResponse(res, 'Server error', (err as Error).message, 500);
  }
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

export const softDeleteStudent = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  // 1. Get the student's user_id
  const { data: student, error: fetchError } = await supabase
    .from("students")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    errorResponse(res, "Failed to find student", fetchError.message, 500);
    return;
  }

  if (!student) {
    errorResponse(res, "Student not found", "No matching student", 404);
    return;
  }

  const userId = student.user_id;

  // 2. Soft delete the user
  const { error: softDeleteError } = await supabase
    .from("users")
    .update({ is_deleted: true })
    .eq("id", userId);

  if (softDeleteError) {
    errorResponse(res, "Failed to soft delete user", softDeleteError.message, 500);
    return;
  }

  successResponse(res, "Student soft deleted successfully");
};

