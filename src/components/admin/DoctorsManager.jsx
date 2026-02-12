import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Save, X, Star, Clock, ToggleLeft, ToggleRight, Mail, Award } from 'lucide-react';
import { supabase } from '../../config/supabase';
import ConfirmModal from '../modals/ConfirmModal';

export default function DoctorsManager() {
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, item: null });
  const [loading, setLoading] = useState(false);

  // State Form
  const [form, setForm] = useState({
    name: '',
    email: '', // Menambahkan Email agar bisa login
    title: '',
    specialization: '',
    experience_years: '', 
    photo_url: '',
    is_online: false,
    is_active: true
  });

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    // FIX: Gunakan tabel 'doctors'
    const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('created_at', { ascending: false });
        
    if (error) {
        console.error("Gagal load data:", error.message);
    } else {
        setDoctors(data || []);
    }
  };

  const handleSave = async () => {
    // 1. Validasi Input
    if(!form.name || !form.email) {
        return alert("Nama dan Email wajib diisi!");
    }

    setLoading(true);

    // 2. Sanitasi Data
    const payload = {
        name: form.name,
        email: form.email,
        title: form.title,
        specialization: form.specialization || 'Ahli Gizi',
        experience_years: form.experience_years ? parseInt(form.experience_years) : 0, 
        photo_url: form.photo_url,
        is_online: form.is_online,
        is_active: form.is_active
    };

    try {
      let errorResult = null;

      if (editing) {
        // Mode EDIT: Update ke tabel 'doctors'
        const { error } = await supabase
            .from('doctors')
            .update(payload)
            .eq('id', editing.id);
        errorResult = error;
      } else {
        // Mode INSERT: Insert ke tabel 'doctors'
        const { error } = await supabase
            .from('doctors')
            .insert([payload]);
        errorResult = error;
      }
      
      if (errorResult) throw errorResult;

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
      // FIX: Delete dari tabel 'doctors'
      const { error } = await supabase.from('doctors').delete().eq('id', deleteModal.item.id);
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
      name: '', email: '', title: '', specialization: '', experience_years: '',
      photo_url: '', is_online: false, is_active: true
    });
    setEditing(null);
    setShowForm(false);
  };

  const startEdit = (doc) => {
    setForm({
      name: doc.name,
      email: doc.email || '',
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
      // FIX: Update status di tabel 'doctors'
      const { error } = await supabase
        .from('doctors')
        .update({ is_online: !doc.is_online })
        .eq('id', doc.id);
      
      if (!error) loadDoctors();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 italic tracking-tight">Kelola Dietisien</h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Daftar ahli gizi SIGAP</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-[1.5rem] hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200 font-black uppercase text-[10px] tracking-widest"
        >
          <Plus size={18} /> Tambah Dietisien
        </button>
      </div>

      {doctors.length === 0 ? (
        <div className="text-center py-20 bg-white border-2 border-dashed border-slate-200 rounded-[3rem]">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Belum ada dietisien terdaftar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {doctors.map(doc => (
            <div key={doc.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-start gap-5 mb-6">
                <div className="relative">
                    <img 
                        src={doc.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name)}&background=random`} 
                        alt={doc.name} 
                        className="w-20 h-20 rounded-[1.5rem] object-cover bg-slate-100 shadow-md"
                        onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name)}&background=random`}
                    />
                    <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full border-4 border-white ${doc.is_online ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-900 text-lg truncate">{doc.name} {doc.title && `, ${doc.title}`}</h3>
                  <div className="flex items-center gap-2 mb-1">
                     <Mail size={10} className="text-slate-400"/>
                     <p className="text-xs font-bold text-slate-400 truncate">{doc.email}</p>
                  </div>
                  <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest bg-blue-50 inline-block px-2 py-1 rounded-lg mt-1">{doc.specialization}</p>
                  
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
                      <Clock size={12} /> {doc.experience_years || 0} Thn
                    </span>
                    <span className="text-[10px] font-bold text-yellow-600 flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                      <Star size={12} fill="currentColor" /> {doc.rating || '5.0'}
                    </span>
                  </div>
                </div>

                <button onClick={() => toggleOnline(doc)} className={`${doc.is_online ? 'text-green-500 hover:text-green-600' : 'text-slate-300 hover:text-slate-400'} transition-colors`}>
                     {doc.is_online ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                </button>
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-slate-50">
                <button
                  onClick={() => startEdit(doc)}
                  className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button
                  onClick={() => setDeleteModal({ show: true, item: doc })}
                  className="flex-1 py-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-[3rem] p-10 max-w-2xl w-full my-8 animate-in zoom-in-95 duration-300 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                  <h3 className="text-2xl font-black text-slate-900 italic">
                    {editing ? 'Edit Data Dietisien' : 'Tambah Dietisien Baru'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lengkapi form berikut dengan benar</p>
              </div>
              <button onClick={resetForm} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400 hover:text-red-500">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 sm:col-span-1 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-blue-600 outline-none transition-all placeholder:text-slate-300"
                        placeholder="Dr. Tirta Andini"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gelar (Opsional)</label>
                    <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-blue-600 outline-none transition-all placeholder:text-slate-300"
                        placeholder="S.Gz, RD"
                    />
                  </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Mail size={12}/> Email (Untuk Login)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-blue-600 outline-none transition-all placeholder:text-slate-300"
                  placeholder="dokter@sigapgizi.id"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 sm:col-span-1 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Award size={12}/> Spesialisasi</label>
                    <input
                      type="text"
                      value={form.specialization}
                      onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                      className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-blue-600 outline-none transition-all placeholder:text-slate-300"
                      placeholder="Ahli Gizi Anak"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Clock size={12}/> Pengalaman (Thn)</label>
                    <input
                      type="number"
                      value={form.experience_years}
                      onChange={(e) => setForm({ ...form, experience_years: e.target.value })}
                      className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-blue-600 outline-none transition-all placeholder:text-slate-300"
                      placeholder="5"
                    />
                  </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL Foto Profil</label>
                <input
                  type="text"
                  value={form.photo_url}
                  onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                  className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-blue-600 outline-none transition-all placeholder:text-slate-300"
                  placeholder="https://..."
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <label className={`flex-1 flex items-center justify-center gap-2 cursor-pointer p-4 rounded-2xl border-2 transition-all ${form.is_online ? 'border-green-500 bg-green-50' : 'border-slate-100 bg-slate-50'}`}>
                  <input
                    type="checkbox"
                    checked={form.is_online}
                    onChange={(e) => setForm({ ...form, is_online: e.target.checked })}
                    className="hidden"
                  />
                  <div className={`w-3 h-3 rounded-full ${form.is_online ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${form.is_online ? 'text-green-600' : 'text-slate-400'}`}>Set Online</span>
                </label>
                
                <label className={`flex-1 flex items-center justify-center gap-2 cursor-pointer p-4 rounded-2xl border-2 transition-all ${form.is_active ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="hidden"
                  />
                  <div className={`w-3 h-3 rounded-full ${form.is_active ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${form.is_active ? 'text-blue-600' : 'text-slate-400'}`}>Akun Aktif</span>
                </label>
              </div>
            </div>

            <div className="flex gap-4 mt-10 pt-8 border-t border-slate-100">
              <button
                onClick={resetForm}
                className="flex-1 px-6 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-2xl transition"
              >
                Batalkan
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-[2] px-6 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition font-black uppercase text-[10px] tracking-widest disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-blue-200"
              >
                <Save size={18} />
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
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
        title="Hapus Data Dietisien?"
        message={`Apakah Anda yakin ingin menghapus data ${deleteModal.item?.name} secara permanen?`}
        confirmText="Ya, Hapus Sekarang"
        variant="danger"
        isLoading={loading}
      />
    </div>
  );
}