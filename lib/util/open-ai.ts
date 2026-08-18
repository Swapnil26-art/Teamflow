'use server';

import { Task } from '@/types';

export type PromptTask = Pick<
  Task,
  'name' | 'description' | 'dueDate' | 'priority'
> & { dueDate: string | null };

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

export async function sendPrompt(userInput: string) {
  if (!userInput || !userInput.trim()) {
    throw new Error('Prompt cannot be empty');
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      'AI API key is not configured. Please add GROQ_API_KEY to your .env file.',
    );
  }

  try {
    const Groq = (await import('groq-sdk')).default;
    const groq = new Groq({ apiKey });

    const prompt = `You are a helpful task organizer assistant. Create a task object based on the user's input: "${userInput}".
Rephrase and enhance the task name and description to be professional, actionable, and clear.
If a date or time expression is mentioned (e.g. "tomorrow", "next Monday", "in 3 days", "at 5pm"), calculate the corresponding ISO 8601 string starting from now: ${new Date().toISOString()}.
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
      model: 'llama-3.3-70b-versatile',
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
    } as PromptTask;
  } catch (error: any) {
    if (error?.status === 401 || error?.message?.includes('API key')) {
      throw new Error('Invalid or expired AI API key in .env file.');
    }
    if (error?.status === 404 || error?.message?.includes('model')) {
      throw new Error('AI Model is unavailable. Please check the configured model name.');
    }
    throw new Error(error?.message || 'Failed to process AI task prompt');
  }
}