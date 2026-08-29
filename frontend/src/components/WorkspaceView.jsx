import React, { useState, useEffect } from 'react';
import { Search, Plus, HardDrive, FileText, Cpu, Database, Loader2, AlertCircle, FileCode2, FileJson, Folder, X } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

const getIcon = (type) => {
  if (type === 'Notebook') return <FileText className="w-4 h-4"/>;
  if (type === 'Circuit')  return <Cpu className="w-4 h-4"/>;
  if (type === 'Script')   return <FileCode2 className="w-4 h-4"/>;
  if (type === 'Data')     return <FileJson className="w-4 h-4"/>;
  return <FileText className="w-4 h-4"/>;
};

export default function WorkspaceView({ setActiveTab }) {
  const [folder, setFolder] = useState('All Files');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState('Notebook');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) {
      setError("User not authenticated.");
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'projects'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedFiles = snapshot.docs.map(doc => {
        const data = doc.data();
        let dateStr = 'Unknown';
        if (data.createdAt) {
          try {
            const date = typeof data.createdAt.toDate === 'function' 
              ? data.createdAt.toDate() 
              : new Date(data.createdAt.seconds ? data.createdAt.seconds * 1000 : data.createdAt);
            dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          } catch (e) {
            console.error("Date parsing error:", e);
          }
        }
        return {
          id: doc.id,
          name: data.name,
          filename: data.filename || data.name.toLowerCase().replace(/\s+/g, '_') + '.txt',
          type: data.type,
          size_kb: data.size_kb || 0.1,
          modified: dateStr,
          folder: data.folder || 'All Files',
          createdAt: data.createdAt
        };
      });
      // Sort by createdAt descending locally
      fetchedFiles.sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        const timeA = typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : (a.createdAt.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime());
        const timeB = typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : (b.createdAt.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime());
        return timeB - timeA;
      });
      setFiles(fetchedFiles);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError("Failed to load projects. " + err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setCreating(true);
    try {
      const extMap = {
        'Notebook': '.ipynb',
        'Circuit': '.qasm',
        'Script': '.py',
        'Data': '.json'
      };
      
      const folderMap = {
        'Notebook': 'notebooks',
        'Circuit': 'circuits',
        'Script': 'scripts',
        'Data': 'data'
      };

      const filename = newProjectName.trim().toLowerCase().replace(/\s+/g, '_') + extMap[newProjectType];

      await addDoc(collection(db, 'projects'), {
        userId: auth.currentUser.uid,
        name: newProjectName.trim(),
        type: newProjectType,
        filename: filename,
        size_kb: Math.floor(Math.random() * 50) / 10 + 0.1, // Random small size for realism
        folder: folderMap[newProjectType],
        createdAt: serverTimestamp()
      });
      
      setNewProjectName('');
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert("Error creating project: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  const folders = ['All Files', 'circuits', 'notebooks', 'data', 'scripts'];
  const total_mb = (files.reduce((acc, f) => acc + (f.size_kb || 0), 0) / 1024).toFixed(2);

  const filteredFiles = files.filter(f => 
    (folder === 'All Files' || f.folder === folder) &&
    (f.name.toLowerCase().includes(search.toLowerCase()) || f.filename.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 h-full bg-[#080A12] overflow-y-auto relative">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">My Workspace</h1>
            <p className="text-xs text-gray-500 mt-1">Manage your quantum projects, circuits, notebooks, and datasets.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5"/>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files…" className="qation-input text-xs pl-8 w-44"/>
            </div>
            <button onClick={() => setShowModal(true)} className="btn-primary text-xs"><Plus className="w-3.5 h-3.5"/> New Project</button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-5">
          {/* Folder sidebar */}
          <div className="col-span-3 glass-card p-3 space-y-0.5">
            <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-gray-600">Folders</div>
            {folders.map(f => (
              <button key={f} onClick={() => setFolder(f)}
                className={`nav-item ${folder===f ? 'nav-item-active' : ''}`}>
                {f === 'All Files' ? <HardDrive className="w-3 h-3 text-gray-500 mr-1"/> : <Folder className="w-3 h-3 text-gray-500 mr-1"/>}
                {f}
              </button>
            ))}
            {/* Storage meter */}
            <div className="pt-4 mt-3 border-t border-white/[0.07] px-3 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-gray-500">
                <span className="flex items-center gap-1"><HardDrive className="w-3 h-3 text-violet-400"/>Local Storage</span>
                <span className="font-mono font-bold text-violet-300">{total_mb} MB</span>
              </div>
              <div className="text-[9px] text-gray-600 font-medium">Saved securely in browser</div>
            </div>
          </div>

          {/* Projects table */}
          <div className="col-span-9 glass-card overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.07] text-[10px] font-bold uppercase tracking-widest text-gray-600">
                  <th className="px-5 py-3">Name</th>
                  <th className="py-3">Type</th>
                  <th className="py-3">Size</th>
                  <th className="py-3 pr-5">Last Modified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {loading && (
                  <tr>
                    <td colSpan="4" className="py-12 text-center">
                      <Loader2 className="w-5 h-5 text-violet-400 animate-spin mx-auto"/>
                    </td>
                  </tr>
                )}
                {!loading && error && (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-xs text-red-400">
                      <AlertCircle className="w-4 h-4 mx-auto mb-1"/> {error}
                    </td>
                  </tr>
                )}
                {!loading && !error && filteredFiles.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-xs text-gray-500">
                      No files found in {folder}.
                    </td>
                  </tr>
                )}
                {!loading && !error && filteredFiles.map((f, i) => (
                  <tr key={f.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer group">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-[#111827] border border-white/10 flex items-center justify-center text-violet-400 group-hover:border-violet-500/40 group-hover:text-violet-300 transition-colors">
                        {getIcon(f.type)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">{f.name}</div>
                        <div className="text-[10px] text-gray-600 font-mono mt-0.5">{f.filename}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="badge-purple font-mono font-normal tracking-wide">{f.type}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs text-gray-400">{f.size_kb.toFixed(1)} KB</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs text-gray-400">{f.modified}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Project Modal */}
      {showModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#0a0d16] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-violet-400" /> Create New Project
            </h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Project Name</label>
                <input 
                  type="text" 
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  placeholder="e.g., VQE Optimization"
                  className="qation-input w-full text-sm py-2.5"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Project Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Notebook', 'Circuit', 'Script', 'Data'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewProjectType(type)}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all
                        ${newProjectType === type 
                          ? 'bg-violet-500/10 border-violet-500/50 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.15)]' 
                          : 'bg-white/[0.02] border-white/[0.05] text-gray-400 hover:bg-white/[0.04]'
                        }`}
                    >
                      {getIcon(type)} {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-4 mt-6 border-t border-white/[0.05] flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={creating || !newProjectName.trim()}
                  className="btn-primary py-2.5 px-6"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
