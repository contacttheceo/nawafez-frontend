'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { MessageCircle, X } from 'lucide-react'

/**
 * Floating WhatsApp chat bubble (bottom-left in RTL, bottom-right in LTR).
 *
 * Drives inbound leads from any page. Hidden on:
 *   - /admin/* (no leads from staff)
 *   - /dashboard/* and /messages/* (would conflict with the in-app chat)
 *   - /auth/* (distracts from signup)
 *
 * Opens wa.me with a pre-filled greeting. The receiving number is the
 * brand's main contact line — the founder picks up directly.
 */

const PHONE   = '966556716705'
const HIDE_ON = ['/admin', '/dashboard', '/messages', '/auth/']

export default function FloatingWhatsApp() {
  const locale = useLocale()
  const isRTL  = locale === 'ar'

  const [shown,    setShown]    = useState(false)  // tooltip popover
  const [hidden,   setHidden]   = useState(false)  // user dismissed
  const [path,     setPath]     = useState<string>('')

  useEffect(() => {
    setPath(window.location.pathname)
    // Show tooltip 5 seconds after the page loads — long enough that the
    // user is actually engaged, short enough they haven't scrolled past.
    const t = setTimeout(() => setShown(true), 5000)
    return () => clearTimeout(t)
  }, [])

  if (hidden) return null
  if (HIDE_ON.some(p => path.includes(p))) return null

  const greeting = isRTL
    ? 'مرحباً، أرغب بمعرفة المزيد عن نوافذ'
    : "Hi, I'd like to know more about Nwafiz"
  const link = `https://wa.me/${PHONE}?text=${encodeURIComponent(greeting)}`

  return (
    <>
      {/* Floating button */}
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        className={`fixed bottom-5 ${isRTL ? 'start-5' : 'end-5'} z-40
                    w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1FB855]
                    flex items-center justify-center shadow-lg
                    transition-transform hover:scale-105 active:scale-95`}
        onClick={() => setShown(false)}
      >
        <MessageCircle className="text-white" size={26} />
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-75 animate-ping" />
      </a>

      {/* Tooltip popover */}
      {shown && (
        <div
          className={`fixed bottom-24 ${isRTL ? 'start-5' : 'end-5'} z-40
                      bg-white rounded-2xl shadow-2xl border border-gray-200
                      p-4 max-w-[260px] animate-fade-in`}
        >
          <button
            onClick={() => setHidden(true)}
            className={`absolute top-2 ${isRTL ? 'start-2' : 'end-2'}
                        w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200
                        flex items-center justify-center transition`}
            aria-label="close"
          >
            <X size={12} className="text-gray-500" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 bg-[#25D366] rounded-full flex items-center justify-center shrink-0">
              <MessageCircle className="text-white" size={18} />
            </div>
            <div>
              <div className="font-bold text-navy text-sm">
                {isRTL ? 'فريق نوافذ' : 'Nwafiz Team'}
              </div>
              <div className="text-[10px] text-emerald font-bold">
                {isRTL ? '● متاح الآن' : '● Online now'}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed mb-3">
            {isRTL
              ? 'هل لديك سؤال أو تحتاج مساعدة في نشر إعلانك؟ راسلنا على واتساب.'
              : 'Have a question or need help posting? Message us on WhatsApp.'}
          </p>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-[#25D366] hover:bg-[#1FB855] text-white font-bold text-xs py-2 rounded-xl"
            onClick={() => setShown(false)}
          >
            {isRTL ? 'ابدأ المحادثة' : 'Start chat'}
          </a>
        </div>
      )}
    </>
  )
}
