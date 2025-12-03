import React, { useState, useRef, useEffect } from 'react';
import { Theme, Task, ChatMessage } from '../types';
import * as GeminiService from '../services/geminiService';

interface AIAssistantProps {
  theme: Theme;
  tasks: Task[];
  viewMode: 'day' | 'week';
  onAddTasks: (texts: string[], priority: 'low' | 'medium' | 'high', dueDate?: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ 
  theme, tasks, viewMode, onAddTasks, isOpen, onClose 
}) => {
  const [mode, setMode] = useState<'chat' | 'plan'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: `Hi! I'm your Gemini AI assistant. I can help you plan your ${viewMode} or answer questions.` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Plan Defaults
  const [planPriority, setPlanPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [planDueDate, setPlanDueDate] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    if (mode === 'chat') {
      const response = await GeminiService.chatWithAI(userMsg, tasks);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } else {
      // Planning mode
      try {
        const newTasks = await GeminiService.generatePlan(userMsg, viewMode);
        onAddTasks(newTasks, planPriority, planDueDate || undefined);
        setMessages(prev => [...prev, { 
          role: 'model', 
          text: `I've added ${newTasks.length} tasks to your ${viewMode} list based on your goal: "${userMsg}".` 
        }]);
        setMode('chat'); // Reset to chat after planning
      } catch (e) {
        setMessages(prev => [...prev, { role: 'model', text: "Sorry, I couldn't generate a plan. Please try again.", isError: true }]);
      }
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out border-l border-gray-200">
      {/* Header */}
      <div className={`${theme.primaryClass} p-4 text-white flex justify-between items-center`}>
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h2 className="font-bold text-lg">Gemini Assistant</h2>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="p-2 bg-gray-50 border-b border-gray-200 flex gap-2">
        <button 
          onClick={() => setMode('chat')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'chat' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Chat
        </button>
        <button 
          onClick={() => setMode('plan')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'plan' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Generate Plan
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? `${theme.primaryClass} text-white rounded-br-none` 
                  : `bg-white text-gray-800 rounded-bl-none border border-gray-100`
              } ${msg.isError ? 'bg-red-50 border-red-200 text-red-600' : ''}`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-bl-none p-3 border border-gray-100 shadow-sm">
              <div className="flex gap-1.5">
                <div className={`w-2 h-2 rounded-full ${theme.primaryClass} animate-bounce`} style={{ animationDelay: '0ms' }}></div>
                <div className={`w-2 h-2 rounded-full ${theme.primaryClass} animate-bounce`} style={{ animationDelay: '150ms' }}></div>
                <div className={`w-2 h-2 rounded-full ${theme.primaryClass} animate-bounce`} style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Planning Configuration Options */}
      {mode === 'plan' && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex gap-2 text-xs">
           <div className="flex-1">
             <label className="block text-gray-500 mb-1">Default Priority</label>
             <select 
               value={planPriority} 
               onChange={(e) => setPlanPriority(e.target.value as any)}
               className="w-full rounded border-gray-300 py-1"
             >
               <option value="low">Low</option>
               <option value="medium">Medium</option>
               <option value="high">High</option>
             </select>
           </div>
           <div className="flex-1">
             <label className="block text-gray-500 mb-1">Default Due Date</label>
             <input 
               type="date" 
               value={planDueDate}
               onChange={(e) => setPlanDueDate(e.target.value)}
               className="w-full rounded border-gray-300 py-1 text-gray-600" 
             />
           </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="mb-2 text-xs text-gray-400 font-medium uppercase tracking-wider">
          {mode === 'chat' ? 'Ask gemini 3 pro...' : `What is your goal?`}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={mode === 'chat' ? "How can I be more productive?" : "e.g., Learn basic French"}
            className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:outline-none ${theme.ringClass}`}
            autoFocus
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`px-4 py-2 rounded-lg text-white font-medium ${theme.primaryClass} ${theme.hoverClass} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          >
            <svg className="w-5 h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};