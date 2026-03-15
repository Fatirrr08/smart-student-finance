import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Wallet, Receipt, PieChart, LogOut, FileText } from 'lucide-react';

const MainLayout = () => {
  const { logout, user } = useAuth();

  const links = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { to: '/income', label: 'Income', icon: <Wallet size={20} /> },
    { to: '/expenses', label: 'Expenses', icon: <Receipt size={20} /> },
    { to: '/budget', label: 'Budget', icon: <PieChart size={20} /> },
    { to: '/reports', label: 'Reports', icon: <FileText size={20} /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background dark:bg-darkbg text-gray-900 dark:text-gray-100">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col hidden md:flex">
        <div className="p-6 font-bold text-2xl text-primary flex items-center gap-2">
          <Wallet className="text-primary" size={28} />
          <span>SmartFin</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary text-white' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`
              }
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="mb-4 px-2 text-sm text-gray-500 dark:text-gray-400">
            Logged in as <b>{user?.name}</b>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-danger hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header (Placeholder) */}
        <div className="md:hidden bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="font-bold text-xl text-primary flex items-center gap-2">
            <Wallet size={24} /> SmartFin
          </div>
        </div>
        
        {/* Render Routes Layout */}
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
