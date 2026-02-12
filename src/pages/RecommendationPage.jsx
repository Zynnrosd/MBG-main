import { useState, useEffect } from 'react';
import { Calculator, RefreshCw, ArrowRight, User, Info, Zap, Heart, AlertCircle, CheckCircle2, Flame, Apple, Droplet, ClipboardList } from 'lucide-react';

export default function RecommendationPage() {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('child');
  const [formData, setFormData] = useState({ age: '', weight: '', height: '', trimester: '1', breastfeedingAge: '0-6' });
  const [assessment, setAssessment] = useState({ q1: null, q2: null, q3: null, q4: null, q5: null, q6: null, q7: null, q8: null, q9: null, q10: null, q11: null });
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [menuDatabase, setMenuDatabase] = useState([]); // Array satuan dari JSON

  useEffect(() => {
    fetch('/data/nutrition.json')
      .then(res => res.json())
      .then(data => setMenuDatabase(data))
      .catch(err => console.error("Error loading nutrition data:", err));
  }, []);

  const categories = [
    { id: 'child', label: 'Anak', icon: User, color: 'blue', desc: 'Gizi untuk tumbuh kembang optimal' },
    { id: 'pregnant', label: 'Ibu Hamil', icon: Heart, color: 'pink', desc: 'Nutrisi untuk ibu dan janin' },
    { id: 'breastfeeding', label: 'Ibu Menyusui', icon: Droplet, color: 'purple', desc: 'Asupan untuk produksi ASI' }
  ];

  const questions = [
    { id: 'q1', text: 'Apakah Anda merasa mudah lelah atau lemas sepanjang hari?', reverse: false },
    { id: 'q2', text: 'Apakah Anda sering merasa pusing saat melakukan aktivitas ringan?', reverse: false },
    { id: 'q3', text: 'Apakah Anda mengalami sesak napas saat melakukan aktivitas ringan?', reverse: false },
    { id: 'q4', text: 'Apakah bagian dalam kelopak mata atau bibir Anda terlihat pucat?', reverse: false },
    { id: 'q5', text: 'Apakah Anda mengalami kerontokan rambut berlebih atau kuku mudah rapuh?', reverse: false },
    { id: 'q6', text: 'Apakah Anda sering melewatkan sarapan?', reverse: false },
    { id: 'q7', text: 'Apakah Anda sering minum teh atau kopi bersamaan atau segera setelah makan?', reverse: false },
    { id: 'q8', text: 'Apakah Anda rutin mengonsumsi suplemen zat besi, tablet tambah darah, atau multivitamin yang mengandung zat besi?', reverse: true },
    { id: 'q9', text: 'Apakah Anda sering mengonsumsi makanan sumber protein hewani (seperti telur, ayam, ikan, daging)?', reverse: true },
    { id: 'q10', text: 'Apakah makanan sumber protein hewani tersedia secara rutin di rumah Anda?', reverse: true },
    { id: 'q11', text: 'Apakah Anda pernah mengalami infeksi cacing dalam 6 bulan terakhir?', reverse: false }
  ];

  // --- LOGIC CALCULATOR GIZI ---
  const calculateNeeds = () => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    const age = parseFloat(formData.age) || 30;
    let bmr = category === 'child' 
      ? 66.5 + (13.75 * weight) + (5.003 * height) - (6.75 * age)
      : 655.1 + (9.563 * weight) + (1.850 * height) - (4.676 * age);
    let totalCalories = bmr * 1.3;
    if (category === 'pregnant') totalCalories += (formData.trimester === '1' ? 180 : 300);
    else if (category === 'breastfeeding') totalCalories += 330;

    return {
        daily: Math.round(totalCalories),
        breakfast: Math.round(totalCalories * 0.25),
        dinner: Math.round(totalCalories * 0.30)
    };
  };

  // ================================
