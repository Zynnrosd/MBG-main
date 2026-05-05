import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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

  // ✅ Cache guestId (biar gak ambil terus dari localStorage)
  const guestId = useRef(localStorage.getItem('mbg_guest_id'));

  const isOnline = session?.dietitian?.is_online;

  // =========================
  // FETCH & REALTIME
  // =========================
  useEffect(() => {
    if (!session?.id) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error(error);
      } else {
        setMessages(data || []);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`room_${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${session.id}`
        },
        (payload) => {
          setMessages(prev => {
            // ✅ Prevent duplicate (important)
            if (prev.find(m =>
              m.id === payload.new.id ||
              (m.content === payload.new.content && m.created_at === payload.new.created_at)
            )) return prev;

            return [...prev, payload.new];
          });

          if (payload.new.sender_id !== guestId.current) {
            setIsTyping(true);
            setTimeout(() => setIsTyping(false), 1500);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.id]);

  // =========================
  // AUTO SCROLL
  // =========================
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    if (isNearBottom || messages.length <= 1) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, viewState]);

  // =========================
  // SCROLL DETECTION
  // =========================
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let timeout;

    const handleScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        setShowScrollButton(scrollHeight - scrollTop - clientHeight > 200);
      }, 100);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // =========================
  // AUTO RESIZE INPUT
  // =========================
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height =
        Math.min(inputRef.current.scrollHeight, 128) + 'px';
    }
  }, [newMessage]);

  // =========================
  // SEND MESSAGE
  // =========================
  const send = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage;
    setNewMessage('');

    const tempId = `temp-${Date.now()}`;

    const tempMsg = {
      id: tempId,
      session_id: session.id,
      sender_id: guestId.current,
      content: text,
      created_at: new Date().toISOString(),
      status: 'sending',
      isTemp: true
    };

    setMessages(prev => [...prev, tempMsg]);

    const { data, error } = await supabase
      .from('messages')
      .insert([{
        session_id: session.id,
        sender_id: guestId.current,
        receiver_id: session.dietitian_id,
        content: text
      }])
      .select();

    if (error) {
      console.error(error);

      setMessages(prev =>
        prev.map(m =>
          m.id === tempId ? { ...m, status: 'failed' } : m
        )
      );
    } else {
      setMessages(prev =>
        prev.map(m =>
          m.id === tempId || (m.isTemp && m.content === text)
            ? { ...data[0], status: 'sent' }
            : m
        )
      );
    }
  };

  // =========================
  // KEYBOARD
  // =========================
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(e);
    }
  };

  // =========================
  // FORMAT TIME (OPTIMIZED)
  // =========================
  const formatMessageTime = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();

    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins}m`;
    if (hours < 24)
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    if (days === 1)
      return `Kemarin ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;

    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // =========================
  // GROUP MESSAGE (OPTIMIZED)
  // =========================
  const messageGroups = useMemo(() => {
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
  }, [messages]);

  if (!session) return null;

  // =========================
  // UI
  // =========================
  return (
    <div className="fixed inset-0 md:bottom-6 md:right-6 md:w-[420px] md:h-[640px] bg-white flex flex-col shadow-2xl z-50">
      
      {/* HEADER */}
      <div className="p-4 flex justify-between border-b">
        <div className="flex gap-2 items-center">
          <button onClick={onClose} className="md:hidden">
            <ChevronLeft />
          </button>

          <div>
            <h3 className="font-bold">
              {session.dietitian?.name || 'Ahli Gizi'}
            </h3>
            <p className="text-xs text-slate-400">
              {isTyping ? 'Mengetik...' : isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>

        <button onClick={onClose}>
          <X />
        </button>
      </div>

      {/* MESSAGES */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(messageGroups).map(([date, msgs]) => (
          <div key={date}>
            <div className="text-center text-xs text-slate-400 mb-2">{date}</div>

            {msgs.map(m => {
              const isMe = m.sender_id === guestId.current;

              return (
                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-xl text-sm ${isMe ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>
                    {m.content}
                    <div className="text-[10px] mt-1 opacity-70">
                      {formatMessageTime(m.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* INPUT */}
      <form onSubmit={send} className="p-4 flex gap-2 border-t">
        <textarea
          ref={inputRef}
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isOnline ? 'Tulis pesan...' : 'Offline...'}
          className="flex-1 border rounded-lg p-2 resize-none"
        />
        <button type="submit" disabled={!newMessage.trim()}>
          <Send />
        </button>
      </form>
    </div>
  );
}
