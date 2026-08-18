import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, Search, SlidersHorizontal, MapPin, Shield, Tag, Sparkles, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';

const shoppingCategories = [
  { id: 'fashion', name: 'Fashion', icon: '👗' },
  { id: 'israeli-designers', name: 'Israeli Designers', icon: '✂️' },
  { id: 'jewelry', name: 'Jewelry', icon: '💎' },
  { id: 'judaica', name: 'Judaica', icon: '🕎' },
  { id: 'beauty-skincare', name: 'Beauty & Skincare', icon: '🧴' },
  { id: 'dead-sea', name: 'Dead Sea Products', icon: '🌊' },
  { id: 'home-design', name: 'Home & Design', icon: '🏠' },
  { id: 'art-ceramics', name: 'Art & Ceramics', icon: '🎨' },
  { id: 'wine', name: 'Wine', icon: '🍷' },
  { id: 'gourmet-food', name: 'Gourmet Food', icon: '🧀' },
];

interface Brand {
  id: number;
  name: string;
  short_description: string;
  category_ids: string;
  style_tags: string;
  price_level: number;
  israeli_brand: boolean;
  made_in_israel: boolean;
  verification_status: string;
  is_featured: boolean;
  sponsored: boolean;
}

interface Store {
  id: number;
  brand_id: number | null;
  name: string;
  description: string;
  address: string;
  city: string;
  shabbat_closed: boolean;
  wheelchair_accessible: string;
  store_type: string;
}

type ViewMode = 'list' | 'map';

