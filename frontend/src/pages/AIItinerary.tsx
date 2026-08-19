import { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { authHeader } from '@/lib/authStorage';
import { getAPIBaseURL } from '@/lib/config';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIItinerary() {
  const navigate = useNavigate();
  const { user, loading: authChecking } = useAuth();
  const isAuthenticated = Boolean(user);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    if (!isAuthenticated) {
      navigate('/login?from=/ai-itinerary');
      return;
    }

    const userMessage: ChatMessage = { role: 'user', content: content.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${getAPIBaseURL()}/api/v1/itinerary/chat`,
        { messages: updatedMessages, preferences: {} },
        { headers: authHeader(), timeout: 600_000 }
      );

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.data.content,
      };
      setMessages([...updatedMessages, assistantMessage]);
    } catch (e: any) {
      const errorMsg = e?.response?.data?.detail || e?.message || 'Failed to get response';
      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: `⚠️ ${errorMsg}\n\nPlease try again.` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout showNav={false} showSOS={false}>
      <div className="flex flex-col h-[100dvh]">
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-3 bg-white/80 backdrop-blur-md border-b border-[#D4C5A9]/20">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/home')} className="p-1.5 rounded-lg hover:bg-[#003F87]/5">
              <ArrowLeft size={20} className="text-[#1A1A2E]" />
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#003F87] to-[#003F87]/70 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <h1 className="font-display text-base font-bold text-[#1A1A2E]">AI Travel Concierge</h1>
              <p className="text-[9px] font-body text-[#4A7C59]">● Online — Powered by GPT</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-16 h-16 rounded-full bg-[#003F87]/10 flex items-center justify-center mb-4">
                <Bot size={28} className="text-[#003F87]" />
              </div>
              <h2 className="font-display text-lg font-bold text-[#1A1A2E] mb-2">Your AI Travel Concierge</h2>
              <p className="text-xs font-body text-[#1A1A2E]/60 mb-6">
                Ask me anything about traveling in Israel! I can create personalized itineraries, suggest restaurants, find activities, and more.
              </p>
              <div className="space-y-2 w-full">
                {[
                  'Create a 5-day itinerary for Jerusalem and Tel Aviv',
                  'Best kosher restaurants near the Western Wall',
                  'Family-friendly activities in the Dead Sea area',
                  'What to do on Shabbat in Tel Aviv?',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                    disabled={authChecking}
                    className="w-full text-left px-3 py-2.5 rounded-xl bg-white border border-[#D4C5A9]/30 text-[10px] font-body text-[#1A1A2E]/70 hover:border-[#003F87]/30 hover:bg-[#003F87]/5 transition-colors disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#003F87] to-[#003F87]/70 flex items-center justify-center mt-1">
                  <Bot size={13} className="text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs font-body leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#003F87] text-white rounded-br-md'
                    : 'bg-white border border-[#D4C5A9]/20 text-[#1A1A2E] rounded-bl-md shadow-sm'
                }`}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#C8A96E]/20 flex items-center justify-center mt-1">
                  <User size={13} className="text-[#C8A96E]" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2 justify-start">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#003F87] to-[#003F87]/70 flex items-center justify-center mt-1">
                <Bot size={13} className="text-white" />
              </div>
              <div className="bg-white border border-[#D4C5A9]/20 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 size={14} className="text-[#003F87] animate-spin" />
                  <span className="text-[10px] font-body text-[#1A1A2E]/50">Planning your trip...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-4 py-3 bg-white/80 backdrop-blur-md border-t border-[#D4C5A9]/20">
          <div className="flex gap-2 items-end">
            <div className="flex-1 bg-[#FAF8F5] border border-[#D4C5A9]/30 rounded-2xl px-4 py-2.5">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(inputValue);
                  }
                }}
                placeholder="Ask about your Israel trip..."
                rows={1}
                className="w-full text-xs font-body outline-none bg-transparent placeholder:text-[#1A1A2E]/30 resize-none max-h-20"
              />
            </div>
            <button
              onClick={() => sendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading || authChecking}
              className="p-2.5 bg-[#003F87] rounded-full text-white shadow-md active:scale-90 transition-transform disabled:opacity-40 disabled:active:scale-100"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[8px] font-body text-[#1A1A2E]/30 text-center mt-1.5">
            AI-powered travel planning • Responses may vary
          </p>
        </div>
      </div>
    </AppLayout>
  );
}