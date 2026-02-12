// src/components/ChatWindow.jsx

import { useState, useEffect, useRef } from 'react';
import { Send, X, Maximize2, Minimize2, MessageCircle } from 'lucide-react';
import { supabase } from '../config/supabase';

export default function ChatWindow({ session, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [viewState, setViewState] = useState('normal');
  const endRef = useRef(null);

  // 1. Load & Subscribe
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

    // Subscribe ke SEMUA pesan di sesi ini (baik dari user maupun dietisien)
    const channel = supabase.channel(`room_${session.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `session_id=eq.${session.id}` // Filter berdasarkan Sesi, bukan Sender
      }, 
      (payload) => {
        setMessages(prev => {
            // Cegah duplikasi jika realtime & fetch jalan bareng
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session?.id]);

  // 2. Auto Scroll
  useEffect(() => { 
    endRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages, viewState]);

  // 3. Kirim Pesan
  const send = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Optimistic Update (Tampil dulu sebelum sukses DB agar terasa cepat)
    const tempId = Date.now();
    const tempMsg = {
        id: tempId,
        session_id: session.id,
        sender_id: localStorage.getItem('mbg_guest_id'),
        content: newMessage,
        created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');

    const { error } = await supabase.from('messages').insert([{
      session_id: session.id,
      sender_id: localStorage.getItem('mbg_guest_id'),
      receiver_id: session.dietitian_id,
      content: tempMsg.content
    }]);

    if (error) {
        console.error("Gagal kirim:", error);
        // Hapus pesan jika gagal (opsional: kasih tanda merah)
        setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const style = () => {
    const base = "fixed transition-all duration-500 z-50 bg-white border shadow-2xl overflow-hidden flex flex-col";
    if (viewState === 'minimized') return `${base} bottom-6 right-6 w-[300px] h-[70px] rounded-2xl`;
    if (viewState === 'expanded') return `${base} inset-0 m-auto w-[90%] h-[85%] rounded-[3rem]`;
    return `${base} bottom-6 right-6 w-[380px] h-[580px] rounded-[2.5rem]`;
  };

  return (
    <div className={style()}>
      <div className="p-5 border-b flex justify-between items-center bg-white cursor-pointer" onClick={() => setViewState(viewState === 'minimized' ? 'normal' : 'minimized')}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white"><MessageCircle size={20}/></div>
          <span className="font-black italic text-sm">{session.dietitian?.name || 'Ahli Gizi'}</span>
        </div>
        <div className="flex gap-1">
          <button onClick={(e) => {e.stopPropagation(); setViewState(viewState === 'expanded' ? 'normal' : 'expanded')}} className="p-2 hover:bg-slate-50 rounded-xl">
            {viewState === 'expanded' ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}
          </button>
          <button onClick={onClose} className="p-2 text-red-500 rounded-xl"><X size={18}/></button>
        </div>
      </div>
      
      {viewState !== 'minimized' && (
        <>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
            {messages.map(m => {
              // Logic Penentuan Posisi Chat: Apakah ini saya?
              const isMe = m.sender_id === localStorage.getItem('mbg_guest_id');
              return (
                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-[1.5rem] font-bold text-sm ${
                    isMe 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white border text-slate-800 rounded-tl-none'
                  }`}>
                    {m.content}
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          
          <form onSubmit={send} className="p-6 border-t flex gap-2">
            <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Tulis pesan..." className="flex-1 p-3 bg-slate-50 rounded-xl outline-none font-bold border-2 border-transparent focus:border-blue-600"/>
            <button className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100"><Send size={20}/></button>
          </form>
        </>
      )}
    </div>
  );
}