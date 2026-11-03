import bcrypt from 'bcryptjs';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserByEmail } from '@/actions/get-user';

export const POST = async (req: Request) => {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return new NextResponse('Missing Fields', { status: 400 });
    }

    const existingEmail = await getUserByEmail(email);

    if (existingEmail) {
      return new NextResponse('Email exists', { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('[register] failed:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unexpected server error',
      },
      { status: 500 },
    );
  }
};
