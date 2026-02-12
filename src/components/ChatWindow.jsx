import { useState, useEffect, useRef } from 'react';
import { Send, X, ArrowLeft, Paperclip, Minimize2, Maximize2, User, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '../config/supabase';

export default function ChatWindow({ session, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  // View State: 'normal', 'minimized', 'expanded'
  const [viewState, setViewState] = useState('normal');
  
  const messagesEndRef = useRef(null);
  
  // Ubah breakpoint ke 1024 agar Tablet juga dapat tampilan Fullscreen yang nyaman
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Listener Resize untuk Responsivitas
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. Load Pesan & Realtime
  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`chat_room:${session.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `session_id=eq.${session.id}`
      }, (payload) => {
        setMessages((current) => {
            if (current.find(m => m.id === payload.new.id)) return current;
            return [...current, payload.new];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session.id]);

  // Auto Scroll ke bawah
  useEffect(() => {
    if (viewState !== 'minimized') {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, viewState]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage;
    setNewMessage(''); 

    const { error } = await supabase.from('chat_messages').insert([{
      session_id: session.id,
      sender_type: 'user', 
      message_text: text,
      is_read: false
    }]);

    if (error) {
        console.error('Gagal kirim:', error);
        alert('Gagal mengirim pesan');
    } else {
        fetchMessages();
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  // --- LOGIC STYLE CONTAINER ---
  const getContainerStyle = () => {
    // 1. MODE MOBILE / TABLET (Fullscreen)
    if (isMobile) {
        // 'inset-0' memaksa elemen menempel ke 4 sisi layar
        // 'fixed' agar tidak ikut scroll body utama
        // 'z-50' agar di atas segalanya
        return 'fixed inset-0 w-full h-full bg-white flex flex-col z-[9999]'; 
    }

    // 2. MODE DESKTOP (Widget)
    const baseStyle = "fixed bottom-0 right-4 bg-white border border-slate-300 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden flex flex-col z-50";
    
    switch (viewState) {
        case 'minimized':
            return `${baseStyle} w-[300px] h-[55px] rounded-t-xl`; // Hanya header
        case 'expanded':
            return `${baseStyle} w-[800px] h-[600px] rounded-t-xl right-[50%] translate-x-[50%]`; // Mode Lebar (Tengah)
        case 'normal':
        default:
            return `${baseStyle} w-[360px] h-[520px] rounded-t-xl`; // Ukuran Standar
    }
  };

  return (
    <div className={getContainerStyle()}>
      
      {/* HEADER */}
      <div 
        className="bg-blue-600 text-white p-3 flex items-center justify-between shadow-md shrink-0 cursor-pointer select-none"
        onClick={() => !isMobile && setViewState(viewState === 'minimized' ? 'normal' : 'minimized')}
      >
        <div className="flex items-center gap-3">
          {isMobile && (
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 -ml-1">
              <ArrowLeft size={22} />
            </button>
          )}
          
          <div className="relative">
            {session.dietitian?.photo_url ? (
                <img 
                src={session.dietitian.photo_url} 
                className="w-10 h-10 rounded-full object-cover bg-white border-2 border-blue-400"
                alt="Avatar"
                />
            ) : (
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <User size={20} />
                </div>
            )}
            
            {session.dietitian?.is_online && (
               <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-blue-600"></div>
            )}
          </div>
          
          <div className="flex flex-col">
            <h3 className="font-bold text-sm leading-tight truncate max-w-[180px]">
              {session.dietitian?.name || 'Ahli Gizi'}
            </h3>
            <p className="text-[11px] text-blue-100 opacity-90">
              {session.dietitian?.is_online ? '• Online' : 'Offline'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
           {/* Tombol Control Desktop */}
           {!isMobile && (
               <>
                   {/* Maximize / Expand */}
                   <button 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        setViewState(viewState === 'expanded' ? 'normal' : 'expanded'); 
                    }} 
                    className="p-1.5 hover:bg-white/10 rounded-lg transition"
                    title={viewState === 'expanded' ? "Kecilkan" : "Perbesar"}
                   >
                       {viewState === 'expanded' ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}
                   </button>

                   {/* Minimize / Collapse */}
                   <button 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        setViewState(viewState === 'minimized' ? 'normal' : 'minimized'); 
                    }} 
                    className="p-1.5 hover:bg-white/10 rounded-lg transition"
                   >
                       {viewState === 'minimized' ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                   </button>
               </>
           )}
           
           {/* Close Button */}
           <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }} 
            className="p-1.5 hover:bg-red-500/20 hover:text-red-100 rounded-lg transition"
           >
               <X size={20}/>
           </button>
        </div>
      </div>

      {/* ISI CHAT (Hidden jika Minimized) */}
      {viewState !== 'minimized' && (
        <>
            {/* AREA PESAN (Flex Grow) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100/50">
                <div className="flex justify-center my-4">
                    <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-4 py-1.5 rounded-full shadow-sm">
                        🔒 Sesi konsultasi privat dimulai
                    </span>
                </div>

                {messages.map((msg) => {
                const isMe = msg.sender_type === 'user';
                return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div 
                            className={`relative max-w-[85%] px-4 py-2.5 text-sm rounded-2xl shadow-sm 
                            ${isMe 
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                            }`}
                        >
                            <p className="leading-relaxed pb-1 whitespace-pre-wrap">{msg.message_text}</p>
                            <p className={`text-[9px] text-right ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                                {formatTime(msg.created_at)}
                            </p>
                        </div>
                    </div>
                );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* INPUT AREA (Fixed at Bottom) */}
            <form onSubmit={handleSend} className="bg-white p-3 border-t border-slate-200 flex items-center gap-2 shrink-0 z-20 safe-area-bottom">
                <button type="button" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition">
                    <Paperclip size={22}/>
                </button>
                
                <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Tulis pesan..."
                    className="flex-1 py-3 px-5 rounded-full border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-slate-400"
                    // autoFocus={!isMobile} // Disable autofocus on mobile to prevent keyboard jumping
                />
                
                <button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-200"
                >
                    <Send size={20} className={newMessage.trim() ? "translate-x-0.5" : ""}/>
                </button>
            </form>
        </>
      )}
    </div>
  );
}