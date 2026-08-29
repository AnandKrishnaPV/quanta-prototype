import React, { useState, useCallback } from 'react';
import { Play, Download, CheckCircle2, AlertCircle, Loader2, Copy, Check, Sparkles, Share2, FileText } from 'lucide-react';
import { simulateCircuit, fetchBlochSphere, transpileCircuit, executeIBM, runVQA } from '../api';

// Gate error rates (typical 2-qubit + 1-qubit approximations for noise intuition)
const GATE_ERROR = {
  'H': 0.001, 'X': 0.001, 'Y': 0.001, 'Z': 0.0, 'S': 0.0, 'T': 0.002,
  'RX': 0.003, 'RY': 0.003, 'RZ': 0.002,
  'CNOT': 0.01, 'CZ': 0.01, 'SWAP': 0.015, 'M': 0.01,
};
const ENTANGLING_GATES = new Set(['CNOT','CZ','SWAP']);

// Error → colour gradient: green (clean) → amber → red (noisy)
const errorToColor = (err) => {
  if (err <= 0.001) return { bg: 'rgba(52,211,153,0.25)', border: 'rgba(52,211,153,0.6)', text: '#6ee7b7' };
  if (err <= 0.005) return { bg: 'rgba(251,191,36,0.25)', border: 'rgba(251,191,36,0.6)', text: '#fde68a' };
  return { bg: 'rgba(239,68,68,0.25)', border: 'rgba(239,68,68,0.6)', text: '#fca5a5' };
};

// Build entanglement edges from circuit definition
const computeEntanglement = (wires) => {
  const edges = {};
  wires.forEach((wire, wi) => {
    Object.entries(wire.gates).forEach(([, gate]) => {
      if (ENTANGLING_GATES.has(gate)) {
        // connect this qubit to adjacent qubits that share entangling gates in nearby slots
        wires.forEach((other, oi) => {
          if (oi !== wi) {
            const key = [Math.min(wi,oi), Math.max(wi,oi)].join('-');
            edges[key] = (edges[key] || 0) + (GATE_ERROR[gate] * 100);
          }
        });
      }
    });
  });
  return Object.entries(edges).map(([k, strength]) => {
    const [a, b] = k.split('-').map(Number);
    return { a, b, strength: Math.min(strength, 1) };
  });
};

// Generate LaTeX for a circuit
const generateLatex = (wires, result) => {
  const nQ = wires.length;
  const gateLines = [];
  wires.forEach((wire, wi) => {
    Object.entries(wire.gates).sort((a,b) => a[0]-b[0]).forEach(([slot, gate]) => {
      if (gate === 'CNOT') gateLines.push(`\\gate[2]{CNOT} & \\qw \\\\`);
      else gateLines.push(`\\gate{${gate === 'M' ? '\\meter{}' : `\\text{${gate}}`}}`);
    });
  });
  const qubitRows = wires.map((w, wi) => {
    const slots = Object.entries(w.gates).sort((a,b) => Number(a[0])-Number(b[0]));
    const cells = slots.map(([,g]) => g === 'M' ? '\\meter{}' : `\\gate{\\text{${g}}}`).join(' & ');
    return `\\lstick{|q_{${wi}}\\rangle} & ${cells || '\\qw'} & \\qw`;
  }).join(' \\\\\ \n  ');

  let latex = `\\documentclass{article}
\\usepackage{quantikz}
\\begin{document}
\n% QATION-generated quantum circuit
\\begin{quantikz}
  ${qubitRows}
\\end{quantikz}
`;

  if (result?.probabilities) {
    latex += `\n% Measurement Results (${result.shots} shots)\n`;
    result.probabilities.slice(0,6).forEach(({state, probability}) => {
      latex += `% $|${state}\\rangle$ probability: $${probability}\\%$\n`;
    });
  }

  latex += `\n\\end{document}`;
  return latex;
};

const GATE_PALETTE = ['H','X','Y','Z','RX','RY','RZ','CNOT','CZ','SWAP','T','S','M'];
const INITIAL_WIRES = [
  { id: 'q0', gates: {} },
  { id: 'q1', gates: {} },
  { id: 'q2', gates: {} },
  { id: 'q3', gates: {} },
];
const SLOTS = [1,2,3,4,5,6,7,8];

