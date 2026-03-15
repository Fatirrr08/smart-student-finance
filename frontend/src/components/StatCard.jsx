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
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-200 cursor-default">
      <div className={`p-4 rounded-xl ${getColors()}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {subtitle && (
           <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
