import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { TaskItem } from './components/TaskItem';
import { AIAssistant } from './components/AIAssistant';
import { ContactModal } from './components/ContactModal';
import { LiveVoiceAssistant } from './components/LiveVoiceAssistant';
import { THEMES, MOCK_TASKS } from './constants';
import { User, Task, Theme, SortOption } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[0]);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  
  // New Task State
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>(''); // YYYY-MM-DD format

  // Sorting State
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');

  // Load from local storage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('dailyflow_user');
    const savedTheme = localStorage.getItem('dailyflow_theme');
    const savedTasks = localStorage.getItem('dailyflow_tasks');

    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedTheme) {
      const theme = THEMES.find(t => t.name === savedTheme) || THEMES[0];
      setCurrentTheme(theme);
    }
    if (savedTasks) {
      try {
        const parsed = JSON.parse(savedTasks);
        const migrated = parsed.map((t: any) => ({
          ...t,
          priority: t.priority || 'medium'
        }));
        setTasks(migrated);
      } catch (e) {
        console.error("Failed to parse saved tasks", e);
        setTasks(MOCK_TASKS as Task[]);
      }
    } else {
      setTasks(MOCK_TASKS as Task[]);
    }
  }, []);

  // Persistence effects
  useEffect(() => {
    if (user) localStorage.setItem('dailyflow_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('dailyflow_theme', currentTheme.name);
  }, [currentTheme]);

  useEffect(() => {
    localStorage.setItem('dailyflow_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('dailyflow_user');
  };

  const handleAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskText.trim()) return;
    
    let dueDateTimestamp: number | undefined;

    if (newTaskDueDate) {
      const [year, month, day] = newTaskDueDate.split('-').map(Number);
      dueDateTimestamp = new Date(year, month - 1, day, 23, 59, 59).getTime();
    }

    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText,
      completed: false,
      type: viewMode,
      createdAt: Date.now(),
      priority: newTaskPriority,
      dueDate: dueDateTimestamp,
    };
    
    setTasks(prev => [newTask, ...prev]);
    setNewTaskText('');
    setNewTaskPriority('medium');
    setNewTaskDueDate('');
  };

  const addTasksFromAI = (texts: string[], priority: 'low' | 'medium' | 'high', dueDateStr?: string) => {
    let dueDateTimestamp: number | undefined;
    if (dueDateStr) {
      const [year, month, day] = dueDateStr.split('-').map(Number);
      dueDateTimestamp = new Date(year, month - 1, day, 23, 59, 59).getTime();
    }

    const newTasks: Task[] = texts.map((text, idx) => ({
      id: Date.now().toString() + idx,
      text,
      completed: false,
      type: viewMode,
      createdAt: Date.now() + idx,
      priority: priority,
      dueDate: dueDateTimestamp,
    }));
    setTasks(prev => [...newTasks, ...prev]);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const updateTask = (id: string, newText: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, text: newText } : t));
  }

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    
    if (draggedId === targetId) return;

    // We can only reliably reorder if we are working on the main array or if the sort is stable.
    // Since we are in Manual sort mode, we just reorder the main array.
    setTasks(prev => {
       const newTasks = [...prev];
       const draggedIndex = newTasks.findIndex(t => t.id === draggedId);
       const targetIndex = newTasks.findIndex(t => t.id === targetId);

       if (draggedIndex < 0 || targetIndex < 0) return prev;

       // Remove dragged item
       const [draggedItem] = newTasks.splice(draggedIndex, 1);
       // Insert at target index
       newTasks.splice(targetIndex, 0, draggedItem);
       return newTasks;
    });
  };

  // Sorting Logic
  let displayTasks = tasks.filter(t => t.type === viewMode);

  if (sortBy !== 'manual') {
    displayTasks.sort((a, b) => {
      // Always put completed tasks at the bottom if we aren't explicitly sorting by 'completed'
      if (sortBy !== 'completed' && a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      switch (sortBy) {
        case 'dueDate':
          if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
          return b.createdAt - a.createdAt;
        case 'priority':
          const pMap = { high: 3, medium: 2, low: 1 };
          if (pMap[a.priority] !== pMap[b.priority]) {
            return pMap[b.priority] - pMap[a.priority];
          }
          return b.createdAt - a.createdAt;
        case 'completed':
          return Number(a.completed) - Number(b.completed);
        case 'createdAt':
        default:
          return b.createdAt - a.createdAt;
      }
    });
  }
  // If manual, we basically just respect the array order (filtered by viewMode)

  const completedCount = displayTasks.filter(t => t.completed).length;
  const totalCount = displayTasks.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  if (!user) {
    return <Auth onLogin={handleLogin} theme={currentTheme} />;
  }

  return (
    <div className={`min-h-screen ${currentTheme.bgClass} flex flex-col md:flex-row transition-colors duration-300`}>
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col sticky top-0 h-auto md:h-screen z-10">
        <div className="p-6 flex items-center gap-3">
          {user.avatar ? (
             <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full border border-gray-200 shadow-sm object-cover" />
          ) : (
            <div className={`w-12 h-12 rounded-full ${currentTheme.primaryClass} text-white flex items-center justify-center text-xl font-bold shadow-sm`}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="overflow-hidden">
            <h1 className={`text-xl font-bold ${currentTheme.textClass} truncate`}>DailyFlow</h1>
            <p className="text-sm text-gray-500 truncate" title={user.name}>{user.name}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => setViewMode('day')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              viewMode === 'day' 
                ? `${currentTheme.primaryClass} text-white shadow-lg shadow-${currentTheme.color}/30` 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            My Day
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              viewMode === 'week' 
                ? `${currentTheme.primaryClass} text-white shadow-lg shadow-${currentTheme.color}/30` 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            My Week
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-4">
           {/* Theme Picker */}
           <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Theme</p>
            <div className="flex flex-wrap gap-2">
              {THEMES.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => setCurrentTheme(theme)}
                  className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                    currentTheme.name === theme.name ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                  }`}
                  style={{ backgroundColor: theme.color }}
                  title={theme.name}
                />
              ))}
            </div>
          </div>
          
          <button onClick={() => setIsContactOpen(true)} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact Us
          </button>
          <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">
                {viewMode === 'day' ? "Today's Tasks" : "This Week's Plan"}
              </h2>
              <p className="text-gray-500 mt-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            
            <div className="flex gap-2">
               <button
                onClick={() => setIsLiveVoiceOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium shadow-md transition-all bg-red-500 text-white hover:bg-red-600 animate-pulse"
              >
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                 </svg>
                 Live Voice
              </button>
              
              <button
                onClick={() => setIsAiOpen(!isAiOpen)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium shadow-md transition-all transform hover:-translate-y-0.5 ${
                  isAiOpen ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                {isAiOpen ? 'Close AI' : 'Ask AI'}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
            <div className="flex justify-between items-end mb-2">
              <div>
                <span className="text-3xl font-bold text-gray-800">{completedCount}</span>
                <span className="text-gray-400 text-lg"> / {totalCount} tasks</span>
              </div>
              <span className={`text-lg font-bold ${currentTheme.textClass}`}>{progress}% Done</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${currentTheme.primaryClass}`} 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Sorting Controls */}
          <div className="flex justify-between items-center mb-4">
             <div className="text-sm text-gray-400">
                {sortBy === 'manual' ? 'Drag and drop tasks to reorder' : 'Switch to Manual to reorder'}
             </div>
             <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200">
               <span className="text-sm text-gray-500 font-medium">Sort by:</span>
               <select 
                 value={sortBy} 
                 onChange={(e) => setSortBy(e.target.value as SortOption)}
                 className="text-sm bg-transparent border-none focus:ring-0 text-gray-700 font-medium cursor-pointer outline-none"
               >
                 <option value="createdAt">Newest</option>
                 <option value="priority">Priority</option>
                 <option value="dueDate">Due Date</option>
                 <option value="completed">Status</option>
                 <option value="manual">Manual (Drag & Drop)</option>
               </select>
             </div>
          </div>

          {/* Add Task Input */}
          <form onSubmit={handleAddTask} className="mb-8 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-100 transition-all">
            <div className="relative">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder={`Add a task to your ${viewMode}...`}
                className="w-full pl-4 pr-14 py-3 rounded-xl border-none focus:ring-0 text-lg placeholder-gray-400 focus:outline-none"
              />
              <button 
                type="submit"
                disabled={!newTaskText.trim()}
                className={`absolute right-2 top-2 p-2 rounded-lg transition-colors ${
                  newTaskText.trim() 
                    ? `${currentTheme.primaryClass} text-white ${currentTheme.hoverClass}` 
                    : 'bg-gray-100 text-gray-300'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            
            {/* Task Details (Priority & Due Date) */}
            <div className="flex flex-wrap items-center gap-3 px-4 pb-2 pt-1 border-t border-gray-50 mt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 uppercase">Priority:</span>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as any)}
                  className="text-sm bg-gray-50 border-gray-200 rounded-md px-2 py-1 focus:ring-0 cursor-pointer focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                 <span className="text-xs font-semibold text-gray-400 uppercase">Due:</span>
                 <input 
                   type="date"
                   value={newTaskDueDate}
                   onChange={(e) => setNewTaskDueDate(e.target.value)}
                   className="text-sm bg-gray-50 border-gray-200 rounded-md px-2 py-1 focus:ring-0 cursor-pointer text-gray-600 focus:outline-none"
                 />
              </div>
            </div>
          </form>

          {/* Task List */}
          <div className="space-y-1">
            {displayTasks.length > 0 ? (
              displayTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  theme={currentTheme}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  onUpdate={updateTask}
                  draggable={sortBy === 'manual'}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-gray-50`}>
                   <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                   </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">No tasks yet</h3>
                <p className="text-gray-500 max-w-xs mx-auto mt-1">
                  Add a task manually, ask AI, or try the Live Voice Assistant!
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* AI Assistant Overlay/Sidebar */}
      <AIAssistant 
        isOpen={isAiOpen} 
        onClose={() => setIsAiOpen(false)} 
        theme={currentTheme}
        tasks={displayTasks}
        viewMode={viewMode}
        onAddTasks={addTasksFromAI}
      />

      {/* Live Voice Modal */}
      <LiveVoiceAssistant 
        theme={currentTheme}
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
      />

      {/* Contact Modal */}
      {isContactOpen && (
        <ContactModal theme={currentTheme} onClose={() => setIsContactOpen(false)} />
      )}
    </div>
  );
}