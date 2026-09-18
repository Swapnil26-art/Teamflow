'use server';

import nlp from 'compromise';
import dates from 'compromise-dates';
import { Task } from '@/types';

export type PromptTask = Pick<
  Task,
  'name' | 'description' | 'priority'
> & {
  dueDate: Date | string | null;
  usedAi?: boolean;
};

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

const parser = (() => {
  try {
    return nlp.extend(dates);
  } catch {
    return nlp;
  }
})();

function parsePromptOffline(userInput: string): PromptTask {
  const text = userInput.trim().replace(/\s+/g, ' ');
  let name = text;
  let dueDate: string | null = null;

  try {
    const dateStart = parser(text)
      .dates()
      .json()
      .map((entry) => entry?.dates?.start)
      .find(
        (start) =>
          typeof start === 'string' &&
          !Number.isNaN(new Date(start).getTime()),
      );

    if (dateStart) {
      dueDate = new Date(dateStart).toISOString();
    }

    if (name) {
      const cleaned = parser(text).not('#Date').text().trim();
      if (cleaned) {
        name = cleaned.replace(/[.,;:!?]+$/, '');
      }
    }
  } catch {
    // Keep the full text as name and no due date if parsing fails.
  }

  name = name.charAt(0).toUpperCase() + name.slice(1);

  const lower = text.toLowerCase();
  let priority: PromptTask['priority'] = null;
  if (
    /\b(urgent|asap|immediately|critical|important|right now|high priority)\b/.test(
      lower,
    )
  ) {
    priority = 'HIGH';
  } else if (
    /\b(low priority|minor|whenever|someday|optional|not urgent|sometime)\b/.test(
      lower,
    )
  ) {
    priority = 'LOW';
  }

  return { name, description: null, dueDate, priority, usedAi: false };
}

export async function sendPrompt(userInput: string) {
  if (!userInput || !userInput.trim()) {
    throw new Error('Prompt cannot be empty');
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return parsePromptOffline(userInput);
  }

  try {
    const Groq = (await import('groq-sdk')).default;
    const groq = new Groq({ apiKey });

    const now = new Date();
    const localNow = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
      timeStyle: 'long',
    }).format(now);

    const prompt = `You are a helpful task organizer assistant. Create a task object based on the user's input: "${userInput}".
Rephrase and enhance the task name and description to be professional, actionable, and clear.
If a date or time expression is mentioned (e.g. "tomorrow", "next Monday", "in 3 days", "at 5pm"), calculate the corresponding ISO 8601 string using the CURRENT local date and time as reference: ${localNow} (${process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone}).
Use the local timezone when building the ISO date so daytime values map to the same local hour.
If no date is mentioned, set dueDate to null.
Infer priority if implied (e.g., "urgent", "important", "asap" -> "HIGH", "minor", "low" -> "LOW", else "MEDIUM" or null).
You MUST respond with a valid JSON object matching this schema:
{
  "name": "string",
  "description": "string",
  "dueDate": "ISO 8601 string or null",
  "priority": "LOW" | "MEDIUM" | "HIGH" | null
}`;

    const completion = await groq.chat.completions.create({
      model: 'qwen/qwen3.8-27b',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 512,
    });

    const rawText = completion.choices[0]?.message?.content;
    if (!rawText) throw new Error('No response received from AI model');

    // Strip markdown code fences if present
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/im, '')
      .replace(/\s*```$/m, '')
      .trim();

    const parsed = JSON.parse(cleaned) as PromptTask;

    // Sanitize the model output so invalid dates / priorities never
    // crash the UI or Prisma with enum/date errors.
    let dueDate: string | null = null;
    if (parsed.dueDate) {
      const parsedDate = new Date(parsed.dueDate);
      if (!Number.isNaN(parsedDate.getTime())) {
        dueDate = parsedDate.toISOString();
      }
    }

    const priority =
      typeof parsed.priority === 'string' &&
      PRIORITIES.includes(parsed.priority.toUpperCase())
        ? (parsed.priority.toUpperCase() as PromptTask['priority'])
        : null;

    return {
      name: typeof parsed.name === 'string' && parsed.name.trim()
        ? parsed.name.trim()
        : userInput,
      description:
        typeof parsed.description === 'string' && parsed.description.trim()
          ? parsed.description.trim()
          : null,
      dueDate,
      priority,
      usedAi: true,
    } as PromptTask;
  } catch (error: any) {
    // Never fail the feature; fall back to the built-in offline parser
    // so the user always gets a usable task.
    return parsePromptOffline(userInput);
  }
}