import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, Search, Sparkles, MapPin, Tag, Shield, Leaf, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';

const cities = ['Tel Aviv', 'Jerusalem', 'Haifa', 'Eilat'];

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
  { id: 'books', name: 'Books', icon: '📚' },
  { id: 'souvenirs', name: 'Souvenirs', icon: '🎁' },
  { id: 'outdoor-hiking', name: 'Outdoor & Hiking', icon: '🥾' },
  { id: 'surf-beach', name: 'Surf & Beach', icon: '🏄' },
  { id: 'children-family', name: 'Children & Family', icon: '👶' },
  { id: 'sustainable', name: 'Sustainable Brands', icon: '♻️' },
  { id: 'shopping-centers', name: 'Shopping Centers', icon: '🏬' },
  { id: 'markets', name: 'Markets', icon: '🛒' },
];

interface ShoppingBrand {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  category_ids: string;
  style_tags: string;
  price_level: number;
  israeli_brand: boolean;
  made_in_israel: boolean;
  verification_status: string;
  sustainability_tags: string;
  website_url: string | null;
  is_featured: boolean;
  sponsored: boolean;
}

interface ShoppingStore {
  id: number;
  brand_id: number | null;
  name: string;
  slug: string;
  description: string;
  address: string;
  city: string;
  neighborhood: string | null;
  phone: string | null;
  opening_hours: string;
  shabbat_closed: boolean;
  wheelchair_accessible: string;
  store_type: string;
  lat: number;
  lng: number;
}

interface ShoppingOffer {
  id: number;
  brand_id: number | null;
  store_id: number | null;
  title: string;
  description: string;
  offer_type: string;
  discount_percent: number | null;
  discount_amount: number | null;
  coupon_code: string | null;
  destination_url: string;
  start_date: string | null;
  end_date: string | null;
  online_only: boolean;
  in_store_only: boolean;
  sponsored: boolean;
  status: string;
}

