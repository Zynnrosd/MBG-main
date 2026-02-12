import { useState, useEffect } from 'react';
import { MessageSquare, Clock, User, Search, Send, LogOut, Check, CheckCheck } from 'lucide-react';
import { supabase, signOut, getCurrentUser } from '../../config/supabase';
import logoUrl from '../../assets/LOGORN.png';

export default function PersagiDashboard({ onLogout }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
    loadSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadMessages(selectedSession.id);
      subscribeToMessages(selectedSession.id);
    }
  }, [selectedSession]);

  const loadUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const loadSessions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select(`
          *,
          chat_messages (
            message_text,
            created_at,
            sender_type
          )
        `)
        .eq('status', 'active')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      const sessionsWithLastMessage = data.map(session => ({
        ...session,
        lastMessage: session.chat_messages?.[session.chat_messages.length - 1] || null,
        unreadCount: session.chat_messages?.filter(m => m.sender_type === 'user' && !m.is_read).length || 0
      }));
      
      setSessions(sessionsWithLastMessage);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (sessionId) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    
    if (!error) {
      setMessages(data || []);
      // Mark messages as read
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('session_id', sessionId)
        .eq('sender_type', 'user')
        .eq('is_read', false);
    }
  };

  const subscribeToMessages = (sessionId) => {
    const channel = supabase
      .channel(`chat_session:${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        setMessages(current => [...current, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedSession) return;

    const text = newMessage;
    setNewMessage('');

    const { error } = await supabase.from('chat_messages').insert([{
      session_id: selectedSession.id,
      sender_type: 'dietitian',
      message_text: text,
      is_read: false
    }]);

    if (!error) {
      // Update session timestamp
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedSession.id);
      
      loadMessages(selectedSession.id);
      loadSessions();
    }
  };

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}j`;
    if (days < 7) return `${days}h`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const filteredSessions = sessions.filter(session =>
    session.user_guest_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-50">
      
      {/* Sidebar - Sessions List */}
      <div className="w-full md:w-96 bg-white border-r border-slate-200 flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <img src={logoUrl} alt="Logo" className="w-6 h-6 object-contain" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Portal PERSAGI</h1>
                <p className="text-xs text-slate-500">Konsultasi Gizi</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              title="Keluar"
            >
              <LogOut size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari sesi konsultasi..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-transparent rounded-xl text-sm outline-none focus:bg-white focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center p-12">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">Belum ada sesi konsultasi</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredSessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`w-full p-4 hover:bg-slate-50 transition-all text-left ${
                    selectedSession?.id === session.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                      <User size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-slate-900 truncate">
                          User #{session.user_guest_id?.slice(0, 8)}
                        </p>
                        {session.unreadCount > 0 && (
                          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {session.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 truncate">
                        {session.lastMessage?.message_text || 'Belum ada pesan'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={12} className="text-slate-400" />
                        <span className="text-xs text-slate-400">
                          {session.lastMessage ? formatTime(session.lastMessage.created_at) : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedSession ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  <User size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">User #{selectedSession.user_guest_id?.slice(0, 8)}</p>
                  <p className="text-sm text-slate-500">Konsultasi Gizi Aktif</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
              {messages.map(msg => {
                const isFromDietitian = msg.sender_type === 'dietitian';
                return (
                  <div key={msg.id} className={`flex ${isFromDietitian ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${isFromDietitian ? '' : 'flex items-start gap-2'}`}>
                      {!isFromDietitian && (
                        <div className="w-8 h-8 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                          <User size={16} />
                        </div>
                      )}
                      <div>
                        <div className={`px-4 py-3 rounded-2xl ${
                          isFromDietitian
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                        }`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message_text}</p>
                        </div>
                        <div className={`flex items-center gap-1 mt-1 ${isFromDietitian ? 'justify-end' : ''}`}>
                          <span className="text-xs text-slate-400">
                            {new Date(msg.created_at).toLocaleTimeString('id-ID', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          {isFromDietitian && (
                            msg.is_read ? 
                              <CheckCheck size={14} className="text-blue-400" /> : 
                              <Check size={14} className="text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="bg-white border-t border-slate-200 p-4">
              <div className="flex items-end gap-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Ketik balasan Anda..."
                  className="flex-1 px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm resize-none outline-none focus:bg-white focus:border-blue-500 transition-all"
                  rows="2"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                >
                  <Send size={18} />
                  <span>Kirim</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-50">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Pilih sesi konsultasi untuk mulai membalas</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}