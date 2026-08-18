import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, Search, ExternalLink, AlertTriangle, MapPin, Navigation, Bus, Train, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { getMoovitUrl, getGettAppLinks, getTransitDirectionsUrl } from '@/lib/discoveryLinks';
import { getDiscoverCarsUrl, isDiscoverCarsTracked } from '@/lib/affiliateLinks';

const tabs = ['🚌 Bus & Train', '🗺️ Live Map', '🚕 Taxi', '🚗 Car Rental'];

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

interface TransportRoute {
  id: number;
  route_number: string;
  from_city: string;
  to_city: string;
  departure: string;
  duration: string;
  stops: number;
  price: number;
  operator: string;
  type: string;
}

interface RentalCompany {
  id: number;
  name: string;
  flag: string;
  price_from: number;
  vehicle_type: string;
  rating: number;
  website_url: string | null;
  phone: string | null;
  locations: string;
  is_local: boolean;
}

interface TaxiInfo {
  id: number;
  distance_range: string;
  distance_label: string;
  price_min: number;
  price_max: number;
  currency: string;
  notes: string;
}

export default function Transport() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedCity, setSelectedCity] = useState('Tel Aviv');
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [rentalCompanies, setRentalCompanies] = useState<RentalCompany[]>([]);
  const [taxiInfo, setTaxiInfo] = useState<TaxiInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const cities = ['Tel Aviv', 'Jerusalem', 'Haifa', 'Beer Sheva', 'Eilat'];

  const [showRouteResult, setShowRouteResult] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [routesData, rentalData, taxiData] = await Promise.all([
        api.getTransportRoutes(),
        api.getRentalCompanies(),
        api.getTaxiInfo(),
      ]);
      setRoutes(routesData);
      setRentalCompanies(rentalData);
      setTaxiInfo(taxiData);
    } catch (error) {
      console.error('Failed to load transport data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openNearbyStops = () => {
    setShowRouteResult(true);
  };

  const getMapEmbedUrl = () => {
    if (GOOGLE_MAPS_API_KEY) {
      return `https://www.google.com/maps/embed/v1/search?key=${GOOGLE_MAPS_API_KEY}&q=public+transit+stops+in+${encodeURIComponent(selectedCity + ', Israel')}&maptype=roadmap&zoom=14`;
    }
    return `https://maps.google.com/maps?q=public+transit+${encodeURIComponent(selectedCity + ', Israel')}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
  };

  return (
    <AppLayout>
      <div className="px-4 py-3">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/home')} className="p-1.5 rounded-lg hover:bg-white">
            <ArrowLeft size={20} className="text-[#1A1A2E]" />
          </button>
          <h1 className="font-display text-xl font-bold text-[#1A1A2E]">Getting Around Israel</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`flex-shrink-0 px-3 py-2 rounded-full text-xs font-body font-medium transition-colors ${
                activeTab === i
                  ? 'bg-[#003F87] text-white'
                  : 'bg-white text-[#1A1A2E]/70 border border-[#D4C5A9]/30'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Bus & Train Tab */}
        {activeTab === 0 && (
          <div className="space-y-3">
            {/* Route Planner */}
            <div className="bg-white rounded-xl p-3 border border-[#D4C5A9]/20 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#4A7C59] flex items-center justify-center">
                  <Navigation size={10} className="text-white" />
                </div>
                <input
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="From (e.g., Jerusalem Central Station)"
                  className="flex-1 text-sm font-body outline-none bg-transparent placeholder:text-[#1A1A2E]/30"
                />
              </div>
              <div className="border-l-2 border-dashed border-[#D4C5A9]/40 ml-2.5 h-3" />
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#C0392B] flex items-center justify-center">
                  <MapPin size={10} className="text-white" />
                </div>
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="To (e.g., Tel Aviv HaShalom)"
                  className="flex-1 text-sm font-body outline-none bg-transparent placeholder:text-[#1A1A2E]/30"
                />
              </div>
              <a
                href={getTransitDirectionsUrl(origin || 'Tel Aviv', destination || 'Jerusalem')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-2 bg-[#003F87] text-white py-2.5 rounded-xl text-xs font-body font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Search size={14} />
                Search Routes via Google Transit
              </a>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
              <p className="text-xs font-body text-amber-700">No public transport on Shabbat (Friday evening – Saturday evening)</p>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-xl p-3 border border-[#D4C5A9]/20 shadow-sm flex items-center gap-2">
                <Train size={16} className="text-[#003F87]" />
                <div className="text-left">
                  <p className="text-xs font-body font-semibold text-[#1A1A2E]">Israel Railways</p>
                  <p className="text-[9px] font-body text-[#1A1A2E]/50">rail.co.il</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-3 border border-[#D4C5A9]/20 shadow-sm flex items-center gap-2">
                <Bus size={16} className="text-[#4A7C59]" />
                <div className="text-left">
                  <p className="text-xs font-body font-semibold text-[#1A1A2E]">Egged Bus</p>
                  <p className="text-[9px] font-body text-[#1A1A2E]/50">egged.co.il</p>
                </div>
              </div>
            </div>

            {/* Popular Routes */}
            <h3 className="font-body font-semibold text-sm text-[#1A1A2E] mt-2">Popular Routes</h3>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-[#003F87]" />
              </div>
            ) : (
              routes.map((route) => (
                <div key={route.id} className="bg-white rounded-2xl p-4 border border-[#D4C5A9]/20 shadow-sm star-pattern">
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-[#003F87] text-white text-xs px-2 py-0.5 rounded-full font-mono-data">
                      #{route.route_number}
                    </span>
                    <span className="font-mono-data text-sm font-medium text-[#1A1A2E]">₪{route.price}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-body text-[#1A1A2E]">
                    <span>{route.from_city}</span>
                    <span className="text-[#D4C5A9]">→</span>
                    <span>{route.to_city}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-[#1A1A2E]/50 font-body">
                    <span>🕐 {route.departure}</span>
                    <span>⏱️ {route.duration}</span>
                    <span>{route.stops} stops</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <a
                      href={getMoovitUrl(route.to_city)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-[#003F87]/5 text-[#003F87] text-xs py-2 rounded-lg font-body font-medium flex items-center justify-center gap-1"
                    >
                      <Bus size={12} /> Moovit
                    </a>
                    <button
                      onClick={() => {
                        setOrigin(route.from_city);
                        setDestination(route.to_city);
                        setActiveTab(1);
                      }}
                      className="flex-1 bg-[#003F87]/5 text-[#003F87] text-xs py-2 rounded-lg font-body font-medium flex items-center justify-center gap-1"
                    >
                      <MapPin size={12} /> View on Map
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Live Map Tab - Google Maps Transit */}
        {activeTab === 1 && (
          <div className="space-y-3">
            {/* City selector */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`flex-shrink-0 text-[11px] font-body px-3 py-1.5 rounded-full transition-colors ${
                    selectedCity === city
                      ? 'bg-[#003F87] text-white'
                      : 'bg-white border border-[#D4C5A9]/30 text-[#1A1A2E]/70'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>

            {/* Google Maps Embed */}
            <div className="bg-white rounded-2xl overflow-hidden border border-[#D4C5A9]/20 shadow-sm">
              <div className="relative">
                <iframe
                  src={getMapEmbedUrl()}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Google Maps Transit"
                  className="w-full"
                />
              </div>
              <div className="p-3 space-y-2">
                <p className="text-xs font-body text-[#1A1A2E]/60">
                  Showing public transit stops near <span className="font-semibold text-[#003F87]">{selectedCity}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={openNearbyStops}
                    className="flex-1 bg-[#003F87] text-white text-xs py-2.5 rounded-xl font-body font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <MapPin size={12} /> Find Nearby Stops
                  </button>
                  <button
                    onClick={() => setActiveTab(0)}
                    className="flex-1 bg-[#4A7C59] text-white text-xs py-2.5 rounded-xl font-body font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <Navigation size={12} /> Plan Route
                  </button>
                </div>
                {showRouteResult && (
                  <div className="mt-2 bg-[#4A7C59]/10 rounded-xl p-3">
                    <p className="text-[10px] font-body text-[#4A7C59] font-medium">✓ Showing transit stops in {selectedCity}</p>
                    <p className="text-[9px] font-body text-[#1A1A2E]/50 mt-1">Use the map above to explore nearby bus and train stops.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Real-time info */}
            <div className="bg-gradient-to-br from-[#003F87]/5 to-[#4A7C59]/5 rounded-2xl p-4 border border-[#003F87]/10">
              <h3 className="font-body font-semibold text-sm text-[#1A1A2E] mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#4A7C59] animate-pulse" />
                Real-Time Transit Info
              </h3>
              <p className="text-xs font-body text-[#1A1A2E]/60 mb-3">
                Track buses and trains in real-time using Google Maps Transit integration.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-white rounded-lg p-2">
                  <Bus size={14} className="text-[#003F87]" />
                  <div className="flex-1">
                    <p className="text-[11px] font-body font-medium text-[#1A1A2E]">Light Rail (Jerusalem)</p>
                    <p className="text-[9px] font-body text-[#1A1A2E]/50">Every 5-8 min</p>
                  </div>
                  <span className="text-[10px] font-mono-data text-[#4A7C59] font-medium">Live</span>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg p-2">
                  <Train size={14} className="text-[#003F87]" />
                  <div className="flex-1">
                    <p className="text-[11px] font-body font-medium text-[#1A1A2E]">Israel Railways</p>
                    <p className="text-[9px] font-body text-[#1A1A2E]/50">Every 20-30 min</p>
                  </div>
                  <span className="text-[10px] font-mono-data text-[#4A7C59] font-medium">Live</span>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg p-2">
                  <Bus size={14} className="text-[#4A7C59]" />
                  <div className="flex-1">
                    <p className="text-[11px] font-body font-medium text-[#1A1A2E]">Dan / Egged Bus</p>
                    <p className="text-[9px] font-body text-[#1A1A2E]/50">Varies by route</p>
                  </div>
                  <span className="text-[10px] font-mono-data text-[#4A7C59] font-medium">Live</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Taxi Tab */}
        {activeTab === 2 && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-4 border border-[#D4C5A9]/20 shadow-sm">
              <p className="text-sm font-body font-semibold text-[#1A1A2E] mb-1">Request a taxi via Gett</p>
              <p className="text-xs font-body text-[#1A1A2E]/50 mb-3">
                Gett only takes ride requests inside its app — there's no website booking. Get the app to order:
              </p>
              <div className="flex gap-2">
                <a
                  href={getGettAppLinks().android}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#1DBF73] text-white py-3 rounded-xl font-body font-semibold text-sm text-center active:scale-95 transition-transform"
                >
                  Google Play
                </a>
                <a
                  href={getGettAppLinks().ios}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#1DBF73] text-white py-3 rounded-xl font-body font-semibold text-sm text-center active:scale-95 transition-transform"
                >
                  App Store
                </a>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#D4C5A9]/20 shadow-sm">
              <h3 className="font-body font-semibold text-sm mb-3 text-[#1A1A2E]">Estimated Prices</h3>
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-[#003F87]" />
                </div>
              ) : (
                <div className="space-y-2">
                  {taxiInfo.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-[#D4C5A9]/10 last:border-0">
                      <div>
                        <span className="text-xs font-body text-[#1A1A2E]/70">{item.distance_label}</span>
                        {item.notes && <p className="text-[9px] font-body text-[#1A1A2E]/40 mt-0.5">{item.notes}</p>}
                      </div>
                      <span className="font-mono-data text-xs text-[#003F87] font-medium">₪{item.price_min}-{item.price_max}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-body text-amber-700">💡 Always ask driver to turn on the meter. Tip not expected but appreciated.</p>
            </div>
          </div>
        )}

        {/* Car Rental Tab */}
        {activeTab === 3 && (
          <div className="space-y-3">
            {/* Discover Cars comparison widget */}
            <div className="bg-gradient-to-br from-[#003F87] to-[#003F87]/90 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-sm font-body">Compare on</span>
                  <span className="bg-white text-[#003F87] font-bold text-xs px-2 py-0.5 rounded font-body">Discover Cars</span>
                </div>
                {isDiscoverCarsTracked() ? (
                  <span className="text-[8px] font-body text-[#4A7C59] bg-white/90 px-1.5 py-0.5 rounded-full">Affiliate tracked</span>
                ) : (
                  <span className="text-[8px] font-body text-[#B45309] bg-white/90 px-1.5 py-0.5 rounded-full">Not tracked yet</span>
                )}
              </div>
              <p className="text-white/80 text-xs font-body mb-3">
                Compare prices across every rental company in Israel in one search
              </p>
              <a
                href={getDiscoverCarsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-white text-[#003F87] py-2.5 rounded-xl text-sm font-body font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <ExternalLink size={14} />
                Search on Discover Cars
              </a>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#D4C5A9]/20 shadow-sm">
              <h3 className="font-body font-semibold text-sm mb-3 text-[#1A1A2E]">Car Rental Companies</h3>
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-[#003F87]" />
                </div>
              ) : (
                <div className="space-y-3">
                  {rentalCompanies.map((company) => (
                    <div key={company.id} className="flex items-center justify-between py-2 border-b border-[#D4C5A9]/10 last:border-0">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{company.flag}</span>
                          <p className="text-xs font-body font-semibold text-[#1A1A2E]">{company.name}</p>
                          {company.is_local && <span className="text-[8px] font-body text-[#003F87] bg-[#003F87]/10 px-1.5 py-0.5 rounded-full">Local</span>}
                        </div>
                        <p className="text-[10px] font-body text-[#1A1A2E]/50">From ₪{company.price_from}/day • {company.vehicle_type}</p>
                        <p className="text-[9px] font-body text-[#1A1A2E]/40 mt-0.5">⭐ {company.rating} • {company.locations}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {company.website_url && (
                          <a
                            href={company.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] font-body text-[#003F87] font-medium"
                          >
                            <ExternalLink size={10} /> Book
                          </a>
                        )}
                        {company.phone && (
                          <a href={`tel:${company.phone}`} className="text-[9px] font-body text-[#4A7C59]">
                            📞 {company.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#003F87]/5 rounded-xl p-3">
              <p className="text-xs font-body text-[#003F87]/80">
                <strong>Driving tips:</strong> Drive on the right. Speed limit: 90-110 km/h on highways, 50 km/h in cities. International license accepted for 1 year.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}