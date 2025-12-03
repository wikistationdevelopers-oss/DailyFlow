import { Theme } from './types';

export const THEMES: Theme[] = [
  {
    name: 'Ocean Blue',
    color: '#3b82f6',
    primaryClass: 'bg-blue-600',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    textClass: 'text-blue-600',
    hoverClass: 'hover:bg-blue-700',
    ringClass: 'ring-blue-500',
  },
  {
    name: 'Royal Purple',
    color: '#9333ea',
    primaryClass: 'bg-purple-600',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
    textClass: 'text-purple-600',
    hoverClass: 'hover:bg-purple-700',
    ringClass: 'ring-purple-500',
  },
  {
    name: 'Emerald Green',
    color: '#10b981',
    primaryClass: 'bg-emerald-600',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    textClass: 'text-emerald-600',
    hoverClass: 'hover:bg-emerald-700',
    ringClass: 'ring-emerald-500',
  },
  {
    name: 'Rose Pink',
    color: '#e11d48',
    primaryClass: 'bg-rose-600',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-200',
    textClass: 'text-rose-600',
    hoverClass: 'hover:bg-rose-700',
    ringClass: 'ring-rose-500',
  },
  {
    name: 'Sunset Orange',
    color: '#f97316',
    primaryClass: 'bg-orange-600',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-200',
    textClass: 'text-orange-600',
    hoverClass: 'hover:bg-orange-700',
    ringClass: 'ring-orange-500',
  },
];

export const MOCK_TASKS = [
  { id: '1', text: 'Welcome to DailyFlow!', completed: false, type: 'day', createdAt: Date.now(), priority: 'high' },
  { id: '2', text: 'Try asking the AI for a plan.', completed: false, type: 'day', createdAt: Date.now(), priority: 'medium' },
];