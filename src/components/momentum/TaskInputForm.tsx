'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface TaskInputFormProps {
  onIngestTasks: (text: string) => Promise<void>;
  isLoading: boolean;
}

export function TaskInputForm({ onIngestTasks, isLoading }: TaskInputFormProps) {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onIngestTasks(inputText);
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Break Down Your Challenge</CardTitle>
        <CardDescription>
          Describe your problem or list of tasks in natural language. We'll help you structure it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="e.g., Plan Leo's birthday party: find venue, send invites, get cake, plan activities..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={5}
            className="text-base"
            disabled={isLoading}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              'Structure Tasks'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
