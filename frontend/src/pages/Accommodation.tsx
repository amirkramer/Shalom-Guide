import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, Search, Star, ExternalLink, MapPin, Wifi, Waves, Dumbbell, UtensilsCrossed } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { getProviderUrl, isProviderTracked, PROVIDER_LABELS, PROVIDER_COLORS, type HotelProvider } from '@/lib/affiliateLinks';

const providers: HotelProvider[] = ['booking', 'expedia', 'trivago'];

const cityFilters = ['All', 'Jerusalem', 'Tel Aviv', 'Haifa', 'Nazareth', 'Eilat', 'Mitzpe Ramon'];
const typeFilters = ['All', 'Hotel', 'Hostel', 'Boutique', 'Guesthouse'];

const amenityIcons: Record<string, React.ReactNode> = {
  'WiFi': <Wifi size={10} />,
  'Pool': <Waves size={10} />,
  'Gym': <Dumbbell size={10} />,
  'Restaurant': <UtensilsCrossed size={10} />,
};

interface AccommodationItem {
  id: number;
  name: string;
  city: string;
  type: string;
  stars: number;
  price_from: number;
  rating: number;
  reviews: number;
  amenities: string;
  booking_id: string;
  image_url: string;
  description: string;
}

export default function Accommodation() {
  const navigate = useNavigate();
  const [activeCity, setActiveCity] = useState('All');
  const [activeType, setActiveType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [accommodations, setAccommodations] = useState<AccommodationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<string>('');
  const [activeProvider, setActiveProvider] = useState<HotelProvider>('booking');

  useEffect(() => {
    loadAccommodations();
  }, []);

  const loadAccommodations = async () => {
    setLoading(true);
    try {
      const data = await api.getAccommodations();
      setAccommodations(data);
    } catch (error) {
      console.error('Failed to load accommodations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = accommodations.filter((acc) => {
    if (activeCity !== 'All' && acc.city !== activeCity) return false;
    if (activeType !== 'All' && acc.type !== activeType) return false;
    if (searchQuery && !acc.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const openBooking = (bookingId: string, provider: HotelProvider = 'booking') => {
    setSelectedHotel(bookingId);
    setActiveProvider(provider);
    setShowBookingModal(true);
  };

  const openBookingSearch = (city: string, provider: HotelProvider = 'booking') => {
    setSelectedHotel(city);
    setActiveProvider(provider);
    setShowBookingModal(true);
  };

  return (
    <AppLayout>
      <div className="px-4 py-3">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/home')} className="p-1.5 rounded-lg hover:bg-white">
            <ArrowLeft size={20} className="text-[#1A1A2E]" />
          </button>
          <h1 className="font-display text-xl font-bold text-[#1A1A2E]">Accommodation</h1>
        </div>

        {/* Booking.com Search Widget */}
        <div className="bg-gradient-to-br from-[#003580] to-[#003580]/90 rounded-2xl p-4 mb-4 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-white font-bold text-sm font-body">Powered by</span>
            <span className="bg-white text-[#003580] font-bold text-xs px-2 py-0.5 rounded font-body">Booking.com</span>
          </div>
          <p className="text-white/80 text-xs font-body mb-3">
            Find the best deals on hotels, hostels, and apartments across Israel
          </p>
          <div className="bg-white rounded-xl p-3 mb-3">
            <div className="flex items-center gap-2">
              <Search size={16} className="text-[#1A1A2E]/40" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by hotel name..."
                className="flex-1 text-sm font-body outline-none bg-transparent placeholder:text-[#1A1A2E]/30"
              />
            </div>
          </div>
          <button
            onClick={() => openBookingSearch(activeCity !== 'All' ? activeCity : 'Tel Aviv', 'booking')}
            className="w-full bg-[#0071c2] text-white py-2.5 rounded-xl text-sm font-body font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <ExternalLink size={14} />
            Search on Booking.com
          </button>

          {/* Compare on other sites */}
          <div className="flex items-center gap-2 mt-2">
            <p className="text-[10px] font-body text-white/60 flex-shrink-0">Compare on</p>
            {providers.filter((p) => p !== 'booking').map((provider) => (
              <button
                key={provider}
                onClick={() => openBookingSearch(activeCity !== 'All' ? activeCity : 'Tel Aviv', provider)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-1.5 rounded-lg text-[10px] font-body font-semibold flex items-center justify-center gap-1 active:scale-95 transition-transform border border-white/20"
              >
                <ExternalLink size={10} />
                {PROVIDER_LABELS[provider]}
              </button>
            ))}
          </div>
        </div>

        {/* City Filters */}
        <div className="mb-3">
          <p className="text-[10px] font-body text-[#1A1A2E]/50 mb-1.5 font-medium uppercase tracking-wider">City</p>
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
            {cityFilters.map((city) => (
              <button
                key={city}
                onClick={() => setActiveCity(city)}
                className={`flex-shrink-0 text-[10px] font-body px-2.5 py-1.5 rounded-full transition-colors ${
                  activeCity === city
                    ? 'bg-[#003F87] text-white'
                    : 'bg-white border border-[#D4C5A9]/30 text-[#1A1A2E]/70'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Type Filters */}
        <div className="mb-4">
          <p className="text-[10px] font-body text-[#1A1A2E]/50 mb-1.5 font-medium uppercase tracking-wider">Type</p>
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
            {typeFilters.map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`flex-shrink-0 text-[10px] font-body px-2.5 py-1.5 rounded-full transition-colors ${
                  activeType === type
                    ? 'bg-[#003F87] text-white'
                    : 'bg-white border border-[#D4C5A9]/30 text-[#1A1A2E]/70'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Accommodation List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003F87]"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((acc) => (
              <div key={acc.id} className="bg-white rounded-2xl p-4 border border-[#D4C5A9]/20 shadow-sm star-pattern">
                <div className="flex gap-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#003580]/10 to-[#C8A96E]/10 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl">
                    🏨
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-body font-semibold text-sm text-[#1A1A2E] truncate">{acc.name}</h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin size={10} className="text-[#1A1A2E]/40" />
                          <p className="text-[10px] font-body text-[#1A1A2E]/50">{acc.city}</p>
                          <span className="text-[10px] font-body text-[#C8A96E] ml-1">{'★'.repeat(acc.stars)}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-body px-2 py-0.5 rounded-full bg-[#003580]/10 text-[#003580] font-medium">
                        {acc.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-0.5">
                        <Star size={11} className="text-[#C8A96E] fill-[#C8A96E]" />
                        <span className="text-[10px] font-body font-semibold text-[#1A1A2E]">{acc.rating}</span>
                      </div>
                      <span className="text-[10px] font-body text-[#1A1A2E]/40">{acc.reviews} reviews</span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {acc.amenities && acc.amenities.split(',').slice(0, 4).map((amenity) => (
                        <span key={amenity} className="flex items-center gap-0.5 text-[9px] font-body px-1.5 py-0.5 rounded-full bg-[#FAF8F5] text-[#1A1A2E]/60">
                          {amenityIcons[amenity.trim()] || null}
                          {amenity.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#D4C5A9]/10">
                  <div>
                    <p className="text-[10px] font-body text-[#1A1A2E]/40">From</p>
                    <p className="font-body font-bold text-base text-[#003F87]">₪{acc.price_from}<span className="text-[10px] font-normal text-[#1A1A2E]/40">/night</span></p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {providers.filter((p) => p !== 'booking').map((provider) => (
                      <button
                        key={provider}
                        onClick={() => openBooking(`${acc.name}, ${acc.city}`, provider)}
                        title={`Compare on ${PROVIDER_LABELS[provider]}`}
                        className="flex items-center justify-center w-8 h-8 rounded-xl border border-[#D4C5A9]/30 text-[#1A1A2E]/50 active:scale-95 transition-transform"
                      >
                        <ExternalLink size={12} />
                      </button>
                    ))}
                    <button
                      onClick={() => openBooking(acc.booking_id || acc.name, 'booking')}
                      className="flex items-center gap-1.5 bg-[#0071c2] text-white px-4 py-2 rounded-xl text-xs font-body font-semibold active:scale-95 transition-transform"
                    >
                      <ExternalLink size={12} />
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">🏨</p>
                <p className="font-body text-sm text-[#1A1A2E]/50">No accommodations found</p>
                <button
                  onClick={() => { setActiveCity('All'); setActiveType('All'); }}
                  className="mt-2 text-xs font-body text-[#003F87] font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Booking.com Deals Banner */}
        <div className="mt-4 bg-gradient-to-r from-[#003580]/5 to-[#0071c2]/5 rounded-2xl p-4 border border-[#003580]/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🎉</span>
            <p className="font-body font-semibold text-sm text-[#003580]">Special Deals</p>
          </div>
          <p className="text-xs font-body text-[#1A1A2E]/60 mb-3">
            Get up to 25% off on selected properties in Israel. Book early and save!
          </p>
          <button
            onClick={() => openBookingSearch('Israel', 'booking')}
            className="text-xs font-body text-[#0071c2] font-semibold flex items-center gap-1"
          >
            View all deals <ExternalLink size={11} />
          </button>
        </div>
      </div>

      {/* In-app Booking WebView */}
      {showBookingModal && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#D4C5A9]/20 bg-white shadow-sm">
            <button
              onClick={() => setShowBookingModal(false)}
              className="p-1.5 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft size={20} className="text-[#1A1A2E]" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-white font-bold text-[10px] px-1.5 py-0.5 rounded font-body"
                  style={{ backgroundColor: PROVIDER_COLORS[activeProvider] }}
                >
                  {PROVIDER_LABELS[activeProvider]}
                </span>
                {isProviderTracked(activeProvider) ? (
                  <span className="text-[8px] font-body text-[#4A7C59] bg-[#4A7C59]/10 px-1.5 py-0.5 rounded-full">Affiliate tracked</span>
                ) : (
                  <span className="text-[8px] font-body text-[#B45309] bg-[#B45309]/10 px-1.5 py-0.5 rounded-full">Not tracked yet</span>
                )}
              </div>
              <p className="text-[9px] font-body text-[#1A1A2E]/40 truncate mt-0.5 flex items-center gap-1">
                🔒 {getProviderUrl(activeProvider, selectedHotel).replace('https://', '')}
              </p>
            </div>
          </div>

          <div className="flex-1 relative">
            <iframe
              src={getProviderUrl(activeProvider, selectedHotel)}
              className="w-full h-full border-0"
              title={PROVIDER_LABELS[activeProvider]}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              loading="lazy"
            />
          </div>

          <div className="px-4 py-2 border-t border-[#D4C5A9]/20 bg-white flex items-center justify-between">
            <p className="text-[8px] font-body text-[#1A1A2E]/40">
              Shalom Guide • {PROVIDER_LABELS[activeProvider]} affiliate • Secure checkout
            </p>
            <button
              onClick={() => setShowBookingModal(false)}
              className="text-[10px] font-body text-[#003F87] font-medium"
            >
              ← Back to app
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}