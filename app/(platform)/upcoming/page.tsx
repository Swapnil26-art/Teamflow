import {
  startOfDay,
  addDays,
  addWeeks,
  format,
  isToday,
  isTomorrow,
} from 'date-fns';
import TaskItem from '@/components/task-item';
import FilterWeek from '@/components/filter-week';

import type { Task } from '@/types';
import { PageHeading } from '@/components/ui/page';
import { ExtendedSearchParamsOptions } from '@/lib/util/filter';
import { getLabels } from '@/actions/get-labels';
import { getLists } from '@/actions/get-lists';
import { getTasks } from '@/actions/get-tasks';

interface UpcomingPageProps {
  searchParams: Partial<ExtendedSearchParamsOptions>;
}

interface DayData {
  day: Date;
  formattedDate: string;
  tasks: Task[];
}

export default async function UpcomingPage({
  searchParams,
}: UpcomingPageProps) {
  const labels = (await getLabels()) || [];
  const lists = (await getLists()) || [];

  const parsedOffset = Number(searchParams.offset);
  const offset = Number.isFinite(parsedOffset) ? parsedOffset : 0;

  // The Upcoming view always starts from today and pages forward one week
  // at a time. Using startOfDay keeps the date buckets aligned with how
  // tasks are stored (local midnight of the selected day).
  const startDate = startOfDay(addWeeks(new Date(), offset));

  const days: DayData[] = await Promise.all(
    Array.from({ length: 7 }, async (_, index) => {
      const day = addDays(startDate, index);
      const formattedDate = format(day, 'yyyy-MM-dd');

      const tasks =
        (await getTasks({
          ...searchParams,
          offset: undefined,
          dueDate: formattedDate,
        })) || [];

      return { day, formattedDate, tasks };
    }),
  );

  const monthLabels = Array.from(
    new Set(days.map(({ day }) => format(day, 'MMMM yyyy'))),
  );
  const currentMonth = monthLabels.join(' – ');

  function ColumnHeader({ dayData }: { dayData: DayData }) {
    const getDisplayDate = (day: Date): string => {
      if (isToday(day)) {
        return 'Today';
      }
      if (isTomorrow(day)) {
        return 'Tomorrow';
      }
      return format(day, 'EEEE');
    };

    return (
      <div id={dayData.formattedDate}>
        <h3 className="text-sm font-bold">
          {getDisplayDate(dayData.day)}
          <span className="text-xs text-muted-foreground font-normal ml-2">
            {format(dayData.day, 'dd MMM')}
          </span>
        </h3>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex-gap">
        <PageHeading>{currentMonth}</PageHeading>
        <FilterWeek />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {days.map((dayData) => (
          <div key={dayData.formattedDate} className="min-w-[250px] space-y-4">
            <ColumnHeader dayData={dayData} />
            <div className="space-y-2">
              {dayData.tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  labels={labels}
                  lists={lists}
                  type="board"
                />
              ))}
              <TaskItem
                lists={lists}
                labels={labels}
                date={dayData.formattedDate}
                type="board"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
