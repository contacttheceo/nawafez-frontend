'use client';

import { useEffect, useState, useRef, useCallback, Suspense, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, Send, ChevronLeft, Loader2, Package } from 'lucide-react';
import { messagesApi, listingsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { formatDistanceToNow } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import toast from 'react-hot-toast';

/* ── Types ──────────────────────────────────────────────────────────────── */

interface OtherUser  { id: number; name_ar: string; name_en: string }
interface ThreadListing { id: number; title_ar: string; title_en: string }

interface Thread {
  other_user:   OtherUser;
  listing:      ThreadListing;
  last_message: { body: string; sent_at: string; is_mine: boolean };
  unread_count: number;
}

interface Message {
  id:      number;
  body:    string;
  sent_at: string;
  is_mine: boolean;
}

/* ── Inner component (uses useSearchParams) ────────────────────────────── */

function MessagesInner() {
  const locale  = useLocale();
  const router  = useRouter();
  const isRTL   = locale === 'ar';
  const params  = useSearchParams();
  const { isAuthenticated, user } = useAuthStore();

  const toParam      = params.get('to');
  const listingParam = params.get('listing');

  const [threads,       setThreads]       = useState<Thread[]>([]);
  const [loadingInbox,  setLoadingInbox]  = useState(true);
  const [activeThread,  setActiveThread]  = useState<Thread | null>(null);
  const [messages,      setMessages]      = useState<Message[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [newMessage,    setNewMessage]    = useState('');
  const [sending,       setSending]       = useState(false);

  const bottomRef    = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const chatAreaRef  = useRef<HTMLDivElement>(null);
  const sendingRef   = useRef(false);   // avoid polling overlap during send

  /* ── Redirect if not logged in ── */
  useEffect(() => {
    if (!isAuthenticated) router.push(`/${locale}/auth/login`);
  }, [isAuthenticated]);

  /* ── Load inbox ── */
  useEffect(() => {
    if (!isAuthenticated) return;
    messagesApi.getInbox()
      .then((res: any) => setThreads(res.data ?? []))
      .catch(() => setThreads([]))
      .finally(() => setLoadingInbox(false));
  }, [isAuthenticated]);

  /* ── Auto-open thread from URL params ── */
  useEffect(() => {
    if (loadingInbox || !toParam || !listingParam) return;

    const toId      = Number(toParam);
    const lstId     = Number(listingParam);

    // 1. Try to find in existing inbox
    const match = threads.find(
      t => t.other_user.id === toId && t.listing.id === lstId
    );

    if (match) {
      openThread(match);
      return;
    }

    // 2. Thread doesn't exist yet — fetch listing to build a synthetic thread
    listingsApi.getOne(lstId)
      .then((res: any) => {
        const listing = res.data ?? res;
        const synthetic: Thread = {
          other_user: {
            id:      listing.user?.id ?? toId,
            name_ar: listing.user?.name_ar ?? '—',
            name_en: listing.user?.name_en ?? '—',
          },
          listing: {
            id:       listing.id,
            title_ar: listing.title_ar,
            title_en: listing.title_en,
          },
          last_message: { body: '', sent_at: '', is_mine: false },
          unread_count: 0,
        };
        setActiveThread(synthetic);
        setMessages([]);
      })
      .catch(() => {});
  }, [loadingInbox, threads]);

  /* ── Smart scroll — only if near bottom ── */
  const scrollToBottom = useCallback((force = false) => {
    const area = chatAreaRef.current;
    if (!area) return;
    const nearBottom = area.scrollHeight - area.scrollTop - area.clientHeight < 140;
    if (force || nearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages]);

  /* ── Poll active thread every 5 s ── */
  useEffect(() => {
    if (!activeThread) return;
    const { id: otherId } = activeThread.other_user;
    const { id: lstId }   = activeThread.listing;

    const tid = setInterval(async () => {
      if (sendingRef.current) return;          // skip while user is sending
      try {
        const res: any = await messagesApi.getThread(otherId, lstId);
        const incoming: Message[] = res.data ?? [];
        setMessages(prev => {
          if (incoming.length === prev.length) return prev;  // nothing new
          return incoming;
        });
      } catch {}
    }, 5000);

    return () => clearInterval(tid);
  }, [activeThread?.other_user.id, activeThread?.listing.id]);

  /* ── Poll inbox every 15 s (unread badges) ── */
  useEffect(() => {
    if (!isAuthenticated) return;
    const tid = setInterval(async () => {
      try {
        const res: any = await messagesApi.getInbox();
        setThreads(res.data ?? []);
      } catch {}
    }, 15000);
    return () => clearInterval(tid);
  }, [isAuthenticated]);

  /* ── Open a thread ── */
  const openThread = useCallback(async (thread: Thread) => {
    setActiveThread(thread);
    setMessages([]);
    setLoadingThread(true);
    try {
      const res: any = await messagesApi.getThread(thread.other_user.id, thread.listing.id);
      setMessages(res.data ?? []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingThread(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, []);

  /* ── Send message ── */
  const sendMessage = async () => {
    if (!activeThread || !newMessage.trim() || sending) return;
    setSending(true);
    sendingRef.current = true;
    const body = newMessage.trim();
    setNewMessage('');

    // Optimistic insert
    const tempId = Date.now();
    setMessages(prev => [...prev, { id: tempId, body, sent_at: new Date().toISOString(), is_mine: true }]);

    // Step 1 — Send (failure = real error, show toast + rollback)
    try {
      await messagesApi.send({
        to_user_id: activeThread.other_user.id,
        listing_id: activeThread.listing.id,
        body,
      });
    } catch (err: any) {
      // Try to extract a meaningful server error message
      const serverMsg = err?.response?.data?.message
        ?? err?.response?.data?.error
        ?? (err?.message !== 'Network Error' ? err?.message : null);
      console.error('[Messages] send failed:', err?.response?.status, err?.response?.data);
      toast.error(serverMsg || (isRTL ? 'فشل إرسال الرسالة' : 'Failed to send'));
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(body);
      setSending(false);
      sendingRef.current = false;
      return;
    }

    // Step 2 — Refresh silently (failure here = message WAS sent, just keep optimistic)
    try {
      const [threadRes, inboxRes]: any[] = await Promise.all([
        messagesApi.getThread(activeThread.other_user.id, activeThread.listing.id),
        messagesApi.getInbox(),
      ]);
      setMessages(threadRes.data ?? []);
      setThreads(inboxRes.data ?? []);
    } catch { /* keep optimistic message */ }

    scrollToBottom(true);
    setSending(false);
    sendingRef.current = false;
    inputRef.current?.focus();
  };

  /* ── Helpers ── */
  const userName = (u: OtherUser) => isRTL ? u.name_ar : u.name_en;
  const lstTitle = (l: ThreadListing) => isRTL ? l.title_ar : (l.title_en || l.title_ar);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">

        {/* Page title — hidden on mobile when thread is open */}
        <h1 className={`text-2xl font-black text-navy mb-4 flex items-center gap-2
                        ${activeThread ? 'hidden md:flex' : 'flex'}`}>
          <MessageSquare className="text-emerald" size={22} />
          {isRTL ? 'الرسائل' : 'Messages'}
        </h1>

        <div className="flex gap-4" style={{ height: 'calc(100vh - 200px)', minHeight: 460 }}>

          {/* ── Thread List ── */}
          <div className={`w-full md:w-72 lg:w-80 flex-shrink-0 flex flex-col gap-2 overflow-y-auto
                          ${activeThread ? 'hidden md:flex' : 'flex'}`}>

            {loadingInbox ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="animate-spin text-navy" size={28} />
              </div>
            ) : threads.length === 0 ? (
              <div className="card p-8 text-center">
                <div className="text-5xl mb-3">💬</div>
                <p className="text-gray-500 text-sm font-medium mb-1">
                  {isRTL ? 'لا توجد رسائل بعد' : 'No messages yet'}
                </p>
                <p className="text-gray-400 text-xs mb-4">
                  {isRTL
                    ? 'تواصل مع البائعين من صفحة الإعلانات'
                    : 'Contact sellers from any listing page'}
                </p>
                <Link href={`/${locale}/listings`} className="btn-primary text-sm inline-block">
                  {isRTL ? 'تصفح الإعلانات' : 'Browse listings'}
                </Link>
              </div>
            ) : (
              threads.map((thread, idx) => {
                const isActive =
                  activeThread?.other_user.id === thread.other_user.id &&
                  activeThread?.listing.id     === thread.listing.id;
                return (
                  <button
                    key={idx}
                    onClick={() => openThread(thread)}
                    className={`card p-4 text-start hover:shadow-md transition-all w-full
                                ${isActive ? 'ring-2 ring-emerald bg-emerald/5' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-navy/10 flex items-center justify-center
                                      font-bold text-navy text-sm shrink-0">
                        {userName(thread.other_user)[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <p className="font-semibold text-navy text-sm truncate">
                            {userName(thread.other_user)}
                          </p>
                          <span className="text-[10px] text-gray-400 shrink-0 ms-2">
                            {thread.last_message.sent_at
                              ? formatDistanceToNow(thread.last_message.sent_at, locale)
                              : ''}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald truncate mb-1">
                          {lstTitle(thread.listing)}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {thread.last_message.is_mine && (
                            <span className="text-gray-400">{isRTL ? 'أنت: ' : 'You: '}</span>
                          )}
                          {thread.last_message.body}
                        </p>
                      </div>
                      {thread.unread_count > 0 && (
                        <span className="w-5 h-5 bg-emerald text-white text-[10px] rounded-full
                                         flex items-center justify-center font-bold shrink-0 mt-1">
                          {thread.unread_count}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* ── Chat Panel ── */}
          <div className={`flex-1 card flex flex-col overflow-hidden
                          ${!activeThread ? 'hidden md:flex' : 'flex'}`}>

            {!activeThread ? (
              /* Empty state — desktop */
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
                <MessageSquare size={52} className="opacity-20" />
                <p className="text-sm">{isRTL ? 'اختر محادثة من القائمة' : 'Select a conversation'}</p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-white">
                  {/* Back button — mobile */}
                  <button
                    className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
                    onClick={() => setActiveThread(null)}
                    aria-label={isRTL ? 'رجوع' : 'Back'}
                  >
                    <ChevronLeft size={20} className={isRTL ? 'rotate-180' : ''} />
                  </button>

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-navy/10 flex items-center justify-center
                                  font-bold text-navy text-sm shrink-0">
                    {userName(activeThread.other_user)[0]?.toUpperCase() ?? '?'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-navy text-sm">
                        {userName(activeThread.other_user)}
                      </p>
                      {/* Live polling indicator */}
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse"
                            title={isRTL ? 'تحديث تلقائي' : 'Live'} />
                    </div>
                    <Link
                      href={`/${locale}/listings/${activeThread.listing.id}`}
                      className="text-xs text-emerald hover:underline truncate block"
                    >
                      <Package size={10} className="inline me-1" />
                      {lstTitle(activeThread.listing)}
                    </Link>
                  </div>
                </div>

                {/* Messages area */}
                <div ref={chatAreaRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
                  {loadingThread ? (
                    <div className="flex justify-center pt-10">
                      <Loader2 className="animate-spin text-navy" size={24} />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                      <MessageSquare size={36} className="opacity-25" />
                      <p className="text-sm">
                        {isRTL ? 'ابدأ المحادثة الآن' : 'Start the conversation'}
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMine   = msg.is_mine;
                      const showTime = idx === messages.length - 1
                        || messages[idx + 1]?.is_mine !== msg.is_mine;
                      return (
                        <div key={msg.id}
                             className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[72%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                                            ${isMine
                                              ? 'bg-navy text-white rounded-br-none'
                                              : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-100'}`}>
                              {msg.body}
                            </div>
                            {showTime && (
                              <p className="text-[10px] text-gray-400 px-1">
                                {formatDistanceToNow(msg.sent_at, locale)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input area */}
                <div className="p-3 border-t border-gray-100 bg-white flex gap-2 items-end">
                  <input
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                    }}
                    className="input flex-1 text-sm py-2.5 resize-none"
                    placeholder={isRTL ? 'اكتب رسالة... (Enter للإرسال)' : 'Type a message... (Enter to send)'}
                    dir={isRTL ? 'rtl' : 'ltr'}
                    disabled={sending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="w-10 h-10 rounded-xl bg-navy hover:bg-navy-dark text-white
                               flex items-center justify-center transition-colors
                               disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    aria-label={isRTL ? 'إرسال' : 'Send'}
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

/* ── Page export wrapped in Suspense (required for useSearchParams) ──── */
export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-navy" size={32} />
        </div>
      </div>
    }>
      <MessagesInner />
    </Suspense>
  );
}
