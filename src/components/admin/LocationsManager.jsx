// src/components/admin/LocationsManager.jsx
import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, Calendar, Save, X, ChevronDown } from 'lucide-react';
import { supabase } from '../../config/supabase';
import ConfirmModal from '../modals/ConfirmModal';

export default function LocationsManager() {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [weeklyMenus, setWeeklyMenus] = useState([]);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [editingMenu, setEditingMenu] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, type: '', item: null });
  const [loading, setLoading] = useState(false);

  const [locationForm, setLocationForm] = useState({ name: '', address: '', phone: '' });
  const [menuForm, setMenuForm] = useState({
    day_number: 1,
    day_name: 'Senin',
    menu_name: '',
    calories: '',
    protein: '',
    notes: ''
  });

  const days = [
    { number: 1, name: 'Senin' },
    { number: 2, name: 'Selasa' },
    { number: 3, name: 'Rabu' },
    { number: 4, name: 'Kamis' },
    { number: 5, name: 'Jumat' }
  ];

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      loadWeeklyMenus(selectedLocation);
    }
  }, [selectedLocation]);

  const loadLocations = async () => {
    const { data } = await supabase.from('locations').select('*').order('name');
    setLocations(data || []);
    if (data && data.length > 0 && !selectedLocation) {
      setSelectedLocation(data[0].id);
    }
  };

  const loadWeeklyMenus = async (locationId) => {
    const { data } = await supabase
      .from('weekly_menus')
      .select('*')
      .eq('location_id', locationId)
      .order('day_number');
    setWeeklyMenus(data || []);
  };

  const handleSaveLocation = async () => {
    setLoading(true);
    try {
      if (editingLocation) {
        await supabase
          .from('locations')
          .update(locationForm)
          .eq('id', editingLocation.id);
      } else {
        await supabase.from('locations').insert([locationForm]);
      }
      loadLocations();
      resetLocationForm();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLocation = async () => {
    setLoading(true);
    try {
      await supabase.from('locations').delete().eq('id', deleteModal.item.id);
      loadLocations();
      setDeleteModal({ show: false, type: '', item: null });
      if (selectedLocation === deleteModal.item.id) {
        setSelectedLocation(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMenu = async () => {
    setLoading(true);
    try {
      const menuData = { ...menuForm, location_id: selectedLocation };
      if (editingMenu) {
        await supabase.from('weekly_menus').update(menuData).eq('id', editingMenu.id);
      } else {
        await supabase.from('weekly_menus').insert([menuData]);
      }
      loadWeeklyMenus(selectedLocation);
      resetMenuForm();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMenu = async () => {
    setLoading(true);
    try {
      await supabase.from('weekly_menus').delete().eq('id', deleteModal.item.id);
      loadWeeklyMenus(selectedLocation);
      setDeleteModal({ show: false, type: '', item: null });
    } finally {
      setLoading(false);
    }
  };

  const resetLocationForm = () => {
    setLocationForm({ name: '', address: '', phone: '' });
    setEditingLocation(null);
    setShowLocationForm(false);
  };

  const resetMenuForm = () => {
    setMenuForm({ day_number: 1, day_name: 'Senin', menu_name: '', calories: '', protein: '', notes: '' });
    setEditingMenu(null);
    setShowMenuForm(false);
  };

  const startEditLocation = (loc) => {
    setLocationForm({ name: loc.name, address: loc.address || '', phone: loc.phone || '' });
    setEditingLocation(loc);
    setShowLocationForm(true);
  };

  const startEditMenu = (menu) => {
    setMenuForm({
      day_number: menu.day_number,
      day_name: menu.day_name,
      menu_name: menu.menu_name,
      calories: menu.calories,
      protein: menu.protein,
      notes: menu.notes || ''
    });
    setEditingMenu(menu);
    setShowMenuForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Lokasi & Menu MBG</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola lokasi dapur dan menu mingguan</p>
        </div>
        <button
          onClick={() => setShowLocationForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus size={18} />
          Tambah Lokasi
        </button>
      </div>

      {/* Location Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map(loc => (
          <div
            key={loc.id}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              selectedLocation === loc.id
                ? 'border-blue-600 bg-blue-50 shadow-lg'
                : 'border-slate-200 hover:border-blue-300'
            }`}
            onClick={() => setSelectedLocation(loc.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{loc.name}</h3>
                  {loc.address && <p className="text-xs text-slate-500">{loc.address}</p>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); startEditLocation(loc); }}
                className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-xs font-medium flex items-center justify-center gap-1"
              >
                <Edit2 size={14} /> Edit
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteModal({ show: true, type: 'location', item: loc }); }}
                className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-medium flex items-center justify-center gap-1"
              >
                <Trash2 size={14} /> Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Menu Section */}
      {selectedLocation && (
        <div className="border-t-2 border-slate-200 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="text-blue-600" size={24} />
              <div>
                <h3 className="text-xl font-bold text-slate-900">Menu Mingguan</h3>
                <p className="text-sm text-slate-500">
                  {locations.find(l => l.id === selectedLocation)?.name}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowMenuForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
            >
              <Plus size={18} />
              Tambah Menu
            </button>
          </div>

          {weeklyMenus.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl">
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Belum ada menu untuk lokasi ini</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {weeklyMenus.map(menu => (
                <div key={menu.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-600 text-white px-3 py-2 rounded-xl font-bold text-sm min-w-[80px] text-center">
                      {menu.day_name}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{menu.menu_name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-500">{menu.calories} kcal</span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-500">{menu.protein}g Protein</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditMenu(menu)}
                      className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteModal({ show: true, type: 'menu', item: menu })}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Location Form Modal */}
      {showLocationForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">
                {editingLocation ? 'Edit Lokasi' : 'Tambah Lokasi'}
              </h3>
              <button onClick={resetLocationForm} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">Nama Lokasi</label>
                <input
                  type="text"
                  value={locationForm.name}
                  onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                  className="w-full p-3 bg-slate-50 border-transparent rounded-xl text-sm font-medium mt-2 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                  placeholder="Contoh: Dapur MBG Jakarta Pusat"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">Alamat</label>
                <textarea
                  value={locationForm.address}
                  onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                  className="w-full p-3 bg-slate-50 border-transparent rounded-xl text-sm font-medium mt-2 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                  rows="3"
                  placeholder="Alamat lengkap lokasi"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">Telepon</label>
                <input
                  type="text"
                  value={locationForm.phone}
                  onChange={(e) => setLocationForm({ ...locationForm, phone: e.target.value })}
                  className="w-full p-3 bg-slate-50 border-transparent rounded-xl text-sm font-medium mt-2 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                  placeholder="Nomor telepon"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={resetLocationForm}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleSaveLocation}
                disabled={loading || !locationForm.name}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Form Modal */}
      {showMenuForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">
                {editingMenu ? 'Edit Menu' : 'Tambah Menu'}
              </h3>
              <button onClick={resetMenuForm} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">Hari</label>
                <select
                  value={menuForm.day_number}
                  onChange={(e) => {
                    const day = days.find(d => d.number === parseInt(e.target.value));
                    setMenuForm({ ...menuForm, day_number: day.number, day_name: day.name });
                  }}
                  className="w-full p-3 bg-slate-50 border-transparent rounded-xl text-sm font-medium mt-2 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                >
                  {days.map(day => (
                    <option key={day.number} value={day.number}>{day.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">Nama Menu</label>
                <input
                  type="text"
                  value={menuForm.menu_name}
                  onChange={(e) => setMenuForm({ ...menuForm, menu_name: e.target.value })}
                  className="w-full p-3 bg-slate-50 border-transparent rounded-xl text-sm font-medium mt-2 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                  placeholder="Contoh: Ayam Goreng Lengkuas"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">Kalori</label>
                  <input
                    type="number"
                    value={menuForm.calories}
                    onChange={(e) => setMenuForm({ ...menuForm, calories: e.target.value })}
                    className="w-full p-3 bg-slate-50 border-transparent rounded-xl text-sm font-medium mt-2 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                    placeholder="kcal"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">Protein</label>
                  <input
                    type="number"
                    value={menuForm.protein}
                    onChange={(e) => setMenuForm({ ...menuForm, protein: e.target.value })}
                    className="w-full p-3 bg-slate-50 border-transparent rounded-xl text-sm font-medium mt-2 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                    placeholder="gram"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">Catatan (Opsional)</label>
                <textarea
                  value={menuForm.notes}
                  onChange={(e) => setMenuForm({ ...menuForm, notes: e.target.value })}
                  className="w-full p-3 bg-slate-50 border-transparent rounded-xl text-sm font-medium mt-2 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                  rows="2"
                  placeholder="Catatan tambahan..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={resetMenuForm}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleSaveMenu}
                disabled={loading || !menuForm.menu_name || !menuForm.calories || !menuForm.protein}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, type: '', item: null })}
        onConfirm={deleteModal.type === 'location' ? handleDeleteLocation : handleDeleteMenu}
        title={`Hapus ${deleteModal.type === 'location' ? 'Lokasi' : 'Menu'}?`}
        message={`Apakah Anda yakin ingin menghapus ${deleteModal.type === 'location' ? 'lokasi' : 'menu'} ini?${deleteModal.type === 'location' ? ' Semua menu di lokasi ini akan ikut terhapus.' : ''}`}
        confirmText="Ya, Hapus"
        variant="danger"
        isLoading={loading}
      />
    </div>
  );
}
