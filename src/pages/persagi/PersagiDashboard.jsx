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
  const [isOnline, setIsOnline] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchStatus = async () => {
      const { data } = await supabase
        .from('doctors')
        .select('is_online')
        .eq('id', user.id)
        .single();

      if (data) setIsOnline(data.is_online);
    };

    fetchStatus();
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

    return () => {
      supabase.removeChannel(sessionSub);
    };
  }, [user]);

  useEffect(() => {
    if (!selectedSession) return;

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

    return () => {
      supabase.removeChannel(msgSub);
    };
  }, [selectedSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleOnlineStatus = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);

    const { error } = await supabase
      .from('doctors')
      .update({ is_online: newStatus })
      .eq('id', user.id);

    if (error) {
      console.error(error);
      setIsOnline(!newStatus);
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
      console.error(error);
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
      console.error(err);
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
      console.error(error);
      alert("Gagal mengirim pesan");
      setNewMessage(text);
    } else if (sentMsg) {
      setMessages(prev => [...prev, sentMsg]);
    }
  };

  const handleCloseSession = async () => {
    if (!selectedSession) return;

    if (window.confirm("Apakah konsultasi ini sudah selesai? Sesi akan ditutup.")) {
      await supabase
        .from('chat_sessions')
        .update({ status: 'closed' })
        .eq('id', selectedSession.id);

      setSelectedSession(null);
      loadSessions();
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredSessions = sessions.filter(session =>
    session.user_guest_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">

      <div className="w-96 bg-white border-r border-slate-100 flex flex-col shadow-sm z-10">
        <div className="p-8 border-b border-slate-50">

          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-[1.2rem] flex items-center justify-center text-white font-black shadow-lg shadow-blue-200 shrink-0">
              {user?.name?.charAt(0) || 'D'}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-black text-slate-900 tracking-tight truncate">
                {user?.name}
              </h1>

              <button
                onClick={toggleOnlineStatus}
                className={`mt-1 flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95 ${
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
            <div className="text-center py-10">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            </div>
          ) : (
            filteredSessions.map(session => (
              <button
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className={`w-full p-5 rounded-[2rem] text-left ${
                  selectedSession?.id === session.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white hover:bg-slate-50 border border-slate-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <User size={20} />
                  <div className="flex-1">
                    <p className="font-bold text-xs">Guest User</p>
                    <p className="text-[10px]">
                      #{session.user_guest_id?.slice(0, 8)}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-6 border-t">
          <button
            onClick={onLogout}
            className="w-full py-4 text-red-500 bg-red-50 rounded-2xl font-bold"
          >
            Keluar
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedSession ? (
          <>
            <div className="p-4 border-b flex justify-between">
              <p>Guest #{selectedSession.user_guest_id?.slice(0, 6)}</p>
              <button onClick={handleCloseSession}>
                <CheckCircle />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {messages.map(msg => {
                const isMe = msg.sender_id === user.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded ${isMe ? 'bg-blue-600 text-white' : 'bg-white'}`}>
                      {msg.content}
                      <div className="text-xs">
                        {formatTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 flex gap-2">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 border rounded"
              />
              <button type="submit">
                <Send />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Stethoscope />
          </div>
        )}
      </div>
    </div>
  );
}
