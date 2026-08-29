import React, { useState } from 'react';
import { Search, Code2, Calculator, Cpu, BarChart2, PenLine, Plus, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { sendChat } from '../api';

const AGENTS = [
  {
    title: 'Research Agent',
    desc: 'Search, read and summarize papers. Generate insights from arXiv.',
    icon: Search,
    prompt: 'You are in Research Agent mode. Search and summarize the latest research on Quantum Error Mitigation with surface codes.',
    color: 'violet',
  },
  {
    title: 'Coding Agent',
    desc: 'Write, debug and optimize code in Qiskit, Python, and more.',
    icon: Code2,
    prompt: 'You are in Coding Agent mode. Write complete, runnable Qiskit code for the VQE algorithm on an H2 molecule using a UCCSD ansatz. Include all imports and full output.',
    color: 'indigo',
  },
  {
    title: 'Math Agent',
    desc: 'Solve complex mathematical problems step by step.',
    icon: Calculator,
    prompt: 'You are in Math Agent mode. Derive the unitary transformation for the Quantum Fourier Transform on n qubits. Show every step of the derivation with LaTeX-style notation.',
    color: 'cyan',
  },
  {
    title: 'Quantum Agent',
    desc: 'Design circuits, analyze algorithms, and explain quantum concepts.',
    icon: Cpu,
    prompt: 'You are in Quantum Agent mode. Explain how the QAOA (Quantum Approximate Optimization Algorithm) works for solving MaxCut problems. Include the cost Hamiltonian, mixer Hamiltonian, and circuit structure.',
    color: 'violet',
  },
  {
    title: 'Data Analyst',
    desc: 'Analyze datasets, generate insights and visualizations.',
    icon: BarChart2,
    prompt: 'You are in Data Analyst mode. Explain how to perform quantum state tomography for a 2-qubit system. What measurements are needed, how do you reconstruct the density matrix, and what are the key metrics to evaluate?',
    color: 'blue',
  },
  {
    title: 'Writing Agent',
    desc: 'Write reports, papers and technical documents.',
    icon: PenLine,
    prompt: 'You are in Writing Agent mode. Write a complete IEEE-style abstract (250 words) for a research paper on "Hybrid Quantum-Classical Neural Networks for Drug Discovery using Variational Quantum Eigensolver."',
    color: 'emerald',
  },
];

export default function AgentsView({ setActiveTab, setInitialPrompt }) {
  const [modal, setModal]         = useState(false);
  const [name, setName]           = useState('');
  const [role, setRole]           = useState('');
  const [launching, setLaunching] = useState(null);

  const launch = async (agent) => {
    setLaunching(agent.title);
    // Small delay for visual feedback
    await new Promise(r => setTimeout(r, 400));
    setInitialPrompt(agent.prompt);
    setActiveTab('chat');
    setLaunching(null);
  };

  const launchCustom = () => {
    if (!name.trim() && !role.trim()) return;
    setModal(false);
    setInitialPrompt(`You are ${name || 'Custom Agent'}. ${role || 'Help the user with their request.'}`);
    setActiveTab('chat');
  };

  return (
    <div className="flex-1 h-full bg-[#080A12] overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400"/> AI Agents
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Specialized autonomous agents — each launches a real AI conversation.
            </p>
          </div>
          <button onClick={() => setModal(true)} className="btn-primary">
            <Plus className="w-4 h-4"/> Custom Agent
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3">
          {AGENTS.map((agent) => {
            const isLaunching = launching === agent.title;
            return (
              <button
                key={agent.title}
                onClick={() => launch(agent)}
                disabled={!!launching}
                className="glass-card-hover p-5 flex items-start gap-4 text-left group disabled:opacity-60 disabled:cursor-wait"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-600 group-hover:border-violet-500 transition-all">
                  {isLaunching
                    ? <Loader2 className="w-5 h-5 text-white animate-spin"/>
                    : <agent.icon className="w-5 h-5 text-violet-400 group-hover:text-white transition-colors"/>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-white group-hover:text-violet-200 transition-colors">{agent.title}</h3>
                    <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all flex-shrink-0"/>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{agent.desc}</p>
                  {isLaunching && (
                    <p className="text-[10px] text-violet-400 mt-1 font-medium animate-pulse">Initializing agent…</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

      </div>

      {/* Create Custom Agent Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setModal(false)}>
          <div className="bg-[#111827] border border-violet-500/30 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400"/> Create Custom AI Agent
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Agent Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Quantum Chemistry Agent"
                  className="qation-input text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Role & Capabilities</label>
                <textarea
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  rows={4}
                  placeholder="Describe what this agent specializes in and how it should behave…"
                  className="qation-input text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
              <button
                onClick={launchCustom}
                disabled={!name.trim() && !role.trim()}
                className="btn-primary disabled:opacity-40"
              >
                <Sparkles className="w-3.5 h-3.5"/> Deploy Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
