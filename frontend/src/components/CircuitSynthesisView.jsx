import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Play, Copy, Check, ChevronRight, Cpu, Code2,
  Wand2, RefreshCw, Zap, BarChart3, AlertCircle, ArrowRight
} from 'lucide-react';
import { synthesizeCircuit, simulateCircuit } from '../api';

// ─── Gate Color Map ───────────────────────────────────────────────────────────
const GATE_COLORS = {
  H:    { bg: '#7c3aed', border: '#a78bfa', text: '#ede9fe' },
  X:    { bg: '#0e7490', border: '#22d3ee', text: '#cffafe' },
  Y:    { bg: '#065f46', border: '#34d399', text: '#d1fae5' },
  Z:    { bg: '#1e3a5f', border: '#60a5fa', text: '#dbeafe' },
  CNOT: { bg: '#7f1d1d', border: '#f87171', text: '#fee2e2' },
  CZ:   { bg: '#7c2d12', border: '#fb923c', text: '#ffedd5' },
  SWAP: { bg: '#1e1b4b', border: '#818cf8', text: '#e0e7ff' },
  T:    { bg: '#4a1d96', border: '#c084fc', text: '#f3e8ff' },
  S:    { bg: '#134e4a', border: '#2dd4bf', text: '#ccfbf1' },
  RX:   { bg: '#1e3a5f', border: '#38bdf8', text: '#e0f2fe' },
  RY:   { bg: '#1a1a2e', border: '#818cf8', text: '#e0e7ff' },
  RZ:   { bg: '#1e1b4b', border: '#a78bfa', text: '#ede9fe' },
  M:    { bg: '#3b0764', border: '#e879f9', text: '#fae8ff' },
};

const EXAMPLES = [
  { label: 'QFT', prompt: 'Generate a 3-qubit Quantum Fourier Transform (QFT) circuit' },
  { label: 'Bell State', prompt: 'Create a 2-qubit Bell state (maximally entangled pair)' },
  { label: 'W-State', prompt: 'Build a 3-qubit W-state circuit' },
  { label: 'GHZ State', prompt: 'Create a 3-qubit GHZ (Greenberger–Horne–Zeilinger) state' },
  { label: 'Grover Oracle', prompt: 'Build a 2-qubit Grover search oracle circuit' },
  { label: 'Teleportation', prompt: 'Generate a quantum teleportation circuit' },
];

