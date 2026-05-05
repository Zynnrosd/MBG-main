import { useState, useEffect } from 'react';

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
    { id: 'child', label: 'Anak', color: 'blue', desc: 'Gizi untuk tumbuh kembang optimal' },
    { id: 'pregnant', label: 'Ibu Hamil', color: 'pink', desc: 'Nutrisi untuk ibu dan janin' },
    { id: 'breastfeeding', label: 'Ibu Menyusui', color: 'purple', desc: 'Asupan untuk produksi ASI' }
  ];

  const questions = [
    { id: 'q1', text: 'Apakah Anda merasa mudah lelah atau lemas sepanjang hari?', reverse: false },
    { id: 'q2', text: 'Apakah Anda sering merasa pusing saat melakukan aktivitas ringan?', reverse: false },
    { id: 'q3', text: 'Apakah Anda mengalami sesak napas saat melakukan aktivitas ringan?', reverse: false },
    { id: 'q4', text: 'Apakah bagian dalam kelopak mata atau bibir Anda terlihat pucat?', reverse: false },
    { id: 'q5', text: 'Apakah Anda mengalami kerontokan rambut berlebih atau kuku mudah rapuh?', reverse: false },
    { id: 'q6', text: 'Apakah Anda sering melewatkan sarapan?', reverse: false },
    { id: 'q7', text: 'Apakah Anda sering minum teh atau kopi bersamaan atau segera setelah makan?', reverse: false },
    { id: 'q8', text: 'Apakah Anda rutin mengonsumsi suplemen zat besi?', reverse: true },
    { id: 'q9', text: 'Apakah Anda sering mengonsumsi protein hewani?', reverse: true },
    { id: 'q10', text: 'Apakah protein hewani tersedia rutin di rumah?', reverse: true },
    { id: 'q11', text: 'Apakah Anda pernah mengalami infeksi cacing dalam 6 bulan terakhir?', reverse: false }
  ];

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

  const generateCombinedMenu = (targetCalories) => {
    if (!menuDatabase || menuDatabase.length === 0) return null;

    const carbs = menuDatabase.filter(item => /nasi|kentang|mie/i.test(item.name));
    const veggies = menuDatabase.filter(item => /sayur|bayam|kangkung|wortel|brokoli/i.test(item.name));
    const proteins = menuDatabase.filter(item => /ayam|ikan|telur|daging|tahu|tempe/i.test(item.name));

    let bestCombo = null;
    let smallestDiff = Infinity;

    for (let c of carbs) {
      for (let v of veggies) {
        for (let p of proteins) {
          const totalCalories = (c.calories || 0) + (v.calories || 0) + (p.calories || 0);
          const diff = Math.abs(totalCalories - targetCalories);

          if (diff < smallestDiff) {
            smallestDiff = diff;
            bestCombo = {
              name: `${c.name} + ${v.name} + ${p.name}`,
              recipe: [c.name, v.name, p.name],
              nutrition: {
                calories: Math.round(totalCalories),
                proteins: Math.round((c.proteins || 0) + (v.proteins || 0) + (p.proteins || 0)),
                fat: Math.round((c.fat || 0) + (v.fat || 0) + (p.fat || 0)),
                carbohydrate: Math.round((c.carbohydrate || 0) + (v.carbohydrate || 0) + (p.carbohydrate || 0))
              }
            };
          }
        }
      }
    }
    return bestCombo;
  };

  const calculateIMT = () => {
    const weightToUse = category === 'pregnant' 
        ? parseFloat(formData.prePregnancyWeight) 
        : parseFloat(formData.weight);

    const height = parseFloat(formData.height) / 100;
    return weightToUse / (height * height);
  };

  const getIMTStatus = (imt) => {
    if (imt < 18.5) return { status: 'Kurus', color: 'yellow' };
    if (imt < 25) return { status: 'Normal', color: 'green' };
    return { status: 'Gemuk', color: 'orange' };
  };

  const calculateAnemiaRisk = () => {
    let score = 0;
    Object.keys(assessment).forEach(key => {
      const q = questions.find(x => x.id === key);
      const ans = assessment[key];
      if (ans === null) return;
      score += q.reverse ? (ans ? 0 : 1) : (ans ? 1 : 0);
    });

    if (score <= 3) return { risk: false, level: 'Rendah', score };
    if (score <= 7) return { risk: true, level: 'Sedang', score };
    return { risk: true, level: 'Tinggi', score };
  };

  const handleAssessmentSubmit = () => {
    const allAnswered = Object.values(assessment).every(val => val !== null);
    if (!allAnswered) return alert('Isi semua pertanyaan');

    setLoading(true);

    setTimeout(() => {
      const imt = calculateIMT();
      const needs = calculateNeeds();

      setRecommendation({
        imt: imt.toFixed(1),
        imtStatus: getIMTStatus(imt),
        anemiaRisk: calculateAnemiaRisk(),
        breakfast: generateCombinedMenu(needs.breakfast),
        dinner: generateCombinedMenu(needs.dinner)
      });

      setStep(4);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">

      <h1 className="text-2xl font-bold">Rekomendasi Gizi</h1>

      {step === 1 && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setCategory(cat.id)}
                className={`p-3 border rounded ${category === cat.id ? 'bg-blue-500 text-white' : ''}`}>
                {cat.label}
              </button>
            ))}
          </div>

          <button onClick={() => setStep(2)} className="w-full bg-black text-white p-3 rounded">
            Lanjut
          </button>
        </>
      )}

      {step === 2 && (
        <form onSubmit={(e)=>{e.preventDefault(); setStep(3);}} className="space-y-3">
          <input placeholder="Berat" required value={formData.weight} onChange={e=>setFormData({...formData, weight:e.target.value})}/>
          <input placeholder="Tinggi" required value={formData.height} onChange={e=>setFormData({...formData, height:e.target.value})}/>
          <button className="bg-black text-white p-3 w-full">Next</button>
        </form>
      )}

      {step === 3 && (
        <>
          {questions.map(q => (
            <div key={q.id}>
              <p>{q.text}</p>
              <button onClick={()=>setAssessment({...assessment,[q.id]:true})}>Ya</button>
              <button onClick={()=>setAssessment({...assessment,[q.id]:false})}>Tidak</button>
            </div>
          ))}
          <button onClick={handleAssessmentSubmit}>
            {loading ? 'Loading...' : 'Lihat Hasil'}
          </button>
        </>
      )}

      {step === 4 && recommendation && (
        <div>
          <p>IMT: {recommendation.imt}</p>
          <p>Status: {recommendation.imtStatus.status}</p>
          <p>Risiko Anemia: {recommendation.anemiaRisk.level}</p>

          <h3>Menu Sarapan</h3>
          <p>{recommendation.breakfast?.name}</p>

          <h3>Menu Makan Malam</h3>
          <p>{recommendation.dinner?.name}</p>
        </div>
      )}

    </div>
  );
}
