import * as z from 'zod';

import { toDueDate } from '@/lib/util/date';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;

export const taskFormSchema = z.object({
  name: z.string().trim().min(1, 'Task name is required.'),
  description: z.string().nullable().optional(),
  dueDate: z
    .union([z.date(), z.string(), z.null()])
    .optional()
    .transform((value) => {
      if (value === undefined || value === null || value === '') return null;
      return value;
    }),
  priority: z.enum(PRIORITIES).nullable().optional(),
  listId: z.string().nullable().optional(),
  labelIds: z.array(z.string()).nullable().optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

/** Payload accepted by `POST /api/tasks`. */
export const createTaskSchema = z.object({
  name: z.string().trim().min(1, 'Task name is required.'),
  description: z.string().nullable().optional(),
  dueDate: z.union([z.date(), z.string(), z.null()]).optional(),
  priority: z.enum(PRIORITIES).nullable().optional(),
  listId: z.string().nullable().optional(),
  labelIds: z.array(z.string()).nullable().optional(),
});

/** Payload accepted by `PATCH /api/tasks/:id`. Every field is optional. */
export const updateTaskSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().nullable().optional(),
  dueDate: z.union([z.date(), z.string(), z.null()]).optional(),
  priority: z.enum(PRIORITIES).nullable().optional(),
  listId: z.string().nullable().optional(),
  labelIds: z.array(z.string()).nullable().optional(),
  isComplete: z.boolean().optional(),
});

export type CreateTaskPayload = z.infer<typeof createTaskSchema>;
export type UpdateTaskPayload = z.infer<typeof updateTaskSchema>;

/**
 * Turns a value coming from JSON (ISO string), a `Date` or `null` into a
 * `Date` Prisma can persist (or `null` to clear the due date).
 * Returns `undefined` when the value should be left untouched.
 */
export const parseDueDate = toDueDate;
