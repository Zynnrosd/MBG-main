import { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  ChefHat,
  Calendar,
  MapPin,
  Loader2
} from 'lucide-react';
import { supabase } from '../../config/supabase';

export default function MenusManager() {
  // ================= STATE =================
  const [menus, setMenus] = useState([]);
  const [kitchens, setKitchens] = useState([]);

  const [selectedKitchen, setSelectedKitchen] = useState('');
  const [selectedRole, setSelectedRole] = useState('anak');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [loading, setLoading] = useState(false);

  const initialForm = {
    menu_date: new Date().toISOString().split('T')[0],
    menu_name: '',
    description: '',
    carb_type: '',
    carb_grams: '',
    animal_protein: '',
    animal_grams: '',
    plant_protein: '',
    plant_grams: '',
    vegetable: '',
    vegetable_grams: '',
    fruit: '',
    fruit_grams: '',
    milk: '',
    milk_ml: '',
    calories: '',
    protein: ''
  };

  const [formData, setFormData] = useState(initialForm);

  // ================= EFFECT =================
  useEffect(() => {
    loadKitchens();
  }, []);

  useEffect(() => {
    if (selectedKitchen) {
      loadMenus();
    } else {
      setMenus([]);
    }
  }, [selectedKitchen, selectedRole]);

  // ================= API =================
  const loadKitchens = async () => {
    const { data } = await supabase
      .from('kitchen_locations')
      .select('id, name, district_name, city_name')
      .order('name');

    setKitchens(data || []);

    if (data?.length > 0) {
      setSelectedKitchen(data[0].id);
    }
  };

  const loadMenus = async () => {
    setLoading(true);

    const { data } = await supabase
      .from('daily_menus')
      .select('*')
      .eq('kitchen_id', selectedKitchen)
      .eq('role_category', selectedRole)
      .order('menu_date', { ascending: false });

    setMenus(data || []);
    setLoading(false);
  };

  // ================= ACTION =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedKitchen) {
      return alert('Pilih lokasi dapur dulu!');
    }

    setLoading(true);

    const payload = {
      ...formData,
      kitchen_id: selectedKitchen,
      role_category: selectedRole
    };

    try {
      if (editingMenu) {
        await supabase.from('daily_menus').update(payload).eq('id', editingMenu.id);
      } else {
        await supabase.from('daily_menus').insert([payload]);
      }

      loadMenus();
      setIsFormOpen(false);
      setFormData(initialForm);
      setEditingMenu(null);
    } catch (error) {
      alert('Gagal menyimpan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Hapus menu ini?')) {
      await supabase.from('daily_menus').delete().eq('id', id);
      loadMenus();
    }
  };

  const handleEdit = (menu) => {
    setEditingMenu(menu);
    setFormData({ ...menu });
    setIsFormOpen(true);
  };

  const currentKitchenName =
    kitchens.find((k) => k.id === selectedKitchen)?.name || '...';

  // ================= UI =================
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-20 z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Manajemen Menu
            </h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
              Kelola menu per lokasi dapur & target
            </p>
          </div>

          <button
            onClick={() => {
              if (!selectedKitchen) {
                return alert('Silakan pilih dapur terlebih dahulu');
              }

              setFormData(initialForm);
              setEditingMenu(null);
              setIsFormOpen(true);
            }}
            disabled={!selectedKitchen}
            className="bg-blue-600 text-white px-5 py-3 rounded-xl flex gap-2 font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={20} /> Tambah Menu
          </button>
        </div>

        {/* FILTER */}
        <div className="grid md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
          {/* Dapur */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
              <MapPin size={12} /> Pilih Lokasi Dapur
            </label>
            <select
              value={selectedKitchen}
              onChange={(e) => setSelectedKitchen(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 outline-none"
            >
              {kitchens.length === 0 && (
                <option value="">Belum ada data dapur</option>
              )}
              {kitchens.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name} ({k.district_name}, {k.city_name})
                </option>
              ))}
            </select>
          </div>

          {/* Role */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
              Target Penerima
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 font-medium outline-none"
            >
              <option value="anak">Anak Sekolah (SD/SMP)</option>
              <option value="ibu_hamil">Ibu Hamil</option>
              <option value="ibu_menyusui">Ibu Menyusui</option>
            </select>
          </div>
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-4 min-h-[300px]">
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="animate-spin mx-auto text-blue-500 mb-2" size={32} />
            <p className="text-slate-500">Memuat menu...</p>
          </div>
        ) : !selectedKitchen ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <MapPin className="mx-auto text-slate-300 mb-2" size={48} />
            <p className="text-slate-500">
              Silakan pilih lokasi dapur terlebih dahulu.
            </p>
          </div>
        ) : menus.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <ChefHat className="mx-auto text-slate-300 mb-2" size={48} />
            <p className="text-slate-500 font-medium">
              Belum ada menu terjadwal.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Lokasi: {currentKitchenName}
              <br />
              Target: {selectedRole}
            </p>
          </div>
        ) : (
          menus.map((menu) => (
            <div
              key={menu.id}
              className="bg-white border border-slate-200 p-5 rounded-2xl hover:shadow-md transition flex flex-col sm:flex-row gap-4"
            >
              {/* Tanggal */}
              <div className="bg-blue-50 text-blue-700 p-4 rounded-xl flex flex-col items-center justify-center min-w-[90px] text-center">
                <Calendar size={20} className="mb-1" />
                <span className="text-2xl font-bold leading-none">
                  {new Date(menu.menu_date).getDate()}
                </span>
                <span className="text-xs font-bold uppercase">
                  {new Date(menu.menu_date).toLocaleDateString('id-ID', {
                    month: 'short'
                  })}
                </span>
              </div>

              {/* Detail */}
              <div className="flex-1 py-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-slate-900">
                    {menu.menu_name}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700">
                    {selectedRole.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-sm text-slate-500 line-clamp-1 mb-3">
                  {menu.description || 'Tidak ada deskripsi khusus.'}
                </p>

                <div className="flex flex-wrap gap-2 text-[11px] font-bold text-slate-600">
                  {menu.carb_type && (
                    <span className="bg-slate-100 px-2 py-1 rounded">
                      🍚 {menu.carb_type} ({menu.carb_grams}g)
                    </span>
                  )}
                  {menu.animal_protein && (
                    <span className="bg-slate-100 px-2 py-1 rounded">
                      🍗 {menu.animal_protein} ({menu.animal_grams}g)
                    </span>
                  )}
                  {menu.vegetable && (
                    <span className="bg-slate-100 px-2 py-1 rounded">
                      🥬 {menu.vegetable}
                    </span>
                  )}
                  <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded">
                    🔥 {menu.calories} kkal
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex sm:flex-col gap-2 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-3">
                <button
                  onClick={() => handleEdit(menu)}
                  className="flex-1 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(menu.id)}
                  className="flex-1 p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 md:p-8 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between mb-6 border-b pb-4">
              <h3 className="font-bold text-xl">
                {editingMenu ? 'Edit Menu' : 'Tambah Menu'}
              </h3>
              <button
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingMenu(null);
                }}
              >
                <X />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="date"
                value={formData.menu_date}
                onChange={(e) =>
                  setFormData({ ...formData, menu_date: e.target.value })
                }
                className="w-full p-3 border rounded-xl"
              />

              <input
                value={formData.menu_name}
                onChange={(e) =>
                  setFormData({ ...formData, menu_name: e.target.value })
                }
                placeholder="Nama Menu"
                className="w-full p-3 border rounded-xl"
              />

              <button className="w-full bg-blue-600 text-white py-3 rounded-xl">
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
