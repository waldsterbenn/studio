/**
 * Represents a task with a title and optional subtasks.
 */
export interface Task {
  /**
   * The title of the task.
   */
  title: string;
  /**
   * An array of subtasks, each of which is a Task object.
   */
  subtasks?: Task[];
}

/**
 * Asynchronously ingests tasks from natural language text.
 *
 * @param text The natural language text describing the problem or list of tasks.
 * @returns A promise that resolves to an array of Task objects representing the structured list.
 */
export async function ingestTasks(text: string): Promise<Task[]> {
  // TODO: Implement this by calling an API.

  return [
    {
      title: 'Find a venue',
    },
    {
      title: 'Send invites',
    },
    {
      title: 'Get a cake',
    },
    {
      title: 'Plan activities',
    },
  ];
}
