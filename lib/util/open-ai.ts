'use server';

import nlp from 'compromise';
import dates from 'compromise-dates';
import type { Task } from '@/types';
import { toDateKey } from '@/lib/util/date';

export type PromptTask = Pick<Task, 'name' | 'description' | 'priority'> & {
  dueDate: Date | string | null;
  usedAi?: boolean;
};

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;

/**
 * Groq retires models regularly, so the configured model is tried first and
 * then a couple of currently available models. Without this an old
 * `GROQ_MODEL` value (or no value at all) silently disables the AI feature.
 */
const getModelCandidates = (): string[] =>
  Array.from(
    new Set(
      [
        process.env.GROQ_MODEL,
        'openai/gpt-oss-120b',
        'openai/gpt-oss-20b',
        'llama-3.3-70b-versatile',
      ].filter(
        (model): model is string => !!model && !model.startsWith('your-'),
      ),
    ),
  );

const isModelUnavailable = (error: unknown): boolean => {
  const status = (error as { status?: number } | null)?.status;
  const message = error instanceof Error ? error.message : String(error);

  return (
    status === 404 ||
    /model_not_found|does not exist|decommissioned|no longer supported/i.test(
      message,
    )
  );
};

/**
 * JSON-mode failures (e.g. a reasoning model running out of completion
 * tokens before writing the object) are also worth retrying on the next
 * model instead of dropping straight to the offline parser.
 */
const isRetryableModelError = (error: unknown): boolean => {
  const status = (error as { status?: number } | null)?.status;
  const message = error instanceof Error ? error.message : String(error);

  return (
    isModelUnavailable(error) ||
    (status === 400 &&
      /json_validate_failed|failed to generate json/i.test(message))
  );
};

const parser = (() => {
  try {
    return nlp.extend(dates);
  } catch {
    return nlp;
  }
})();

const cleanName = (value: string) =>
  value
    .replace(/\s+/g, ' ')
    .replace(/^[,.\s-]+|[,.\s-]+$/g, '')
    .trim();

/**
 * Offline NLP fallback: builds a task from natural language without any
 * external API. Always returns something usable.
 */
function parsePromptOffline(userInput: string): PromptTask {
  const text = userInput.trim().replace(/\s+/g, ' ');
  let name = text;
  let dueDate: string | null = null;

  try {
    const doc = parser(text);
    const dateStart = doc
      .dates()
      .json()
      .map((entry: { dates?: { start?: string } }) => entry?.dates?.start)
      .find(
        (start) =>
          typeof start === 'string' &&
          !Number.isNaN(new Date(start).getTime()),
      );

    if (dateStart) {
      // Keep only the calendar day; the app treats due dates as dates.
      dueDate = toDateKey(dateStart) || null;
    }

    const withoutDates = cleanName(doc.not('#Date').text());
    if (withoutDates) {
      name = withoutDates;
    }
  } catch {
    // Keep the full text as name and no due date if parsing fails.
  }

  name = cleanName(name) || text;

  const lower = text.toLowerCase();
  let priority: PromptTask['priority'] = null;

  if (
    /\b(urgent|asap|immediately|critical|important|right now|high priority)\b/.test(
      lower,
    )
  ) {
    priority = 'HIGH';
  } else if (
    /\b(low priority|minor|whenever|someday|optional|not urgent)\b/.test(lower)
  ) {
    priority = 'LOW';
  }

  // Priority hints are represented in `priority`, so keep them out of the
  // task title when possible.
  if (priority) {
    const stripped = cleanName(
      name.replace(
        /\b(urgent|asap|immediately|critical|right now|high priority|low priority|minor|whenever|someday|optional|not urgent)\b/gi,
        '',
      ),
    );

    if (stripped) {
      name = stripped;
    }
  }

  name = cleanName(name) || text;
  if (name) {
    name = name.charAt(0).toUpperCase() + name.slice(1);
  }

  return {
    name: name || userInput.trim(),
    description: null,
    dueDate,
    priority,
    usedAi: false,
  };
}

