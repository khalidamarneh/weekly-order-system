// src/components/Notification.jsx
import React from 'react';
import { XIcon } from '@heroicons/react/outline';

const Notification = ({ notification, onRemove }) => {
  const getBgColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-100 border-green-400 text-green-800';
      case 'warning': return 'bg-yellow-100 border-yellow-400 text-yellow-800';
      case 'error': return 'bg-red-100 border-red-400 text-red-800';
      default: return 'bg-blue-100 border-blue-400 text-blue-800';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 border-l-4 rounded-lg shadow-lg p-4 min-w-80 max-w-md transition-all duration-300 animate-in slide-in-from-right ${getBgColor(notification.type)}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <span className="text-lg mr-2">{getIcon(notification.type)}</span>
          <div className="flex-1">
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        </div>
        <button
          onClick={() => onRemove(notification.id)}
          className="ml-4 flex-shrink-0 text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Notification;