import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { parseDueDate, updateTaskSchema } from '@/lib/validations/task-schema';

async function findOwnedTask(taskId: string, userId: string) {
  return db.task.findFirst({
    where: { id: taskId, userId },
    include: { labels: true, subtasks: true },
  });
}

export async function GET(
  req: Request,
  { params }: { params: { taskId: string } },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse('Unauthenticated', { status: 403 });
    }

    const task = await findOwnedTask(params.taskId, session.user.id);

    if (!task) {
      return new NextResponse('Task not found', { status: 404 });
    }

    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    console.error('[TASK_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { taskId: string } },
) {
  try {
    if (!params.taskId) {
      return new NextResponse('Task Id is required', { status: 400 });
    }

    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse('Unauthenticated', { status: 403 });
    }

    const existing = await db.task.findFirst({
      where: { id: params.taskId, userId: session.user.id },
      select: { id: true, listId: true },
    });

    if (!existing) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const parsed = updateTaskSchema.safeParse(await req.json());

    if (!parsed.success) {
      return new NextResponse(
        parsed.error.issues[0]?.message || 'Bad Request',
        { status: 400 },
      );
    }

    const {
      name,
      description,
      dueDate,
      priority,
      listId,
      labelIds,
      isComplete,
    } = parsed.data;

    const data: Prisma.TaskUncheckedUpdateInput = {};

    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (priority !== undefined) data.priority = priority;

    const parsedDueDate = parseDueDate(dueDate);
    if (parsedDueDate !== undefined) data.dueDate = parsedDueDate;

    if (isComplete !== undefined) {
      data.isComplete = isComplete;
      data.completedAt = isComplete ? new Date() : null;
    }

    if (listId !== undefined) {
      if (listId) {
        const list = await db.list.findFirst({
          where: { id: listId, userId: session.user.id },
          select: { id: true },
        });

        if (!list) {
          return new NextResponse('List not found', { status: 404 });
        }
      }

      data.listId = listId;

      // Keep the task at the end of its new list.
      if (listId !== existing.listId) {
        const lastTask = await db.task.findFirst({
          where: { userId: session.user.id, listId },
          orderBy: { order: 'desc' },
          select: { order: true },
        });

        data.order = lastTask ? lastTask.order + 1 : 0;
      }
    }

    if (labelIds !== undefined) {
      const uniqueLabelIds = Array.from(new Set(labelIds ?? []));

      if (uniqueLabelIds.length) {
        const ownedLabels = await db.label.count({
          where: { id: { in: uniqueLabelIds }, userId: session.user.id },
        });

        if (ownedLabels !== uniqueLabelIds.length) {
          return new NextResponse('Label not found', { status: 404 });
        }
      }

      // `set` replaces the whole relation in one query, which also handles
      // removing labels that are no longer selected.
      data.labels = { set: uniqueLabelIds.map((id) => ({ id })) };
    }

    const task = await db.task.update({
      where: { id: params.taskId },
      data,
      include: { labels: true, subtasks: true },
    });

    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    console.error('[TASK_PATCH]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { taskId: string } },
) {
  try {
    if (!params.taskId) {
      return new NextResponse('Task Id is required', { status: 400 });
    }

    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse('Unauthenticated', { status: 403 });
    }

    const existing = await db.task.findFirst({
      where: { id: params.taskId, userId: session.user.id },
      select: { id: true },
    });

    if (!existing) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    const task = await db.$transaction(async (tx) => {
      // Subtasks are deleted explicitly so this keeps working on databases
      // created before the cascade rule was added to the schema.
      await tx.subtask.deleteMany({ where: { taskId: params.taskId } });
      return tx.task.delete({ where: { id: params.taskId } });
    });

    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    console.error('[TASK_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
