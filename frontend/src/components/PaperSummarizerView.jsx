import React, { useState, useRef } from 'react';
import { FileText, Upload, AlertCircle, ChevronRight, Loader, BookOpen } from 'lucide-react';

export default function PaperSummarizerView() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (f && f.type === 'application/pdf') {
      setFile(f);
      setResult(null);
      setError(null);
    } else {
      setError('Please upload a PDF file.');
    }
  };

  const summarize = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/summarize-paper', { method: 'POST', body: formData });
      if (!res.ok) throw new Error((await res.json()).detail || 'Server error');
      setResult(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const sectionIcons = { 'Overview': '📋', 'Key Contributions': '🎯', 'Methodology': '🔬', 'Results': '📊', 'Quantum Concepts': '⚛️', 'Implications': '💡', 'Future Work': '🔮' };

  const parseSections = (text) => {
    const sections = [];
    const lines = text.split('\n');
    let current = null;
    for (const line of lines) {
      if (line.startsWith('## ')) {
        if (current) sections.push(current);
        const title = line.replace('## ', '').trim();
        const icon = Object.entries(sectionIcons).find(([k]) => title.includes(k))?.[1] || '📌';
        current = { title, icon, lines: [] };
      } else if (current) {
        current.lines.push(line);
      }
    }
    if (current) sections.push(current);
    return sections;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#080A12]">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Research Paper Summarizer</h1>
          <p className="text-xs text-gray-500">Upload any quantum computing PDF — get structured AI insights instantly</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${drag ? 'border-cyan-500 bg-cyan-500/5' : 'border-white/10 hover:border-white/20'}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
        >
          <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files[0])} />
          <Upload className={`w-10 h-10 mx-auto mb-3 ${file ? 'text-cyan-400' : 'text-gray-600'}`} />
          {file ? (
            <>
              <p className="text-white font-semibold text-sm">{file.name}</p>
              <p className="text-gray-500 text-xs mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB — click to change</p>
            </>
          ) : (
            <>
              <p className="text-gray-300 font-semibold text-sm">Drop your PDF here</p>
              <p className="text-gray-600 text-xs mt-1">or click to browse · supports arXiv papers, journals, preprints</p>
            </>
          )}
        </div>

        {file && !result && (
          <button
            onClick={summarize}
            disabled={loading}
            className="w-full btn-primary py-3 justify-center text-sm disabled:opacity-50"
          >
            {loading ? (
              <><Loader className="w-4 h-4 mr-2 animate-spin" />Analyzing paper... this may take 15-30 seconds</>
            ) : (
              <><FileText className="w-4 h-4 mr-2" />Summarize Paper</>
            )}
          </button>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-3">
            {/* Meta info */}
            <div className="bg-[#0d1017] border border-white/[0.07] rounded-xl px-4 py-3 flex items-center gap-4 text-xs text-gray-500">
              <span className="text-cyan-400 font-medium">{result.filename}</span>
              <span>{result.pages} pages</span>
              <span>{(result.chars_processed / 1000).toFixed(1)}k chars analyzed</span>
              <button
                onClick={() => { setResult(null); setFile(null); }}
                className="ml-auto text-gray-600 hover:text-white transition-colors"
              >
                New Paper
              </button>
            </div>

            {/* Summary sections */}
            {parseSections(result.summary).map((section, i) => (
              <div key={i} className="bg-[#0d1017] border border-white/[0.07] rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.07] flex items-center gap-2">
                  <span>{section.icon}</span>
                  <span className="text-sm font-semibold text-white">{section.title}</span>
                </div>
                <div className="p-4 space-y-1">
                  {section.lines.filter(l => l.trim()).map((line, j) => {
                    if (line.startsWith('- ') || line.startsWith('* ')) {
                      return (
                        <div key={j} className="flex items-start gap-2">
                          <ChevronRight className="w-3 h-3 text-cyan-400 mt-1 flex-shrink-0" />
                          <p className="text-xs text-gray-300 leading-relaxed">{line.replace(/^[-*]\s/, '')}</p>
                        </div>
                      );
                    }
                    return <p key={j} className="text-xs text-gray-300 leading-relaxed">{line}</p>;
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
