import React from 'react';
import {
  Home, MessageSquare, Cpu, Bot, BookOpen, FolderGit2,
  Database, Store, Settings, Zap, LayoutDashboard, LogOut, Activity, FlaskConical,
  Network, Mountain, Lock, Radio, Code, Wand2, Users, BarChart2, GitBranch, FileText
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

// Animated quantum orbit logo
const QATIONOrbit = () => (
  <div className="relative w-8 h-8 flex-shrink-0">
    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-700 to-violet-400 opacity-20 animate-pulse" />
    <div className="absolute inset-1 rounded-full border border-violet-500/50 animate-spin-slow" />
    <div className="absolute inset-2 rounded-full border border-cyan-500/40" style={{ animation: 'spin 5s linear infinite reverse' }} />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-2 h-2 rounded-full bg-violet-400 shadow-lg shadow-violet-400/80" />
    </div>
  </div>
);

const navSections = [
  {
    label: 'Platform',
    items: [
      { id: 'home',             label: 'Home',              icon: Home },
      { id: 'chat',             label: 'Chat',               icon: MessageSquare, badge: 'New' },
      { id: 'quantum-lab',      label: 'Quantum Lab',        icon: Cpu, dot: 'cyan' },
      { id: 'circuit-synthesis',label: 'Circuit Synthesis',  icon: Wand2, badge: 'AI' },
      { id: 'code-explainer',   label: 'Code Explainer',     icon: Code },
      { id: 'paper-summarizer', label: 'Paper Summarizer',   icon: FileText },
      { id: 'agents',           label: 'AI Agents',          icon: Bot },
      { id: 'research',         label: 'Research',           icon: BookOpen },
      { id: 'notebooks',        label: 'Collab Notebooks',   icon: Users, badge: 'Live' },
      { id: 'benchmark',        label: 'Benchmarks',         icon: Activity },
    ],
  },
  {
    label: 'Resources',
    items: [
      { id: 'circuit-gallery',  label: 'Circuit Gallery',    icon: GitBranch },
      { id: 'dashboard',        label: 'Dashboard',          icon: BarChart2 },
      { id: 'workspace',        label: 'Workspace',          icon: FolderGit2 },
      { id: 'datasets',         label: 'Datasets',           icon: Database },
      { id: 'marketplace',      label: 'Marketplace',        icon: Store },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'settings',         label: 'Settings',           icon: Settings },
    ],
  },
];

export default function Sidebar({ activeTab, setActiveTab, user }) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-60'} h-full bg-[#0a0d16]/95 backdrop-blur-xl border-r border-white/[0.07] flex flex-col z-30 flex-shrink-0 transition-all duration-300`}>
      {/* Logo & Toggle */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-5 border-b border-white/[0.07]`}>
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="hover:scale-105 transition-transform shrink-0" title="Toggle Sidebar">
          <img src="/logo.png" alt="QATION Logo" className="w-8 h-8 object-contain" />
        </button>
        {!isCollapsed && (
          <div className="overflow-hidden whitespace-nowrap">
            <div className="flex items-center gap-2">
              <div className="font-bold tracking-[0.2em] text-white/90 text-sm">
                QATION
              </div>
              <div className="text-[10px] tracking-widest text-primary-400 mt-1 uppercase font-medium">
                Quantum AI
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nav sections */}
      <nav className={`flex-1 overflow-y-auto no-scrollbar py-3 ${isCollapsed ? 'px-2' : 'px-2'} space-y-5`}>
        {navSections.map((section) => (
          <div key={section.label}>
            {!isCollapsed && (
              <div className="px-3 mb-1.5 text-[9px] font-bold uppercase tracking-widest text-gray-600 whitespace-nowrap">
                {section.label}
              </div>
            )}
            <div className="space-y-0.5 flex flex-col items-center">
              {section.items.map(({ id, label, icon: Icon, badge, dot }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`nav-item ${isActive ? 'nav-item-active' : ''} ${isCollapsed ? 'justify-center px-0 w-10' : 'w-full'}`}
                    title={isCollapsed ? label : undefined}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-[15px] h-[15px] flex-shrink-0 ${isActive ? 'text-violet-400' : 'text-gray-500'}`} />
                      {!isCollapsed && <span className={isActive ? 'text-violet-200 font-semibold whitespace-nowrap' : 'whitespace-nowrap'}>{label}</span>}
                    </div>
                    {!isCollapsed && badge && (
                      <span className="badge-purple text-[9px] px-1.5 ml-auto">{badge}</span>
                    )}
                    {!isCollapsed && dot && !badge && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse ml-auto" />
                    )}
                    {isCollapsed && (badge || dot) && (
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className={`py-3 border-t border-white/[0.07] ${isCollapsed ? 'px-2 flex justify-center' : 'px-3'}`}>
        <div className={`flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-violet-600/30 flex-shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          {!isCollapsed && (
            <>
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="text-xs font-semibold text-gray-200 truncate">{user?.name || 'User'}</div>
                <div className="text-[10px] text-gray-500 font-medium truncate">
                  {user?.email || 'Quantum Explorer'}
                </div>
              </div>
              <button 
                onClick={() => signOut(auth)}
                className="p-1.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-red-500/10"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
