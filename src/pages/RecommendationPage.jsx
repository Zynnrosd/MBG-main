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
      .catch(() => setMenuDatabase([]));
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
    { id: 'q7', text: 'Apakah Anda sering minum teh atau kopi setelah makan?', reverse: false },
    { id: 'q8', text: 'Apakah Anda rutin mengonsumsi suplemen zat besi?', reverse: true },
    { id: 'q9', text: 'Apakah Anda sering mengonsumsi protein hewani?', reverse: true },
    { id: 'q10', text: 'Apakah makanan protein hewani tersedia rutin?', reverse: true },
    { id: 'q11', text: 'Apakah Anda pernah mengalami infeksi cacing?', reverse: false }
  ];

  const validateInput = () => {
    const weight = parseFloat(formData.weight || formData.prePregnancyWeight);
    const height = parseFloat(formData.height);

    if (isNaN(weight) || isNaN(height) || weight <= 0 || height <= 0) {
      alert("Masukkan data yang valid.");
      return false;
    }
    return true;
  };

  const calculateNeeds = () => {
    const baseWeight = category === 'pregnant'
      ? parseFloat(formData.prePregnancyWeight)
      : parseFloat(formData.weight);

    const height = parseFloat(formData.height);
    const age = parseFloat(formData.age) || 10;

    if (!baseWeight || !height) return null;

    let totalCalories = 0;

    if (category === 'child') {
      totalCalories = baseWeight * 80;
    } else {
      const bmr = 655.1 + (9.563 * baseWeight) + (1.850 * height) - (4.676 * age);
      totalCalories = bmr * 1.3;
    }

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

    const heightCm = parseFloat(formData.height);

    if (!weight || !heightCm) return 0;

    const height = heightCm / 100;
    return weight / (height * height);
  };

  const calculateAnemiaRisk = () => {
    let score = 0;
    Object.keys(assessment).forEach(key => {
      const q = questions.find(x => x.id === key);
      const a = assessment[key];
      if (a === null) return;
      score += q.reverse ? (a ? 0 : 1) : (a ? 1 : 0);
    });

    if (score <= 3) return { risk: false, level: 'Rendah', score, color: 'green' };
    if (score <= 7) return { risk: true, level: 'Sedang', score, color: 'yellow' };
    return { risk: true, level: 'Tinggi', score, color: 'red' };
  };

  const generateCombinedMenu = (targetCalories) => {
    if (!menuDatabase?.length) return null;

    const carbs = menuDatabase.filter(i => /nasi|kentang|mie/i.test(i.name)).slice(0, 10);
    const veggies = menuDatabase.filter(i => /sayur|bayam|wortel|brokoli/i.test(i.name)).slice(0, 10);
    const proteins = menuDatabase.filter(i => /ayam|ikan|telur|daging|tahu|tempe/i.test(i.name)).slice(0, 10);

    let best = null;
    let diffMin = Infinity;

    for (let c of carbs) {
      for (let v of veggies) {
        for (let p of proteins) {
          const total = (c.calories||0)+(v.calories||0)+(p.calories||0);
          const diff = Math.abs(total - targetCalories);
          if (diff < diffMin) {
            diffMin = diff;
            best = {
              name: `${c.name} + ${v.name} + ${p.name}`,
              recipe: [c.name, v.name, p.name],
              nutrition: {
                calories: Math.round(total),
                proteins: Math.round((c.proteins||0)+(v.proteins||0)+(p.proteins||0)),
                fat: Math.round((c.fat||0)+(v.fat||0)+(p.fat||0)),
                carbohydrate: Math.round((c.carbohydrate||0)+(v.carbohydrate||0)+(p.carbohydrate||0))
              }
            };
          }
        }
      }
    }
    return best;
  };

  const handleSubmit = () => {
    if (!validateInput()) return;

    const needs = calculateNeeds();
    const imt = calculateIMT();
    const anemia = calculateAnemiaRisk();

    setRecommendation({
      imt: imt.toFixed(1),
      anemia,
      breakfast: generateCombinedMenu(needs.breakfast),
      dinner: generateCombinedMenu(needs.dinner),
      needs
    });

    setStep(4);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">

      {step === 1 && (
        <div>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}>
              {cat.label}
            </button>
          ))}
          <button onClick={() => setStep(2)}>Lanjut</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <input placeholder="Berat" onChange={e => setFormData({...formData, weight: e.target.value})}/>
          <input placeholder="Tinggi" onChange={e => setFormData({...formData, height: e.target.value})}/>
          <button onClick={() => setStep(3)}>Next</button>
        </div>
      )}

      {step === 3 && (
        <div>
          {questions.map(q => (
            <div key={q.id}>
              <p>{q.text}</p>
              <button onClick={() => setAssessment({...assessment, [q.id]: true})}>Ya</button>
              <button onClick={() => setAssessment({...assessment, [q.id]: false})}>Tidak</button>
            </div>
          ))}
          <button onClick={handleSubmit}>Hasil</button>
        </div>
      )}

      {step === 4 && recommendation && (
        <div>
          <p>IMT: {recommendation.imt}</p>
          <p>Anemia: {recommendation.anemia.level}</p>
          <p>Kalori: {recommendation.needs.daily}</p>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Hasil ini bersifat estimasi dan tidak menggantikan tenaga kesehatan.
      </p>

    </div>
  );
}
