// src/components/CustomMessageBanner.jsx
import React from 'react';

const CustomMessageBanner = ({ message, isDarkMode, onClose }) => {
  if (!message) return null;

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2`}>
      <div className={`rounded-lg border p-3 text-center animate-pulse relative ${
        isDarkMode ? 'bg-yellow-900 border-yellow-700' : 'bg-yellow-50 border-yellow-200'
      }`}>
        <button
          onClick={onClose}
          className={`absolute top-2 right-2 p-1 rounded-full ${
            isDarkMode ? 'text-yellow-200 hover:bg-yellow-800' : 'text-yellow-800 hover:bg-yellow-100'
          }`}
          aria-label="Close message"
        >
          ✕
        </button>
        <p className={`text-sm font-medium ${
          isDarkMode ? 'text-yellow-200' : 'text-yellow-800'
        }`}>
          {message}
        </p>
      </div>
    </div>
  );
};

export default CustomMessageBanner;