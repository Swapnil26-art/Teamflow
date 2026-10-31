import type { Task as PrismaTask, Label, Subtask } from '@prisma/client';

export type Task = PrismaTask & {
  labels?: Label[];
  subtasks?: Subtask[];
};

export type TaskEntry = Omit<Partial<PrismaTask>, 'dueDate' | 'listId'> & {
  name: string;
  dueDate?: Date | string | null;
  listId?: string | null;
  labelIds?: string[] | null;
};
export type SubtaskEntry = Partial<Subtask> & { name: string };
export type LabelEntry = Partial<Label> & { name: string };
export type { User, List, Label, Subtask, TaskPriority } from '@prisma/client';
