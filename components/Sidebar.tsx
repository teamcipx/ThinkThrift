import React from 'react';
import { LayoutDashboard, Database, Settings, LogOut, ShieldCheck, X } from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onLogout, isOpen, onClose }) => {
  const navItemClass = (view: AppView) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
      currentView === view
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full flex-shrink-0
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">SocialBase</h1>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <div
            className={navItemClass(AppView.DASHBOARD)}
            onClick={() => { onChangeView(AppView.DASHBOARD); onClose(); }}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </div>
          <div
            className={navItemClass(AppView.ACCOUNTS)}
            onClick={() => { onChangeView(AppView.ACCOUNTS); onClose(); }}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="font-medium">Accounts</span>
          </div>
          <div
            className={navItemClass(AppView.SETTINGS)}
            onClick={() => { onChangeView(AppView.SETTINGS); onClose(); }}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;