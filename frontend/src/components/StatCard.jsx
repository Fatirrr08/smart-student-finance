import React from 'react';

const StatCard = ({ title, value, icon, type = "default", subtitle }) => {
  const getColors = () => {
    switch(type) {
      case "success": return "text-secondary bg-green-50 dark:bg-green-900/20";
      case "danger": return "text-danger bg-red-50 dark:bg-red-900/20";
      case "primary": return "text-primary bg-indigo-50 dark:bg-indigo-900/20";
      default: return "text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3 sm:gap-4 transition-all hover:shadow-md hover:-translate-y-1 duration-200 cursor-default">
      <div className={`p-3 sm:p-4 rounded-xl ${getColors()} shrink-0`}>
        {React.cloneElement(icon, { size: window.innerWidth < 640 ? 20 : 24 })}
      </div>
      <div className="min-w-0">
        <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</h3>
        <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1 truncate">
          {value}
        </p>
        {subtitle && (
           <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-0.5 sm:mt-1 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
