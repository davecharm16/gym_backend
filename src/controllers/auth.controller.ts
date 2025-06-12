import { Request, Response } from 'express';
import supabase from '../supabase/client';
import { registerStudentSchema } from '../validations/registerStudent.schema';

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
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(201).json({ user: data.user });
  return;
};

export const getUserById = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  const { data, error } = await supabase.auth.admin.getUserById(id);

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(200).json({ user: data.user });
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
    res.status(401).json({ error: error?.message });
    return;
  }

  const { access_token, refresh_token, user } = data.session;

  res.status(200).json({
    token: access_token,
    refresh_token,
    user: {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role,
    },
  });
};

export const registerStudent = async (req: Request, res: Response): Promise<void> => {
  const { error: validationError, value } = registerStudentSchema.validate(req.body);

  if (validationError) {
    res.status(400).json({ error: validationError.details[0].message });
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
    res.status(400).json({ error: authError?.message || 'User creation failed.' });
    return;
  }

  const user_id = authUser.user.id;

  // Step 2: Insert into custom `users` table
  const { error: insertUserError } = await supabase.from('users').insert([
    {
      id: user_id,
      email,
      role,
      is_active: true,
    },
  ]);

  if (insertUserError) {
    res.status(500).json({ error: insertUserError.message });
    return;
  }

  // Step 3: Insert into `students` table
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
    },
  ]);

  if (insertStudentError) {
    res.status(500).json({ error: insertStudentError.message });
    return;
  }

  res.status(201).json({
    message: 'Student registered successfully',
    user: {
      id: user_id,
      email,
      role,
    },
  });
  return;
};