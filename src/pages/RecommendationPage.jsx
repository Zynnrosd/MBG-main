import { useState, useEffect } from 'react';
import { Calculator, RefreshCw, ArrowRight, User, Info, Shield, Heart, AlertCircle, CheckCircle2, Flame, Apple, Droplet, ClipboardList } from 'lucide-react';

export default function RecommendationPage() {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('child');

  const [formData, setFormData] = useState({ 
    age: '', 
    weight: '', 
    height: '', 
    prePregnancyWeight: '', 
    trimester: '1', 
    breastfeedingAge: '0-6' 
  });

  const [assessment, setAssessment] = useState({ q1: null, q2: null, q3: null, q4: null, q5: null, q6: null, q7: null, q8: null, q9: null, q10: null, q11: null });
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [menuDatabase, setMenuDatabase] = useState([]);

  useEffect(() => {
    fetch('/data/nutrition.json')
      .then(res => res.json())
      .then(data => setMenuDatabase(data))
      .catch(err => console.error("Error loading nutrition data:", err));
  }, []);

  const categories = [
    { id: 'child', label: 'Anak' },
    { id: 'pregnant', label: 'Ibu Hamil' },
    { id: 'breastfeeding', label: 'Ibu Menyusui' }
  ];

  const questions = [
    { id: 'q1', text: 'Apakah Anda merasa mudah lelah atau lemas sepanjang hari?', reverse: false },
    { id: 'q2', text: 'Apakah Anda sering merasa pusing saat melakukan aktivitas ringan?', reverse: false },
    { id: 'q3', text: 'Apakah Anda mengalami sesak napas saat melakukan aktivitas ringan?', reverse: false },
    { id: 'q4', text: 'Apakah bagian dalam kelopak mata atau bibir Anda terlihat pucat?', reverse: false },
    { id: 'q5', text: 'Apakah Anda mengalami kerontokan rambut berlebih atau kuku mudah rapuh?', reverse: false },
    { id: 'q6', text: 'Apakah Anda sering melewatkan sarapan?', reverse: false },
    { id: 'q7', text: 'Apakah Anda sering minum teh atau kopi setelah makan?', reverse: false },
    { id: 'q8', text: 'Apakah Anda rutin mengonsumsi suplemen zat besi?', reverse: true },
    { id: 'q9', text: 'Apakah Anda sering makan protein hewani?', reverse: true },
    { id: 'q10', text: 'Apakah protein hewani tersedia di rumah?', reverse: true },
    { id: 'q11', text: 'Apakah Anda pernah cacingan dalam 6 bulan terakhir?', reverse: false }
  ];

  // === LOGIC (TIDAK DIUBAH) ===
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
    const weightToUse = category === 'pregnant' 
      ? parseFloat(formData.prePregnancyWeight) 
      : parseFloat(formData.weight);

    const height = parseFloat(formData.height) / 100;
    return weightToUse / (height * height);
  };

  const calculateAnemiaRisk = () => {
    let score = 0;
    Object.keys(assessment).forEach(key => {
      const question = questions.find(q => q.id === key);
      const answer = assessment[key];
      if (answer === null) return;
      score += question.reverse ? (answer ? 0 : 1) : (answer ? 1 : 0);
    });
    return score;
  };

  const handleAssessmentSubmit = () => {
    const allAnswered = Object.values(assessment).every(val => val !== null);
    if (!allAnswered) return alert('Jawab semua pertanyaan');

    setLoading(true);

    setTimeout(() => {
      const imt = calculateIMT();
      const needs = calculateNeeds();

      setRecommendation({
        imt: imt.toFixed(1),
        anemiaScore: calculateAnemiaRisk(),
        needs
      });

      setStep(4);
      setLoading(false);
    }, 1000);
  };

  // =========================

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 pb-32 min-h-screen bg-white">

      {/* HEADER */}
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase">
          <Shield size={12} /> Nutrition Assistant
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900">
          Rekomendasi <span className="text-blue-600">Gizi</span>
        </h1>
        <p className="text-slate-500">Analisis kebutuhan gizi personal</p>
      </header>

      {/* CATEGORY */}
      {step === 1 && (
        <div className="grid grid-cols-3 gap-3">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`p-4 rounded-2xl border-2 font-bold transition-all
                ${category === cat.id 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                  : 'bg-white border-slate-200 text-slate-600'}`}
            >
              {cat.label}
            </button>
          ))}
          <button onClick={() => setStep(2)} className="col-span-3 bg-slate-900 text-white py-4 rounded-2xl font-bold">
            Lanjut
          </button>
        </div>
      )}

      {/* FORM */}
      {step === 2 && (
        <div className="bg-slate-50 p-6 rounded-[2rem] border space-y-4">
          <input placeholder="Berat Badan" className="input" onChange={e => setFormData({...formData, weight: e.target.value})}/>
          <input placeholder="Tinggi Badan" className="input" onChange={e => setFormData({...formData, height: e.target.value})}/>
          <button onClick={() => setStep(3)} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">
            Lanjut
          </button>
        </div>
      )}

      {/* ASESMEN */}
      {step === 3 && (
        <div className="space-y-4">
          {questions.map(q => (
            <div key={q.id} className="bg-slate-50 p-4 rounded-xl">
              <p className="text-sm">{q.text}</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => setAssessment({...assessment, [q.id]: true})}>Ya</button>
                <button onClick={() => setAssessment({...assessment, [q.id]: false})}>Tidak</button>
              </div>
            </div>
          ))}
          <button onClick={handleAssessmentSubmit} className="w-full bg-slate-900 text-white py-4 rounded-xl">
            Hasil
          </button>
        </div>
      )}

      {/* RESULT */}
      {step === 4 && recommendation && (
        <div className="bg-blue-50 p-6 rounded-[2rem] space-y-4">
          <p><b>IMT:</b> {recommendation.imt}</p>
          <p><b>Skor Anemia:</b> {recommendation.anemiaScore}</p>
          <p><b>Kebutuhan Kalori:</b> {recommendation.needs.daily} kkal</p>
        </div>
      )}

    </div>
  );
}
