import React, { useState } from 'react';
import { Play, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { executeCode } from '../api';

const INITIAL_CELLS = [
  {
    input: `from qiskit import QuantumCircuit
import numpy as np

qc = QuantumCircuit(2)
qc.h(0)
qc.cx(0, 1)

print("Bell State Circuit:")
print(qc.draw('text'))`,
    output: null,
    time: null,
    running: false,
    error: false
  },
  {
    input: `from qiskit.quantum_info import Statevector
sv = Statevector.from_instruction(qc)
print("\\nStatevector Probabilities:")
print(sv.probabilities_dict())`,
    output: null,
    time: null,
    running: false,
    error: false
  },
];

export default function NotebookView({ notebookCode, setNotebookCode }) {
  const [cells, setCells] = useState(INITIAL_CELLS);
  const [runningAll, setRunningAll] = useState(false);
  const [autoRunIndex, setAutoRunIndex] = useState(null);

  React.useEffect(() => {
    if (notebookCode) {
      setCells(prev => [...prev, { input: notebookCode, output: null, time: null, running: false, error: false }]);
      setAutoRunIndex(cells.length);
      if (setNotebookCode) setNotebookCode('');
    }
  }, [notebookCode, setNotebookCode, cells.length]);

  React.useEffect(() => {
    if (autoRunIndex !== null && cells.length > autoRunIndex) {
      runCell(autoRunIndex);
      setAutoRunIndex(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRunIndex, cells.length]);

  const runCell = async (index) => {
    const cell = cells[index];
    if (!cell.input.trim()) return;

    setCells(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], running: true, output: null, time: null, error: false };
      return copy;
    });

    try {
      // Execute only this cell's code. Note: backend uses a fresh scope each time,
      // so for notebook feel we'd normally execute all previous cells too.
      // For simplicity, we just execute the code from all cells up to this one.
      const codeToRun = cells.slice(0, index + 1).map(c => c.input).join('\n\n');
      const res = await executeCode(codeToRun);
      
      setCells(prev => {
        const copy = [...prev];
        copy[index] = { 
          ...copy[index], 
          running: false, 
          output: res.output || '✓ Execution completed.', 
          time: res.time,
          error: !res.success 
        };
        return copy;
      });
    } catch (err) {
      setCells(prev => {
        const copy = [...prev];
        copy[index] = { ...copy[index], running: false, output: err.message, error: true };
        return copy;
      });
    }
  };

  const runAll = async () => {
    setRunningAll(true);
    for (let i = 0; i < cells.length; i++) {
      await runCell(i);
    }
    setRunningAll(false);
  };

  const updateCellInput = (index, val) => {
    setCells(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], input: val };
      return copy;
    });
  };

  const addCell = () => {
    setCells(prev => [...prev, { input: '', output: null, time: null, running: false, error: false }]);
  };

  return (
    <div className="flex-1 h-full bg-[#080A12] overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-4">
        {/* Toolbar */}
        <div className="glass-card px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-violet-400 text-lg">📓</span>
            <h2 className="font-bold text-sm text-white">Quantum Circuit Lab</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge-purple gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
              Python 3 (Live Backend)
            </span>
            <button onClick={runAll} disabled={runningAll} className="btn-primary text-xs ml-auto disabled:opacity-50">
              {runningAll ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Play className="w-3.5 h-3.5"/>} Run All
            </button>
          </div>
        </div>

        {/* Notebook Cells */}
        <div className="space-y-4 pb-12">
          {cells.map((cell, i) => (
            <div key={i} className="flex gap-4 group">
              {/* Execution count */}
              <div className="w-8 flex-shrink-0 text-right pt-2 font-mono text-[10px] text-gray-500">
                [{cell.running ? '*' : (cell.time ? i + 1 : ' ')}]
              </div>
              <div className="flex-1 space-y-2">
                {/* Input Cell */}
                <div className="relative rounded-lg border border-white/[0.07] bg-[#111827] focus-within:border-violet-500/50 transition-colors overflow-hidden">
                  <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => runCell(i)} disabled={cell.running} className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-emerald-400 transition-colors disabled:opacity-50">
                      {cell.running ? <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400"/> : <Play className="w-3.5 h-3.5"/>}
                    </button>
                  </div>
                  <textarea
                    value={cell.input}
                    onChange={(e) => updateCellInput(i, e.target.value)}
                    spellCheck="false"
                    className="w-full bg-transparent p-3 pr-12 text-[11px] font-mono text-gray-300 focus:outline-none resize-none leading-relaxed"
                    rows={Math.max(1, cell.input.split('\n').length)}
                  />
                </div>

                {/* Output Cell */}
                {(cell.output || cell.running) && (
                  <div className={`p-3 rounded-lg border bg-[#0a0d16] text-[11px] font-mono leading-relaxed relative ${cell.error ? 'border-red-500/30 text-red-400' : 'border-transparent text-gray-300'}`}>
                    {cell.running ? (
                      <span className="text-gray-500 animate-pulse">Executing code...</span>
                    ) : (
                      <>
                        <pre className="whitespace-pre-wrap">{cell.output}</pre>
                        {cell.time && <div className="absolute top-2 right-2 text-[9px] text-gray-600 font-mono">{cell.time}</div>}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add Cell button */}
          <div className="flex gap-4">
            <div className="w-8" />
            <button onClick={addCell} className="flex-1 py-2 rounded-lg border border-dashed border-white/10 text-gray-500 hover:text-white hover:border-violet-500/50 transition-colors text-[10px] font-mono tracking-widest uppercase flex justify-center items-center gap-2">
              + New Cell
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
