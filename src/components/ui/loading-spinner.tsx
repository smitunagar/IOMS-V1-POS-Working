import React from 'react';

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center">
    <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
    <span className="ml-2">Loading...</span>
  </div>
);

export default LoadingSpinner; 