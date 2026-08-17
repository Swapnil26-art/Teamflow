'use server';

import { Task } from '@/types';

export type PromptTask = Pick<
  Task,
  'name' | 'description' | 'dueDate' | 'priority'
> & { dueDate: string | null };

export async function sendPrompt(userInput: string) {
<<<<<<< HEAD
  if (!userInput || !userInput.trim()) {
    throw new Error('Prompt cannot be empty');
  }

  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'AI API key is not configured. Please add GROQ_API_KEY to your .env file.',
    );
  }

  try {
    const Groq = (await import('groq-sdk')).default;
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || apiKey });

    const prompt = `You are a helpful task organizer assistant. Create a task object based on the user's input: "${userInput}".
Rephrase and enhance the task name and description to be professional, actionable, and clear.
If a date or time expression is mentioned (e.g. "tomorrow", "next Monday", "in 3 days", "at 5pm"), calculate the corresponding ISO 8601 string starting from now: ${new Date().toISOString()}.
If no date is mentioned, set dueDate to null.
Infer priority if implied (e.g., "urgent", "important", "asap" -> "HIGH", "minor", "low" -> "LOW", else "MEDIUM" or null).
You MUST respond with a valid JSON object matching this schema:
=======
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
>>>>>>> 7de1e5e165c9359a96fc1fe487ab1261117b1460
{
  "name": "string",
  "description": "string",
  "dueDate": "ISO 8601 string or null",
  "priority": "LOW" | "MEDIUM" | "HIGH" | null
}`;

<<<<<<< HEAD
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
    return {
      name: parsed.name || userInput,
      description: parsed.description || null,
      dueDate: parsed.dueDate || null,
      priority: parsed.priority || null,
    } as PromptTask;
  } catch (error: any) {
    if (error?.status === 401 || error?.message?.includes('API key')) {
      throw new Error('Invalid or expired AI API key in .env file.');
    }
    if (error?.status === 404 || error?.message?.includes('model')) {
      throw new Error('AI Model is unavailable. Please check the configured model name.');
    }
    throw new Error(error?.message || 'Failed to process AI task prompt');
=======
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
>>>>>>> 7de1e5e165c9359a96fc1fe487ab1261117b1460
  }
}