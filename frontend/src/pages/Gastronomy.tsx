import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, Search, Phone, MapPin, BookOpen, Bookmark, Baby, Dog, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { getMapsDirectionsUrl, getMenuSearchUrl } from '@/lib/discoveryLinks';
import {
  getOpenTableUrl,
  isOpenTableAvailable,
  isOpenTableTracked,
  getOntopoUrl,
} from '@/lib/affiliateLinks';
import RestaurantDetailModal from '@/components/RestaurantDetailModal';
import ExternalWebview from '@/components/ExternalWebview';

const dietaryFilters = ['Kosher ✡️', 'Mehadrin', 'Badatz', 'Halal ☪️', 'Vegan 🌱', 'Vegetarian', 'Gluten-Free'];
const typeFilters = ['Israeli', 'Arab', 'Mediterranean', 'Yemenite', 'Ethiopian', 'Fusion', 'Street Food'];

type SpecialFilter = 'kidsMenu' | 'petFriendly' | 'shabbatOpen' | 'shabbatClosed';

interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  rating: number;
  reviews: number;
  certification?: string | null;
  price_level: number;
  distance: number;
  is_open: boolean;
  closes_at: string;
  opens_at: string;
  tags: string;
  city: string;
  kids_menu: boolean;
  pet_friendly: boolean;
  shabbat_open: boolean;
  phone?: string | null;
  address?: string | null;
  tripadvisor_rating?: number | null;
  tripadvisor_review_count?: number | null;
  tripadvisor_url?: string | null;
}

interface FeaturedRestaurant {
  id: number;
  name: string;
  category: string;
  city: string;
  rating: number;
  price_level: number;
  image_url: string;
  featured_section: string;
  sort_order: number;
}

