import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getDayRange, toDateKey } from '@/lib/util/date';
import { createTaskSchema, parseDueDate } from '@/lib/validations/task-schema';

/**
 * Returns the next `order` value for a task inside a given list (or the
 * inbox bucket when `listId` is null) for a single user.
 */
async function getNextOrder(userId: string, listId: string | null) {
  const lastTask = await db.task.findFirst({
    where: { userId, listId },
    orderBy: { order: 'desc' },
    select: { order: true },
  });

  return lastTask ? lastTask.order + 1 : 0;
}

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const listId = searchParams.get('listId');
    const labelId = searchParams.get('labelId');
    const dueDate = searchParams.get('dueDate');
    const completed = searchParams.get('completed');
    const incomplete = searchParams.get('incomplete');
    const unsorted = searchParams.get('unsorted');

    const where: Prisma.TaskWhereInput = { userId: session.user.id };

    if (unsorted === 'true') {
      where.listId = null;
    } else if (listId) {
      where.listId = listId;
    }

    if (labelId) {
      where.labels = { some: { id: labelId } };
    }

    if (dueDate) {
      const dateKey = toDateKey(dueDate);
      if (dateKey) {
        where.dueDate = getDayRange(dateKey);
      }
    }

    if (completed === 'true') where.isComplete = true;
    if (incomplete === 'true') where.isComplete = false;

    const tasks = await db.task.findMany({
      where,
      include: { subtasks: true, labels: true },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error('[TASKS_GET]', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const parsed = createTaskSchema.safeParse(await req.json());

    if (!parsed.success) {
      return new NextResponse(
        parsed.error.issues[0]?.message || 'Bad Request',
        { status: 400 },
      );
    }

    const { name, description, dueDate, priority, listId, labelIds } =
      parsed.data;

    if (listId) {
      const list = await db.list.findFirst({
        where: { id: listId, userId: session.user.id },
        select: { id: true },
      });

      if (!list) {
        return new NextResponse('List not found', { status: 404 });
      }
    }

    if (labelIds?.length) {
      const ownedLabels = await db.label.count({
        where: { id: { in: labelIds }, userId: session.user.id },
      });

      if (ownedLabels !== new Set(labelIds).size) {
        return new NextResponse('Label not found', { status: 404 });
      }
    }

    const task = await db.task.create({
      data: {
        userId: session.user.id,
        name,
        description: description ?? null,
        dueDate: parseDueDate(dueDate) ?? null,
        priority: priority ?? null,
        listId: listId ?? null,
        order: await getNextOrder(session.user.id, listId ?? null),
        labels: labelIds?.length
          ? { connect: Array.from(new Set(labelIds)).map((id) => ({ id })) }
          : undefined,
      },
      include: { labels: true, subtasks: true },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('[TASKS_POST]', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
