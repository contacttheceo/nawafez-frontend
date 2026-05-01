'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Globe, Plus, LogIn } from 'lucide-react'

export default function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isRTL = locale === 'ar'

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
            <Link
              href={`/${locale}/auth/login`}
              className="flex-1 text-center text-white border border-white/30
                         py-2 rounded-lg text-sm"
            >
              {t('login')}
            </Link>
            <Link
              href={`/${locale}/listings/create`}
              className="flex-1 text-center bg-emerald text-white py-2 rounded-lg
                         text-sm font-semibold"
            >
              {t('post')}
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