// ─── Circuit Renderer ─────────────────────────────────────────────────────────
function CircuitRenderer({ gates, numQubits }) {
  if (!gates || gates.length === 0) return null;

  const maxSlot = Math.max(...gates.map(g => g.slot), 0);
  const slots = Math.max(maxSlot, 6);
  const WIRE_H = 52;
  const SLOT_W = 64;
  const LABEL_W = 60;
  const PAD = 16;
  const totalW = LABEL_W + slots * SLOT_W + PAD * 2;
  const totalH = numQubits * WIRE_H + PAD * 2;

  // Build gate map: [qubit][slot] = gate
  const gateMap = {};
  gates.forEach(g => {
    if (!gateMap[g.qubit]) gateMap[g.qubit] = {};
    gateMap[g.qubit][g.slot] = g.gate;
  });

  // Find CNOT pairs (control at qubit, target at qubit+1 in same slot)
  const cnotPairs = [];
  gates.forEach(g => {
    if (g.gate === 'CNOT') {
      cnotPairs.push({ ctrl: g.qubit, tgt: g.qubit + 1, slot: g.slot });
    }
  });

  return (
    <div className="overflow-x-auto">
      <svg
        width={totalW}
        height={totalH}
        style={{ minWidth: totalW }}
      >
        {/* Qubit wires */}
        {Array.from({ length: numQubits }, (_, qi) => {
          const cy = PAD + qi * WIRE_H + WIRE_H / 2;
          return (
            <g key={qi}>
              {/* Label */}
              <text x={PAD + 4} y={cy + 5} fill="#94a3b8" fontSize={13} fontFamily="monospace">
                |q{qi}⟩
              </text>
              {/* Wire line */}
              <line
                x1={LABEL_W}
                y1={cy}
                x2={LABEL_W + slots * SLOT_W}
                y2={cy}
                stroke="#1e293b"
                strokeWidth={2}
              />
            </g>
          );
        })}

        {/* CNOT vertical lines */}
        {cnotPairs.map((p, i) => {
          const cx = LABEL_W + (p.slot - 0.5) * SLOT_W;
          const cy1 = PAD + p.ctrl * WIRE_H + WIRE_H / 2;
          const cy2 = PAD + p.tgt * WIRE_H + WIRE_H / 2;
          return (
            <line key={i} x1={cx} y1={cy1} x2={cx} y2={cy2}
              stroke="#f87171" strokeWidth={2} strokeDasharray="4,3" />
          );
        })}

        {/* Gates */}
        {Array.from({ length: numQubits }, (_, qi) =>
          Array.from({ length: slots }, (_, si) => {
            const slot = si + 1;
            const gate = gateMap[qi]?.[slot];
            if (!gate) return null;
            const cx = LABEL_W + (slot - 0.5) * SLOT_W;
            const cy = PAD + qi * WIRE_H + WIRE_H / 2;
            const col = GATE_COLORS[gate] || GATE_COLORS.H;
            const isM = gate === 'M';
            const isCnot = gate === 'CNOT';

            return (
              <g key={`${qi}-${slot}`}>
                {isCnot ? (
                  // CNOT control dot
                  <>
                    <circle cx={cx} cy={cy} r={8} fill="#f87171" />
                    {/* target circle rendered at qubit+1 */}
                  </>
                ) : isM ? (
                  <g>
                    <rect x={cx - 16} y={cy - 16} width={32} height={32}
                      rx={6} fill={col.bg} stroke={col.border} strokeWidth={1.5} />
                    <text x={cx} y={cy + 5} textAnchor="middle" fill={col.text}
                      fontSize={11} fontFamily="monospace" fontWeight="bold">M</text>
                  </g>
                ) : (
                  <g>
                    <rect x={cx - 18} y={cy - 16} width={36} height={32}
                      rx={6} fill={col.bg} stroke={col.border} strokeWidth={1.5}
                      style={{ filter: `drop-shadow(0 0 6px ${col.border}55)` }}
                    />
                    <text x={cx} y={cy + 5} textAnchor="middle" fill={col.text}
                      fontSize={gate.length > 2 ? 9 : 12} fontFamily="monospace" fontWeight="bold">
                      {gate}
                    </text>
                  </g>
                )}
              </g>
            );
          })
        )}

        {/* CNOT targets (⊕ symbol) */}
        {cnotPairs.map((p, i) => {
          const cx = LABEL_W + (p.slot - 0.5) * SLOT_W;
          const cy = PAD + p.tgt * WIRE_H + WIRE_H / 2;
          return (
            <g key={`cnot-tgt-${i}`}>
              <circle cx={cx} cy={cy} r={14} fill="none" stroke="#f87171" strokeWidth={2} />
              <line x1={cx - 14} y1={cy} x2={cx + 14} y2={cy} stroke="#f87171" strokeWidth={2} />
              <line x1={cx} y1={cy - 14} x2={cx} y2={cy + 14} stroke="#f87171" strokeWidth={2} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Probability Bar ──────────────────────────────────────────────────────────
function ProbBar({ state, probability, color }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-xs text-gray-400 w-16 shrink-0">|{state}⟩</span>
      <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${probability}%`, background: color }}
        />
      </div>
      <span className="font-mono text-xs text-gray-300 w-12 text-right shrink-0">
        {probability.toFixed(1)}%
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CircuitSynthesisView() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState(null);
  const [simResult, setSimResult] = useState(null);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [phase, setPhase] = useState(''); // 'thinking' | 'compiling' | 'rendering'
  const textareaRef = useRef(null);

  const PHASE_LABELS = {
    thinking: 'AI is analyzing your prompt...',
    compiling: 'Compiling to Qiskit IR...',
    rendering: 'Rendering circuit...',
  };

  const handleSynthesize = async (overridePrompt) => {
    const p = overridePrompt || prompt;
    if (!p.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSimResult(null);
    setPhase('thinking');

    try {
      setTimeout(() => setPhase('compiling'), 1200);
      setTimeout(() => setPhase('rendering'), 2400);

      const data = await synthesizeCircuit(p.trim());
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setPhase('');
    }
  };

  const handleSimulate = async () => {
    if (!result?.gates) return;
    setSimulating(true);
    try {
      const numQ = result.num_qubits;
      const data = await simulateCircuit({
        qubits: numQ,
        gates: result.gates,
        shots: 2048,
      });
      setSimResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSimulating(false);
    }
  };

  const handleCopy = () => {
    if (!result?.code) return;
    navigator.clipboard.writeText(result.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSynthesize();
    }
  };

  const barColors = [
    '#a78bfa', '#60a5fa', '#34d399', '#fb923c', '#f472b6',
    '#22d3ee', '#818cf8', '#fbbf24',
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#080A12] text-gray-300">
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-[#080A12]/90 backdrop-blur-xl border-b border-white/[0.06] px-8 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Circuit Synthesis</h1>
              <p className="text-xs text-gray-500">Describe a circuit in plain English → get Qiskit code + live diagram</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-violet-400 border border-violet-500/20 bg-violet-500/5 rounded-full px-3 py-1">
            <Sparkles className="w-3 h-3" />
            AI Powered
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">

        {/* ── Prompt Input Card ── */}
        <div className="bg-[#0d1120] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
          {/* Top bar with gradient */}
          <div className="h-[2px] w-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500" />
          <div className="p-6 space-y-4">
            <label className="block text-sm text-gray-400 font-medium">
              Describe your quantum circuit
            </label>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Generate a 3-qubit Quantum Fourier Transform circuit..."
              rows={3}
              className="w-full bg-transparent resize-none text-white placeholder-gray-600 text-base outline-none leading-relaxed"
            />
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
              <span className="text-xs text-gray-600">⌘ Enter to synthesize</span>
              <button
                onClick={() => handleSynthesize()}
                disabled={loading || !prompt.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all duration-150 shadow-lg shadow-violet-600/20"
              >
                {loading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> {PHASE_LABELS[phase] || 'Synthesizing...'}</>
                ) : (
                  <><Wand2 className="w-4 h-4" /> Synthesize Circuit</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Example Prompts ── */}
        <div className="space-y-2">
          <p className="text-xs text-gray-600 font-medium uppercase tracking-widest">Quick Examples</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map(ex => (
              <button
                key={ex.label}
                onClick={() => { setPrompt(ex.prompt); handleSynthesize(ex.prompt); }}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-white/[0.08] hover:border-violet-500/40 bg-white/[0.02] hover:bg-violet-500/10 rounded-lg transition-all"
              >
                <Zap className="w-3 h-3 text-violet-500" />
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Loading State ── */}
        {loading && (
          <div className="bg-[#0d1120] border border-violet-500/20 rounded-2xl p-10 flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-violet-400/50 animate-spin" />
              <div className="absolute inset-4 rounded-full bg-violet-500/20 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-violet-400" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-white font-medium">{PHASE_LABELS[phase] || 'Working...'}</p>
              <p className="text-gray-500 text-sm mt-1">The AI is translating your description into quantum gates</p>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && !loading && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Synthesis failed</p>
              <p className="text-red-400/80 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {result && !loading && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Circuit description badge */}
            {result.description && (
              <div className="flex items-start gap-3 p-4 bg-violet-500/5 border border-violet-500/20 rounded-xl">
                <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300">{result.description}</p>
              </div>
            )}

            {/* Circuit Diagram Card */}
            <div className="bg-[#0d1120] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                  <span className="text-sm font-medium text-white">Interactive Circuit Diagram</span>
                  <span className="text-xs text-gray-500 ml-2">{result.num_qubits} qubits · {result.gates?.length} gates</span>
                </div>
                <button
                  onClick={handleSimulate}
                  disabled={simulating}
                  className="flex items-center gap-2 px-4 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 hover:border-cyan-500/60 text-cyan-300 text-xs font-medium rounded-lg transition-all"
                >
                  {simulating
                    ? <><RefreshCw className="w-3 h-3 animate-spin" /> Simulating...</>
                    : <><BarChart3 className="w-3 h-3" /> Run Simulation</>
                  }
                </button>
              </div>
              <div className="p-6 overflow-x-auto bg-[#070910]">
                <CircuitRenderer gates={result.gates} numQubits={result.num_qubits} />
              </div>
            </div>

            {/* Gate Legend */}
            {result.gates && (
              <div className="flex flex-wrap gap-2">
                {[...new Set(result.gates.map(g => g.gate))].map(g => {
                  const col = GATE_COLORS[g] || GATE_COLORS.H;
                  return (
                    <span
                      key={g}
                      className="text-xs px-2 py-1 rounded-md font-mono"
                      style={{ background: col.bg, border: `1px solid ${col.border}`, color: col.text }}
                    >
                      {g}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Simulation Results */}
            {simResult && (
              <div className="bg-[#0d1120] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl animate-in fade-in duration-400">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-white/[0.06]">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-white">Simulation Results</span>
                  <span className="text-xs text-gray-500 ml-2">{simResult.shots?.toLocaleString()} shots</span>
                </div>
                <div className="p-6 space-y-3">
                  {simResult.probabilities?.slice(0, 8).map((item, i) => (
                    <ProbBar
                      key={item.state}
                      state={item.state}
                      probability={item.probability}
                      color={barColors[i % barColors.length]}
                    />
                  ))}
                  {simResult.probabilities?.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">No measurement gates found — add M gates to see results.</p>
                  )}
                </div>
              </div>
            )}

            {/* Qiskit Code Card */}
            <div className="bg-[#0d1120] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-white">Generated Qiskit Code</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 rounded-lg transition-all"
                >
                  {copiedCode ? <><Check className="w-3 h-3 text-green-400" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                </button>
              </div>
              <div className="relative">
                <pre className="p-6 overflow-x-auto text-sm leading-relaxed text-gray-300 font-mono bg-[#05070e]">
                  <code>{result.code}</code>
                </pre>
              </div>
            </div>

            {/* Send to Lab CTA */}
            <div className="flex justify-end">
              <button
                onClick={() => {/* TODO: deep link to QuantumLab with this circuit */}}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-violet-400 transition-colors"
              >
                Open in Quantum Lab <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
