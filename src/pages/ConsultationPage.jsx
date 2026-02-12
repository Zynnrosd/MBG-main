import { useState, useEffect } from 'react';
import { MessageCircle, Phone, Video, Award, CheckCircle, Search, Star } from 'lucide-react'; // Pastikan import ini lengkap
import { supabase } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid'; // Install uuid: npm install uuid
import ChatWindow from '../components/ChatWindow';

export default function ConsultationPage() {
  const [dietitians, setDietitians] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk Chat
  const [activeSession, setActiveSession] = useState(null); // Ganti chatOpen dengan activeSession
  const [loadingChat, setLoadingChat] = useState(false);

  useEffect(() => {
    loadDietitians();
  }, []);

  const loadDietitians = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dietitians')
        .select('*')
        .eq('is_active', true)
        .order('is_online', { ascending: false }); // Online di atas
      
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
        const { data: existingSession } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('user_guest_id', guestId)
            .eq('dietitian_id', dietitian.id)
            .eq('status', 'active')
            .single();

        if (existingSession) {
            setActiveSession({ ...existingSession, dietitian });
        } else {
            // 3. Buat sesi baru jika belum ada
            const { data: newSession, error } = await supabase
                .from('chat_sessions')
                .insert([{
                    user_guest_id: guestId,
                    dietitian_id: dietitian.id,
                    status: 'active'
                }])
                .select()
                .single();
            
            if (error) throw error;
            setActiveSession({ ...newSession, dietitian });
        }
    } catch (err) {
        console.error("Gagal memulai chat:", err);
        alert("Terjadi kesalahan koneksi chat.");
    } finally {
        setLoadingChat(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-medium">Memuat data dietisien...</p>
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
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-6 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0">
              <CheckCircle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 mb-2">Kerjasama dengan PERSAGI</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Semua dietisien telah terverifikasi dan merupakan anggota aktif 
                <strong className="text-blue-700"> Persatuan Ahli Gizi Indonesia (PERSAGI)</strong>.
                Chat langsung untuk konsultasi gizi yang tepat dan professional.
              </p>
            </div>
          </div>
        </div>

        {/* Dietitians List */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800">Dietisien Tersedia</h2>
          
          {dietitians.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-100">
              <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Belum ada dietisien tersedia</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {dietitians.map((dietitian) => (
                <div 
                  key={dietitian.id} 
                  className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Photo */}
                    <div className="shrink-0">
                      <div className="relative">
                        <img 
                          src={dietitian.photo_url || `https://ui-avatars.com/api/?name=${dietitian.name}`} 
                          alt={dietitian.name}
                          className="w-28 h-28 rounded-3xl object-cover border-4 border-blue-50"
                        />
                        {dietitian.is_online && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white animate-pulse"></div>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">{dietitian.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                <Award size={12} />
                                {dietitian.specialization}
                              </span>
                            </div>
                          </div>
                          {dietitian.is_online && (
                            <span className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-xl text-xs font-bold">
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                              Online
                            </span>
                          )}
                        </div>

                        {/* Rating & Experience */}
                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-400">★</span>
                            <span className="font-bold text-slate-700">{dietitian.rating || 5.0}</span>
                          </div>
                          <div className="h-4 w-px bg-slate-200"></div>
                          <span>{dietitian.experience_years || 0} tahun pengalaman</span>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {dietitian.bio || 'Ahli gizi berpengalaman siap membantu masalah nutrisi Anda.'}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3">
                        <button 
                          onClick={() => handleOpenChat(dietitian)}
                          disabled={loadingChat}
                          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200 disabled:opacity-70 disabled:cursor-wait"
                        >
                          <MessageCircle size={18} />
                          {loadingChat ? 'Menghubungkan...' : 'Chat Sekarang'}
                        </button>
                        <button className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-bold hover:border-blue-300 transition-all active:scale-95">
                          <Phone size={18} />
                          Telepon
                        </button>
                        <button className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-bold hover:border-blue-300 transition-all active:scale-95">
                          <Video size={18} />
                          Video Call
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
        <div className="bg-blue-50/50 p-8 rounded-[3rem] border border-blue-100/50 flex gap-5 backdrop-blur-sm">
          <MessageCircle className="text-blue-600 shrink-0" size={28} />
          <div className="space-y-2">
            <p className="text-[12px] text-slate-600 leading-relaxed font-medium">
              <strong className="text-blue-900">Dietisien (RD)</strong> adalah ahli gizi profesional...
            </p>
            <p className="text-[12px] text-slate-600 leading-relaxed font-medium">
              Chat langsung memudahkan Anda berkonsultasi kapan saja...
            </p>
          </div>
        </div>
      </div>

      {/* CHAT WINDOW (Single Instance, Logic Internal) */}
      {activeSession && (
        <ChatWindow 
          session={activeSession}
          onClose={() => setActiveSession(null)}
        />
      )}
    </>
  );
}