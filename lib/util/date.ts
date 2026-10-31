import { format, parseISO, startOfDay, addDays } from 'date-fns';

/**
 * Task due dates are stored as "calendar dates" (no meaningful time).
 * To keep them stable across timezones we persist them at 12:00 UTC and
 * always compare/format them using UTC date parts.
 */
const DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/;

const pad = (value: number) => value.toString().padStart(2, '0');

/** Date parts of a stored due date (UTC based). */
function storedParts(value: Date | string) {
  if (typeof value === 'string') {
    const match = value.match(DATE_PREFIX);
    if (match) {
      return { year: +match[1], month: +match[2], day: +match[3] };
    }
  }

  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

/** `yyyy-MM-dd` key for a stored due date. */
export const toDateKey = (value: Date | string | null | undefined): string => {
  if (!value) return '';

  const parts = storedParts(value);
  if (!parts) return '';

  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
};

/**
 * Normalizes a date coming from a form/API into the value persisted in the
 * database: UTC noon of the selected calendar day. Returns `null` for empty
 * values and `undefined` when the input is invalid.
 */
export const toDueDate = (
  value: Date | string | null | undefined,
): Date | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  let key: string;

  if (typeof value === 'string') {
    const match = value.match(DATE_PREFIX);

    if (match) {
      key = value.slice(0, 10);
    } else {
      const parsed = new Date(value);
      key = Number.isNaN(parsed.getTime()) ? '' : toDateKey(parsed);
    }
  } else {
    key = toDateKey(value);
  }

  if (!key) return undefined;

  const [year, month, day] = key.split('-').map(Number);
  if (!year || !month || !day) return undefined;

  return new Date(Date.UTC(year, month - 1, day, 12));
};

/** Converts a stored due date into a local Date at midnight (for calendars). */
export const storedToLocalDate = (
  value: Date | string | null | undefined,
): Date | undefined => {
  const key = toDateKey(value);
  if (!key) return undefined;

  const date = parseISO(key);
  return Number.isNaN(date.getTime()) ? undefined : startOfDay(date);
};

/** `yyyy-MM-dd` key for a local date (used by the date picker). */
export const localDateKey = (value: Date | string | null | undefined) => {
  if (!value) return '';

  if (typeof value === 'string') {
    const match = value.match(DATE_PREFIX);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return format(parsed, 'yyyy-MM-dd');
  }

  return format(value, 'yyyy-MM-dd');
};

/** UTC range covering one calendar day, used in Prisma queries. */
export const getDayRange = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, day));

  return {
    gte: start,
    lt: addDays(start, 1),
  };
};

/** Human friendly label for a stored due date. */
export const formatDueDate = (value: Date | string | null | undefined) => {
  const date = storedToLocalDate(value);
  if (!date) return '';

  const today = startOfDay(new Date());
  if (date.getTime() === today.getTime()) return 'Today';
  if (date.getTime() === addDays(today, 1).getTime()) return 'Tomorrow';

  return format(date, 'dd MMM yyyy');
};

/** True when a stored due date is before today and the task is still open. */
export const isOverdue = (
  value: Date | string | null | undefined,
  isComplete?: boolean,
) => {
  if (isComplete) return false;

  const key = toDateKey(value);
  if (!key) return false;

  return parseISO(key).getTime() < startOfDay(new Date()).getTime();
};
