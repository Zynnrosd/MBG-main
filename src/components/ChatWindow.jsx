// src/components/ChatWindow.jsx - WhatsApp Style Chat
import { useState, useEffect, useRef } from 'react';
import { X, Send, Circle } from 'lucide-react';
import { supabase } from '../config/supabase';

export default function ChatWindow({ dietitian, currentUser, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initializeConversation();
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      subscribeToMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeConversation = async () => {
    try {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('dietitian_id', dietitian.id)
        .single();

      if (existing) {
        setConversationId(existing.id);
      } else {
        // Create new conversation
        const { data: newConv } = await supabase
          .from('chat_conversations')
          .insert([{
            user_id: currentUser.id,
            dietitian_id: dietitian.id,
            status: 'active'
          }])
          .select()
          .single();
        
        setConversationId(newConv.id);
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    setMessages(data || []);
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel(`conversation-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId) return;

    try {
      const { error } = await supabase.from('chat_messages').insert([{
        conversation_id: conversationId,
        sender_type: 'user',
        sender_id: currentUser.id,
        message_text: newMessage.trim(),
        is_read: false
      }]);

      if (!error) {
        // Update last message in conversation
        await supabase.from('chat_conversations').update({
          last_message: newMessage.trim(),
          last_message_at: new Date().toISOString()
        }).eq('id', conversationId);

        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-3xl shadow-2xl flex flex-col border-2 border-slate-100 z-50 animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-3xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={dietitian.photo_url || 'https://via.placeholder.com/40'} 
              alt={dietitian.name}
              className="w-10 h-10 rounded-full border-2 border-white"
            />
            {dietitian.is_online && (
              <Circle className="absolute bottom-0 right-0 w-3 h-3 fill-green-400 text-green-400 border-2 border-white rounded-full" />
            )}
          </div>
          <div>
            <p className="font-bold text-sm">{dietitian.name}</p>
            <p className="text-xs opacity-90">{dietitian.is_online ? 'Online' : 'Offline'}</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-all"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-slate-500">Memuat percakapan...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Send className="text-blue-600" size={24} />
              </div>
              <p className="text-sm text-slate-600 font-medium">Mulai percakapan</p>
              <p className="text-xs text-slate-400">Kirim pesan pertama Anda</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isUser = msg.sender_type === 'user';
              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${isUser ? 'order-2' : 'order-1'}`}>
                    <div className={`p-3 rounded-2xl ${
                      isUser 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-white text-slate-800 rounded-bl-none shadow border border-slate-100'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message_text}</p>
                      <p className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-slate-400'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white rounded-b-3xl">
        <div className="flex gap-2">
          <input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ketik pesan..."
            className="flex-1 p-3 border-2 border-slate-200 rounded-full outline-none focus:border-blue-500 text-sm"
            disabled={loading}
          />
          <button 
            onClick={sendMessage}
            disabled={!newMessage.trim() || loading}
            className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}