import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import {
  collection, addDoc, onSnapshot, updateDoc, doc,
  query, orderBy, serverTimestamp, arrayUnion, arrayRemove,
  increment, getDoc, setDoc
} from 'firebase/firestore';
import { Cpu, Heart, MessageSquare, Plus, ChevronUp, Share2, Loader, Send, X } from 'lucide-react';

const GATE_COLORS = { H: '#7c3aed', X: '#dc2626', Y: '#059669', Z: '#0891b2', CNOT: '#d97706', M: '#6b7280', CZ: '#db2777', S: '#0d9488', T: '#7c2d12' };

const MiniCircuit = ({ gates = [], qubits = 2 }) => {
  const maxSlot = Math.max(...gates.map(g => g.slot || 1), 3);
  const colors = ['#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626'];
  return (
    <svg width="100%" height={qubits * 28 + 10} viewBox={`0 0 ${maxSlot * 50 + 40} ${qubits * 28 + 10}`}>
      {Array.from({ length: qubits }).map((_, q) => (
        <React.Fragment key={q}>
          <text x="4" y={q * 28 + 20} fontSize="10" fill="#6b7280">q{q}</text>
          <line x1="20" y1={q * 28 + 16} x2={maxSlot * 50 + 30} y2={q * 28 + 16} stroke="#374151" strokeWidth="1" />
        </React.Fragment>
      ))}
      {gates.map((g, i) => {
        const cx = (g.slot || 1) * 50 - 10;
        const cy = (g.qubit || 0) * 28 + 16;
        const color = GATE_COLORS[g.gate] || '#7c3aed';
        return (
          <g key={i}>
            <rect x={cx - 12} y={cy - 10} width="24" height="20" rx="3" fill={color} opacity="0.9" />
            <text x={cx} y={cy + 4} fontSize="9" fill="white" textAnchor="middle" fontWeight="bold">{g.gate}</text>
          </g>
        );
      })}
    </svg>
  );
};

export default function CircuitGalleryView() {
  const [circuits, setCircuits] = useState([]);
  const [activeComments, setActiveComments] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newCircuit, setNewCircuit] = useState({ title: '', description: '', qubits: 2, gates: [] });
  const user = auth.currentUser;

  // Load circuits
  useEffect(() => {
    const q = query(collection(db, 'circuits'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => setCircuits(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  // Load comments for active circuit
  useEffect(() => {
    if (!activeComments) { setComments([]); return; }
    const q = query(collection(db, 'circuits', activeComments, 'comments'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, snap => setComments(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [activeComments]);

  const toggleUpvote = async (circuit) => {
    const ref = doc(db, 'circuits', circuit.id);
    const hasUpvoted = (circuit.upvoters || []).includes(user.uid);
    await updateDoc(ref, {
      upvotes: increment(hasUpvoted ? -1 : 1),
      upvoters: hasUpvoted ? arrayRemove(user.uid) : arrayUnion(user.uid),
    });
  };

  const addComment = async () => {
    if (!commentText.trim() || !activeComments) return;
    await addDoc(collection(db, 'circuits', activeComments, 'comments'), {
      text: commentText,
      author: user.displayName || user.email,
      uid: user.uid,
      createdAt: serverTimestamp(),
    });
    setCommentText('');
  };

  const submitCircuit = async () => {
    if (!newCircuit.title.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'circuits'), {
        ...newCircuit,
        gates: [
          { qubit: 0, slot: 1, gate: 'H' },
          { qubit: 1, slot: 2, gate: 'X' },
        ],
        author: user.displayName || user.email,
        uid: user.uid,
        upvotes: 0,
        upvoters: [],
        createdAt: serverTimestamp(),
      });
      setShowSubmit(false);
      setNewCircuit({ title: '', description: '', qubits: 2, gates: [] });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#080A12]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Circuit Gallery</h1>
            <p className="text-xs text-gray-500">Community-built quantum circuits — upvote, comment, share</p>
          </div>
        </div>
        <button onClick={() => setShowSubmit(true)} className="btn-primary px-4 py-2 text-sm">
          <Plus className="w-4 h-4 mr-1" />Submit Circuit
        </button>
      </div>

      {/* Submit Modal */}
      {showSubmit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d1017] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Submit a Circuit</h2>
              <button onClick={() => setShowSubmit(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="space-y-3">
              <input
                placeholder="Circuit title *"
                value={newCircuit.title}
                onChange={e => setNewCircuit(p => ({ ...p, title: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none placeholder-gray-600 focus:border-violet-500/50"
              />
              <textarea
                placeholder="Describe what this circuit does..."
                value={newCircuit.description}
                onChange={e => setNewCircuit(p => ({ ...p, description: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none placeholder-gray-600 min-h-[80px] resize-none focus:border-violet-500/50"
              />
              <div className="flex items-center gap-3">
                <label className="text-xs text-gray-500">Qubits:</label>
                <select
                  value={newCircuit.qubits}
                  onChange={e => setNewCircuit(p => ({ ...p, qubits: +e.target.value }))}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white outline-none"
                >
                  {[2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <button onClick={submitCircuit} disabled={submitting || !newCircuit.title.trim()} className="w-full btn-primary py-2.5 justify-center disabled:opacity-50">
                {submitting ? <Loader className="w-4 h-4 animate-spin" /> : 'Submit to Gallery'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Circuit Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {circuits.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-600">
            <Cpu className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No circuits yet. Be the first to submit one!</p>
          </div>
        )}
        {circuits.map(circuit => {
          const hasUpvoted = (circuit.upvoters || []).includes(user?.uid);
          return (
            <div key={circuit.id} className="bg-[#0d1017] border border-white/[0.07] rounded-2xl overflow-hidden hover:border-amber-500/20 transition-all group">
              {/* Circuit Viz */}
              <div className="p-4 bg-[#080A12] border-b border-white/[0.05]">
                <MiniCircuit gates={circuit.gates || []} qubits={circuit.qubits || 2} />
              </div>
              {/* Info */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-white mb-1">{circuit.title}</h3>
                {circuit.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{circuit.description}</p>}
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span>{circuit.qubits}q</span>
                  <span>by {circuit.author}</span>
                </div>
              </div>
              {/* Actions */}
              <div className="px-4 pb-3 flex items-center gap-3">
                <button
                  onClick={() => toggleUpvote(circuit)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all ${hasUpvoted ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-gray-500 hover:text-amber-400 hover:bg-amber-500/10'}`}
                >
                  <ChevronUp className="w-3.5 h-3.5" />{circuit.upvotes || 0}
                </button>
                <button
                  onClick={() => setActiveComments(activeComments === circuit.id ? null : circuit.id)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />Comments
                </button>
              </div>

              {/* Comments */}
              {activeComments === circuit.id && (
                <div className="border-t border-white/[0.05] p-4 space-y-3">
                  {comments.map(c => (
                    <div key={c.id} className="flex gap-2">
                      <div className="w-5 h-5 rounded-full bg-violet-500/30 flex items-center justify-center text-[9px] font-bold text-violet-300 flex-shrink-0 mt-0.5">
                        {c.author?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-600">{c.author}</p>
                        <p className="text-xs text-gray-300">{c.text}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addComment()}
                      placeholder="Add a comment..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none placeholder-gray-600 focus:border-violet-500/50"
                    />
                    <button onClick={addComment} className="p-2 bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 transition-colors">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
