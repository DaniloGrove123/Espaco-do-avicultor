
import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { APP_NAME, HomeIcon, CurrencyDollarIcon, BeakerIcon, ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon, UserCircleIcon, CogIcon } from '../constants';

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string; onClick?: () => void }> = ({ to, icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ease-in-out
      ${isActive ? 'bg-sky-700 text-white' : 'text-sky-100 hover:bg-sky-600 hover:text-white'}`
    }
  >
    <span className="mr-3 w-5 h-5">{icon}</span>
    {label}
  </NavLink>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return <>{children}</>; // For login/recovery pages that don't need full layout
  }

  const sidebarContent = (
    <>
      <div className="px-4 py-6">
        <Link to="/" className="text-2xl font-semibold text-white">
          {APP_NAME}
        </Link>
      </div>
      <nav className="mt-5 flex-grow px-2 space-y-1">
        <NavItem to="/" icon={<HomeIcon className="w-5 h-5" />} label="Dashboard" onClick={() => setIsSidebarOpen(false)} />
        <NavItem to="/financials" icon={<CurrencyDollarIcon className="w-5 h-5" />} label="Financeiro" onClick={() => setIsSidebarOpen(false)} />
        <NavItem to="/production" icon={<BeakerIcon className="w-5 h-5" />} label="Produção" onClick={() => setIsSidebarOpen(false)} />
        <NavItem to="/farm-details" icon={<CogIcon className="w-5 h-5" />} label="Dados da Granja" onClick={() => setIsSidebarOpen(false)} />
      </nav>
      <div className="mt-auto p-4">
         {user && (
            <div className="flex items-center mb-4 p-2 bg-sky-700 rounded-lg">
              <UserCircleIcon className="w-8 h-8 text-sky-300 mr-2" />
              <span className="text-white text-sm font-medium">{user.username}</span>
            </div>
          )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors duration-150 ease-in-out"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2 transform rotate-180" />
          Sair
        </button>
      </div>
    </>
  );


  return (
    <div className="flex h-screen bg-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-sky-800 text-white fixed h-full">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar (drawer) */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 flex z-40">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setIsSidebarOpen(false)}></div>
            <aside className="relative flex flex-col w-64 max-w-xs h-full bg-sky-800 text-white z-50">
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-4 right-4 text-sky-200 hover:text-white"
                aria-label="Fechar menu"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
              {sidebarContent}
            </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col md:ml-64">
        {/* Mobile Header */}
        <header className="md:hidden w-full bg-sky-600 text-white shadow-md p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">{APP_NAME}</h1>
          <button onClick={() => setIsSidebarOpen(true)} aria-label="Abrir menu">
            <Bars3Icon className="w-6 h-6" />
          </button>
        </header>
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};