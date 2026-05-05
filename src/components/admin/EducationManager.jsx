import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';

const ICONS = ['Sparkles', 'Brain', 'Apple', 'Moon'];
const COLORS = ['blue', 'orange', 'green', 'purple', 'pink', 'yellow'];

export default function EducationManager() {
  const [facts, setFacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    details: '',
    source: '',
    icon_name: 'Sparkles',
    color: 'blue',
    is_active: true,
    order_number: 0
  });

  useEffect(() => {
    fetchFacts();
  }, []);

  const fetchFacts = async () => {
    try {
      const { data, error } = await supabase
        .from('education_facts')
        .select('*')
        .order('order_number', { ascending: true });

      if (error) throw error;

      setFacts(data || []);
    } catch (error) {
      console.error('Error:', error);
      alert('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from('education_facts')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const newOrder =
          facts.length > 0
            ? Math.max(...facts.map((f) => f.order_number)) + 1
            : 1;

        const { error } = await supabase
          .from('education_facts')
          .insert([{ ...formData, order_number: newOrder }]);

        if (error) throw error;
      }

      await fetchFacts();
      closeModal();
    } catch (error) {
      console.error('Error:', error);
      alert('Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus informasi ini?')) return;

    try {
      const { error } = await supabase
        .from('education_facts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchFacts();
    } catch (error) {
      alert('Gagal menghapus');
    }
  };

  const openEditModal = (fact) => {
    setFormData({
      title: fact.title,
      content: fact.content,
      details: fact.details || '',
      source: fact.source || '',
      icon_name: fact.icon_name,
      color: fact.color,
      is_active: fact.is_active,
      order_number: fact.order_number
    });

    setEditingId(fact.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setFormData({
      title: '',
      content: '',
      details: '',
      source: '',
      icon_name: 'Sparkles',
      color: 'blue',
      is_active: true,
      order_number: 0
    });

    setEditingId(null);
    setIsModalOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          Manajemen Edukasi
        </h2>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          Tambah Info
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium">
            <tr>
              <th className="px-6 py-4">Judul</th>
              <th className="px-6 py-4">Ringkasan</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {facts.map((fact) => (
              <tr
                key={fact.id}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-slate-900">
                  {fact.title}
                </td>

                <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
                  {fact.content}
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      fact.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {fact.is_active ? 'Aktif' : 'Draft'}
                  </span>
                </td>

                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => openEditModal(fact)}
                    className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>

                  <button
                    onClick={() => handleDelete(fact.id)}
                    className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <form onSubmit={handleSubmit}>
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">
                  {editingId ? 'Edit Informasi' : 'Tambah Informasi Baru'}
                </h3>

                <button
                  type="button"
                  onClick={closeModal}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Judul Utama
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ringkasan
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Konten Lengkap
                  </label>
                  <textarea
                    rows={8}
                    value={formData.details}
                    onChange={(e) =>
                      setFormData({ ...formData, details: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_active: e.target.checked
                      })
                    }
                  />
                  <span className="text-sm text-slate-700">
                    Tampilkan ke Publik
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-slate-600"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
