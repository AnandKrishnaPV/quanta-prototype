import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { BarChart2, MessageSquare, Cpu, BookOpen, Zap, TrendingUp } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';

const COLORS = ['#7c3aed', '#0891b2', '#059669', '#d97706'];
const TYPE_ICONS = { chat: MessageSquare, circuit: Cpu, research: BookOpen, explain: Zap };

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="bg-[#0d1017] border border-white/[0.07] rounded-2xl p-4">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + '20' }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
    {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
  </div>
);

export default function DashboardView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'usage'),
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
    return onSnapshot(q, snap => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
  }, [user]);

  // Build last 7 days chart data
  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const day = subDays(new Date(), 6 - i);
    const dayStr = format(day, 'MMM d');
    const dayLogs = logs.filter(l => {
      if (!l.timestamp) return false;
      const ts = l.timestamp.toDate ? l.timestamp.toDate() : new Date(l.timestamp);
      return format(ts, 'MMM d') === dayStr;
    });
    return {
      day: dayStr,
      chat: dayLogs.filter(l => l.type === 'chat').length,
      circuit: dayLogs.filter(l => l.type === 'circuit').length,
      research: dayLogs.filter(l => l.type === 'research').length,
      explain: dayLogs.filter(l => l.type === 'explain').length,
      total: dayLogs.length,
    };
  });

  // Type breakdown for pie
  const typeBreakdown = ['chat', 'circuit', 'research', 'explain'].map(type => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: logs.filter(l => l.type === type).length,
  })).filter(t => t.value > 0);

  // Model usage
  const modelCounts = {};
  logs.forEach(l => { if (l.model) modelCounts[l.model] = (modelCounts[l.model] || 0) + 1; });
  const modelData = Object.entries(modelCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name: name.split('/').pop(), value }));

  const totalTokens = logs.reduce((s, l) => s + (l.tokens || 0), 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#0d1017] border border-white/10 rounded-xl p-3 text-xs">
        <p className="text-gray-400 mb-1">{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#080A12]">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#080A12]">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Usage Dashboard</h1>
          <p className="text-xs text-gray-500">Your real-time QATION usage analytics</p>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-16">
          <TrendingUp className="w-12 h-12 mx-auto text-gray-700 mb-3" />
          <p className="text-gray-500 text-sm">No usage data yet.</p>
          <p className="text-gray-700 text-xs mt-1">Start using Chat, Quantum Lab, or Code Explainer to see analytics here!</p>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard icon={MessageSquare} label="Total Queries" value={logs.length} color="#7c3aed" sub="All time" />
            <StatCard icon={Zap} label="Tokens Used" value={totalTokens > 1000 ? `${(totalTokens/1000).toFixed(1)}k` : totalTokens} color="#0891b2" sub="Across all models" />
            <StatCard icon={Cpu} label="Circuits Run" value={logs.filter(l => l.type === 'circuit').length} color="#059669" sub="Quantum simulations" />
            <StatCard icon={BarChart2} label="Today" value={last7[6]?.total || 0} color="#d97706" sub="Queries today" />
          </div>

          {/* 7-Day Activity */}
          <div className="bg-[#0d1017] border border-white/[0.07] rounded-2xl p-4 mb-4">
            <p className="text-sm font-semibold text-white mb-4">Activity — Last 7 Days</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={last7} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="chat" fill="#7c3aed" radius={[3, 3, 0, 0]} name="Chat" />
                <Bar dataKey="circuit" fill="#0891b2" radius={[3, 3, 0, 0]} name="Circuit" />
                <Bar dataKey="research" fill="#059669" radius={[3, 3, 0, 0]} name="Research" />
                <Bar dataKey="explain" fill="#d97706" radius={[3, 3, 0, 0]} name="Explain" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type Breakdown Pie */}
            {typeBreakdown.length > 0 && (
              <div className="bg-[#0d1017] border border-white/[0.07] rounded-2xl p-4">
                <p className="text-sm font-semibold text-white mb-4">Feature Usage</p>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={typeBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                      {typeBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0d1017', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Model Usage */}
            {modelData.length > 0 && (
              <div className="bg-[#0d1017] border border-white/[0.07] rounded-2xl p-4">
                <p className="text-sm font-semibold text-white mb-4">Models Used</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={modelData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0d1017', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="value" fill="#7c3aed" radius={[0, 3, 3, 0]} name="Queries" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
