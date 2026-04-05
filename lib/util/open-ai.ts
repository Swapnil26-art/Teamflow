'use server';

import { Task } from '@/types';

export type PromptTask = Pick<
  Task,
  'name' | 'description' | 'dueDate' | 'priority'
> & { dueDate: string | null };

export async function sendPrompt(userInput: string) {
  if (!userInput) throw new Error('Prompt cannot be empty');

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Groq API key is not configured. Add GROQ_API_KEY to your .env file.');

  const Groq = (await import('groq-sdk')).default;
  const groq = new Groq({ apiKey });

  const prompt = `Create a task object based on the given input: "${userInput}".
Rephrase and enhance the task name and description to be more professional and clear.
If a date expression is given and it represents a relative time (e.g. "tomorrow", "next week", "in 3 days"), calculate the absolute ISO date from the current date: ${new Date().toISOString()}.
If no date is mentioned, set dueDate to null.
Reply ONLY with a valid JSON object — no markdown, no code fences, no explanation:
{
  "name": "string",
  "description": "string",
  "dueDate": "ISO 8601 string or null",
  "priority": "LOW" | "MEDIUM" | "HIGH" | null
}`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 256,
  });

  const rawText = completion.choices[0]?.message?.content;
  if (!rawText) throw new Error('No response from Groq');

  // Strip markdown code fences if present
  const cleaned = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();

  try {
    return JSON.parse(cleaned) as PromptTask;
  } catch {
    throw new Error('Failed to parse Groq response as JSON');
  }
}