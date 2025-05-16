import { Request, Response } from 'express';
import supabase from '../supabase/client';

interface RegisterRequestBody {
  email: string;
  password: string;
  role: 'Student' | 'Instructor' | 'Admin';
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

