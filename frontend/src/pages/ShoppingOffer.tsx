import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, ExternalLink, Copy, Clock, MapPin, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';

interface Offer {
  id: number;
  brand_id: number | null;
  store_id: number | null;
  title: string;
  description: string;
  offer_type: string;
  discount_percent: number | null;
  discount_amount: number | null;
  coupon_code: string | null;
  affiliate_url: string | null;
  destination_url: string;
  start_date: string | null;
  end_date: string | null;
  online_only: boolean;
  in_store_only: boolean;
  city_restrictions: string;
  terms: string;
  verified: boolean;
  sponsored: boolean;
  status: string;
}

interface Brand {
  id: number;
  name: string;
  short_description: string;
}

interface Store {
  id: number;
  name: string;
  address: string;
}

export default function ShoppingOffer() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showRedirectModal, setShowRedirectModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      try {
        const offerId = parseInt(id);
        const offerData = await api.getShoppingOffer(offerId);
        setOffer(offerData);

        if (offerData?.brand_id) {
          const brandData = await api.getShoppingBrand(offerData.brand_id);
          setBrand(brandData);
        }
        if (offerData?.store_id) {
          const storeData = await api.getShoppingStore(offerData.store_id);
          setStore(storeData);
        }
      } catch (error) {
        console.error('Failed to load offer data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleCopyCode = () => {
    if (offer?.coupon_code) {
      navigator.clipboard.writeText(offer.coupon_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShopOnline = () => {
    setShowRedirectModal(true);
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

  if (!offer) {
    return (
      <AppLayout>
        <div className="px-4 py-3 text-center">
          <button onClick={() => navigate('/shopping')} className="p-1.5 rounded-lg hover:bg-white mb-4">
            <ArrowLeft size={20} className="text-[#1A1A2E]" />
          </button>
          <p className="font-body text-sm text-[#1A1A2E]/50">Offer not found</p>
        </div>
      </AppLayout>
    );
  }

  const isExpired = offer.status === 'expired';
  const isExpiringSoon = offer.end_date && new Date(offer.end_date).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
  const cityRestrictions = offer.city_restrictions?.split(',').map(c => c.trim()).filter(Boolean) || [];

  return (
    <AppLayout>
      <div className="px-4 py-3">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-white">
            <ArrowLeft size={20} className="text-[#1A1A2E]" />
          </button>
          <h1 className="font-display text-lg font-bold text-[#1A1A2E] flex-1">Offer Details</h1>
        </div>

        {/* Offer Card */}
        <div className={`rounded-2xl p-5 mb-4 border shadow-sm ${isExpired ? 'bg-gray-50 border-gray-200' : 'bg-white border-[#D4C5A9]/20'}`}>
          {/* Badges */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {offer.offer_type === 'percentage_discount' && (
              <span className="text-xs font-body bg-[#C0392B] text-white px-2.5 py-1 rounded-full font-bold">{offer.discount_percent}% OFF</span>
            )}
            {offer.offer_type === 'fixed_discount' && (
              <span className="text-xs font-body bg-[#C0392B] text-white px-2.5 py-1 rounded-full font-bold">₪{offer.discount_amount} OFF</span>
            )}
            {offer.offer_type === 'cashback' && (
              <span className="text-xs font-body bg-[#4A7C59] text-white px-2.5 py-1 rounded-full font-bold">💰 {offer.discount_percent}% Cashback</span>
            )}
            {offer.offer_type === 'gift' && (
              <span className="text-xs font-body bg-purple-500 text-white px-2.5 py-1 rounded-full font-bold">🎁 Free Gift</span>
            )}
            {offer.offer_type === 'bundle' && (
              <span className="text-xs font-body bg-blue-500 text-white px-2.5 py-1 rounded-full font-bold">📦 Bundle Deal</span>
            )}
            {offer.offer_type === 'exclusive_offer' && (
              <span className="text-xs font-body bg-[#C8A96E] text-white px-2.5 py-1 rounded-full font-bold">⭐ Shalom Guide Exclusive</span>
            )}
            {isExpired && <span className="text-xs font-body bg-gray-400 text-white px-2.5 py-1 rounded-full font-bold">Expired</span>}
            {offer.sponsored && <span className="text-[9px] font-body text-[#1A1A2E]/40 bg-[#1A1A2E]/5 px-2 py-0.5 rounded-full">Sponsored</span>}
          </div>

          <h2 className="font-display text-xl font-bold text-[#1A1A2E] mb-2">{offer.title}</h2>
          <p className="text-sm font-body text-[#1A1A2E]/70 mb-4">{offer.description}</p>

          {/* Coupon Code */}
          {offer.coupon_code && !isExpired && (
            <div className="bg-[#FAF8F5] border-2 border-dashed border-[#C8A96E] rounded-xl p-3 mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-body text-[#1A1A2E]/50">Coupon Code</p>
                <p className="font-mono text-lg font-bold text-[#003F87] tracking-wider">{offer.coupon_code}</p>
              </div>
              <button
                onClick={handleCopyCode}
                className="bg-[#003F87] text-white px-3 py-2 rounded-lg text-xs font-body font-medium flex items-center gap-1 active:scale-95 transition-transform"
              >
                <Copy size={12} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}

          {/* Labels */}
          <div className="flex flex-wrap gap-2 mb-4">
            {offer.verified && (
              <span className="text-[10px] font-body text-[#4A7C59] bg-[#4A7C59]/10 px-2 py-1 rounded-full flex items-center gap-1">
                <Shield size={10} /> Verified offer
              </span>
            )}
            {isExpiringSoon && !isExpired && (
              <span className="text-[10px] font-body text-[#C0392B] bg-[#C0392B]/10 px-2 py-1 rounded-full flex items-center gap-1">
                <Clock size={10} /> Expiring soon
              </span>
            )}
            {offer.online_only && <span className="text-[10px] font-body text-[#003F87] bg-[#003F87]/10 px-2 py-1 rounded-full">🌐 Online only</span>}
            {offer.in_store_only && <span className="text-[10px] font-body text-[#C8A96E] bg-[#C8A96E]/10 px-2 py-1 rounded-full">🏪 In-store only</span>}
          </div>

          {/* Details */}
          <div className="space-y-2 text-xs font-body text-[#1A1A2E]/60">
            {offer.start_date && offer.end_date && (
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-[#1A1A2E]/40" />
                <span>Valid: {new Date(offer.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – {new Date(offer.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            )}
            {cityRestrictions.length > 0 && (
              <div className="flex items-center gap-2">
                <MapPin size={12} className="text-[#1A1A2E]/40" />
                <span>Available in: {cityRestrictions.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Terms */}
        {offer.terms && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-start gap-2">
            <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-body font-medium text-amber-700 mb-0.5">Conditions apply</p>
              <p className="text-[10px] font-body text-amber-600">{offer.terms}</p>
            </div>
          </div>
        )}

        {/* Brand & Store */}
        {brand && (
          <button
            onClick={() => navigate(`/shopping/brand/${brand.id}`)}
            className="w-full bg-white rounded-xl p-3 border border-[#D4C5A9]/20 shadow-sm mb-2 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#003F87]/10 to-[#C8A96E]/10 flex items-center justify-center">
              <span>🏷️</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-body font-semibold text-[#1A1A2E]">{brand.name}</p>
              <p className="text-[10px] font-body text-[#1A1A2E]/50">{brand.short_description}</p>
            </div>
          </button>
        )}

        {store && (
          <button
            onClick={() => navigate(`/shopping/store/${store.id}`)}
            className="w-full bg-white rounded-xl p-3 border border-[#D4C5A9]/20 shadow-sm mb-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#003F87]/5 to-[#C8A96E]/5 flex items-center justify-center">
              <MapPin size={14} className="text-[#003F87]" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-body font-semibold text-[#1A1A2E]">{store.name}</p>
              <p className="text-[10px] font-body text-[#1A1A2E]/50">{store.address}</p>
            </div>
          </button>
        )}

        {/* CTA */}
        {!isExpired && (
          <button
            onClick={handleShopOnline}
            className="w-full bg-[#003F87] text-white py-3.5 rounded-xl font-body font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg"
          >
            <ExternalLink size={14} />
            {offer.online_only ? 'Shop Online' : offer.in_store_only ? 'Get Directions' : 'View Offer'}
          </button>
        )}

        {/* External purchase notice */}
        <p className="text-center text-[9px] font-body text-[#1A1A2E]/40 mt-2">
          Purchase completed on partner website
        </p>

        {/* Demo notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 mt-3 text-center">
          <p className="text-[9px] font-body text-amber-700">⚠️ Demo data — not a real promotion</p>
        </div>
      </div>

      {/* In-app WebView for partner store */}
      {showRedirectModal && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#D4C5A9]/20 bg-white shadow-sm">
            <button onClick={() => setShowRedirectModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
              <ArrowLeft size={20} className="text-[#1A1A2E]" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-body font-semibold text-[#1A1A2E] truncate">{brand?.name || 'Partner Store'}</p>
              <p className="text-[9px] font-body text-[#1A1A2E]/40 truncate flex items-center gap-1">
                🔒 {offer.destination_url}
              </p>
            </div>
            <span className="text-[8px] font-body text-[#4A7C59] bg-[#4A7C59]/10 px-2 py-0.5 rounded-full">Affiliate tracked</span>
          </div>

          {/* Coupon reminder bar */}
          {offer.coupon_code && (
            <div className="flex items-center justify-between px-4 py-2 bg-[#C8A96E]/10 border-b border-[#C8A96E]/20">
              <p className="text-[10px] font-body text-[#1A1A2E]/70">
                💡 Use code <span className="font-mono font-bold text-[#003F87]">{offer.coupon_code}</span> at checkout
              </p>
              <button
                onClick={handleCopyCode}
                className="text-[9px] font-body text-[#003F87] font-medium bg-white px-2 py-0.5 rounded border border-[#003F87]/20"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          )}

          {/* Embedded partner page */}
          <div className="flex-1 relative">
            <iframe
              src={offer.destination_url}
              className="w-full h-full border-0"
              title={`${brand?.name || 'Partner'} Store`}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              loading="lazy"
            />
          </div>

          {/* Bottom bar */}
          <div className="px-4 py-2 border-t border-[#D4C5A9]/20 bg-white flex items-center justify-between">
            <p className="text-[8px] font-body text-[#1A1A2E]/40">
              Shalom Guide • Affiliate partner • Secure checkout
            </p>
            <button onClick={() => setShowRedirectModal(false)} className="text-[10px] font-body text-[#003F87] font-medium">
              ← Back to app
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}