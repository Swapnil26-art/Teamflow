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

    if (!name) {
      return new NextResponse('Bad Request', { status: 401 });
    }

    const lastSubtask = await db.subtask.findFirst({
      where: { userId: session.user.id, taskId: params.taskId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

<<<<<<< HEAD
    const order = lastSubtask ? lastSubtask.order + 1 : 1;
    const subtask = await db.subtask.create({
=======
    const order = lastSubtask ? lastSubtask.order : 1;
    const list = await db.subtask.create({
>>>>>>> 7de1e5e165c9359a96fc1fe487ab1261117b1460
      data: {
        userId: session.user.id,
        taskId: params.taskId,
        name,
        order,
      },
    });

<<<<<<< HEAD
    return NextResponse.json(subtask, { status: 200 });
=======
    return NextResponse.json(list, { status: 200 });
>>>>>>> 7de1e5e165c9359a96fc1fe487ab1261117b1460
  } catch (error) {
    return new NextResponse('Internal server error', { status: 500 });
  }
}
