import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: { taskId: string; subtaskId: string } },
) {
  try {
    if (!params.taskId || !params.subtaskId) {
      return new NextResponse('Task Id and Subtask Id is required', {
        status: 400,
      });
    }

    const session = await auth();

    if (!session || !session.user) {
      return new NextResponse('Unauthenticated', { status: 403 });
    }

    const existing = await db.subtask.findUnique({
      where: { id: params.subtaskId },
      select: { userId: true },
    });

    if (!existing || existing.userId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const { name, isComplete } = await req.json();

    const subtask = await db.subtask.update({
      where: {
        id: params.subtaskId,
      },
      data: {
        name,
        isComplete,
      },
    });

    return NextResponse.json(subtask, { status: 200 });
  } catch (error) {
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { taskId: string; subtaskId: string } },
) {
  try {
    if (!params.taskId || !params.subtaskId) {
      return new NextResponse('Task Id and Subtask Id is required', {
        status: 400,
      });
    }

    const session = await auth();

    if (!session || !session.user) {
      return new NextResponse('Unauthenticated', { status: 403 });
    }

    const existing = await db.subtask.findUnique({
      where: { id: params.subtaskId },
      select: { userId: true },
    });

    if (!existing || existing.userId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const subtask = await db.subtask.delete({
      where: {
        id: params.subtaskId,
      },
    });

    return NextResponse.json(subtask, { status: 200 });
  } catch (error) {
    return new NextResponse('Internal error', { status: 500 });
  }
}
