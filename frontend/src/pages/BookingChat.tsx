import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, Send } from 'lucide-react';

const client = createClient();

interface Message {
  id: number;
  booking_id: number;
  sender_role: string;
  content: string;
  created_at: string | null;
}

export default function BookingChat() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuthAndLoad();
  }, [bookingId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkAuthAndLoad = async () => {
    try {
      const res = await client.auth.me();
      if (!res?.data) {
        client.auth.toLogin();
        return;
      }
      loadMessages();
    } catch {
      client.auth.toLogin();
    }
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await client.apiCall.invoke({
        url: `/api/v1/guide/messages/${bookingId}`,
        method: 'GET',
        data: {},
      });
      setMessages(response.data?.items || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const response = await client.apiCall.invoke({
        url: '/api/v1/guide/messages/send',
        method: 'POST',
        data: {
          booking_id: parseInt(bookingId || '0'),
          content: newMessage.trim(),
        },
      });
      setMessages((prev) => [...prev, response.data]);
      setNewMessage('');
    } catch (error: any) {
      alert(error?.data?.detail || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="w-5 h-5 text-[#1A1A2E]" />
        </button>
        <h1 className="font-heading font-bold text-[#1A1A2E]">Booking Chat</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ height: 'calc(100vh - 140px)' }}>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003F87]"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">No messages yet. Start the conversation!</p>
            <p className="text-xs text-gray-300 mt-1">Discuss tour details, meeting point, etc.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_role === 'tourist' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  msg.sender_role === 'tourist'
                    ? 'bg-[#003F87] text-white rounded-br-md'
                    : 'bg-gray-100 text-[#1A1A2E] rounded-bl-md'
                }`}
              >
                <p className="text-sm font-body">{msg.content}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    msg.sender_role === 'tourist' ? 'text-white/60' : 'text-gray-400'
                  }`}
                >
                  {msg.sender_role === 'guide' ? '🧭 Guide' : '👤 You'}
                  {msg.created_at && ` • ${new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="bg-[#003F87] text-white p-2.5 rounded-full disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </AppLayout>
  );
}