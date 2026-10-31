'use client';

import * as React from 'react';
import toast from 'react-hot-toast';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { startOfDay } from 'date-fns';

import { useLayoutStore } from '@/store/layout-store';
import { handleError } from '@/lib/util/error';
import { localDateKey, storedToLocalDate } from '@/lib/util/date';
import type { Label, List, Task } from '@/types';
import { TaskService } from '@/services/task-service';
import { taskFormSchema, TaskFormValues } from '@/lib/validations/task-schema';

import MentionsInput from '@/components/mention-input';
import { ListPicker } from '@/components/list-picker';
import { PriorityPicker } from '@/components/priority-picker';
import { DatePicker } from '@/components/date-picker';
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/seperator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';

interface TaskFormProps {
  task?: Task;
  lists: List[];
  labels: Label[];
  close?: () => void;
  small?: boolean;
  preview?: boolean;
  initialValues?: {
    dueDate?: string;
  };
}

export default function TaskForm({
  task,
  lists,
  labels,
  small = false,
  close,
  initialValues,
  preview = false,
}: TaskFormProps) {
  const { closeTaskOverlay } = useLayoutStore();
  const [isLoading, setIsLoading] = React.useState(false);

  const params = useParams<{ listId?: string }>();
  const path = usePathname();
  const router = useRouter();

  const initialDueDate = React.useMemo(() => {
    if (task?.dueDate) {
      return storedToLocalDate(task.dueDate);
    }
    if (path === '/today') {
      return startOfDay(new Date());
    }
    if (initialValues?.dueDate) {
      return storedToLocalDate(initialValues.dueDate);
    }
    return undefined;
  }, [task?.dueDate, path, initialValues?.dueDate]);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: task?.name ?? '',
      description: task?.description ?? '',
      dueDate: initialDueDate ?? null,
      priority: task?.priority ?? null,
      listId: task?.listId ?? params?.listId ?? null,
      labelIds: task?.labels?.map((label) => label.id) ?? [],
    },
  });

  const onSubmit = async (data: TaskFormValues) => {
    if (preview) {
      toast.success('Task created!');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name: data.name.trim(),
        description: data.description?.trim() ? data.description.trim() : null,
        // Send a calendar date (`yyyy-MM-dd`) so the server can store it
        // without any timezone drift.
        dueDate: data.dueDate ? localDateKey(data.dueDate as Date | string) : null,
        priority: data.priority ?? null,
        listId: data.listId ?? null,
        labelIds: data.labelIds ?? [],
      };

      if (task) {
        await TaskService.updateTask(task.id, payload);
        toast.success('Task updated.');
      } else {
        await TaskService.createTask(payload);
        toast.success('Task created.');
      }

      router.refresh();
      close?.();
      closeTaskOverlay();
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const nameValue = form.watch('name');

  const onCancel = () => {
    close?.();
    closeTaskOverlay();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, () =>
          toast.error('Please enter a task name.'),
        )}
      >
        <div className="p-1">
          <MentionsInput
            form={form}
            lists={lists}
            labels={labels}
            register="name"
            preview={preview}
            small={small}
          />
          <Input
            transparent
            {...form.register('description')}
            placeholder="Description"
            className="pt-0"
            autoComplete="off"
          />
        </div>
        <div className="flex-gap p-3 pt-0 flex-wrap max-w-full">
          <DatePicker
            variant={{
              type: 'form',
              form,
              register: 'dueDate',
            }}
            defaultValue={initialDueDate}
            small={small}
          />
          <PriorityPicker
            variant={{
              type: 'form',
              form,
              register: 'priority',
            }}
            defaultValue={form.watch('priority')}
            small={small}
          />
        </div>
        <Separator />
        <div className="flex-between p-3">
          <div>
            <ListPicker
              lists={lists}
              form={form}
              register="listId"
            />
          </div>
          <div className="flex-gap">
            <Button
              variant="secondary"
              size="sm"
              onClick={onCancel}
              type="button"
              disabled={isLoading}
            >
              {small ? <Icons.Close className="w-4 h-4" /> : 'Cancel'}
            </Button>
            <Button
              size="sm"
              type="submit"
              disabled={!nameValue?.trim() || isLoading}
              loading={isLoading}
            >
              {(small && <Icons.Send className="w-4 h-4" />) ||
                (task ? 'Save changes' : 'Create task')}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
