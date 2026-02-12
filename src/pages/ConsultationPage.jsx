import { useState, useEffect } from 'react';
import { MessageCircle, Phone, Video, Award, CheckCircle, Star } from 'lucide-react';
import { supabase } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid'; 
import ChatWindow from '../components/ChatWindow';

export default function ConsultationPage() {
  const [dietitians, setDietitians] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk Chat
  const [activeSession, setActiveSession] = useState(null); 
  const [loadingChat, setLoadingChat] = useState(false);

  useEffect(() => {
    loadDietitians();
  }, []);

  const loadDietitians = async () => {
    setLoading(true);
    try {
      // FIX 1: Gunakan tabel 'doctors' (bukan 'dietitians')
      const { data, error } = await supabase
        .from('doctors') 
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setDietitians(data || []);
    } catch (error) {
      console.error('Error loading dietitians:', error);
    } finally {
      setLoading(false);
    }
  };

  // LOGIC BARU: Handle Chat (Create Session First)
  const handleOpenChat = async (dietitian) => {
    setLoadingChat(true);
    try {
        // 1. Identifikasi User (Guest/Login)
        let guestId = localStorage.getItem('mbg_guest_id');
        if (!guestId) {
            guestId = uuidv4(); 
            localStorage.setItem('mbg_guest_id', guestId);
        }

        // 2. Cek apakah ada sesi chat yang belum ditutup?
        // FIX 2: Gunakan .maybeSingle() agar tidak error/crash jika data null
        const { data: existingSession, error: fetchError } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('user_guest_id', guestId)
            .eq('dietitian_id', dietitian.id)
            .eq('status', 'active')
            .maybeSingle(); 

        if (fetchError) throw fetchError;

        if (existingSession) {
            setActiveSession({ ...existingSession, dietitian });
        } else {
            // 3. Buat sesi baru jika belum ada
            const { data: newSession, error: insertError } = await supabase
                .from('chat_sessions')
                .insert([{
                    user_guest_id: guestId,
                    dietitian_id: dietitian.id,
                    status: 'active'
                }])
                .select()
                .single(); // Disini .single() aman karena kita baru insert
            
            if (insertError) throw insertError;
            setActiveSession({ ...newSession, dietitian });
        }
    } catch (err) {
        console.error("Gagal memulai chat:", err);
        // Jangan alert error teknis ke user, cukup log saja
    } finally {
        setLoadingChat(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto shadow-xl shadow-blue-100"></div>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Memuat Ahli Gizi...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto p-6 space-y-8 pb-32 min-h-screen bg-[#F8FAFC]">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wider">
            <Award size={12} /> PERSAGI Certified
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Konsultasi <span className="text-blue-600">Dietisien.</span>
          </h1>
          <p className="text-slate-500 font-medium">
            Konsultasi dengan dietisien bersertifikat RD (Registered Dietitian)
          </p>
        </header>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-[2.5rem] p-8 border border-blue-100 shadow-sm">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 bg-blue-600 rounded-[1.2rem] flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-100">
              <CheckCircle size={28} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 mb-1 uppercase text-sm tracking-tight italic">Kerjasama Resmi PERSAGI</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Semua dietisien telah terverifikasi dan merupakan anggota aktif 
                <strong className="text-blue-700"> Persatuan Ahli Gizi Indonesia</strong>.
                Konsultasi profesional kini dalam genggaman Anda.
              </p>
            </div>
          </div>
        </div>

        {/* Dietitians List */}
        <div className="space-y-6">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2">Ahli Gizi Tersedia</h2>
          
          {dietitians.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
              <MessageCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest italic">Belum ada dietisien tersedia</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {dietitians.map((dietitian) => (
                <div 
                  key={dietitian.id} 
                  className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group"
                >
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Photo */}
                    <div className="shrink-0">
                      <div className="relative">
                        <div className="w-32 h-32 rounded-[2rem] bg-blue-600 flex items-center justify-center text-white text-4xl font-black shadow-xl overflow-hidden border-4 border-blue-50">
                             {dietitian.photo_url ? (
                                <img 
                                  src={dietitian.photo_url} 
                                  alt={dietitian.name}
                                  className="w-full h-full object-cover"
                                />
                             ) : (
                                dietitian.name.charAt(0)
                             )}
                        </div>
                        {dietitian.is_online && (
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white animate-pulse shadow-sm"></div>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-5">
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className="text-2xl font-black text-slate-900 italic tracking-tight mb-1">{dietitian.name}</h3>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                <Award size={12} />
                                {dietitian.specialization || 'Spesialis Gizi'}
                              </span>
                            </div>
                          </div>
                          {dietitian.is_online && (
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                              Online
                            </span>
                          )}
                        </div>

                        {/* Rating & Experience */}
                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-3 pl-1">
                          <div className="flex items-center gap-1">
                            <Star size={16} className="text-yellow-400 fill-yellow-400" />
                            <span className="font-black text-slate-900">{dietitian.rating || 5.0}</span>
                          </div>
                          <div className="h-4 w-px bg-slate-200"></div>
                          <span className="font-bold text-slate-500">{dietitian.experience_years || 0} tahun pengalaman</span>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-sm text-slate-500 font-medium leading-relaxed italic border-l-4 border-blue-100 pl-4 py-1">
                        "{dietitian.bio || 'Ahli gizi berpengalaman siap membantu masalah nutrisi Anda.'}"
                      </p>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3 pt-2">
                        <button 
                          onClick={() => handleOpenChat(dietitian)}
                          disabled={loadingChat}
                          className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-100 disabled:opacity-70 disabled:cursor-wait"
                        >
                          <MessageCircle size={18} />
                          {loadingChat ? 'Menghubungkan...' : 'Chat Sekarang'}
                        </button>
                        <button className="flex items-center gap-2 px-6 py-4 bg-white border-2 border-slate-100 text-slate-400 rounded-[1.5rem] font-bold hover:border-blue-200 hover:text-blue-600 transition-all active:scale-95">
                          <Phone size={20} />
                        </button>
                        <button className="flex items-center gap-2 px-6 py-4 bg-white border-2 border-slate-100 text-slate-400 rounded-[1.5rem] font-bold hover:border-blue-200 hover:text-blue-600 transition-all active:scale-95">
                          <Video size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-blue-50/50 p-8 rounded-[3rem] border border-blue-100/50 flex gap-5 backdrop-blur-sm mt-8">
          <MessageCircle className="text-blue-600 shrink-0" size={28} />
          <div className="space-y-2">
            <p className="text-[12px] text-slate-600 leading-relaxed font-medium">
              <strong className="text-blue-900">Dietisien (RD)</strong> adalah ahli gizi profesional yang telah tersertifikasi.
            </p>
            <p className="text-[12px] text-slate-600 leading-relaxed font-medium">
              Chat langsung memudahkan Anda berkonsultasi kapan saja mengenai MPASI, gizi ibu hamil, dan tumbuh kembang anak.
            </p>
          </div>
        </div>
      </div>

      {/* CHAT WINDOW */}
      {activeSession && (
        <ChatWindow 
          session={activeSession}
          onClose={() => setActiveSession(null)}
        />
      )}
    </>
  );
}