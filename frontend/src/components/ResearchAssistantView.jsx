import React, { useState, useEffect } from 'react';
import { Search, FileText, GitFork, Sparkles, ArrowRight, Loader2, AlertCircle, ExternalLink, Calendar, Tag, Unlock } from 'lucide-react';
import { searchResearch, sendChat } from '../api';

export default function ResearchAssistantView({ setActiveTab, setInitialPrompt }) {
  const [query, setQuery]     = useState('quantum machine learning');
  const [input, setInput]     = useState('');
  const [papers, setPapers]   = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);

  // Auto-search on mount
  useEffect(() => { doSearch('quantum machine learning'); }, []);

  const doSearch = async (q) => {
    const term = (q || query || input).trim();
    if (!term) return;
    setQuery(term);
    setInput('');
    setLoading(true);
    setError('');
    setPapers([]);
    setTotalCount(0);
    setAiSummary('');
    setSelectedPaper(null);
    try {
      const res = await searchResearch(term, 6);
      setPapers(res.papers || []);
      setTotalCount(res.total || 0);
    } catch (e) {
      setError('Search failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const getAiInsight = async (paper) => {
    setSelectedPaper(paper);
    setAiSummary('');
    setAiLoading(true);
    try {
      const resp = await sendChat([{
        role: 'user',
        content: `Briefly analyze this research paper in 3-4 sentences. Title: "${paper.title}". Abstract: ${paper.summary}\n\nFocus on: key innovation, impact, and relevance to quantum computing.`
      }]);
      setAiSummary(resp.content);
    } catch (e) {
      setAiSummary('Could not generate AI insight: ' + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const suggest = (p) => {
    setInitialPrompt(`Analyze and explain this research paper in detail: "${p.title}". Abstract: ${p.summary}`);
    setActiveTab('chat');
  };

  const QUICK = ['Quantum Error Correction', 'QAOA Optimization', 'Variational Quantum Eigensolver', 'Quantum Neural Networks'];

  return (
    <div className="flex-1 h-full bg-[#080A12] overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-7 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-violet-400"/> Research Copilot
            </h1>
            <p className="text-xs text-gray-500 mt-1">Search real papers from arXiv · Get AI-powered insights</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-2.5"/>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch(input)}
              placeholder="Search arXiv… e.g. Quantum Error Mitigation"
              className="qation-input pl-10 text-sm"
            />
          </div>
          <button onClick={() => doSearch(input)} disabled={loading} className="btn-primary px-5">
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Search'}
          </button>
        </div>

        {/* Quick topics */}
        <div className="flex flex-wrap gap-2">
          {QUICK.map(q => (
            <button key={q} onClick={() => doSearch(q)} className="pill text-[11px]">{q}</button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0"/> {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin"/>
            <p className="text-xs text-violet-300">Searching arXiv for <strong>"{query}"</strong>…</p>
          </div>
        )}

        {/* Results */}
        {!loading && papers.length > 0 && (
          <div className="grid grid-cols-12 gap-4">
            {/* Paper list */}
            <div className="col-span-7 space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
              {totalCount.toLocaleString()} papers found · showing top 6 · via OpenAlex
            </div>
              {papers.map((p, i) => (
                <div
                  key={i}
                  onClick={() => getAiInsight(p)}
                  className={`glass-card p-4 cursor-pointer transition-all duration-200 hover:border-violet-500/40 hover:shadow-neon ${selectedPaper?.arxiv_id === p.arxiv_id ? 'border-violet-500/50 bg-violet-500/5' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white leading-snug flex-1">{p.title}</h3>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-gray-500 hover:text-violet-400 flex-shrink-0 transition-colors mt-0.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5"/>
                    </a>
                  </div>

                  <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed line-clamp-2">{p.summary}</p>

                  <div className="flex items-center gap-3 mt-2.5 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-gray-600"/>{p.date}</span>
                    {p.category && <span className="flex items-center gap-1"><Tag className="w-3 h-3 text-gray-600"/>{p.category}</span>}
                    {p.isOpenAccess && <span className="flex items-center gap-1 text-emerald-400"><Unlock className="w-3 h-3"/>Open Access</span>}
                    {p.authors.length > 0 && <span className="truncate">{p.authors.slice(0,2).join(', ')}{p.authors.length > 2 ? ` +${p.authors.length - 2}` : ''}</span>}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={e => { e.stopPropagation(); suggest(p); }}
                      className="pill text-[10px] flex items-center gap-1.5"
                    >
                      <Sparkles className="w-2.5 h-2.5"/> Ask AI about this
                    </button>
                    <span className="text-[10px] text-gray-600 font-mono">{p.arxiv_id}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Insight Panel */}
            <div className="col-span-5 space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600">AI Insight</div>
              <div className="glass-card p-4 min-h-[200px]">
                {!selectedPaper && !aiLoading && (
                  <div className="flex flex-col items-center justify-center h-36 gap-2 opacity-40 text-center">
                    <Sparkles className="w-6 h-6 text-violet-400"/>
                    <p className="text-xs text-gray-400">Click any paper to get<br/>AI-powered insight</p>
                  </div>
                )}
                {aiLoading && (
                  <div className="flex flex-col items-center justify-center h-36 gap-3">
                    <Loader2 className="w-6 h-6 text-violet-400 animate-spin"/>
                    <p className="text-xs text-violet-300">Analyzing with QATION AI…</p>
                  </div>
                )}
                {selectedPaper && !aiLoading && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white leading-snug">{selectedPaper.title}</h4>
                    {aiSummary && (
                      <p className="text-xs text-gray-300 leading-relaxed">{aiSummary}</p>
                    )}
                    <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.07]">
                      <button
                        onClick={() => suggest(selectedPaper)}
                        className="btn-primary text-[11px] py-1.5 w-full justify-center"
                      >
                        <Sparkles className="w-3 h-3"/> Deep dive in Chat
                      </button>
                      <a
                        href={selectedPaper.url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-ghost text-[11px] py-1.5 w-full justify-center"
                      >
                        <ExternalLink className="w-3 h-3 text-violet-400"/> Open on arXiv
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Related searches */}
              <div className="glass-card p-4 space-y-2">
                <div className="text-xs font-bold text-gray-400">Related Searches</div>
                {['Quantum Error Mitigation', 'VQE for Chemistry', 'Quantum Advantage', 'QAOA Benchmarks'].map(r => (
                  <button
                    key={r}
                    onClick={() => doSearch(r)}
                    className="w-full flex items-center justify-between text-[11px] text-gray-400 hover:text-violet-300 py-1 transition-colors"
                  >
                    {r} <ArrowRight className="w-3 h-3"/>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
