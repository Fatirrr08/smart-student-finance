import React from 'react';
import { Calendar, Layers } from 'lucide-react';

const GlobalFilter = ({ activeFilter, onFilterChange }) => {
  return (
    <div className="flex bg-stone-100 dark:bg-stone-900 p-1 rounded-2xl w-fit border border-stone-200 dark:border-stone-800">
      <button
        onClick={() => onFilterChange('weekly')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
          activeFilter === 'weekly'
            ? 'bg-white dark:bg-stone-800 text-primary shadow-sm'
            : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
        }`}
      >
        <Calendar size={14} /> Mingguan
      </button>
      <button
        onClick={() => onFilterChange('monthly')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
          activeFilter === 'monthly'
            ? 'bg-white dark:bg-stone-800 text-primary shadow-sm'
            : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
        }`}
      >
        <Layers size={14} /> Bulanan
      </button>
    </div>
  );
};

export default GlobalFilter;
