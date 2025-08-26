import React from 'react';

export default function BottomToolbar() {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-blue-100 shadow flex justify-center gap-6 py-3 z-40">
      <button className="bg-blue-700 text-white rounded px-4 py-2 flex items-center gap-2">
        <span role="img" aria-label="refresh">🔄</span> Refresh Table Status
      </button>
      <button className="bg-blue-700 text-white rounded px-4 py-2 flex items-center gap-2">
        <span role="img" aria-label="cleaned">🧹</span> Mark as Cleaned
      </button>
      <button className="bg-blue-700 text-white rounded px-4 py-2 flex items-center gap-2">
        <span role="img" aria-label="waiters">👥</span> View Waiter Assignments
      </button>
      <button className="bg-blue-700 text-white rounded px-4 py-2 flex items-center gap-2">
        <span role="img" aria-label="settings">⚙️</span> Settings
      </button>
    </div>
  );
} 