import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, MapPin, Phone, Globe, Clock, Shield, Navigation, Heart, Share2, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { isFavorited, toggleFavorite, isInItinerary, addToItinerary, shareOrCopyLink } from '@/lib/savedItems';
import { getBrandUrl, hasAwinProgram } from '@/lib/affiliateLinks';

interface Store {
  id: number;
  brand_id: number | null;
  name: string;
  slug: string;
  description: string;
  address: string;
  city: string;
  neighborhood: string | null;
  shopping_center_id: string | null;
  phone: string | null;
  opening_hours: string;
  shabbat_closed: boolean;
  wheelchair_accessible: string;
  languages_spoken: string;
  store_type: string;
  lat: number;
  lng: number;
  website_url: string | null;
}

interface Brand {
  id: number;
  name: string;
  slug: string;
  short_description: string;
  category_ids: string;
  israeli_brand: boolean;
  made_in_israel: boolean;
  verification_status: string;
}

interface Offer {
  id: number;
  title: string;
  description: string;
  offer_type: string;
}

export default function ShoppingStore() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [storeOffers, setStoreOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNavModal, setShowNavModal] = useState(false);
  const [showWebModal, setShowWebModal] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [addedToItinerary, setAddedToItinerary] = useState(false);

  useEffect(() => {
    if (store) {
      setFavorited(isFavorited('store', store.id));
      setAddedToItinerary(isInItinerary('store', store.id));
    }
  }, [store]);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      try {
        const storeId = parseInt(id);
        const storeData = await api.getShoppingStore(storeId);
        setStore(storeData);

        if (storeData?.brand_id) {
          const [brandData, offersData] = await Promise.all([
            api.getShoppingBrand(storeData.brand_id),
            api.getShoppingOffers({ store_id: storeId, status: 'active' }),
          ]);
          setBrand(brandData);
          setStoreOffers(offersData);
        } else {
          const offersData = await api.getShoppingOffers({ store_id: storeId, status: 'active' });
          setStoreOffers(offersData);
        }
      } catch (error) {
        console.error('Failed to load store data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-[#003F87]" />
        </div>
      </AppLayout>
    );
  }

  if (!store) {
    return (
      <AppLayout>
        <div className="px-4 py-3 text-center">
          <button onClick={() => navigate('/shopping')} className="p-1.5 rounded-lg hover:bg-white mb-4">
            <ArrowLeft size={20} className="text-[#1A1A2E]" />
          </button>
          <p className="font-body text-sm text-[#1A1A2E]/50">Store not found</p>
        </div>
      </AppLayout>
    );
  }

  const languages = store.languages_spoken?.split(',').map(l => l.trim()).filter(Boolean) || [];

  return (
    <AppLayout>
      <div className="px-4 py-3">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-white">
            <ArrowLeft size={20} className="text-[#1A1A2E]" />
          </button>
          <h1 className="font-display text-lg font-bold text-[#1A1A2E] flex-1 truncate">{store.name}</h1>
          <button
            onClick={() => setFavorited(toggleFavorite('store', store.id, store.name))}
            className="p-2 rounded-lg hover:bg-white"
          >
            <Heart size={18} className={favorited ? 'text-[#C0392B] fill-[#C0392B]' : 'text-[#D4C5A9]'} />
          </button>
          <button
            onClick={() => shareOrCopyLink(store.name, window.location.href)}
            className="p-2 rounded-lg hover:bg-white"
          >
            <Share2 size={18} className="text-[#1A1A2E]/50" />
          </button>
        </div>

        {/* Map */}
        <div className="bg-white rounded-2xl overflow-hidden border border-[#D4C5A9]/20 shadow-sm mb-4">
          <iframe
            src={`https://maps.google.com/maps?q=${store.lat},${store.lng}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
            width="100%"
            height="180"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            title="Store Location"
          />
        </div>

        {/* Store Info */}
        <div className="bg-white rounded-2xl p-4 border border-[#D4C5A9]/20 shadow-sm mb-3 star-pattern">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-body px-2 py-0.5 rounded-full bg-[#003F87]/10 text-[#003F87] font-medium capitalize">{store.store_type}</span>
            {brand?.israeli_brand && <span className="text-[10px] font-body px-2 py-0.5 rounded-full bg-[#003F87]/10 text-[#003F87]">🇮🇱 Israeli</span>}
            {brand?.made_in_israel && brand.verification_status === 'verified' && (
              <span className="text-[10px] font-body px-2 py-0.5 rounded-full bg-[#4A7C59]/10 text-[#4A7C59] flex items-center gap-0.5"><Shield size={8} /> Made in IL</span>
            )}
          </div>

          {store.description && <p className="text-xs font-body text-[#1A1A2E]/70 mb-3">{store.description}</p>}

          <div className="space-y-2.5">
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-[#003F87] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-body text-[#1A1A2E]">{store.address}</p>
                <p className="text-[10px] font-body text-[#1A1A2E]/50">{store.city}{store.neighborhood ? ` • ${store.neighborhood}` : ''}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock size={14} className="text-[#003F87] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-body text-[#1A1A2E]">{store.opening_hours}</p>
                <p className={`text-[10px] font-body font-medium ${!store.shabbat_closed ? 'text-[#4A7C59]' : 'text-[#C0392B]'}`}>
                  Shabbat: {!store.shabbat_closed ? '🕯️ Open' : '🕯️ Closed'}
                </p>
              </div>
            </div>

            {store.phone && (
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-[#003F87] flex-shrink-0" />
                <a href={`tel:${store.phone}`} className="text-xs font-body text-[#003F87]">{store.phone}</a>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-sm">♿</span>
              <p className="text-xs font-body text-[#1A1A2E]/70">
                Accessibility: <span className="font-medium capitalize">{store.wheelchair_accessible}</span>
              </p>
            </div>

            {languages.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm">🗣️</span>
                <p className="text-xs font-body text-[#1A1A2E]/70">{languages.join(', ')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Brand Link */}
        {brand && (
          <button
            onClick={() => navigate(`/shopping/brand/${brand.id}`)}
            className="w-full bg-white rounded-xl p-3 border border-[#D4C5A9]/20 shadow-sm mb-3 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#003F87]/10 to-[#C8A96E]/10 flex items-center justify-center">
              <span className="text-lg">🏷️</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-body font-semibold text-[#1A1A2E]">{brand.name}</p>
              <p className="text-[10px] font-body text-[#1A1A2E]/50">{brand.short_description}</p>
            </div>
            <span className="text-[10px] font-body text-[#003F87]">View brand →</span>
          </button>
        )}

        {/* Offers */}
        {storeOffers.length > 0 && (
          <div className="mb-4">
            <h3 className="font-body font-semibold text-sm text-[#1A1A2E] mb-2 flex items-center gap-1.5">
              🏷️ Offers at this store
            </h3>
            <div className="space-y-2">
              {storeOffers.map((offer) => (
                <button
                  key={offer.id}
                  onClick={() => navigate(`/shopping/offer/${offer.id}`)}
                  className="w-full bg-gradient-to-r from-[#C0392B]/5 to-white rounded-xl p-3 border border-[#C0392B]/10 text-left active:scale-[0.98] transition-transform"
                >
                  <p className="text-[11px] font-body font-semibold text-[#1A1A2E]">{offer.title}</p>
                  <p className="text-[9px] font-body text-[#1A1A2E]/50 mt-0.5">{offer.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => setShowNavModal(true)}
            className="w-full bg-[#003F87] text-white py-3 rounded-xl font-body font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg"
          >
            <Navigation size={14} /> Navigate
          </button>
          <button
            onClick={() => {
              addToItinerary('store', store.id, store.name);
              setAddedToItinerary(true);
            }}
            disabled={addedToItinerary}
            className="w-full bg-gradient-to-r from-[#C8A96E] to-[#C8A96E]/80 text-white py-3 rounded-xl font-body font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
          >
            {addedToItinerary ? '✓ Added to Itinerary' : '📍 Add to My Itinerary'}
          </button>
          {store.website_url && (
            <button
              onClick={() => setShowWebModal(true)}
              className="w-full bg-white text-[#003F87] py-3 rounded-xl font-body font-semibold text-sm flex items-center justify-center gap-2 border border-[#003F87]/20 active:scale-95 transition-transform"
            >
              <Globe size={14} /> Visit Website{brand && hasAwinProgram(brand.slug) ? ' 💰' : ''}
            </button>
          )}
        </div>
      </div>

      {/* In-app Navigation WebView */}
      {showNavModal && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#D4C5A9]/20 bg-white shadow-sm">
            <button onClick={() => setShowNavModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
              <ArrowLeft size={20} className="text-[#1A1A2E]" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-body font-semibold text-[#1A1A2E] truncate">Navigate to {store.name}</p>
              <p className="text-[9px] font-body text-[#1A1A2E]/40 truncate">{store.address}</p>
            </div>
            {store.phone && (
              <a href={`tel:${store.phone}`} className="p-2 rounded-lg bg-[#4A7C59]/10">
                <Phone size={14} className="text-[#4A7C59]" />
              </a>
            )}
          </div>
          <div className="flex-1 relative">
            <iframe
              src={`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}&travelmode=walking&output=embed`}
              className="w-full h-full border-0"
              title="Navigation to store"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              loading="lazy"
            />
          </div>
          <div className="px-4 py-3 border-t border-[#D4C5A9]/20 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={12} className="text-[#003F87]" />
              <p className="text-[10px] font-body text-[#1A1A2E]/60">{store.address}, {store.city}</p>
            </div>
            <button
              onClick={() => setShowNavModal(false)}
              className="w-full bg-[#003F87] text-white py-2.5 rounded-xl font-body font-medium text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              ← Back to store
            </button>
          </div>
        </div>
      )}

      {/* In-app Website WebView */}
      {showWebModal && store.website_url && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#D4C5A9]/20 bg-white shadow-sm">
            <button onClick={() => setShowWebModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
              <ArrowLeft size={20} className="text-[#1A1A2E]" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-body font-semibold text-[#1A1A2E] truncate">{store.name}</p>
              <p className="text-[9px] font-body text-[#1A1A2E]/40 truncate flex items-center gap-1">
                🔒 {brand ? getBrandUrl(brand.slug, store.website_url) : store.website_url}
              </p>
            </div>
          </div>
          <div className="flex-1 relative">
            <iframe
              src={brand ? getBrandUrl(brand.slug, store.website_url) : store.website_url}
              className="w-full h-full border-0"
              title={`${store.name} website`}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              loading="lazy"
            />
          </div>
          <div className="px-4 py-2 border-t border-[#D4C5A9]/20 bg-white flex items-center justify-between">
            <p className="text-[8px] font-body text-[#1A1A2E]/40">Shalom Guide • In-app browser</p>
            <button onClick={() => setShowWebModal(false)} className="text-[10px] font-body text-[#003F87] font-medium">
              ← Back to app
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}