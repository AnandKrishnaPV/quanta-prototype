import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, Legend
} from 'recharts';
import { Activity, Play, Loader, Zap, Clock, GitBranch } from 'lucide-react';

const BACKEND_COLORS = { 'Statevector': '#7c3aed', 'QASM (MPS)': '#0891b2', 'Density Matrix': '#059669' };

export default function BenchmarkView() {
  const [qubits, setQubits] = useState(4);
  const [depth, setDepth] = useState(3);
  const [shots, setShots] = useState(1024);
  const [running, setRunning] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'benchmarks', user.uid, 'runs'),
      orderBy('timestamp', 'desc')
    );
    return onSnapshot(q, snap => {
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
  }, [user]);

  const runBenchmark = async () => {
    setRunning(true);
    setError(null);
    setCurrentResult(null);
    try {
      const res = await fetch('/api/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qubits, depth, shots }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Server error');
      const data = await res.json();
      setCurrentResult(data);

      // Save to Firestore
      await addDoc(collection(db, 'benchmarks', user.uid, 'runs'), {
        ...data,
        timestamp: serverTimestamp(),
        uid: user.uid,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#0d1017] border border-white/10 rounded-xl p-3 text-xs">
        <p className="text-gray-400 mb-1">{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</p>
        ))}
      </div>
    );
  };

  // Chart data for historical comparison (last 10 runs)
  const historyChartData = history.slice(0, 10).reverse().map((run, i) => {
    const entry = { run: `#${history.length - i}`, qubits: run.qubits, depth: run.depth };
    (run.results || []).forEach(r => {
      entry[r.backend + '_ms'] = r.time_ms;
      entry[r.backend + '_fi'] = Math.round((r.fidelity || 0) * 100);
    });
    return entry;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#080A12]">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center">
          <Activity className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Quantum Benchmark Tracker</h1>
          <p className="text-xs text-gray-500">Compare simulation speed & fidelity across Qiskit Aer backends</p>
        </div>
      </div>

      {/* Config Panel */}
      <div className="bg-[#0d1017] border border-white/[0.07] rounded-2xl p-4 mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Circuit Configuration</p>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label: 'Qubits', value: qubits, set: setQubits, min: 2, max: 10, step: 1 },
            { label: 'Depth', value: depth, set: setDepth, min: 1, max: 8, step: 1 },
            { label: 'Shots', value: shots, set: setShots, min: 128, max: 8192, step: 128 },
          ].map(({ label, value, set, min, max, step }) => (
            <div key={label}>
              <label className="text-xs text-gray-500 block mb-1">{label}: <span className="text-white font-mono">{value}</span></label>
              <input
                type="range" min={min} max={max} step={step} value={value}
                onChange={e => set(+e.target.value)}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500"
              />
            </div>
          ))}
        </div>
        <button
          onClick={runBenchmark}
          disabled={running}
          className="btn-primary py-2.5 w-full justify-center disabled:opacity-50"
        >
          {running ? (
            <><Loader className="w-4 h-4 mr-2 animate-spin" />Running on 3 backends...</>
          ) : (
            <><Play className="w-4 h-4 mr-2" />Run Benchmark</>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-sm text-red-300 mb-4">{error}</div>
      )}

      {/* Current Result */}
      {currentResult && (
        <div className="mb-6">
          <p className="text-sm font-semibold text-white mb-3">
            Latest Result — {currentResult.qubits}q / depth {currentResult.depth} / {currentResult.gates} gates
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {(currentResult.results || []).map(r => (
              <div key={r.backend} className="bg-[#0d1017] border border-white/[0.07] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: BACKEND_COLORS[r.backend] }} />
                  <span className="text-sm font-semibold text-white">{r.backend}</span>
                </div>
                {r.error ? (
                  <p className="text-xs text-red-400">{r.error}</p>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-xl font-bold text-white">{r.time_ms}<span className="text-xs text-gray-500 ml-1">ms</span></span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-3 h-3 text-gray-500" />
                      <span className="text-sm text-gray-300">Fidelity: <span className="text-white font-mono">{(r.fidelity * 100).toFixed(1)}%</span></span>
                    </div>
                    <p className="text-xs text-gray-600">{r.unique_states} unique states · top: <span className="font-mono">{r.top_state}</span></p>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Speed Comparison Bar */}
          <div className="bg-[#0d1017] border border-white/[0.07] rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Speed Comparison (ms)</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={currentResult.results.filter(r => !r.error).map(r => ({ name: r.backend, ms: r.time_ms, fidelity: Math.round(r.fidelity * 100) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="ms" name="Time (ms)" radius={[4, 4, 0, 0]}>
                  {currentResult.results.filter(r => !r.error).map((r, i) => (
                    <React.Fragment key={i}>
                      {/* colored per backend */}
                    </React.Fragment>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div className="bg-[#0d1017] border border-white/[0.07] rounded-2xl p-4">
          <p className="text-sm font-semibold text-white mb-4">Historical Timing (ms) — Last {Math.min(history.length, 10)} Runs</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={historyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="run" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
              {Object.entries(BACKEND_COLORS).map(([name, color]) => (
                <Line key={name} type="monotone" dataKey={`${name}_ms`} stroke={color} strokeWidth={2} dot={false} name={name} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {history.length === 0 && !currentResult && (
        <div className="text-center py-10 text-gray-600">
          <GitBranch className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Run your first benchmark to see results and historical tracking.</p>
        </div>
      )}
    </div>
  );
}
