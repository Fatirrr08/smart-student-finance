import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, TrendingUp, Receipt, PieChart, LogOut, FileText, User } from 'lucide-react';

const MainLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const links = [
    { to: '/', label: 'Dashboard', shortLabel: 'Home', icon: <LayoutDashboard size={20} /> },
    { to: '/income', label: 'Pemasukan', shortLabel: 'Masuk', icon: <TrendingUp size={20} /> },
    { to: '/expenses', label: 'Pengeluaran', shortLabel: 'Keluar', icon: <Receipt size={20} /> },
    { to: '/budget', label: 'Budget', shortLabel: 'Budget', icon: <PieChart size={20} /> },
    { to: '/reports', label: 'Laporan', shortLabel: 'Laporan', icon: <FileText size={20} /> },
    { to: '/profile', label: 'Profil', shortLabel: 'Profil', icon: <User size={20} /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background dark:bg-darkbg text-stone-900 dark:text-stone-100 font-sans">
      {/* Sidebar Navigation - DESKTOP ONLY */}
      <aside className="w-64 bg-white dark:bg-darkbg border-r border-stone-100 dark:border-stone-800 flex-col hidden md:flex">
        <div className="p-8 font-black text-2xl text-primary flex items-center gap-3 tracking-tighter">
          <div className="bg-primary/10 p-2 rounded-xl">
            <TrendingUp className="text-primary" size={24} />
          </div>
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
                    ? 'bg-primary text-white shadow-md' 
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
            Halo, <b>{user?.name}</b>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-danger hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-32 md:pb-0">
        {/* Mobile Header */}
        <div className="md:hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 z-40 shadow-sm">
          <div className="font-bold text-xl text-primary flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <TrendingUp size={20} className="text-primary" />
            </div>
            <span className="tracking-tight">SmartFin</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs font-medium text-gray-500 mr-1">
              {user?.name?.split(' ')[0]}
            </div>
            <button onClick={handleLogout} className="text-gray-500 dark:text-gray-400 hover:text-danger p-2 bg-gray-100 dark:bg-gray-700 rounded-full transition-colors">
               <LogOut size={18} />
            </button>
          </div>
        </div>
        
        {/* Render Routes Layout */}
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* BOTTOM NAVIGATION - MOBILE ONLY */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 flex justify-between items-center h-[4.5rem] pb-safe px-1 z-50">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 ${
                isActive 
                  ? 'text-primary scale-105' 
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            <div className={`p-1 rounded-md transition-colors ${link.to === window.location.hash.replace('#', '') || (link.to === '/' && window.location.hash === '#/') ? 'bg-primary/10' : ''}`}>
              {React.cloneElement(link.icon, { size: 20 })}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-tight truncate w-full text-center px-0.5">{link.shortLabel}</span>
          </NavLink>
        ))}
      </nav>

    </div>
  );
};

export default MainLayout;
