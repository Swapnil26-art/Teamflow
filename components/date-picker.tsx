'use client';

import * as React from 'react';
import toast from 'react-hot-toast';

import { Armchair, CalendarCheck2, CircleSlash, Sunset } from 'lucide-react';
import { FieldValues, PathValue, Path, UseFormReturn } from 'react-hook-form';
import { addDays, format, isToday, isTomorrow } from 'date-fns';
import { useRouter } from 'next/navigation';

import { Icons } from '@/components/ui/icons';
import { Separator } from '@/components/ui/seperator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { cn } from '@/lib/util/tw-merge';
import { Button, buttonVariants } from '@/components/ui/button';
import { isOverdue, localDateKey, storedToLocalDate } from '@/lib/util/date';
import { Task } from '@/types';
import { TaskService } from '@/services/task-service';
import { handleError } from '@/lib/util/error';
import { useMounted } from '@/hooks/use-mounted';
import { Calendar } from '@/components/ui/experimental-calendar';

interface FormVariant<T extends FieldValues> {
  type: 'form';
  form: UseFormReturn<T>;
  register: Path<T>;
}

interface TaskVariant {
  type: 'item' | 'dropdown';
  task: Task;
}

interface DatePickerProps<T extends FieldValues> {
  variant: FormVariant<T> | TaskVariant;
  defaultValue?: Date | string | null;
  small?: boolean;
}

export function DatePicker<T extends FieldValues>({
  defaultValue,
  variant,
  small = false,
}: DatePickerProps<T>) {
  const [value, setValue] = React.useState<Date | undefined>(
    storedToLocalDate(defaultValue),
  );

  const isMounted = useMounted();
  const router = useRouter();
  const [, setIsLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  // Keep the picker in sync when the task is updated by another action
  // (e.g. after `router.refresh()` or when editing another task).
  const defaultValueKey = localDateKey(defaultValue);
  React.useEffect(() => {
    setValue(storedToLocalDate(defaultValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValueKey]);

  if (!isMounted) return null;

  const updateTask = async (dueDate: Date | null) => {
    if (!('task' in variant)) return;

    setIsLoading(true);
    try {
      await TaskService.updateTask(variant.task.id, {
        dueDate: dueDate ? localDateKey(dueDate) : null,
      });
      toast.success(dueDate ? 'Due date updated.' : 'Due date removed.');
      router.refresh();
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const onSelect = async (selectedDate: Date | undefined) => {
    if (!selectedDate) return;

    setValue(selectedDate);
    setOpen(false);

    if ('form' in variant) {
      variant.form.setValue(variant.register, selectedDate as PathValue<T, Path<T>>, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    await updateTask(selectedDate);
  };

  const onRemove = async () => {
    setValue(undefined);
    setOpen(false);

    if ('form' in variant) {
      variant.form.setValue(
        variant.register,
        null as PathValue<T, Path<T>>,
        { shouldDirty: true },
      );
    }

    await updateTask(null);
  };

  const dateOptions = [
    { value: '0', label: 'Today', icon: CalendarCheck2 },
    { value: '1', label: 'Tomorrow', icon: Sunset },
    { value: '7', label: 'In a week', icon: Armchair },
  ];

  const getValueLabel = () => {
    if (!value) return '';
    if (isToday(value)) return 'Today';
    if (isTomorrow(value)) return 'Tomorrow';
    return format(value, 'dd MMM');
  };

  const DropdownPopover = React.memo(() => (
    <div className="flex items-center">
      {dateOptions.map((option) => (
        <Button
          key={option.value}
          size="sm"
          variant="ghost"
          onClick={() =>
            onSelect(addDays(new Date(), parseInt(option.value, 10)))
          }
        >
          <option.icon className="h-4 w-4" />
        </Button>
      ))}
      <PopoverTrigger
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
      >
        <Icons.More className="h-3 w-3" />
      </PopoverTrigger>
    </div>
  ));

  const ItemPopoverTrigger = React.memo(() => {
    const { task } = variant as TaskVariant;
    const overdue = isOverdue(task.dueDate, task.isComplete);

    return (
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: 'picker', size: 'icon' }),
          'w-fit px-1',
          overdue && 'text-destructive',
        )}
      >
        <Icons.Calendar className="h-3 w-3 mr-1" />
        <span className="text-xs">
          {getValueLabel() || (
            <span className="text-muted-foreground">Add date</span>
          )}
        </span>
      </PopoverTrigger>
    );
  });

  const FormPopoverTrigger = React.memo(() => (
    <PopoverTrigger
      className={cn(buttonVariants({ variant: 'outline' }), 'w-fit gap-2')}
      type="button"
    >
      <Icons.Calendar className="h-4 w-4" />
      {value ? (
        <span className="flex-gap">
          {format(value, 'dd MMM yyyy')}
          <Icons.Close
            className="h-4 w-4"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          />
        </span>
      ) : (
        !small && <span>Schedule</span>
      )}
    </PopoverTrigger>
  ));

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      {variant.type === 'item' && <ItemPopoverTrigger />}
      {variant.type === 'dropdown' && <DropdownPopover />}
      {variant.type === 'form' && <FormPopoverTrigger />}
      <PopoverContent className="w-[220px]">
        <div className="py-2">
          {dateOptions.map((option) => (
            <Button
              key={option.value}
              className="w-full justify-start text-xs px-3 h-6 rounded-none"
              variant="ghost"
              onClick={() =>
                onSelect(addDays(new Date(), parseInt(option.value, 10)))
              }
            >
              <option.icon className="h-4 w-4 mr-2" />
              {option.label}
              <span className="ml-auto text-xs text-muted-foreground">
                {format(
                  addDays(new Date(), parseInt(option.value, 10)),
                  'EEEE',
                )}
              </span>
            </Button>
          ))}
          <Button
            className="w-full justify-start text-xs px-3 h-6 rounded-none"
            variant="ghost"
            onClick={onRemove}
          >
            <CircleSlash className="h-4 w-4 mr-2" />
            No Date
          </Button>
        </div>
        <Separator />
        <Calendar
          mode="single"
          selected={value}
          onSelect={onSelect}
          initialFocus
          className="p-1"
        />
      </PopoverContent>
    </Popover>
  );
}
