import { Request, Response } from 'express';
import supabase from '../supabase/client';
import { registerStudentSchema } from '../validations/registerStudent.schema';
import { successResponse, errorResponse } from '../utils/response';

interface RegisterRequestBody {
  email: string;
  password: string;
  role: 'student' | 'instructor' | 'admin';
}

export const register = async (
  req: Request<{}, {}, RegisterRequestBody>,
  res: Response
): Promise<void> => {
  const { email, password, role } = req.body;
  console.log('Registering user:', email, role);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { role, email_verified: true },
    email_confirm: true,
  });

  if (error) {
    errorResponse(res, 'User registration failed', error.message, 400);
    return;
  }

  successResponse(res, 'User registered successfully', { user: data.user }, 201);
  return;
};

export const getUserById = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  const { data, error } = await supabase.auth.admin.getUserById(id);

  if (error) {
    errorResponse(res, 'Failed to retrieve user', error.message, 400);
    return;
  }

  successResponse(res, 'User retrieved successfully', { user: data.user });
  return;
};

interface LoginRequestBody {
  email: string;
  password: string;
}

export const login = async (
  req: Request<{}, {}, LoginRequestBody>,
  res: Response
): Promise<void> => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    errorResponse(res, 'Invalid login credentials', error?.message, 401);
    return;
  }

  const { access_token, refresh_token, user } = data.session;

  successResponse(res, 'Login successful', {
    token: access_token,
    refresh_token,
    user: {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role,
    },
  });
  return;
};

export const registerStudent = async (req: Request, res: Response): Promise<void> => {
  const { error: validationError, value } = registerStudentSchema.validate(req.body);

  if (validationError) {
    errorResponse(res, 'Validation error', validationError.details[0].message, 400);
    return;
  }

  const {
    email,
    password,
    role,
    first_name,
    last_name,
    middle_name,
    sex,
    address,
    birthdate,
    enrollment_date,
    subscription_type_id,
    picture_url,
  } = value;

  // Step 1: Create Supabase Auth User
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { role, email_verified: true },
    email_confirm: true,
  });

  if (authError || !authUser?.user?.id) {
    errorResponse(res, 'User creation failed', authError?.message, 400);
    return;
  }

  const user_id = authUser.user.id;

  // Step 2: Insert into users table
  const { error: insertUserError } = await supabase.from('users').insert([
    {
      id: user_id,
      email,
      role,
      is_active: true,
    },
  ]);

  if (insertUserError) {
    errorResponse(res, 'Failed to insert into users table', insertUserError.message, 500);
    return;
  }

  // Step 3: Calculate paid_until (+30 days from today)
  const now = new Date();
  const paidUntil = new Date(now);
  paidUntil.setDate(now.getDate() + 30);

  // Step 4: Insert into students table
  const { error: insertStudentError } = await supabase.from('students').insert([
    {
      user_id,
      email,
      first_name,
      last_name,
      middle_name: middle_name || null,
      sex,
      address,
      birthdate,
      enrollment_date,
      subscription_type_id: subscription_type_id || null,
      picture_url: picture_url || null,
      paid_until: paidUntil.toISOString(),
    },
  ]);

  if (insertStudentError) {
    errorResponse(res, 'Failed to insert into students table', insertStudentError.message, 500);
    return;
  }

  successResponse(
    res,
    'Student registered successfully',
    {
      id: user_id,
      email,
      role,
      paid_until: paidUntil.toISOString(),
    },
    201
  );
  return;
};