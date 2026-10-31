import * as React from 'react';

import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import type { Subtask, Task } from '@/types';

import { Checkbox } from '@/components/ui/checkbox';
import { handleError } from '@/lib/util/error';

import { TaskService } from '@/services/task-service';
import { SubtaskService } from '@/services/subtask-service';

interface StatusCheckboxProps {
  task?: Task | null;
  subtask?: Subtask;
  className?: string;
  disabled?: boolean;
}

export default function StatusCheckbox({
  task,
  subtask,
  className,
  disabled,
}: StatusCheckboxProps) {
  const initialValue = subtask
    ? subtask.isComplete
    : (task?.isComplete ?? false);

  const [isCompleted, setIsCompleted] = React.useState(initialValue);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();

  // Keep the checkbox in sync when fresh data arrives from the server.
  React.useEffect(() => {
    setIsCompleted(initialValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtask?.id, subtask?.isComplete, task?.id, task?.isComplete]);

  if (!task && !subtask) {
    return <Checkbox className={className} disabled={disabled} />;
  }

  const onToggleStatus = async () => {
    if (!task && !subtask) return;

    const updatedStatus = !isCompleted;
    const previousStatus = isCompleted;

    // Optimistic update: flip instantly so the checkbox never feels stuck.
    setIsCompleted(updatedStatus);
    setIsLoading(true);

    try {
      if (task && !subtask) {
        await TaskService.updateTask(task.id, {
          isComplete: updatedStatus,
        });
      } else if (subtask && task) {
        await SubtaskService.updateSubtask(task.id, subtask.id, {
          isComplete: updatedStatus,
        });
      }

      if (updatedStatus) {
        toast.success(task ? 'Task completed!' : 'Subtask completed!');
      }

      router.refresh();
    } catch (error) {
      setIsCompleted(previousStatus);
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const priorityClassnames: { [key: string]: string } = {
    LOW: 'border-sky-500 bg-sky-500/10',
    MEDIUM: 'border-yellow-500 bg-yellow-500/10',
    HIGH: 'border-red-500 bg-red-500/10',
  };

  return (
    <Checkbox
      checked={isCompleted}
      disabled={disabled || isLoading}
      onCheckedChange={onToggleStatus}
      className={`${priorityClassnames[task?.priority || ''] || ''} ${className || ''}`}
    />
  );
}
