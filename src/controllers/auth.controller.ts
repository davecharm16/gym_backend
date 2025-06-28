import { Request, Response } from 'express';
import supabase from '../supabase/client';
import { registerStudentSchema } from '../validations/registerStudent.schema';
import { successResponse, errorResponse } from '../utils/response';
import { registerSchema } from '../validations/register.schema';


interface RegisterRequestBody {
  email: string;
  password: string;
  role: 'student' | 'instructor' | 'admin';
  full_name?: string; // used for admin
  name?: string; // used for instructor
}
export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { error: validationError, value } = registerSchema.validate(req.body);

  if (validationError) {
    return errorResponse(res, 'Validation failed', validationError.details[0].message, 400);
  }

  const { email, password, role, full_name, name } = value;

  console.log('Registering user:', email, role);

  // 1. Create Supabase Auth user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { role, email_verified: true },
    email_confirm: true,
  });

  if (error || !data?.user) {
    return errorResponse(res, 'User registration failed', error?.message, 400);
  }

  const user_id = data.user.id;

  // 2. Insert into users table
  const { error: userInsertError } = await supabase.from('users').insert([
    {
      id: user_id,
      email,
      role,
      is_active: true,
    },
  ]);

  if (userInsertError) {
    return errorResponse(res, 'Failed to insert user', userInsertError.message, 500);
  }

  // 3. Insert into role-specific table
  if (role === 'admin') {
    const { error: adminInsertError } = await supabase.from('admins').insert([
      {
        id: user_id,
        full_name,
        super_admin: false,
      },
    ]);

    if (adminInsertError) {
      return errorResponse(res, 'Failed to insert into admins table', adminInsertError.message, 500);
    }
  }

  if (role === 'instructor') {
    const { error: instructorInsertError } = await supabase.from('instructors').insert([
      {
        user_id,
        name,
      },
    ]);

    if (instructorInsertError) {
      return errorResponse(res, 'Failed to insert into instructors table', instructorInsertError.message, 500);
    }
  }

  return successResponse(
    res,
    'User registered successfully',
    {
      id: user_id,
      email,
      role,
    },
    201
  );
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

  // Soft delete check
  const { data: userRecord, error: userRecordError } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .eq('is_deleted', false)
    .maybeSingle();

  if (userRecordError) {
    errorResponse(res, 'Error verifying account status', userRecordError.message, 500);
    return;
  }

  if (!userRecord) {
    errorResponse(res, 'Account has been deleted or disabled', 'Account is no longer active', 403);
    return;
  }

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