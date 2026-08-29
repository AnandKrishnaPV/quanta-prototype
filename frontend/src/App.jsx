import React, { useState, useEffect } from 'react';
import './index.css';

import Sidebar                from './components/Sidebar';
import HomeView               from './components/HomeView';
import ChatView               from './components/ChatView';
import QuantumLabView         from './components/QuantumLabView';
import CircuitSynthesisView   from './components/CircuitSynthesisView';

import AgentsView             from './components/AgentsView';
import ResearchAssistantView  from './components/ResearchAssistantView';
import CollabNotebookView     from './components/CollabNotebookView';
import WorkspaceView          from './components/WorkspaceView';
import MarketplaceView        from './components/MarketplaceView';
import DatasetsView           from './components/DatasetsView';
import SettingsView           from './components/SettingsView';
import AuthView               from './components/AuthView';
import LandingView            from './components/LandingView';
import CodeExplainerView      from './components/CodeExplainerView';
import PaperSummarizerView    from './components/PaperSummarizerView';
import CircuitGalleryView     from './components/CircuitGalleryView';
import DashboardView          from './components/DashboardView';
import BenchmarkView          from './components/BenchmarkView';
import { checkHealth }        from './api';
import { auth }               from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Mail, LogOut, RefreshCw, Menu } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab]       = useState('home');
  const [initialPrompt, setInitialPrompt] = useState('');
  const [notebookCode, setNotebookCode] = useState('');
  const [apiOnline, setApiOnline]       = useState(null); // null = checking
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let timeoutId = setTimeout(() => {
      console.warn("Firebase auth check timed out, forcing load...");
      setAuthLoading(false);
    }, 4000);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(timeoutId);
      if (currentUser) {
        setUser({
          name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
          email: currentUser.email,
          uid: currentUser.uid,
          emailVerified: currentUser.emailVerified
        });
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  // Chat API is served by Netlify Functions — always available when deployed
  useEffect(() => {
    setApiOnline(true);
  }, []);

  if (authLoading) {
    return <div className="flex h-screen w-screen bg-[#080A12] items-center justify-center"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"/></div>;
  }

  if (!user) {
    if (showAuth) {
      return <AuthView onBack={() => setShowAuth(false)} />;
    }
    return <LandingView onEnter={() => setShowAuth(true)} />;
  }

  if (!user.emailVerified) {
    return (
      <div className="flex h-screen w-screen bg-[#080A12] items-center justify-center relative overflow-hidden text-center px-4">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="relative z-10 max-w-md w-full p-8 bg-[#0a0d16]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mb-6">
            <Mail className="w-8 h-8 text-violet-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-gray-400 text-sm mb-8">
            We sent a verification link to <span className="text-white font-medium">{user.email}</span>. 
            Please click the link to activate your account.
          </p>
          <div className="flex flex-col w-full gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full btn-primary py-2.5 justify-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              I've verified my email
            </button>
            <button 
              onClick={() => signOut(auth)}
              className="w-full px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign out and try another email
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (activeTab) {
      case 'home':             return <HomeView setActiveTab={setActiveTab} setInitialPrompt={setInitialPrompt}/>;
      case 'chat':             return <ChatView initialPrompt={initialPrompt} setInitialPrompt={setInitialPrompt} onRunInNotebook={(code) => { setNotebookCode(code); setActiveTab('notebooks'); }}/>;
      case 'quantum-lab':      return <QuantumLabView setActiveTab={setActiveTab} setInitialPrompt={setInitialPrompt}/>;
      case 'circuit-synthesis':return <CircuitSynthesisView />;
      case 'agents':           return <AgentsView setActiveTab={setActiveTab} setInitialPrompt={setInitialPrompt}/>;
      case 'research':         return <ResearchAssistantView setActiveTab={setActiveTab} setInitialPrompt={setInitialPrompt}/>;
      case 'notebooks':        return <CollabNotebookView />;
      case 'workspace':        return <WorkspaceView setActiveTab={setActiveTab}/>;
      case 'marketplace':      return <MarketplaceView/>;
      case 'datasets':         return <DatasetsView/>;
      case 'settings':         return <SettingsView/>;
      case 'code-explainer':   return <CodeExplainerView />;
      case 'paper-summarizer': return <PaperSummarizerView />;
      case 'circuit-gallery':  return <CircuitGalleryView />;
      case 'dashboard':        return <DashboardView />;
      case 'benchmark':        return <BenchmarkView />;
      default:                 return <HomeView setActiveTab={setActiveTab} setInitialPrompt={setInitialPrompt}/>;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080A12] text-gray-100">
      
      {/* Mobile Sidebar overlay */}
      <div 
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setMobileMenuOpen(false)} 
      />
      
      {/* Sidebar container */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setMobileMenuOpen(false); }} user={user} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center px-3 py-3 border-b border-white/5 bg-[#0a0d16]">
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-1 text-gray-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 ml-1">
            <div className="w-6 h-6 rounded-md bg-violet-600/30 border border-violet-500/40 flex items-center justify-center">
              <span className="text-violet-400 text-[10px] font-bold">Q</span>
            </div>
            <span className="font-bold text-white text-sm tracking-wider">QATION</span>
          </div>
        </div>

        {/* API Status Bar — hidden, Netlify Functions always serve the API */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
