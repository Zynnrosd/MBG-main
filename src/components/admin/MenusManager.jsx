// src/components/admin/MenusManager.jsx
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Calendar } from 'lucide-react';
import { supabase } from '../../config/supabase';

export default function MenusManager() {
  const [menus, setMenus] = useState([]);
  const [sppgUnits, setSppgUnits] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    sppg_id: '',
    category: 'sekolah',
    menu_date: new Date().toISOString().split('T')[0],
    menu_name: '',
    description: '',
    // Komponen makanan
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
    // Nutrisi total
    calories: '',
    protein: '',
    iron: '',
    folat: '',
    vit_c: ''
  });

  useEffect(() => {
    loadMenus();
    loadSppgUnits();
  }, []);

  const loadMenus = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('daily_menus')
      .select(`
        *,
        sppg_units (
          name,
          districts (
            name,
            cities (
              name,
              provinces (name)
            )
          )
        )
      `)
      .order('menu_date', { ascending: false });
    setMenus(data || []);
    setLoading(false);
  };

  const loadSppgUnits = async () => {
    const { data } = await supabase
      .from('sppg_units')
      .select('id, name, districts(name, cities(name, provinces(name)))')
      .order('name');
    setSppgUnits(data || []);
  };

  const resetForm = () => {
    setFormData({
      sppg_id: '', category: 'sekolah', menu_date: new Date().toISOString().split('T')[0],
      menu_name: '', description: '',
      carb_type: '', carb_grams: '', animal_protein: '', animal_grams: '',
      plant_protein: '', plant_grams: '', vegetable: '', vegetable_grams: '',
      fruit: '', fruit_grams: '', milk: '', milk_ml: '',
      calories: '', protein: '', iron: '', folat: '', vit_c: ''
    });
    setEditingMenu(null);
    setIsFormOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingMenu) {
        await supabase.from('daily_menus').update(formData).eq('id', editingMenu.id);
      } else {
        await supabase.from('daily_menus').insert([formData]);
      }
      loadMenus();
      resetForm();
    } catch (error) {
      console.error('Error saving menu:', error);
      alert('Gagal menyimpan menu');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (menu) => {
    setEditingMenu(menu);
    setFormData({
      sppg_id: menu.sppg_id,
      category: menu.category,
      menu_date: menu.menu_date,
      menu_name: menu.menu_name,
      description: menu.description || '',
      carb_type: menu.carb_type || '',
      carb_grams: menu.carb_grams || '',
      animal_protein: menu.animal_protein || '',
      animal_grams: menu.animal_grams || '',
      plant_protein: menu.plant_protein || '',
      plant_grams: menu.plant_grams || '',
      vegetable: menu.vegetable || '',
      vegetable_grams: menu.vegetable_grams || '',
      fruit: menu.fruit || '',
      fruit_grams: menu.fruit_grams || '',
      milk: menu.milk || '',
      milk_ml: menu.milk_ml || '',
      calories: menu.calories || '',
      protein: menu.protein || '',
      iron: menu.iron || '',
      folat: menu.folat || '',
      vit_c: menu.vit_c || ''
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus menu ini?')) return;
    await supabase.from('daily_menus').delete().eq('id', id);
    loadMenus();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Manajemen Menu Harian</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
        >
          <Plus size={20} />
          Tambah Menu
        </button>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">
                {editingMenu ? 'Edit Menu' : 'Tambah Menu Baru'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Satuan SPPG</label>
                  <select
                    value={formData.sppg_id}
                    onChange={(e) => setFormData({...formData, sppg_id: e.target.value})}
                    className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                    required
                  >
                    <option value="">Pilih SPPG</option>
                    {sppgUnits.map(unit => (
                      <option key={unit.id} value={unit.id}>{unit.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                    required
                  >
                    <option value="sekolah">Sekolah</option>
                    <option value="ibu_hamil">Ibu Hamil</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tanggal Menu</label>
                  <input
                    type="date"
                    value={formData.menu_date}
                    onChange={(e) => setFormData({...formData, menu_date: e.target.value})}
                    className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nama Menu</label>
                  <input
                    type="text"
                    value={formData.menu_name}
                    onChange={(e) => setFormData({...formData, menu_name: e.target.value})}
                    placeholder="Ayam Goreng Bumbu Kuning"
                    className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Deskripsi singkat menu..."
                  rows="2"
                  className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none resize-none"
                />
              </div>

              {/* Komponen Makanan dengan Gramasi */}
              <div className="border-t-2 border-slate-100 pt-6">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  🍽️ Komponen Makanan & Gramasi
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Karbohidrat */}
                  <div className="bg-amber-50 p-4 rounded-xl">
                    <p className="font-bold text-amber-800 mb-2 text-sm">🍚 Karbohidrat</p>
                    <input
                      type="text"
                      value={formData.carb_type}
                      onChange={(e) => setFormData({...formData, carb_type: e.target.value})}
                      placeholder="Nasi Putih"
                      className="w-full p-2 border-2 border-amber-200 rounded-lg mb-2 text-sm"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={formData.carb_grams}
                      onChange={(e) => setFormData({...formData, carb_grams: e.target.value})}
                      placeholder="150 (gram)"
                      className="w-full p-2 border-2 border-amber-200 rounded-lg text-sm"
                    />
                  </div>

                  {/* Protein Hewani */}
                  <div className="bg-red-50 p-4 rounded-xl">
                    <p className="font-bold text-red-800 mb-2 text-sm">🍗 Protein Hewani</p>
                    <input
                      type="text"
                      value={formData.animal_protein}
                      onChange={(e) => setFormData({...formData, animal_protein: e.target.value})}
                      placeholder="Ayam Goreng"
                      className="w-full p-2 border-2 border-red-200 rounded-lg mb-2 text-sm"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={formData.animal_grams}
                      onChange={(e) => setFormData({...formData, animal_grams: e.target.value})}
                      placeholder="75 (gram)"
                      className="w-full p-2 border-2 border-red-200 rounded-lg text-sm"
                    />
                  </div>

                  {/* Protein Nabati */}
                  <div className="bg-green-50 p-4 rounded-xl">
                    <p className="font-bold text-green-800 mb-2 text-sm">🌱 Protein Nabati</p>
                    <input
                      type="text"
                      value={formData.plant_protein}
                      onChange={(e) => setFormData({...formData, plant_protein: e.target.value})}
                      placeholder="Tempe Goreng"
                      className="w-full p-2 border-2 border-green-200 rounded-lg mb-2 text-sm"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={formData.plant_grams}
                      onChange={(e) => setFormData({...formData, plant_grams: e.target.value})}
                      placeholder="50 (gram)"
                      className="w-full p-2 border-2 border-green-200 rounded-lg text-sm"
                    />
                  </div>

                  {/* Sayur */}
                  <div className="bg-emerald-50 p-4 rounded-xl">
                    <p className="font-bold text-emerald-800 mb-2 text-sm">🥬 Sayur</p>
                    <input
                      type="text"
                      value={formData.vegetable}
                      onChange={(e) => setFormData({...formData, vegetable: e.target.value})}
                      placeholder="Sayur Asem"
                      className="w-full p-2 border-2 border-emerald-200 rounded-lg mb-2 text-sm"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={formData.vegetable_grams}
                      onChange={(e) => setFormData({...formData, vegetable_grams: e.target.value})}
                      placeholder="100 (gram)"
                      className="w-full p-2 border-2 border-emerald-200 rounded-lg text-sm"
                    />
                  </div>

                  {/* Buah */}
                  <div className="bg-orange-50 p-4 rounded-xl">
                    <p className="font-bold text-orange-800 mb-2 text-sm">🍌 Buah</p>
                    <input
                      type="text"
                      value={formData.fruit}
                      onChange={(e) => setFormData({...formData, fruit: e.target.value})}
                      placeholder="Pisang"
                      className="w-full p-2 border-2 border-orange-200 rounded-lg mb-2 text-sm"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={formData.fruit_grams}
                      onChange={(e) => setFormData({...formData, fruit_grams: e.target.value})}
                      placeholder="100 (gram)"
                      className="w-full p-2 border-2 border-orange-200 rounded-lg text-sm"
                    />
                  </div>

                  {/* Susu */}
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <p className="font-bold text-blue-800 mb-2 text-sm">🥛 Susu</p>
                    <input
                      type="text"
                      value={formData.milk}
                      onChange={(e) => setFormData({...formData, milk: e.target.value})}
                      placeholder="Susu UHT"
                      className="w-full p-2 border-2 border-blue-200 rounded-lg mb-2 text-sm"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={formData.milk_ml}
                      onChange={(e) => setFormData({...formData, milk_ml: e.target.value})}
                      placeholder="200 (ml)"
                      className="w-full p-2 border-2 border-blue-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Kandungan Gizi Total */}
              <div className="border-t-2 border-slate-100 pt-6">
                <h4 className="font-bold text-slate-800 mb-4">📊 Kandungan Gizi Total</h4>
                <div className="grid grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Kalori</label>
                    <input
                      type="number"
                      value={formData.calories}
                      onChange={(e) => setFormData({...formData, calories: e.target.value})}
                      placeholder="450"
                      className="w-full p-2 border-2 border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Protein (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.protein}
                      onChange={(e) => setFormData({...formData, protein: e.target.value})}
                      placeholder="28"
                      className="w-full p-2 border-2 border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Zat Besi (mg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.iron}
                      onChange={(e) => setFormData({...formData, iron: e.target.value})}
                      placeholder="3.5"
                      className="w-full p-2 border-2 border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Folat (mcg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.folat}
                      onChange={(e) => setFormData({...formData, folat: e.target.value})}
                      placeholder="65"
                      className="w-full p-2 border-2 border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Vit C (mg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.vit_c}
                      onChange={(e) => setFormData({...formData, vit_c: e.target.value})}
                      placeholder="18"
                      className="w-full p-2 border-2 border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  <Save size={20} />
                  {loading ? 'Menyimpan...' : 'Simpan Menu'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-all"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menu List */}
      <div className="grid gap-4">
        {loading && menus.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-500">Memuat data...</p>
          </div>
        ) : menus.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Belum ada menu</p>
          </div>
        ) : (
          menus.map(menu => (
            <div key={menu.id} className="bg-white border-2 border-slate-100 rounded-2xl p-6 hover:shadow-lg transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{menu.menu_name}</h3>
                  <p className="text-sm text-slate-500">
                    {menu.sppg_units?.name} • {menu.category === 'sekolah' ? '🏫 Sekolah' : '🤰 Ibu Hamil'} • {new Date(menu.menu_date).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(menu)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(menu.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 text-sm">
                {menu.carb_type && <div className="bg-amber-50 p-2 rounded-lg"><span className="font-bold">🍚</span> {menu.carb_type} ({menu.carb_grams}g)</div>}
                {menu.animal_protein && <div className="bg-red-50 p-2 rounded-lg"><span className="font-bold">🍗</span> {menu.animal_protein} ({menu.animal_grams}g)</div>}
                {menu.plant_protein && <div className="bg-green-50 p-2 rounded-lg"><span className="font-bold">🌱</span> {menu.plant_protein} ({menu.plant_grams}g)</div>}
                {menu.vegetable && <div className="bg-emerald-50 p-2 rounded-lg"><span className="font-bold">🥬</span> {menu.vegetable} ({menu.vegetable_grams}g)</div>}
                {menu.fruit && <div className="bg-orange-50 p-2 rounded-lg"><span className="font-bold">🍌</span> {menu.fruit} ({menu.fruit_grams}g)</div>}
                {menu.milk && <div className="bg-blue-50 p-2 rounded-lg"><span className="font-bold">🥛</span> {menu.milk} ({menu.milk_ml}ml)</div>}
              </div>

              <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100 text-sm">
                <span className="text-slate-600"><strong>{menu.calories}</strong> kcal</span>
                <span className="text-slate-600"><strong>{menu.protein}g</strong> protein</span>
                <span className="text-slate-600"><strong>{menu.iron}mg</strong> Fe</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}