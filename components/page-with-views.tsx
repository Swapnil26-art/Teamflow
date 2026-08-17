'use server';

import * as React from 'react';

import { ExtendedSearchParamsOptions } from '@/lib/util/filter';
import { TaskList } from './task-list';
import { Separator } from '@/components/ui/seperator';
import {
  PageList,
  PageBoard,
  PageHeading,
  PageDescription,
} from '@/components/ui/page';
import { getLabels } from '@/actions/get-labels';
import { getLists } from '@/actions/get-lists';
import { getTasks } from '@/actions/get-tasks';

interface ViewContent {
  description: string;
}

interface PageWithViewsProps {
  searchParams: Partial<ExtendedSearchParamsOptions>;
  content: {
    title: string;
    list?: ViewContent;
  };
  options?: Partial<ExtendedSearchParamsOptions>;
}

export default async function PageWithViews({
  searchParams,
  content,
  options,
}: PageWithViewsProps) {
  const labels = await getLabels();
  const lists = await getLists();
  const tasks = await getTasks({
    ...options,
    ...searchParams,
  });

  const completedTasks = tasks.filter((t) => t.isComplete);
  const inProgressTasks = tasks.filter(
    (t) => !t.isComplete && t.subtasks && t.subtasks.some((s) => s.isComplete),
  );
  const newTasks = tasks.filter(
    (t) =>
      !t.isComplete &&
      (!t.subtasks || !t.subtasks.some((s) => s.isComplete)),
  );

  switch (searchParams.view) {
    case 'board':
      return (
        <PageBoard>
          <div className="space-y-2">
            <PageHeading
              color="bg-yellow-500"
              items={newTasks}
              level="h3"
              className="text-md"
            >
              New
            </PageHeading>
            <TaskList
              tasks={newTasks}
              lists={lists}
              labels={labels}
              type="board"
            />
          </div>
          <div className="space-y-2">
            <PageHeading
              color="bg-sky-500"
              items={inProgressTasks}
              level="h3"
              className="text-md"
            >
              In Progress
            </PageHeading>
            <TaskList
              tasks={inProgressTasks}
              lists={lists}
              labels={labels}
              type="board"
              expandable={false}
            />
          </div>
          <div className="space-y-2">
            <PageHeading
              color="bg-emerald-500"
              items={completedTasks}
              level="h3"
              className="text-md"
            >
              Completed
            </PageHeading>
            <TaskList
              tasks={completedTasks}
              lists={lists}
              labels={labels}
              type="board"
              expandable={false}
            />
          </div>
        </PageBoard>
      );
    default:
      return (
        <PageList>
          <PageHeading items={tasks}>{content.title}</PageHeading>
          {content.list?.description && (
            <PageDescription>{content.list.description}</PageDescription>
          )}
          <Separator className="mt-4" />
          <TaskList tasks={tasks} lists={lists} labels={labels} />
        </PageList>
      );
  }
}
