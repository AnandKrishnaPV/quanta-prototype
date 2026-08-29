import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Send, Paperclip, Mic, BookOpen, ExternalLink, Download,
  Sparkles, Play, Code2, ChevronDown, AlertCircle, Copy, Check, Trash2, Cpu
} from 'lucide-react';
import { sendChat } from '../api';
import 'katex/dist/katex.min.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const MODELS = [
  { id: 'google/gemini-flash-1.5',          label: 'Q-SIL Standard',      badge: 'Fast' },
  { id: 'meta/llama-3.1-70b-instruct',      label: 'Q-SIL Quantum',       badge: 'Research' },
];

const PROMPT_LIBRARY = [
  { category: 'Algorithms', prompts: [
    "Explain Shor's Algorithm step by step with circuit diagrams",
    "Build me a Quantum Fourier Transform circuit",
    "Walk me through Grover's search algorithm with an example",
    "How does quantum phase estimation work?",
    "Show me a Variational Quantum Eigensolver (VQE) circuit",
    "Explain Quantum Key Distribution (BB84 protocol)",
  ]},
  { category: 'Gates & States', prompts: [
    "What is the difference between the T gate and the S gate?",
    "Explain the Hadamard gate with a Bloch sphere visualization",
    "What is quantum entanglement and how does CNOT create it?",
    "Show me how to create a Bell state circuit",
    "What is quantum superposition in simple terms?",
    "Explain the difference between |+⟩ and |−⟩ states",
  ]},
  { category: 'Circuit Design', prompts: [
    "Design a 3-qubit GHZ state circuit",
    "Build a quantum teleportation protocol circuit",
    "Create a quantum random number generator circuit",
    "Show me a quantum error correction (3-qubit bit flip) circuit",
    "Build a Deutsch-Jozsa algorithm circuit",
    "How do I create a controlled-U gate from basic gates?",
  ]},
  { category: 'Code & Qiskit', prompts: [
    "Write Qiskit code to simulate a 5-qubit circuit with noise",
    "How do I use Qiskit's Aer simulator for density matrices?",
    "Show me how to measure fidelity between two quantum states",
    "Write a Qiskit function to calculate circuit depth and T-count",
    "How do I add a custom noise model in Qiskit?",
  ]},
  { category: 'Research', prompts: [
    "What are the latest advances in topological qubits?",
    "Compare IBM, Google, and IonQ quantum hardware approaches",
    "Explain quantum advantage and supremacy — what's the difference?",
    "What is quantum decoherence and how do error correcting codes fight it?",
    "Summarize the state of fault-tolerant quantum computing in 2025",
  ]},
];

const playSciFiSound = (type = 'send') => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    if (type === 'send') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'receive') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
    
    osc.connect(gain);
    gain.connect(ctx.destination);
  } catch (e) {
    // Audio not supported or blocked
  }
};

/* ─── Markdown renderer ─────────────────────────────────────────────────────── */
function CodeBlock({ code, lang, onRunInNotebook }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const isRunnable = lang === 'python' || lang === 'py' || lang === 'qiskit';

  return (
    <div className="code-cell my-2">
      <div className="code-cell-header">
        <span className="text-violet-400 font-bold">{lang || 'code'}</span>
        <div className="flex items-center gap-3">
          {isRunnable && onRunInNotebook && (
            <button onClick={() => onRunInNotebook(code)} className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors text-[10px] shadow-neon font-bold">
              <Play className="w-3 h-3"/> Run in Notebook
            </button>
          )}
          <button onClick={copy} className="flex items-center gap-1 text-gray-500 hover:text-white transition-colors">
            {copied ? <Check className="w-3 h-3 text-emerald-400"/> : <Copy className="w-3 h-3"/>}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <pre className="code-pre whitespace-pre-wrap break-all">{code}</pre>
    </div>
  );
}

