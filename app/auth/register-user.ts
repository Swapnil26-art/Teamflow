'use server';

import bcrypt from 'bcryptjs';

import { db } from '@/lib/db';
import { getUserByEmail } from '@/actions/get-user';

interface UserDetails {
  name: string;
  email: string;
  password: string;
}

export const registerUser = async ({ name, email, password }: UserDetails) => {
  if (!name || !email || !password) {
    throw new Error('Missing fields.');
  }

  const existingEmail = await getUserByEmail(email);

  if (existingEmail) {
    throw new Error('Email already exists.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return { success: true };
};
