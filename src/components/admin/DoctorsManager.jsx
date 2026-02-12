import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Save, X, Star, Clock, ToggleLeft, ToggleRight } from 'lucide-react';
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
    title: '',
    specialization: '',
    experience_years: '', // Ini sering jadi masalah jika string kosong
    photo_url: '',
    is_online: false,
    is_active: true
  });

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    const { data, error } = await supabase
        .from('dietitians')
        .select('*')
        .order('created_at', { ascending: false });
        
    if (error) {
        console.error("Gagal load dietisien:", error.message);
    } else {
        setDoctors(data || []);
    }
  };

  const handleSave = async () => {
    // 1. Validasi Input
    if(!form.name || !form.specialization) {
        return alert("Nama dan Spesialisasi wajib diisi!");
    }

    setLoading(true);

    // 2. Sanitasi Data (PENTING: Ubah string kosong jadi null/0)
    const payload = {
        name: form.name,
        title: form.title,
        specialization: form.specialization,
        // Konversi ke integer, atau 0 jika kosong
        experience_years: form.experience_years ? parseInt(form.experience_years) : 0, 
        photo_url: form.photo_url,
        is_online: form.is_online,
        is_active: form.is_active
    };

    try {
      let errorResult = null;

      if (editing) {
        // Mode EDIT
        const { error } = await supabase
            .from('dietitians')
            .update(payload)
            .eq('id', editing.id);
        errorResult = error;
      } else {
        // Mode INSERT
        const { error } = await supabase
            .from('dietitians')
            .insert([payload]);
        errorResult = error;
      }
      
      if (errorResult) throw errorResult;

      // Jika sukses
      await loadDoctors();
      resetForm();
      alert('Data berhasil disimpan!');

    } catch (error) {
      console.error("Error saving:", error);
      alert('Gagal menyimpan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('dietitians').delete().eq('id', deleteModal.item.id);
      if (error) throw error;
      
      loadDoctors();
      setDeleteModal({ show: false, item: null });
    } catch (error) {
      alert('Gagal menghapus: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: '', title: '', specialization: '', experience_years: '',
      photo_url: '', is_online: false, is_active: true
    });
    setEditing(null);
    setShowForm(false);
  };

  const startEdit = (doc) => {
    setForm({
      name: doc.name,
      title: doc.title || '',
      specialization: doc.specialization,
      experience_years: doc.experience_years || '',
      photo_url: doc.photo_url || '',
      is_online: doc.is_online,
      is_active: doc.is_active
    });
    setEditing(doc);
    setShowForm(true);
  };

  const toggleOnline = async (doc) => {
      const { error } = await supabase
        .from('dietitians')
        .update({ is_online: !doc.is_online })
        .eq('id', doc.id);
      
      if (!error) loadDoctors();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Kelola Dietisien</h2>
          <p className="text-sm text-slate-500 mt-1">Daftar ahli gizi untuk konsultasi</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold"
        >
          <Plus size={18} /> Tambah Dietisien
        </button>
      </div>

      {doctors.length === 0 ? (
        <div className="text-center py-12 bg-white border border-dashed border-slate-300 rounded-2xl">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Belum ada dietisien terdaftar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {doctors.map(doc => (
            <div key={doc.id} className="bg-white p-5 rounded-2xl border border-slate-200 hover:shadow-md transition">
              <div className="flex items-start gap-4 mb-4">
                <img 
                    src={doc.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name)}&background=random`} 
                    alt={doc.name} 
                    className="w-16 h-16 rounded-2xl object-cover bg-slate-100"
                    onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name)}&background=random`}
                />
                
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">{doc.name} {doc.title && `, ${doc.title}`}</h3>
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">{doc.specialization}</p>
                  
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={12} /> {doc.experience_years || 0} Tahun
                    </span>
                    <span className="text-xs text-yellow-500 flex items-center gap-1 font-bold">
                      <Star size={12} fill="currentColor" /> {doc.rating || '5.0'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                   <button onClick={() => toggleOnline(doc)} className={`${doc.is_online ? 'text-green-500' : 'text-slate-300'}`}>
                        {doc.is_online ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                   </button>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
                <button
                  onClick={() => startEdit(doc)}
                  className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition text-sm font-bold flex items-center justify-center gap-1"
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button
                  onClick={() => setDeleteModal({ show: true, item: doc })}
                  className="flex-1 py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition text-sm font-bold flex items-center justify-center gap-1"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full my-8 animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">
                {editing ? 'Edit Dietisien' : 'Tambah Dietisien'}
              </h3>
              <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Nama Lengkap</label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full p-3 bg-slate-50 border-transparent rounded-xl text-sm font-bold mt-1 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                        placeholder="Tirta Andini"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Gelar</label>
                    <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="w-full p-3 bg-slate-50 border-transparent rounded-xl text-sm font-bold mt-1 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                        placeholder="S.Gz, RD"
                    />
                  </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Spesialisasi</label>
                <input
                  type="text"
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  className="w-full p-3 bg-slate-50 border-transparent rounded-xl text-sm font-bold mt-1 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                  placeholder="Ahli Gizi Anak"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Pengalaman (Tahun)</label>
                <input
                  type="number"
                  value={form.experience_years}
                  onChange={(e) => setForm({ ...form, experience_years: e.target.value })}
                  className="w-full p-3 bg-slate-50 border-transparent rounded-xl text-sm font-bold mt-1 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                  placeholder="5"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">URL Foto Profil</label>
                <input
                  type="text"
                  value={form.photo_url}
                  onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                  className="w-full p-3 bg-slate-50 border-transparent rounded-xl text-sm font-bold mt-1 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                  placeholder="https://..."
                />
              </div>
              
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-lg">
                  <input
                    type="checkbox"
                    checked={form.is_online}
                    onChange={(e) => setForm({ ...form, is_online: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Set Online</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-lg">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-green-600 focus:ring-green-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Akun Aktif</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-8 border-t border-slate-100 pt-6">
              <button
                onClick={resetForm}
                className="flex-1 px-4 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-[2] px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
              >
                <Save size={18} />
                {loading ? 'Menyimpan...' : 'Simpan Data'}
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
        title="Hapus Dietisien?"
        message={`Yakin ingin menghapus ${deleteModal.item?.name}?`}
        confirmText="Ya, Hapus"
        variant="danger"
        isLoading={loading}
      />
    </div>
  );
}