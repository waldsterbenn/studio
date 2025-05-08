'use client';

import type { AppTask } from '@/types';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Edit3, Trash2, PlusCircle, ChevronUp, ChevronDown, X, Check as CheckIcon, Sparkles, Focus, ChevronsUpDown } from 'lucide-react';
import { TaskList } from './TaskList'; // For subtasks
import { useToast } from '@/hooks/use-toast';

interface TaskItemProps {
  task: AppTask;
  currentTaskList: AppTask[]; // The list this task belongs to (root or subtask list of a parent)
  parentId: string | null; // ID of the parent task, or null if root
  onUpdateTask: (taskId: string, updates: Partial<Omit<AppTask, 'id' | 'subtasks'>>) => void;
  onAddTask: (parentId: string | null, title: string) => void;
  onDeleteTask: (taskId: string) => void;
  onReorderTask: (taskId: string, direction: 'up' | 'down', taskList: AppTask[], parentId: string | null) => void;
  onToggleComplete: (taskId: string) => void;
  onSetFirstStep: (taskId: string, firstStep: string) => void;
  onSuggestFirstStep: (taskId: string, taskTitle: string) => Promise<void>;
  onToggleFirstStepComplete: (taskId: string) => void;
  onSelectFocusedTask: (taskId: string | null) => void;
  isFocused: boolean;
  isLoadingSuggestion: boolean;
  level: number; // For indentation
}