const GATE_COLORS_MINI = {
  H:    { bg: 'rgba(124,58,237,0.5)',  border: '#a78bfa', text: '#ede9fe' },
  X:    { bg: 'rgba(14,116,144,0.5)', border: '#22d3ee', text: '#cffafe' },
  Y:    { bg: 'rgba(6,95,70,0.5)',    border: '#34d399', text: '#d1fae5' },
  Z:    { bg: 'rgba(30,58,95,0.5)',   border: '#60a5fa', text: '#dbeafe' },
  CNOT: { bg: 'rgba(127,29,29,0.5)', border: '#f87171', text: '#fee2e2' },
  CZ:   { bg: 'rgba(124,45,18,0.5)', border: '#fb923c', text: '#ffedd5' },
  SWAP: { bg: 'rgba(30,27,75,0.5)',  border: '#818cf8', text: '#e0e7ff' },
  T:    { bg: 'rgba(74,29,150,0.5)', border: '#c084fc', text: '#f3e8ff' },
  S:    { bg: 'rgba(19,78,74,0.5)',  border: '#2dd4bf', text: '#ccfbf1' },
  RX:   { bg: 'rgba(30,58,95,0.5)',  border: '#38bdf8', text: '#e0f2fe' },
  RY:   { bg: 'rgba(26,26,46,0.5)',  border: '#818cf8', text: '#e0e7ff' },
  RZ:   { bg: 'rgba(30,27,75,0.5)',  border: '#a78bfa', text: '#ede9fe' },
  M:    { bg: 'rgba(59,7,100,0.5)',  border: '#e879f9', text: '#fae8ff' },
};

function translateCircuitToEnglish(circuitData) {
  if (!circuitData || !Array.isArray(circuitData) || circuitData.length === 0) return [];
  
  const slots = {};
  circuitData.forEach(g => {
    if (!slots[g.slot]) slots[g.slot] = [];
    slots[g.slot].push(g);
  });

  const steps = [];
  Object.keys(slots).sort((a,b) => parseInt(a) - parseInt(b)).forEach((slotNum, i) => {
    const gates = slots[slotNum];
    let stepDescs = [];
    
    gates.forEach(g => {
      let desc = '';
      if (g.gate === 'H') desc = `Apply Hadamard to Qubit ${g.qubit}, placing it into a 50/50 superposition.`;
      else if (g.gate === 'CNOT') desc = `Entangle Qubit ${g.qubit} (control) with Qubit ${g.qubit + 1} (target) using a CNOT gate.`;
      else if (g.gate === 'X') desc = `Flip the state of Qubit ${g.qubit} using a Pauli-X (NOT) gate.`;
      else if (g.gate === 'Y') desc = `Apply Pauli-Y gate to Qubit ${g.qubit}.`;
      else if (g.gate === 'Z') desc = `Flip the phase of Qubit ${g.qubit} using a Pauli-Z gate.`;
      else if (g.gate === 'M') desc = `Measure Qubit ${g.qubit}, collapsing its quantum state into a final classical result.`;
      else if (g.gate === 'SWAP') desc = `Swap the states of Qubit ${g.qubit} and Qubit ${g.qubit + 1}.`;
      else if (g.gate === 'T') desc = `Apply a T-gate (π/8 phase rotation) to Qubit ${g.qubit}.`;
      else if (g.gate === 'S') desc = `Apply an S-gate (π/4 phase rotation) to Qubit ${g.qubit}.`;
      else if (g.gate.startsWith('R')) desc = `Rotate Qubit ${g.qubit} around the ${g.gate.slice(1)}-axis.`;
      else desc = `Apply ${g.gate} gate to Qubit ${g.qubit}.`;
      stepDescs.push({ gate: g.gate, qubit: g.qubit, text: desc });
    });

    steps.push({ step: i + 1, descriptions: stepDescs });
  });

  return steps;
}

