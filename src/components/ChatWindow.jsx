import { useState, useEffect, useRef } from 'react';
import { Send, X, Maximize2, Minimize2, MessageCircle, ChevronLeft, Check, CheckCheck } from 'lucide-react';
import { supabase } from '../config/supabase';

export default function ChatWindow({ session, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [viewState, setViewState] = useState('normal');
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const endRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Ambil status online dari props session
  const isOnline = session.dietitian?.is_online;

  // 1. Load & Subscribe Messages
  useEffect(() => {
    if (!session?.id) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true });
      setMessages(data || []);
    };

    fetchMessages();

    const channel = supabase.channel(`room_${session.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `session_id=eq.${session.id}` 
      }, 
      (payload) => {
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
        // Simulasi typing indicator dari dietitian
        if (payload.new.sender_id !== localStorage.getItem('mbg_guest_id')) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 1500);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session?.id]);

  // 2. Auto Scroll dengan smooth behavior
  useEffect(() => { 
    const scrollToBottom = () => {
      if (messagesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        
        if (isNearBottom || messages.length <= 1) {
          endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }
    };
    
    scrollToBottom();
  }, [messages, viewState]);

  // 3. Detect scroll position untuk show scroll button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isScrolledUp = scrollHeight - scrollTop - clientHeight > 200;
      setShowScrollButton(isScrolledUp);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // 4. Auto-focus input saat window dibuka
  useEffect(() => {
    if (viewState !== 'minimized') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [viewState]);

  // 5. Logic Kirim Pesan
  const send = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage;
    setNewMessage('');

    // Optimistic Update dengan status "sending"
    const tempId = `temp-${Date.now()}`;
    const tempMsg = {
      id: tempId,
      session_id: session.id,
      sender_id: localStorage.getItem('mbg_guest_id'),
      content: text,
      created_at: new Date().toISOString(),
      status: 'sending' // Status sementara
    };
    setMessages(prev => [...prev, tempMsg]);

    const { data, error } = await supabase.from('messages').insert([{
      session_id: session.id,
      sender_id: localStorage.getItem('mbg_guest_id'),
      receiver_id: session.dietitian_id,
      content: text
    }]).select();

    if (error) {
      console.error("Gagal kirim:", error);
      // Update status ke "failed"
      setMessages(prev => prev.map(m => 
        m.id === tempId ? { ...m, status: 'failed' } : m
      ));
    } else {
      // Replace temp message dengan message asli dari database
      setMessages(prev => prev.map(m => 
        m.id === tempId ? { ...data[0], status: 'sent' } : m
      ));
    }
  };

  // 6. Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(e);
    }
  };

  // 7. Scroll to bottom manually
  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  // 8. Format timestamp
  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return 'Baru saja';
    if (diffInMins < 60) return `${diffInMins}m`;
    if (diffInHours < 24) return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    if (diffInDays === 1) return `Kemarin ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  // 9. Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(msg => {
      const date = new Date(msg.created_at).toLocaleDateString('id-ID', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  // --- LOGIC STYLE RESPONSIVE ---
  const getContainerStyle = () => {
    const mobileStyle = "fixed inset-0 w-full h-full bg-white z-[9999] flex flex-col font-sans";
    const desktopBase = "md:fixed md:z-[9999] md:bg-white md:shadow-2xl md:border md:border-slate-200 md:flex md:flex-col md:transition-all md:duration-300 md:overflow-hidden";

    if (viewState === 'minimized') {
      return `hidden md:flex ${desktopBase} md:bottom-6 md:right-6 md:w-[340px] md:h-[72px] md:rounded-2xl`;
    }

    if (viewState === 'expanded') {
      return `${mobileStyle} md:inset-10 md:w-auto md:h-auto md:rounded-[3rem] md:shadow-2xl md:border`;
    }

    return `${mobileStyle} md:bottom-6 md:right-6 md:left-auto md:top-auto md:w-[420px] md:h-[640px] md:rounded-[2.5rem] md:shadow-2xl md:border md:border-slate-200`;
  };

  return (
    <div className={getContainerStyle()}>
      
      {/* HEADER - Enhanced */}
      <div 
        className={`p-4 md:p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-white to-blue-50/30 shrink-0 backdrop-blur-sm
          ${viewState === 'minimized' ? 'cursor-pointer hover:bg-slate-50' : ''} 
          pointer-events-none md:pointer-events-auto transition-colors
        `}
        onClick={() => {
          if (window.innerWidth >= 768) {
            setViewState(viewState === 'minimized' ? 'normal' : 'minimized');
          }
        }}
      >
        <div className="flex items-center gap-3">
          {/* Back Button Mobile */}
          <button 
            onClick={onClose}
            className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 active:scale-95 transition-all pointer-events-auto"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Avatar dengan Online Indicator Dinamis */}
          <div className="relative">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-200 ring-2 ring-white">
              {session.dietitian?.photo_url ? (
                <img src={session.dietitian.photo_url} className="w-full h-full object-cover rounded-xl" alt="" />
              ) : (
                <MessageCircle size={20}/>
              )}
            </div>
            {/* Logic Indicator Online/Offline */}
            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                isOnline ? 'bg-green-500' : 'bg-slate-400'
            }`}>
              {/* Ping Animation hanya jika Online */}
              {isOnline && <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>}
            </div>
          </div>

          {/* Dietitian Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-slate-900 text-sm truncate">
              {session.dietitian?.name || 'Ahli Gizi'}
            </h3>
            {viewState !== 'minimized' && (
              <p className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${
                  isTyping || isOnline ? 'text-green-600' : 'text-slate-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                    isTyping || isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-400'
                }`}></span> 
                {isTyping ? 'Sedang mengetik...' : (isOnline ? 'Online' : 'Offline')}
              </p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-1 pointer-events-auto">
          {/* Maximize/Minimize */}
          <button 
            onClick={(e) => {e.stopPropagation(); setViewState(viewState === 'expanded' ? 'normal' : 'expanded')}} 
            className="hidden md:block p-2 hover:bg-white rounded-xl text-slate-400 hover:text-blue-600 transition-all active:scale-95"
          >
            {viewState === 'expanded' ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}
          </button>
          
          {/* Close */}
          <button 
            onClick={(e) => {
              e.stopPropagation(); 
              onClose();
            }} 
            className="hidden md:block p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95"
          >
            <X size={18}/>
          </button>
        </div>
      </div>
      
      {/* CONTENT */}
      {viewState !== 'minimized' && (
        <>
          {/* Messages Area - Enhanced */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-gradient-to-b from-slate-50/50 to-white relative"
          >
            {/* Date Grouping */}
            {Object.entries(messageGroups).map(([date, msgs]) => (
              <div key={date} className="space-y-4">
                {/* Date Separator */}
                <div className="flex justify-center py-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-4 py-1.5 rounded-full shadow-sm border border-slate-100">
                    {date}
                  </span>
                </div>

                {/* Messages */}
                {msgs.map((m, idx) => {
                  const isMe = m.sender_id === localStorage.getItem('mbg_guest_id');
                  const showAvatar = !isMe && (idx === 0 || msgs[idx-1].sender_id !== m.sender_id);
                  
                  return (
                    <div key={m.id} className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                      {/* Avatar for dietitian */}
                      {!isMe && (
                        <div className={`w-8 h-8 shrink-0 ${showAvatar ? '' : 'opacity-0'}`}>
                          {showAvatar && (
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                              {session.dietitian?.name?.[0] || 'D'}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div className={`max-w-[75%] md:max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div className={`p-4 text-sm font-medium leading-relaxed shadow-sm transition-all hover:shadow-md ${
                          isMe 
                            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-[1.5rem] rounded-tr-md' 
                            : 'bg-white border border-slate-200 text-slate-700 rounded-[1.5rem] rounded-tl-md'
                        }`}>
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          
                          {/* Time & Status */}
                          <div className={`flex items-center gap-1.5 mt-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <p className={`text-[9px] font-bold ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                              {formatMessageTime(m.created_at)}
                            </p>
                            {isMe && (
                              <span className="text-blue-100">
                                {m.status === 'sending' ? (
                                  <Check size={12} className="opacity-50" />
                                ) : m.status === 'failed' ? (
                                  <X size={12} className="text-red-300" />
                                ) : (
                                  <CheckCheck size={12} />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Spacer for alignment */}
                      {isMe && <div className="w-8 shrink-0"></div>}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-2 justify-start animate-in fade-in slide-in-from-bottom-2">
                <div className="w-8 h-8 shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {session.dietitian?.name?.[0] || 'D'}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-[1.5rem] rounded-tl-md p-4 shadow-sm">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={endRef} />

            {/* Scroll to Bottom Button */}
            {showScrollButton && (
              <button
                onClick={scrollToBottom}
                className="fixed bottom-24 md:bottom-32 right-8 md:right-12 w-10 h-10 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-200 flex items-center justify-center hover:bg-blue-700 transition-all active:scale-95 animate-in fade-in zoom-in"
              >
                <ChevronLeft size={20} className="rotate-[-90deg]" />
              </button>
            )}
          </div>
          
          {/* INPUT AREA - Enhanced */}
          <div className="p-4 md:p-5 bg-white border-t border-slate-100 shrink-0 pb-8 md:pb-5">
            <form onSubmit={send} className="flex gap-2 md:gap-3 items-end">
              {/* Message Input */}
              <div className="flex-1 bg-slate-50 rounded-[1.5rem] border-2 border-transparent focus-within:border-blue-600 focus-within:bg-white focus-within:shadow-sm transition-all flex items-center overflow-hidden">
                <textarea
                  ref={inputRef}
                  value={newMessage} 
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  // Placeholder dinamis: Berubah jika Offline
                  placeholder={isOnline ? "Tulis pesan..." : "Tinggalkan pesan (Offline)..."} 
                  rows="1"
                  className="w-full bg-transparent border-none outline-none text-sm font-medium px-5 py-3.5 text-slate-900 placeholder:text-slate-400 resize-none max-h-32"
                  style={{
                    height: 'auto',
                    minHeight: '48px'
                  }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                  }}
                />
              </div>

              {/* Send Button */}
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="p-3.5 md:p-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full md:rounded-xl shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none disabled:from-slate-300 disabled:to-slate-400 active:scale-95 transition-all hover:shadow-xl hover:shadow-blue-300"
              >
                <Send size={20} className={newMessage.trim() ? 'animate-pulse' : ''}/>
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}