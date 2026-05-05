import { useState, useEffect } from 'react';
import { Calculator, User, Heart, Droplet, CheckCircle2, AlertCircle } from 'lucide-react';

export default function RecommendationPage() {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('child');
  const [formData, setFormData] = useState({ age: '', weight: '', height: '' });
  const [assessment, setAssessment] = useState({});
  const [recommendation, setRecommendation] = useState(null);
  const [menuDatabase, setMenuDatabase] = useState([]);

  useEffect(() => {
    fetch('/data/nutrition.json')
      .then(res => res.json())
      .then(data => setMenuDatabase(data))
      .catch(() => setMenuDatabase([]));
  }, []);

  const categories = [
    { id: 'child', label: 'Anak', icon: User, color: 'blue' },
    { id: 'pregnant', label: 'Ibu Hamil', icon: Heart, color: 'pink' },
    { id: 'breastfeeding', label: 'Ibu Menyusui', icon: Droplet, color: 'purple' }
  ];

  const questions = [
    { id: 'q1', text: 'Sering lemas?' },
    { id: 'q2', text: 'Sering pusing?' },
    { id: 'q3', text: 'Sesak napas ringan?' }
  ];

  const calculate = () => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);

    if (!weight || !height) return;

    const imt = weight / ((height / 100) ** 2);
    const calories = Math.round(weight * 80);

    setRecommendation({ imt: imt.toFixed(1), calories });
    setStep(4);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 pb-32 min-h-screen bg-white">

      {/* HEADER */}
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
          <Calculator size={12} /> Nutrition
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900">
          Rekomendasi <span className="text-blue-600">Gizi.</span>
        </h1>
        <p className="text-slate-500">Hitung kebutuhan dan cek kondisi gizi.</p>
      </header>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="grid grid-cols-3 gap-3">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`p-4 rounded-2xl border-2 ${
                category === cat.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <p className="font-bold">{cat.label}</p>
            </button>
          ))}
          <button
            onClick={() => setStep(2)}
            className="col-span-3 bg-blue-600 text-white p-3 rounded-xl font-bold"
          >
            Lanjut
          </button>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="bg-slate-50 p-6 rounded-[2.5rem] space-y-4 border">
          <input
            placeholder="Berat (kg)"
            className="w-full p-3 border rounded-xl"
            onChange={e => setFormData({ ...formData, weight: e.target.value })}
          />
          <input
            placeholder="Tinggi (cm)"
            className="w-full p-3 border rounded-xl"
            onChange={e => setFormData({ ...formData, height: e.target.value })}
          />
          <button
            onClick={() => setStep(3)}
            className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold"
          >
            Lanjut
          </button>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="space-y-4">
          {questions.map(q => (
            <div key={q.id} className="bg-white p-4 rounded-xl border">
              <p className="font-medium">{q.text}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setAssessment({ ...assessment, [q.id]: true })}
                  className="flex-1 bg-blue-50 p-2 rounded-lg"
                >
                  Ya
                </button>
                <button
                  onClick={() => setAssessment({ ...assessment, [q.id]: false })}
                  className="flex-1 bg-slate-100 p-2 rounded-lg"
                >
                  Tidak
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={calculate}
            className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold"
          >
            Lihat Hasil
          </button>
        </div>
      )}

      {/* STEP 4 */}
      {step === 4 && recommendation && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-[2.5rem] border shadow-lg space-y-4">

          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-blue-600" />
            <h3 className="font-bold text-xl">Hasil Analisis</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl text-center">
              <p className="text-sm text-slate-500">IMT</p>
              <p className="text-xl font-bold text-blue-600">{recommendation.imt}</p>
            </div>
            <div className="bg-white p-4 rounded-xl text-center">
              <p className="text-sm text-slate-500">Kalori</p>
              <p className="text-xl font-bold text-blue-600">{recommendation.calories}</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex gap-2">
            <AlertCircle className="text-yellow-600" />
            <p className="text-sm text-slate-600">
              Hasil ini hanya estimasi, konsultasikan ke tenaga kesehatan.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
