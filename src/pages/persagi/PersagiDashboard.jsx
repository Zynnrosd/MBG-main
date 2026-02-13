import { useState, useEffect, useRef } from 'react';
import { MessageSquare, User, Search, Send, LogOut, CheckCircle, Stethoscope, Power } from 'lucide-react';
import { supabase } from '../../config/supabase';

export default function PersagiDashboard({ onLogout, user }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // --- STATE BARU: STATUS ONLINE/OFFLINE ---
  const [isOnline, setIsOnline] = useState(false);
  
  const messagesEndRef = useRef(null);

  // 1. Initial Load (Status Dokter & Sesi)
  useEffect(() => {
    if (!user?.id) return;

    // A. Ambil status Online/Offline saat ini
    const fetchStatus = async () => {
        const { data } = await supabase
            .from('doctors')
            .select('is_online')
            .eq('id', user.id)
            .single();
        if (data) setIsOnline(data.is_online);
    };
    fetchStatus();

    // B. Load Sesi
    loadSessions();

    const sessionSub = supabase
      .channel('dashboard_sessions')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chat_sessions',
        filter: `dietitian_id=eq.${user.id}`
      }, () => {
        loadSessions();
      })
      .subscribe();

    return () => { supabase.removeChannel(sessionSub); };
  }, [user]);

  // 2. Load Pesan & Realtime Chat
  useEffect(() => {
    if (selectedSession) {
      loadMessages(selectedSession.id);
      
      const msgSub = supabase
        .channel(`chat_${selectedSession.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${selectedSession.id}`
        }, (payload) => {
          setMessages(curr => {
            if (curr.find(m => m.id === payload.new.id)) return curr;
            return [...curr, payload.new];
          });
        })
        .subscribe();

      return () => { supabase.removeChannel(msgSub); };
    }
  }, [selectedSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- FUNGSI BARU: TOGGLE STATUS ---
  const toggleOnlineStatus = async () => {
      const newStatus = !isOnline;
      setIsOnline(newStatus); // Ubah UI dulu (Optimistic)

      const { error } = await supabase
        .from('doctors')
        .update({ is_online: newStatus })
        .eq('id', user.id);

      if (error) {
          console.error("Gagal update status:", error);
          setIsOnline(!newStatus); // Balikin jika gagal
          alert("Gagal mengubah status koneksi.");
      }
  };

  const loadSessions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('dietitian_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (sessionId) => {
    try {
        const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
        
        if (error) throw error;
        setMessages(data || []);
    } catch (err) {
        console.error("Gagal load pesan:", err);
        setMessages([]); 
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedSession) return;

    const text = newMessage;
    setNewMessage('');

    const { data: sentMsg, error } = await supabase
      .from('messages')
      .insert([{
        session_id: selectedSession.id,
        sender_id: user.id,
        receiver_id: selectedSession.user_guest_id,
        content: text
      }])
      .select()
      .single();

    if (error) {
        console.error("Gagal kirim:", error);
        alert("Gagal mengirim pesan");
        setNewMessage(text);
    } else if (sentMsg) {
        setMessages(prev => [...prev, sentMsg]);
    }
  };

  const handleCloseSession = async () => {
      if(!selectedSession) return;
      if(window.confirm("Apakah konsultasi ini sudah selesai? Sesi akan ditutup.")) {
          await supabase.from('chat_sessions').update({ status: 'closed' }).eq('id', selectedSession.id);
          setSelectedSession(null);
          loadSessions();
      }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredSessions = sessions.filter(session =>
    session.user_guest_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <div className="w-96 bg-white border-r border-slate-100 flex flex-col shadow-sm z-10">
        <div className="p-8 border-b border-slate-50">
          
          {/* PROFILE HEADER + STATUS SWITCH */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-[1.2rem] flex items-center justify-center text-white font-black shadow-lg shadow-blue-200 shrink-0">
               {user?.name?.charAt(0) || 'D'}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-black text-slate-900 tracking-tight truncate">
                {user?.name}
              </h1>
              
              {/* TOMBOL STATUS BARU */}
              <button 
                onClick={toggleOnlineStatus}
                className={`mt-1 flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 transform active:scale-95 ${
                    isOnline 
                    ? 'bg-green-100 text-green-600 hover:bg-green-200 ring-1 ring-green-200' 
                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200 ring-1 ring-slate-200'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ID Pasien..."
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-blue-600 transition-all placeholder:text-slate-300"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="text-center py-10 space-y-3">
               <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Memuat Antrean...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tidak ada sesi aktif</p>
            </div>
          ) : (
            filteredSessions.map(session => (
              <button
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className={`w-full p-5 rounded-[2rem] text-left transition-all duration-300 group ${
                  selectedSession?.id === session.id 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 scale-100' 
                    : 'bg-white hover:bg-slate-50 border border-slate-100 hover:border-blue-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      selectedSession?.id === session.id ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <User size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                        <p className={`font-black text-xs uppercase tracking-widest truncate ${selectedSession?.id === session.id ? 'text-white' : 'text-slate-900'}`}>
                        Guest User
                        </p>
                        <span className={`text-[9px] font-bold ${selectedSession?.id === session.id ? 'text-blue-100' : 'text-slate-400'}`}>
                            {formatTime(session.created_at)}
                        </span>
                    </div>
                    <p className={`text-[10px] font-medium truncate ${selectedSession?.id === session.id ? 'text-blue-100' : 'text-slate-500'}`}>
                      ID: #{session.user_guest_id ? session.user_guest_id.slice(0, 8) : 'Unknown'}...
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-6 border-t border-slate-50">
            <button
              onClick={onLogout}
              className="w-full py-4 flex items-center justify-center gap-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
            >
              <LogOut size={16} /> Keluar Aplikasi
            </button>
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col bg-slate-50/50 relative">
        {selectedSession ? (
          <>
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 p-6 flex justify-between items-center sticky top-0 z-20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white border-2 border-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                  <User size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Konsultasi Aktif</p>
                  <p className="font-black text-slate-900 text-lg italic">
                    Guest #{selectedSession.user_guest_id ? selectedSession.user_guest_id.slice(0, 6) : 'User'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                  <button 
                    onClick={handleCloseSession}
                    className="flex items-center gap-2 px-6 py-3 bg-green-50 text-green-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-green-600 hover:text-white transition-all shadow-sm"
                  >
                    <CheckCircle size={16} /> Selesaikan
                  </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="flex justify-center">
                  <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Sesi Dimulai
                  </span>
              </div>
              
              {messages.map(msg => {
                const isMe = user?.id && msg?.sender_id && (msg.sender_id === user.id);
                
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                    <div className={`max-w-[70%] p-5 shadow-sm text-sm font-bold leading-relaxed ${
                      isMe 
                        ? 'bg-blue-600 text-white rounded-[2rem] rounded-tr-none' 
                        : 'bg-white text-slate-800 border border-slate-100 rounded-[2rem] rounded-tl-none'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content || '(Pesan Kosong)'}</p>
                      <p className={`text-[9px] font-black text-right mt-2 ${isMe ? 'text-blue-200' : 'text-slate-300'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="bg-white border-t border-slate-100 p-6 flex gap-4 items-end">
              <div className="flex-1 bg-slate-50 rounded-[2rem] border-2 border-transparent focus-within:border-blue-600 focus-within:bg-white transition-all flex items-center p-2">
                 <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if(e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                        }
                    }}
                    placeholder="Berikan saran gizi terbaik Anda..."
                    className="w-full bg-transparent border-none outline-none text-sm font-bold px-4 py-3 resize-none max-h-32 text-slate-900 placeholder:text-slate-300"
                    rows="1"
                 />
              </div>
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-5 bg-blue-600 text-white rounded-[2rem] hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 disabled:shadow-none active:scale-90"
              >
                <Send size={24} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 space-y-6">
            <div className="w-32 h-32 bg-white rounded-[3rem] flex items-center justify-center shadow-sm border border-slate-100 relative">
               <Stethoscope className="w-12 h-12 text-slate-200" />
               <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full animate-bounce"></div>
            </div>
            <div>
                <h3 className="text-2xl font-black text-slate-900 italic">Selamat Bertugas, {user?.name || 'Ahli Gizi'}</h3>
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-2 mb-6">Pilih antrean di sebelah kiri untuk memulai chat</p>
                
                {/* BIG STATUS INDICATOR (UNTUK KEJELASAN) */}
                <div className={`inline-flex items-center gap-3 px-6 py-4 rounded-3xl transition-all ${
                    isOnline 
                    ? 'bg-green-50 border border-green-100 text-green-700' 
                    : 'bg-slate-50 border border-slate-100 text-slate-500'
                }`}>
                    <Power size={20} className={isOnline ? 'fill-green-600' : ''} />
                    <span className="font-bold text-sm">Status Anda Saat Ini: {isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}