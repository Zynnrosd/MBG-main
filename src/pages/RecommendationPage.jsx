import { useState, useEffect } from 'react';
import { 
  Calculator, RefreshCw, ArrowRight, User, Info, Shield, Heart, 
  AlertCircle, CheckCircle2, Flame, Apple, Droplet, ClipboardList 
} from 'lucide-react';

export default function RecommendationPage() {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('child');

  const [formData, setFormData] = useState({ 
    age: '', weight: '', height: '', 
    prePregnancyWeight: '', trimester: '1', breastfeedingAge: '0-6' 
  });

  const [assessment, setAssessment] = useState({
    q1: null,q2: null,q3: null,q4: null,q5: null,
    q6: null,q7: null,q8: null,q9: null,q10: null,q11: null
  });

  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [menuDatabase, setMenuDatabase] = useState([]);

  useEffect(() => {
    fetch('/data/nutrition.json')
      .then(res => res.json())
      .then(data => setMenuDatabase(data));
  }, []);

  const categories = [
    { id: 'child', label: '👶 Anak', color: 'blue' },
    { id: 'pregnant', label: '🤰 Ibu Hamil', color: 'pink' },
    { id: 'breastfeeding', label: '🤱 Ibu Menyusui', color: 'purple' }
  ];

  // ====== LOGIC (UNCHANGED) ======
  const calculateNeeds = () => {
    const baseWeight = category === 'pregnant' 
      ? parseFloat(formData.prePregnancyWeight) 
      : parseFloat(formData.weight);

    const height = parseFloat(formData.height);
    const age = parseFloat(formData.age) || 30;

    let bmr = category === 'child' 
      ? 66.5 + (13.75 * baseWeight) + (5.003 * height) - (6.75 * age)
      : 655.1 + (9.563 * baseWeight) + (1.850 * height) - (4.676 * age);

    let totalCalories = bmr * 1.3;

    if (category === 'pregnant') {
      totalCalories += (formData.trimester === '1' ? 180 : 300);
    } else if (category === 'breastfeeding') {
      totalCalories += 330;
    }

    return {
      daily: Math.round(totalCalories),
      breakfast: Math.round(totalCalories * 0.25),
      dinner: Math.round(totalCalories * 0.30)
    };
  };

  const calculateIMT = () => {
    const weight = category === 'pregnant'
      ? parseFloat(formData.prePregnancyWeight)
      : parseFloat(formData.weight);

    const height = parseFloat(formData.height) / 100;
    return weight / (height * height);
  };

  const getIMTStatus = (imt) => {
    if (imt < 18.5) return { status: 'Normal', color: 'green' };
    return { status: 'Tidak Normal', color: 'red' };
  };

  const handleAssessmentSubmit = () => {
    setLoading(true);

    setTimeout(() => {
      const imt = calculateIMT();
      const needs = calculateNeeds();

      setRecommendation({
        imt: imt.toFixed(1),
        imtStatus: getIMTStatus(imt),
        needs
      });

      setStep(4);
      setLoading(false);
    }, 1000);
  };

  const resetForm = () => {
    setStep(1);
    setRecommendation(null);
  };

  // ====== UI ======
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 pb-32 min-h-screen bg-white">

      {/* HEADER (MATCH SCHEDULE) */}
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
          <Shield size={12}/> Nutrition Assistant
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Rekomendasi <span className="text-blue-600">Gizi.</span>
        </h1>
        <p className="text-slate-500 font-medium">
          Analisis kebutuhan gizi personal untuk tumbuh kembang optimal.
        </p>
      </header>

      {/* CATEGORY BUTTON (MATCH STYLE) */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  category === cat.id
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xl'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <p className="font-bold">{cat.label}</p>
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700"
          >
            Lanjutkan →
          </button>
        </div>
      )}

      {/* FORM */}
      {step === 2 && (
        <div className="bg-slate-50 rounded-[2.5rem] p-6 border space-y-4">
          <h3 className="font-bold text-slate-800">Data Fisik</h3>

          <input
            placeholder="Berat Badan"
            className="w-full p-3 rounded-xl border"
            onChange={e => setFormData({...formData, weight: e.target.value})}
          />

          <input
            placeholder="Tinggi Badan"
            className="w-full p-3 rounded-xl border"
            onChange={e => setFormData({...formData, height: e.target.value})}
          />

          <button
            onClick={() => setStep(3)}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold"
          >
            Lanjut →
          </button>
        </div>
      )}

      {/* ASSESSMENT */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-[2.5rem] p-6 border">
            <h3 className="font-bold text-slate-800 mb-4">Asesmen</h3>

            <button
              onClick={handleAssessmentSubmit}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold"
            >
              {loading ? "Loading..." : "Lihat Hasil"}
            </button>
          </div>
        </div>
      )}

      {/* RESULT */}
      {step === 4 && recommendation && (
        <div className="space-y-6">

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[2.5rem] p-8 border shadow-lg">
            <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
              <Calculator className="text-blue-600"/> Hasil Analisis
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 text-center">
                <p className="text-xs text-slate-500">IMT</p>
                <p className="text-2xl font-bold text-blue-600">{recommendation.imt}</p>
              </div>

              <div className="bg-white rounded-xl p-4 text-center">
                <p className="text-xs text-slate-500">Kalori Harian</p>
                <p className="text-2xl font-bold text-blue-600">
                  {recommendation.needs.daily}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={resetForm}
            className="w-full py-4 text-slate-400 font-bold text-xs hover:text-blue-600 uppercase"
          >
            Hitung Ulang
          </button>
        </div>
      )}

      {/* INFO BOX (MATCH STYLE) */}
      <div className="bg-blue-50 p-6 rounded-[2rem] border flex gap-4">
        <Info className="text-blue-600"/>
        <p className="text-sm text-slate-600">
          Rekomendasi ini berdasarkan analisis IMT dan kebutuhan kalori harian.
        </p>
      </div>
    </div>
  );
}
