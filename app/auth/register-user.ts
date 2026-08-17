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
<<<<<<< HEAD
=======
  const hashedPassword = await bcrypt.hash(password, 10);

>>>>>>> 7de1e5e165c9359a96fc1fe487ab1261117b1460
  if (!name || !email || !password) {
    throw new Error('Missing fields.');
  }

  const existingEmail = await getUserByEmail(email);

  if (existingEmail) {
    throw new Error('Email already exists.');
  }

<<<<<<< HEAD
  const hashedPassword = await bcrypt.hash(password, 10);

=======
>>>>>>> 7de1e5e165c9359a96fc1fe487ab1261117b1460
  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return { success: true };
};
