export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  // Optional time in HH:mm format (24h). null or undefined means no time set.
  time?: string | null;
  createdAt: string;
}

export type TaskList = Task[];
