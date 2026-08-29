import React, { useState } from 'react';
import { ArrowRight, Cpu, Bot, Database, Check, X, Zap, FlaskConical, GitBranch, BookOpen, Shield, Sparkles, BarChart } from 'lucide-react';

export default function LandingView({ onEnter }) {
  const [showProof, setShowProof] = useState(false);

  const comparisons = [
    {
      feature: 'Understands quantum code (Qiskit, PennyLane)',
      qation: true,
      gpt: false,
    },
    {
      feature: 'Draws & visualizes quantum circuits live',
      qation: true,
      gpt: false,
    },
    {
      feature: 'Real PennyLane datasets — loaded, not just described',
      qation: true,
      gpt: false,
    },
    {
      feature: 'Explains every gate when you click it',
      qation: true,
      gpt: false,
    },
    {
      feature: 'Built for India — context-aware, low-latency',
      qation: true,
      gpt: false,
    },
    {
      feature: 'Integrated research + notebook workspace',
      qation: true,
      gpt: false,
    },
    {
      feature: 'General text generation & reasoning (like ChatGPT)',
      qation: true,
      gpt: true,
    },
    {
      feature: 'Q-SIL Context Tracking (Prevents Hallucination)',
      qation: true,
      gpt: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#030509] text-gray-200 overflow-x-hidden selection:bg-violet-500/30 font-sans">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 rounded-full blur-[150px]" />
        <div className="absolute top-[40%] left-[50%] w-[30%] h-[30%] bg-cyan-500/5 rounded-full blur-[150px] -translate-x-1/2" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/[0.05] bg-[#080A12]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="QATION Logo" className="w-8 h-8 object-contain drop-shadow-[0_0_10px_rgba(124,58,237,0.5)]" />
            <span className="font-bold text-xl tracking-widest text-white">
              QATION
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-xs uppercase tracking-widest font-semibold text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#why" className="text-xs uppercase tracking-widest font-semibold text-gray-400 hover:text-white transition-colors">Why Us</a>
            <button onClick={onEnter} className="bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all py-1.5 px-5 rounded-lg text-xs tracking-wider font-bold shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)]">
              SIGN IN
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-24">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">India's first quantum platform — Beta</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[1.1] text-white">
                Built for those who<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400 drop-shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                  think in qubits.
                </span>
              </h1>

              <p className="text-sm text-gray-400 max-w-xl mx-auto md:mx-0 mb-10 leading-relaxed mt-4">
                Write a prompt. Get a working Qiskit or PennyLane circuit — drawn live, gate by gate, right in the browser. Load real molecular datasets. Take notes in an integrated notebook. No setup. No copy-pasting.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                <button onClick={onEnter} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold hover:from-violet-500 hover:to-indigo-500 transition-all active:scale-95 shadow-[0_0_30px_rgba(99,102,241,0.3)] group border border-white/10">
                  <Sparkles className="w-4 h-4" />
                  Launch Workspace
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <a href="#why" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95">
                  What makes it different?
                </a>
              </div>
            </div>
            
            <div className="flex-1 flex justify-center md:justify-end relative mt-12 md:mt-0">
              <div className="absolute inset-0 bg-violet-600/20 blur-[120px] rounded-full" />
              <div className="relative p-1 rounded-2xl bg-gradient-to-b from-white/20 to-white/0 shadow-2xl overflow-hidden">
                <img 
                  src="/cena-mascot.png" 
                  alt="Cena Quantum Computer Mascot" 
                  className="relative w-full max-w-lg rounded-xl opacity-90 brightness-110 contrast-125 mix-blend-screen" 
                  style={{ filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.4))' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
          <div className="text-center mb-16">
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-3">Core Capabilities</p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">Six things you can't do with a generic GPT</h2>
            <p className="text-gray-400 max-w-xl mx-auto text-sm">These aren't just features. They're the exact reasons researchers choose QATION over a text box.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {/* Feature 1 */}
            <div className="rounded-3xl p-8 group cursor-default transition-all hover:-translate-y-1 flex flex-col bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-md">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <Bot className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-4">It actually runs the code</h3>
              <ul className="space-y-3 mt-auto">
                {['Generates working Qiskit circuits', 'Executes instantly in-browser', 'Debugs noise models automatically'].map(pt => (
                  <li key={pt} className="flex items-start gap-3 text-xs text-gray-400">
                    <Check className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="rounded-3xl p-8 group cursor-default transition-all hover:-translate-y-1 flex flex-col bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-md">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                <Cpu className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-4">Circuits you can touch</h3>
              <ul className="space-y-3 mt-auto">
                {['Renders SVGs live instantly', 'Click any gate for a plain-English explainer', 'See Bloch spheres and Entanglement graphs'].map(pt => (
                  <li key={pt} className="flex items-start gap-3 text-xs text-gray-400">
                    <Check className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="rounded-3xl p-8 group cursor-default transition-all hover:-translate-y-1 flex flex-col bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-md">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <Database className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-4">Real datasets, not fake data</h3>
              <ul className="space-y-3 mt-auto">
                {['LiH, H₂, QML benchmarks included', 'Search and load into your session', 'Actual molecular structures & Hamiltonians'].map(pt => (
                  <li key={pt} className="flex items-start gap-3 text-xs text-gray-400">
                    <Check className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="rounded-3xl p-8 group cursor-default transition-all hover:-translate-y-1 flex flex-col bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-md">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <FlaskConical className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-4">One tab for everything</h3>
              <ul className="space-y-3 mt-auto">
                {['Research notes & code together', 'No context-switching overhead', 'Seamless Notebook bridge integration'].map(pt => (
                  <li key={pt} className="flex items-start gap-3 text-xs text-gray-400">
                    <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>

            {/* Feature 5 */}
            <div className="rounded-3xl p-8 group cursor-default transition-all hover:-translate-y-1 flex flex-col bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-md">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                <GitBranch className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-4">Q-SIL Context Tracking</h3>
              <ul className="space-y-3 mt-auto">
                {['2-qubit circuit tracks prompt coherence', 'Auto-truncates context to save tokens', 'Zero context bleed or hallucinations'].map(pt => (
                  <li key={pt} className="flex items-start gap-3 text-xs text-gray-400">
                    <Check className="w-3.5 h-3.5 text-orange-400 mt-0.5 shrink-0" />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>

            {/* Feature 6 */}
            <div className="rounded-3xl p-8 group cursor-default transition-all hover:-translate-y-1 flex flex-col bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-md">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                <Shield className="w-5 h-5 text-rose-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-4">Your research stays yours</h3>
              <ul className="space-y-3 mt-auto">
                {['Zero data training policies', 'Secure Firebase Auth integration', 'Encrypted local and remote states'].map(pt => (
                  <li key={pt} className="flex items-start gap-3 text-xs text-gray-400">
                    <Check className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Q-SIL Deep Dive Section */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="relative rounded-3xl overflow-hidden bg-white/5 border border-white/10 backdrop-blur-xl p-8 md:p-12 shadow-[0_0_30px_rgba(249,115,22,0.1)]">
            <div className="absolute top-0 right-0 w-[40%] h-[100%] bg-orange-500/10 blur-[100px]" />
            <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 mb-6">
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Proprietary Backend</span>
                </div>
                <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Powered by our developed Q-SIL Algorithm</h2>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                  We don't just use standard language models. QATION runs on the <strong>Quantum Structural Interaction Layer (Q-SIL)</strong>, a custom 2-qubit quantum circuit that calculates structural coherence in sub-milliseconds. <br/><br/>
                  <span className="text-rose-400/90 font-medium">Unlike standard wrappers, the Q-SIL architecture is strictly closed-source and completely proprietary to QATION.</span>
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0 border border-orange-500/30">
                      <Zap className="w-3 h-3 text-orange-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-200">Sub-millisecond Execution</h4>
                      <p className="text-xs text-gray-500">Evaluates linguistic structural interaction at ~0.24ms — 500x faster than classical RoBERTa embeddings.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0 border border-orange-500/30">
                      <Cpu className="w-3 h-3 text-orange-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-200">Deterministic 2-Qubit Circuit</h4>
                      <p className="text-xs text-gray-500">Maps structural invariants (burstiness, token density) into amplitude-encoded statevectors to measure exact mathematical interference.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0 border border-orange-500/30">
                      <Shield className="w-3 h-3 text-orange-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-200">Zero Hallucination Tolerance</h4>
                      <p className="text-xs text-gray-500">Acts as a hard mathematical boundary. When coherence drops, the context window is wiped instantly, preventing context bleed.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0 border border-orange-500/30">
                      <Database className="w-3 h-3 text-orange-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-200">Cross-Domain Generalization</h4>
                      <p className="text-xs text-gray-500">Not just for text. Q-SIL acts as a universal structural comparison engine for molecular similarity (drug discovery) and network anomaly detection.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0 border border-orange-500/30">
                      <Bot className="w-3 h-3 text-orange-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-200">100% White-Box Explainability</h4>
                      <p className="text-xs text-gray-500">Unlike neural networks, Q-SIL is not a black box. Every structural decision can be visually and mathematically proven on the Bloch Sphere.</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex gap-4">
                  <button onClick={() => setShowProof(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 font-medium text-sm hover:bg-orange-500/20 transition-colors shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                    <BarChart className="w-4 h-4" />
                    See more
                  </button>
                </div>
              </div>
              <div className="flex-1 w-full md:w-auto flex flex-col justify-center">
                <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl relative group bg-[#0a0f18]">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#030509] via-transparent to-transparent opacity-60 z-10 pointer-events-none"></div>
                  <img src="/qsil_benchmark_proof.png" alt="Q-SIL 500x Benchmark Latency" className="w-full h-auto object-cover relative z-0 transition-transform duration-500 group-hover:scale-105 invert hue-rotate-180 brightness-90 contrast-125" />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-full text-center">
                    <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 text-[11px] font-bold text-orange-400/90 uppercase tracking-[0.2em] drop-shadow-md">
                      <Zap className="w-3.5 h-3.5" /> 500x Faster Execution
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why QATION vs GPTs Section */}
        <div id="why" className="max-w-5xl mx-auto px-6 py-24 border-t border-white/5">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 mb-6">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Honest Comparison</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">Why not just use a popular GPT?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm">LLMs are great at text. They are terrible at quantum mechanics. QATION bridges the gap with a deterministic backend.</p>
          </div>

          <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5 backdrop-blur-xl">
            {/* Table header */}
            <div className="grid grid-cols-3 bg-white/5 border-b border-white/10">
              <div className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Capability</div>
              <div className="px-6 py-4 text-center">
                <div className="inline-flex items-center gap-2">
                  <img src="/logo.png" alt="QATION" className="w-4 h-4 object-contain brightness-150" />
                  <span className="text-xs font-bold text-white tracking-widest uppercase">QATION</span>
                </div>
              </div>
              <div className="px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-gray-400">Generic GPT</div>
            </div>

            {/* Rows */}
            {comparisons.map((row, i) => (
              <div key={i} className={`grid grid-cols-3 border-b border-white/5 ${i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'} hover:bg-white/5 transition-colors`}>
                <div className="px-6 py-4 text-xs text-gray-300 flex items-center">{row.feature}</div>
                <div className="px-6 py-4 flex items-center justify-center">
                  {row.qation
                    ? <span className="flex items-center gap-2 text-emerald-400 font-bold text-xs"><Check className="w-4 h-4" /> Yes</span>
                    : <span className="flex items-center gap-2 text-gray-600 text-xs font-bold"><X className="w-4 h-4" /> No</span>
                  }
                </div>
                <div className="px-6 py-4 flex items-center justify-center">
                  {row.gpt
                    ? <span className="flex items-center gap-2 text-emerald-400 font-bold text-xs"><Check className="w-4 h-4" /> Yes</span>
                    : <span className="flex items-center gap-2 text-gray-600 text-xs font-bold"><X className="w-4 h-4" /> No</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="max-w-5xl mx-auto px-6 pb-24">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#080A12] via-[#111827] to-[#1e1b4b] p-12 text-center border border-white/10 shadow-[0_0_50px_rgba(99,102,241,0.15)]">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            <div className="absolute top-0 right-0 w-[50%] h-[100%] bg-violet-500/20 blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-[50%] h-[100%] bg-blue-500/10 blur-[120px]" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Free during Beta</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight tracking-tighter">
                Ready to do real<br />quantum work?
              </h2>
              <p className="text-gray-400 text-sm max-w-xl mx-auto mb-10">
                Join the researchers who stopped fighting their generic tools and started building. No setup. No cost. Just quantum.
              </p>
              <button onClick={onEnter} className="inline-flex items-center gap-2 bg-white text-[#080A12] px-10 py-4 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)] group uppercase tracking-widest">
                Start for free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="border-t border-white/5 py-8 text-center text-xs text-gray-600 uppercase tracking-widest font-bold">
          <p>© {new Date().getFullYear()} QATION Platform. All rights reserved.</p>
        </footer>
      </main>

      {/* Details Modal */}
      {showProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowProof(false)}>
          <div className="bg-[#0a0f18] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#0a0f18]/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                  <Zap className="w-4 h-4 text-orange-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Q-SIL Technical Details</h2>
              </div>
              <button onClick={() => setShowProof(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="p-8 space-y-12">
              <div>
                <h3 className="text-lg font-bold text-orange-400 mb-2">Benchmark: Massive Computational Efficiency</h3>
                <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                  When benchmarking 120 structural text comparisons against classical LLM Embeddings (~150.00 ms), the Q-SIL architecture completes the evaluation in ~0.24 ms per comparison. Q-SIL is approximately <strong>500x faster</strong> in batch evaluation.
                </p>
                <div className="rounded-xl overflow-hidden border border-white/10 shadow-inner">
                  <img src="/qsil_benchmark_proof.png" alt="Latency Benchmark" className="max-w-full w-full h-auto rounded-lg invert hue-rotate-180 brightness-90 contrast-125" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-cyan-400 mb-2">Visualization: Geometric Interpretability</h3>
                <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                  Unlike dense neural network arrays (black boxes), Q-SIL's 2-qubit architecture maps directly to physical geometry. The interference pattern of the entangled sentences provides absolute, visual representation of coherence on the Bloch Sphere.
                </p>
                <div className="rounded-xl overflow-hidden border border-white/10 shadow-inner">
                  <img src="/qsil_bloch_proof.png" alt="Bloch Sphere Geometry" className="max-w-full w-full h-auto rounded-lg invert hue-rotate-180 brightness-90 contrast-125" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-rose-400 mb-2">Enforcement: Zero Hallucination Context Wipe</h3>
                <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                  When destructive interference is detected (coherence drops below 0.4), the backend physically wipes the LLM context window to prevent context bleed. Here is the actual backend trace during a severe topic shift:
                </p>
                <div className="rounded-xl overflow-hidden border border-white/10 bg-[#030509] p-6 font-mono text-xs text-gray-400 leading-relaxed shadow-inner">
                  <span className="text-emerald-400">[INFO]</span> Received ChatRequest with 14 prior conversational messages<br/>
                  <span className="text-blue-400">[Q-SIL]</span> Extracting linguistic invariants for current vs previous prompt...<br/>
                  <span className="text-blue-400">[Q-SIL]</span> Running 2-qubit interference circuit (shots=1024)...<br/>
                  <span className="text-rose-400 font-bold">[Q-SIL] Coherence 0.3120 is below threshold (0.4).</span><br/>
                  <span className="text-amber-400">[WARN]</span> Destructive structural interference detected. Topic shift is too severe.<br/>
                  <span className="text-orange-400 font-bold mt-2 block">[ENFORCE] Wiping context window to prevent hallucination.</span>
                  <span className="text-orange-400 font-bold block mb-2">[ENFORCE] Previous 13 messages deleted from LLM payload.</span>
                  <span className="text-emerald-400">[INFO]</span> Forwarding isolated prompt to NVIDIA NIM backend...
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

