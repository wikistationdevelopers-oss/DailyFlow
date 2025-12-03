export interface Task {
  id: string;
  text: string;
  completed: boolean;
  type: 'day' | 'week';
  createdAt: number;
  priority: 'low' | 'medium' | 'high';
  dueDate?: number;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  isGuest: boolean;
}

export interface Theme {
  name: string;
  color: string; // Hex for inline styles if needed
  primaryClass: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  hoverClass: string;
  ringClass: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export type SortOption = 'createdAt' | 'dueDate' | 'priority' | 'completed' | 'manual';