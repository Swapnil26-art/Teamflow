'use client';

import 'regenerator-runtime/runtime';
import * as React from 'react';
import _uniqueId from 'lodash/uniqueId';

import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/seperator';
import { Input } from '@/components/ui/input';
import { PromptTask, sendPrompt } from '@/lib/util/open-ai';
import TaskSuggestion, { taskSuggestions } from '@/components/task-suggestion';
import { Icons } from '@/components/ui/icons';
import { TaskService } from '@/services/task-service';
import { handleError } from '@/lib/util/error';
import { Badge } from './ui/badge';

export default function PromptForm({
  preview,
  onClose,
}: {
  preview?: boolean;
  onClose?: () => void;
}) {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  const router = useRouter();
  const [prompt, setPrompt] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [suggestion, setSuggestion] = React.useState<PromptTask | null>(null);

  // Text that existed before the user hit record. Dictation is appended to
  // it instead of replacing what they already typed.
  const promptBeforeDictation = React.useRef('');

  const onClear = React.useCallback(() => {
    setSuggestion(null);
    setPrompt('');
    promptBeforeDictation.current = '';
    resetTranscript();
  }, [resetTranscript]);

  // Sync dictation into the prompt while listening, so interim results show
  // up live and the final transcript is kept once recognition stops.
  React.useEffect(() => {
    if (!listening || !transcript) return;

    const combined = [promptBeforeDictation.current, transcript]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    setPrompt(combined);
  }, [listening, transcript]);

  const stopListening = React.useCallback(async () => {
    try {
      await SpeechRecognition.stopListening();
    } catch {
      // Ignore: the browser may already have stopped the recognizer.
    }
  }, []);

  // Release the microphone when the dialog unmounts.
  React.useEffect(
    () => () => {
      SpeechRecognition.abortListening().catch(() => {});
    },
    [],
  );

  const onSubmitPrompt = async (promptText: string) => {
    const value = promptText.trim();

    if (!value) {
      toast.error('Please describe the task first.');
      return;
    }

    if (listening) {
      await stopListening();
    }

    try {
      setIsLoading(true);

      if (preview) {
        setPrompt('Go to the grocery store');
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            setSuggestion({
              name: 'Grocery Shopping Excursion',
              description: 'Acquire Essential Items for Home and Daily Needs',
              dueDate: null,
              priority: 'MEDIUM',
            });
            resolve();
          }, 700);
        });
        return;
      }

      const { timeZone } = Intl.DateTimeFormat().resolvedOptions();
      const result = await sendPrompt(value, timeZone);

      if (!result.usedAi) {
        toast(
          'AI is not configured (or unreachable) — created the task with the built-in parser.',
        );
      }

      setSuggestion(result);
      setPrompt('');
      resetTranscript();
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onConfirm = async () => {
    if (!suggestion || preview) {
      onClear();
      toast.success('Task created!');
      onClose?.();
      return;
    }

    setIsLoading(true);
    try {
      await TaskService.createTask({
        name: suggestion.name,
        description: suggestion.description ?? null,
        dueDate: suggestion.dueDate ?? null,
        priority: suggestion.priority ?? null,
      });
      toast.success('Task created!');
      onClear();
      router.refresh();
      onClose?.();
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onDiscard = () => {
    setSuggestion(null);
  };

  const toggleListening = async () => {
    if (listening) {
      await stopListening();
      return;
    }

    if (!browserSupportsSpeechRecognition) {
      toast.error(
        'Voice input is not supported in this browser. Try Chrome, Edge or Safari.',
      );
      return;
    }

    if (isMicrophoneAvailable === false) {
      toast.error(
        'Microphone access is blocked. Allow it in your browser settings and try again.',
      );
      return;
    }

    promptBeforeDictation.current = prompt.trim();
    resetTranscript();

    try {
      await SpeechRecognition.startListening({
        continuous: true,
        interimResults: true,
        language: navigator.language || 'en-US',
      });
    } catch {
      toast.error(
        'Microphone unavailable or permission denied. Check your browser permissions.',
      );
    }
  };

  const sendDisabled = isLoading || (!suggestion && !prompt.trim());

  return (
    <div>
      <div className="text-lg font-semibold p-4 flex-gap">
        <Icons.Sparkles className="w-4 h-4 text-primary" />
        Generate AI task
        {preview && <Badge variant="secondary">Preview</Badge>}
      </div>
      <Separator />
      <div className="p-2">
        {suggestion ? (
          <div className="max-h-64 overflow-y-auto">
            {!isLoading && (
              <TaskSuggestion
                suggestion={suggestion}
                key={_uniqueId('ai_suggestion_')}
                onDiscard={onDiscard}
              />
            )}
          </div>
        ) : (
          <div className="md:grid md:grid-cols-2 space-y-2 md:space-y-0 md:gap-2">
            {!isLoading &&
              taskSuggestions.map((taskSuggestion) => (
                <TaskSuggestion.Empty
                  onClick={() =>
                    onSubmitPrompt(
                      `${taskSuggestion.name} ${taskSuggestion.description}`,
                    )
                  }
                  key={_uniqueId('task_suggestion_')}
                  name={taskSuggestion.name}
                  description={taskSuggestion.description}
                />
              ))}
          </div>
        )}
        {isLoading && <TaskSuggestion.Loading />}
      </div>
      <Separator />
      <div className="m-2 mb-0 rounded-sm flex items-center border bg-background">
        <Input
          placeholder={listening ? 'Listening…' : 'Write prompt...'}
          className="rounded-none"
          transparent
          value={prompt}
          onChange={(e) => {
            if (suggestion) {
              setSuggestion(null);
            }
            if (listening) {
              promptBeforeDictation.current = e.target.value;
              resetTranscript();
            }
            setPrompt(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isLoading && prompt.trim()) {
              e.preventDefault();
              if (suggestion) {
                onConfirm();
              } else {
                onSubmitPrompt(prompt);
              }
            }
          }}
        />
      </div>
      <div className="flex-gap justify-end px-2 py-2">
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={onClear}
            disabled={isLoading}
          >
            Clear
          </Button>
          <div>
            {browserSupportsSpeechRecognition && (
              <Button
                type="button"
                size="sm"
                variant={listening ? 'default' : 'secondary'}
                onClick={toggleListening}
                title={listening ? 'Stop voice input' : 'Start voice input'}
                aria-label={listening ? 'Stop voice input' : 'Start voice input'}
                disabled={isLoading}
              >
                <Icons.Mic
                  className={`w-4 h-4 ${listening ? 'animate-pulse' : ''}`}
                />
              </Button>
            )}
          </div>
          <Button
            onClick={() => {
              if (suggestion) {
                onConfirm();
              } else {
                onSubmitPrompt(prompt);
              }
            }}
            type="button"
            size="sm"
            disabled={sendDisabled}
            loading={isLoading}
          >
            {suggestion ? 'Use Suggestion' : 'Send Prompt'}
          </Button>
        </div>
      </div>
      {!browserSupportsSpeechRecognition && (
        <p className="px-3 pb-3 text-xs text-muted-foreground">
          Voice input needs a Chromium-based browser (Chrome/Edge) or Safari.
        </p>
      )}
      {browserSupportsSpeechRecognition && isMicrophoneAvailable === false && (
        <p className="px-3 pb-3 text-xs text-destructive">
          Microphone access is blocked. Allow it in your browser settings to
          use voice input.
        </p>
      )}
    </div>
  );
}
