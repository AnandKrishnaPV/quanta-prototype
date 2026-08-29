import React, { useState } from 'react';
import { Send, Sparkles, Cpu, Bot, BookOpen, Shield, Zap } from 'lucide-react';

// Animated quantum canvas background
function QuantumOrbit() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Outer halo */}
      <div className="absolute w-[700px] h-[700px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />
      {/* Ring 1 */}
      <div className="absolute w-80 h-80 rounded-full border border-violet-500/15 animate-spin-slow" />
      {/* Ring 2 – counter-rotate */}
      <div className="absolute w-56 h-56 rounded-full border border-cyan-500/15"
        style={{ animation: 'spin 10s linear infinite reverse' }} />
      {/* Ring 3 tilted */}
      <div className="absolute w-40 h-40 rounded-full border border-violet-400/20"
        style={{ transform: 'rotateX(60deg)', animation: 'spin 7s linear infinite' }} />
      {/* Core pulse */}
      <div className="relative w-20 h-20 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-violet-600/20 animate-pulse" />
        <div className="absolute inset-2 rounded-full bg-violet-700/30 blur-md" />
        <span className="relative z-10 font-mono font-bold text-violet-300 text-sm glow-text">|Ψ⟩</span>
      </div>
      {/* Orbiting dots */}
      <div className="absolute w-80 h-80 animate-spin-slow">
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-violet-400 shadow-lg shadow-violet-400/80" />
      </div>
      <div className="absolute w-56 h-56" style={{ animation: 'spin 10s linear infinite reverse' }}>
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-md shadow-cyan-400" />
      </div>
    </div>
  );
}

const quickPrompts = [
  'Explain Quantum Supremacy',
  'Generate Qiskit Code',
  'Solve ∫ x sin(x) dx',
  'Research Graph Neural Networks',
];

const featureCards = [
  { title: 'Hybrid Intelligence', desc: 'Best of Quantum + Classical AI reasoning', icon: Cpu, color: 'violet' },
  { title: 'Quantum Native', desc: 'Design, simulate and run quantum circuits', icon: Sparkles, color: 'indigo' },
  { title: 'AI Agents', desc: 'Autonomous agents for research & automation', icon: Bot, color: 'cyan' },
  { title: 'Research Copilot', desc: 'Analyze papers, generate insights and more', icon: BookOpen, color: 'blue' },
  { title: 'Enterprise Ready', desc: 'Secure, scalable and built for organizations', icon: Shield, color: 'emerald' },
];

export default function HomeView({ setActiveTab, setInitialPrompt }) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e) => {
    e?.preventDefault();
    const q = prompt.trim();
    if (!q) return;
    setInitialPrompt(q);
    setActiveTab('chat');
  };

  const handlePill = (text) => {
    setInitialPrompt(text);
    setActiveTab('chat');
  };

  return (
    <div className="relative flex-1 h-full flex flex-col overflow-hidden bg-[#080A12] bg-quantum-grid">
      <QuantumOrbit />

      {/* Content — scrollable on small screens */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 py-10 gap-8 overflow-y-auto no-scrollbar">

        {/* Hero Badge */}
        <div className="animate-fade-up">
          <span className="badge-purple gap-1.5 text-xs px-3 py-1">
            <Zap className="w-3 h-3" /> India's First Hybrid Quantum-Classical AI Platform
          </span>
        </div>

        {/* Hero Title */}
        <div className="text-center space-y-3 animate-fade-up">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-none">
            <span className="text-white">Welcome to </span>
            <span className="gradient-text">QATION</span>
          </h1>
          <p className="text-gray-400 text-base max-w-xl mx-auto leading-relaxed">
            Combining the power of Large Language Models and Quantum Computing<br />
            to solve the world's most complex problems.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="w-full max-w-2xl animate-fade-up">
          <div className="relative flex items-center gap-2 bg-[#111827]/90 border border-violet-500/30 focus-within:border-violet-500/70 focus-within:shadow-neon rounded-2xl px-4 py-3 transition-all duration-300">
            <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0" />
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask anything... (e.g. Explain Quantum Entanglement)"
              className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
            />
            <button
              type="submit"
              className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 flex items-center justify-center transition-all duration-150 shadow-md shadow-violet-600/40 active:scale-95"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </form>

        {/* Quick Action Pills */}
        <div className="flex flex-wrap justify-center gap-2 animate-fade-up">
          {quickPrompts.map((q, i) => (
            <button key={i} onClick={() => handlePill(q)} className="pill">
              {q}
            </button>
          ))}
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full max-w-4xl animate-fade-up">
          {featureCards.map(({ title, desc, icon: Icon }) => (
            <button
              key={title}
              onClick={() => {
                setInitialPrompt(`Tell me more about ${title}: ${desc}`);
                setActiveTab('chat');
              }}
              className="glass-card-hover p-4 text-left flex flex-col gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
                <Icon className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white mb-1">{title}</p>
                <p className="text-[11px] text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
