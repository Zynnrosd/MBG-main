import { useState, useEffect } from 'react';
import { Calendar, MapPin, MessageSquare, Send, Star, ChevronDown, ChevronUp, Filter, ChefHat } from 'lucide-react';
import { supabase } from '../config/supabase';

export default function SchedulePage() {
  const [category, setCategory] = useState('anak');
  const [allKitchens, setAllKitchens] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSppg, setSelectedSppg] = useState('');
  const [provinceOptions, setProvinceOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [kitchenOptions, setKitchenOptions] = useState([]);
  const [menu, setMenu] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackList, setFeedbackList] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchKitchens() {
      const { data } = await supabase.from('kitchen_locations').select('*');
      if (data) {
        setAllKitchens(data);
        const uniqueProvs = [...new Map(data.map(item => [item.province_code, {code: item.province_code, name: item.province_name}])).values()];
        setProvinceOptions(uniqueProvs);
      }
    }
    fetchKitchens();
  }, []);

  useEffect(() => {
    if (selectedProvince) {
        const filtered = allKitchens.filter(k => k.province_code === selectedProvince);
        const uniqueCities = [...new Map(filtered.map(item => [item.city_code, {code: item.city_code, name: item.city_name}])).values()];
        setCityOptions(uniqueCities);
        setSelectedCity('');
        setSelectedDistrict('');
        setSelectedSppg('');
    } else {
        setCityOptions([]);
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedCity) {
        const filtered = allKitchens.filter(k => k.city_code === selectedCity);
        const uniqueDistricts = [...new Map(filtered.map(item => [item.district_code, {code: item.district_code, name: item.district_name}])).values()];
        setDistrictOptions(uniqueDistricts);
        setSelectedDistrict('');
        setSelectedSppg('');
    } else {
        setDistrictOptions([]);
    }
  }, [selectedCity]);

  useEffect(() => {
    if (selectedDistrict) {
        const filtered = allKitchens.filter(k => k.district_code === selectedDistrict);
        setKitchenOptions(filtered);
        setSelectedSppg('');
    } else {
        setKitchenOptions([]);
    }
  }, [selectedDistrict]);

  useEffect(() => {
    if (selectedSppg) {
      loadMenu(selectedSppg, category);
      loadFeedback(selectedSppg);
    } else {
        setMenu(null);
    }
  }, [selectedSppg, category]);

  const loadMenu = async (kitchenId, menuCategory) => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('daily_menus')
        .select('*')
        .eq('kitchen_id', kitchenId)
        .eq('role_category', menuCategory)
        .order('menu_date', { ascending: false })
        .limit(1)
        .single();
        
      setMenu(data || null);
    } catch (error) {
      setMenu(null);
    } finally {
      setLoading(false);
    }
  };

  const loadFeedback = async (kitchenId) => {
    const { data } = await supabase
      .from('menu_feedback')
      .select(`*, daily_menus!inner(kitchen_id)`)
      .eq('daily_menus.kitchen_id', kitchenId)
      .order('created_at', { ascending: false })
      .limit(10);
      
    setFeedbackList(data || []);
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedback.trim() || !menu || !feedbackName.trim()) return;

    const { error } = await supabase.from('menu_feedback').insert([{
      menu_id: menu.id,
      user_name: feedbackName,
      comment_text: feedback,
      rating: feedbackRating
    }]);

    if (!error) {
      setFeedback('');
      setFeedbackName('');
      setFeedbackRating(0);
      loadFeedback(selectedSppg);
    } else {
        alert("Gagal kirim feedback: " + error.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', { 
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 pb-32 min-h-screen bg-white">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
          <Calendar size={12} fill="currentColor" /> Daily Schedule
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Jadwal <span className="text-blue-600">Menu.</span>
        </h1>
        <p className="text-slate-500 font-medium">Lihat menu harian dan berikan feedback untuk perbaikan.</p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => setCategory('anak')} className={`p-4 rounded-2xl border-2 transition-all ${category === 'anak' ? 'bg-blue-600 border-blue-600 text-white shadow-xl' : 'bg-white border-slate-200 text-slate-600'}`}>
          <p className="font-bold">👶 Anak</p>
        </button>
        <button onClick={() => setCategory('ibu_hamil')} className={`p-4 rounded-2xl border-2 transition-all ${category === 'ibu_hamil' ? 'bg-pink-600 border-pink-600 text-white shadow-xl' : 'bg-white border-slate-200 text-slate-600'}`}>
          <p className="font-bold">🤰 Ibu Hamil</p>
        </button>
        <button onClick={() => setCategory('ibu_menyusui')} className={`p-4 rounded-2xl border-2 transition-all ${category === 'ibu_menyusui' ? 'bg-purple-600 border-purple-600 text-white shadow-xl' : 'bg-white border-slate-200 text-slate-600'}`}>
          <p className="font-bold">🤱 Ibu Menyusui</p>
        </button>
      </div>

      <div className="space-y-4 bg-slate-50 rounded-[2.5rem] p-6 border border-slate-100">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <MapPin className="text-blue-600" size={20} />
          Pilih Lokasi SPPG
        </h3>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase ml-2 tracking-widest block mb-2">Provinsi</label>
            <select value={selectedProvince} onChange={(e) => setSelectedProvince(e.target.value)} className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none">
              <option value="">Pilih</option>
              {provinceOptions.map(prov => (
                <option key={prov.code} value={prov.code}>{prov.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase ml-2 tracking-widest block mb-2">Kab/Kota</label>
            <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} disabled={!selectedProvince} className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none disabled:bg-slate-100 disabled:cursor-not-allowed">
              <option value="">Pilih</option>
              {cityOptions.map(city => (
                <option key={city.code} value={city.code}>{city.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase ml-2 tracking-widest block mb-2">Kecamatan</label>
            <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} disabled={!selectedCity} className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none disabled:bg-slate-100 disabled:cursor-not-allowed">
              <option value="">Pilih</option>
              {districtOptions.map(dist => (
                <option key={dist.code} value={dist.code}>{dist.name}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedDistrict && (
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase ml-2 tracking-widest block mb-2">Satuan SPPG (Dapur)</label>
            <select value={selectedSppg} onChange={(e) => setSelectedSppg(e.target.value)} className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none">
              <option value="">Pilih Satuan SPPG</option>
              {kitchenOptions.map(unit => (
                <option key={unit.id} value={unit.id}>{unit.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 mt-4 font-medium">Memuat menu...</p>
        </div>
      )}

      {!loading && selectedSppg && menu && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[2.5rem] p-8 border border-blue-100 shadow-lg animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
              <Calendar size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-xl">Menu Hari Ini</h3>
              <p className="text-sm text-slate-600">{new Date(menu.menu_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 space-y-6">
            <div>
              <h4 className="font-bold text-slate-700 mb-2">Menu:</h4>
              <p className="text-lg font-bold text-blue-600">{menu.menu_name}</p>
              <p className="text-sm text-slate-500 mt-1">{menu.description}</p>
            </div>

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

            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-bold text-slate-700 mb-3 text-sm">Kandungan Gizi Total:</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500">Kalori</p>
                  <p className="text-lg font-bold text-blue-600">{menu.calories} kkal</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500">Protein</p>
                  <p className="text-lg font-bold text-blue-600">{menu.protein} g</p>
                </div>
              </div>
            </div>

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

              {showFeedback && (
                <div className="mt-4 space-y-4 animate-in slide-in-from-top duration-300">
                  <div className="bg-gradient-to-br from-white to-blue-50/30 border-2 border-blue-100 rounded-2xl p-6">
                    <h4 className="font-bold text-slate-800 mb-4">Berikan Feedback Anda</h4>
                    
                    <form onSubmit={handleSubmitFeedback} className="space-y-4">
                      <input
                        type="text"
                        value={feedbackName}
                        onChange={(e) => setFeedbackName(e.target.value)}
                        placeholder="Nama Anda (Orang Tua)"
                        className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                        required
                      />

                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFeedbackRating(star)}
                            className="transition-all active:scale-110"
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
                        placeholder="Bagaimana menu hari ini? Anak suka?"
                        className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-sm resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                        rows="3"
                        required
                      />

                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200"
                      >
                        <Send size={18} />
                        Kirim Feedback
                      </button>
                    </form>
                  </div>

                  {feedbackList.length > 0 && (
                    <div className="space-y-3">
                      {feedbackList.map((fb) => (
                        <div key={fb.id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {fb.user_name?.charAt(0).toUpperCase() || 'A'}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-slate-800">{fb.user_name || 'Anonim'}</p>
                                <p className="text-xs text-slate-400">{formatDate(fb.created_at)}</p>
                              </div>
                            </div>
                            {fb.rating > 0 && (
                              <div className="flex gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                                {[...Array(fb.rating)].map((_, i) => (
                                  <Star key={i} size={10} className="fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 pl-13 leading-relaxed">{fb.comment_text}</p>
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
        <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-300">
          <ChefHat className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-bold">Menu belum tersedia</p>
          <p className="text-xs text-slate-400 mt-1">Admin belum menginput menu untuk tanggal ini.</p>
        </div>
      )}
      
      {!selectedSppg && (
          <div className="text-center py-20 opacity-50">
              <Filter className="w-16 h-16 text-slate-300 mx-auto mb-4"/>
              <p className="text-slate-500 font-medium">Pilih lokasi di atas untuk melihat menu.</p>
          </div>
      )}
    </div>
  );
}