const GATE_INFO = {
  'H': { name: 'Hadamard Gate', desc: 'Creates a perfect 50/50 superposition, putting the qubit into a state where it is both 0 and 1 simultaneously.' },
  'X': { name: 'Pauli-X (NOT)', desc: 'Flips the state of the qubit (0 becomes 1, and 1 becomes 0), equivalent to a classical NOT gate.' },
  'Y': { name: 'Pauli-Y Gate', desc: 'Rotates the qubit state around the Y-axis of the Bloch sphere by π radians.' },
  'Z': { name: 'Pauli-Z (Phase)', desc: 'Flips the phase of the qubit by π radians without changing its probability of being measured as 0 or 1.' },
  'RX': { name: 'RX Rotation', desc: 'Performs a parameterized rotation around the X-axis of the Bloch sphere.' },
  'RY': { name: 'RY Rotation', desc: 'Performs a parameterized rotation around the Y-axis of the Bloch sphere.' },
  'RZ': { name: 'RZ Rotation', desc: 'Performs a parameterized rotation around the Z-axis of the Bloch sphere.' },
  'CNOT': { name: 'Controlled-NOT', desc: 'Entangles two qubits. It flips the target qubit only if the control qubit is in state |1⟩.' },
  'CZ': { name: 'Controlled-Z', desc: 'Applies a Z gate to the target qubit only if the control qubit is in state |1⟩.' },
  'SWAP': { name: 'SWAP Gate', desc: 'Swaps the states of two qubits.' },
  'T': { name: 'T Gate', desc: 'Applies a π/4 phase shift. It is crucial for universal fault-tolerant quantum computing.' },
  'S': { name: 'S Gate (Phase)', desc: 'Applies a π/2 phase shift, equivalent to a 90-degree rotation around the Z-axis.' },
  'M': { name: 'Measurement', desc: 'Collapses the quantum superposition into a definitive classical bit (0 or 1).' }
};

