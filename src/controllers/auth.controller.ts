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

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { role },
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
