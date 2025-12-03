import React, { useState, useRef } from 'react';
import { Task, Theme } from '../types';

interface TaskItemProps {
  task: Task;
  theme: Theme;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, newText: string) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, id: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ 
  task, theme, onToggle, onDelete, onUpdate, 
  draggable, onDragStart, onDragOver, onDrop 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if overdue: compare timestamps (ignoring time component could be safer, but app logic sets due time to end of day)
  const isOverdue = task.dueDate && task.dueDate < Date.now() && !task.completed;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // Reset hours to compare dates only
    const dateNoTime = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowNoTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = dateNoTime.getTime() - nowNoTime.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const handleEditSubmit = () => {
    if (editText.trim() && editText !== task.text) {
      onUpdate(task.id, editText.trim());
    } else {
      setEditText(task.text); // Reset if empty or unchanged
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleEditSubmit();
    if (e.key === 'Escape') {
      setEditText(task.text);
      setIsEditing(false);
    }
  };

  return (
    <div 
      className={`group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition-all mb-3 animate-fade-in-up ${task.completed ? 'border-gray-100' : 'border-gray-200'} ${draggable ? 'cursor-move' : ''}`}
      draggable={draggable && !isEditing}
      onDragStart={(e) => draggable && onDragStart && onDragStart(e, task.id)}
      onDragOver={(e) => draggable && onDragOver && onDragOver(e)}
      onDrop={(e) => draggable && onDrop && onDrop(e, task.id)}
    >
      <div className="flex items-start gap-4 flex-1 w-full">
        <button
          onClick={() => onToggle(task.id)}
          className={`mt-1 sm:mt-0 w-6 h-6 flex-shrink-0 rounded-md border-2 flex items-center justify-center transition-colors ${
            task.completed
              ? `${theme.primaryClass} border-transparent`
              : `border-gray-300 hover:${theme.borderClass}`
          }`}
        >
          {task.completed && (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={handleEditSubmit}
                onKeyDown={handleKeyDown}
                className={`w-full text-lg border-b-2 ${theme.borderClass} focus:outline-none bg-transparent`}
                autoFocus
              />
            ) : (
              <span
                onClick={() => setIsEditing(true)}
                className={`text-gray-800 text-lg transition-all break-words cursor-text hover:text-gray-600 ${
                  task.completed ? 'line-through text-gray-400' : ''
                }`}
                title="Click to edit"
              >
                {task.text}
              </span>
            )}
            
            {!isEditing && (
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium uppercase tracking-wide ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
            )}
          </div>

          {task.dueDate && !isEditing && (
            <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                {formatDate(task.dueDate)}
                {isOverdue && ' (Overdue)'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-center">
        {draggable && (
           <div className="p-2 text-gray-300 cursor-grab active:cursor-grabbing" title="Drag to reorder">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
             </svg>
           </div>
        )}
        <button
          onClick={() => onDelete(task.id)}
          className="p-2 text-gray-400 hover:text-red-500 transition-all rounded-full hover:bg-red-50"
          aria-label="Delete task"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};