function MiniCircuit({ circuitData, onGateClick }) {
  const [isEnglishView, setIsEnglishView] = useState(false);

  if (!circuitData || !Array.isArray(circuitData) || circuitData.length === 0) return null;

  const numQubits = Math.max(...circuitData.map(g => g.qubit), 0) + 1;
  const numSlots = Math.max(...circuitData.map(g => g.slot), 4);
  const SLOTS = Array.from({length: numSlots}, (_, i) => i + 1);

  const wires = Array.from({length: numQubits}, (_, i) => ({ id: `q${i}`, gates: {} }));
  circuitData.forEach(g => {
    if (wires[g.qubit]) wires[g.qubit].gates[g.slot] = g.gate;
  });

  const cnotTargets = new Set();
  circuitData.forEach(g => {
    if (g.gate === 'CNOT') cnotTargets.add(`${g.qubit + 1}-${g.slot}`);
  });

  const englishSteps = isEnglishView ? translateCircuitToEnglish(circuitData) : [];

  return (
    <div className="my-3 rounded-xl border border-violet-500/20 bg-[#080c18] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] bg-[#0a0d16]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-violet-400" />
          <span className="text-[10px] font-semibold text-violet-300">Interactive Circuit</span>
          <span className="badge-purple text-[9px] px-1.5">{numQubits}Q &middot; {circuitData.length} gates</span>
        </div>
        
        <div className="flex bg-[#111827] rounded-lg p-0.5 border border-white/10">
          <button 
            onClick={() => setIsEnglishView(false)}
            className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${!isEnglishView ? 'bg-violet-500/20 text-violet-300' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Visual
          </button>
          <button 
            onClick={() => setIsEnglishView(true)}
            className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all flex items-center gap-1 ${isEnglishView ? 'bg-violet-500/20 text-violet-300' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <BookOpen className="w-3 h-3" /> Plain English
          </button>
        </div>
      </div>
      
      {isEnglishView ? (
        <div className="p-4 bg-gradient-to-b from-[#080c18] to-[#0a0d16] space-y-4 max-h-[300px] overflow-y-auto no-scrollbar">
          {englishSteps.length === 0 ? (
            <div className="text-xs text-gray-500 text-center">No circuit data to translate.</div>
          ) : (
            englishSteps.map((step, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-[9px] font-bold text-violet-300 flex-shrink-0">
                    {step.step}
                  </div>
                  {idx !== englishSteps.length - 1 && <div className="w-[1px] h-full bg-violet-500/10 my-1"></div>}
                </div>
                <div className="flex-1 pb-4">
                  {step.descriptions.map((desc, dIdx) => {
                    const col = GATE_COLORS_MINI[desc.gate] || GATE_COLORS_MINI.H;
                    return (
                      <div key={dIdx} className="mb-2 last:mb-0 bg-white/5 border border-white/10 rounded-lg p-2.5 flex items-start gap-2">
                        <div 
                          className="w-6 h-6 rounded flex items-center justify-center text-[8px] font-bold flex-shrink-0"
                          style={{
                            background: col.bg,
                            border: `1px solid ${col.border}`,
                            color: col.text
                          }}
                        >
                          {desc.gate === 'M' ? '⊗' : desc.gate.slice(0,3)}
                        </div>
                        <p className="text-xs text-gray-300 leading-snug pt-0.5">{desc.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="p-3 overflow-x-auto no-scrollbar">
          {wires.map((wire, wi) => (
            <div key={wire.id} className="flex items-center gap-1.5 mb-2 min-w-max">
              <span className="w-7 text-[10px] font-mono font-bold text-violet-400 flex-shrink-0">|q{wi}&#10217;</span>
              <div className="flex-1 relative h-9 flex items-center min-w-[220px]">
                <div className="absolute inset-x-0 h-[1px] bg-white/[0.08] top-1/2" />
                <div className="relative z-10 flex items-center gap-1.5 w-full">
                  {SLOTS.map(s => {
                    const g = wire.gates[s];
                    const isTarget = cnotTargets.has(`${wi}-${s}`);
                    const col = g ? (GATE_COLORS_MINI[g] || GATE_COLORS_MINI.H) : null;
                    if (g) return (
                      <div
                        key={s}
                        onClick={() => onGateClick(g, wi)}
                        className="w-9 h-9 rounded-md flex items-center justify-center text-[9px] font-bold flex-shrink-0 cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-100 select-none"
                        style={{ background: col.bg, border: `1px solid ${col.border}`, color: col.text, boxShadow: `0 0 6px ${col.border}30` }}
                        title={g}
                      >
                        {g === 'M' ? '⊗' : g.length > 3 ? g.slice(0,3) : g}
                      </div>
                    );
                    if (isTarget) return (
                      <div key={s} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-red-400/60" style={{background: 'rgba(127,29,29,0.35)'}}>
                        <span className="text-red-300 font-bold" style={{fontSize:'15px'}}>⊕</span>
                      </div>
                    );
                    return <div key={s} className="w-9 h-9 flex-shrink-0" />;
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatBlochSphere({ data }) {
  if (!data) return null;
  return (
    <div className="bg-[#0a0d16] rounded-xl border border-white/[0.07] p-4 flex flex-col items-center w-max my-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3 text-center">
        Bloch Sphere<br/><span className="text-[8px] text-violet-400 normal-case">State Visualization</span>
      </div>
      
      <div className="relative w-32 h-32 rounded-full border border-violet-500/30 flex items-center justify-center mb-4 bg-gradient-to-br from-[#111827] to-[#080A12]">
        <div className="absolute w-[1px] h-full bg-white/5"/>
        <div className="absolute h-[1px] w-full bg-white/5"/>
        <div className="absolute top-1 text-[9px] text-gray-600 font-mono">|0⟩</div>
        <div className="absolute bottom-1 text-[9px] text-gray-600 font-mono">|1⟩</div>
        
        <div 
          className="absolute w-[1.5px] bg-violet-400 origin-bottom transition-transform duration-1000 ease-out"
          style={{ 
            height: '50%', 
            bottom: '50%',
            transform: `rotate(${data.theta_deg || 0}deg) scaleY(${data.purity || 1})`
          }}
        >
          <div className="w-2 h-2 rounded-full bg-cyan-400 absolute -top-1 -left-[3px] shadow-neon"/>
        </div>
      </div>

      <div className="w-full flex gap-2 text-center font-mono text-[10px]">
        <div className="bg-white/5 rounded px-2 py-1">X: <span className="text-violet-300">{(data.x||0).toFixed(2)}</span></div>
        <div className="bg-white/5 rounded px-2 py-1">Y: <span className="text-violet-300">{(data.y||0).toFixed(2)}</span></div>
        <div className="bg-white/5 rounded px-2 py-1">Z: <span className="text-violet-300">{(data.z||0).toFixed(2)}</span></div>
      </div>
    </div>
  );
}

function Message({ content, onGateClick, onRunInNotebook }) {
  return (
    <div className="text-sm text-gray-200 leading-relaxed min-w-0 overflow-hidden markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : '';
            const code = String(children).replace(/\n$/, '');
            if (!inline && lang === 'circuit') {
              try {
                const circuitData = JSON.parse(code);
                return <MiniCircuit circuitData={circuitData} onGateClick={onGateClick} />;
              } catch (e) {
                return <CodeBlock code={code} lang="json"/>;
              }
            }
            if (!inline && lang === 'bloch') {
              try {
                const blochData = JSON.parse(code);
                return <ChatBlochSphere data={blochData} />;
              } catch (e) {
                return <CodeBlock code={code} lang="json"/>;
              }
            }
            if (!inline) {
              return <CodeBlock code={code} lang={lang} onRunInNotebook={onRunInNotebook}/>;
            }
            return <code className="px-1.5 py-0.5 bg-violet-500/15 border border-violet-500/25 text-violet-300 rounded text-[11px] font-mono break-all" {...props}>{children}</code>;
          },
          table({node, ...props}) {
            return (
              <div className="overflow-x-auto my-4 w-full">
                <table className="w-full text-left border-collapse" {...props} />
              </div>
            );
          },
          th({node, ...props}) {
            return <th className="border-b border-white/20 p-2 font-bold text-violet-300 whitespace-nowrap" {...props} />;
          },
          td({node, ...props}) {
            return <td className="border-b border-white/10 p-2" {...props} />;
          },
          a({node, ...props}) {
            return <a className="text-violet-400 hover:underline" target="_blank" rel="noreferrer" {...props} />;
          },
          p({node, ...props}) {
            return <p className="mb-2 break-words last:mb-0" {...props} />;
          },
          h1({node, ...props}) { return <h1 className="text-xl font-bold text-white mt-4 mb-2" {...props} />; },
          h2({node, ...props}) { return <h2 className="text-lg font-bold text-white mt-4 mb-2" {...props} />; },
          h3({node, ...props}) { return <h3 className="text-base font-bold text-white mt-3 mb-1" {...props} />; },
          h4({node, ...props}) { return <h4 className="text-sm font-bold text-white mt-3 mb-1" {...props} />; },
          ul({node, ...props}) { return <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />; },
          ol({node, ...props}) { return <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />; },
          li({node, ...props}) { return <li className="marker:text-violet-400" {...props} />; },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default function ChatView({ initialPrompt, setInitialPrompt, onRunInNotebook }) {
  const [sessions, setSessions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('qation_chat_sessions')) || []; }
    catch { return []; }
  });
  const [activeSessionId, setActiveSessionId] = useState(null);

  const [model, setModel] = useState(MODELS[0]);
  const [modelOpen, setModelOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deepThought, setDeepThought] = useState(false);
  const [thoughtStage, setThoughtStage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showPromptLib, setShowPromptLib] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const sentRef = useRef(false);
  const chatAreaRef = useRef(null);

  useEffect(() => {
    if (activeSessionId) {
      const sess = sessions.find(s => s.id === activeSessionId);
      if (sess) setMessages(sess.messages);
    } else {
      setMessages([]);
    }
  }, [activeSessionId]);

  useEffect(() => {
    if (initialPrompt && !sentRef.current) {
      sentRef.current = true;
      doSend(initialPrompt);
      setInitialPrompt('');
      setTimeout(() => { sentRef.current = false; }, 200);
    }
  }, [initialPrompt]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const doSend = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput('');
    setError('');
    playSciFiSound('send');

    const userMsg = { id: Date.now(), role: 'user', content: q };
    let currentMsgs = [...messages, userMsg];
    setMessages(currentMsgs);
    setLoading(true);

    if (deepThought) {
      const stages = [
        'Mapping 4D Hilbert Space...',
        'Simulating quantum entanglement pathways...',
        'Optimizing heuristical vectors...',
        'Collapsing wave function...'
      ];
      for (const stage of stages) {
        setThoughtStage(stage);
        await new Promise(r => setTimeout(r, 600));
      }
      setThoughtStage('');
    }
    
    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      currentSessionId = Date.now().toString();
      setActiveSessionId(currentSessionId);
    }

    const saveSession = (msgs) => {
      setSessions(prev => {
        const existing = prev.find(s => s.id === currentSessionId);
        let updated;
        if (existing) {
          updated = prev.map(s => s.id === currentSessionId ? { ...s, messages: msgs } : s);
        } else {
          updated = [{ id: currentSessionId, title: msgs[0]?.content.slice(0, 30) || 'New Chat', messages: msgs, timestamp: Date.now() }, ...prev];
        }
        localStorage.setItem('qation_chat_sessions', JSON.stringify(updated));
        return updated;
      });
    };

    saveSession(currentMsgs);

    const history = currentMsgs.map(m => ({ role: m.role, content: m.content }));

    try {
      const resp = await sendChat(history, model.id);
      const asstMsg = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: resp.content,
        qsil_coherence: resp.qsil_coherence 
      };
      playSciFiSound('receive');
      currentMsgs = [...currentMsgs, asstMsg];
      setMessages(currentMsgs);
      saveSession(currentMsgs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
  };

  const handleDeleteChat = () => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== activeSessionId);
      localStorage.setItem('qation_chat_sessions', JSON.stringify(updated));
      return updated;
    });
    setActiveSessionId(null);
    setMessages([]);
  };

  const handleMicClick = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => setInput(e.results[0][0].transcript);
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const exportToPDF = () => {
    if (messages.length === 0) return;
    const win = window.open('', '_blank');
    const sessionTitle = sessions.find(s => s.id === activeSessionId)?.title || 'QATION Chat Session';
    const body = messages.map(m => {
      const role = m.role === 'user' ? '🧑 You' : '⚛️ QATION';
      const txt = m.content.replace(/```[\s\S]*?```/g, '[code block]').replace(/[<>]/g, c => c === '<' ? '&lt;' : '&gt;');
      return `<div class="msg ${m.role}"><strong>${role}</strong><p>${txt}</p></div>`;
    }).join('');
    win.document.write(`
      <!DOCTYPE html><html><head><title>${sessionTitle}</title>
      <style>
        body { font-family: 'Georgia', serif; max-width: 780px; margin: 40px auto; color: #1a1a2e; }
        h1 { font-size: 22px; border-bottom: 2px solid #7c3aed; padding-bottom: 8px; color: #4c1d95; }
        .meta { font-size: 11px; color: #888; margin-bottom: 24px; }
        .msg { margin-bottom: 20px; padding: 14px 18px; border-radius: 10px; }
        .msg.user { background: #f5f3ff; border-left: 4px solid #7c3aed; }
        .msg.assistant { background: #f8fafc; border-left: 4px solid #06b6d4; }
        .msg strong { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6d28d9; }
        .msg.assistant strong { color: #0891b2; }
        .msg p { margin: 6px 0 0; font-size: 13px; line-height: 1.7; }
        .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #eee; padding-top: 12px; }
      </style></head><body>
      <h1>⚛ ${sessionTitle}</h1>
      <div class="meta">Exported from QATION · ${new Date().toLocaleString()} · ${messages.length} messages</div>
      ${body}
      <div class="footer">Generated by QATION Quantum OS</div>
      </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  return (
    <div className="flex-1 h-full flex bg-[#080A12] overflow-hidden">
      {/* History sidebar */}
      <div className="hidden md:flex w-52 h-full bg-[#0a0d16]/80 border-r border-white/[0.07] flex-col">
        <div className="p-3 border-b border-white/[0.07] space-y-2">
          <button onClick={handleNewChat} className="w-full btn-primary justify-center py-2">
            <Plus className="w-3.5 h-3.5" /> New Chat
          </button>
          <button
            onClick={() => setShowPromptLib(p => !p)}
            className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
              showPromptLib
                ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-violet-300'
            }`}
          >
            <BookOpen className="w-3 h-3"/> Prompt Library
          </button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-4 pt-3">
          {showPromptLib ? (
            <div className="space-y-4">
              {PROMPT_LIBRARY.map(({ category, prompts }) => (
                <div key={category}>
                  <div className="px-2 mb-1 text-[9px] font-bold uppercase tracking-widest text-violet-500">{category}</div>
                  {prompts.map(p => (
                    <button
                      key={p}
                      onClick={() => { doSend(p); setShowPromptLib(false); }}
                      className="w-full text-left px-2 py-1.5 text-[10px] rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors leading-snug"
                    >{p}</button>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div className="px-2 mb-1 text-[9px] font-bold uppercase tracking-widest text-gray-600">History</div>
              {sessions.length === 0 ? (
                <div className="px-2 text-[10px] text-gray-500 italic">No previous chats</div>
              ) : (
                sessions.map((sess) => (
                  <div
                    key={sess.id}
                    onClick={() => setActiveSessionId(sess.id)}
                    className={`px-2 py-1.5 text-[11px] rounded-md cursor-pointer truncate transition-colors ${activeSessionId === sess.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
                  >
                    {sess.title}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 border-b border-white/[0.07] bg-[#080A12]/90 backdrop-blur-sm flex-shrink-0 gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-shrink">
            <h2 className="font-bold text-xs sm:text-sm text-white whitespace-nowrap">Chat with QATION</h2>
            <span className="badge-green gap-1 text-[9px] sm:text-[10px] flex-shrink-0">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>
              Live AI
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* Export PDF */}
            {messages.length > 0 && (
              <button
                onClick={exportToPDF}
                className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors hidden sm:flex"
                title="Export session to PDF"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            {/* Delete Chat */}
            {(messages.length > 0 || activeSessionId) && (
              <button
                onClick={handleDeleteChat}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete Chat"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}

            {/* Model selector */}
            <div className="relative">
              <button
                onClick={() => setModelOpen(o => !o)}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-[#111827] border border-white/10 hover:border-violet-500/40 text-[10px] sm:text-xs text-gray-300 transition-all"
              >
                <Sparkles className="w-3 h-3 text-violet-400 flex-shrink-0"/>
                <span className="truncate max-w-[70px] sm:max-w-[120px]">{model.label}</span>
                <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform flex-shrink-0 ${modelOpen ? 'rotate-180' : ''}`}/>
              </button>
              {modelOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 sm:w-60 bg-[#111827] border border-white/10 rounded-xl shadow-2xl shadow-black/60 z-50 overflow-hidden">
                  {MODELS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setModel(m); setModelOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-xs hover:bg-white/5 transition-colors ${model.id === m.id ? 'text-violet-300 bg-violet-500/5' : 'text-gray-300'}`}
                    >
                      <span className="truncate">{m.label}</span>
                      <span className="badge-purple text-[9px] px-1.5 flex-shrink-0 ml-2">{m.badge}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/30 to-indigo-600/20 border border-violet-500/40 flex items-center justify-center shadow-lg shadow-violet-500/10 neon-pulse">
                <Sparkles className="w-8 h-8 text-violet-300"/>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2">Ask QATION anything</h3>
                <p className="text-sm text-gray-500 max-w-xs">Quantum circuits, research papers, Qiskit code, math derivations…</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                {['Explain Grover\'s Algorithm', 'Build a Bell state circuit', 'What are topological qubits?'].map(hint => (
                  <button key={hint} onClick={() => doSend(hint)} className="pill text-[10px]">{hint}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 min-w-0 overflow-hidden ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="msg-assistant-avatar">
                  <Sparkles className="w-4 h-4 text-violet-300"/>
                </div>
              )}
              <div className={`min-w-0 overflow-hidden ${
                msg.role === 'user'
                  ? 'msg-user'
                  : 'flex-1'
              }`}>
                {msg.role === 'user'
                  ? <p className="text-sm text-gray-100 break-words leading-relaxed">{msg.content}</p>
                  : (
                    <div className="flex flex-col gap-2">
                      {msg.qsil_coherence !== undefined && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 w-max rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-mono font-medium">
                          <Sparkles className="w-3 h-3"/>
                          Q-SIL Coherence: {(msg.qsil_coherence * 100).toFixed(2)}%
                        </div>
                      )}
                      <Message content={msg.content} onGateClick={(gate, qubit) => doSend(`Can you explain what the ${gate} gate does on qubit ${qubit} in this circuit?`)} onRunInNotebook={onRunInNotebook} />
                    </div>
                  )
                }
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="msg-assistant-avatar">
                <Sparkles className="w-4 h-4 text-violet-300 animate-spin"/>
              </div>
              <div className="flex flex-col gap-2 max-w-[75%]">
                {thoughtStage && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#0a0d16] border border-indigo-500/30 rounded-lg text-[10px] font-mono text-indigo-300 animate-pulse w-max">
                     <Cpu className="w-3 h-3"/> {thoughtStage}
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-4 py-3 bg-[#111827]/80 border border-white/[0.08] rounded-2xl rounded-tl-sm w-max h-[46px] backdrop-blur-sm">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5"/>
              <span>{error}</span>
            </div>
          )}

          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div className="px-3 sm:px-6 pb-4 sm:pb-5 pt-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-[#111827] border border-white/10 focus-within:border-violet-500/50 rounded-2xl px-2.5 sm:px-3 py-2 sm:py-2.5 transition-all">
            <button 
              onClick={() => setDeepThought(!deepThought)}
              title="Toggle Quantum Deep Thought"
              className={`flex items-center justify-center p-1.5 rounded-lg transition-all duration-300 flex-shrink-0 ${deepThought ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-neon shadow-indigo-500/20' : 'text-gray-500 hover:text-indigo-400 border border-transparent'}`}
            >
              <Cpu className="w-4 h-4"/>
            </button>
            <button className="text-gray-500 hover:text-violet-400 transition-colors p-1 hidden sm:block flex-shrink-0"><Paperclip className="w-4 h-4"/></button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && doSend()}
              placeholder="Ask anything…"
              className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-600 focus:outline-none min-w-0 chat-input-mobile"
              style={{fontSize: '16px'}} 
            />
            <button 
              onClick={handleMicClick}
              className={`text-gray-500 transition-colors p-1 rounded-full flex-shrink-0 ${isListening ? 'text-red-400 bg-red-500/20 animate-pulse' : 'hover:text-violet-400'}`}
            >
              <Mic className="w-4 h-4"/>
            </button>
            <button
              onClick={() => doSend()}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5 text-white"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
