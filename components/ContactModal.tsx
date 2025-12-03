import React from 'react';
import { Theme } from '../types';

interface ContactModalProps {
  theme: Theme;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ theme, onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-up">
        <div className={`${theme.primaryClass} p-6 text-white flex justify-between items-center`}>
          <h2 className="text-xl font-bold">Contact Us</h2>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-600">
            Have feedback or need help? We'd love to hear from you.
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${theme.ringClass}`}>
                <option>General Inquiry</option>
                <option>Bug Report</option>
                <option>Feature Request</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea 
                rows={4} 
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${theme.ringClass}`}
                placeholder="How can we help?"
              ></textarea>
            </div>
          </div>

          <div className="pt-2">
            <button 
              onClick={() => { alert('Message sent!'); onClose(); }}
              className={`w-full py-3 rounded-lg text-white font-medium shadow-md ${theme.primaryClass} ${theme.hoverClass} transition-colors`}
            >
              Send Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};