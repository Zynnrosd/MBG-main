// src/components/admin/EducationManager.jsx
import { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit2, Trash2, Save, X, MoveUp, MoveDown } from 'lucide-react';
import { supabase } from '../../config/supabase';
import ConfirmModal from '../modals/ConfirmModal';

export default function EducationManager() {
  const [facts, setFacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, item: null });
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    content: '',
    icon_name: 'Sparkles',
    color: 'blue',
    source: '',
    order_number: 1,
    is_active: true
  });

  const iconOptions = ['Sparkles', 'Brain', 'Apple', 'Moon'];
  const colorOptions = [
    { value: 'blue', label: 'Biru' },
    { value: 'green', label: 'Hijau' },
    { value: 'orange', label: 'Oranye' },
    { value: 'purple', label: 'Ungu' },
    { value: 'pink', label: 'Pink' },
    { value: 'yellow', label: 'Kuning' }
  ];

  useEffect(() => {
    loadFacts();
  }, []);

  const loadFacts = async () => {
    const { data } = await supabase.from('education_facts').select('*').order('order_number');
    setFacts(data || []);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editing) {
        await supabase.from('education_facts').update(form).eq('id', editing.id);
      } else {
        // Get max order number and add 1
        const maxOrder = facts.length > 0 ? Math.max(...facts.map(f => f.order_number)) : 0;
        await supabase.from('education_facts').insert([{ ...form, order_number: maxOrder + 1 }]);
      }
      loadFacts();
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await supabase.from('education_facts').delete().eq('id', deleteModal.item.id);
      loadFacts();
      setDeleteModal({ show: false, item: null });
    } finally {
      setLoading(false);
    }
  };

  const moveItem = async (fact, direction) => {
    const currentIndex = facts.findIndex(f => f.id === fact.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= facts.length) return;
    
    const targetFact = facts[targetIndex];
    
    // Swap order numbers
    await supabase.from('education_facts').update({ order_number: targetFact.order_number }).eq('id', fact.id);
    await supabase.from('education_facts').update({ order_number: fact.order_number }).eq('id', targetFact.id);
    
    loadFacts();
  };

  const resetForm = () => {
    setForm({
      title: '',
      content: '',
      icon_name: 'Sparkles',
      color: 'blue',
      source: '',
      order_number: 1,
      is_active: true
    });
    setEditing(null);
    setShowForm(false);
  };

  const startEdit = (fact) => {
    setForm({
      title: fact.title,
      content: fact.content,
      icon_name: fact.icon_name,
      color: fact.color,
      source: fact.source || '',
      order_number: fact.order_number,
      is_active: fact.is_active
    });
    setEditing(fact);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Kelola Edukasi</h2>
          <p className="text-sm text-slate-500 mt-1">Tambah dan kelola fun facts gizi</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus size={18} />
          Tambah Fun Fact
        </button>
      </div>

      {facts.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Belum ada konten edukasi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {facts.map((fact, index) => (
            <div key={fact.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveItem(fact, 'up')}
                  disabled={index === 0}
                  className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <MoveUp size={16} />
                </button>
                <button
                  onClick={() => moveItem(fact, 'down')}
                  disabled={index === facts.length - 1}
                  className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <MoveDown size={16} />
                </button>
              </div>

              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-${fact.color}-100 text-${fact.color}-600`}>
                <span className="text-2xl">{fact.icon_name === 'Sparkles' ? '✨' : fact.icon_name === 'Brain' ? '🧠' : fact.icon_name === 'Apple' ? '🍎' : '🌙'}</span>
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-slate-900">{fact.title}</h3>
                <p className="text-sm text-slate-600 mt-1 line-clamp-2">{fact.content}</p>
                {fact.source && (
                  <p className="text-xs text-slate-400 mt-1">Sumber: {fact.source}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${fact.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {fact.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
                <button
                  onClick={() => startEdit(fact)}
                  className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => setDeleteModal({ show: true, item: fact })}
                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">
                {editing ? 'Edit Fun Fact' : 'Tambah Fun Fact'}
              </h3>
              <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">Judul</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full p-3 bg-slate-50 border-transparent rounded-xl text-sm font-medium mt-2 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                  placeholder="Super Protein"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">Konten</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full p-3 bg-slate-50 border-transparent rounded-xl text-sm font-medium mt-2 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                  rows="4"
                  placeholder="Satu butir telur mengandung protein setara segelas susu."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">Ikon</label>
                  <select
                    value={form.icon_name}
                    onChange={(e) => setForm({ ...form, icon_name: e.target.value })}
                    className="w-full p-3 bg-slate-50 border-transparent rounded-xl text-sm font-medium mt-2 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                  >
                    {iconOptions.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">Warna</label>
                  <select
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-full p-3 bg-slate-50 border-transparent rounded-xl text-sm font-medium mt-2 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                  >
                    {colorOptions.map(color => (
                      <option key={color.value} value={color.value}>{color.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">Sumber (Opsional)</label>
                <input
                  type="text"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className="w-full p-3 bg-slate-50 border-transparent rounded-xl text-sm font-medium mt-2 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                  placeholder="Kemenkes RI, 2024"
                />
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-green-600 focus:ring-2 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-slate-700">Tampilkan di aplikasi</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={resetForm}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !form.title || !form.content}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, item: null })}
        onConfirm={handleDelete}
        title="Hapus Fun Fact?"
        message="Apakah Anda yakin ingin menghapus konten edukasi ini?"
        confirmText="Ya, Hapus"
        variant="danger"
        isLoading={loading}
      />
    </div>
  );
}
