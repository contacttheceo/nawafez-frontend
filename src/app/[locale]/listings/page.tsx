'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { listingsApi } from '@/lib/api';
import { ListingCard } from '@/components/ui/ListingCard';
import type { Listing, ListingSection } from '@/types';

const SECTIONS: { value: ListingSection | ''; labelAr: string; labelEn: string }[] = [
  { value: '',           labelAr: 'جميع الأقسام',    labelEn: 'All Sections'   },
  { value: 'ma',         labelAr: 'الاستحواذ والدمج', labelEn: 'M&A'            },
  { value: 'fleet',      labelAr: 'الأسطول',          labelEn: 'Fleet'          },
  { value: 'contracts',  labelAr: 'العقود',            labelEn: 'Contracts'      },
  { value: 'jobs',       labelAr: 'الوظائف',          labelEn: 'Jobs'           },
  { value: 'forum',      labelAr: 'المنتدى',          labelEn: 'Forum'          },
];

const SORT_OPTIONS = [
  { value: 'newest',     labelAr: 'الأحدث',    labelEn: 'Newest'     },
  { value: 'price_asc',  labelAr: 'أقل سعراً', labelEn: 'Price ↑'    },
  { value: 'price_desc', labelAr: 'أعلى سعراً',labelEn: 'Price ↓'    },
  { value: 'featured',   labelAr: 'المميزة',   labelEn: 'Featured'   },
];

const SAUDI_CITIES = [
  'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام',
  'الخبر', 'الظهران', 'تبوك', 'أبها', 'نجران', 'حائل',
  'الجوف', 'القصيم', 'بريدة', 'ينبع',
];

export default function ListingsPage() {
  const locale       = useLocale();
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const [listings, setListings]         = useState<Listing[]>([]);
  const [meta, setMeta]                 = useState<any>(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [showFilters, setShowFilters]   = useState(false);

  // Filter state synced with URL
  const [search,   setSearch]   = useState(searchParams.get('search')   ?? '');
  const [section,  setSection]  = useState(searchParams.get('section')  ?? '');
  const [city,     setCity]     = useState(searchParams.get('city')     ?? '');
  const [priceMin, setPriceMin] = useState(searchParams.get('price_min') ?? '');
  const [priceMax, setPriceMax] = useState(searchParams.get('price_max') ?? '');
  const [sort,     setSort]     = useState(searchParams.get('sort')     ?? 'newest');
  const [page,     setPage]     = useState(Number(searchParams.get('page') ?? 1));

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, sort };
      if (search)   params.search    = search;
      if (section)  params.section   = section;
      if (city)     params.city      = city;
      if (priceMin) params.price_min = priceMin;
      if (priceMax) params.price_max = priceMax;

      const res = await listingsApi.getAll(params);
      setListings(res.data ?? res);
      setMeta(res.meta ?? null);
    } catch {
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, section, city, priceMin, priceMax, sort, page]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const updateUrl = (overrides: Record<string, any> = {}) => {
    const params = new URLSearchParams();
    const merged = { search, section, city, price_min: priceMin, price_max: priceMax, sort, page, ...overrides };
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    updateUrl({ page: 1 });
  };

  const clearFilters = () => {
    setSearch(''); setSection(''); setCity('');
    setPriceMin(''); setPriceMax(''); setSort('newest'); setPage(1);
    router.push(pathname);
  };

  const hasActiveFilters = search || section || city || priceMin || priceMax || sort !== 'newest';

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top filter bar */}
      <div className="bg-white border-b sticky top-16 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-3 items-center">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input ps-9 py-2 text-sm"
                  placeholder={locale === 'ar' ? 'ابحث في الإعلانات…' : 'Search listings…'}
                />
              </div>
              <button type="submit" className="btn-primary py-2 px-4 text-sm">
                {locale === 'ar' ? 'بحث' : 'Search'}
              </button>
            </form>

            {/* Filters toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition ${showFilters ? 'border-emerald bg-emerald/10 text-emerald' : 'border-gray-300 text-gray-600 hover:border-emerald'}`}
            >
              <SlidersHorizontal size={16} />
              {locale === 'ar' ? 'الفلاتر' : 'Filters'}
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-emerald" />}
            </button>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-gray-400 hover:text-red-500 transition">
                <X size={18} />
              </button>
            )}
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t">
              {/* Section */}
              <select
                value={section}
                onChange={(e) => { setSection(e.target.value); setPage(1); }}
                className="input text-sm py-2"
              >
                {SECTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {locale === 'ar' ? s.labelAr : s.labelEn}
                  </option>
                ))}
              </select>

              {/* City */}
              <select
                value={city}
                onChange={(e) => { setCity(e.target.value); setPage(1); }}
                className="input text-sm py-2"
              >
                <option value="">{locale === 'ar' ? 'جميع المدن' : 'All Cities'}</option>
                {SAUDI_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Price range */}
              <div className="flex gap-2 col-span-2 sm:col-span-1">
                <input
                  type="number"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="input text-sm py-2 w-1/2"
                  placeholder={locale === 'ar' ? 'من (ر.س)' : 'Min (SAR)'}
                />
                <input
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="input text-sm py-2 w-1/2"
                  placeholder={locale === 'ar' ? 'إلى' : 'Max'}
                />
              </div>

              {/* Sort */}
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="input text-sm py-2"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {locale === 'ar' ? o.labelAr : o.labelEn}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Listings grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="skeleton h-48 w-full rounded-lg mb-4" />
                <div className="skeleton h-4 w-3/4 mb-2" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">🔍</p>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {locale === 'ar' ? 'لا توجد إعلانات' : 'No listings found'}
            </h2>
            <p className="text-gray-500 text-sm">
              {locale === 'ar' ? 'حاول تغيير معايير البحث أو الفلاتر' : 'Try adjusting your search or filters'}
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn-primary mt-4 text-sm">
                {locale === 'ar' ? 'مسح الفلاتر' : 'Clear filters'}
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {meta?.total != null
                ? (locale === 'ar' ? `${meta.total} إعلان` : `${meta.total} listings`)
                : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} locale={locale} />
              ))}
            </div>

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100 transition"
                >
                  {locale === 'ar' ? '← السابق' : '← Prev'}
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  {page} / {meta.last_page}
                </span>
                <button
                  disabled={page === meta.last_page}
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100 transition"
                >
                  {locale === 'ar' ? 'التالي →' : 'Next →'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
