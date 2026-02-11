// src/pages/EducationPage.jsx
import { useState, useEffect } from 'react';
import { Sparkles, Brain, Apple, Moon, ChevronRight, AlertCircle } from 'lucide-react';
import { supabase } from '../config/supabase';

const iconMap = {
  'Apple': Apple,
  'Brain': Brain,
  'Sparkles': Sparkles,
  'Moon': Moon
};

const colorMap = {
  'orange': 'text-orange-600 bg-orange-50 border-orange-100',
  'blue': 'text-blue-600 bg-blue-50 border-blue-100',
  'green': 'text-green-600 bg-green-50 border-green-100',
  'purple': 'text-purple-600 bg-purple-50 border-purple-100',
  'pink': 'text-pink-600 bg-pink-50 border-pink-100',
  'yellow': 'text-yellow-600 bg-yellow-50 border-yellow-100'
};

export default function EducationPage() {
  const [facts, setFacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFacts();
  }, []);

  const loadFacts = async () => {
    try {
      const { data, error } = await supabase
        .from('education_facts')
        .select('*')
        .eq('is_active', true)
        .order('order_number');
      
      if (error) throw error;
      setFacts(data || []);
    } catch (error) {
      console.error('Error loading facts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-8 pb-32 min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-medium">Memuat informasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-8 pb-32 min-h-screen bg-white">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
          <Sparkles size={12} fill="currentColor" /> Daily Insight
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Info <span className="text-blue-600">Gizi.</span>
        </h1>
        <p className="text-slate-500 font-medium">Edukasi cerdas untuk tumbuh kembang optimal.</p>
      </header>

      {facts.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto" />
          <p className="text-slate-400 font-medium">Belum ada informasi tersedia</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {facts.map((fact, i) => {
            const Icon = iconMap[fact.icon_name] || Sparkles;
            const colorClass = colorMap[fact.color] || colorMap.blue;
            
            return (
              <div 
                key={fact.id} 
                className={`p-8 rounded-[2.8rem] border flex gap-8 items-center group hover:bg-white hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 ${colorClass} border-transparent`}
              >
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shrink-0 bg-white shadow-xl group-hover:rotate-6 transition-transform`}>
                  <Icon size={32} />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="font-extrabold text-xl text-slate-800 tracking-tight">{fact.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium opacity-80">
                    {fact.content}
                  </p>
                  {fact.source && (
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-2">
                      Sumber: {fact.source}
                    </p>
                  )}
                </div>
                <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                  <ChevronRight size={20} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-slate-900 p-10 rounded-[3rem] text-center text-white space-y-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-600 rounded-full blur-[80px] opacity-30 group-hover:opacity-50 transition-opacity" />
        <div className="relative z-10 space-y-4">
          <h2 className="text-2xl font-black italic tracking-tighter leading-tight">
            "Nutrisi terbaik hari ini adalah investasi masa depan hebat mereka."
          </h2>
          <div className="flex justify-center items-center gap-2">
            <div className="h-px w-8 bg-white/20" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Healthy Generation</p>
            <div className="h-px w-8 bg-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
