import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, ChefHat, Calendar, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '../../config/supabase';

export default function MenusManager() {
  // Data Utama
  const [menus, setMenus] = useState([]);
  const [kitchens, setKitchens] = useState([]);
  
  // Filter State (Kunci agar menu berbeda tiap dapur)
  const [selectedKitchen, setSelectedKitchen] = useState('');
  const [selectedRole, setSelectedRole] = useState('anak');

  // UI State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const initialForm = {
    menu_date: new Date().toISOString().split('T')[0],
    menu_name: '', description: '',
    carb_type: '', carb_grams: '',
    animal_protein: '', animal_grams: '',
    plant_protein: '', plant_grams: '',
    vegetable: '', vegetable_grams: '',
    fruit: '', fruit_grams: '',
    milk: '', milk_ml: '',
    calories: '', protein: ''
  };
  const [formData, setFormData] = useState(initialForm);

  // 1. Load Daftar Dapur saat pertama buka
  useEffect(() => {
    loadKitchens();
  }, []);

  // 2. Load Menu SETIAP KALI Dapur / Role berubah
  useEffect(() => {
    if (selectedKitchen) {
        loadMenus();
    } else {
        setMenus([]); // Kosongkan jika belum pilih dapur
    }
  }, [selectedKitchen, selectedRole]);

  const loadKitchens = async () => {
    const { data } = await supabase
        .from('kitchen_locations')
        .select('id, name, district_name, city_name')
        .order('name');
    
    setKitchens(data || []);
    // Otomatis pilih dapur pertama jika ada
    if(data?.length > 0) setSelectedKitchen(data[0].id);
  };

  const loadMenus = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('daily_menus')
      .select('*')
      .eq('kitchen_id', selectedKitchen) // FILTER UTAMA: Hanya menu dapur ini
      .eq('role_category', selectedRole) // Filter Role
      .order('menu_date', { ascending: false });
    
    setMenus(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!selectedKitchen) return alert("Pilih lokasi dapur dulu!");

    setLoading(true);
    
    // Data yang akan dikirim
    const payload = {
        ...formData,
        kitchen_id: selectedKitchen, // Kunci: Terikat ke dapur yang dipilih
        role_category: selectedRole
    };

    try {
      if (editingMenu) {
        await supabase.from('daily_menus').update(payload).eq('id', editingMenu.id);
      } else {
        await supabase.from('daily_menus').insert([payload]);
      }
      
      // Refresh & Reset
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
      if(confirm('Hapus menu ini?')) {
          await supabase.from('daily_menus').delete().eq('id', id);
          loadMenus();
      }
  };

  const handleEdit = (menu) => {
      setEditingMenu(menu);
      setFormData({ ...menu });
      setIsFormOpen(true);
  };

  // Helper untuk mendapatkan nama dapur yang sedang dipilih
  const currentKitchenName = kitchens.find(k => k.id === selectedKitchen)?.name || '...';

  return (
    <div className="space-y-6">
      {/* HEADER & FILTER SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-20 z-10">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
             <div>
                <h2 className="text-2xl font-bold text-slate-900">Manajemen Menu</h2>
                <p className="text-sm text-slate-500">Kelola menu per lokasi dapur & target</p>
             </div>
             
             {/* Tombol Tambah Menu (Hanya aktif jika dapur dipilih) */}
             <button 
                onClick={()=>{
                    if(!selectedKitchen) return alert("Silakan pilih dapur terlebih dahulu");
                    setFormData(initialForm); 
                    setEditingMenu(null); 
                    setIsFormOpen(true);
                }} 
                disabled={!selectedKitchen}
                className="bg-blue-600 text-white px-5 py-3 rounded-xl flex gap-2 font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                <Plus size={20}/> Tambah Menu
             </button>
         </div>

         {/* FILTER CONTROLS */}
         <div className="grid md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
             {/* Dropdown Dapur */}
             <div>
                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                    <MapPin size={12}/> Pilih Lokasi Dapur
                 </label>
                 <select 
                    value={selectedKitchen} 
                    onChange={e=>setSelectedKitchen(e.target.value)} 
                    className="w-full p-3 rounded-xl border-slate-200 border font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 outline-none">
                     {kitchens.length === 0 && <option value="">Belum ada data dapur</option>}
                     {kitchens.map(k => (
                         <option key={k.id} value={k.id}>
                             {k.name} ({k.district_name}, {k.city_name})
                         </option>
                     ))}
                 </select>
             </div>
             
             {/* Dropdown Target */}
             <div>
                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Target Penerima</label>
                 <select 
                    value={selectedRole} 
                    onChange={e=>setSelectedRole(e.target.value)} 
                    className="w-full p-3 rounded-xl border-slate-200 border font-medium outline-none">
                     <option value="anak">Anak Sekolah (SD/SMP)</option>
                     <option value="ibu_hamil">Ibu Hamil</option>
                     <option value="ibu_menyusui">Ibu Menyusui</option>
                 </select>
             </div>
         </div>
      </div>

      {/* LIST MENU */}
      <div className="space-y-4 min-h-[300px]">
          {loading ? (
              <div className="text-center py-20">
                  <Loader2 className="animate-spin mx-auto text-blue-500 mb-2" size={32}/>
                  <p className="text-slate-500">Memuat menu...</p>
              </div>
          ) : !selectedKitchen ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                  <MapPin className="mx-auto text-slate-300 mb-2" size={48}/>
                  <p className="text-slate-500">Silakan pilih lokasi dapur terlebih dahulu.</p>
              </div>
          ) : menus.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                  <ChefHat className="mx-auto text-slate-300 mb-2" size={48}/>
                  <p className="text-slate-500 font-medium">Belum ada menu terjadwal.</p>
                  <p className="text-xs text-slate-400 mt-1">
                      Lokasi: {currentKitchenName}<br/>
                      Target: {selectedRole}
                  </p>
              </div>
          ) : (
              menus.map(menu => (
                  <div key={menu.id} className="bg-white border border-slate-200 p-5 rounded-2xl hover:shadow-md transition flex flex-col sm:flex-row gap-4">
                      {/* Tanggal Badge */}
                      <div className="bg-blue-50 text-blue-700 p-4 rounded-xl flex flex-col items-center justify-center min-w-[90px] text-center">
                          <Calendar size={20} className="mb-1"/>
                          <span className="text-2xl font-bold leading-none">{new Date(menu.menu_date).getDate()}</span>
                          <span className="text-xs font-bold uppercase">{new Date(menu.menu_date).toLocaleDateString('id-ID', {month: 'short'})}</span>
                      </div>
                      
                      {/* Detail Menu */}
                      <div className="flex-1 py-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg text-slate-900">{menu.menu_name}</h3>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${selectedRole === 'anak' ? 'bg-indigo-100 text-indigo-700' : 'bg-pink-100 text-pink-700'}`}>
                                {selectedRole.replace('_', ' ')}
                            </span>
                          </div>
                          
                          <p className="text-sm text-slate-500 line-clamp-1 mb-3">{menu.description || 'Tidak ada deskripsi khusus.'}</p>
                          
                          {/* Tags Komponen */}
                          <div className="flex flex-wrap gap-2 text-[11px] font-bold text-slate-600">
                              {menu.carb_type && <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded">🍚 {menu.carb_type} ({menu.carb_grams}g)</span>}
                              {menu.animal_protein && <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded">🍗 {menu.animal_protein} ({menu.animal_grams}g)</span>}
                              {menu.vegetable && <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded">🥬 {menu.vegetable}</span>}
                              <span className="bg-orange-50 border border-orange-100 text-orange-700 px-2 py-1 rounded">🔥 {menu.calories} kkal</span>
                          </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex sm:flex-col gap-2 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-3">
                          <button onClick={()=>handleEdit(menu)} className="flex-1 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center justify-center gap-1">
                              <Edit2 size={16}/> <span className="sm:hidden text-xs font-bold">Edit</span>
                          </button>
                          <button onClick={()=>handleDelete(menu.id)} className="flex-1 p-2 text-red-500 hover:bg-red-50 rounded-lg transition flex items-center justify-center gap-1">
                              <Trash2 size={16}/> <span className="sm:hidden text-xs font-bold">Hapus</span>
                          </button>
                      </div>
                  </div>
              ))
          )}
      </div>

      {/* FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 md:p-8 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between mb-6 border-b border-slate-100 pb-4">
                    <div>
                        <h3 className="font-bold text-xl text-slate-900">{editingMenu ? 'Edit Menu' : 'Tambah Menu Baru'}</h3>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <MapPin size={12}/> {currentKitchenName} 
                            <span className="mx-1">•</span> 
                            <span className="uppercase font-bold text-blue-600">{selectedRole.replace('_',' ')}</span>
                        </p>
                    </div>
                    <button onClick={()=>{setIsFormOpen(false); setEditingMenu(null);}} className="p-2 hover:bg-slate-100 rounded-full h-fit text-slate-400 hover:text-slate-600 transition"><X/></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Info Dasar */}
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="col-span-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal Menu</label>
                            <input type="date" required value={formData.menu_date} onChange={e=>setFormData({...formData, menu_date: e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50 mt-1 font-medium focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"/>
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Menu Utama</label>
                            <input required value={formData.menu_name} onChange={e=>setFormData({...formData, menu_name: e.target.value})} placeholder="Contoh: Nasi Ayam Teriyaki + Capcay" className="w-full p-3 border rounded-xl bg-slate-50 mt-1 font-medium focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"/>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deskripsi Singkat</label>
                        <textarea value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} placeholder="Deskripsi menu untuk menarik selera..." className="w-full p-3 border rounded-xl bg-slate-50 mt-1 text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none" rows="2"/>
                    </div>

                    {/* Komponen (Grid Rapat) */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2 mb-4"><ChefHat size={16} className="text-blue-500"/> Komponen & Gramasi (Porsi)</h4>
                        
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            {/* Karbo */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Karbohidrat</label>
                                <div className="flex gap-2">
                                    <input placeholder="Jenis (Nasi)" className="flex-1 p-2 text-sm border rounded-lg" value={formData.carb_type} onChange={e=>setFormData({...formData, carb_type: e.target.value})}/>
                                    <input type="number" placeholder="gr" className="w-16 p-2 text-sm border rounded-lg text-center" value={formData.carb_grams} onChange={e=>setFormData({...formData, carb_grams: e.target.value})}/>
                                </div>
                            </div>
                            {/* Hewani */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Protein Hewani</label>
                                <div className="flex gap-2">
                                    <input placeholder="Jenis (Ayam)" className="flex-1 p-2 text-sm border rounded-lg" value={formData.animal_protein} onChange={e=>setFormData({...formData, animal_protein: e.target.value})}/>
                                    <input type="number" placeholder="gr" className="w-16 p-2 text-sm border rounded-lg text-center" value={formData.animal_grams} onChange={e=>setFormData({...formData, animal_grams: e.target.value})}/>
                                </div>
                            </div>
                            {/* Nabati */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Protein Nabati</label>
                                <div className="flex gap-2">
                                    <input placeholder="Jenis (Tempe)" className="flex-1 p-2 text-sm border rounded-lg" value={formData.plant_protein} onChange={e=>setFormData({...formData, plant_protein: e.target.value})}/>
                                    <input type="number" placeholder="gr" className="w-16 p-2 text-sm border rounded-lg text-center" value={formData.plant_grams} onChange={e=>setFormData({...formData, plant_grams: e.target.value})}/>
                                </div>
                            </div>
                            {/* Sayur */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Sayuran</label>
                                <div className="flex gap-2">
                                    <input placeholder="Jenis (Sop)" className="flex-1 p-2 text-sm border rounded-lg" value={formData.vegetable} onChange={e=>setFormData({...formData, vegetable: e.target.value})}/>
                                    <input type="number" placeholder="gr" className="w-16 p-2 text-sm border rounded-lg text-center" value={formData.vegetable_grams} onChange={e=>setFormData({...formData, vegetable_grams: e.target.value})}/>
                                </div>
                            </div>
                            {/* Buah */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Buah</label>
                                <div className="flex gap-2">
                                    <input placeholder="Jenis (Pisang)" className="flex-1 p-2 text-sm border rounded-lg" value={formData.fruit} onChange={e=>setFormData({...formData, fruit: e.target.value})}/>
                                    <input type="number" placeholder="gr" className="w-16 p-2 text-sm border rounded-lg text-center" value={formData.fruit_grams} onChange={e=>setFormData({...formData, fruit_grams: e.target.value})}/>
                                </div>
                            </div>
                            {/* Susu */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Susu</label>
                                <div className="flex gap-2">
                                    <input placeholder="Jenis (UHT)" className="flex-1 p-2 text-sm border rounded-lg" value={formData.milk} onChange={e=>setFormData({...formData, milk: e.target.value})}/>
                                    <input type="number" placeholder="ml" className="w-16 p-2 text-sm border rounded-lg text-center" value={formData.milk_ml} onChange={e=>setFormData({...formData, milk_ml: e.target.value})}/>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Kalori (kkal)</label>
                            <input type="number" value={formData.calories} onChange={e=>setFormData({...formData, calories: e.target.value})} className="w-full p-3 border rounded-xl mt-1 font-bold text-orange-600"/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Protein (g)</label>
                            <input type="number" value={formData.protein} onChange={e=>setFormData({...formData, protein: e.target.value})} className="w-full p-3 border rounded-xl mt-1 font-bold text-blue-600"/>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={()=>{setIsFormOpen(false); setEditingMenu(null);}} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition">
                            Batal
                        </button>
                        <button disabled={loading} className="flex-[2] bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-70">
                            {loading ? 'Menyimpan...' : 'Simpan Menu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}