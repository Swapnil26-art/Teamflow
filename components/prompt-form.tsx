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
import { Badge } from './ui/badge';

export default function PromptForm({ preview }: { preview?: boolean }) {
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

  const onClear = React.useCallback(() => {
    setSuggestion(null);
    setPrompt('');
    resetTranscript();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTranscript]);

  // Only sync dictation transcript into the prompt while listening, so
  // speaking never wipes text the user typed manually beforehand.
  React.useEffect(() => {
    if (listening && transcript) {
      setPrompt(transcript);
    }
  }, [listening, transcript]);

  const onSubmitPrompt = async (promptText: string) => {
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
          }, 1000);
        });
      } else {
        const result = await sendPrompt(promptText);
        setSuggestion(result);
        setPrompt('');
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Oops. Something went wrong.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onConfirm = async () => {
    if (!suggestion || preview) {
      onClear();
      toast.success('Task created!');
      return;
    }
    setIsLoading(true);
    try {
      await TaskService.createTask(suggestion);
      toast.success('Task created!');
      onClear();
      router.refresh();
    } catch (error) {
      toast.error('Oops. Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const onDiscard = () => {
    setSuggestion(null);
  };

  const toggleListening = async () => {
    if (listening) {
      try {
        await SpeechRecognition.stopListening();
      } catch (error) {
        toast.error('Could not stop voice input.');
      }
      return;
    }
    try {
      const speechApi = SpeechRecognition as unknown as {
        browserSupportsContinuousListening: () => boolean;
      };
      const supportsContinuous =
        typeof speechApi.browserSupportsContinuousListening === 'function'
          ? speechApi.browserSupportsContinuousListening()
          : true;
      await SpeechRecognition.startListening({
        continuous: supportsContinuous,
        interimResults: true,
      });
    } catch (error) {
      toast.error('Microphone unavailable or permission denied.');
    }
  };

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
          placeholder="Write prompt..."
          className="rounded-none "
          transparent
          value={prompt}
          onChange={(e) => {
            if (suggestion) {
              setSuggestion(null);
            }
            setPrompt(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isLoading && prompt.trim()) {
              e.preventDefault();
              suggestion ? onConfirm() : onSubmitPrompt(prompt);
            }
          }}
        />
      </div>
      <div className="flex-gap justify-end px-2 py-2">
        <div className="flex items-center justify-end gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={onClear}>
            Clear
          </Button>
          <div>
            {browserSupportsSpeechRecognition && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={!isMicrophoneAvailable}
                onClick={toggleListening}
                title={
                  listening ? 'Stop voice input' : 'Start voice input'
                }
              >
                {listening ? (
                  <Icons.Mic className="w-4 h-4" />
                ) : (
                  <Icons.MicOff className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
          <Button
            onClick={() => {
              suggestion ? onConfirm() : onSubmitPrompt(prompt);
            }}
            type="button"
            size="sm"
            disabled={isLoading || (!suggestion && !prompt.trim())}
          >
            {suggestion ? 'Use Suggestion' : 'Send Prompt'}
          </Button>
        </div>
      </div>
    </div>
  );
}
