import React, { useState } from 'react';
import { Cpu, Save, CheckCircle2 } from 'lucide-react';

export default function SettingsView() {
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="flex-1 h-full bg-[#080A12] overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Settings</h1>
            <p className="text-xs text-gray-500 mt-1">Configure default models and quantum execution preferences.</p>
          </div>
          <button onClick={save} className="btn-primary text-xs">
            {saved ? <CheckCircle2 className="w-4 h-4 text-emerald-300"/> : <Save className="w-4 h-4"/>}
            {saved ? 'Saved!' : 'Save'}
          </button>
        </div>


        <div className="glass-card p-5 space-y-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600 flex items-center gap-2"><Cpu className="w-3.5 h-3.5 text-violet-400"/>Default Model</div>
          <select className="qation-input text-xs">
            <option>google/gemini-flash-1.5</option>
            <option>meta/llama-3.1-70b-instruct (NVIDIA NIM)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
