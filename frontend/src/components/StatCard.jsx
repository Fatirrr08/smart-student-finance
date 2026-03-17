import React from 'react';

const StatCard = ({ title, value, icon, type = "default", subtitle }) => {
  const getColors = () => {
    switch(type) {
      case "success": return "text-secondary bg-green-50 dark:bg-green-900/20";
      case "danger": return "text-danger bg-red-50 dark:bg-red-900/20";
      case "primary": return "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"; // Updated text color to indigo-600
      default: return "text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-800"; // Updated to stone colors
    }
  };

  const color = getColors(); // Get colors once

  return (
    <div className="bg-white dark:bg-darkbg p-[clamp(1rem,3vw,1.5rem)] rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 flex items-center gap-4 transition-all hover:shadow-md group">
      <div className={`p-3 rounded-2xl ${color.replace('bg-', 'bg-').replace('/10', '/10')} group-hover:scale-110 transition-transform`}>
        {React.cloneElement(icon, { size: 'clamp(1.25rem, 4vw, 1.5rem)' })}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[clamp(0.75rem,0.8vw,0.875rem)] font-medium text-stone-500 dark:text-stone-400 mb-0.5 truncate uppercase tracking-widest leading-none">
          {title}
        </p>
        <h4 className="text-[clamp(1.25rem,1.5vw,1.5rem)] font-bold text-stone-900 dark:text-white truncate leading-tight">
          {value}
        </h4>
        {subtitle && (
           <p className="text-[10px] sm:text-xs text-stone-400 dark:text-stone-500 mt-0.5 sm:mt-1 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
