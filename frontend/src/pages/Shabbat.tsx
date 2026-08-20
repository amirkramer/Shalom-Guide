import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, ChevronDown, Users, MapPin, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import SmartExternalLink from '@/components/SmartExternalLink';

const closedOnShabbat = ['Most restaurants & shops', 'Public transport', 'Banks & offices', 'Shopping malls'];
const openOnShabbat = ['Hotels', 'Hospitals & pharmacies', 'Shabbat-open restaurants', 'Emergency services'];

const shabbatCities = ['Jerusalem', 'Tel Aviv', 'Haifa', 'Beer Sheva', 'Eilat'];

const chabadHouses = [
  { name: 'Chabad of the Old City', city: 'Jerusalem', meals: 'Fri 19:30, Sat 12:00', languages: 'English, Hebrew' },
  { name: 'Chabad Tel Aviv Beach', city: 'Tel Aviv', meals: 'Fri 19:00, Sat 12:30', languages: 'English, Spanish, Hebrew' },
  { name: 'Chabad Haifa', city: 'Haifa', meals: 'Fri 19:15, Sat 12:00', languages: 'English, Russian, Hebrew' },
];

const hostFamilies = [
  { name: 'The Cohen Family', neighborhood: 'Nachlaot', city: 'Jerusalem', languages: 'English, Portuguese', tradition: 'Sephardic', capacity: 6 },
  { name: 'The Levi Family', neighborhood: 'Florentin', city: 'Tel Aviv', languages: 'English, Spanish', tradition: 'Ashkenazi', capacity: 4 },
];

interface ShabbatTime {
  id: number;
  city: string;
  parasha: string;
  candle_lighting: string;
  havdalah: string;
  date_friday: string;
  hebrew_date: string;
  is_current: boolean;
}

