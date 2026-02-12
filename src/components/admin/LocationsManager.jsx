import { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, X, Building2, Loader2 } from 'lucide-react';
import { supabase } from '../../config/supabase';

export default function LocationsManager() {
  const [locations, setLocations] = useState([]);
  
  // State Data Wilayah
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selection State
  const [selectedProv, setSelectedProv] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  
  const [form, setForm] = useState({ name: '', address: '' });

  useEffect(() => {
    fetchLocations();
    fetchProvinces();
  }, []);

  // --- 1. FETCH API WILAYAH (SUMBER GITHUB - LEBIH STABIL) ---
  const fetchProvinces = async () => {
    try {
      const res = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
      const data = await res.json();
      setProvinces(data); // API ini mengembalikan array langsung, bukan { data: [] }
    } catch (err) {
      console.error("Gagal ambil provinsi", err);
    }
  };

  const fetchCities = async (provId) => {
    setIsLoadingApi(true);
    try {
      const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provId}.json`);
      const data = await res.json();
      setCities(data);
    } catch (err) {
      console.error("Gagal ambil kota", err);
    } finally {
      setIsLoadingApi(false);
    }
  };

  const fetchDistricts = async (cityId) => {
    setIsLoadingApi(true);
    try {
      const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${cityId}.json`);
      const data = await res.json();
      setDistricts(data);
    } catch (err) {
      console.error("Gagal ambil kecamatan", err);
    } finally {
      setIsLoadingApi(false);
    }
  };

  // --- 2. SUPABASE HANDLERS ---
  const fetchLocations = async () => {
    const { data } = await supabase.from('kitchen_locations').select('*').order('created_at', { ascending: false });
    setLocations(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDistrict || !form.name) return alert("Mohon lengkapi data");

    setIsSubmitting(true);
    
    // Simpan snapshot nama wilayah agar tidak perlu fetch ulang nanti
    const payload = {
        name: form.name,
        address: form.address,
        province_code: selectedProv.id, // API Emsifa pakai 'id', bukan 'code'
        province_name: selectedProv.name,
        city_code: selectedCity.id,
        city_name: selectedCity.name,
        district_code: selectedDistrict.id,
        district_name: selectedDistrict.name
    };

    const { error } = await supabase.from('kitchen_locations').insert([payload]);
    setIsSubmitting(false);

    if (error) {
        alert('Gagal menyimpan: ' + error.message);
    } else {
        fetchLocations();
        handleCloseForm();
    }
  };

  const handleDelete = async (id) => {
    if(confirm('Hapus dapur ini? Menu terkait juga akan terhapus.')) {
        await supabase.from('kitchen_locations').delete().eq('id', id);
        fetchLocations();
    }
  };

  // --- 3. HANDLERS DROPDOWN ---
  const handleProvChange = (e) => {
      const id = e.target.value;
      const name = e.target.options[e.target.selectedIndex].text;
      
      setSelectedProv({ id, name });
      setSelectedCity(null);
      setSelectedDistrict(null);
      setCities([]);
      setDistricts([]);
      
      if(id) fetchCities(id);
  };

  const handleCityChange = (e) => {
      const id = e.target.value;
      const name = e.target.options[e.target.selectedIndex].text;

      setSelectedCity({ id, name });
      setSelectedDistrict(null);
      setDistricts([]);

      if(id) fetchDistricts(id);
  };

  const handleDistrictChange = (e) => {
      const id = e.target.value;
      const name = e.target.options[e.target.selectedIndex].text;
      setSelectedDistrict({ id, name });
  };

  const handleCloseForm = () => {
      setIsFormOpen(false);
      setForm({ name: '', address: '' });
      setSelectedProv(null);
      setSelectedCity(null);
      setSelectedDistrict(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
         <div>
            <h2 className="text-2xl font-bold text-slate-900">Lokasi Dapur</h2>
            <p className="text-sm text-slate-500">Kelola titik dapur pusat MBG per kecamatan</p>
         </div>
         <button onClick={()=>setIsFormOpen(true)} className="bg-blue-600 text-white px-5 py-3 rounded-xl flex gap-2 font-bold hover:bg-blue-700 transition">
            <Plus size={20}/> Tambah Dapur
         </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
         {locations.map(loc => (
             <div key={loc.id} className="bg-white border border-slate-200 p-6 rounded-2xl hover:shadow-md transition group relative">
                 <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                            <Building2 size={24}/>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-lg">{loc.name}</h3>
                            <p className="text-sm text-slate-500 mt-1 flex items-start gap-1">
                                <MapPin size={14} className="mt-0.5 shrink-0"/> {loc.address}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                    {loc.province_name}
                                </span>
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                    {loc.city_name}
                                </span>
                                <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    Kec. {loc.district_name}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={()=>handleDelete(loc.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                        <Trash2 size={20}/>
                    </button>
                 </div>
             </div>
         ))}
      </div>

      {isFormOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-xl text-slate-900">Tambah Dapur Baru</h3>
                      <button onClick={handleCloseForm} className="p-2 hover:bg-slate-100 rounded-full"><X/></button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Cascading Dropdown */}
                      <div className="space-y-3 bg-slate-50 p-4 rounded-2xl">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Wilayah Administratif</p>
                          
                          {/* Provinsi */}
                          <div>
                              <select onChange={handleProvChange} className="w-full p-3 border rounded-xl bg-white text-sm" defaultValue="">
                                  <option value="" disabled>Pilih Provinsi</option>
                                  {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                          </div>

                          {/* Kota */}
                          <div>
                              <select onChange={handleCityChange} disabled={!selectedProv || isLoadingApi} className="w-full p-3 border rounded-xl bg-white text-sm disabled:opacity-50" defaultValue="">
                                  <option value="" disabled>Pilih Kab/Kota</option>
                                  {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                          </div>

                          {/* Kecamatan */}
                          <div>
                              <select onChange={handleDistrictChange} disabled={!selectedCity || isLoadingApi} className="w-full p-3 border rounded-xl bg-white text-sm disabled:opacity-50" defaultValue="">
                                  <option value="" disabled>Pilih Kecamatan</option>
                                  {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                              </select>
                          </div>
                          
                          {isLoadingApi && <p className="text-xs text-blue-500 flex items-center gap-1"><Loader2 className="animate-spin" size={12}/> Memuat data...</p>}
                      </div>

                      {/* Manual Input */}
                      <div className="space-y-3">
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">Nama Dapur / Sekolah</label>
                              <input required value={form.name} onChange={e=>setForm({...form, name: e.target.value})} placeholder="Contoh: Dapur Umum Undip" className="w-full p-3 border rounded-xl mt-1"/>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">Alamat Lengkap</label>
                              <textarea required value={form.address} onChange={e=>setForm({...form, address: e.target.value})} placeholder="Jalan, RT/RW..." className="w-full p-3 border rounded-xl mt-1" rows="2"/>
                          </div>
                      </div>

                      <button disabled={isSubmitting || !selectedDistrict} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 mt-4 disabled:opacity-50">
                          {isSubmitting ? 'Menyimpan...' : 'Simpan Lokasi'}
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}