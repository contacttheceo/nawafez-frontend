'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import {
  X, MessageSquare, Send, ChevronLeft, Loader2, Package, ArrowUpRight,
} from 'lucide-react';
import { messagesApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useNotificationStore } from '@/store/notifications';
import { formatDistanceToNow, storageUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

/* ── Types ─────────────────────────────────────────────────────────────── */
interface OtherUser     { id: number; name_ar: string; name_en: string; avatar_url?: string | null }
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

/* ── Avatar ─────────────────────────────────────────────────────────────── */
function Avatar({ user, name, size = 9 }: { user: OtherUser; name: string; size?: number }) {
  const url = storageUrl(user.avatar_url);
  const cls = `w-${size} h-${size} rounded-full bg-navy/10 flex items-center justify-center
               font-bold text-navy shrink-0 overflow-hidden`;
  return (
    <div className={cls} style={{ fontSize: size < 10 ? 12 : 14 }}>
      {url
        ? <img src={url} alt={name} className="w-full h-full object-cover"
               onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        : name[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

/* ── Props ─────────────────────────────────────────────────────────────── */
interface MessagesDrawerProps {
  open:    boolean;
  onClose: () => void;
}

export default function MessagesDrawer({ open, onClose }: MessagesDrawerProps) {
  const locale = useLocale();
  const isRTL  = locale === 'ar';
  const { user } = useAuthStore();
  const { setUnreadMessages, clearThreadUnread } = useNotificationStore();

  const [threads,       setThreads]       = useState<Thread[]>([]);
  const [loadingInbox,  setLoadingInbox]  = useState(false);
  const [activeThread,  setActiveThread]  = useState<Thread | null>(null);
  const [messages,      setMessages]      = useState<Message[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [newMessage,    setNewMessage]    = useState('');
  const [sending,       setSending]       = useState(false);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const sendingRef  = useRef(false);

  /* ── Load inbox when drawer opens ── */
  useEffect(() => {
    if (!open) { setActiveThread(null); return; }
    setLoadingInbox(true);
    messagesApi.getInbox()
      .then((res: any) => setThreads(res.data ?? []))
      .catch(() => setThreads([]))
      .finally(() => setLoadingInbox(false));
  }, [open]);

  /* ── Scroll on new messages ── */
  useEffect(() => {
    if (messages.length) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Clear unread helper ── */
  const clearUnread = useCallback((otherId: number, lstId: number) => {
    setThreads(prev => {
      const updated = prev.map(t => {
        if (t.other_user.id === otherId && t.listing.id === lstId && t.unread_count > 0) {
          clearThreadUnread(t.unread_count);
          return { ...t, unread_count: 0 };
        }
        return t;
      });
      setUnreadMessages(updated.reduce((s, t) => s + t.unread_count, 0));
      return updated;
    });
  }, [clearThreadUnread, setUnreadMessages]);

  /* ── Open a thread ── */
  const openThread = useCallback(async (thread: Thread) => {
    setActiveThread(thread);
    setMessages([]);
    setLoadingThread(true);
    clearUnread(thread.other_user.id, thread.listing.id);
    try {
      const res: any = await messagesApi.getThread(thread.other_user.id, thread.listing.id);
      setMessages(res.data ?? []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingThread(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [clearUnread]);

  /* ── Send ── */
  const sendMessage = async () => {
    if (!activeThread || !newMessage.trim() || sending) return;
    setSending(true);
    sendingRef.current = true;
    const body = newMessage.trim();
    setNewMessage('');

    const tempId = Date.now();
    setMessages(prev => [...prev, { id: tempId, body, sent_at: new Date().toISOString(), is_mine: true }]);

    try {
      await messagesApi.send({
        to_user_id: activeThread.other_user.id,
        listing_id: activeThread.listing.id,
        body,
      });
      const res: any = await messagesApi.getThread(activeThread.other_user.id, activeThread.listing.id);
      setMessages(res.data ?? []);
    } catch {
      toast.error(isRTL ? 'فشل إرسال الرسالة' : 'Failed to send');
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(body);
    } finally {
      setSending(false);
      sendingRef.current = false;
      inputRef.current?.focus();
    }
  };

  /* ── Helpers ── */
  const userName = (u: OtherUser)     => isRTL ? u.name_ar : u.name_en;
  const lstTitle = (l: ThreadListing) => isRTL ? l.title_ar : (l.title_en || l.title_ar);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className={`fixed top-0 bottom-0 w-full sm:w-[420px] bg-white shadow-2xl z-50
                        flex flex-col animate-slide-in
                        ${isRTL ? 'left-0 border-r border-gray-100' : 'right-0 border-l border-gray-100'}`}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 bg-navy text-white shrink-0">
          {activeThread ? (
            <button
              onClick={() => setActiveThread(null)}
              className="flex items-center gap-2 text-white/80 hover:text-white transition text-sm"
            >
              <ChevronLeft size={16} className={isRTL ? 'rotate-180' : ''} />
              {isRTL ? 'الرسائل' : 'Messages'}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-emerald" />
              <span className="font-bold text-sm">{isRTL ? 'الرسائل' : 'Messages'}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            {!activeThread && (
              <Link
                href={`/${locale}/messages`}
                onClick={onClose}
                className="flex items-center gap-1 text-white/60 hover:text-white transition text-xs"
                title={isRTL ? 'فتح صفحة الرسائل' : 'Open messages page'}
              >
                {isRTL ? 'عرض الكل' : 'View all'}
                <ArrowUpRight size={12} />
              </Link>
            )}
            {activeThread && (
              <Link
                href={`/${locale}/messages?to=${activeThread.other_user.id}&listing=${activeThread.listing.id}`}
                onClick={onClose}
                className="flex items-center gap-1 text-white/60 hover:text-white transition text-xs"
                title={isRTL ? 'فتح المحادثة كاملةً' : 'Open full conversation'}
              >
                {isRTL ? 'فتح كاملاً' : 'Full view'}
                <ArrowUpRight size={12} />
              </Link>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        {!activeThread ? (
          /* Thread list */
          <div className="flex-1 overflow-y-auto">
            {loadingInbox ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="animate-spin text-navy" size={24} />
              </div>
            ) : threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 py-16">
                <MessageSquare size={48} className="opacity-20" />
                <p className="text-sm">{isRTL ? 'لا توجد رسائل بعد' : 'No messages yet'}</p>
                <Link
                  href={`/${locale}/listings`}
                  onClick={onClose}
                  className="text-xs text-emerald hover:underline"
                >
                  {isRTL ? 'تصفح الإعلانات →' : '→ Browse listings'}
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {threads.map((thread, idx) => (
                  <button
                    key={idx}
                    onClick={() => openThread(thread)}
                    className="w-full px-4 py-3.5 text-start hover:bg-gray-50 transition flex items-start gap-3"
                  >
                    <Avatar user={thread.other_user} name={userName(thread.other_user)} size={9} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="font-semibold text-navy text-sm truncate">
                          {userName(thread.other_user)}
                        </p>
                        <span className="text-[10px] text-gray-400 shrink-0 ms-2">
                          {thread.last_message.sent_at
                            ? formatDistanceToNow(thread.last_message.sent_at, locale)
                            : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald truncate mb-0.5">
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
                                       flex items-center justify-center font-bold shrink-0 mt-0.5">
                        {thread.unread_count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Conversation view */
          <>
            {/* Thread listing link */}
            <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 shrink-0">
              <Link
                href={`/${locale}/listings/${activeThread.listing.id}`}
                onClick={onClose}
                className="text-xs text-emerald hover:underline flex items-center gap-1"
              >
                <Package size={11} />
                {lstTitle(activeThread.listing)}
              </Link>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
              {loadingThread ? (
                <div className="flex justify-center pt-10">
                  <Loader2 className="animate-spin text-navy" size={22} />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                  <MessageSquare size={32} className="opacity-20" />
                  <p className="text-sm">{isRTL ? 'ابدأ المحادثة' : 'Start the conversation'}</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMine   = msg.is_mine;
                  const showTime = idx === messages.length - 1
                    || messages[idx + 1]?.is_mine !== msg.is_mine;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[78%] flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
                        <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed
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

            {/* Input */}
            <div className="p-3 border-t border-gray-100 bg-white flex gap-2 items-center shrink-0">
              <input
                ref={inputRef}
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                }}
                className="input flex-1 text-sm py-2"
                placeholder={isRTL ? 'اكتب رسالة...' : 'Type a message...'}
                dir={isRTL ? 'rtl' : 'ltr'}
                disabled={sending}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="w-9 h-9 rounded-xl bg-navy hover:bg-navy-dark text-white flex items-center
                           justify-center transition-colors disabled:opacity-40 shrink-0"
              >
                {sending
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Send size={14} />}
              </button>
            </div>
          </>
        )}
      </div>

    </>
  );
}
