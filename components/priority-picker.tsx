'use client';

import * as React from 'react';
import toast from 'react-hot-toast';

import { FieldValues, PathValue, Path, UseFormReturn } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/ui/icons';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Task, TaskPriority } from '@/types';
import { TaskService } from '@/services/task-service';
import { handleError } from '@/lib/util/error';
import { cn } from '@/lib/util/tw-merge';

type Priority = { value: TaskPriority; color: string; label: string };

export const priorities: Priority[] = [
  { value: 'HIGH', color: '#EF4444', label: 'High' },
  { value: 'MEDIUM', color: '#EAB308', label: 'Medium' },
  { value: 'LOW', color: '#0EA5E9', label: 'Low' },
];

export function PriorityItem({
  priority,
  onSelect,
}: {
  priority: Priority;
  // eslint-disable-next-line no-unused-vars
  onSelect: (priority: TaskPriority) => void;
}) {
  return (
    <Button
      onClick={() => onSelect(priority.value)}
      variant="ghost"
      type="button"
      className="w-full justify-start px-2 h-8"
    >
      <Icons.Flag className="w-4 h-4 mr-2" style={{ color: priority.color }} />
      {priority.label}
    </Button>
  );
}

interface FormVariant<T extends FieldValues> {
  type: 'form';
  form: UseFormReturn<T>;
  register: Path<T>;
}

interface TaskVariant {
  type: 'dropdown';
  task: Task;
}

interface PriorityPickerProps<T extends FieldValues> {
  variant: FormVariant<T> | TaskVariant;
  defaultValue?: TaskPriority | null;
  small?: boolean;
}

export function PriorityPicker<T extends FieldValues>({
  variant,
  defaultValue,
  small = false,
}: PriorityPickerProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<TaskPriority | null>(
    defaultValue ?? null,
  );
  const [, setIsLoading] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    setValue(defaultValue ?? null);
  }, [defaultValue]);

  const updateTask = async (priority: TaskPriority | null) => {
    if (!('task' in variant)) return;

    setIsLoading(true);
    try {
      await TaskService.updateTask(variant.task.id, { priority });
      toast.success(priority ? 'Priority updated.' : 'Priority removed.');
      router.refresh();
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const onSelect = async (priority: TaskPriority) => {
    setOpen(false);
    setValue(priority);

    if ('form' in variant) {
      variant.form.setValue(
        variant.register,
        priority as PathValue<T, Path<T>>,
        { shouldDirty: true, shouldValidate: true },
      );
    }

    await updateTask(priority);
  };

  const onRemove = async () => {
    setOpen(false);
    setValue(null);

    if ('form' in variant) {
      // Set the field to `null` instead of unregistering it: the API needs
      // an explicit `null` to clear the priority on an existing task.
      variant.form.setValue(
        variant.register,
        null as PathValue<T, Path<T>>,
        { shouldDirty: true },
      );
    }

    await updateTask(null);
  };

  const priority = priorities.find((p) => p.value === value);

  if ('task' in variant) {
    return (
      <div>
        {priorities.map((item) => (
          <Button
            key={item.value}
            size="sm"
            type="button"
            variant={value === item.value ? 'secondary' : 'ghost'}
            onClick={() => onSelect(item.value)}
          >
            <Icons.Flag className="w-4 h-4" style={{ color: item.color }} />
          </Button>
        ))}
        <Button
          size="sm"
          type="button"
          variant={value ? 'ghost' : 'secondary'}
          onClick={onRemove}
        >
          <Icons.Flag className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger
        aria-expanded={open}
        type="button"
        className={cn(buttonVariants({ variant: 'outline' }), 'w-fit gap-2')}
      >
        <Icons.Flag className="w-4 h-4" style={{ color: priority?.color }} />
        {value ? (
          <span className="flex-gap">
            {priority?.label ?? value}
            <Icons.Close
              className="w-4 h-4"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            />
          </span>
        ) : (
          !small && <span className="text-muted-foreground">Priority</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-1">
        {priorities.map((item) => (
          <PriorityItem key={item.value} priority={item} onSelect={onSelect} />
        ))}
        <Button
          onClick={onRemove}
          variant="ghost"
          type="button"
          className="w-full justify-start px-2 h-8"
        >
          <Icons.Flag className="w-4 h-4 mr-2" />
          None
        </Button>
      </PopoverContent>
    </Popover>
  );
}
