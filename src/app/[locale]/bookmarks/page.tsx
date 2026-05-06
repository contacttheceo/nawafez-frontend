'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bookmark, Search } from 'lucide-react';
import { interactionsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { ListingCard } from '@/components/ui/ListingCard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { Listing } from '@/types';
import toast from 'react-hot-toast';

export default function BookmarksPage() {
  const locale  = useLocale();
  const isRTL   = locale === 'ar';
  const router  = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [bookmarks, setBookmarks] = useState<Listing[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push(`/${locale}/auth/login`); return; }
    interactionsApi.getBookmarks()
      .then(res => setBookmarks(res.data ?? res))
      .catch(() => toast.error(isRTL ? 'تعذر تحميل المحفوظات' : 'Failed to load bookmarks'))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-navy text-white py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Bookmark size={24} className="text-emerald" />
          <div>
            <h1 className="text-2xl font-black">
              {isRTL ? 'إعلاناتي المحفوظة' : 'Saved Listings'}
            </h1>
            <p className="text-white/60 text-sm mt-0.5">
              {loading ? '...' : (isRTL ? `${bookmarks.length} إعلان محفوظ` : `${bookmarks.length} saved`)}
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card animate-pulse overflow-hidden">
                <div className="h-44 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bookmark size={32} className="text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-600 mb-2">
              {isRTL ? 'لا توجد إعلانات محفوظة' : 'No saved listings yet'}
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              {isRTL
                ? 'احفظ الإعلانات التي تهمك وستجدها هنا'
                : 'Save listings you like and find them here'}
            </p>
            <Link href={`/${locale}/listings`}
              className="btn-primary inline-flex items-center gap-2">
              <Search size={16} />
              {isRTL ? 'تصفح الإعلانات' : 'Browse Listings'}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarks.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
