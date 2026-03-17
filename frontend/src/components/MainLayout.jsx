import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Wallet, Receipt, PieChart, LogOut, FileText } from 'lucide-react';

const MainLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const links = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { to: '/income', label: 'Pemasukan', icon: <Wallet size={20} /> },
    { to: '/expenses', label: 'Pengeluaran', icon: <Receipt size={20} /> },
    { to: '/budget', label: 'Budget', icon: <PieChart size={20} /> },
    { to: '/reports', label: 'Laporan', icon: <FileText size={20} /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background dark:bg-darkbg text-gray-900 dark:text-gray-100">
      {/* Sidebar Navigation - DESKTOP ONLY */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col hidden md:flex">
        <div className="p-6 font-bold text-2xl text-primary flex items-center gap-2">
          <Wallet className="text-primary" size={28} />
          <span>SmartFin</span>
          <span className="text-[10px] font-normal bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded ml-auto">v1.2-BUILT-NOW</span>
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
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {/* Mobile Header */}
        <div className="md:hidden bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div className="font-bold text-xl text-primary flex items-center gap-2">
            <Wallet size={24} /> SmartFin
          </div>
          <button onClick={handleLogout} className="text-gray-500 dark:text-gray-400 hover:text-danger p-2 bg-gray-50 dark:bg-gray-700 rounded-full">
             <LogOut size={20} />
          </button>
        </div>
        
        {/* Render Routes Layout */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* BOTTOM NAVIGATION - MOBILE ONLY */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around items-center h-16 px-2 z-50">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive 
                  ? 'text-primary' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`
            }
          >
            {React.cloneElement(link.icon, { size: 22 })}
            <span className="text-[10px] sm:text-xs font-semibold">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* DEBUG OVERLAY */}
      <div className="fixed bottom-20 left-4 z-[9999] bg-black/80 text-white text-[10px] p-2 rounded-lg border border-white/20 pointer-events-auto md:bottom-4">
        <p className="font-bold border-b border-white/20 pb-1 mb-1">DEV DEBUG v1.4</p>
        <p>USER: {user ? (user.id || user.uid || 'ERR').substring(0, 5) : 'NONE'}</p>
        <p>STATUS: {user ? 'AUTH OK' : 'NO AUTH'}</p>
        <button 
          onClick={() => {
            if(window.confirm("RESET APLIKASI?\nIni akan membersihkan cache browser bapak.")) {
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload(true);
            }
          }}
          className="mt-2 w-full bg-red-600 hover:bg-red-700 text-[10px] py-1 px-2 rounded font-bold transition-colors"
        >
          FORCE RESET & REFRESH
        </button>
      </div>
    </div>
  );
};

export default MainLayout;
