import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: { taskId: string } },
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return new NextResponse('Unauthenticated', { status: 403 });
    }

    const { name } = await req.json();

    if (typeof name !== 'string' || !name.trim()) {
      return new NextResponse('Bad Request', { status: 400 });
    }

    const task = await db.task.findFirst({
      where: { id: params.taskId, userId: session.user.id },
      select: { id: true },
    });

    if (!task) {
      return new NextResponse('Task not found', { status: 404 });
    }

    const lastSubtask = await db.subtask.findFirst({
      where: { userId: session.user.id, taskId: params.taskId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const order = lastSubtask ? lastSubtask.order + 1 : 1;
    const subtask = await db.subtask.create({
      data: {
        userId: session.user.id,
        taskId: params.taskId,
        name: name.trim(),
        order,
      },
    });

    return NextResponse.json(subtask, { status: 200 });
  } catch (error) {
    return new NextResponse('Internal server error', { status: 500 });
  }
}
