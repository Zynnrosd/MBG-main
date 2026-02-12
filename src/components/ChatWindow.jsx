import { useState, useEffect, useRef } from 'react';
import { Send, X, ArrowLeft, User, Minimize2, Maximize2 } from 'lucide-react';
import { supabase } from '../config/supabase';

export default function ChatWindow({ session, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [viewState, setViewState] = useState('normal');
  const messagesEndRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const getContainerStyle = () => {
    if (isMobile) {
        return 'fixed inset-0 w-full h-full bg-white flex flex-col z-[9999]'; 
    }

    const baseStyle = "fixed bottom-0 right-6 bg-white border-2 border-slate-200 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden flex flex-col z-50 rounded-t-2xl";
    
    switch (viewState) {
        case 'minimized':
            return `${baseStyle} w-[340px] h-[60px]`;
        case 'expanded':
            return `${baseStyle} w-[800px] h-[650px] right-[50%] translate-x-[50%]`;
        case 'normal':
        default:
            return `${baseStyle} w-[380px] h-[560px]`;
    }
  };

  return (
    <div className={getContainerStyle()}>
      
      {/* HEADER */}
      <div 
        className="bg-blue-600 text-white p-4 flex items-center justify-between shadow-lg shrink-0 cursor-pointer select-none"
        onClick={() => !isMobile && setViewState(viewState === 'minimized' ? 'normal' : 'minimized')}
      >
        <div className="flex items-center gap-3">
          {isMobile && (
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 -ml-1">
              <ArrowLeft size={20} />
            </button>
          )}
          
          <div className="relative">
            {session.dietitian?.photo_url ? (
                <img 
                src={session.dietitian.photo_url} 
                className="w-11 h-11 rounded-full object-cover bg-white border-2 border-blue-400"
                alt="Avatar"
                />
            ) : (
                <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
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
            <p className="text-xs text-blue-100 opacity-90">
              {session.dietitian?.is_online ? 'Sedang Aktif' : 'Offline'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
           {!isMobile && (
               <>
                   <button 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        setViewState(viewState === 'expanded' ? 'normal' : 'expanded'); 
                    }} 
                    className="p-2 hover:bg-white/10 rounded-lg transition"
                    title={viewState === 'expanded' ? "Normal" : "Perbesar"}
                   >
                       <Maximize2 size={16}/>
                   </button>

                   <button 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        setViewState(viewState === 'minimized' ? 'normal' : 'minimized'); 
                    }} 
                    className="p-2 hover:bg-white/10 rounded-lg transition"
                    title={viewState === 'minimized' ? "Buka" : "Minimalkan"}
                   >
                       <Minimize2 size={16}/>
                   </button>
               </>
           )}
           
           <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }} 
            className="p-2 hover:bg-red-500/20 hover:text-red-100 rounded-lg transition ml-1"
           >
               <X size={18}/>
           </button>
        </div>
      </div>

      {viewState !== 'minimized' && (
        <>
            {/* AREA PESAN */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                <div className="flex justify-center my-3">
                    <span className="text-xs text-slate-500 bg-white px-4 py-1.5 rounded-full shadow-sm border border-slate-200">
                        Konsultasi dimulai
                    </span>
                </div>

                {messages.map((msg) => {
                const isMe = msg.sender_type === 'user';
                return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div 
                            className={`relative max-w-[85%] px-4 py-2.5 text-sm rounded-2xl shadow-sm 
                            ${isMe 
                                ? 'bg-blue-600 text-white rounded-br-sm' 
                                : 'bg-white text-slate-700 border border-slate-200 rounded-bl-sm'
                            }`}
                        >
                            <p className="leading-relaxed pb-1 whitespace-pre-wrap">{msg.message_text}</p>
                            <p className={`text-xs text-right ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                                {formatTime(msg.created_at)}
                            </p>
                        </div>
                    </div>
                );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* INPUT AREA */}
            <form onSubmit={handleSend} className="bg-white p-4 border-t border-slate-200 flex items-end gap-2 shrink-0 z-20 safe-area-bottom">
                <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                    placeholder="Ketik pesan..."
                    className="flex-1 px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 text-sm resize-none focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
                    rows="2"
                />
                
                <button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-200 font-semibold text-sm shrink-0"
                >
                    <Send size={18}/>
                </button>
            </form>
        </>
      )}
    </div>
  );
}