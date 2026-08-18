import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, ExternalLink, MapPin, Shield, Tag, Heart, Share2, Globe, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { isFavorited, toggleFavorite, isInItinerary, addToItinerary, shareOrCopyLink } from '@/lib/savedItems';

interface Brand {
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
  online_store_url: string | null;
  instagram_url: string | null;
  is_featured: boolean;
  sponsored: boolean;
}

interface Store {
  id: number;
  brand_id: number | null;
  name: string;
  address: string;
  city: string;
  shabbat_closed: boolean;
  store_type: string;
}

interface Offer {
  id: number;
  brand_id: number | null;
  title: string;
  description: string;
  offer_type: string;
  discount_percent: number | null;
  end_date: string | null;
  verified: boolean;
  status: string;
}

export default function ShoppingBrand() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [brandStores, setBrandStores] = useState<Store[]>([]);
  const [brandOffers, setBrandOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [webViewUrl, setWebViewUrl] = useState<string | null>(null);
  const [webViewTitle, setWebViewTitle] = useState('');
  const [favorited, setFavorited] = useState(false);
  const [addedToItinerary, setAddedToItinerary] = useState(false);

  useEffect(() => {
    if (brand) {
      setFavorited(isFavorited('brand', brand.id));
      setAddedToItinerary(isInItinerary('brand', brand.id));
    }
  }, [brand]);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      try {
        const brandId = parseInt(id);
        const [brandData, storesData, offersData] = await Promise.all([
          api.getShoppingBrand(brandId),
          api.getShoppingStores({ brand_id: brandId }),
          api.getShoppingOffers({ brand_id: brandId, status: 'active' }),
        ]);
        setBrand(brandData);
        setBrandStores(storesData);
        setBrandOffers(offersData);
      } catch (error) {
        console.error('Failed to load brand data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const getCategoryIcon = (categoryIds: string) => {
    const first = categoryIds?.split(',')[0] || '';
    if (first === 'beauty-skincare' || first === 'dead-sea') return '🧴';
    if (first === 'fashion' || first === 'israeli-designers') return '👗';
    if (first === 'jewelry') return '💎';
    if (first === 'wine') return '🍷';
    if (first === 'judaica') return '🕎';
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

  if (!brand) {
    return (
      <AppLayout>
        <div className="px-4 py-3 text-center">
          <button onClick={() => navigate('/shopping')} className="p-1.5 rounded-lg hover:bg-white mb-4">
            <ArrowLeft size={20} className="text-[#1A1A2E]" />
          </button>
          <p className="font-body text-sm text-[#1A1A2E]/50">Brand not found</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 py-3">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-white">
            <ArrowLeft size={20} className="text-[#1A1A2E]" />
          </button>
          <h1 className="font-display text-xl font-bold text-[#1A1A2E] flex-1 truncate">{brand.name}</h1>
          <button
            onClick={() => setFavorited(toggleFavorite('brand', brand.id, brand.name))}
            className="p-2 rounded-lg hover:bg-white"
          >
            <Heart size={18} className={favorited ? 'text-[#C0392B] fill-[#C0392B]' : 'text-[#D4C5A9]'} />
          </button>
          <button
            onClick={() => shareOrCopyLink(brand.name, window.location.href)}
            className="p-2 rounded-lg hover:bg-white"
          >
            <Share2 size={18} className="text-[#1A1A2E]/50" />
          </button>
        </div>

        {/* Brand Hero */}
        <div className="bg-gradient-to-br from-[#003F87]/10 to-[#C8A96E]/10 rounded-2xl p-6 mb-4 text-center relative overflow-hidden star-pattern">
          <div className="w-20 h-20 mx-auto rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
            <span className="text-3xl">{getCategoryIcon(brand.category_ids)}</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-[#1A1A2E] mb-1">{brand.name}</h2>
          <p className="text-xs font-body text-[#1A1A2E]/60 mb-3">{brand.short_description}</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {brand.israeli_brand && <span className="text-[10px] font-body text-[#003F87] bg-white px-2 py-1 rounded-full shadow-sm">🇮🇱 Israeli Brand</span>}
            {brand.made_in_israel && brand.verification_status === 'verified' && (
              <span className="text-[10px] font-body text-[#4A7C59] bg-white px-2 py-1 rounded-full shadow-sm flex items-center gap-1"><Shield size={10} /> Made in Israel ✓</span>
            )}
            {brand.made_in_israel && brand.verification_status === 'self_declared' && (
              <span className="text-[10px] font-body text-[#C8A96E] bg-white px-2 py-1 rounded-full shadow-sm">Made in Israel (self-declared)</span>
            )}
            <span className="text-[10px] font-body text-[#C8A96E] bg-white px-2 py-1 rounded-full shadow-sm">{'₪'.repeat(brand.price_level)} Price Level</span>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl p-4 border border-[#D4C5A9]/20 shadow-sm mb-3">
          <p className="text-xs font-body text-[#1A1A2E]/70 leading-relaxed">{brand.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {brand.style_tags?.split(',').filter(Boolean).map((tag) => (
              <span key={tag} className="text-[9px] font-body px-2 py-0.5 rounded-full bg-[#FAF8F5] text-[#1A1A2E]/60 border border-[#D4C5A9]/20">{tag.trim()}</span>
            ))}
            {brand.sustainability_tags?.split(',').filter(Boolean).map((tag) => (
              <span key={tag} className="text-[9px] font-body px-2 py-0.5 rounded-full bg-[#4A7C59]/10 text-[#4A7C59]">♻️ {tag.trim()}</span>
            ))}
          </div>
        </div>

        {/* Links - In-app WebView */}
        <div className="flex gap-2 mb-3">
          {brand.website_url && (
            <button
              onClick={() => { setWebViewUrl(brand.website_url!); setWebViewTitle('Website'); }}
              className="flex-1 bg-[#003F87] text-white text-xs py-2.5 rounded-xl font-body font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <Globe size={12} /> Website
            </button>
          )}
          {brand.online_store_url && (
            <button
              onClick={() => { setWebViewUrl(brand.online_store_url!); setWebViewTitle('Shop Online'); }}
              className="flex-1 bg-[#C8A96E] text-white text-xs py-2.5 rounded-xl font-body font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <ExternalLink size={12} /> Shop Online
            </button>
          )}
        </div>

        {/* Active Offers */}
        {brandOffers.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Tag size={14} className="text-[#C0392B]" />
              <h3 className="font-body font-semibold text-sm text-[#1A1A2E]">Active Offers</h3>
            </div>
            <div className="space-y-2">
              {brandOffers.map((offer) => (
                <button
                  key={offer.id}
                  onClick={() => navigate(`/shopping/offer/${offer.id}`)}
                  className="w-full bg-white rounded-xl p-3 border border-[#C0392B]/10 shadow-sm text-left active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {offer.offer_type === 'percentage_discount' && <span className="text-[9px] font-body bg-[#C0392B]/10 text-[#C0392B] px-1.5 py-0.5 rounded-full font-medium">{offer.discount_percent}% off</span>}
                    {offer.offer_type === 'cashback' && <span className="text-[9px] font-body bg-[#4A7C59]/10 text-[#4A7C59] px-1.5 py-0.5 rounded-full font-medium">💰 Cashback</span>}
                    {offer.offer_type === 'gift' && <span className="text-[9px] font-body bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full font-medium">🎁 Gift</span>}
                    {offer.offer_type === 'exclusive_offer' && <span className="text-[9px] font-body bg-[#C8A96E]/10 text-[#C8A96E] px-1.5 py-0.5 rounded-full font-medium">⭐ Exclusive</span>}
                    {offer.offer_type === 'bundle' && <span className="text-[9px] font-body bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">📦 Bundle</span>}
                    {offer.verified && <span className="text-[8px] font-body text-[#4A7C59]">✓ Verified</span>}
                  </div>
                  <p className="text-[11px] font-body font-semibold text-[#1A1A2E]">{offer.title}</p>
                  {offer.end_date && <p className="text-[9px] font-body text-[#1A1A2E]/40 mt-0.5">Until {new Date(offer.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stores */}
        {brandStores.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin size={14} className="text-[#003F87]" />
              <h3 className="font-body font-semibold text-sm text-[#1A1A2E]">Stores ({brandStores.length})</h3>
            </div>
            <div className="space-y-2">
              {brandStores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => navigate(`/shopping/store/${store.id}`)}
                  className="w-full bg-white rounded-xl p-3 border border-[#D4C5A9]/20 shadow-sm text-left active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-body font-semibold text-[#1A1A2E]">{store.name}</p>
                      <p className="text-[9px] font-body text-[#1A1A2E]/50">{store.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-body text-[#1A1A2E]/40">{store.city}</p>
                      <p className={`text-[8px] font-body ${!store.shabbat_closed ? 'text-[#4A7C59]' : 'text-[#1A1A2E]/30'}`}>
                        {!store.shabbat_closed ? '🕯️ Open Shabbat' : 'Closed Shabbat'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add to Itinerary */}
        <button
          onClick={() => {
            addToItinerary('brand', brand.id, brand.name);
            setAddedToItinerary(true);
          }}
          disabled={addedToItinerary}
          className="w-full bg-gradient-to-r from-[#003F87] to-[#003F87]/80 text-white py-3 rounded-xl font-body font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg mb-2 disabled:opacity-60"
        >
          {addedToItinerary ? '✓ Added to Itinerary' : '📍 Add to My Itinerary'}
        </button>
      </div>

      {/* In-app WebView for brand links */}
      {webViewUrl && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#D4C5A9]/20 bg-white shadow-sm">
            <button onClick={() => setWebViewUrl(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
              <ArrowLeft size={20} className="text-[#1A1A2E]" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-body font-semibold text-[#1A1A2E]">{brand.name} — {webViewTitle}</p>
              <p className="text-[9px] font-body text-[#1A1A2E]/40 truncate flex items-center gap-1">
                🔒 {webViewUrl}
              </p>
            </div>
            {webViewTitle === 'Shop Online' && (
              <span className="text-[8px] font-body text-[#4A7C59] bg-[#4A7C59]/10 px-2 py-0.5 rounded-full">Affiliate tracked</span>
            )}
          </div>
          <div className="flex-1 relative">
            <iframe
              src={webViewUrl}
              className="w-full h-full border-0"
              title={`${brand.name} - ${webViewTitle}`}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              loading="lazy"
            />
          </div>
          <div className="px-4 py-2 border-t border-[#D4C5A9]/20 bg-white flex items-center justify-between">
            <p className="text-[8px] font-body text-[#1A1A2E]/40">
              Shalom Guide • In-app browser{webViewTitle === 'Shop Online' ? ' • Affiliate partner' : ''}
            </p>
            <button onClick={() => setWebViewUrl(null)} className="text-[10px] font-body text-[#003F87] font-medium">
              ← Back to app
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}