// GENERATE BEST COMBINED MENU
// ================================
// =======================================
// GENERATE BEST COMBINED MENU (INDO FIX)
// =======================================
const generateCombinedMenu = (targetCalories) => {
  if (!menuDatabase || menuDatabase.length === 0) return null;

  // 1️⃣ KARBO – hanya yang umum di Indonesia
  const carbs = menuDatabase.filter(item =>
    /nasi|kentang|mie/i.test(item.name)
  );

  // 2️⃣ SAYUR – sayur umum Indonesia
  const veggies = menuDatabase.filter(item =>
    /sayur|bayam|kangkung|sawi|capcay|wortel|brokoli|buncis|sop/i.test(item.name)
  );

  // 3️⃣ LAUK – lauk umum Indonesia
  const proteins = menuDatabase.filter(item =>
    /ayam|ikan|telur|daging|tahu|tempe|udang|hati/i.test(item.name) &&
    !/nasi|kentang|mie/i.test(item.name)
  );

  // Jika salah satu kategori kosong
  if (carbs.length === 0 || veggies.length === 0 || proteins.length === 0) {
    return null;
  }

  let bestCombo = null;
  let smallestDiff = Infinity;

  // 4️⃣ Loop semua kombinasi
  for (let c of carbs) {
    for (let v of veggies) {
      for (let p of proteins) {

        const totalCalories =
          (c.calories || 0) +
          (v.calories || 0) +
          (p.calories || 0);

        const diff = Math.abs(totalCalories - targetCalories);

        if (diff < smallestDiff) {
          smallestDiff = diff;

          bestCombo = {
            name: `${c.name} + ${v.name} + ${p.name}`,
            recipe: [c.name, v.name, p.name],
            nutrition: {
              calories: Math.round(totalCalories),
              proteins: Math.round(
                (c.proteins || 0) +
                (v.proteins || 0) +
                (p.proteins || 0)
              ),
              fat: Math.round(
                (c.fat || 0) +
                (v.fat || 0) +
                (p.fat || 0)
              ),
              carbohydrate: Math.round(
                (c.carbohydrate || 0) +
                (v.carbohydrate || 0) +
                (p.carbohydrate || 0)
              )
            }
          };
        }
      }
    }
  }

  return bestCombo;
};



  const calculateIMT = () => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height) / 100;
    return weight / (height * height);
  };

  const getIMTStatus = (imt) => {
    if (category === 'child') {
      if (imt < 14) return { status: 'Gizi Kurang', color: 'yellow' };
      if (imt < 18.5) return { status: 'Gizi Baik', color: 'green' };
      return { status: 'Gizi Lebih', color: 'orange' };
    }
    if (imt < 18.5) return { status: 'Kurus', color: 'yellow' };
    if (imt < 25) return { status: 'Normal', color: 'green' };
    if (imt < 30) return { status: 'Gemuk', color: 'orange' };
    return { status: 'Obesitas', color: 'red' };
  };

  const calculateAnemiaRisk = () => {
    let score = 0;
    Object.keys(assessment).forEach(key => {
      const question = questions.find(q => q.id === key);
      const answer = assessment[key];
      if (answer === null) return;
      score += question.reverse ? (answer ? 0 : 1) : (answer ? 1 : 0);
    });
    if (score <= 3) return { risk: false, level: 'Rendah', score, color: 'green' };
    if (score <= 7) return { risk: true, level: 'Sedang', score, color: 'yellow' };
    return { risk: true, level: 'Tinggi', score, color: 'red' };
  };

  const handleAssessmentSubmit = () => {
    const allAnswered = Object.values(assessment).every(val => val !== null);
    if (!allAnswered) { alert('Mohon jawab semua pertanyaan asesmen'); return; }
    setLoading(true);
    
    setTimeout(() => {
      const imt = calculateIMT();
      const needs = calculateNeeds();
      const breakfastMenu = generateCombinedMenu(needs.breakfast);
      const dinnerMenu = generateCombinedMenu(needs.dinner);

      setRecommendation({
        imt: imt.toFixed(1),
        imtStatus: getIMTStatus(imt),
        anemiaRisk: calculateAnemiaRisk(),
        needs: needs,
        breakfast: breakfastMenu,
        dinner: dinnerMenu,
        ttdFrequency: category === 'pregnant' ? '1 tablet/hari' : category === 'child' ? '1 tablet/minggu (Rematri)' : 'Sesuai anjuran',
        ironRichFoods: ['Hati ayam', 'Daging sapi', 'Ikan kembung', 'Bayam', 'Kacang hijau'],
        folatRichFoods: ['Bayam', 'Brokoli', 'Kacang merah', 'Jeruk', 'Alpukat'],
        vitCRichFoods: ['Jeruk', 'Tomat', 'Jambu biji', 'Paprika', 'Strawberry']
      });
      setStep(4);
      setLoading(false);
    }, 1500);
  };

  const resetForm = () => {
    setStep(1);
    setFormData({ age: '', weight: '', height: '', trimester: '1', breastfeedingAge: '0-6' });
    setAssessment({ q1: null, q2: null, q3: null, q4: null, q5: null, q6: null, q7: null, q8: null, q9: null, q10: null, q11: null });
    setRecommendation(null);
  };

  const currentCategory = categories.find(c => c.id === category);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8 pb-32 min-h-screen bg-[#F8FAFC]">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
          <Zap size={12} fill="currentColor" /> Nutrition Assistant
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Rekomendasi <span className="text-blue-600">Gizi.</span></h1>
      </header>

      {/* STEP 1: PILIH KATEGORI */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <p className="text-slate-600 font-medium">Pilih kategori untuk memulai:</p>
          <div className="grid grid-cols-3 gap-3">
            {categories.map(cat => {
              const Icon = cat.icon;
              const isActive = category === cat.id;
              const bgColor = cat.color === 'blue' ? 'bg-blue-600 border-blue-600' : cat.color === 'pink' ? 'bg-pink-600 border-pink-600' : 'bg-purple-600 border-purple-600';
              return (
                <button key={cat.id} onClick={() => setCategory(cat.id)}
                  className={`p-4 rounded-2xl border-2 transition-all duration-300 ${isActive ? `${bgColor} text-white shadow-xl scale-105` : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}>
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${isActive ? 'text-white' : cat.color === 'blue' ? 'text-blue-500' : cat.color === 'pink' ? 'text-pink-500' : 'text-purple-500'}`} />
                  <p className="text-xs font-bold text-center">{cat.label}</p>
                </button>
              );
            })}
          </div>
          <p className="text-sm text-slate-500 font-medium text-center">{currentCategory.desc}</p>
          <button onClick={() => setStep(2)} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-bold shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-95 transition-all">
            Lanjutkan <ArrowRight size={20}/>
          </button>
        </div>
      )}

      {/* STEP 2: DATA FISIK */}
      {step === 2 && (
        <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-lg ${currentCategory.color === 'blue' ? 'bg-blue-600' : currentCategory.color === 'pink' ? 'bg-pink-600' : 'bg-purple-600'}`}>
                <User size={16} />
              </div>
              Data Fisik
            </h3>
            {category === 'child' && (
              <div className="grid grid-cols-3 gap-4">
                {['age', 'weight', 'height'].map(key => (
                  <div key={key} className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest">{key === 'age' ? 'Usia' : key === 'weight' ? 'BB' : 'TB'}</label>
                    <input type="number" step="0.1" placeholder={key === 'age' ? 'Thn' : key === 'weight' ? 'Kg' : 'Cm'}
                      className="w-full p-4 bg-slate-50 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none" 
                      required value={formData[key]} onChange={e => setFormData({...formData, [key]: e.target.value})} />
                  </div>
                ))}
              </div>
            )}
            {category === 'pregnant' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest">Berat Badan</label>
                    <input type="number" step="0.1" placeholder="Kg" className="w-full p-4 bg-slate-50 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-50 transition-all outline-none" 
                      required value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest">Tinggi Badan</label>
                    <input type="number" step="0.1" placeholder="Cm" className="w-full p-4 bg-slate-50 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-50 transition-all outline-none" 
                      required value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest">Trimester</label>
                  <select className="w-full p-4 bg-slate-50 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-50 transition-all outline-none"
                    value={formData.trimester} onChange={e => setFormData({...formData, trimester: e.target.value})}>
                    <option value="1">Trimester 1 (0-12 minggu)</option>
                    <option value="2">Trimester 2 (13-26 minggu)</option>
                    <option value="3">Trimester 3 (27-40 minggu)</option>
                  </select>
                </div>
              </div>
            )}
            {category === 'breastfeeding' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest">Berat Badan</label>
                  <input type="number" step="0.1" placeholder="Kg" className="w-full p-4 bg-slate-50 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition-all outline-none" 
                    required value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest">Tinggi Badan</label>
                  <input type="number" step="0.1" placeholder="Cm" className="w-full p-4 bg-slate-50 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition-all outline-none" 
                    required value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} />
                </div>
              </div>
            )}
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-bold shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-95 transition-all">
            Lanjut ke Asesmen <ArrowRight size={20}/>
          </button>
        </form>
      )}

      {/* STEP 3: ASESMEN ANEMIA */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                <ClipboardList size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Asesmen Risiko Anemia</h3>
                <p className="text-xs text-slate-500">Jawab semua pertanyaan dengan jujur</p>
              </div>
            </div>
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-slate-50 rounded-2xl p-5 space-y-3">
                <p className="text-sm font-medium text-slate-700">
                  <span className="font-bold text-blue-600">{idx + 1}.</span> {q.text}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setAssessment({...assessment, [q.id]: true})}
                    className={`p-3 rounded-xl font-bold text-sm transition-all ${assessment[q.id] === true ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-blue-300'}`}>
                    Ya
                  </button>
                  <button type="button" onClick={() => setAssessment({...assessment, [q.id]: false})}
                    className={`p-3 rounded-xl font-bold text-sm transition-all ${assessment[q.id] === false ? 'bg-slate-700 text-white shadow-lg' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                    Tidak
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleAssessmentSubmit} disabled={loading}
            className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-bold shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50">
            {loading ? <RefreshCw className="animate-spin" /> : <>Lihat Hasil Rekomendasi <ArrowRight size={20}/></>}
          </button>
        </div>
      )}

      {/* STEP 4: HASIL (DATA DARI JSON & KALKULATOR) */}
      {step === 4 && recommendation && (
        <div className="space-y-6 animate-in slide-in-from-bottom-10 duration-700">
          
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
              <Calculator className="text-blue-600" size={24} />
              Status Gizi & Risiko Anemia
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-2xl p-6 text-center">
                <p className="text-xs text-slate-500 font-bold uppercase mb-2">IMT/U</p>
                <p className="text-4xl font-black text-blue-600">{recommendation.imt}</p>
                <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full ${recommendation.imtStatus.color === 'green' ? 'bg-green-100 text-green-700' : recommendation.imtStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : recommendation.imtStatus.color === 'orange' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                  {recommendation.imtStatus.status === 'Gizi Baik' || recommendation.imtStatus.status === 'Normal' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span className="text-xs font-bold">{recommendation.imtStatus.status}</span>
                </div>
              </div>
              <div className={`rounded-2xl p-6 text-center ${recommendation.anemiaRisk.color === 'green' ? 'bg-green-50' : recommendation.anemiaRisk.color === 'yellow' ? 'bg-yellow-50' : 'bg-red-50'}`}>
                <p className="text-xs text-slate-500 font-bold uppercase mb-2">Risiko Anemia</p>
                <p className={`text-2xl font-black mb-2 ${recommendation.anemiaRisk.color === 'green' ? 'text-green-600' : recommendation.anemiaRisk.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'}`}>{recommendation.anemiaRisk.level}</p>
                <p className="text-xs text-slate-500 mb-2">Skor: {recommendation.anemiaRisk.score}/11</p>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${recommendation.anemiaRisk.risk ? (recommendation.anemiaRisk.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700') : 'bg-green-100 text-green-700'}`}>
                  {recommendation.anemiaRisk.risk ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                  <span className="text-xs font-bold">{recommendation.anemiaRisk.risk ? 'Berisiko' : 'Tidak Berisiko'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SARAPAN */}
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-[2.5rem] p-8 border border-orange-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white"><Flame size={24} /></div>
              <div>
                <h3 className="font-bold text-slate-800 text-xl">Rekomendasi Sarapan</h3>
                {recommendation.breakfast ? (
                    <p className="text-sm text-slate-600 font-bold">{recommendation.breakfast.name}</p>
                ) : (
                    <p className="text-sm text-red-600 font-bold">Data Menu Tidak Ditemukan</p>
                )}
              </div>
            </div>
            
            {recommendation.breakfast && (
                <div className="space-y-4">
                <div className="bg-white rounded-2xl p-5">
                    <h4 className="font-bold text-slate-700 mb-3 text-sm">Komponen Bahan:</h4>
                    <ul className="space-y-2">
                    {recommendation.breakfast.recipe?.map((item, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-orange-500 font-bold">•</span>{item}
                        </li>
                    ))}
                    </ul>
                </div>
                
                <div className="bg-white rounded-2xl p-5">
                    <h4 className="font-bold text-slate-700 mb-3 text-sm">Informasi Gizi (per porsi):</h4>
                    <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-orange-50 rounded-xl">
                        <p className="text-xs text-slate-500">Kalori</p>
                        <p className="text-lg font-bold text-orange-600">{recommendation.breakfast.nutrition.calories} kcal</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-xl">
                        <p className="text-xs text-slate-500">Karbohidrat</p>
                        <p className="text-lg font-bold text-orange-600">{recommendation.breakfast.nutrition.carbohydrate}g</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-xl">
                        <p className="text-xs text-slate-500">Protein</p>
                        <p className="text-lg font-bold text-orange-600">{recommendation.breakfast.nutrition.proteins}g</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-xl">
                        <p className="text-xs text-slate-500">Lemak</p>
                        <p className="text-lg font-bold text-orange-600">{recommendation.breakfast.nutrition.fat}g</p>
                    </div>
                    </div>
                </div>
                </div>
            )}
          </div>

          {/* MAKAN MALAM */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[2.5rem] p-8 border border-blue-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white"><Apple size={24} /></div>
              <div>
                <h3 className="font-bold text-slate-800 text-xl">Rekomendasi Makan Malam</h3>
                {recommendation.dinner ? (
                    <p className="text-sm text-slate-600 font-bold">{recommendation.dinner.name}</p>
                ) : (
                    <p className="text-sm text-red-600 font-bold">Data Menu Tidak Ditemukan</p>
                )}
              </div>
            </div>

            {recommendation.dinner && (
                <div className="space-y-4">
                <div className="bg-white rounded-2xl p-5">
                    <h4 className="font-bold text-slate-700 mb-3 text-sm">Komponen Bahan:</h4>
                    <ul className="space-y-2">
                    {recommendation.dinner.recipe?.map((item, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-blue-500 font-bold">•</span>{item}
                        </li>
                    ))}
                    </ul>
                </div>

                <div className="bg-white rounded-2xl p-5">
                    <h4 className="font-bold text-slate-700 mb-3 text-sm">Informasi Gizi (per porsi):</h4>
                    <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-blue-50 rounded-xl">
                        <p className="text-xs text-slate-500">Kalori</p>
                        <p className="text-lg font-bold text-blue-600">{recommendation.dinner.nutrition.calories} kcal</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-xl">
                        <p className="text-xs text-slate-500">Karbohidrat</p>
                        <p className="text-lg font-bold text-blue-600">{recommendation.dinner.nutrition.carbohydrate}g</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-xl">
                        <p className="text-xs text-slate-500">Protein</p>
                        <p className="text-lg font-bold text-blue-600">{recommendation.dinner.nutrition.proteins}g</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-xl">
                        <p className="text-xs text-slate-500">Lemak</p>
                        <p className="text-lg font-bold text-blue-600">{recommendation.dinner.nutrition.fat}g</p>
                    </div>
                    </div>
                </div>
                </div>
            )}
          </div>

          <div className="bg-red-50 rounded-[2.5rem] p-8 border border-red-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Heart className="text-red-600" size={20} />
              Info Penting (Cegah Anemia)
            </h3>
            <div className="bg-white rounded-2xl p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="text-red-600" size={18} />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-800">Konsumsi Tablet Tambah Darah (TTD)</p>
                  <p className="text-sm text-slate-600 mt-1">{recommendation.ttdFrequency}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 space-y-3">
              <h4 className="font-bold text-sm text-slate-800 mb-2">Perbanyak konsumsi makanan kaya:</h4>
              <div>
                <p className="text-xs font-bold text-red-600 uppercase mb-2">Zat Besi</p>
                <div className="flex flex-wrap gap-2">
                  {recommendation.ironRichFoods.map((food, i) => (
                    <span key={i} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">{food}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-orange-600 uppercase mb-2">Folat</p>
                <div className="flex flex-wrap gap-2">
                  {recommendation.folatRichFoods.map((food, i) => (
                    <span key={i} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium">{food}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-yellow-600 uppercase mb-2">Vitamin C (Bantu Serap Besi)</p>
                <div className="flex flex-wrap gap-2">
                  {recommendation.vitCRichFoods.map((food, i) => (
                    <span key={i} className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">{food}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button onClick={resetForm} className="w-full py-6 text-slate-400 font-bold text-xs hover:text-blue-600 transition-colors uppercase tracking-[0.3em]">
            Hitung Ulang Analisis
          </button>
        </div>
      )}

      <div className="bg-blue-50/50 p-8 rounded-[3rem] border border-blue-100/50 flex gap-5 backdrop-blur-sm">
        <Info className="text-blue-600 shrink-0" size={28} />
        <p className="text-[12px] text-slate-600 leading-relaxed font-medium">
          Rekomendasi ini disusun berdasarkan <strong className="text-blue-900">Status Gizi (IMT/U)</strong> dan 
          <strong className="text-blue-900"> Asesmen Risiko Anemia</strong> untuk mendukung tumbuh kembang optimal.
        </p>
      </div>
    </div>
  );
}