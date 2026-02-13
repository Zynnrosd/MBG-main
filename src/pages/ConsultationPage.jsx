import { useState, useEffect } from 'react';
import { Search, Star, Clock, MessageCircle, ChevronRight, Stethoscope, Award, Briefcase, Quote, AlertCircle } from 'lucide-react';
import { supabase } from '../config/supabase';
import ChatWindow from '../components/ChatWindow';

export default function ConsultationPage() {
  const [dietitians, setDietitians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDietitians();
    checkActiveSession();

    const channel = supabase.channel('public:doctors')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'doctors' }, () => {
        loadDietitians();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadDietitians = async () => {
    // Select semua kolom
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('is_active', true)
      .order('is_online', { ascending: false });

    if (!error) setDietitians(data);
    setLoading(false);
  };

  const checkActiveSession = async () => {
    const guestId = localStorage.getItem('mbg_guest_id');
    if (!guestId) return;

    const { data } = await supabase
      .from('chat_sessions')
      .select('*, dietitian:doctors(*)')
      .eq('user_guest_id', guestId)
      .eq('status', 'active')
      .maybeSingle();

    if (data) setActiveSession(data);
  };

  const handleStartConsultation = async (dietitian) => {
    console.log("Tombol Ditekan untuk:", dietitian.name); // Debugging

    let guestId = localStorage.getItem('mbg_guest_id');
    if (!guestId) {
      guestId = `guest_${Date.now()}`;
      localStorage.setItem('mbg_guest_id', guestId);
    }

    // Jika mencoba chat dokter offline (Peringatan saja, tidak diblokir)
    if (!dietitian.is_online) {
       if(!confirm("Dokter ini sedang Offline. Anda mungkin tidak akan mendapatkan balasan segera. Tetap lanjutkan?")) {
           return;
       }
    }

    if (activeSession) {
      if (activeSession.dietitian_id !== dietitian.id) {
        alert("Selesaikan konsultasi dengan Ahli Gizi sebelumnya terlebih dahulu.");
        return;
      }
      // Jika sama, state activeSession trigger window terbuka
      console.log("Membuka sesi yang sudah ada...");
      return; 
    }

    // Buat sesi baru
    console.log("Membuat sesi baru...");
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert([{
        user_guest_id: guestId,
        dietitian_id: dietitian.id,
        status: 'active'
      }])
      .select('*, dietitian:doctors(*)')
      .single();

    if (error) {
        console.error("Gagal buat sesi:", error);
        alert("Gagal memulai sesi chat.");
    } else {
        console.log("Sesi dibuat:", data);
        setActiveSession(data); 
    }
  };

  const filteredDietitians = dietitians.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.specialist?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8 pb-32 min-h-screen bg-white">
      
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
          <MessageCircle size={12} fill="currentColor" /> Live Consultation
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Pilih <span className="text-blue-600">Ahli Gizi.</span>
        </h1>
        <p className="text-slate-500 font-medium">Konsultasi langsung dengan dietisien terverifikasi SIGAP.</p>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama atau spesialisasi..." 
          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-[1.5rem] text-sm font-bold outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-400"
        />
      </div>

      <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-700">
        {loading ? (
           [1,2,3].map(i => (
             <div key={i} className="bg-slate-50 h-40 rounded-[2rem] animate-pulse" />
           ))
        ) : filteredDietitians.length === 0 ? (
          <div className="text-center py-10 text-slate-400 font-medium">
             Tidak ada ahli gizi yang ditemukan.
          </div>
        ) : (
          filteredDietitians.map(dietitian => (
            <div key={dietitian.id} className="group bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 relative overflow-hidden">
              
              {/* Badge Status */}
              <div className={`absolute top-6 right-6 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                dietitian.is_online 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-slate-100 text-slate-500'
              }`}>
                <span className={`w-2 h-2 rounded-full ${dietitian.is_online ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></span>
                {dietitian.is_online ? 'Online' : 'Offline'}
              </div>

              <div className="flex items-start gap-5">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 bg-slate-100 rounded-[1.5rem] overflow-hidden shadow-inner">
                    {dietitian.photo_url ? (
                      <img src={dietitian.photo_url} alt={dietitian.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Stethoscope size={32} />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                    <Star size={10} fill="currentColor" /> 5.0
                  </div>
                </div>

                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1 pr-16">
                    <h3 className="font-black text-slate-900 text-lg truncate">
                        {dietitian.name}
                    </h3>
                    {dietitian.title && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider rounded-md border border-blue-100">
                            {dietitian.title}
                        </span>
                    )}
                  </div>

                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1">
                    <Award size={12} className="text-blue-500" />
                    {dietitian.specialist || 'Ahli Gizi Umum'}
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl">
                      <Briefcase size={14} className="text-slate-400" />
                      {dietitian.years_of_experience || '1'} Thn
                    </div>
                  </div>
                </div>
              </div>

              {/* --- PERBAIKAN 1: TAMPILKAN DESKRIPSI WALAUPUN KOSONG --- */}
              <div className="mt-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                      <Quote size={12} className="inline mr-1 text-slate-300 transform -scale-x-100" />
                      {/* Tampilkan 'description' ATAU teks default */}
                      {dietitian.description || "Ahli gizi ini siap membantu konsultasi kebutuhan gizi Anda."}
                  </p>
              </div>

              {/* --- PERBAIKAN 2: TOMBOL SELALU BISA DIKLIK (HAPUS DISABLED) --- */}
              <button 
                onClick={() => handleStartConsultation(dietitian)}
                // Disabled saya hapus agar bisa dipencet buat testing
                className={`mt-5 w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${
                   dietitian.is_online
                    ? 'bg-slate-900 text-white shadow-slate-200 hover:bg-blue-600'
                    : 'bg-slate-200 text-slate-500 cursor-pointer hover:bg-slate-300' // Styling beda dikit kalo offline
                }`}
              >
                {activeSession?.dietitian_id === dietitian.id ? (
                  <>Lanjutkan Chat <MessageCircle size={18} /></>
                ) : (
                  <>
                    {dietitian.is_online ? 'Konsultasi Sekarang' : 'Tinggalkan Pesan (Offline)'} 
                    <ChevronRight size={18} />
                  </>
                )}
              </button>

            </div>
          ))
        )}
      </div>

      {activeSession && (
        <ChatWindow 
          session={activeSession} 
          onClose={() => setActiveSession(null)} 
        />
      )}
    </div>
  );
}