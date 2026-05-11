'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { Menu, X, Globe, Plus, LogIn, ChevronDown, LayoutDashboard, User, MessageSquare, LogOut, Shield, Zap } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useNotificationStore } from '@/store/notifications'
import { authApi, messagesApi } from '@/lib/api'
import { storageUrl } from '@/lib/utils'
import MessagesDrawer from '@/components/ui/MessagesDrawer'

export default function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen]     = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [drawerOpen, setDrawerOpen]     = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isRTL = locale === 'ar'
  const { user, isAuthenticated, clearAuth } = useAuthStore()

  // ✅ Shared unread count — updated by messages page AND Navbar poll
  const { unreadMessages: unread, setUnreadMessages } = useNotificationStore()

  /* ── Poll inbox every 30s for unread count ── */
  useEffect(() => {
    if (!isAuthenticated) { setUnreadMessages(0); return; }
    const fetchUnread = async () => {
      try {
        const res: any = await messagesApi.getInbox()
        const threads: any[] = res.data ?? []
        setUnreadMessages(threads.reduce((s: number, t: any) => s + (t.unread_count ?? 0), 0))
      } catch {}
    }
    fetchUnread()
    const tid = setInterval(fetchUnread, 30000)
    return () => clearInterval(tid)
  }, [isAuthenticated])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    clearAuth()
    localStorage.removeItem('nawafez_token')
    router.push(`/${locale}`)
  }

  const switchLocale = () => {
    const newLocale = locale === 'ar' ? 'en' : 'ar'
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`)
    router.push(newPath)
  }

  const navLinks = [
    { href: `/${locale}/listings?section=ma`,        label: t('ma') },
    { href: `/${locale}/listings?section=fleet`,     label: t('fleet') },
    { href: `/${locale}/listings?section=contracts`, label: t('contracts') },
    { href: `/${locale}/listings?section=jobs`,      label: t('jobs') },
    { href: `/${locale}/listings?section=forum`,     label: t('forum') },
  ]

  return (
    <>
    <header className="bg-navy sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 bg-emerald rounded-xl flex items-center justify-center
                            text-white font-black text-lg">
              ن
            </div>
            <div>
              <div className="text-white font-black text-xl leading-none">نوافذ</div>
              <div className="text-white/60 text-[10px] leading-none mt-0.5">
                منصة اللوجستيك B2B
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white/80 hover:text-white hover:bg-white/10
                           px-3 py-2 rounded-lg text-sm transition-all duration-150"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={switchLocale}
              className="bg-white/10 text-white text-xs px-3 py-1.5 rounded-lg
                         hover:bg-white/20 transition-colors flex items-center gap-1"
            >
              <Globe size={12} />
              {locale === 'ar' ? 'EN' : 'ع'}
            </button>

            {isAuthenticated && user ? (
              /* ── Authenticated: user dropdown + post button ── */
              <>
                <Link
                  href={`/${locale}/listings/create`}
                  className="bg-emerald hover:bg-emerald-dark text-white px-4 py-2
                             rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  {t('post')}
                </Link>

                {/* Messages icon with badge — opens drawer */}
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="relative p-2 rounded-lg text-white/80 hover:text-white
                             hover:bg-white/10 transition-colors"
                  title={isRTL ? 'الرسائل' : 'Messages'}
                >
                  <MessageSquare size={18} />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -end-0.5 min-w-[16px] h-4 bg-red-500
                                     text-white text-[9px] font-black rounded-full flex items-center
                                     justify-center px-0.5 leading-none animate-pulse">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>

                {/* User dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white
                               px-3 py-1.5 rounded-lg text-sm transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-emerald flex items-center
                                    justify-center text-white font-bold text-xs shrink-0">
                      {storageUrl(user.avatar_url) ? (
                        <img src={storageUrl(user.avatar_url)!} alt=""
                             className="w-full h-full object-cover"
                             onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      ) : (
                        (isRTL ? user.name_ar : user.name_en)?.[0]?.toUpperCase() ?? 'U'
                      )}
                    </div>
                    <span className="max-w-[100px] truncate">
                      {isRTL ? user.name_ar : user.name_en}
                    </span>
                    <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className={`absolute top-full mt-2 w-48 bg-white rounded-xl shadow-xl border
                                     border-gray-100 py-1 z-50
                                     ${isRTL ? 'left-0' : 'right-0'}`}>
                      <Link href={`/${locale}/dashboard`}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700
                                   hover:bg-gray-50 transition-colors">
                        <LayoutDashboard size={15} className="text-navy" />
                        {isRTL ? 'لوحة التحكم' : 'Dashboard'}
                      </Link>
                      <button
                        onClick={() => { setDropdownOpen(false); setDrawerOpen(true); }}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700
                                   hover:bg-gray-50 transition-colors w-full text-start">
                        <MessageSquare size={15} className="text-navy" />
                        {isRTL ? 'الرسائل' : 'Messages'}
                        {unread > 0 && (
                          <span className="ms-auto min-w-[20px] h-5 bg-red-500 text-white text-[10px]
                                           font-bold rounded-full flex items-center justify-center px-1">
                            {unread > 9 ? '9+' : unread}
                          </span>
                        )}
                      </button>
                      <Link href={`/${locale}/profile`}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700
                                   hover:bg-gray-50 transition-colors">
                        <User size={15} className="text-navy" />
                        {isRTL ? 'الملف الشخصي' : 'Profile'}
                      </Link>
                      <Link href={`/${locale}/tools`}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-violet-600
                                   hover:bg-violet-50 transition-colors">
                        <Zap size={15} />
                        {isRTL ? 'أدوات الذكاء الاصطناعي' : 'AI Tools'}
                      </Link>
                      {user.role === 'admin' && (
                        <Link href={`/${locale}/admin`}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-600
                                     hover:bg-amber-50 transition-colors">
                          <Shield size={15} />
                          {isRTL ? 'لوحة الإدارة' : 'Admin Panel'}
                        </Link>
                      )}
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={() => { setDropdownOpen(false); handleLogout(); }}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500
                                   hover:bg-red-50 transition-colors w-full text-start"
                      >
                        <LogOut size={15} />
                        {isRTL ? 'تسجيل الخروج' : 'Sign Out'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* ── Guest: login + post ── */
              <>
                <Link
                  href={`/${locale}/auth/login`}
                  className="text-white/80 hover:text-white border border-white/30
                             hover:border-white px-4 py-2 rounded-lg text-sm transition-all"
                >
                  {t('login')}
                </Link>
                <Link
                  href={`/${locale}/listings/create`}
                  className="bg-emerald hover:bg-emerald-dark text-white px-4 py-2
                             rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  {t('post')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-white p-2 rounded-lg hover:bg-white/10"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-navy-dark px-4 py-3">
          <nav className="flex flex-col gap-1 mb-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10
                           px-3 py-2.5 rounded-lg text-sm transition-all"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex gap-2 pt-2 border-t border-white/10">
            <button
              onClick={switchLocale}
              className="flex-1 bg-white/10 text-white text-sm py-2 rounded-lg
                         hover:bg-white/20 transition-colors"
            >
              {locale === 'ar' ? 'English' : 'العربية'}
            </button>

            {isAuthenticated ? (
              <>
                <Link href={`/${locale}/dashboard`} onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center text-white border border-white/30 py-2 rounded-lg text-sm">
                  {isRTL ? 'لوحتي' : 'Dashboard'}
                </Link>
                <button onClick={() => { setMobileOpen(false); handleLogout(); }}
                  className="flex-1 text-center bg-red-500 text-white py-2 rounded-lg text-sm font-semibold">
                  {isRTL ? 'خروج' : 'Sign Out'}
                </button>
              </>
            ) : (
              <>
                <Link href={`/${locale}/auth/login`} onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center text-white border border-white/30 py-2 rounded-lg text-sm">
                  {t('login')}
                </Link>
                <Link href={`/${locale}/listings/create`} onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center bg-emerald text-white py-2 rounded-lg text-sm font-semibold">
                  {t('post')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>

    {/* Messages drawer */}
    <MessagesDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