export default function QuantumLabView({ setActiveTab, setInitialPrompt }) {
  const [selectedGate, setSelectedGate] = useState('H');
  const [wires, setWires] = useState(INITIAL_WIRES);
  const [simTab, setSimTab] = useState('probabilities');
  const [backend, setBackend] = useState('Statevector Simulator');
  const [shots, setShots]   = useState(1024);
  const [running, setRunning] = useState(false);
  const [result, setResult]   = useState(null);
  const [blochData, setBlochData] = useState(null);
  const [error, setError]     = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [gateInfo, setGateInfo] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [latexCopied, setLatexCopied] = useState(false);

  // Enterprise Features State
  const [isTranspiling, setIsTranspiling] = useState(false);
  const [transpileResult, setTranspileResult] = useState(null);
  
  const [showIbmModal, setShowIbmModal] = useState(false);
  const [ibmToken, setIbmToken] = useState('');
  const [isExecutingIbm, setIsExecutingIbm] = useState(false);
  const [ibmResult, setIbmResult] = useState(null);
  
  const [isVqaRunning, setIsVqaRunning] = useState(false);
  const [vqaData, setVqaData] = useState(null);
  const addWire = () => {
    if (wires.length >= 8) return;
    setWires(prev => [...prev, { id: `q${prev.length}`, gates: {} }]);
  };

  const removeWire = () => {
    if (wires.length <= 1) return;
    setWires(prev => prev.slice(0, -1));
  };

  const placeGate = (wIdx, slot) => {
    // If clicking an empty slot, place the selected gate
    if (!wires[wIdx].gates[slot]) {
      setWires(prev => {
        const copy = prev.map(w => ({ ...w, gates: { ...w.gates } }));
        copy[wIdx].gates[slot] = selectedGate;
        return copy;
      });
      setResult(null);
      setError('');
    } else {
      // If clicking a filled slot, open the info panel
      setGateInfo({ gate: wires[wIdx].gates[slot], wi: wIdx, slot });
    }
  };

  const removePlacedGate = () => {
    if (!gateInfo) return;
    setWires(prev => {
      const copy = prev.map(w => ({ ...w, gates: { ...w.gates } }));
      delete copy[gateInfo.wi].gates[gateInfo.slot];
      return copy;
    });
    setGateInfo(null);
    setResult(null);
    setError('');
  };

  const clearCircuit = () => {
    setWires(INITIAL_WIRES.map(w => ({ ...w, gates: {} })));
    setResult(null);
    setError('');
  };

  const runSim = async () => {
    // Build gate list for the backend
    const gates = [];
    wires.forEach((wire, wi) => {
      Object.entries(wire.gates).forEach(([slot, gate]) => {
        gates.push({ qubit: wi, slot: parseInt(slot), gate });
      });
    });

    if (gates.length === 0) {
      setError('Add some gates to the circuit first!');
      return;
    }

    setRunning(true);
    setError('');
    setResult(null);
    setBlochData(null);

    try {
      const [simRes, blochRes] = await Promise.all([
        simulateCircuit({ qubits: wires.length, gates, shots }),
        fetchBlochSphere(wires.length, gates).catch(() => null)
      ]);
      setResult(simRes);
      setBlochData(blochRes);
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  const handleOptimize = () => {
    const gates = [];
    wires.forEach((wire, wi) => {
      Object.entries(wire.gates).forEach(([slot, gate]) => {
        gates.push({ qubit: wi, slot: parseInt(slot), gate });
      });
    });
    
    if (gates.length === 0) {
      setError('Add some gates to the circuit first!');
      return;
    }

    const circuitJson = JSON.stringify(gates, null, 2);
    setInitialPrompt(`Please analyze and optimize this quantum circuit:\n\n\`\`\`circuit\n${circuitJson}\n\`\`\``);
    setActiveTab('chat');
  };

  const copyCode = () => {
    if (result?.qiskit_code) {
      navigator.clipboard.writeText(result.qiskit_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1500);
    }
  };

  const exportLatex = () => {
    const tex = generateLatex(wires, result);
    const blob = new Blob([tex], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'qation_circuit.tex'; a.click();
    URL.revokeObjectURL(url);
  };

  const copyLatex = () => {
    navigator.clipboard.writeText(generateLatex(wires, result));
    setLatexCopied(true); setTimeout(() => setLatexCopied(false), 1500);
  };

  const totalGates = wires.reduce((a, w) => a + Object.keys(w.gates).length, 0);
  const depth = SLOTS.filter(s => wires.some(w => w.gates[s])).length;

  const handleTranspile = async () => {
    const gates = [];
    wires.forEach((wire, wi) => {
      Object.entries(wire.gates).forEach(([slot, gate]) => {
        gates.push({ qubit: wi, slot: parseInt(slot), gate });
      });
    });
    if (gates.length === 0) {
      setError('Add some gates to the circuit first!');
      return;
    }
    setIsTranspiling(true);
    setError('');
    try {
      const res = await transpileCircuit(wires.length, gates);
      setTranspileResult(res);
      setSimTab('transpile'); // We'll add this tab
    } catch (e) {
      setError(e.message);
    } finally {
      setIsTranspiling(false);
    }
  };

  const handleIbmExecute = async () => {
    if (!ibmToken) {
      setError("Please enter a valid IBM Quantum API Token.");
      return;
    }
    const gates = [];
    wires.forEach((wire, wi) => {
      Object.entries(wire.gates).forEach(([slot, gate]) => {
        gates.push({ qubit: wi, slot: parseInt(slot), gate });
      });
    });
    if (gates.length === 0) {
      setError('Add some gates to the circuit first!');
      return;
    }
    setIsExecutingIbm(true);
    setError('');
    try {
      const res = await executeIBM(ibmToken, wires.length, gates);
      setIbmResult(res);
      setSimTab('ibm_results');
      setShowIbmModal(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsExecutingIbm(false);
    }
  };

  const handleVqaRun = async () => {
    setIsVqaRunning(true);
    setError('');
    setSimTab('vqa');
    try {
      const res = await runVQA("H2");
      setVqaData(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsVqaRunning(false);
    }
  };

// Top 5 probability results for the bar chart
  const probs = result?.probabilities?.slice(0, 5) ?? [];
  const maxProb = probs.reduce((m, p) => Math.max(m, p.probability), 0) || 100;

  return (
    <div className="flex-1 h-full bg-[#080A12] grid grid-cols-2 overflow-hidden border-t border-white/[0.07]">

      {/* ─── LEFT: Circuit Builder ─────────────────────────────────── */}
      <div className="glass-card !rounded-none !border-0 border-r !border-r-white/[0.07] flex flex-col overflow-hidden">
        {/* Main Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 className="font-bold text-sm text-white">Circuit Builder</h2>
            <div className="flex items-center gap-1">
              <span className="badge-purple text-[10px] h-6 px-2 flex items-center">{wires.length} Qubits</span>
              <button onClick={removeWire} disabled={wires.length <= 1} className="w-6 h-6 flex items-center justify-center rounded-md bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 border border-white/10 transition-colors">-</button>
              <button onClick={addWire} disabled={wires.length >= 8} className="w-6 h-6 flex items-center justify-center rounded-md bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 border border-white/10 transition-colors">+</button>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.07] bg-[#0a0d16]/40 shrink-0 overflow-x-auto no-scrollbar">
          <button onClick={clearCircuit} className="h-7 px-3 rounded-md text-[11px] font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap">
            Clear
          </button>
          <div className="w-px h-4 bg-white/10" />
          <button
            onClick={() => setShowHeatmap(h => !h)}
            className={`flex items-center gap-1.5 h-7 px-3 rounded-md border transition-all text-[11px] font-bold whitespace-nowrap ${
              showHeatmap
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-300 shadow-neon'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-amber-300'
            }`}
            title="Toggle Error Heatmap"
          >
            ⚠ Heatmap
          </button>
          <button 
            onClick={handleOptimize} 
            className="flex items-center gap-1.5 h-7 px-3 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold hover:bg-indigo-500/20 transition-all shadow-neon whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5"/> Optimize
          </button>
          {result?.qiskit_code && (
            <button onClick={copyCode} className="flex items-center gap-1.5 h-7 px-3 rounded-md bg-white/5 border border-white/10 text-[11px] font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap">
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400"/> : <Copy className="w-3.5 h-3.5 text-violet-400"/>}
              {copiedCode ? 'Copied' : 'Code'}
            </button>
          )}
        </div>

        <div className="flex flex-1 gap-3 p-3 overflow-hidden">
          {/* Gate palette */}
          <div className="flex flex-col items-center gap-1 w-10 overflow-y-auto no-scrollbar">
            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-1">Gates</div>
            {GATE_PALETTE.map(g => (
              <div
                key={g}
                onClick={() => setSelectedGate(g)}
                title={g}
                className={`gate-key text-[10px] ${selectedGate === g ? 'bg-violet-600 text-white border-violet-400 shadow-neon' : ''}`}
              >
                {g.length > 2 ? g.slice(0,2) : g}
              </div>
            ))}
          </div>

          {/* Qubit workspace */}
          <div className="flex-1 bg-[#0a0d16] rounded-xl border border-white/[0.07] p-2 flex flex-col justify-around overflow-y-auto no-scrollbar relative">
            <div className="text-[9px] text-gray-600 text-center mb-1 font-mono">Click a slot to place <span className="text-violet-400 font-bold">{selectedGate}</span> · Click a gate to learn more</div>
            {wires.map((wire, wi) => (
              <div key={wire.id} className="flex items-center gap-1.5 mb-1">
                <span className="w-6 text-[11px] font-mono font-bold text-violet-400 flex-shrink-0">{wire.id}</span>
                <div className="flex-1 relative h-10 flex items-center">
                  <div className="absolute inset-x-0 h-[1.5px] bg-white/10 top-1/2"/>
                  <div className="relative z-10 flex items-center justify-around w-full gap-1">
                    {SLOTS.map(s => {
                      const g = wire.gates[s];
                      const isSelected = gateInfo?.wi === wi && gateInfo?.slot === s;
                      const err = showHeatmap && g ? GATE_ERROR[g] ?? 0.005 : null;
                      const col = err !== null ? errorToColor(err) : null;
                      return g
                        ? <div
                            key={s}
                            onClick={() => placeGate(wi, s)}
                            className={`gate-placed text-[9px] flex-shrink-0 transition-all duration-500 ${isSelected ? 'scale-110 shadow-neon ring-1 ring-violet-400' : ''}`}
                            style={col ? { background: col.bg, borderColor: col.border, color: col.text, boxShadow: `0 0 6px ${col.border}` } : {}}
                            title={col ? `Error rate: ${((GATE_ERROR[g]??0.005)*100).toFixed(2)}%` : ''}
                          >{g.length > 3 ? g.slice(0,3) : g}</div>
                        : <div key={s} onClick={() => placeGate(wi, s)} className="gate-slot-empty text-gray-700 text-sm flex-shrink-0">+</div>;
                    })}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Gate Info Overlay */}
            {gateInfo && (
              <div className="absolute inset-0 bg-[#080A12]/80 backdrop-blur-sm z-20 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-[#0a0d16] border border-violet-500/30 rounded-xl p-4 max-w-[240px] shadow-2xl relative">
                  <button onClick={() => setGateInfo(null)} className="absolute top-2 right-2 text-gray-500 hover:text-white">
                    <AlertCircle className="w-4 h-4 opacity-0" /> {/* Spacer */}
                    <div className="absolute inset-0 flex items-center justify-center">✕</div>
                  </button>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="gate-placed text-[10px] w-6 h-6 flex items-center justify-center shrink-0">
                      {gateInfo.gate.length > 3 ? gateInfo.gate.slice(0,3) : gateInfo.gate}
                    </div>
                    <h3 className="font-bold text-violet-200 text-xs">{GATE_INFO[gateInfo.gate]?.name || gateInfo.gate}</h3>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed mb-4">
                    {GATE_INFO[gateInfo.gate]?.desc || 'Modifies the quantum state of the qubit.'}
                  </p>
                  <button onClick={removePlacedGate} className="w-full py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md text-[10px] font-bold transition-colors">
                    Remove Gate
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Circuit metrics */}
        <div className="px-4 py-2.5 border-t border-white/[0.07] bg-[#0a0d16]/60 grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'Qubits', value: wires.length },
            { label: 'Gates',  value: totalGates },
            { label: 'Depth',  value: depth },
            { label: 'Shots',  value: shots },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="font-mono font-bold text-violet-300 text-sm">{value}</div>
              <div className="text-[9px] text-gray-500 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── RIGHT: Quantum Simulator ──────────────────────────────── */}
      <div className="glass-card !rounded-none !border-0 flex flex-col overflow-hidden relative">
        {/* Main Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 className="font-bold text-sm text-white">Quantum Simulator</h2>
            <select
              value={backend}
              onChange={e => setBackend(e.target.value)}
              className="text-[11px] bg-[#0a0d16] border border-white/10 text-violet-200 rounded-lg px-2 py-1 outline-none cursor-pointer"
            >
              <option>Statevector Simulator</option>
              <option>Density Matrix</option>
            </select>
          </div>
        </div>

        {/* Config Toolbar */}
        <div className="flex items-center px-4 py-2 border-b border-white/[0.07] bg-[#0a0d16]/40 shrink-0 overflow-x-auto no-scrollbar gap-4">
          <div className="flex items-center gap-4 text-[11px] text-gray-400 shrink-0">
            <label className="flex items-center gap-2">
              Shots:
              <select
                value={shots}
                onChange={e => setShots(Number(e.target.value))}
                className="bg-[#0a0d16] border border-white/10 text-violet-300 rounded px-1.5 py-0.5 outline-none cursor-pointer"
              >
                {[128, 512, 1024, 4096, 8192].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <span>Backend: <strong className="text-violet-300">Qiskit Aer</strong></span>
            {result && <span>Time: <strong className="text-violet-300 font-mono">{result.time ?? '~0.1'}s</strong></span>}
          </div>
        </div>

        {/* Execution Toolbar (Separate Section) */}
        <div className="flex items-center justify-end px-4 py-2 border-b border-white/[0.07] bg-[#0a0d16]/60 shrink-0 overflow-x-auto no-scrollbar gap-3">
          <button
            onClick={() => setShowIbmModal(true)}
            className="flex items-center gap-1.5 h-7 px-4 rounded-md border border-blue-500/30 bg-blue-500/5 text-blue-300 text-[11px] font-bold hover:bg-blue-500/15 transition-all whitespace-nowrap shadow-neon"
          >
            <Sparkles className="w-3.5 h-3.5"/> IBM Hardware
          </button>
          <button
            onClick={handleTranspile}
            disabled={isTranspiling || totalGates === 0}
            className="flex items-center gap-1.5 h-7 px-4 rounded-md border border-amber-500/30 bg-amber-500/5 text-amber-300 text-[11px] font-bold hover:bg-amber-500/15 transition-all disabled:opacity-40 whitespace-nowrap shadow-neon"
          >
            {isTranspiling ? <Loader2 className="w-3 h-3 animate-spin"/> : <CheckCircle2 className="w-3 h-3"/>} 
            Transpile
          </button>
          <button
            onClick={runSim}
            disabled={running || totalGates === 0}
            className="flex items-center justify-center gap-1.5 h-7 px-6 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold transition-all shadow-neon disabled:opacity-40 whitespace-nowrap"
          >
            {running
              ? <><Loader2 className="w-3 h-3 animate-spin"/> Running…</>
              : <><Play className="w-3 h-3 fill-current"/> Run Circuit</>
            }
          </button>
        </div>

        {/* Visualization & Analysis Tabs */}
        <div className="flex gap-4 px-4 pt-2.5 border-b border-white/[0.07] text-[11px] font-medium flex-shrink-0 overflow-x-auto no-scrollbar">
          <span className="text-gray-600 font-bold uppercase tracking-widest mr-2 py-0.5">Analysis:</span>
          {[
            ['probabilities','Probabilities'],
            ['bloch','Bloch Sphere'],
            ['entanglement','Entanglement'],
            ['vqa','VQA Training']
          ].map(([k,l]) => (
            <button key={k} onClick={() => { if (k === 'vqa' && !vqaData && !isVqaRunning) handleVqaRun(); else setSimTab(k); }}
              className={`pb-2 transition-colors whitespace-nowrap ${simTab===k ? 'text-violet-400 border-b-2 border-violet-500 font-semibold' : 'text-gray-500 hover:text-gray-300'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Code & Export Tabs */}
        <div className="flex gap-4 px-4 pt-2.5 border-b border-white/[0.07] text-[11px] font-medium flex-shrink-0 overflow-x-auto no-scrollbar bg-[#0a0d16]/30">
          <span className="text-gray-600 font-bold uppercase tracking-widest mr-2 py-0.5">Exports:</span>
          {[
            ['latex','LaTeX'],
            ['code','Qiskit Code'],
            ['transpile','Optimized QASM'],
            ['ibm_results','IBM Hardware']
          ].map(([k,l]) => (
            <button key={k} onClick={() => setSimTab(k)}
              className={`pb-2 transition-colors whitespace-nowrap ${simTab===k ? 'text-violet-400 border-b-2 border-violet-500 font-semibold' : 'text-gray-500 hover:text-gray-300'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Visualization */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5"/>
              {error}
            </div>
          )}

          {/* Empty state */}
          {!result && !running && !error && (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-center opacity-50">
              <Play className="w-8 h-8 text-violet-400"/>
              <p className="text-xs text-gray-400">Build a circuit on the left,<br/>then click <strong className="text-violet-300">Run Circuit</strong></p>
            </div>
          )}

          {running && (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin"/>
              <p className="text-xs text-violet-300 font-medium">Running Qiskit simulation…</p>
            </div>
          )}

          {/* Probabilities */}
          {result && simTab === 'probabilities' && (
            <>
              {/* Real results banner */}
              <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5"/> Real Qiskit Aer result · {result.shots} shots · Depth {result.depth} · {result.gate_count} gates
              </div>

              {/* Bar chart */}
              <div className="bg-[#0a0d16] rounded-xl border border-white/[0.07] p-4 flex items-end justify-around h-44 gap-2">
                {probs.map(({ state, probability }) => (
                  <div key={state} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-[10px] font-mono text-violet-300 font-bold">{probability}%</span>
                    <div className="w-full bg-white/5 rounded-t-md h-28 relative overflow-hidden flex items-end">
                      <div
                        className="w-full bg-gradient-to-t from-violet-700 to-violet-400 rounded-t-md transition-all duration-700 ease-out"
                        style={{ height: `${(probability / maxProb) * 100}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-gray-500 text-center leading-tight">{state}</span>
                  </div>
                ))}
              </div>

              {/* State count table */}
              <div className="grid grid-cols-4 gap-2">
                {probs.map(({ state, probability }) => (
                  <div key={state} className="bg-[#0a0d16] border border-white/[0.07] rounded-xl py-2.5 text-center">
                    <div className="text-[9px] text-gray-500 font-mono">{state}</div>
                    <div className="text-xs font-bold text-violet-300 font-mono mt-0.5">{probability}%</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Bloch Sphere */}
          {result && simTab === 'bloch' && (
            <div className="grid grid-cols-2 gap-3">
              {(blochData?.bloch_vectors || []).map((b, i) => (
                <div key={i} className="bg-[#0a0d16] rounded-xl border border-white/[0.07] p-4 flex flex-col items-center">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Qubit {b.qubit}</div>
                  
                  {/* 2D representation of the 3D bloch vector */}
                  <div className="relative w-24 h-24 rounded-full border border-violet-500/30 flex items-center justify-center mb-4 bg-gradient-to-br from-[#111827] to-[#080A12]">
                    <div className="absolute w-[1px] h-full bg-white/5"/>
                    <div className="absolute h-[1px] w-full bg-white/5"/>
                    {/* Z axis indicator */}
                    <div className="absolute top-1 text-[8px] text-gray-600 font-mono">|0⟩</div>
                    <div className="absolute bottom-1 text-[8px] text-gray-600 font-mono">|1⟩</div>
                    
                    {/* The vector arrow (projected onto X-Z plane for 2D visualization) */}
                    <div 
                      className="absolute w-[1px] bg-violet-400 origin-bottom"
                      style={{ 
                        height: '50%', 
                        bottom: '50%',
                        transform: `rotate(${b.theta_deg}deg) scaleY(${b.purity})`
                      }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 absolute -top-0.5 -left-[2.5px] shadow-neon"/>
                    </div>
                  </div>

                  <div className="w-full grid grid-cols-3 gap-1 text-center font-mono text-[9px]">
                    <div className="bg-white/5 rounded p-1">X: <span className="text-violet-300">{b.x.toFixed(2)}</span></div>
                    <div className="bg-white/5 rounded p-1">Y: <span className="text-violet-300">{b.y.toFixed(2)}</span></div>
                    <div className="bg-white/5 rounded p-1">Z: <span className="text-violet-300">{b.z.toFixed(2)}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Entanglement Graph */}
          {simTab === 'entanglement' && (() => {
            const edges = computeEntanglement(wires);
            const nQ = wires.length;
            const cx = 50; // % centering
            const r = 38; // radius %
            const pts = wires.map((_, i) => ({
              x: 50 + r * Math.cos((2 * Math.PI * i / nQ) - Math.PI / 2),
              y: 50 + r * Math.sin((2 * Math.PI * i / nQ) - Math.PI / 2),
            }));
            return (
              <div className="bg-[#0a0d16] rounded-xl border border-white/[0.07] p-4">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Live Entanglement Graph</div>
                {edges.length === 0 ? (
                  <div className="text-center text-gray-500 text-xs py-8">
                    No entangling gates (CNOT, CZ, SWAP) detected.<br/>Add some to see entanglement.
                  </div>
                ) : (
                  <svg viewBox="0 0 100 100" className="w-full h-48">
                    {edges.map(({a,b,strength},i) => (
                      <line key={i}
                        x1={pts[a].x} y1={pts[a].y} x2={pts[b].x} y2={pts[b].y}
                        stroke={`rgba(139,92,246,${0.3 + strength * 0.7})`}
                        strokeWidth={0.5 + strength * 2.5}
                        strokeLinecap="round"
                      >
                        <animate attributeName="stroke-opacity" values={`${0.4+strength*0.4};${0.8+strength*0.2};${0.4+strength*0.4}`} dur="2s" repeatCount="indefinite"/>
                      </line>
                    ))}
                    {pts.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="4.5" fill="#1e1b4b" stroke="#7c3aed" strokeWidth="0.8"/>
                        <circle cx={p.x} cy={p.y} r="4.5" fill="none" stroke="#a78bfa" strokeWidth="0.4" opacity="0.6">
                          <animate attributeName="r" values="4.5;6;4.5" dur="3s" repeatCount="indefinite"/>
                          <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite"/>
                        </circle>
                        <text x={p.x} y={p.y + 0.8} textAnchor="middle" dominantBaseline="middle" fontSize="2.8" fill="#c4b5fd" fontFamily="monospace">q{i}</text>
                      </g>
                    ))}
                    {edges.map(({a,b,strength},i) => {
                      const mx = (pts[a].x+pts[b].x)/2, my = (pts[a].y+pts[b].y)/2;
                      return <text key={`t${i}`} x={mx} y={my-1.5} textAnchor="middle" fontSize="2" fill="#a78bfa" fontFamily="monospace">{(strength*100).toFixed(0)}%</text>;
                    })}
                  </svg>
                )}
                <div className="mt-2 flex gap-3 text-[9px] text-gray-600">
                  <span className="flex items-center gap-1"><span className="w-6 h-[2px] bg-violet-400 inline-block rounded"/>Strong</span>
                  <span className="flex items-center gap-1"><span className="w-6 h-[1px] bg-violet-600 inline-block rounded"/>Weak</span>
                  <span className="ml-auto">Edge weight = entanglement contribution</span>
                </div>
              </div>
            );
          })()}

          {/* LaTeX Exporter */}
          {simTab === 'latex' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Circuit → LaTeX (quantikz)</div>
                <div className="flex gap-2">
                  <button onClick={copyLatex} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 transition-colors">
                    {latexCopied ? <Check className="w-3 h-3 text-emerald-400"/> : <Copy className="w-3 h-3"/>}
                    {latexCopied ? 'Copied!' : 'Copy'}
                  </button>
                  <button onClick={exportLatex} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 font-bold transition-colors">
                    <Download className="w-3 h-3"/> Export .tex
                  </button>
                </div>
              </div>
              <div className="code-cell">
                <div className="code-cell-header"><span className="text-violet-400 font-bold">latex</span></div>
                <pre className="code-pre text-[10px]">{generateLatex(wires, result)}</pre>
              </div>
              <div className="text-[9px] text-gray-600 leading-relaxed">
                Paste into any LaTeX editor with the <code className="text-violet-400">quantikz</code> package installed.
                Overleaf supports it natively.
              </div>
            </div>
          )}

          {/* Qiskit Code */}
          {result && simTab === 'code' && (
            <div className="code-cell">
              <div className="code-cell-header">
                <span className="text-violet-400 font-bold">python (qiskit)</span>
                <button onClick={copyCode} className="flex items-center gap-1 text-gray-500 hover:text-white transition-colors">
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400"/> : <Copy className="w-3 h-3"/>}
                  {copiedCode ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="code-pre">{result.qiskit_code}</pre>
            </div>
          )}

          {/* Transpile Results */}
          {simTab === 'transpile' && !transpileResult && !isTranspiling && (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-center opacity-50">
              <CheckCircle2 className="w-8 h-8 text-amber-400"/>
              <p className="text-xs text-gray-400">Circuit has not been optimized yet.<br/>Click <strong className="text-amber-300">Transpile</strong> in the toolbar.</p>
            </div>
          )}
          {simTab === 'transpile' && isTranspiling && (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin"/>
              <p className="text-xs text-amber-300 font-medium">Running optimization pass...</p>
            </div>
          )}
          {simTab === 'transpile' && transpileResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0a0d16] rounded-xl border border-white/[0.07] p-4 text-center">
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Original Circuit</div>
                  <div className="flex justify-center gap-6">
                    <div>
                      <div className="text-sm font-bold text-violet-300 font-mono">{transpileResult.original.depth}</div>
                      <div className="text-[9px] text-gray-500">Depth</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-violet-300 font-mono">{transpileResult.original.gate_count}</div>
                      <div className="text-[9px] text-gray-500">Gates</div>
                    </div>
                  </div>
                </div>
                <div className="bg-[#0a0d16] rounded-xl border border-amber-500/20 p-4 text-center shadow-[0_0_15px_rgba(245,158,11,0.05)]">
                  <div className="text-[10px] text-amber-500/80 font-bold uppercase tracking-widest mb-2 flex items-center justify-center gap-1"><Sparkles className="w-3 h-3"/> Optimized</div>
                  <div className="flex justify-center gap-6">
                    <div>
                      <div className="text-sm font-bold text-amber-300 font-mono">{transpileResult.optimized.depth}</div>
                      <div className="text-[9px] text-amber-500/60">Depth</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-amber-300 font-mono">{transpileResult.optimized.gate_count}</div>
                      <div className="text-[9px] text-amber-500/60">Gates</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="code-cell">
                <div className="code-cell-header border-amber-500/10"><span className="text-amber-400 font-bold">optimized.qasm</span></div>
                <pre className="code-pre text-[10px]">{transpileResult.qasm}</pre>
              </div>
            </div>
          )}

          {/* IBM Hardware Results */}
          {simTab === 'ibm_results' && !ibmResult && (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-center opacity-50">
              <Sparkles className="w-8 h-8 text-blue-400"/>
              <p className="text-xs text-gray-400">No hardware execution results.<br/>Click <strong className="text-blue-300">IBM Hardware</strong> to submit job.</p>
            </div>
          )}
          {simTab === 'ibm_results' && ibmResult && (
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-blue-300">Execution Successful</h3>
                  <p className="text-[11px] text-blue-200/70 mt-1">{ibmResult.message}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#0a0d16] rounded-xl border border-white/[0.07] p-3 text-center">
                  <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Backend</div>
                  <div className="text-xs font-bold text-blue-300 font-mono">{ibmResult.backend}</div>
                </div>
                <div className="bg-[#0a0d16] rounded-xl border border-white/[0.07] p-3 text-center">
                  <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Job ID</div>
                  <div className="text-xs font-bold text-blue-300 font-mono">{ibmResult.job_id}</div>
                </div>
                <div className="bg-[#0a0d16] rounded-xl border border-white/[0.07] p-3 text-center">
                  <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Shots</div>
                  <div className="text-xs font-bold text-blue-300 font-mono">{ibmResult.shots}</div>
                </div>
              </div>
              
              <div className="bg-[#0a0d16] rounded-xl border border-white/[0.07] p-4 flex items-end justify-around h-44 gap-2">
                {Object.entries(ibmResult.results).map(([state, count]) => {
                   const probability = ((count / ibmResult.shots) * 100).toFixed(1);
                   return (
                     <div key={state} className="flex flex-col items-center gap-1 flex-1">
                       <span className="text-[10px] font-mono text-blue-300 font-bold">{probability}%</span>
                       <div className="w-full bg-white/5 rounded-t-md h-28 relative overflow-hidden flex items-end">
                         <div
                           className="w-full bg-gradient-to-t from-blue-700 to-blue-400 rounded-t-md transition-all duration-700 ease-out"
                           style={{ height: `${probability}%` }}
                         />
                       </div>
                       <span className="text-[9px] font-mono text-gray-500 text-center leading-tight">{state}</span>
                     </div>
                   );
                })}
              </div>
            </div>
          )}

          {/* VQA Real-Time Chart */}
          {simTab === 'vqa' && (isVqaRunning || vqaData) && (
             <div className="bg-[#0a0d16] rounded-xl border border-white/[0.07] p-4 relative h-64 flex flex-col">
               <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center justify-between mb-4">
                 <span>VQE Optimization Loop ({vqaData ? vqaData.molecule : 'H2'})</span>
                 {isVqaRunning && <span className="flex items-center gap-1 text-emerald-400"><Loader2 className="w-3 h-3 animate-spin"/> Training...</span>}
               </div>
               
               <div className="flex-1 relative flex items-end">
                 {/* Target Line */}
                 {vqaData && (
                   <div className="absolute w-full border-t border-emerald-500/50 border-dashed" style={{ bottom: '10%' }}>
                     <span className="absolute -top-4 right-0 text-[9px] text-emerald-400 font-mono">Target: {vqaData.target_energy} Ha</span>
                   </div>
                 )}
                 
                 {/* The Line Chart */}
                 <div className="w-full h-full flex items-end gap-[1px]">
                   {(vqaData?.history || []).map((point, i) => {
                     // Normalize height mapping roughly to visually show convergence
                     const heightPct = Math.max(10, Math.min(100, 100 - (i * 1.8)));
                     return (
                       <div key={i} className="flex-1 bg-violet-500/30 hover:bg-violet-400 transition-all rounded-t-sm group relative" style={{ height: `${heightPct}%` }}>
                         <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 px-1 py-0.5 rounded text-[8px] text-white opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                           {point.cost} Ha
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>
               
               <div className="mt-4 flex justify-between text-[9px] text-gray-600 font-mono">
                 <span>Iteration 0</span>
                 <span>Iteration 50</span>
               </div>
             </div>
          )}

        </div>

        {/* Footer status */}
        <div className="px-4 py-2.5 border-t border-white/[0.07] flex items-center justify-between text-[11px] text-gray-500 flex-shrink-0">
          <span>Status: <strong className={(result || ibmResult || transpileResult || vqaData) ? 'text-emerald-400' : (running || isTranspiling || isExecutingIbm || isVqaRunning) ? 'text-yellow-400' : 'text-gray-500'}>
            {(running || isTranspiling || isExecutingIbm || isVqaRunning) ? 'Running' : (result || ibmResult || transpileResult || vqaData) ? 'Completed' : 'Ready'}
          </strong></span>
          {result && (
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3"/> Qiskit Aer · Real simulation
            </span>
          )}
        </div>
      </div>

      {/* IBM Token Modal */}
      {showIbmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0d16] border border-blue-500/30 rounded-xl p-6 w-full max-w-md shadow-2xl relative animate-fade-in">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400"/> Run on IBM Quantum
            </h2>
            {error && (
              <div className="mb-4 p-2 bg-red-500/10 border border-red-500/30 rounded text-[10px] text-red-300">
                {error}
              </div>
            )}
            <p className="text-[11px] text-gray-400 mb-5 leading-relaxed">
              Execute your QATION circuit directly on physical IBM superconducting processors. Enter your IBM Quantum API Token to securely submit this job to the cloud.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">API Token</label>
                <input 
                  type="password" 
                  value={ibmToken}
                  onChange={e => setIbmToken(e.target.value)}
                  className="w-full bg-[#080A12] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
                  placeholder="Paste your IBM Quantum token here..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowIbmModal(false)} className="px-4 py-2 rounded-lg text-xs text-gray-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={handleIbmExecute}
                  disabled={isExecutingIbm || !ibmToken}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-neon disabled:opacity-50 flex items-center gap-2"
                >
                  {isExecutingIbm ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4"/>}
                  Execute Job
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