export default function ShoppingSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCity = searchParams.get('city') || '';
  const initialCategory = searchParams.get('category') || '';
  const isAI = searchParams.get('ai') === 'true';
  const filterIsraeli = searchParams.get('israeliBrand') === 'true';
  const filterMadeInIsrael = searchParams.get('madeInIsrael') === 'true';
  const filterHasOffer = searchParams.get('hasOffer') === 'true';

  const [query, setQuery] = useState(initialQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filters, setFilters] = useState({
    city: initialCity,
    category: initialCategory,
    israeliBrand: filterIsraeli,
    madeInIsrael: filterMadeInIsrael,
    hasOffer: filterHasOffer,
    shabbatOpen: false,
    maxPrice: 0,
  });

  const [allBrands, setAllBrands] = useState<Brand[]>([]);
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [brandsData, storesData] = await Promise.all([
          api.getShoppingBrands(),
          api.getShoppingStores(filters.city ? { city: filters.city } : undefined),
        ]);
        setAllBrands(brandsData);
        setAllStores(storesData);
      } catch (error) {
        console.error('Failed to load search data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [filters.city]);

  // AI mock interpretation
  const aiInterpretation = useMemo(() => {
    if (!isAI || !initialQuery) return null;
    const q = initialQuery.toLowerCase();
    const result: Record<string, string> = { intent: 'shopping_search' };
    if (q.includes('fashion') || q.includes('cloth')) result.categories = 'fashion';
    if (q.includes('skincare') || q.includes('beauty')) result.categories = 'beauty-skincare';
    if (q.includes('judaica')) result.categories = 'judaica';
    if (q.includes('jewelry') || q.includes('jewel')) result.categories = 'jewelry';
    if (q.includes('tel aviv')) result.city = 'Tel Aviv';
    if (q.includes('jerusalem')) result.city = 'Jerusalem';
    if (q.includes('haifa')) result.city = 'Haifa';
    if (q.includes('israeli')) result.israeliBrand = 'true';
    if (q.includes('under')) {
      const match = q.match(/under\s*₪?\s*(\d+)/);
      if (match) result.maxBudget = match[1];
    }
    return result;
  }, [isAI, initialQuery]);

  // Filter brands
  const filteredBrands = useMemo(() => {
    return allBrands.filter((b) => {
      if (filters.israeliBrand && !b.israeli_brand) return false;
      if (filters.madeInIsrael && !(b.made_in_israel && b.verification_status === 'verified')) return false;
      if (filters.category && !b.category_ids?.includes(filters.category)) return false;
      if (filters.maxPrice && b.price_level > filters.maxPrice) return false;
      if (query) {
        const q = query.toLowerCase();
        return b.name.toLowerCase().includes(q) || b.short_description?.toLowerCase().includes(q) || b.category_ids?.toLowerCase().includes(q) || b.style_tags?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allBrands, filters, query]);

  // Filter stores
  const filteredStores = useMemo(() => {
    return allStores.filter((s) => {
      if (filters.shabbatOpen && s.shabbat_closed) return false;
      if (query) {
        const q = query.toLowerCase();
        return s.name.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q) || s.city.toLowerCase().includes(q);
      }
      if (filters.israeliBrand || filters.madeInIsrael) {
        if (!s.brand_id) return false;
        const brand = allBrands.find(b => b.id === s.brand_id);
        if (filters.israeliBrand && !brand?.israeli_brand) return false;
        if (filters.madeInIsrael && !(brand?.made_in_israel && brand.verification_status === 'verified')) return false;
      }
      if (filters.category) {
        if (!s.brand_id) return false;
        const brand = allBrands.find(b => b.id === s.brand_id);
        if (!brand?.category_ids?.includes(filters.category)) return false;
      }
      return true;
    });
  }, [allStores, allBrands, filters, query]);

  const activeFilterCount = Object.values(filters).filter(v => v && v !== '' && v !== 0 && v !== false).length;

  return (
    <AppLayout>
      <div className="px-4 py-3">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate('/shopping')} className="p-1.5 rounded-lg hover:bg-white">
            <ArrowLeft size={20} className="text-[#1A1A2E]" />
          </button>
          <div className="flex-1 bg-white rounded-xl p-2.5 border border-[#D4C5A9]/20 shadow-sm flex items-center gap-2">
            <Search size={14} className="text-[#1A1A2E]/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="flex-1 text-sm font-body outline-none bg-transparent placeholder:text-[#1A1A2E]/30"
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-0.5">
                <X size={12} className="text-[#1A1A2E]/40" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg relative ${showFilters ? 'bg-[#003F87] text-white' : 'bg-white border border-[#D4C5A9]/20'}`}
          >
            <SlidersHorizontal size={16} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C0392B] text-white text-[8px] rounded-full flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* AI Interpretation */}
        {aiInterpretation && (
          <div className="bg-gradient-to-r from-[#C8A96E]/10 to-[#003F87]/5 rounded-xl p-3 mb-3 border border-[#C8A96E]/20">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles size={12} className="text-[#C8A96E]" />
              <span className="text-[10px] font-body font-semibold text-[#C8A96E]">AI Interpretation</span>
            </div>
            <p className="text-[10px] font-body text-[#1A1A2E]/70 italic mb-1">"{initialQuery}"</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(aiInterpretation).filter(([k]) => k !== 'intent').map(([key, value]) => (
                <span key={key} className="text-[8px] font-body bg-white px-1.5 py-0.5 rounded-full text-[#003F87] border border-[#003F87]/10">
                  {key}: {value}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl p-3 border border-[#D4C5A9]/20 shadow-sm mb-3 space-y-3">
            <div>
              <p className="text-[10px] font-body text-[#1A1A2E]/50 mb-1 font-medium">City</p>
              <div className="flex gap-1.5 flex-wrap">
                {['', 'Tel Aviv', 'Jerusalem', 'Haifa', 'Eilat'].map((city) => (
                  <button
                    key={city}
                    onClick={() => setFilters(f => ({ ...f, city }))}
                    className={`text-[10px] font-body px-2 py-1 rounded-full ${filters.city === city ? 'bg-[#003F87] text-white' : 'bg-[#FAF8F5] text-[#1A1A2E]/70 border border-[#D4C5A9]/30'}`}
                  >
                    {city || 'All'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-body text-[#1A1A2E]/50 mb-1 font-medium">Category</p>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setFilters(f => ({ ...f, category: '' }))}
                  className={`text-[10px] font-body px-2 py-1 rounded-full ${!filters.category ? 'bg-[#003F87] text-white' : 'bg-[#FAF8F5] text-[#1A1A2E]/70 border border-[#D4C5A9]/30'}`}
                >
                  All
                </button>
                {shoppingCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setFilters(f => ({ ...f, category: cat.id }))}
                    className={`text-[10px] font-body px-2 py-1 rounded-full ${filters.category === cat.id ? 'bg-[#003F87] text-white' : 'bg-[#FAF8F5] text-[#1A1A2E]/70 border border-[#D4C5A9]/30'}`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilters(f => ({ ...f, israeliBrand: !f.israeliBrand }))}
                className={`text-[10px] font-body px-2.5 py-1.5 rounded-full flex items-center gap-1 ${filters.israeliBrand ? 'bg-[#003F87] text-white' : 'bg-[#FAF8F5] text-[#1A1A2E]/70 border border-[#D4C5A9]/30'}`}
              >
                🇮🇱 Israeli Brand
              </button>
              <button
                onClick={() => setFilters(f => ({ ...f, madeInIsrael: !f.madeInIsrael }))}
                className={`text-[10px] font-body px-2.5 py-1.5 rounded-full flex items-center gap-1 ${filters.madeInIsrael ? 'bg-[#4A7C59] text-white' : 'bg-[#FAF8F5] text-[#1A1A2E]/70 border border-[#D4C5A9]/30'}`}
              >
                <Shield size={9} /> Made in Israel
              </button>
              <button
                onClick={() => setFilters(f => ({ ...f, hasOffer: !f.hasOffer }))}
                className={`text-[10px] font-body px-2.5 py-1.5 rounded-full flex items-center gap-1 ${filters.hasOffer ? 'bg-[#C0392B] text-white' : 'bg-[#FAF8F5] text-[#1A1A2E]/70 border border-[#D4C5A9]/30'}`}
              >
                <Tag size={9} /> Has Offer
              </button>
              <button
                onClick={() => setFilters(f => ({ ...f, shabbatOpen: !f.shabbatOpen }))}
                className={`text-[10px] font-body px-2.5 py-1.5 rounded-full flex items-center gap-1 ${filters.shabbatOpen ? 'bg-[#C8A96E] text-white' : 'bg-[#FAF8F5] text-[#1A1A2E]/70 border border-[#D4C5A9]/30'}`}
              >
                🕯️ Open Shabbat
              </button>
            </div>
            <button
              onClick={() => setFilters({ city: '', category: '', israeliBrand: false, madeInIsrael: false, hasOffer: false, shabbatOpen: false, maxPrice: 0 })}
              className="text-[10px] font-body text-[#C0392B] font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-body text-[#1A1A2E]/60">
            {loading ? 'Loading...' : `${filteredBrands.length} brands • ${filteredStores.length} stores`}
          </p>
          <div className="flex gap-1 bg-white rounded-lg p-0.5 border border-[#D4C5A9]/20">
            <button
              onClick={() => setViewMode('list')}
              className={`text-[10px] font-body px-2 py-1 rounded ${viewMode === 'list' ? 'bg-[#003F87] text-white' : 'text-[#1A1A2E]/50'}`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`text-[10px] font-body px-2 py-1 rounded ${viewMode === 'map' ? 'bg-[#003F87] text-white' : 'text-[#1A1A2E]/50'}`}
            >
              Map
            </button>
          </div>
        </div>

        {/* Results */}
        {viewMode === 'list' ? (
          <div className="space-y-3">
            {/* Brands */}
            {filteredBrands.length > 0 && (
              <>
                <p className="text-[10px] font-body text-[#1A1A2E]/50 font-medium uppercase tracking-wider">Brands</p>
                {filteredBrands.slice(0, 8).map((brand) => (
                  <BrandCard key={brand.id} brand={brand} onClick={() => navigate(`/shopping/brand/${brand.id}`)} />
                ))}
              </>
            )}

            {/* Stores */}
            {filteredStores.length > 0 && (
              <>
                <p className="text-[10px] font-body text-[#1A1A2E]/50 font-medium uppercase tracking-wider mt-4">Stores</p>
                {filteredStores.slice(0, 8).map((store) => (
                  <StoreCard key={store.id} store={store} brands={allBrands} onClick={() => navigate(`/shopping/store/${store.id}`)} />
                ))}
              </>
            )}

            {filteredBrands.length === 0 && filteredStores.length === 0 && !loading && (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">🔍</p>
                <p className="font-body text-sm text-[#1A1A2E]/50">No results found</p>
                <p className="text-[10px] font-body text-[#1A1A2E]/40 mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden border border-[#D4C5A9]/20 shadow-sm">
            <iframe
              src={`https://maps.google.com/maps?q=shopping+${encodeURIComponent(filters.city || 'Tel Aviv')},+Israel&t=&z=13&ie=UTF8&iwloc=&output=embed`}
              width="100%"
              height="350"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              title="Shopping Map"
            />
            <div className="p-3">
              <p className="text-xs font-body text-[#1A1A2E]/60">{filteredStores.length} stores in {filters.city || 'Israel'}</p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function BrandCard({ brand, onClick }: { brand: Brand; onClick: () => void }) {
  const getCategoryIcon = (categoryIds: string) => {
    const first = categoryIds?.split(',')[0] || '';
    if (first === 'beauty-skincare' || first === 'dead-sea') return '🧴';
    if (first === 'fashion' || first === 'israeli-designers') return '👗';
    if (first === 'jewelry') return '💎';
    if (first === 'wine') return '🍷';
    if (first === 'judaica') return '🕎';
    return '🏷️';
  };

  return (
    <button onClick={onClick} className="w-full bg-white rounded-2xl p-3 border border-[#D4C5A9]/20 shadow-sm text-left active:scale-[0.98] transition-transform star-pattern">
      <div className="flex gap-3">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#003F87]/10 to-[#C8A96E]/10 flex items-center justify-center flex-shrink-0">
          <span className="text-xl">{getCategoryIcon(brand.category_ids)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-body font-semibold text-sm text-[#1A1A2E] truncate">{brand.name}</h3>
            {brand.sponsored && <span className="text-[7px] font-body text-[#1A1A2E]/30 bg-[#1A1A2E]/5 px-1 rounded">Ad</span>}
          </div>
          <p className="text-[10px] font-body text-[#1A1A2E]/60 line-clamp-1">{brand.short_description}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {brand.israeli_brand && <span className="text-[8px] font-body text-[#003F87] bg-[#003F87]/10 px-1.5 py-0.5 rounded-full">🇮🇱 Israeli</span>}
            {brand.made_in_israel && brand.verification_status === 'verified' && (
              <span className="text-[8px] font-body text-[#4A7C59] bg-[#4A7C59]/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Shield size={7} /> Made in IL</span>
            )}
            <span className="text-[8px] font-body text-[#C8A96E]">{'₪'.repeat(brand.price_level)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function StoreCard({ store, brands, onClick }: { store: Store; brands: Brand[]; onClick: () => void }) {
  const brand = store.brand_id ? brands.find(b => b.id === store.brand_id) : null;
  return (
    <button onClick={onClick} className="w-full bg-white rounded-2xl p-3 border border-[#D4C5A9]/20 shadow-sm text-left active:scale-[0.98] transition-transform">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#003F87]/5 to-[#C8A96E]/5 flex items-center justify-center flex-shrink-0">
          <MapPin size={14} className="text-[#003F87]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-body font-semibold text-[11px] text-[#1A1A2E] truncate">{store.name}</h3>
          <p className="text-[9px] font-body text-[#1A1A2E]/50 truncate">{store.address}</p>
          <div className="flex items-center gap-1.5 mt-1">
            {brand?.israeli_brand && <span className="text-[8px] font-body text-[#003F87] bg-[#003F87]/10 px-1 py-0.5 rounded">🇮🇱</span>}
            <span className="text-[8px] font-body text-[#1A1A2E]/40">{store.city}</span>
            <span className={`text-[8px] font-body ${store.wheelchair_accessible === 'yes' ? 'text-[#4A7C59]' : 'text-[#1A1A2E]/30'}`}>
              {store.wheelchair_accessible === 'yes' ? '♿ Accessible' : ''}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}