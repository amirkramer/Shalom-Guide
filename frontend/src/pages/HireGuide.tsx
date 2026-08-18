import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@metagptx/web-sdk';
import AppLayout from '@/components/layout/AppLayout';
import AppHeader from '@/components/layout/AppHeader';
import { Star, MapPin, Globe, Users } from 'lucide-react';

const client = createClient();

const CITIES = [
  { id: 'all', label: 'All Regions', icon: '🌍' },
  { id: 'Jerusalem', label: 'Jerusalem', icon: '🕌' },
  { id: 'Tel Aviv', label: 'Tel Aviv', icon: '🏖️' },
  { id: 'Norte de Israel', label: 'Norte de Israel', icon: '⛰️' },
  { id: 'Sul de Israel', label: 'Sul de Israel', icon: '🏜️' },
];

interface Guide {
  id: number;
  name: string;
  bio: string;
  photo_url: string | null;
  languages: string;
  specialties: string | null;
  cities: string;
  rating: number;
  total_reviews: number;
}

// Fallback mock data when backend is unavailable
const FALLBACK_GUIDES: Guide[] = [
  {
    id: 1,
    name: 'David Cohen',
    bio: 'Certified guide with 15 years of experience in Jerusalem Old City and historical sites.',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    languages: 'English, Hebrew, Spanish',
    specialties: 'Old City, Holy Sites, History',
    cities: 'Jerusalem',
    rating: 4.9,
    total_reviews: 127,
  },
  {
    id: 2,
    name: 'Sarah Levi',
    bio: 'Art and culture specialist. Explore the vibrant streets and galleries of Tel Aviv.',
    photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    languages: 'English, Hebrew, French',
    specialties: 'Art, Nightlife, Food Tours',
    cities: 'Tel Aviv',
    rating: 4.8,
    total_reviews: 95,
  },
  {
    id: 3,
    name: 'Mohammed Al-Rashid',
    bio: 'Nature and adventure guide covering the Galilee, Golan Heights, and northern trails.',
    photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    languages: 'English, Arabic, Hebrew',
    specialties: 'Hiking, Nature, Archaeology',
    cities: 'Norte de Israel',
    rating: 4.7,
    total_reviews: 83,
  },
  {
    id: 4,
    name: 'Rachel Ben-Ami',
    bio: 'Desert expert specializing in Negev, Eilat, and Dead Sea experiences.',
    photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    languages: 'English, Hebrew, Russian',
    specialties: 'Desert, Wellness, Adventure',
    cities: 'Sul de Israel',
    rating: 4.8,
    total_reviews: 71,
  },
  {
    id: 5,
    name: 'Yossi Goldberg',
    bio: 'Religious and historical tours specialist covering Jerusalem and northern holy sites.',
    photo_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    languages: 'English, Hebrew, Yiddish, Portuguese',
    specialties: 'Religious Sites, History, Kabbalah',
    cities: 'Jerusalem, Norte de Israel',
    rating: 4.9,
    total_reviews: 156,
  },
];

export default function HireGuide() {
  const navigate = useNavigate();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [selectedCity, setSelectedCity] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGuides();
  }, [selectedCity]);

  const loadGuides = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedCity !== 'all') {
        params.city = selectedCity;
      }
      const response = await client.apiCall.invoke({
        url: '/api/v1/guide/list',
        method: 'GET',
        data: params,
      });
      const items = response.data?.items;
      if (items && items.length > 0) {
        setGuides(items);
      } else {
        // Use fallback if backend returns empty
        setGuides(filterFallbackGuides(selectedCity));
      }
    } catch (error) {
      console.error('Failed to load guides, using fallback data:', error);
      setGuides(filterFallbackGuides(selectedCity));
    } finally {
      setLoading(false);
    }
  };

  const filterFallbackGuides = (city: string): Guide[] => {
    if (city === 'all') return FALLBACK_GUIDES;
    return FALLBACK_GUIDES.filter((g) =>
      g.cities.toLowerCase().includes(city.toLowerCase())
    );
  };

  return (
    <AppLayout>
      <AppHeader />

      <div className="px-4 pb-4 space-y-4">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#003F87] to-[#003F87]/80 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-[#C8A96E]" />
            <h1 className="text-lg font-heading font-bold">Hire a Guide</h1>
          </div>
          <p className="text-sm opacity-90 font-body">
            Connect with certified local guides for personalized tours across Israel
          </p>
        </div>

        {/* City Filter */}
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2 pb-2">
            {CITIES.map((city) => (
              <button
                key={city.id}
                onClick={() => setSelectedCity(city.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCity === city.id
                    ? 'bg-[#003F87] text-white shadow-md'
                    : 'bg-white text-[#1A1A2E] border border-gray-200'
                }`}
              >
                <span>{city.icon}</span>
                <span>{city.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Guide Cards */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003F87]"></div>
          </div>
        ) : guides.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 font-body">No guides found for this region</p>
          </div>
        ) : (
          <div className="space-y-3">
            {guides.map((guide) => (
              <div
                key={guide.id}
                onClick={() => navigate(`/hire-guide/profile/${guide.id}`)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div className="flex gap-3">
                  <img
                    src={guide.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'}
                    alt={guide.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#C8A96E]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading font-bold text-[#1A1A2E] text-sm">{guide.name}</h3>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-[#C8A96E] text-[#C8A96E]" />
                        <span className="text-xs font-bold text-[#1A1A2E]">{guide.rating}</span>
                        <span className="text-xs text-gray-400">({guide.total_reviews})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mt-1">
                      <Globe className="w-3 h-3 text-gray-400" />
                      <p className="text-xs text-gray-500 font-body truncate">{guide.languages}</p>
                    </div>

                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <p className="text-xs text-gray-500 font-body truncate">{guide.cities}</p>
                    </div>

                    {guide.specialties && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {guide.specialties.split(',').slice(0, 3).map((spec, i) => (
                          <span
                            key={i}
                            className="bg-[#F0EDE8] text-[#003F87] text-[10px] px-2 py-0.5 rounded-full font-medium"
                          >
                            {spec.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Become a Guide CTA */}
        <div className="bg-[#F0EDE8] rounded-2xl p-4 border border-[#D4C5A9]">
          <h3 className="font-heading font-bold text-[#1A1A2E] text-sm mb-1">Are you a guide?</h3>
          <p className="text-xs text-gray-600 font-body mb-3">
            Register as a guide and start offering tours to tourists visiting Israel
          </p>
          <button
            onClick={() => navigate('/hire-guide/register')}
            className="bg-[#003F87] text-white text-xs font-medium px-4 py-2 rounded-full"
          >
            Register as Guide
          </button>
        </div>
      </div>
    </AppLayout>
  );
}