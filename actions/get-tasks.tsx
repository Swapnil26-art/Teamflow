import { addDays } from 'date-fns';
import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { SearchParamsOptions } from '@/lib/util/filter';
import { getDayRange, toDateKey } from '@/lib/util/date';
import { isNextDynamicError } from '@/lib/util/next-error';
import { getTodayKey } from '@/lib/util/timezone';

export const getTasks = async (options?: SearchParamsOptions) => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return null;
    }

    const where: Prisma.TaskWhereInput = { userId: session.user.id };

    let dueDateRange: Prisma.DateTimeFilter | undefined;

    if (options?.today) {
      dueDateRange = getDayRange(getTodayKey());
    } else if (options?.dueDate) {
      const dateKey = toDateKey(options.dueDate);

      if (dateKey) {
        dueDateRange = getDayRange(dateKey);
      }
    } else if (options?.upcoming) {
      const today = new Date(`${getTodayKey()}T00:00:00.000Z`);
      dueDateRange = { gte: today, lt: addDays(today, 7) };
    } else if (options?.overdue) {
      const today = new Date(`${getTodayKey()}T00:00:00.000Z`);
      dueDateRange = { lt: today };
    }

    if (options?.unsorted) {
      where.listId = null;
    } else if (options?.listId) {
      where.listId = options.listId;
    }

    if (options?.labelId) {
      where.labels = { some: { id: options.labelId } };
    }

    if (dueDateRange) {
      where.dueDate = dueDateRange;
    }

    if (options?.completed) {
      where.isComplete = true;
    } else if (options?.incomplete) {
      where.isComplete = false;
    }

    const tasks = await db.task.findMany({
      where,
      include: {
        subtasks: true,
        labels: true,
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    return tasks;
  } catch (error) {
    if (isNextDynamicError(error)) throw error;

    console.error('[GET_TASKS]', error);
    return null;
  }
};
