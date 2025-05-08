'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AppTask, RawTask } from '@/types';
import {
  generateId,
  mapRawTasksToAppTasks,
  updateTaskInTree,
  addTaskToTree,
  deleteTaskFromTree,
  reorderTaskInTree as reorderTaskInTreeUtil,
  findTaskById as findTaskByIdUtil,
} from '@/lib/task-utils';
import { ingestTasks as llmIngestTasks } from '@/ai/flows/llm-task-ingestion';
import { suggestFirstStep as llmSuggestFirstStep } from '@/ai/flows/first-step-suggestion';
import { useToast } from '@/hooks/use-toast';

const TASKS_STORAGE_KEY = 'momentumMvpTasks';

export function useTaskManager() {
  const [tasks, setTasks] = useState<AppTask[]>([]);
  const [isLoadingIngestion, setIsLoadingIngestion] = useState(false);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [isFocusViewActive, setIsFocusViewActive] = useState(false);
  const { toast } = useToast();

  // Load tasks from localStorage on initial mount
  useEffect(() => {
    try {
      const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
    } catch (error) {
      console.error("Failed to load tasks from localStorage", error);
      toast({ title: "Error", description: "Could not load saved tasks.", variant: "destructive" });
    }
  }, [toast]);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error("Failed to save tasks to localStorage", error);
      // Potentially notify user if storage is full or failing
    }
  }, [tasks]);

  const handleIngestTasks = useCallback(async (text: string) => {
    if (!text.trim()) {
      toast({ title: "Input Required", description: "Please enter your problem or tasks.", variant: "destructive" });
      return;
    }
    setIsLoadingIngestion(true);
    try {
      const rawTasks = await llmIngestTasks({ text });
      const newAppTasks = mapRawTasksToAppTasks(rawTasks as RawTask[]); // Cast needed due to AI flow output type
      setTasks(newAppTasks);
      toast({ title: "Success", description: "Tasks ingested successfully!" });
    } catch (error) {
      console.error("Error ingesting tasks:", error);
      toast({ title: "Ingestion Failed", description: "Could not process your tasks. Please try again.", variant: "destructive" });
    } finally {
      setIsLoadingIngestion(false);
    }
  }, [toast]);

  const updateTask = useCallback((taskId: string, updates: Partial<Omit<AppTask, 'id' | 'subtasks'>>) => {
    setTasks(prevTasks => updateTaskInTree(prevTasks, taskId, updates));
  }, []);
  
  const addTask = useCallback((parentId: string | null, title: string) => {
    if (!title.trim()) {
      toast({ title: "Title Required", description: "Task title cannot be empty.", variant: "destructive" });
      return;
    }
    const newTask: AppTask = {
      id: generateId(),
      title,
      subtasks: [],
      isCompleted: false,
      isFirstStepCompleted: false,
      firstStep: '',
      isEditing: false,
    };
    setTasks(prevTasks => addTaskToTree(prevTasks, parentId, newTask));
  }, [toast]);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prevTasks => deleteTaskFromTree(prevTasks, taskId));
    if (focusedTaskId === taskId) {
      setFocusedTaskId(null);
      setIsFocusViewActive(false);
    }
    toast({ title: "Task Deleted", description: "The task has been removed." });
  }, [focusedTaskId, toast]);

  const reorderTask = useCallback((taskId: string, direction: 'up' | 'down', taskList: AppTask[], parentId: string | null) => {
    // This is a bit complex because reorderTaskInTreeUtil needs the immediate list.
    // If parentId is null, taskList is the root `tasks`.
    // If parentId is not null, taskList is the subtasks array of the parent.
    const reorderedList = reorderTaskInTreeUtil(taskList, taskId, direction);
    
    if (parentId === null) {
      setTasks(reorderedList);
    } else {
      // Need to update the parent's subtasks in the main tasks tree
      setTasks(prevTasks => {
        const updateParentSubtasksRecursive = (currentTasks: AppTask[]): AppTask[] => {
          return currentTasks.map(task => {
            if (task.id === parentId) {
              return { ...task, subtasks: reorderedList };
            }
            if (task.subtasks && task.subtasks.length > 0) {
              return { ...task, subtasks: updateParentSubtasksRecursive(task.subtasks) };
            }
            return task;
          });
        };
        return updateParentSubtasksRecursive(prevTasks);
      });
    }
  }, []);


  const toggleTaskComplete = useCallback((taskId: string) => {
    setTasks(prevTasks => 
      updateTaskInTree(prevTasks, taskId, { 
        isCompleted: !(findTaskByIdUtil(prevTasks, taskId)?.isCompleted) 
      })
    );
  }, []);

  const setTaskFirstStep = useCallback((taskId: string, firstStep: string) => {
    updateTask(taskId, { firstStep });
  }, [updateTask]);

  const suggestFirstStep = useCallback(async (taskId: string, taskTitle: string) => {
    setIsLoadingSuggestion(true);
    try {
      const suggestion = await llmSuggestFirstStep({ task: taskTitle });
      updateTask(taskId, { firstStep: suggestion.firstStep });
      toast({ title: "Suggestion Ready", description: "First step suggested." });
    } catch (error) {
      console.error("Error suggesting first step:", error);
      toast({ title: "Suggestion Failed", description: "Could not suggest a first step.", variant: "destructive" });
    } finally {
      setIsLoadingSuggestion(false);
    }
  }, [updateTask, toast]);

  const toggleFirstStepComplete = useCallback((taskId: string) => {
    setTasks(prevTasks => 
      updateTaskInTree(prevTasks, taskId, { 
        isFirstStepCompleted: !(findTaskByIdUtil(prevTasks, taskId)?.isFirstStepCompleted) 
      })
    );
  }, []);

  const selectFocusedTask = useCallback((taskId: string | null) => {
    setFocusedTaskId(taskId);
    if (!taskId) {
      setIsFocusViewActive(false); // Exit focus view if no task is focused
    }
  }, []);

  const toggleFocusView = useCallback(() => {
    if (focusedTaskId) {
      setIsFocusViewActive(prev => !prev);
    } else {
      setIsFocusViewActive(false); // Cannot enter focus view without a focused task
      if (isFocusViewActive) toast({ title: "No Task Selected", description: "Select a task to enter focus view." });
    }
  }, [focusedTaskId, isFocusViewActive, toast]);

  const focusedTask = focusedTaskId ? findTaskByIdUtil(tasks, focusedTaskId) : null;

  return {
    tasks,
    setTasks, // Expose for direct manipulation if needed, e.g. drag-and-drop in future
    isLoadingIngestion,
    isLoadingSuggestion,
    focusedTaskId,
    selectFocusedTask,
    isFocusViewActive,
    toggleFocusView,
    focusedTask,
    handleIngestTasks,
    updateTask,
    addTask,
    deleteTask,
    reorderTask,
    toggleTaskComplete,
    setTaskFirstStep,
    suggestFirstStep,
    toggleFirstStepComplete,
  };
}
