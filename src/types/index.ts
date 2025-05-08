export interface AppTask {
  id: string;
  title: string;
  subtasks: AppTask[];
  isCompleted: boolean;
  firstStep?: string;
  isFirstStepCompleted?: boolean;
  // Used to control edit mode locally in TaskItem
  isEditing?: boolean; 
}

// Type for raw tasks from LLM ingestion
export interface RawTask {
  title: string;
  subtasks?: RawTask[];
}