export function TaskItem({
  task,
  currentTaskList,
  parentId,
  onUpdateTask,
  onAddTask,
  onDeleteTask,
  onReorderTask,
  onToggleComplete,
  onSetFirstStep,
  onSuggestFirstStep,
  onToggleFirstStepComplete,
  onSelectFocusedTask,
  isFocused,
  isLoadingSuggestion,
  level,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(task.isEditing ?? false);
  const [editText, setEditText] = useState(task.title);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [editingFirstStep, setEditingFirstStep] = useState(false);
  const [firstStepText, setFirstStepText] = useState(task.firstStep || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const firstStepInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    if (editingFirstStep && firstStepInputRef.current) {
      firstStepInputRef.current.focus();
    }
  }, [editingFirstStep]);
  
  useEffect(() => {
    // Sync local state if task prop changes (e.g., from LLM suggestion)
    setFirstStepText(task.firstStep || '');
  }, [task.firstStep]);


  const handleTitleSave = () => {
    if (editText.trim() === '') {
      toast({ title: "Error", description: "Task title cannot be empty.", variant: "destructive"});
      setEditText(task.title); // Reset to original title
    } else {
      onUpdateTask(task.id, { title: editText, isEditing: false });
    }
    setIsEditing(false);
  };

  const handleAddSubtask = () => {
    if (newSubtaskText.trim() === '') {
      toast({ title: "Error", description: "Subtask title cannot be empty.", variant: "destructive"});
      return;
    }
    onAddTask(task.id, newSubtaskText);
    setNewSubtaskText('');
  };

  const handleFirstStepSave = () => {
    onSetFirstStep(task.id, firstStepText);
    setEditingFirstStep(false);
  };
  
  const cardClasses = `
    mb-3 
    ${task.isCompleted ? 'bg-secondary/50 opacity-70' : 'bg-card'}
    ${isFocused ? 'ring-2 ring-primary shadow-lg' : 'shadow-md'}
    border rounded-lg
  `;

  const taskTitleClasses = `
    font-medium text-lg group-hover:text-primary transition-colors
    ${task.isCompleted ? 'line-through text-muted-foreground' : 'text-card-foreground'}
  `;

  return (
    <Card className={cardClasses} style={{ marginLeft: `${level * 1.5}rem` }}>
      <CardHeader className="p-3 flex flex-row items-center justify-between group">
        <div className="flex items-center gap-2 flex-grow min-w-0">
          <Checkbox
            id={`complete-${task.id}`}
            checked={task.isCompleted}
            onCheckedChange={() => onToggleComplete(task.id)}
            aria-label={`Mark task ${task.title} as complete`}
            className="shrink-0"
          />
          {isEditing ? (
            <Input
              ref={inputRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              className="h-8 text-lg"
              aria-label="Edit task title"
            />
          ) : (
            <button onClick={() => onSelectFocusedTask(task.id)} className="truncate text-left">
              <span className={taskTitleClasses}>{task.title}</span>
            </button>
          )}
        </div>
        <div className="flex items-center space-x-1 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => onReorderTask(task.id, 'up', currentTaskList, parentId)} aria-label="Move task up" className="h-7 w-7" disabled={task.isCompleted}>
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onReorderTask(task.id, 'down', currentTaskList, parentId)} aria-label="Move task down" className="h-7 w-7" disabled={task.isCompleted}>
            <ChevronDown className="h-4 w-4" />
          </Button>
          {!isEditing && (
             <Button variant="ghost" size="icon" onClick={() => { setIsEditing(true); onUpdateTask(task.id, {isEditing: true});}} aria-label="Edit task" className="h-7 w-7" disabled={task.isCompleted}>
              <Edit3 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => onDeleteTask(task.id)} aria-label="Delete task" className="h-7 w-7 text-destructive hover:text-destructive-foreground hover:bg-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!task.isCompleted && isFocused && (
        <CardContent className="p-3 pt-0 space-y-3">
          <div className="space-y-1">
            <label htmlFor={`first-step-${task.id}`} className="text-sm font-medium text-primary">First Step</label>
            {editingFirstStep ? (
              <div className="flex items-center gap-2">
                <Input
                  id={`first-step-${task.id}`}
                  ref={firstStepInputRef}
                  value={firstStepText}
                  onChange={(e) => setFirstStepText(e.target.value)}
                  placeholder="e.g., Draft email to venue"
                  className="h-8"
                  aria-label="Edit first step"
                />
                <Button variant="ghost" size="icon" onClick={handleFirstStepSave} aria-label="Save first step" className="h-8 w-8">
                  <CheckIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setEditingFirstStep(false)} aria-label="Cancel editing first step" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-background">
                 <Checkbox
                    id={`complete-first-step-${task.id}`}
                    checked={!!task.isFirstStepCompleted}
                    onCheckedChange={() => onToggleFirstStepComplete(task.id)}
                    aria-label="Mark first step as complete"
                    className="shrink-0"
                    disabled={!task.firstStep}
                  />
                <span 
                  className={`flex-grow cursor-pointer ${task.isFirstStepCompleted ? 'line-through text-muted-foreground' : ''}`}
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSuggestFirstStep(task.id, task.title)}
              disabled={isLoadingSuggestion}
              aria-label="Suggest first step using AI"
            >
              {isLoadingSuggestion ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Suggest First Step
            </Button>
           
          </div>
        </CardContent>
      )}

      {!task.isCompleted && (task.subtasks.length > 0 || isFocused) && (
        <CardContent className="p-3 pt-0">
           {task.subtasks.length > 0 && (
            <div className="mt-2">
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Sub-tasks:</h4>
                 <TaskList
                    tasks={task.subtasks}
                    currentLevelTasks={task.subtasks}
                    parentId={task.id}
                    onUpdateTask={onUpdateTask}
                    onAddTask={onAddTask}
                    onDeleteTask={onDeleteTask}
                    onReorderTask={onReorderTask}
                    onToggleComplete={onToggleComplete}
                    onSetFirstStep={onSetFirstStep}
                    onSuggestFirstStep={onSuggestFirstStep}
                    onToggleFirstStepComplete={onToggleFirstStepComplete}
                    onSelectFocusedTask={onSelectFocusedTask}
                    focusedTaskId={isFocused ? null : undefined} // Pass null if parent is focused to avoid sub-focus, undefined otherwise
                    isLoadingSuggestion={isLoadingSuggestion}
                    level={level + 1}
                 />
            </div>
           )}
        </CardContent>
      )}

      {!task.isCompleted && isFocused && (
        <CardFooter className="p-3 pt-0">
          <div className="flex items-center gap-2 w-full">
            <Input
              type="text"
              placeholder="Add a new sub-task..."
              value={newSubtaskText}
              onChange={(e) => setNewSubtaskText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
              className="h-8 flex-grow"
              aria-label="New sub-task title"
            />
            <Button variant="ghost" size="icon" onClick={handleAddSubtask} aria-label="Add sub-task" className="h-8 w-8">
              <PlusCircle className="h-5 w-5 text-primary" />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
