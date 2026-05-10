'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useLocale } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search, X, Plus, MapPin, Star, Loader2,
  LayoutGrid, LayoutList, SlidersHorizontal,
  ArrowUpDown, Truck, Bookmark, Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { listingsApi, interactionsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { ListingCard } from '@/components/ui/ListingCard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import toast from 'react-hot-toast';
import type { Listing } from '@/types';

/* ─── Constants ─────────────────────────────────────────── */
const SECTIONS = [
  { value: '',          labelAr: 'جميع الأقسام',    labelEn: 'All Sections', emoji: '🏠', color: 'text-gray-600'   },
  { value: 'ma',        labelAr: 'استحواذ ودمج',    labelEn: 'M&A',          emoji: '🏢', color: 'text-green-600'  },
  { value: 'fleet',     labelAr: 'أسطول مركبات',    labelEn: 'Fleet',        emoji: '🚛', color: 'text-blue-600'   },
  { value: 'contracts', labelAr: 'عقود ومناقصات',   labelEn: 'Contracts',    emoji: '📄', color: 'text-amber-600'  },
  { value: 'jobs',      labelAr: 'وظائف',           labelEn: 'Jobs',         emoji: '💼', color: 'text-purple-600' },
  { value: 'forum',     labelAr: 'منتدى النقاش',    labelEn: 'Forum',        emoji: '💬', color: 'text-red-600'    },
];

const LISTING_TYPES = [
  { value: 'for_sale', labelAr: 'للبيع',    labelEn: 'For Sale',  emoji: '🏷️' },
  { value: 'for_rent', labelAr: 'للإيجار',  labelEn: 'For Rent',  emoji: '🔑' },
  { value: 'wanted',   labelAr: 'مطلوب',    labelEn: 'Wanted',    emoji: '🔍' },
  { value: 'offering', labelAr: 'معروض',    labelEn: 'Offering',  emoji: '📢' },
];

// Which listing types are relevant per section
const SECTION_TYPES: Record<string, string[]> = {
  '':          ['for_sale', 'for_rent', 'offering', 'wanted'],
  fleet:       ['for_sale', 'for_rent', 'wanted'],
  contracts:   ['offering', 'wanted'],
  ma:          [],   // no type filter (all = acquisition)
  jobs:        [],   // no type filter (all = job)
  forum:       [],   // no type filter (all = discussion)
};

const SORT_OPTIONS = [
  { value: 'newest',     labelAr: 'الأحدث أولاً',    labelEn: 'Newest First'    },
  { value: 'price_asc',  labelAr: 'السعر: الأقل',    labelEn: 'Price: Low–High' },
  { value: 'price_desc', labelAr: 'السعر: الأعلى',   labelEn: 'Price: High–Low' },
  { value: 'featured',   labelAr: 'المميزة أولاً',   labelEn: 'Featured First'  },
];

const SAUDI_CITIES = [
  'الرياض','جدة','مكة المكرمة','المدينة المنورة','الدمام',
  'الخبر','تبوك','أبها','نجران','حائل','القصيم','بريدة','ينبع',
];

/* ─── Inner component (uses useSearchParams) ─────────────── */
function ListingsContent() {
  const locale  = useLocale();
  const isRTL   = locale === 'ar';
  const router  = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();

  /* view */
  const [viewMode,          setViewMode]          = useState<'grid'|'list'>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  /* saved searches */
  const [savedSearches,   setSavedSearches]   = useState<any[]>([]);
  const [savingSearch,    setSavingSearch]    = useState(false);
  const [showSaveInput,   setShowSaveInput]   = useState(false);
  const [saveSearchName,  setSaveSearchName]  = useState('');

  /* data */
  const [listings,    setListings]    = useState<Listing[]>([]);
  const [featured,    setFeatured]    = useState<Listing[]>([]);
  const [meta,        setMeta]        = useState<any>(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page,        setPage]        = useState(1);

  /* ── filters — initialised from URL query params ── */
  const [search,       setSearch]       = useState(() => searchParams.get('search')       ?? '');
  const [section,      setSection]      = useState(() => searchParams.get('section')      ?? '');
  const [city,         setCity]         = useState(() => searchParams.get('city')         ?? '');
  const [priceMin,     setPriceMin]     = useState(() => searchParams.get('price_min')    ?? '');
  const [priceMax,     setPriceMax]     = useState(() => searchParams.get('price_max')    ?? '');
  const [sort,         setSort]         = useState(() => searchParams.get('sort')         ?? 'newest');
  const [listingTypes, setListingTypes] = useState<string[]>(
    () => searchParams.getAll('listing_type')
  );

  /* ── debouncedSearch — actual value sent to API (500ms delay) ── */
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search]);

  /* ── Sync active filters → URL (shareable links) ── */
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch)      params.set('search',       debouncedSearch);
    if (section)              params.set('section',      section);
    if (city)                 params.set('city',         city);
    if (priceMin)             params.set('price_min',    priceMin);
    if (priceMax)             params.set('price_max',    priceMax);
    if (sort !== 'newest')    params.set('sort',         sort);
    listingTypes.forEach(lt => params.append('listing_type', lt));
    const qs = params.toString();
    router.replace(`/${locale}/listings${qs ? `?${qs}` : ''}`, { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, section, city, priceMin, priceMax, sort, listingTypes, locale]);

  /* ── Featured ── */
  useEffect(() => {
    listingsApi.getAll({ limit: 20, sort: 'featured' })
      .then(res => {
        const all: Listing[] = res.data ?? res;
        setFeatured(all.filter((l: Listing) => l.is_featured === true));
      })
      .catch(() => {});
  }, []);

  /* ── Fetch listings (depends on debouncedSearch, not raw search) ── */
  const fetchListings = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setIsLoading(true); else setLoadingMore(true);
    try {
      const params: Record<string, any> = { page: pageNum, sort };
      if (debouncedSearch)          params.search       = debouncedSearch;
      if (section)                  params.section      = section;
      if (city)                     params.city         = city;
      if (priceMin)                 params.price_min    = priceMin;
      if (priceMax)                 params.price_max    = priceMax;
      if (listingTypes.length > 0)  params.listing_type = listingTypes.join(',');
      const res  = await listingsApi.getAll(params);
      const data = res.data ?? res;
      setListings(prev => append ? [...prev, ...data] : data);
      setMeta(res.meta ?? null);
    } catch {
      if (!append) setListings([]);
    } finally {
      setIsLoading(false); setLoadingMore(false);
    }
  }, [debouncedSearch, section, city, priceMin, priceMax, sort, listingTypes]);

  useEffect(() => { setPage(1); fetchListings(1, false); }, [fetchListings]);

  /* ── Load saved searches ── */
  useEffect(() => {
    if (!isAuthenticated) return;
    interactionsApi.getSavedSearches()
      .then((res: any) => setSavedSearches(res.data ?? []))
      .catch(() => {});
  }, [isAuthenticated]);

  /* ── Save current search ── */
  const handleSaveSearch = async () => {
    if (!saveSearchName.trim()) return;
    setSavingSearch(true);
    try {
      const res: any = await interactionsApi.saveSearch({
        name: saveSearchName.trim(),
        filters: { section, city, search: debouncedSearch, priceMin, priceMax, sort, listingTypes },
      });
      setSavedSearches(prev => [res.data, ...prev]);
      setSaveSearchName('');
      setShowSaveInput(false);
      toast.success(isRTL ? 'تم حفظ البحث ✓' : 'Search saved ✓');
    } catch {
      toast.error(isRTL ? 'فشل الحفظ' : 'Failed to save');
    } finally {
      setSavingSearch(false);
    }
  };

  /* ── Delete saved search ── */
  const handleDeleteSaved = async (id: number) => {
    try {
      await interactionsApi.deleteSavedSearch(id);
      setSavedSearches(prev => prev.filter((s: any) => s.id !== id));
    } catch {}
  };

  /* ── Apply a saved search ── */
  const applySearch = (filters: any) => {
    setSection(filters.section ?? '');
    setCity(filters.city ?? '');
    setSearch(filters.search ?? '');
    setPriceMin(filters.priceMin ?? '');
    setPriceMax(filters.priceMax ?? '');
    setSort(filters.sort ?? 'newest');
    setListingTypes(filters.listingTypes ?? []);
    setMobileFiltersOpen(false);
  };

  const handleLoadMore = () => { const n = page + 1; setPage(n); fetchListings(n, true); };

  const toggleListingType = (val: string) =>
    setListingTypes(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);

  const clearFilters = () => {
    setSearch(''); setSection(''); setCity('');
    setPriceMin(''); setPriceMax(''); setSort('newest'); setListingTypes([]);
  };

  /* active filter count */
  const activeFilterCount = [
    section, city, priceMin, priceMax,
    sort !== 'newest' ? sort : '',
    ...listingTypes,
  ].filter(Boolean).length;

  const hasMore    = meta && page < meta.last_page;
  const totalCount = meta?.total ?? listings.length;

  /* ── Sidebar (shared desktop + mobile drawer) ── */
  const SidebarContent = () => (
    <div className="space-y-6">

      {/* Saved Searches */}
      {isAuthenticated && savedSearches.length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Bookmark size={11} />
            {isRTL ? 'بحوثي المحفوظة' : 'Saved Searches'}
          </p>
          <div className="space-y-1">
            {savedSearches.map((s: any) => (
              <div key={s.id}
                className="flex items-center gap-1.5 group px-3 py-2 rounded-xl hover:bg-emerald/5 transition">
                <button
                  onClick={() => applySearch(s.data?.filters ?? {})}
                  className="flex-1 text-start text-sm text-gray-700 hover:text-navy truncate font-medium">
                  🔍 {s.data?.name}
                </button>
                <button
                  onClick={() => handleDeleteSaved(s.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition p-0.5 rounded">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
          <hr className="border-gray-100 mt-4" />
        </div>
      )}

      {/* Sections */}
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
          {isRTL ? 'القسم' : 'Section'}
        </p>
        <div className="space-y-1">
          {SECTIONS.map(s => (
            <button key={s.value} onClick={() => { setSection(s.value); setMobileFiltersOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition
                          ${section === s.value
                            ? 'bg-navy text-white shadow-sm'
                            : 'text-gray-700 hover:bg-gray-100'}`}>
              <span className="text-base">{s.emoji}</span>
              <span>{isRTL ? s.labelAr : s.labelEn}</span>
              {section === s.value && <span className="ms-auto w-1.5 h-1.5 rounded-full bg-emerald" />}
            </button>
          ))}
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* City */}
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
          {isRTL ? 'المدينة' : 'City'}
        </p>
        <div className="relative">
          <MapPin size={13} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select value={city} onChange={e => setCity(e.target.value)}
            className="input text-sm py-2 ps-8 w-full">
            <option value="">{isRTL ? 'جميع المدن' : 'All Cities'}</option>
            {SAUDI_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Listing Type — only when current section has type options */}
      {(SECTION_TYPES[section] ?? []).length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            {isRTL ? 'نوع الإعلان' : 'Listing Type'}
          </p>
          <div className="space-y-2">
            {LISTING_TYPES
              .filter(t => (SECTION_TYPES[section] ?? []).includes(t.value))
              .map(t => (
                <label key={t.value}
                  className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="checkbox" checked={listingTypes.includes(t.value)}
                    onChange={() => toggleListingType(t.value)}
                    className="w-4 h-4 accent-emerald rounded" />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    {t.emoji} {isRTL ? t.labelAr : t.labelEn}
                  </span>
                </label>
              ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
          {isRTL ? 'نطاق السعر (ر.س)' : 'Price Range (SAR)'}
        </p>
        <div className="flex gap-2 items-center">
          <input type="number" value={priceMin} onChange={e => setPriceMin(e.target.value)}
            className="input text-sm py-2 w-full"
            placeholder={isRTL ? 'من' : 'Min'} />
          <span className="text-gray-400 text-xs shrink-0">—</span>
          <input type="number" value={priceMax} onChange={e => setPriceMax(e.target.value)}
            className="input text-sm py-2 w-full"
            placeholder={isRTL ? 'إلى' : 'Max'} />
        </div>
      </div>

      {/* Sort */}
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
          {isRTL ? 'الترتيب' : 'Sort By'}
        </p>
        <div className="space-y-1">
          {SORT_OPTIONS.map(o => (
            <label key={o.value}
              className="flex items-center gap-2.5 cursor-pointer group px-1 py-1">
              <input type="radio" name="sort" checked={sort === o.value}
                onChange={() => setSort(o.value)}
                className="w-4 h-4 accent-emerald" />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                {isRTL ? o.labelAr : o.labelEn}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear filters */}
      {activeFilterCount > 0 && (
        <button onClick={clearFilters}
          className="w-full py-2 text-sm text-red-500 hover:text-red-600 border border-red-200
                     hover:bg-red-50 rounded-xl transition font-medium">
          {isRTL ? `مسح الفلاتر (${activeFilterCount})` : `Clear Filters (${activeFilterCount})`}
        </button>
      )}

      {/* Save Search */}
      {isAuthenticated && activeFilterCount > 0 && (
        <div>
          {showSaveInput ? (
            <div className="flex gap-1.5">
              <input
                autoFocus
                value={saveSearchName}
                onChange={e => setSaveSearchName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveSearch();
                  if (e.key === 'Escape') setShowSaveInput(false);
                }}
                className="input text-sm py-2 flex-1"
                placeholder={isRTL ? 'اسم البحث…' : 'Search name…'}
                maxLength={60}
              />
              <button onClick={handleSaveSearch} disabled={savingSearch || !saveSearchName.trim()}
                className="px-3 py-2 bg-emerald text-white text-xs rounded-xl font-bold
                           disabled:opacity-40 hover:bg-emerald-dark transition">
                {savingSearch ? '…' : (isRTL ? 'حفظ' : 'Save')}
              </button>
              <button onClick={() => setShowSaveInput(false)}
                className="px-2 py-2 text-gray-400 hover:text-gray-600 transition">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowSaveInput(true)}
              className="w-full py-2 text-sm text-emerald border border-emerald/30
                         hover:bg-emerald/5 rounded-xl transition font-medium flex items-center justify-center gap-1.5">
              <Bookmark size={13} />
              {isRTL ? 'حفظ هذا البحث' : 'Save this search'}
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* ── Search Hero ─────────────────────────────── */}
      <div className="bg-gradient-to-br from-navy to-navy/90 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-5">
            <h1 className="text-2xl md:text-3xl font-black text-white mb-1.5">
              {isRTL ? '🚛 سوق اللوجستيك B2B' : '🚛 B2B Logistics Marketplace'}
            </h1>
            <p className="text-white/60 text-sm">
              {isRTL
                ? 'اكتشف فرص الاستحواذ والأساطيل والعقود والوظائف في السوق السعودي'
                : 'Discover M&A, fleets, contracts and jobs in the Saudi market'}
            </p>
          </div>

          {/* Search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full ps-11 pe-4 py-3.5 rounded-xl text-sm border-0 shadow-lg
                           focus:outline-none focus:ring-2 focus:ring-emerald"
                placeholder={isRTL ? 'ابحث في جميع الإعلانات…' : 'Search all listings…'}
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              )}
              {/* Debounce indicator */}
              {search !== debouncedSearch && (
                <span className="absolute end-9 top-1/2 -translate-y-1/2">
                  <Loader2 size={14} className="animate-spin text-gray-300" />
                </span>
              )}
            </div>
            <Link href={`/${locale}/listings/create`}
              className="bg-emerald hover:bg-emerald-dark text-white px-5 py-3.5 rounded-xl
                         text-sm font-bold flex items-center gap-2 shadow-lg transition whitespace-nowrap">
              <Plus size={16} />
              {isRTL ? 'أضف إعلان' : 'Post Ad'}
            </Link>
          </div>

          {/* Section quick tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
            {SECTIONS.map(s => (
              <button key={s.value}
                onClick={() => {
                  setSection(s.value);
                  // Clear listing type filter for sections that don't use it
                  if ((SECTION_TYPES[s.value] ?? []).length === 0) setListingTypes([]);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold
                            whitespace-nowrap shrink-0 transition border
                            ${section === s.value
                              ? 'bg-white text-navy border-white shadow'
                              : 'text-white/70 border-white/20 hover:border-white/50 hover:text-white'}`}>
                {s.emoji} {isRTL ? s.labelAr : s.labelEn}
              </button>
            ))}
          </div>

          {/* Listing type quick-filter pills — shown only for sections that have type options */}
          {(SECTION_TYPES[section] ?? []).length > 0 && (
            <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
              {/* "All" pill */}
              <button
                onClick={() => setListingTypes([])}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold
                            whitespace-nowrap shrink-0 transition border
                            ${listingTypes.length === 0
                              ? 'bg-white text-navy border-white shadow'
                              : 'text-white/60 border-white/20 hover:border-white/50 hover:text-white'}`}>
                {isRTL ? 'الكل' : 'All'}
              </button>
              {LISTING_TYPES
                .filter(t => (SECTION_TYPES[section] ?? []).includes(t.value))
                .map(t => {
                  const active = listingTypes.includes(t.value);
                  return (
                    <button key={t.value}
                      onClick={() => setListingTypes(
                        active && listingTypes.length === 1
                          ? []                                              // deselect last → show all
                          : [t.value]                                       // select one (exclusive)
                      )}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold
                                  whitespace-nowrap shrink-0 transition border
                                  ${active
                                    ? 'bg-white text-navy border-white shadow'
                                    : 'text-white/60 border-white/20 hover:border-white/50 hover:text-white'}`}>
                      {t.emoji} {isRTL ? t.labelAr : t.labelEn}
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* ── Body ────────────────────────────────────── */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <div className="flex gap-6 items-start">

          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 sticky top-20">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-5">
                <span className="font-bold text-navy text-sm flex items-center gap-2">
                  <SlidersHorizontal size={15} className="text-emerald" />
                  {isRTL ? 'فلترة النتائج' : 'Filter Results'}
                </span>
                {activeFilterCount > 0 && (
                  <span className="text-[10px] bg-emerald text-white font-bold px-2 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <SidebarContent />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Featured strip */}
            {featured.length > 0 && !section && !debouncedSearch && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200
                              rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Star size={16} className="text-amber-500 fill-amber-500" />
                  <span className="font-bold text-amber-800 text-sm">
                    {isRTL ? 'إعلانات مميزة' : 'Featured Listings'}
                  </span>
                  <span className="text-amber-500 text-xs ms-auto">
                    {isRTL ? 'رعاية' : 'Sponsored'}
                  </span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                  {featured.map(l => {
                    const ftitle = isRTL ? (l.title_ar ?? l.title_en) : (l.title_en ?? l.title_ar);
                    const imgBgF: Record<string, string> = {
                      ma: 'from-green-100 to-green-200', fleet: 'from-blue-100 to-blue-200',
                      contracts: 'from-amber-100 to-amber-200', jobs: 'from-purple-100 to-purple-200',
                      forum: 'from-red-100 to-red-200',
                    };
                    const sEmoji: Record<string, string> = { ma: '🏢', fleet: '🚛', contracts: '📄', jobs: '💼', forum: '💬' };
                    return (
                      <Link key={l.id} href={`/${locale}/listings/${l.id}`}
                        className="shrink-0 w-52 bg-white rounded-xl border border-amber-200 overflow-hidden
                                   hover:shadow-md hover:border-amber-300 transition group">
                        <div className={`h-28 bg-gradient-to-br ${imgBgF[l.section] || 'from-gray-100 to-gray-200'}
                                         flex items-center justify-center text-3xl relative`}>
                          {l.images?.[0]
                            ? <img src={l.images[0]} alt={ftitle ?? ''} className="w-full h-full object-cover" />
                            : <span>{sEmoji[l.section]}</span>
                          }
                        </div>
                        <div className="p-2.5">
                          <p className="font-semibold text-xs text-gray-900 line-clamp-2 leading-snug mb-1">
                            {ftitle}
                          </p>
                          <div className="flex items-center justify-between">
                            {l.city && <span className="text-[10px] text-gray-400">{l.city}</span>}
                            {l.price && (
                              <span className="text-[11px] font-bold text-navy">
                                {Number(l.price).toLocaleString(isRTL ? 'ar-SA' : 'en-US')} {isRTL ? 'ر.س' : 'SAR'}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                {/* Mobile filter button */}
                <button onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border
                             border-gray-200 text-sm font-medium text-gray-700 hover:border-emerald transition">
                  <SlidersHorizontal size={14} />
                  {isRTL ? 'فلترة' : 'Filter'}
                  {activeFilterCount > 0 && (
                    <span className="bg-emerald text-white text-[10px] font-bold
                                     w-4 h-4 rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <span className="text-sm text-gray-600">
                  {isLoading ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 size={13} className="animate-spin" />
                      {isRTL ? 'جارٍ البحث…' : 'Searching…'}
                    </span>
                  ) : (
                    <span>
                      <strong className="text-navy font-bold">{totalCount.toLocaleString()}</strong>{' '}
                      {isRTL ? 'إعلان' : 'listing'}
                      {totalCount !== 1 && !isRTL ? 's' : ''}
                    </span>
                  )}
                </span>
              </div>

              {/* Sort + View toggle */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200
                                text-sm text-gray-600 bg-white">
                  <ArrowUpDown size={13} />
                  <select value={sort} onChange={e => setSort(e.target.value)}
                    className="bg-transparent border-0 outline-none text-sm text-gray-700 cursor-pointer pr-1">
                    {SORT_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{isRTL ? o.labelAr : o.labelEn}</option>
                    ))}
                  </select>
                </div>

                <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => setViewMode('grid')}
                    className={`p-2 transition ${viewMode === 'grid' ? 'bg-navy text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    title={isRTL ? 'شبكة' : 'Grid'}>
                    <LayoutGrid size={15} />
                  </button>
                  <button onClick={() => setViewMode('list')}
                    className={`p-2 transition ${viewMode === 'list' ? 'bg-navy text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    title={isRTL ? 'قائمة' : 'List'}>
                    <LayoutList size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {(debouncedSearch || section || city || priceMin || priceMax || sort !== 'newest' || listingTypes.length > 0) && (
              <div className="flex flex-wrap gap-2 items-center">
                {debouncedSearch && (
                  <FilterChip label={`"${debouncedSearch}"`} onRemove={() => setSearch('')} />
                )}
                {section && (
                  <FilterChip
                    label={`${SECTIONS.find(s => s.value === section)?.emoji} ${SECTIONS.find(s => s.value === section)?.[isRTL ? 'labelAr' : 'labelEn'] ?? section}`}
                    onRemove={() => setSection('')} />
                )}
                {city && <FilterChip label={city} onRemove={() => setCity('')} />}
                {priceMin && <FilterChip label={isRTL ? `من ${priceMin} ر.س` : `Min ${priceMin}`} onRemove={() => setPriceMin('')} />}
                {priceMax && <FilterChip label={isRTL ? `حتى ${priceMax} ر.س` : `Max ${priceMax}`} onRemove={() => setPriceMax('')} />}
                {sort !== 'newest' && (
                  <FilterChip label={SORT_OPTIONS.find(o => o.value === sort)?.[isRTL ? 'labelAr' : 'labelEn'] ?? sort} onRemove={() => setSort('newest')} />
                )}
                {listingTypes.map(lt => (
                  <FilterChip key={lt}
                    label={LISTING_TYPES.find(t => t.value === lt)?.[isRTL ? 'labelAr' : 'labelEn'] ?? lt}
                    onRemove={() => toggleListingType(lt)} />
                ))}
                <button onClick={clearFilters}
                  className="text-xs text-red-400 hover:text-red-600 transition font-medium">
                  {isRTL ? 'مسح الكل ×' : 'Clear all ×'}
                </button>
              </div>
            )}

            {/* Cards */}
            {isLoading ? (
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                : 'space-y-4'}>
                {Array.from({ length: 6 }).map((_, i) => (
                  viewMode === 'grid' ? (
                    <div key={i} className="card animate-pulse overflow-hidden">
                      <div className="h-44 bg-gray-200" />
                      <div className="p-4 space-y-3">
                        <div className="h-3 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                        <div className="h-5 bg-gray-200 rounded w-1/3" />
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="card animate-pulse h-32 flex gap-4 overflow-hidden p-4">
                      <div className="w-32 bg-gray-200 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-3 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                      </div>
                    </div>
                  )
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="text-gray-300" size={32} />
                </div>
                <h2 className="text-lg font-bold text-gray-700 mb-2">
                  {isRTL ? 'لا توجد إعلانات مطابقة' : 'No matching listings'}
                </h2>
                <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
                  {isRTL
                    ? 'جرّب تغيير معايير البحث أو الفلاتر للعثور على ما تبحث عنه'
                    : 'Try changing your search terms or filters to find what you need'}
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="btn-primary text-sm px-5">
                      {isRTL ? 'مسح الفلاتر' : 'Clear Filters'}
                    </button>
                  )}
                  <Link href={`/${locale}/listings/create`} className="btn-navy text-sm px-5">
                    {isRTL ? '+ أضف إعلانك' : '+ Post Your Ad'}
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                  : 'space-y-4'}>
                  {listings.map(listing => (
                    <ListingCard key={listing.id} listing={listing} mode={viewMode} />
                  ))}
                </div>

                {/* Load more */}
                {hasMore && (
                  <div className="pt-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald rounded-full transition-all"
                          style={{ width: `${Math.min(100, (listings.length / totalCount) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">
                        {isRTL
                          ? `${listings.length} من ${totalCount}`
                          : `${listings.length} of ${totalCount}`}
                      </span>
                    </div>
                    <div className="flex justify-center">
                      <button onClick={handleLoadMore} disabled={loadingMore}
                        className="btn-navy px-10 py-3 text-sm flex items-center gap-2 disabled:opacity-60">
                        {loadingMore
                          ? <><Loader2 size={15} className="animate-spin" />{isRTL ? 'جارٍ التحميل…' : 'Loading…'}</>
                          : isRTL ? 'تحميل المزيد' : 'Load More'
                        }
                      </button>
                    </div>
                  </div>
                )}

                {!hasMore && listings.length > 0 && (
                  <p className="text-center text-xs text-gray-400 py-4 border-t border-gray-100">
                    {isRTL
                      ? `✓ تم عرض جميع الإعلانات — ${listings.length} إعلان`
                      : `✓ All ${listings.length} listings shown`}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden"
               onClick={() => setMobileFiltersOpen(false)} />
          <div className={`fixed top-0 ${isRTL ? 'left-0' : 'right-0'} h-full w-80 max-w-[85vw] bg-white
                           z-50 shadow-2xl overflow-y-auto p-5 lg:hidden`}>
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-navy text-base flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-emerald" />
                {isRTL ? 'الفلاتر' : 'Filters'}
              </span>
              <button onClick={() => setMobileFiltersOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                <X size={18} />
              </button>
            </div>
            <SidebarContent />
            <button onClick={() => setMobileFiltersOpen(false)}
              className="btn-primary w-full py-3 mt-6 text-sm">
              {isRTL
                ? `عرض النتائج (${totalCount})`
                : `Show Results (${totalCount})`}
            </button>
          </div>
        </>
      )}

      <Footer />
    </div>
  );
}

/* ── Filter Chip ─────────────────────────────────────────── */
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1.5 text-xs bg-navy/10 text-navy
                     px-2.5 py-1 rounded-full font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-red-500 transition">
        <X size={11} />
      </button>
    </span>
  );
}

/* ── Page export — wraps in Suspense (required for useSearchParams) ── */
export default function ListingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald" size={32} />
      </div>
    }>
      <ListingsContent />
    </Suspense>
  );
}
