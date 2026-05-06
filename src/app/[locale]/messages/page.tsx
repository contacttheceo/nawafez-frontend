'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, Send, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { messagesApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { formatDistanceToNow } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import toast from 'react-hot-toast';

interface Thread {
  other_user: { id: number; name_ar: string; name_en: string };
  listing: { id: number; title_ar: string; title_en: string };
  last_message: { body: string; created_at: string; is_mine: boolean };
  unread_count: number;
}

export default function MessagesPage() {
  const locale  = useLocale();
  const router  = useRouter();
  const isRTL   = locale === 'ar';
  const { isAuthenticated, user } = useAuthStore();

  const [threads, setThreads]         = useState<Thread[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messages, setMessages]       = useState<any[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [newMessage, setNewMessage]   = useState('');
  const [sending, setSending]         = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}/auth/login`);
    }
  }, [isAuthenticated]);

  // Load inbox
  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await messagesApi.getInbox();
        setThreads(res.data ?? []);
      } catch {
        setThreads([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isAuthenticated]);

  const openThread = async (thread: Thread) => {
    setActiveThread(thread);
    setLoadingThread(true);
    try {
      const res = await messagesApi.getThread(thread.other_user.id, thread.listing.id);
      setMessages(res.data ?? []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingThread(false);
    }
  };

  const sendMessage = async () => {
    if (!activeThread || !newMessage.trim()) return;
    setSending(true);
    try {
      await messagesApi.send({
        to_user_id: activeThread.other_user.id,
        listing_id: activeThread.listing.id,
        body: newMessage.trim(),
      });
      setNewMessage('');
      // Refresh thread
      const res = await messagesApi.getThread(activeThread.other_user.id, activeThread.listing.id);
      setMessages(res.data ?? []);
    } catch {
      toast.error(isRTL ? 'فشل إرسال الرسالة' : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated) return null;

  const otherUserName = (u: { name_ar: string; name_en: string }) =>
    isRTL ? u.name_ar : u.name_en;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <h1 className="text-2xl font-black text-navy mb-6 flex items-center gap-2">
          <MessageSquare className="text-emerald" size={24} />
          {isRTL ? 'الرسائل' : 'Messages'}
        </h1>

        <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[400px]">

          {/* Thread List */}
          <div className={`w-full md:w-80 flex-shrink-0 flex flex-col gap-2
                          ${activeThread ? 'hidden md:flex' : 'flex'}`}>
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="animate-spin text-navy" size={28} />
              </div>
            ) : threads.length === 0 ? (
              <div className="card p-8 text-center">
                <div className="text-5xl mb-3">💬</div>
                <p className="text-gray-500 text-sm">
                  {isRTL ? 'لا توجد رسائل بعد' : 'No messages yet'}
                </p>
                <Link href={`/${locale}/listings`}
                  className="btn-primary text-sm mt-4 inline-block">
                  {isRTL ? 'تصفح الإعلانات' : 'Browse listings'}
                </Link>
              </div>
            ) : (
              threads.map((thread, idx) => (
                <button
                  key={idx}
                  onClick={() => openThread(thread)}
                  className={`card p-4 text-start hover:shadow-md transition-all text-${isRTL ? 'right' : 'left'}
                    ${activeThread?.other_user.id === thread.other_user.id &&
                      activeThread?.listing.id === thread.listing.id
                      ? 'ring-2 ring-emerald'
                      : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-navy text-sm truncate">
                        {otherUserName(thread.other_user)}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {isRTL ? thread.listing.title_ar : thread.listing.title_en || thread.listing.title_ar}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {thread.last_message.is_mine && (
                          <span className="text-emerald">{isRTL ? 'أنت: ' : 'You: '}</span>
                        )}
                        {thread.last_message.body}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className="text-[10px] text-gray-400">
                        {formatDistanceToNow(thread.last_message.created_at, locale)}
                      </span>
                      {thread.unread_count > 0 && (
                        <span className="w-5 h-5 bg-emerald text-white text-[10px] rounded-full
                                         flex items-center justify-center font-bold">
                          {thread.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Chat Panel */}
          <div className={`flex-1 card flex flex-col overflow-hidden
                          ${!activeThread ? 'hidden md:flex' : 'flex'}`}>
            {!activeThread ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <MessageSquare size={48} className="mb-3 opacity-30" />
                <p className="text-sm">{isRTL ? 'اختر محادثة' : 'Select a conversation'}</p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center gap-3">
                  <button
                    className="md:hidden text-gray-500"
                    onClick={() => setActiveThread(null)}
                  >
                    {isRTL ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
                  </button>
                  <div>
                    <p className="font-bold text-navy text-sm">
                      {otherUserName(activeThread.other_user)}
                    </p>
                    <Link
                      href={`/${locale}/listings/${activeThread.listing.id}`}
                      className="text-xs text-emerald hover:underline"
                    >
                      {isRTL
                        ? activeThread.listing.title_ar
                        : activeThread.listing.title_en || activeThread.listing.title_ar}
                    </Link>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingThread ? (
                    <div className="flex justify-center pt-8">
                      <Loader2 className="animate-spin text-navy" size={24} />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm pt-8">
                      {isRTL ? 'لا توجد رسائل' : 'No messages'}
                    </p>
                  ) : (
                    messages.map((msg: any, idx: number) => {
                      const isMine = msg.from_user_id === user?.id;
                      return (
                        <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm
                            ${isMine
                              ? 'bg-navy text-white rounded-br-sm'
                              : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                            <p>{msg.body}</p>
                            <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-gray-400'}`}>
                              {formatDistanceToNow(msg.created_at, locale)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input */}
                <div className="p-4 border-t flex gap-2">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    className="input flex-1 text-sm py-2"
                    placeholder={isRTL ? 'اكتب رسالة...' : 'Type a message...'}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="btn-primary px-4 py-2 disabled:opacity-50"
                  >
                    {sending
                      ? <Loader2 size={16} className="animate-spin" />
                      : <Send size={16} className={isRTL ? 'rotate-180' : ''} />}
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
