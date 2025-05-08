'use client';

import type { AppTask } from '@/types';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: AppTask[];
  currentLevelTasks: AppTask[]; // The actual list for reordering at this level
  parentId: string | null; // ID of the parent for these tasks, or null if root
  onUpdateTask: (taskId: string, updates: Partial<Omit<AppTask, 'id' | 'subtasks'>>) => void;
  onAddTask: (parentId: string | null, title: string) => void;
  onDeleteTask: (taskId: string) => void;
  onReorderTask: (taskId: string, direction: 'up' | 'down', taskList: AppTask[], parentId: string | null) => void;
  onToggleComplete: (taskId: string) => void;
  onSetFirstStep: (taskId: string, firstStep: string) => void;
  onSuggestFirstStep: (taskId: string, taskTitle: string) => Promise<void>;
  onToggleFirstStepComplete: (taskId: string) => void;
  onSelectFocusedTask: (taskId: string | null) => void;
  focusedTaskId?: string | null; // The ID of the currently focused task in the entire app
  isLoadingSuggestion: boolean;
  level: number; // Current nesting level
}

export function TaskList({
  tasks,
  currentLevelTasks,
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
  focusedTaskId,
  isLoadingSuggestion,
  level,
}: TaskListProps) {
  if (!tasks || tasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          currentTaskList={currentLevelTasks}
          parentId={parentId}
          onUpdateTask={onUpdateTask}
          onAddTask={onAddTask}
          onDeleteTask={onDeleteTask}
          onReorderTask={onReorderTask}
          onToggleComplete={onToggleComplete}
          onSetFirstStep={onSetFirstStep}
          onSuggestFirstStep={onSuggestFirstStep}
          onToggleFirstStepComplete={onToggleFirstStepComplete}
          onSelectFocusedTask={onSelectFocusedTask}
          isFocused={task.id === focusedTaskId}
          isLoadingSuggestion={isLoadingSuggestion}
          level={level}
        />
      ))}
    </div>
  );
}
