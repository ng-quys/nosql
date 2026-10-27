import React, { useEffect, useRef, useState } from 'react';
import { Leaf, MessageCircle, Send, Trash2, X } from 'lucide-react';
import { ChatMessage, ChatService } from '../../services/chatService';

const STORAGE_KEY = 'freshleaf_chat_history';
const greeting: ChatMessage = {
  id: 'welcome',
  role: 'model',
  text: 'Chào bạn! Mình có thể gợi ý món, xem giá và giới thiệu ưu đãi đang có tại FreshLeaf.',
};

function readHistory(): ChatMessage[] {
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
    const valid = Array.isArray(stored)
      ? stored.filter((item): item is ChatMessage =>
          item && typeof item.id === 'string' && (item.role === 'user' || item.role === 'model') && typeof item.text === 'string'
        ).slice(-20)
      : [];
    return valid.length ? valid : [greeting];
  } catch {
    return [greeting];
  }
}

export const ChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(readHistory);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  const clearChat = () => {
    setMessages([greeting]);
    setError('');
  };

  const send = async (suggestion?: string) => {
    const text = (suggestion ?? input).trim();
    if (!text || sending) return;

    const userMessage: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text };
    const history = messages.filter((item) => item.id !== 'welcome');
    setMessages((current) => [...current, userMessage]);
    setInput('');
    setError('');
    setSending(true);

    try {
      const reply = await ChatService.send(text, history);
      setMessages((current) => [...current, { id: `m-${Date.now()}`, role: 'model', text: reply }]);
    } catch (err: any) {
      setError(err.message || 'Không thể kết nối chatbot.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50" data-ui>
      {open && (
        <section
          className="absolute bottom-14 right-0 w-[calc(100vw-2rem)] sm:w-[370px] h-[min(560px,calc(100dvh-7rem))] bg-[#FCFBF7] border border-[#D9D5CA] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          aria-label="Trợ lý FreshLeaf"
        >
          <header className="px-4 py-3 bg-[#1B4332] text-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Leaf className="w-5 h-5 shrink-0" />
              <div className="min-w-0">
                <h2 className="text-sm font-semibold">Trợ lý FreshLeaf</h2>
                <p className="text-xs text-[#CDE0D5] truncate">Gợi ý món và ưu đãi</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={clearChat} className="w-9 h-9 grid place-items-center rounded-lg hover:bg-white/10" title="Xóa cuộc trò chuyện" aria-label="Xóa cuộc trò chuyện">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={() => setOpen(false)} className="w-9 h-9 grid place-items-center rounded-lg hover:bg-white/10" aria-label="Đóng chatbot">
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <p className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${message.role === 'user' ? 'bg-[#1B4332] text-white rounded-2xl rounded-br-md' : 'bg-[#EDF3EF] text-[#18372A] rounded-2xl rounded-bl-md'}`}>
                  {message.text}
                </p>
              </div>
            ))}

            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {['Gợi ý món dễ uống', 'Hôm nay có ưu đãi gì?', 'Món nào ít ngọt?'].map((suggestion) => (
                  <button key={suggestion} onClick={() => send(suggestion)} className="h-8 px-3 rounded-full border border-[#CBD8D1] text-xs font-medium text-[#28513E] hover:bg-[#EDF3EF] transition-colors">
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {sending && <p className="w-fit px-3.5 py-2.5 bg-[#EDF3EF] text-[#5D7067] rounded-2xl rounded-bl-md text-sm">FreshLeaf đang trả lời…</p>}
            {error && <div className="p-3 rounded-lg bg-[#FFF1F0] text-[#9F2D2D] text-xs leading-relaxed" role="alert">{error}</div>}
          </div>

          <form onSubmit={(event) => { event.preventDefault(); send(); }} className="p-3 bg-[#F4F1E9]">
            <div className="flex items-end gap-2">
              <label className="flex-1">
                <span className="sr-only">Nhập câu hỏi cho FreshLeaf</span>
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value.slice(0, 1000))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      send();
                    }
                  }}
                  rows={1}
                  placeholder="Hỏi về món uống, giá, ưu đãi…"
                  className="w-full max-h-24 min-h-10 resize-none rounded-xl border border-[#D8D3C7] px-3 py-2.5 text-sm text-[#1B4332] focus:outline-none focus:border-[#2D6A4F]"
                />
              </label>
              <button type="submit" disabled={!input.trim() || sending} className="w-10 h-10 shrink-0 grid place-items-center rounded-xl bg-[#1B4332] text-white hover:bg-[#143427] disabled:opacity-40 transition-colors" aria-label="Gửi câu hỏi">
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-2 text-[11px] text-[#6B7D74]">AI có thể nhầm. Hãy xác nhận dị ứng với nhân viên.</p>
          </form>
        </section>
      )}

      <button
        onClick={() => setOpen((value) => !value)}
        className="w-12 h-12 rounded-full bg-[#1B4332] text-white grid place-items-center hover:bg-[#143427] transition-colors"
        aria-label={open ? 'Đóng trợ lý FreshLeaf' : 'Mở trợ lý FreshLeaf'}
        aria-expanded={open}
        title={open ? 'Đóng trợ lý' : 'Mở trợ lý FreshLeaf'}
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>
    </div>
  );
};