export default function Gastronomy() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [featuredRestaurants, setFeaturedRestaurants] = useState<FeaturedRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [specialFilters, setSpecialFilters] = useState<SpecialFilter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCity, setMapCity] = useState('Tel Aviv');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [ontopoCity, setOntopoCity] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [restaurantsData, featuredData] = await Promise.all([
        api.getRestaurants(),
        api.getFeaturedRestaurants('best_hummus'),
      ]);
      setRestaurants(restaurantsData);
      setFeaturedRestaurants(featuredData);
    } catch (error) {
      console.error('Failed to load restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  const toggleSpecialFilter = (filter: SpecialFilter) => {
    setSpecialFilters((prev) => {
      if (filter === 'shabbatOpen' && prev.includes('shabbatClosed')) {
        return [...prev.filter((f) => f !== 'shabbatClosed'), filter];
      }
      if (filter === 'shabbatClosed' && prev.includes('shabbatOpen')) {
        return [...prev.filter((f) => f !== 'shabbatOpen'), filter];
      }
      return prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter];
    });
  };

  // Dietary/type filter labels carry emoji and don't match the underlying data
  // verbatim (e.g. "Kosher ✡️" vs. certification "Kosher", "Vegan 🌱" vs. tag
  // "Vegan options") — strip the emoji and match as a loose substring against
  // cuisine + certification + tags combined.
  const matchesTextFilter = (r: Restaurant, filter: string) => {
    const needle = filter.replace(/[^\w\s-]/gu, '').trim().toLowerCase();
    const haystack = `${r.cuisine} ${r.certification} ${r.tags}`.toLowerCase();
    return haystack.includes(needle);
  };

  const cities = Array.from(new Set(restaurants.map((r) => r.city))).sort();

  const filteredRestaurants = restaurants.filter((r) => {
    if (specialFilters.includes('kidsMenu') && !r.kids_menu) return false;
    if (specialFilters.includes('petFriendly') && !r.pet_friendly) return false;
    if (specialFilters.includes('shabbatOpen') && !r.shabbat_open) return false;
    if (specialFilters.includes('shabbatClosed') && r.shabbat_open) return false;
    if (activeFilters.length > 0 && !activeFilters.every((f) => matchesTextFilter(r, f))) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      if (!r.name.toLowerCase().includes(q) && !r.cuisine.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <AppLayout>
      <div className="px-4 py-3">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/home')} className="p-1.5 rounded-lg hover:bg-white">
            <ArrowLeft size={20} className="text-[#1A1A2E]" />
          </button>
          <h1 className="font-display text-xl font-bold text-[#1A1A2E]">Eat in Israel</h1>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl p-3 border border-[#D4C5A9]/20 shadow-sm mb-3">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-[#1A1A2E]/40" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Restaurant name or cuisine..."
              className="flex-1 text-sm font-body outline-none bg-transparent placeholder:text-[#1A1A2E]/30"
            />
          </div>
        </div>

        {/* Map */}
        <div className="bg-white rounded-2xl overflow-hidden border border-[#D4C5A9]/20 shadow-sm mb-3">
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar p-2 border-b border-[#D4C5A9]/10">
            {(cities.length > 0 ? cities : ['Tel Aviv', 'Jerusalem']).map((city) => (
              <button
                key={city}
                onClick={() => setMapCity(city)}
                className={`flex-shrink-0 text-[11px] font-body px-3 py-1.5 rounded-full transition-colors ${
                  mapCity === city
                    ? 'bg-[#003F87] text-white'
                    : 'bg-[#FAF8F5] text-[#1A1A2E]/70'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
          <iframe
            src={`https://maps.google.com/maps?q=${encodeURIComponent('restaurants in ' + mapCity + ', Israel')}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
            width="100%"
            height="220"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Restaurants map"
            className="w-full"
          />
        </div>

        {/* Special Filters */}
        <div className="mb-3">
          <p className="text-[10px] font-body text-[#1A1A2E]/50 mb-1.5 font-medium uppercase tracking-wider">Special</p>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            <button
              onClick={() => toggleSpecialFilter('kidsMenu')}
              className={`flex-shrink-0 flex items-center gap-1.5 text-[11px] font-body px-3 py-2 rounded-full transition-all ${
                specialFilters.includes('kidsMenu')
                  ? 'bg-[#003F87] text-white shadow-sm'
                  : 'bg-white border border-[#D4C5A9]/30 text-[#1A1A2E]/70'
              }`}
            >
              <Baby size={13} />
              Cardápio infantil
            </button>
            <button
              onClick={() => toggleSpecialFilter('petFriendly')}
              className={`flex-shrink-0 flex items-center gap-1.5 text-[11px] font-body px-3 py-2 rounded-full transition-all ${
                specialFilters.includes('petFriendly')
                  ? 'bg-[#003F87] text-white shadow-sm'
                  : 'bg-white border border-[#D4C5A9]/30 text-[#1A1A2E]/70'
              }`}
            >
              <Dog size={13} />
              Pet-friendly
            </button>
            <button
              onClick={() => toggleSpecialFilter('shabbatOpen')}
              className={`flex-shrink-0 flex items-center gap-1.5 text-[11px] font-body px-3 py-2 rounded-full transition-all ${
                specialFilters.includes('shabbatOpen')
                  ? 'bg-[#4A7C59] text-white shadow-sm'
                  : 'bg-white border border-[#D4C5A9]/30 text-[#1A1A2E]/70'
              }`}
            >
              <Clock size={13} />
              Funciona no Shabat
            </button>
            <button
              onClick={() => toggleSpecialFilter('shabbatClosed')}
              className={`flex-shrink-0 flex items-center gap-1.5 text-[11px] font-body px-3 py-2 rounded-full transition-all ${
                specialFilters.includes('shabbatClosed')
                  ? 'bg-[#C0392B] text-white shadow-sm'
                  : 'bg-white border border-[#D4C5A9]/30 text-[#1A1A2E]/70'
              }`}
            >
              <Clock size={13} />
              Não funciona no Shabat
            </button>
          </div>
        </div>

        {/* Dietary Filters */}
        <div className="mb-3">
          <p className="text-[10px] font-body text-[#1A1A2E]/50 mb-1.5 font-medium uppercase tracking-wider">Dietary</p>
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
            {dietaryFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => toggleFilter(filter)}
                className={`flex-shrink-0 text-[10px] font-body px-2.5 py-1.5 rounded-full transition-colors ${
                  activeFilters.includes(filter)
                    ? 'bg-[#003F87] text-white'
                    : 'bg-white border border-[#D4C5A9]/30 text-[#1A1A2E]/70'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-[10px] font-body text-[#1A1A2E]/50 mb-1.5 font-medium uppercase tracking-wider">Type</p>
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
            {typeFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => toggleFilter(filter)}
                className={`flex-shrink-0 text-[10px] font-body px-2.5 py-1.5 rounded-full transition-colors ${
                  activeFilters.includes(filter)
                    ? 'bg-[#003F87] text-white'
                    : 'bg-white border border-[#D4C5A9]/30 text-[#1A1A2E]/70'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Active filter count */}
        {specialFilters.length > 0 && (
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-body text-[#1A1A2E]/60">
              {filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? 's' : ''} found
            </p>
            <button
              onClick={() => setSpecialFilters([])}
              className="text-[10px] font-body text-[#C0392B] font-medium"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003F87]"></div>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featuredRestaurants.length > 0 && (
              <div className="mb-4">
                <h3 className="font-display text-base font-semibold text-[#1A1A2E] mb-2">Tel Aviv's Best Hummus</h3>
                <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
                  {featuredRestaurants.map((fr) => (
                    <div key={fr.id} className="flex-shrink-0 w-36 bg-white rounded-xl p-3 border border-[#D4C5A9]/20 shadow-sm">
                      <div className="w-full h-16 rounded-lg mb-2 overflow-hidden">
                        <img src={fr.image_url} alt={fr.name} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs font-body font-semibold text-[#1A1A2E] truncate">{fr.name}</p>
                      <p className="text-[10px] font-body text-[#1A1A2E]/50">⭐ {fr.rating} • {'₪'.repeat(fr.price_level)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Restaurant List */}
            <div className="space-y-3">
              {filteredRestaurants.map((restaurant) => (
                <div key={restaurant.id} className="bg-white rounded-2xl p-4 border border-[#D4C5A9]/20 shadow-sm star-pattern">
                  <div className="flex gap-3 cursor-pointer" onClick={() => setSelectedRestaurant(restaurant)}>
                    <div className="w-20 h-20 bg-gradient-to-br from-[#C8A96E]/20 to-[#003F87]/10 rounded-xl flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-body font-semibold text-sm text-[#1A1A2E]">{restaurant.name}</h3>
                          <p className="text-[10px] font-body text-[#1A1A2E]/50">{restaurant.cuisine} • {restaurant.city}</p>
                        </div>
                        <Bookmark size={16} className="text-[#D4C5A9] flex-shrink-0" />
                      </div>

                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] font-body text-[#C8A96E]">★ {restaurant.rating}</span>
                        <span className="text-[10px] font-body text-[#1A1A2E]/40">{restaurant.reviews} reviews</span>
                        {restaurant.tripadvisor_rating && restaurant.tripadvisor_url && (
                          <a
                            href={restaurant.tripadvisor_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[9px] font-body px-1.5 py-0.5 rounded-full bg-[#34E0A1]/10 text-[#00AA6C] font-medium"
                          >
                            🦉 {restaurant.tripadvisor_rating} ({restaurant.tripadvisor_review_count})
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {restaurant.certification && (
                          <span className="text-[9px] font-body px-1.5 py-0.5 rounded-full bg-[#4A7C59]/10 text-[#4A7C59] font-medium">
                            {restaurant.certification}
                          </span>
                        )}
                        {restaurant.kids_menu && (
                          <span className="text-[9px] font-body px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">
                            👶 Kids
                          </span>
                        )}
                        {restaurant.pet_friendly && (
                          <span className="text-[9px] font-body px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">
                            🐾 Pets
                          </span>
                        )}
                        {restaurant.shabbat_open && (
                          <span className="text-[9px] font-body px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">
                            🕯️ Shabat
                          </span>
                        )}
                        {restaurant.tags && restaurant.tags.split(',').map((tag) => (
                          <span key={tag} className="text-[9px] font-body px-1.5 py-0.5 rounded-full bg-[#FAF8F5] text-[#1A1A2E]/50">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 text-[10px] font-body text-[#1A1A2E]/50">
                          <span>{'₪'.repeat(restaurant.price_level)}</span>
                          <span>{restaurant.distance} km</span>
                        </div>
                        <span className={`text-[10px] font-body font-medium ${restaurant.is_open ? 'text-[#4A7C59]' : 'text-[#1A1A2E]/40'}`}>
                          {restaurant.is_open ? `Open until ${restaurant.closes_at}` : `Opens at ${restaurant.opens_at}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3 pt-3 border-t border-[#D4C5A9]/10">
                    {restaurant.phone && (
                      <a
                        href={`tel:${restaurant.phone}`}
                        className="flex-1 flex items-center justify-center gap-1 text-[10px] font-body font-medium text-[#003F87] py-1.5 rounded-lg bg-[#003F87]/5"
                      >
                        <Phone size={10} /> Call
                      </a>
                    )}
                    <a
                      href={getMapsDirectionsUrl(`${restaurant.address || restaurant.name}, ${restaurant.city}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1 text-[10px] font-body font-medium text-[#003F87] py-1.5 rounded-lg bg-[#003F87]/5"
                    >
                      <MapPin size={10} /> Directions
                    </a>
                    <a
                      href={getMenuSearchUrl(restaurant.name, restaurant.city)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1 text-[10px] font-body font-medium text-[#003F87] py-1.5 rounded-lg bg-[#003F87]/5"
                    >
                      <BookOpen size={10} /> Menu
                    </a>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setOntopoCity(restaurant.city); }}
                      className="flex-1 flex items-center justify-center gap-1 text-[10px] font-body font-semibold text-white py-1.5 rounded-lg bg-[#4A7C59]"
                    >
                      Reserve on Ontopo
                    </button>
                    {isOpenTableAvailable(restaurant.city) && (
                      <a
                        href={getOpenTableUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1 text-[10px] font-body font-semibold text-white py-1.5 rounded-lg bg-[#DA3743] relative"
                      >
                        Reserve on OpenTable
                        {!isOpenTableTracked() && (
                          <span className="absolute -top-1.5 -right-1.5 text-[7px] font-body text-[#B45309] bg-white px-1 py-0.5 rounded-full border border-[#D4C5A9]/30">
                            untracked
                          </span>
                        )}
                      </a>
                    )}
                  </div>
                </div>
              ))}

              {filteredRestaurants.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">🍽️</p>
                  <p className="font-body text-sm text-[#1A1A2E]/50">No restaurants match your filters</p>
                  <button
                    onClick={() => setSpecialFilters([])}
                    className="mt-2 text-xs font-body text-[#003F87] font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {selectedRestaurant && (
        <RestaurantDetailModal
          restaurant={selectedRestaurant}
          onClose={() => setSelectedRestaurant(null)}
        />
      )}

      {ontopoCity && (
        <ExternalWebview
          url={getOntopoUrl(ontopoCity)}
          label="Ontopo"
          color="#4A7C59"
          onClose={() => setOntopoCity(null)}
        />
      )}
    </AppLayout>
  );
}