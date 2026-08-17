import * as z from 'zod';

export const taskFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  dueDate: z.union([z.date(), z.string()]).nullable().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).nullable().optional(),
  listId: z.string().nullable().optional(),
  labelIds: z.array(z.string()).nullable().optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