export default function Shabbat() {
  const navigate = useNavigate();
  const [shabbatData, setShabbatData] = useState<ShabbatTime | null>(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('Jerusalem');
  const [showCityPicker, setShowCityPicker] = useState(false);

  useEffect(() => {
    loadShabbatData(city);
  }, [city]);

  const loadShabbatData = async (forCity: string) => {
    setLoading(true);
    try {
      const items = await api.getShabbatTimes(forCity);
      setShabbatData(items.length > 0 ? items[0] : null);
    } catch (error) {
      console.error('Failed to load shabbat data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-[#003F87]" size={32} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 py-3">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/home')} className="p-1.5 rounded-lg hover:bg-white">
            <ArrowLeft size={20} className="text-[#1A1A2E]" />
          </button>
          <h1 className="font-display text-xl font-bold text-[#1A1A2E]">Shabbat & Community</h1>
        </div>

        {/* This Week's Shabbat */}
        <div className="bg-gradient-to-br from-[#003F87] to-[#003F87]/80 rounded-2xl p-5 text-white shadow-lg mb-4 relative">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold">This Week's Shabbat</h2>
            <div className="relative">
              <button
                onClick={() => setShowCityPicker((v) => !v)}
                className="flex items-center gap-1 text-xs bg-white/10 px-2 py-1 rounded-full"
              >
                <span>{shabbatData?.city || city}</span>
                <ChevronDown size={12} />
              </button>
              {showCityPicker && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg overflow-hidden z-20 min-w-[120px]">
                  {shabbatCities.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setCity(c);
                        setShowCityPicker(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-body ${
                        c === city ? 'bg-[#003F87]/5 text-[#003F87] font-medium' : 'text-[#1A1A2E]/70'
                      } hover:bg-[#FAF8F5]`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <p className="text-sm font-body opacity-90">📜 {shabbatData?.parasha || ''}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-[10px] opacity-70 font-body">🕯️ Candle Lighting</p>
                <p className="font-mono-data text-lg font-bold">{shabbatData?.candle_lighting || '--:--'}</p>
                <p className="text-[10px] opacity-70 font-body">Friday</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-[10px] opacity-70 font-body">✨ Havdalah</p>
                <p className="font-mono-data text-lg font-bold">{shabbatData?.havdalah || '--:--'}</p>
                <p className="text-[10px] opacity-70 font-body">Saturday</p>
              </div>
            </div>
          </div>

          {/* What closes */}
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xs font-body font-medium mb-2">What happens on Shabbat?</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div>
                <p className="text-[10px] font-body opacity-70 mb-1">❌ Closed:</p>
                {closedOnShabbat.map((item) => (
                  <p key={item} className="text-[10px] font-body opacity-80">• {item}</p>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-body opacity-70 mb-1">✅ Open:</p>
                {openOnShabbat.map((item) => (
                  <p key={item} className="text-[10px] font-body opacity-80">• {item}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Shabbat Hospitality */}
        <div className="bg-white rounded-2xl p-4 border border-[#C8A96E]/30 shadow-sm mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🕯️</span>
            <div>
              <h3 className="font-display text-base font-semibold text-[#1A1A2E]">Shabbat Hospitality</h3>
              <p className="text-[10px] font-body text-[#1A1A2E]/50">Experience authentic Israeli hospitality</p>
            </div>
          </div>

          {/* Host Families */}
          <p className="text-xs font-body font-medium text-[#1A1A2E]/70 mb-2">Host Families</p>
          {hostFamilies.map((family) => (
            <div key={family.name} className="bg-[#FAF8F5] rounded-xl p-3 mb-2 star-pattern">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-body font-semibold text-sm text-[#1A1A2E]">{family.name}</p>
                  <p className="text-[10px] font-body text-[#1A1A2E]/50">{family.neighborhood}, {family.city}</p>
                  <p className="text-[10px] font-body text-[#1A1A2E]/50 mt-1">🗣️ {family.languages}</p>
                  <p className="text-[10px] font-body text-[#1A1A2E]/50">{family.tradition} tradition</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-body text-[#1A1A2E]/50">
                  <Users size={10} /> {family.capacity}
                </div>
              </div>
              <SmartExternalLink
                href="https://www.shabbat.com"
                label="Shabbat.com"
                color="#C8A96E"
                className="mt-2 block w-full text-center bg-[#C8A96E] text-white text-xs py-2 rounded-xl font-body font-medium active:scale-95 transition-transform"
              >
                Find a Host on Shabbat.com
              </SmartExternalLink>
            </div>
          ))}
        </div>

        {/* Chabad Houses */}
        <div className="bg-white rounded-2xl p-4 border border-[#D4C5A9]/20 shadow-sm mb-4">
          <h3 className="font-display text-base font-semibold text-[#1A1A2E] mb-3">🕍 Chabad Houses Near Me</h3>
          {chabadHouses.map((chabad) => (
            <div key={chabad.name} className="py-3 border-b border-[#D4C5A9]/10 last:border-0">
              <p className="font-body font-semibold text-sm text-[#1A1A2E]">{chabad.name}</p>
              <p className="text-[10px] font-body text-[#1A1A2E]/50 flex items-center gap-1 mt-0.5">
                <MapPin size={10} /> {chabad.city}
              </p>
              <p className="text-[10px] font-body text-[#1A1A2E]/50">🍽️ Meals: {chabad.meals}</p>
              <p className="text-[10px] font-body text-[#1A1A2E]/50">🗣️ {chabad.languages}</p>
            </div>
          ))}
        </div>

        {/* Jewish Holidays */}
        <div className="bg-white rounded-2xl p-4 border border-[#D4C5A9]/20 shadow-sm">
          <h3 className="font-display text-base font-semibold text-[#1A1A2E] mb-2">📅 Next Holiday</h3>
          <div className="bg-[#FAF8F5] rounded-xl p-3">
            <p className="font-body font-semibold text-sm text-[#003F87]">Sukkot</p>
            <p className="text-[10px] font-body text-[#1A1A2E]/50 mt-1">Festival of Tabernacles • October 2-9, 2026</p>
            <p className="text-xs font-body text-[#1A1A2E]/60 mt-2">A week-long celebration commemorating the Israelites' journey through the wilderness. Look for decorated Sukkah booths throughout Israel!</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}