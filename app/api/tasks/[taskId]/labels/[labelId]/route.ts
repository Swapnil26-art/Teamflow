import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: { taskId: string; labelId: string } },
) {
  if (!params.taskId || !params.labelId) {
    return new NextResponse('Task Id and Label Id is required', {
      status: 400,
    });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new NextResponse('Unauthenticated', { status: 403 });
  }

  try {
    // Check if the task belongs to the user and label exists
    const existingTask = await db.task.findUnique({
      where: { id: params.taskId },
      select: { userId: true },
    });

    const existingLabel = await db.label.findUnique({
      where: { id: params.labelId },
    });

    if (
      !existingTask ||
      existingTask.userId !== session.user.id ||
      !existingLabel
    ) {
      return new NextResponse('Task or Label not found', { status: 404 });
    }

    // Create a new label and associate it with the task
    const updatedTask = await db.task.update({
      where: { id: params.taskId },
      data: {
        labels: {
          connect: { id: params.labelId },
        },
      },
    });

    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { taskId: string; labelId: string } },
) {
  try {
    if (!params.taskId || !params.labelId) {
      return new NextResponse('Task Id and Label Id is required', {
        status: 400,
      });
    }

    const session = await auth();

    if (!session || !session.user) {
      return new NextResponse('Unauthenticated', { status: 403 });
    }

    const existingLabel = await db.label.findUnique({
      where: { id: params.labelId },
      select: { userId: true },
    });

    const existingTask = await db.task.findUnique({
      where: { id: params.taskId },
      select: { userId: true },
    });

    if (
      !existingLabel ||
      existingLabel.userId !== session.user.id ||
      !existingTask ||
      existingTask.userId !== session.user.id
    ) {
      return new NextResponse('Label not found', { status: 404 });
    }

    // Disconnect the label from the task
    const updatedTask = await db.task.update({
      where: { id: params.taskId },
      data: {
        labels: {
          disconnect: { id: params.labelId },
        },
      },
    });

    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    return new NextResponse('Internal error', { status: 500 });
  }
}
