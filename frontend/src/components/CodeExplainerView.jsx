import React, { useState } from 'react';
import { Code2, Zap, AlertCircle, Copy, Check, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

const EXAMPLE_CODE = `from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

qc = QuantumCircuit(2, 2)
qc.h(0)
qc.cx(0, 1)
qc.measure([0,1], [0,1])
print(qc.draw('text'))
`;

export default function CodeExplainerView() {
  const [code, setCode] = useState(EXAMPLE_CODE);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const explain = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/explain-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Server error');
      setResult(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#080A12]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Code2 className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Quantum Code Explainer</h1>
            <p className="text-xs text-gray-500">Paste any Qiskit or PennyLane code — get a circuit diagram + plain-English breakdown</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Code Input Panel */}
        <div className="bg-[#0d1017] border border-white/[0.07] rounded-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Quantum Code</span>
            <button onClick={copy} className="p-1.5 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5">
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            className="flex-1 bg-transparent text-sm font-mono text-green-300 p-4 resize-none outline-none min-h-[300px]"
            spellCheck={false}
            placeholder="Paste your Qiskit / PennyLane code here..."
          />
          <div className="p-4 border-t border-white/[0.07]">
            <button
              onClick={explain}
              disabled={loading || !code.trim()}
              className="w-full btn-primary py-2.5 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Analyzing...</>
              ) : (
                <><Zap className="w-4 h-4 mr-2" />Explain This Code</>
              )}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-300">Explanation Failed</p>
                <p className="text-xs text-red-400 mt-1">{error}</p>
              </div>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="bg-[#0d1017] border border-white/[0.07] rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
              <Code2 className="w-12 h-12 text-gray-700 mb-3" />
              <p className="text-gray-500 text-sm">Your circuit diagram and explanation will appear here</p>
            </div>
          )}

          {loading && (
            <div className="bg-[#0d1017] border border-white/[0.07] rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-400 text-sm">Running quantum analysis...</p>
              <p className="text-gray-600 text-xs mt-1">Compiling circuit & generating explanation</p>
            </div>
          )}

          {result && (
            <>
              {/* Circuit Diagram */}
              {result.circuit_svg && (
                <div className="bg-[#0d1017] border border-white/[0.07] rounded-2xl overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-white/[0.07] flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Circuit Diagram</span>
                    <span className="ml-auto text-xs text-gray-600">{result.circuit_info}</span>
                  </div>
                  <div
                    className="p-4 overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: result.circuit_svg }}
                  />
                </div>
              )}

              {/* Explanation */}
              <div className="bg-[#0d1017] border border-white/[0.07] rounded-2xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-white/[0.07] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-400" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI Explanation</span>
                </div>
                <div className="p-4 prose prose-invert prose-sm max-w-none text-gray-300 text-sm leading-relaxed overflow-x-auto">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {result.explanation}
                  </ReactMarkdown>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
