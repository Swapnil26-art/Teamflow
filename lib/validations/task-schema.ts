import * as z from 'zod';

export const taskFormSchema = z.object({
  name: z.string().min(1),
<<<<<<< HEAD
  description: z.string().nullable().optional(),
  dueDate: z.union([z.date(), z.string()]).nullable().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).nullable().optional(),
  listId: z.string().nullable().optional(),
  labelIds: z.array(z.string()).nullable().optional(),
=======
  description: z.string().optional(),
  dueDate: z.union([z.date(), z.string()]).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  listId: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
>>>>>>> 7de1e5e165c9359a96fc1fe487ab1261117b1460
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
