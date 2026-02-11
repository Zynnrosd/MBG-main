// src/pages/SchedulePage.jsx - FINAL VERSION
import { useState, useEffect } from 'react';
import { Calendar, MapPin, MessageSquare, Send, Star, User, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../config/supabase';

export default function SchedulePage() {
  const [category, setCategory] = useState('anak');
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [sppgUnits, setSppgUnits] = useState([]);
  
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSppg, setSelectedSppg] = useState('');
  
  const [menu, setMenu] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackList, setFeedbackList] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProvinces();
  }, []);

  useEffect(() => {
    if (selectedProvince) loadCities(selectedProvince);
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedCity) loadDistricts(selectedCity);
  }, [selectedCity]);

  useEffect(() => {
    if (selectedDistrict) loadSppgUnits(selectedDistrict);
  }, [selectedDistrict]);

  useEffect(() => {
    if (selectedSppg) {
      loadMenu(selectedSppg, category);
      loadFeedback(selectedSppg);
    }
  }, [selectedSppg, category]);

  const loadProvinces = async () => {
    const { data } = await supabase.from('provinces').select('*').order('name');
    setProvinces(data || []);
  };

  const loadCities = async (provinceId) => {
    const { data } = await supabase.from('cities').select('*').eq('province_id', provinceId).order('name');
    setCities(data || []);
    setSelectedCity('');
    setSelectedDistrict('');
    setSelectedSppg('');
  };

  const loadDistricts = async (cityId) => {
    const { data } = await supabase.from('districts').select('*').eq('city_id', cityId).order('name');
    setDistricts(data || []);
    setSelectedDistrict('');
    setSelectedSppg('');
  };

  const loadSppgUnits = async (districtId) => {
    const { data } = await supabase.from('sppg_units').select('*').eq('district_id', districtId).order('name');
    setSppgUnits(data || []);
    setSelectedSppg('');
  };

  const loadMenu = async (sppgId, menuCategory) => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('daily_menus')
        .select('*')
        .eq('sppg_id', sppgId)
        .eq('category', menuCategory)
        .single();
      setMenu(data || null);
    } catch (error) {
      console.error('Error loading menu:', error);
      setMenu(null);
    } finally {
      setLoading(false);
    }
  };

  const loadFeedback = async (sppgId) => {
    const { data } = await supabase
      .from('menu_feedback')
      .select('*')
      .eq('sppg_id', sppgId)
      .order('created_at', { ascending: false })
      .limit(10);
    setFeedbackList(data || []);
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedback.trim() || !selectedSppg || !feedbackName.trim()) return;

    const { error } = await supabase.from('menu_feedback').insert([{
      sppg_id: selectedSppg,
      category: category,
      feedback_text: feedback,
      parent_name: feedbackName,
      rating: feedbackRating
    }]);

    if (!error) {
      setFeedback('');
      setFeedbackName('');
      setFeedbackRating(0);
      loadFeedback(selectedSppg);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 pb-32 min-h-screen bg-white">
      <header className="space-y-4">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Jadwal MBG Harian</h1>
        <p className="text-slate-500 font-medium">Lihat menu harian dan berikan feedback</p>

        {/* Category Selection - 3 KOLOM */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setCategory('anak')}
            className={`p-4 rounded-2xl border-2 transition-all ${
              category === 'anak'
                ? 'bg-blue-600 border-blue-600 text-white shadow-xl'
                : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            <p className="font-bold">👶 Anak</p>
          </button>
          <button
            onClick={() => setCategory('ibu_hamil')}
            className={`p-4 rounded-2xl border-2 transition-all ${
              category === 'ibu_hamil'
                ? 'bg-pink-600 border-pink-600 text-white shadow-xl'
                : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            <p className="font-bold">🤰 Ibu Hamil</p>
          </button>
          <button
            onClick={() => setCategory('ibu_menyusui')}
            className={`p-4 rounded-2xl border-2 transition-all ${
              category === 'ibu_menyusui'
                ? 'bg-purple-600 border-purple-600 text-white shadow-xl'
                : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            <p className="font-bold">🤱 Ibu Menyusui</p>
          </button>
        </div>
      </header>

      {/* Location Filters - 3 DROPDOWN HORIZONTAL */}
      <div className="space-y-4 bg-slate-50 rounded-3xl p-6 border border-slate-100">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <MapPin className="text-blue-600" size={20} />
          Pilih Lokasi SPPG
        </h3>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase ml-2 tracking-widest block mb-2">Provinsi</label>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
            >
              <option value="">Pilih</option>
              {provinces.map(prov => (
                <option key={prov.id} value={prov.id}>{prov.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase ml-2 tracking-widest block mb-2">Kab/Kota</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              disabled={!selectedProvince}
              className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              <option value="">Pilih</option>
              {cities.map(city => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase ml-2 tracking-widest block mb-2">Kecamatan</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedCity}
              className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              <option value="">Pilih</option>
              {districts.map(dist => (
                <option key={dist.id} value={dist.id}>{dist.name}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedDistrict && (
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase ml-2 tracking-widest block mb-2">Satuan SPPG</label>
            <select
              value={selectedSppg}
              onChange={(e) => setSelectedSppg(e.target.value)}
              className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
            >
              <option value="">Pilih Satuan SPPG</option>
              {sppgUnits.map(unit => (
                <option key={unit.id} value={unit.id}>{unit.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Menu Display */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 mt-4">Memuat menu...</p>
        </div>
      )}

      {!loading && selectedSppg && menu && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[2.5rem] p-8 border border-blue-100 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
              <Calendar size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-xl">Menu Hari Ini</h3>
              <p className="text-sm text-slate-600">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 space-y-6">
            <div>
              <h4 className="font-bold text-slate-700 mb-2">Menu:</h4>
              <p className="text-lg font-bold text-blue-600">{menu.menu_name}</p>
            </div>

            {/* DETAIL KOMPONEN MAKANAN */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-700 text-sm">Detail Komponen:</h4>
              
              {menu.carb_type && (
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🍚</span>
                    <div>
                      <p className="font-bold text-sm text-slate-800">{menu.carb_type}</p>
                      <p className="text-xs text-slate-500">Karbohidrat</p>
                    </div>
                  </div>
                  <span className="font-bold text-amber-700">{menu.carb_grams}g</span>
                </div>
              )}

              {menu.animal_protein && (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🍗</span>
                    <div>
                      <p className="font-bold text-sm text-slate-800">{menu.animal_protein}</p>
                      <p className="text-xs text-slate-500">Protein Hewani</p>
                    </div>
                  </div>
                  <span className="font-bold text-red-700">{menu.animal_grams}g</span>
                </div>
              )}

              {menu.plant_protein && (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🌱</span>
                    <div>
                      <p className="font-bold text-sm text-slate-800">{menu.plant_protein}</p>
                      <p className="text-xs text-slate-500">Protein Nabati</p>
                    </div>
                  </div>
                  <span className="font-bold text-green-700">{menu.plant_grams}g</span>
                </div>
              )}

              {menu.vegetable && (
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🥬</span>
                    <div>
                      <p className="font-bold text-sm text-slate-800">{menu.vegetable}</p>
                      <p className="text-xs text-slate-500">Sayur</p>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-700">{menu.vegetable_grams}g</span>
                </div>
              )}

              {menu.fruit && (
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🍌</span>
                    <div>
                      <p className="font-bold text-sm text-slate-800">{menu.fruit}</p>
                      <p className="text-xs text-slate-500">Buah</p>
                    </div>
                  </div>
                  <span className="font-bold text-orange-700">{menu.fruit_grams}g</span>
                </div>
              )}

              {menu.milk && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🥛</span>
                    <div>
                      <p className="font-bold text-sm text-slate-800">{menu.milk}</p>
                      <p className="text-xs text-slate-500">Susu</p>
                    </div>
                  </div>
                  <span className="font-bold text-blue-700">{menu.milk_ml}ml</span>
                </div>
              )}
            </div>

            {/* KANDUNGAN GIZI */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-bold text-slate-700 mb-3 text-sm">Kandungan Gizi Total:</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500">Kalori</p>
                  <p className="text-lg font-bold text-blue-600">{menu.calories}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500">Protein</p>
                  <p className="text-lg font-bold text-blue-600">{menu.protein}g</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500">Zat Besi</p>
                  <p className="text-lg font-bold text-blue-600">{menu.iron}mg</p>
                </div>
              </div>
            </div>

            {/* FEEDBACK TOGGLE BUTTON */}
            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowFeedback(!showFeedback)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} className="text-blue-600" />
                  <span className="font-bold text-slate-800">Feedback</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                    {feedbackList.length}
                  </span>
                </div>
                {showFeedback ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              {/* EXPANDABLE FEEDBACK SECTION */}
              {showFeedback && (
                <div className="mt-4 space-y-4 animate-in slide-in-from-top duration-300">
                  {/* FORM FEEDBACK */}
                  <div className="bg-gradient-to-br from-white to-blue-50/30 border-2 border-blue-100 rounded-2xl p-6">
                    <h4 className="font-bold text-slate-800 mb-4">Berikan Feedback Anda</h4>
                    
                    <form onSubmit={handleSubmitFeedback} className="space-y-4">
                      <input
                        type="text"
                        value={feedbackName}
                        onChange={(e) => setFeedbackName(e.target.value)}
                        placeholder="Nama Anda"
                        className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                        required
                      />

                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFeedbackRating(star)}
                            className="transition-all"
                          >
                            <Star 
                              size={28} 
                              className={`${star <= feedbackRating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'} transition-colors`}
                            />
                          </button>
                        ))}
                      </div>

                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Bagikan pengalaman Anda..."
                        className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-sm resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                        rows="3"
                        required
                      />

                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95"
                      >
                        <Send size={18} />
                        Kirim Feedback
                      </button>
                    </form>
                  </div>

                  {/* FEEDBACK LIST */}
                  {feedbackList.length > 0 && (
                    <div className="space-y-3">
                      {feedbackList.map((fb) => (
                        <div key={fb.id} className="bg-white rounded-xl p-4 border border-slate-100">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                {fb.parent_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-slate-800">{fb.parent_name}</p>
                                <p className="text-xs text-slate-400">{formatDate(fb.created_at)}</p>
                              </div>
                            </div>
                            {fb.rating > 0 && (
                              <div className="flex gap-1">
                                {[...Array(fb.rating)].map((_, i) => (
                                  <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 pl-13">{fb.feedback_text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!loading && selectedSppg && !menu && (
        <div className="text-center py-12 bg-slate-50 rounded-2xl">
          <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Menu belum tersedia untuk hari ini</p>
        </div>
      )}
    </div>
  );
}