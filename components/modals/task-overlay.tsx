import * as React from 'react';
import useSWR from 'swr';

import type { Label, List } from '@/types';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';

import TaskForm from '@/components/task-form';

import { useLayoutStore } from '@/store/layout-store';
import { useTaskStore } from '@/store/modal-store';
import { useMediaQuery } from '@/hooks/use-media-query';
import { fetcher, LABELS_KEY, LISTS_KEY } from '@/lib/api';

export default function TaskOverlay() {
  const {
    data: lists,
    error: listsError,
    mutate: mutateLists,
  } = useSWR<List[]>(LISTS_KEY, fetcher);
  const {
    data: labels,
    error: labelsError,
    mutate: mutateLabels,
  } = useSWR<Label[]>(LABELS_KEY, fetcher);
  const { showTaskOverlay, toggleTaskOverlay, setTaskOverlay } =
    useLayoutStore();
  const { task, clearTask } = useTaskStore();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const hasFetchError = listsError || labelsError;
  const isLoading = !lists && !labels && !listsError && !labelsError;

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'q' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        clearTask();
        toggleTaskOverlay();
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [toggleTaskOverlay, clearTask]);

  const retry = () => {
    mutateLists();
    mutateLabels();
  };

  const formKey = `${showTaskOverlay ? 'open' : 'closed'}-${task?.id ?? 'new'}`;

  const content = (
    <>
      {isLoading && (
        <p className="text-sm mt-4">Loading lists and labels...</p>
      )}
      {hasFetchError && (
        <p className="text-error text-sm mt-4">
          Failed to load lists and labels. Please{' '}
          <button type="button" onClick={retry} className="text-error underline">
            refresh
          </button>{' '}
          to try again.
        </p>
      )}
      {!isLoading && !hasFetchError && (
        <TaskForm
          key={formKey}
          lists={lists || []}
          labels={labels || []}
          task={task || undefined}
        />
      )}
    </>
  );

  if (isDesktop) {
    return (
      <Dialog open={showTaskOverlay} onOpenChange={setTaskOverlay} modal>
        <DialogContent className="max-w-xl h-fit overflow-y-auto max-h-screen">
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  // Keep the store and drawer state in sync so swipe/outside-click closes work
  const onOpenChange = (open: boolean) => {
    setTaskOverlay(open);
  };

  return (
    <Drawer open={showTaskOverlay} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="max-h-screen overflow-y-auto">{content}</div>
      </DrawerContent>
    </Drawer>
  );
}
