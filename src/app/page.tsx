'use client';

import { useTaskManager } from '@/hooks/use-task-manager';
import { TaskInputForm } from '@/components/momentum/TaskInputForm';
import { TaskList } from '@/components/momentum/TaskList';
import { FocusView } from '@/components/momentum/FocusView';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Focus, ListChecks, PlusCircle, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Home() {
  const {
    tasks,
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
  } = useTaskManager();

  const handleAddNewRootTask = () => {
    // A prompt or inline input could be used here. For MVP, let's add with a default title.
    const newTitle = prompt("Enter title for new root task:", "New Task");
    if (newTitle) {
      addTask(null, newTitle);
    }
  };

  const clearAllTasks = () => {
    if (confirm("Are you sure you want to delete all tasks? This cannot be undone.")) {
      // A bit of a hack, iterating delete, but fine for MVP
      // Create a copy of IDs to iterate over, as tasks array will mutate
      const taskIdsToDelete = tasks.map(task => task.id);
      taskIdsToDelete.forEach(id => deleteTask(id));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 py-8 px-4 flex flex-col items-center">
      <header className="mb-8 text-center">
        <h1 className="text-5xl font-bold text-primary">Momentum</h1>
        <p className="text-xl text-foreground/80 mt-2">
          Turn overwhelming problems into clear, manageable steps.
        </p>
      </header>

      <main className="w-full max-w-3xl space-y-8">
        <TaskInputForm onIngestTasks={handleIngestTasks} isLoading={isLoadingIngestion} />

        {tasks.length > 0 && (
          <Card className="shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">Your Task Canvas</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleAddNewRootTask} aria-label="Add new root task">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Task
                </Button>
                 {focusedTaskId && (
                   <Button variant="default" size="sm" onClick={toggleFocusView} aria-label={isFocusViewActive ? "Exit Focus View" : "Enter Focus View"}>
                     <Focus className="mr-2 h-4 w-4" /> {isFocusViewActive ? "Exit Focus" : "Focus Mode"}
                   </Button>
                 )}
                <Button variant="destructive" size="sm" onClick={clearAllTasks} aria-label="Clear all tasks">
                  <Trash2 className="mr-2 h-4 w-4" /> Clear All
                </Button>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-4 md:p-6">
              <ScrollArea className="h-[calc(100vh-20rem)] max-h-[600px] pr-3"> {/* Adjust height as needed */}
                <TaskList
                  tasks={tasks}
                  currentLevelTasks={tasks} // For root level, task list is the main tasks array
                  parentId={null} // Root tasks have no parent
                  onUpdateTask={updateTask}
                  onAddTask={addTask}
                  onDeleteTask={deleteTask}
                  onReorderTask={reorderTask}
                  onToggleComplete={toggleTaskComplete}
                  onSetFirstStep={setTaskFirstStep}
                  onSuggestFirstStep={suggestFirstStep}
                  onToggleFirstStepComplete={toggleFirstStepComplete}
                  onSelectFocusedTask={selectFocusedTask}
                  focusedTaskId={focusedTaskId}
                  isLoadingSuggestion={isLoadingSuggestion}
                  level={0}
                />
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {isFocusViewActive && focusedTask && (
          <FocusView
            task={focusedTask}
            onExitFocusView={toggleFocusView}
            onToggleFirstStepComplete={toggleFirstStepComplete}
            onSetFirstStep={setTaskFirstStep}
            onSuggestFirstStep={suggestFirstStep}
            isLoadingSuggestion={isLoadingSuggestion}
          />
        )}
      </main>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Momentum MVP. Start small, gain momentum.</p>
      </footer>
    </div>
  );
}
