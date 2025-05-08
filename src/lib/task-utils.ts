import type { AppTask, RawTask } from '@/types';

// Helper to generate unique IDs
export const generateId = (): string => crypto.randomUUID();

// Maps raw tasks from LLM to AppTask structure, adding IDs and default states
export function mapRawTasksToAppTasks(
  rawTasks: RawTask[],
  parentIdPath: string = ''
): AppTask[] {
  return rawTasks.map((rawTask, index) => {
    const taskId = `${parentIdPath}${parentIdPath ? '.' : ''}${generateId()}`;
    return {
      id: taskId,
      title: rawTask.title,
      subtasks: rawTask.subtasks
        ? mapRawTasksToAppTasks(rawTask.subtasks, taskId)
        : [],
      isCompleted: false,
      isFirstStepCompleted: false,
      firstStep: '',
      isEditing: false,
    };
  });
}

// Recursive function to find a task and its parent list
function findTaskRecursive(
  tasks: AppTask[],
  taskId: string,
  path: AppTask[] = []
): { task: AppTask | null; parentList: AppTask[] | null; taskIndex: number } {
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (task.id === taskId) {
      return { task, parentList: path.length > 0 ? path[path.length -1].subtasks : tasks, taskIndex: i };
    }
    if (task.subtasks && task.subtasks.length > 0) {
      const found = findTaskRecursive(task.subtasks, taskId, [...path, task]);
      if (found.task) {
        // If found in subtasks, the current tasks array is the parentList for the direct parent of the found task
        // The actual parentList is found.parentList
         return found;
      }
    }
  }
  return { task: null, parentList: null, taskIndex: -1 };
}


// Updates a task in the tree
export function updateTaskInTree(
  tasks: AppTask[],
  taskId: string,
  updates: Partial<AppTask>
): AppTask[] {
  return tasks.map((task) => {
    if (task.id === taskId) {
      return { ...task, ...updates };
    }
    if (task.subtasks && task.subtasks.length > 0) {
      return { ...task, subtasks: updateTaskInTree(task.subtasks, taskId, updates) };
    }
    return task;
  });
}

// Adds a new task to the tree
export function addTaskToTree(
  tasks: AppTask[],
  parentId: string | null,
  newTask: AppTask
): AppTask[] {
  if (!parentId) {
    // Add to root
    return [...tasks, newTask];
  }
  return tasks.map((task) => {
    if (task.id === parentId) {
      return { ...task, subtasks: [...task.subtasks, newTask] };
    }
    if (task.subtasks && task.subtasks.length > 0) {
      return { ...task, subtasks: addTaskToTree(task.subtasks, parentId, newTask) };
    }
    return task;
  });
}

// Deletes a task from the tree
export function deleteTaskFromTree(tasks: AppTask[], taskId: string): AppTask[] {
  return tasks
    .filter((task) => task.id !== taskId)
    .map((task) => {
      if (task.subtasks && task.subtasks.length > 0) {
        return { ...task, subtasks: deleteTaskFromTree(task.subtasks, taskId) };
      }
      return task;
    });
}


// Reorders a task within its current list (root or subtasks of a parent)
export function reorderTaskInTree(
  tasks: AppTask[],
  taskId: string,
  direction: 'up' | 'down'
): AppTask[] {
  const { parentList, taskIndex } = findTaskRecursive(tasks, taskId);

  if (!parentList || taskIndex === -1) return tasks; // Task not found or is root and cannot be reordered with this logic

  const newTasks = [...parentList];
  const taskToMove = newTasks[taskIndex];

  if (direction === 'up' && taskIndex > 0) {
    newTasks.splice(taskIndex, 1);
    newTasks.splice(taskIndex - 1, 0, taskToMove);
  } else if (direction === 'down' && taskIndex < newTasks.length - 1) {
    newTasks.splice(taskIndex, 1);
    newTasks.splice(taskIndex + 1, 0, taskToMove);
  } else {
    return tasks; // Cannot move further
  }
  
  // Need to reconstruct the entire tree if parentList was not the root `tasks` array.
  // This is tricky. The easiest way is if findTaskRecursive also returns the path to the parent list.
  // For simplicity in MVP, this might only work for root tasks or require a more complex update.
  // Let's assume parentList IS the list that needs updating.
  // If it's a subtask list, we need to update the parent task's subtasks.

  // This simplified version assumes findTaskRecursive correctly identifies the list to modify.
  // If tasks === parentList, then it's a root modification.
  // Otherwise, we need to map through the original tasks and replace the subtasks of the parent.
  
  // A simple way if parentList reference works for direct modification (which it does for arrays of objects)
  // The issue is that map returns new arrays, so we need to replace the subtask array in the parent.
  
  // This is a shallow copy of the tree. We need a deep clone and modification.
  // A more robust way:
  function updateParentSubtasks(currentTasks: AppTask[], targetParentList: AppTask[], newSubtasks: AppTask[]): AppTask[] {
    return currentTasks.map(t => {
      if (t.subtasks === targetParentList) {
        return { ...t, subtasks: newSubtasks };
      }
      if (t.subtasks && t.subtasks.length > 0) {
        return { ...t, subtasks: updateParentSubtasks(t.subtasks, targetParentList, newSubtasks) };
      }
      return t;
    });
  }
  
  if (tasks === parentList) { // Modified root list
    return newTasks;
  } else { // Modified a subtask list
     // Find which task in the original `tasks` tree has `parentList` as its `subtasks`
     // This requires knowing the parent of `parentList`.
     // The current `findTaskRecursive` doesn't give this directly.
     // This reorder function will be simplified for MVP: reordering is only applied to the list where the task is found.
     // This means if `parentList` is a sub-array, the original `tasks` array needs to be reconstructed.
     // Let's simplify: the reorder function must be called with the direct list containing the task.
     // So, the main page will call this for root tasks, and TaskItem will call it for its subtasks.

     // The findTaskRecursive will return the *actual* list that needs reordering.
     // If it's a sublist, the original tree needs to be mapped to incorporate the change.

     const applyReorder = (currentTaskList: AppTask[]): AppTask[] => {
        if (currentTaskList === parentList) {
            return newTasks; // This is the list that was reordered
        }
        return currentTaskList.map(task => ({
            ...task,
            subtasks: task.subtasks ? applyReorder(task.subtasks) : []
        }));
     };
     return applyReorder(tasks);
  }
}

// Helper to find a task by ID (without parent context, just the task)
export function findTaskById(tasks: AppTask[], taskId: string): AppTask | null {
  for (const task of tasks) {
    if (task.id === taskId) {
      return task;
    }
    if (task.subtasks && task.subtasks.length > 0) {
      const found = findTaskById(task.subtasks, taskId);
      if (found) {
        return found;
      }
    }
  }
  return null;
}
