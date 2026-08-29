import React, { useState, useEffect } from 'react';
import { Search, Star, Cpu, Database, Bot, Sparkles, Loader2, AlertCircle, ExternalLink, Github } from 'lucide-react';
import { fetchGithubPackages } from '../api';

const CATS = ['Qiskit','PennyLane','Quantum','Cirq','Q#, OpenQASM'];

export default function MarketplaceView() {
  const [cat, setCat] = useState('Qiskit');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let query = search.trim() || cat.split(',')[0].trim().toLowerCase();
    
    setLoading(true);
    fetchGithubPackages(query)
      .then(res => {
        setItems(res);
        setError('');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [cat, search]);

  return (
    <div className="flex-1 h-full bg-[#080A12] overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Marketplace</h1>
            <p className="text-xs text-gray-500 mt-1">Discover and install quantum circuits, agents, datasets and plugins.</p>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search marketplace…" className="qation-input text-xs pl-8 w-48"/>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${cat===c
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                : 'bg-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/10'
              }`}>
              {c}
            </button>
          ))}
        </div>

        {/* Items grid */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-violet-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4"/>
            <div className="text-sm font-medium">Fetching packages from GitHub...</div>
          </div>
        )}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 text-red-400 text-sm">
            <AlertCircle className="w-8 h-8 mb-4"/>
            <div>{error}</div>
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 text-sm">
            No packages found.
          </div>
        )}
        {!loading && !error && (
          <div className="grid grid-cols-2 gap-4">
            {items.map((pkg, i) => (
              <a key={i} href={pkg.url} target="_blank" rel="noreferrer" className="glass-card-hover p-5 flex items-start justify-between gap-4 group">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                    <Github className="w-5 h-5"/>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white truncate">{pkg.name}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-tight h-[30px]">{pkg.desc}</div>
                    <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-400 font-medium">
                      <span>{pkg.author}</span>
                      <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                        <Star className="w-3 h-3 fill-amber-400"/> {pkg.stars > 1000 ? (pkg.stars/1000).toFixed(1) + 'k' : pkg.stars}
                      </span>
                      <span className="text-gray-600 px-1.5 py-0.5 rounded bg-white/5">{pkg.language}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between h-full">
                  <span className="badge-green font-mono">Free</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-600 group-hover:text-white mt-auto"/>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
