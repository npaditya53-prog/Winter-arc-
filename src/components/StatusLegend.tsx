import React from 'react';

interface StatusLegendProps {
  className?: string;
  theme?: 'dark' | 'light';
}

export const StatusLegend: React.FC<StatusLegendProps> = ({ className = '', theme: _theme }) => {
  return (
    <div className={`flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11px] text-zinc-400 select-none ${className}`}>
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#4CAF78]" />
        <span>Completed (✓)</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#D96B6B]" />
        <span>Missed (✕)</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-zinc-500" />
        <span>Pending (□)</span>
      </span>
    </div>
  );
};