export async function sendPrompt(userInput: string, timeZone?: string) {
  const input = (userInput ?? '').trim();

  if (!input) {
    throw new Error('Please describe the task first.');
  }

  const apiKey = process.env.GROQ_API_KEY;

  // Without a key (or with the placeholder from .env.example) we still
  // create a sensible task using the built-in parser.
  if (!apiKey || apiKey.startsWith('your-')) {
    return parsePromptOffline(input);
  }

  try {
    const Groq = (await import('groq-sdk')).default;
    const groq = new Groq({ apiKey });

    const effectiveTimeZone =
      timeZone || process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone;

    const now = new Date();
    let localNow = now.toISOString();

    try {
      localNow = new Intl.DateTimeFormat('en-US', {
        dateStyle: 'full',
        timeStyle: 'long',
        timeZone: effectiveTimeZone,
      }).format(now);
    } catch {
      // Ignore an invalid timezone; ISO UTC is a fine fallback.
    }

    const prompt = `You are a helpful task organizer assistant. Create a task object based on the user's input: "${input}".
Rephrase and enhance the task name and description to be professional, actionable, and clear.
If a date or time expression is mentioned (e.g. "tomorrow", "next Monday", "in 3 days", "at 5pm"), calculate the corresponding ISO 8601 date using the CURRENT local date and time as reference: ${localNow} (${effectiveTimeZone}).
If no date is mentioned, set dueDate to null.
Infer priority if implied (e.g., "urgent", "important", "asap" -> "HIGH", "minor", "low" -> "LOW", else "MEDIUM" or null).
You MUST respond with a valid JSON object matching this schema:
{
  "name": "string",
  "description": "string",
  "dueDate": "ISO 8601 string or null",
  "priority": "LOW" | "MEDIUM" | "HIGH" | null
}`;

    const models = getModelCandidates();
    let lastModelError: unknown;

    const requestCompletion = async (index: number): Promise<string> => {
      try {
        const completion = await groq.chat.completions.create({
          model: models[index],
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.4,
          // Reasoning models count hidden reasoning tokens against this
          // budget; 512 was occasionally exhausted before any JSON was
          // written.
          max_tokens: 2048,
        });

        const content = completion.choices[0]?.message?.content;
        if (content) return content;

        lastModelError = new Error('No response received from AI model');
      } catch (error) {
        lastModelError = error;

        // Retry only when the model is gone or JSON generation failed;
        // auth/quota/network errors go straight to the offline parser.
        if (!isRetryableModelError(error)) throw error;
      }

      if (index + 1 >= models.length) {
        throw lastModelError instanceof Error
          ? lastModelError
          : new Error('No response received from AI model');
      }

      return requestCompletion(index + 1);
    };

    const rawText = await requestCompletion(0);

    // Strip markdown code fences if present
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/im, '')
      .replace(/\s*```$/m, '')
      .trim();

    const parsed = JSON.parse(cleaned) as PromptTask;

    // Sanitize the model output so invalid dates / priorities never
    // crash the UI or Prisma with enum/date errors.
    const dueDate = parsed.dueDate ? toDateKey(parsed.dueDate) || null : null;

    const priority =
      typeof parsed.priority === 'string' &&
      PRIORITIES.includes(
        parsed.priority.toUpperCase() as (typeof PRIORITIES)[number],
      )
        ? (parsed.priority.toUpperCase() as PromptTask['priority'])
        : null;

    return {
      name:
        typeof parsed.name === 'string' && parsed.name.trim()
          ? parsed.name.trim()
          : input,
      description:
        typeof parsed.description === 'string' && parsed.description.trim()
          ? parsed.description.trim()
          : null,
      dueDate,
      priority,
      usedAi: true,
    } as PromptTask;
  } catch (error) {
    console.error('[AI_PROMPT]', error);
    // Never fail the feature; fall back to the built-in offline parser
    // so the user always gets a usable task.
    return { ...parsePromptOffline(input), usedAi: false };
  }
}
