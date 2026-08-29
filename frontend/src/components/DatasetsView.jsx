import React, { useState } from 'react';
import { Database, Search, ArrowDownToLine, Tag, FolderOpen, Check } from 'lucide-react';

const PENNYLANE_DATASETS = [
  {
    id: 'qchem-h2',
    title: 'Hydrogen Molecule (H2)',
    category: 'PennyLane Molecules',
    description: 'Quantum chemistry dataset for the H2 molecule, including Hamiltonians, ground state energies, and molecular properties.',
    size: '12 Items',
    tags: ['qchem', 'VQE'],
  },
  {
    id: 'qchem-lih',
    title: 'Lithium Hydride (LiH)',
    category: 'PennyLane Molecules',
    description: 'Comprehensive dataset for LiH, ideal for testing variational quantum eigensolvers on slightly larger molecular systems.',
    size: '18 Items',
    tags: ['qchem', 'Chemistry'],
  },
  {
    id: 'spin-heisenberg',
    title: 'Heisenberg Spin Model',
    category: 'Spin Systems',
    description: 'Data generated from 1D and 2D Heisenberg spin chains, used for testing quantum simulations and ground state searches.',
    size: '45 Items',
    tags: ['spin', 'physics'],
  },
  {
    id: 'spin-ising',
    title: 'Transverse Field Ising Model',
    category: 'Spin Systems',
    description: 'Quantum datasets for the TFIM, capturing phase transitions and spin correlations across different field strengths.',
    size: '30 Items',
    tags: ['spin', 'Ising'],
  },
  {
    id: 'qml-benchmarks',
    title: 'QML Benchmark Suite',
    category: 'Benchmarks',
    description: 'Standardized datasets designed to benchmark Quantum Machine Learning models, including synthetic classification tasks.',
    size: '100+ Items',
    tags: ['QML', 'classification'],
  },
  {
    id: 'qsvt-angles',
    title: 'QSVT Phase Angles',
    category: 'Specialized Data',
    description: 'Pre-computed phase angles for Quantum Singular Value Transformation, saving crucial compilation time for advanced algorithms.',
    size: '500+ Items',
    tags: ['QSVT', 'algorithms'],
  },
];

export default function DatasetsView() {
  const [query, setQuery] = useState('');
  const [loadedIds, setLoadedIds] = useState(new Set());

  const handleLoad = (id) => {
    setLoadedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const filtered = PENNYLANE_DATASETS.filter(d => {
    const q = query.toLowerCase();
    return d.title.toLowerCase().includes(q) || 
           d.category.toLowerCase().includes(q) ||
           d.tags.some(t => t.toLowerCase().includes(q));
  });

  return (
    <div className="flex-1 h-full flex flex-col bg-[#080A12] overflow-hidden p-8">
      <div className="max-w-5xl w-full mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Quantum Datasets</h1>
          </div>
          <p className="text-sm text-gray-400">
            Access, explore, and integrate official PennyLane quantum datasets directly into your workspaces.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
          <input 
            type="text"
            placeholder="Search datasets by name, category, or tag (e.g. 'qchem', 'spin')..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="qation-input w-full pl-11 py-3 text-sm bg-[#111421] border-white/10 focus:border-blue-500/50 transition-colors"
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 pb-20 overflow-y-auto">
          {filtered.length > 0 ? filtered.map(dataset => (
            <div key={dataset.id} className="glass-card p-5 flex flex-col hover:border-blue-500/40 hover:shadow-neon transition-all duration-300 group cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300/70">{dataset.category}</span>
                </div>
              </div>
              
              <h3 className="text-base font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{dataset.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4 flex-1">
                {dataset.description}
              </p>

              <div className="flex items-center gap-2 flex-wrap mb-4">
                {dataset.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 text-[10px] text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/10">
                    <Tag className="w-2.5 h-2.5" /> {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                <span className="text-xs text-gray-500 font-medium">{dataset.size}</span>
                <button 
                  onClick={() => handleLoad(dataset.id)}
                  disabled={loadedIds.has(dataset.id)}
                  className={`flex items-center gap-1.5 text-xs text-white px-3 py-1.5 rounded-lg transition-colors ${
                    loadedIds.has(dataset.id) 
                      ? 'bg-emerald-600/50 cursor-default border border-emerald-500/30 text-emerald-100' 
                      : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  {loadedIds.has(dataset.id) ? (
                    <><Check className="w-3.5 h-3.5" /> Loaded</>
                  ) : (
                    <><ArrowDownToLine className="w-3.5 h-3.5" /> Load</>
                  )}
                </button>
              </div>
            </div>
          )) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-50">
              <Search className="w-10 h-10 text-gray-500 mb-4" />
              <p className="text-gray-400 text-sm">No datasets found matching "{query}"</p>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
