import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import {
  collection, addDoc, onSnapshot, updateDoc, doc,
  query, orderBy, serverTimestamp, arrayUnion, arrayRemove, getDoc
} from 'firebase/firestore';
import { Users, Plus, Share2, Play, Trash2, Code, ChevronDown, ChevronRight, Loader } from 'lucide-react';

const COLORS = ['#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626'];

export default function CollabNotebookView() {
  const [notebooks, setNotebooks] = useState([]);
  const [activeNotebook, setActiveNotebook] = useState(null);
  const [cells, setCells] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [runningCell, setRunningCell] = useState(null);
  const user = auth.currentUser;

  // Load user's notebooks
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notebooks'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      const all = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(n => n.owner === user.uid || (n.collaborators || []).includes(user.email));
      setNotebooks(all);
    });
    return () => unsub();
  }, [user]);

  // Real-time cells for active notebook
  useEffect(() => {
    if (!activeNotebook) return;
    const q = query(
      collection(db, 'notebooks', activeNotebook.id, 'cells'),
      orderBy('order', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setCells(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [activeNotebook]);

  const createNotebook = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const notebookRef = await addDoc(collection(db, 'notebooks'), {
        title: newTitle,
        owner: user.uid,
        ownerEmail: user.email,
        ownerName: user.displayName || user.email,
        collaborators: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      // Add a starter cell
      await addDoc(collection(db, 'notebooks', notebookRef.id, 'cells'), {
        type: 'code',
        content: '# Bell State Circuit\nfrom qiskit import QuantumCircuit\nqc = QuantumCircuit(2, 2)\nqc.h(0)\nqc.cx(0, 1)\nqc.measure_all()\nprint(qc.draw("text"))',
        output: '',
        order: 0,
        createdAt: serverTimestamp(),
        lastEditedBy: user.email,
      });
      setNewTitle('');
      const nb = { id: notebookRef.id, title: newTitle, owner: user.uid, collaborators: [] };
      setActiveNotebook(nb);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const addCell = async (type = 'code') => {
    if (!activeNotebook) return;
    await addDoc(collection(db, 'notebooks', activeNotebook.id, 'cells'), {
      type,
      content: type === 'code' ? '# New cell\n' : 'Add your notes here...',
      output: '',
      order: cells.length,
      createdAt: serverTimestamp(),
      lastEditedBy: user.email,
    });
  };

  const updateCell = async (cellId, content) => {
    await updateDoc(doc(db, 'notebooks', activeNotebook.id, 'cells', cellId), {
      content,
      lastEditedBy: user.email,
      updatedAt: serverTimestamp(),
    });
  };

  const runCell = async (cell) => {
    setRunningCell(cell.id);
    try {
      const res = await fetch('/api/explain-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cell.content }),
      });
      const data = await res.json();
      const output = data.circuit_info + '\n\n' + (data.explanation || '');
      await updateDoc(doc(db, 'notebooks', activeNotebook.id, 'cells', cell.id), {
        output,
        circuit_svg: data.circuit_svg || null,
        lastRunBy: user.email,
        lastRunAt: serverTimestamp(),
      });
    } catch (e) {
      await updateDoc(doc(db, 'notebooks', activeNotebook.id, 'cells', cell.id), {
        output: `Error: ${e.message}`,
      });
    } finally {
      setRunningCell(null);
    }
  };

  const deleteCell = async (cellId) => {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'notebooks', activeNotebook.id, 'cells', cellId));
  };

  const addCollaborator = async (email) => {
    await updateDoc(doc(db, 'notebooks', activeNotebook.id), {
      collaborators: arrayUnion(email),
    });
  };

  if (activeNotebook) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-[#080A12]">
        {/* Notebook Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] bg-[#0a0d16]">
          <button onClick={() => setActiveNotebook(null)} className="text-gray-500 hover:text-white transition-colors text-xs">← All Notebooks</button>
          <span className="text-white font-semibold text-sm">{activeNotebook.title}</span>
          <div className="flex items-center gap-1 ml-auto">
            <div className="flex -space-x-2">
              {(activeNotebook.collaborators || []).slice(0, 3).map((email, i) => (
                <div key={i} className="w-6 h-6 rounded-full border border-[#0a0d16] flex items-center justify-center text-[9px] font-bold" style={{ background: COLORS[i % COLORS.length] }}>
                  {email[0].toUpperCase()}
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                const email = prompt('Enter collaborator email:');
                if (email) addCollaborator(email);
              }}
              className="p-1.5 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors ml-2"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Cells */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cells.map((cell) => (
            <div key={cell.id} className="bg-[#0d1017] border border-white/[0.07] rounded-2xl overflow-hidden group">
              {/* Cell Header */}
              <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.05]">
                <Code className="w-3 h-3 text-green-400" />
                <span className="text-[10px] text-gray-600 font-mono">Python · Qiskit</span>
                {cell.lastEditedBy && (
                  <span className="text-[10px] text-gray-700 ml-auto">Last edited by {cell.lastEditedBy}</span>
                )}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => runCell(cell)} disabled={runningCell === cell.id} className="p-1 rounded text-green-400 hover:bg-green-400/10 transition-colors">
                    {runningCell === cell.id ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => deleteCell(cell.id)} className="p-1 rounded text-red-400 hover:bg-red-400/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {/* Code Input */}
              <textarea
                className="w-full bg-transparent text-sm font-mono text-green-300 p-4 outline-none resize-none min-h-[80px]"
                value={cell.content}
                onChange={e => updateCell(cell.id, e.target.value)}
                spellCheck={false}
              />
              {/* Output */}
              {cell.output && (
                <div className="border-t border-white/[0.05] p-4">
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Output</p>
                  {cell.circuit_svg && (
                    <div className="mb-3 overflow-x-auto" dangerouslySetInnerHTML={{ __html: cell.circuit_svg }} />
                  )}
                  <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono leading-relaxed">{cell.output.slice(0, 800)}</pre>
                </div>
              )}
            </div>
          ))}

          {/* Add Cell */}
          <div className="flex gap-2">
            <button onClick={() => addCell('code')} className="flex items-center gap-2 px-4 py-2 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all">
              <Plus className="w-3.5 h-3.5" /> Code Cell
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#080A12]">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center">
          <Users className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Collaborative Notebooks</h1>
          <p className="text-xs text-gray-500">Real-time collaborative quantum notebooks — powered by Firestore</p>
        </div>
      </div>

      {/* Create Notebook */}
      <div className="bg-[#0d1017] border border-white/[0.07] rounded-2xl p-4 mb-6 flex gap-3">
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && createNotebook()}
          placeholder="New notebook title..."
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-600"
        />
        <button
          onClick={createNotebook}
          disabled={creating || !newTitle.trim()}
          className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
        >
          {creating ? <Loader className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" />Create</>}
        </button>
      </div>

      {/* Notebook List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {notebooks.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-600">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No notebooks yet. Create your first one above!</p>
          </div>
        )}
        {notebooks.map(nb => (
          <button
            key={nb.id}
            onClick={() => setActiveNotebook(nb)}
            className="bg-[#0d1017] border border-white/[0.07] hover:border-green-500/30 rounded-2xl p-4 text-left transition-all hover:bg-[#111520] group"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-sm font-semibold text-white group-hover:text-green-300 transition-colors">{nb.title}</h3>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-green-400 transition-colors mt-0.5" />
            </div>
            <p className="text-xs text-gray-600">by {nb.ownerName || nb.ownerEmail}</p>
            {(nb.collaborators || []).length > 0 && (
              <p className="text-xs text-green-600 mt-1">{nb.collaborators.length} collaborator{nb.collaborators.length !== 1 ? 's' : ''}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
