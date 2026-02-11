// src/components/admin/DoctorsManager.jsx
import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Save, X, Star, Clock } from 'lucide-react';
import { supabase } from '../../config/supabase';
import ConfirmModal from '../modals/ConfirmModal';

export default function DoctorsManager() {
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, item: null });
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    specialization: '',
    experience_years: '',
    rating: '5.0',
    bio: '',
    photo_url: '',
    is_online: false,
    is_active: true
  });

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    const { data } = await supabase.from('doctors').select('*').order('name');
    setDoctors(data || []);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editing) {
        await supabase.from('doctors').update(form).eq('id', editing.id);
      } else {
        await supabase.from('doctors').insert([form]);
      }
      loadDoctors();
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await supabase.from('doctors').delete().eq('id', deleteModal.item.id);
      loadDoctors();
      setDeleteModal({ show: false, item: null });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      specialization: '',
      experience_years: '',
      rating: '5.0',
      bio: '',
      photo_url: '',
      is_online: false,
      is_active: true
    });
    setEditing(null);
    setShowForm(false);
  };

  const startEdit = (doc) => {
    setForm({
      name: doc.name,
      specialization: doc.specialization,
      experience_years: doc.experience_years,
      rating: doc.rating || '5.0',
      bio: doc.bio || '',
      photo_url: doc.photo_url || '',
      is_online: doc.is_online,
      is_active: doc.is_active
    });
    setEditing(doc);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Kelola Dokter</h2>
          <p className="text-sm text-slate-500 mt-1">Tambah dan kelola daftar dokter konsultasi</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus size={18} />
          Tambah Dokter
        </button>
      </div>

      {doctors.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Belum ada dokter terdaftar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {doctors.map(doc => (
            <div key={doc.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className="flex items-start gap-4 mb-4">
                {doc.photo_url ? (
                  <img src={doc.photo_url} alt={doc.name} className="w-16 h-16 rounded-2xl object-cover" />
                ) : (
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                    {doc.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">{doc.name}</h3>
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">{doc.specialization}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={12} /> {doc.experience_years} Tahun
                    </span>
                    <span className="text-xs text-yellow-600 flex items-center gap-1">
                      <Star size={12} fill="currentColor" /> {doc.rating || '5.0'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${doc.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {doc.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                  {doc.is_online && (
                    <span className="text-xs px-2 py-1 rounded-full font-bold bg-blue-100 text-blue-700">
                      Online
                    </span>
                  )}
                </div>
              </div>
              
              {doc.bio && (
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{doc.bio}</p>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(doc)}
                  className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button
                  onClick={() => setDeleteModal({ show: true, item: doc })}
                  className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                >
                  <Trash2 size={14} /> Hapus
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
                {editing ? 'Edit Dokter' : 'Tambah Dokter'}
              </h3>
              <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">Nama Dokter</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-3 bg-slate-50 border-transparent rounded-xl text-sm font-medium mt-2 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                  placeholder="dr. Nama Lengkap Sp.GK"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">Spesialisasi</label>
                <input
                  type="text"
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  className="w-full p-3 bg-slate-50 border-transparent rounded-xl text-sm font-medium mt-2 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                  placeholder="Spesialis Gizi, Nutritionist, dll"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">Pengalaman (Tahun)</label>
                  <input
                    type="number"
                    value={form.experience_years}
                    onChange={(e) => setForm({ ...form, experience_years: e.target.value })}
                    className="w-full p-3 bg-slate-50 border-transparent rounded-xl text-sm font-medium mt-2 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: e.target.value })}
                    className="w-full p-3 bg-slate-50 border-transparent rounded-xl text-sm font-medium mt-2 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                    placeholder="5.0"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="w-full p-3 bg-slate-50 border-transparent rounded-xl text-sm font-medium mt-2 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                  rows="3"
                  placeholder="Deskripsi singkat tentang dokter..."
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">URL Foto</label>
                <input
                  type="text"
                  value={form.photo_url}
                  onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                  className="w-full p-3 bg-slate-50 border-transparent rounded-xl text-sm font-medium mt-2 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
              
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_online}
                    onChange={(e) => setForm({ ...form, is_online: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Status Online</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-green-600 focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Aktif</span>
                </label>
              </div>
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
                disabled={loading || !form.name || !form.specialization}
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
        title="Hapus Dokter?"
        message={`Apakah Anda yakin ingin menghapus ${deleteModal.item?.name}?`}
        confirmText="Ya, Hapus"
        variant="danger"
        isLoading={loading}
      />
    </div>
  );
}
