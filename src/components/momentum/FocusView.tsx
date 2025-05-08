'use client';

import type { AppTask } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Edit3, Sparkles, Check as CheckIcon, X } from 'lucide-react';
import { Input } from '../ui/input';
import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface FocusViewProps {
  task: AppTask;
  onExitFocusView: () => void;
  onToggleFirstStepComplete: (taskId: string) => void;
  onSetFirstStep: (taskId: string, firstStep: string) => void;
  onSuggestFirstStep: (taskId: string, taskTitle: string) => Promise<void>;
  isLoadingSuggestion: boolean;
}

export function FocusView({
  task,
  onExitFocusView,
  onToggleFirstStepComplete,
  onSetFirstStep,
  onSuggestFirstStep,
  isLoadingSuggestion,
}: FocusViewProps) {
  const [editingFirstStep, setEditingFirstStep] = useState(false);
  const [firstStepText, setFirstStepText] = useState(task.firstStep || '');
  const firstStepInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFirstStepText(task.firstStep || '');
  }, [task.firstStep]);

  useEffect(() => {
    if (editingFirstStep && firstStepInputRef.current) {
      firstStepInputRef.current.focus();
    }
  }, [editingFirstStep]);

  const handleFirstStepSave = () => {
    onSetFirstStep(task.id, firstStepText);
    setEditingFirstStep(false);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-semibold">{task.title}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onExitFocusView} aria-label="Exit focus view">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
          <CardDescription>Focus on this task and its immediate next action.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 p-4 border rounded-lg bg-secondary/30">
            <label htmlFor={`focus-first-step-${task.id}`} className="text-lg font-medium text-primary">
              First Step:
            </label>
            {editingFirstStep ? (
              <div className="flex items-center gap-2">
                <Input
                  id={`focus-first-step-${task.id}`}
                  ref={firstStepInputRef}
                  value={firstStepText}
                  onChange={(e) => setFirstStepText(e.target.value)}
                  placeholder="e.g., Draft email to venue"
                  className="h-10 text-base"
                  aria-label="Edit first step"
                />
                <Button variant="ghost" size="icon" onClick={handleFirstStepSave} aria-label="Save first step" className="h-9 w-9">
                  <CheckIcon className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setEditingFirstStep(false)} aria-label="Cancel editing first step" className="h-9 w-9">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 border rounded-md bg-background min-h-[3rem]">
                <Checkbox
                  id={`focus-complete-first-step-${task.id}`}
                  checked={!!task.isFirstStepCompleted}
                  onCheckedChange={() => onToggleFirstStepComplete(task.id)}
                  aria-label="Mark first step as complete"
                  className="shrink-0 w-5 h-5"
                  disabled={!task.firstStep}
                />
                <span 
                  className={`flex-grow text-base cursor-pointer ${task.isFirstStepCompleted ? 'line-through text-muted-foreground' : ''}`}
                  onClick={() => setEditingFirstStep(true)}
                >
                  {task.firstStep || <span className="text-muted-foreground italic">Define your first step...</span>}
                </span>
                 <Button variant="ghost" size="icon" onClick={() => setEditingFirstStep(true)} aria-label="Edit first step" className="h-7 w-7">
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
             <Button
                variant="outline"
                onClick={() => onSuggestFirstStep(task.id, task.title)}
                disabled={isLoadingSuggestion}
                className="flex-1"
                aria-label="Suggest first step using AI"
              >
                {isLoadingSuggestion ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Suggest First Step
              </Button>
              <Button
                onClick={() => onToggleFirstStepComplete(task.id)}
                disabled={!task.firstStep || task.isFirstStepCompleted}
                className="flex-1 bg-primary hover:bg-primary/90"
                aria-label={task.isFirstStepCompleted ? "First step completed" : "Mark first step as complete"}
              >
                 <CheckIcon className="mr-2 h-4 w-4" />
                {task.isFirstStepCompleted ? 'Step Done!' : 'Complete First Step'}
              </Button>
          </div>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                Marking the first step complete helps build momentum.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