export default function ShoppingHome() {
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState('Tel Aviv');
  const [searchQuery, setSearchQuery] = useState('');
  const [brands, setBrands] = useState<ShoppingBrand[]>([]);
  const [stores, setStores] = useState<ShoppingStore[]>([]);
  const [offers, setOffers] = useState<ShoppingOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [brandsData, storesData, offersData] = await Promise.all([
          api.getShoppingBrands(),
          api.getShoppingStores({ city: selectedCity }),
          api.getShoppingOffers({ status: 'active' }),
        ]);
        setBrands(brandsData);
        setStores(storesData);
        setOffers(offersData);
      } catch (error) {
        console.error('Failed to load shopping data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedCity]);

  const featuredBrands = brands.filter((b) => b.is_featured);
  const madeInIsrael = brands.filter((b) => b.made_in_israel && b.verification_status === 'verified');
  const activeOffers = offers.slice(0, 6);
  const nearbyStores = stores.slice(0, 5);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/shopping/search?q=${encodeURIComponent(searchQuery)}&city=${selectedCity}`);
    }
  };

  const handleAISearch = () => {
    if (searchQuery.trim()) {
      navigate(`/shopping/search?q=${encodeURIComponent(searchQuery)}&city=${selectedCity}&ai=true`);
    }
  };

  const getCategoryIcon = (categoryIds: string) => {
    const first = categoryIds?.split(',')[0] || '';
    if (first === 'beauty-skincare' || first === 'dead-sea') return '🧴';
    if (first === 'fashion' || first === 'israeli-designers') return '👗';
    if (first === 'jewelry') return '💎';
    if (first === 'wine') return '🍷';
    if (first === 'judaica') return '🕎';
    if (first === 'home-design') return '🏠';
    if (first === 'gourmet-food') return '🧀';
    if (first === 'art-ceramics') return '🎨';
    if (first === 'books') return '📚';
    if (first === 'children-family') return '👶';
    if (first === 'outdoor-hiking') return '🥾';
    return '🏷️';
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-[#003F87]" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 py-3">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/home')} className="p-1.5 rounded-lg hover:bg-white">
            <ArrowLeft size={20} className="text-[#1A1A2E]" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-[#1A1A2E]">Shopping & Israeli Brands</h1>
            <p className="text-[10px] font-body text-[#1A1A2E]/50">Discover authentic Israeli products</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl p-3 border border-[#D4C5A9]/20 shadow-sm mb-3">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-[#1A1A2E]/40" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search brands, stores, products..."
              className="flex-1 text-sm font-body outline-none bg-transparent placeholder:text-[#1A1A2E]/30"
            />
          </div>
          {searchQuery && (
            <div className="flex gap-2 mt-2 pt-2 border-t border-[#D4C5A9]/10">
              <button
                onClick={handleSearch}
                className="flex-1 text-[10px] font-body font-medium text-[#003F87] py-1.5 rounded-lg bg-[#003F87]/5 flex items-center justify-center gap-1"
              >
                <Search size={10} /> Search
              </button>
              <button
                onClick={handleAISearch}
                className="flex-1 text-[10px] font-body font-medium text-[#C8A96E] py-1.5 rounded-lg bg-[#C8A96E]/10 flex items-center justify-center gap-1"
              >
                <Sparkles size={10} /> AI Search
              </button>
            </div>
          )}
        </div>

        {/* AI Natural Language Search */}
        <button
          onClick={() => navigate(`/shopping/search?city=${selectedCity}&ai=true`)}
          className="w-full mb-3 bg-gradient-to-r from-[#C8A96E]/10 to-[#003F87]/5 rounded-xl p-3 border border-[#C8A96E]/20 flex items-center gap-2"
        >
          <Sparkles size={16} className="text-[#C8A96E]" />
          <div className="text-left flex-1">
            <p className="text-xs font-body font-semibold text-[#1A1A2E]">AI Shopping Concierge</p>
            <p className="text-[10px] font-body text-[#1A1A2E]/50">Try: "Israeli skincare brands near my hotel"</p>
          </div>
        </button>

        {/* City Selector */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4 pb-1">
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`flex-shrink-0 flex items-center gap-1 text-[11px] font-body px-3 py-1.5 rounded-full transition-colors ${
                selectedCity === city
                  ? 'bg-[#003F87] text-white'
                  : 'bg-white border border-[#D4C5A9]/30 text-[#1A1A2E]/70'
              }`}
            >
              <MapPin size={10} />
              {city}
            </button>
          ))}
        </div>

        {/* Categories Grid */}
        <div className="mb-4">
          <h2 className="font-body font-semibold text-sm text-[#1A1A2E] mb-2">Categories</h2>
          <div className="grid grid-cols-4 gap-2">
            {shoppingCategories.slice(0, 8).map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/shopping/search?category=${cat.id}&city=${selectedCity}`)}
                className="flex flex-col items-center gap-1 p-2 bg-white rounded-xl border border-[#D4C5A9]/20 hover:border-[#003F87]/20 active:scale-95 transition-all"
              >
                <span className="text-lg">{cat.icon}</span>
                <span className="text-[9px] font-body text-[#1A1A2E]/70 text-center leading-tight">{cat.name}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate(`/shopping/search?city=${selectedCity}`)}
            className="w-full mt-2 text-[10px] font-body text-[#003F87] font-medium text-center py-1"
          >
            View all {shoppingCategories.length} categories →
          </button>
        </div>

        {/* Israeli Brands Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🇮🇱</span>
              <h2 className="font-body font-semibold text-sm text-[#1A1A2E]">Israeli Brands</h2>
            </div>
            <button onClick={() => navigate(`/shopping/search?israeliBrand=true&city=${selectedCity}`)} className="text-[10px] font-body text-[#003F87] font-medium">
              See all →
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
            {featuredBrands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => navigate(`/shopping/brand/${brand.id}`)}
                className="flex-shrink-0 w-28 bg-white rounded-xl p-3 border border-[#D4C5A9]/20 shadow-sm text-center active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-[#003F87]/10 to-[#C8A96E]/10 flex items-center justify-center mb-2">
                  <span className="text-lg">{getCategoryIcon(brand.category_ids)}</span>
                </div>
                <p className="text-[10px] font-body font-semibold text-[#1A1A2E] truncate">{brand.name}</p>
                <p className="text-[9px] font-body text-[#1A1A2E]/50 truncate">{brand.short_description}</p>
                {brand.made_in_israel && brand.verification_status === 'verified' && (
                  <span className="inline-flex items-center gap-0.5 mt-1 text-[8px] font-body text-[#4A7C59] bg-[#4A7C59]/10 px-1.5 py-0.5 rounded-full">
                    <Shield size={7} /> Made in IL
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Made in Israel Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Shield size={14} className="text-[#4A7C59]" />
              <h2 className="font-body font-semibold text-sm text-[#1A1A2E]">Made in Israel</h2>
              <span className="text-[9px] font-body text-[#4A7C59] bg-[#4A7C59]/10 px-1.5 py-0.5 rounded-full">Verified</span>
            </div>
            <button onClick={() => navigate(`/shopping/search?madeInIsrael=true&city=${selectedCity}`)} className="text-[10px] font-body text-[#003F87] font-medium">
              See all →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {madeInIsrael.slice(0, 4).map((brand) => (
              <button
                key={brand.id}
                onClick={() => navigate(`/shopping/brand/${brand.id}`)}
                className="bg-white rounded-xl p-3 border border-[#D4C5A9]/20 shadow-sm text-left active:scale-95 transition-transform"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4A7C59]/10 to-[#C8A96E]/10 flex items-center justify-center">
                    <Shield size={12} className="text-[#4A7C59]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-body font-semibold text-[#1A1A2E] truncate">{brand.name}</p>
                    <p className="text-[9px] font-body text-[#1A1A2E]/50 truncate">{brand.short_description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[8px] font-body text-[#C8A96E]">{'₪'.repeat(brand.price_level)}</span>
                  {brand.sustainability_tags && <Leaf size={8} className="text-[#4A7C59]" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Near Me Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-[#003F87]" />
              <h2 className="font-body font-semibold text-sm text-[#1A1A2E]">Near Me in {selectedCity}</h2>
            </div>
            <button onClick={() => navigate(`/shopping/search?city=${selectedCity}&view=map`)} className="text-[10px] font-body text-[#003F87] font-medium">
              Map view →
            </button>
          </div>
          <div className="space-y-2">
            {nearbyStores.map((store) => {
              const brand = store.brand_id ? brands.find(b => b.id === store.brand_id) : null;
              return (
                <button
                  key={store.id}
                  onClick={() => navigate(`/shopping/store/${store.id}`)}
                  className="w-full bg-white rounded-xl p-3 border border-[#D4C5A9]/20 shadow-sm flex items-center gap-3 text-left active:scale-95 transition-transform"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#003F87]/10 to-[#C8A96E]/10 flex items-center justify-center flex-shrink-0">
                    <MapPin size={14} className="text-[#003F87]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-body font-semibold text-[#1A1A2E] truncate">{store.name}</p>
                    <p className="text-[9px] font-body text-[#1A1A2E]/50 truncate">{store.address}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {brand?.israeli_brand && <span className="text-[8px] font-body text-[#003F87] bg-[#003F87]/10 px-1 py-0.5 rounded">🇮🇱 Israeli</span>}
                      <span className={`text-[8px] font-body ${!store.shabbat_closed ? 'text-[#4A7C59]' : 'text-[#1A1A2E]/40'}`}>
                        {!store.shabbat_closed ? '🕯️ Open Shabbat' : ''}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] font-body text-[#1A1A2E]/40">{store.store_type}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Offers Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Tag size={14} className="text-[#C0392B]" />
              <h2 className="font-body font-semibold text-sm text-[#1A1A2E]">Active Offers</h2>
            </div>
            <button onClick={() => navigate(`/shopping/search?hasOffer=true&city=${selectedCity}`)} className="text-[10px] font-body text-[#003F87] font-medium">
              See all →
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
            {activeOffers.map((offer) => {
              const brand = offer.brand_id ? brands.find(b => b.id === offer.brand_id) : null;
              return (
                <button
                  key={offer.id}
                  onClick={() => navigate(`/shopping/offer/${offer.id}`)}
                  className="flex-shrink-0 w-44 bg-white rounded-xl p-3 border border-[#D4C5A9]/20 shadow-sm text-left active:scale-95 transition-transform"
                >
                  <div className="flex items-center gap-1 mb-1.5">
                    {offer.offer_type === 'cashback' && <span className="text-[8px] font-body bg-[#4A7C59]/10 text-[#4A7C59] px-1.5 py-0.5 rounded-full font-medium">💰 Cashback</span>}
                    {offer.offer_type === 'percentage_discount' && <span className="text-[8px] font-body bg-[#C0392B]/10 text-[#C0392B] px-1.5 py-0.5 rounded-full font-medium">🏷️ {offer.discount_percent}% off</span>}
                    {offer.offer_type === 'exclusive_offer' && <span className="text-[8px] font-body bg-[#C8A96E]/10 text-[#C8A96E] px-1.5 py-0.5 rounded-full font-medium">⭐ Exclusive</span>}
                    {offer.offer_type === 'gift' && <span className="text-[8px] font-body bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full font-medium">🎁 Gift</span>}
                    {offer.offer_type === 'bundle' && <span className="text-[8px] font-body bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">📦 Bundle</span>}
                    {offer.sponsored && <span className="text-[7px] font-body text-[#1A1A2E]/30">Sponsored</span>}
                  </div>
                  <p className="text-[10px] font-body font-semibold text-[#1A1A2E] line-clamp-2 mb-1">{offer.title}</p>
                  {brand && <p className="text-[9px] font-body text-[#003F87]">{brand.name}</p>}
                  {offer.end_date && (
                    <p className="text-[8px] font-body text-[#1A1A2E]/40 mt-1">Until {new Date(offer.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Demo Data Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <p className="text-[10px] font-body text-amber-700">
            ⚠️ All offers shown are <strong>demo data</strong> and do not represent real current promotions.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}