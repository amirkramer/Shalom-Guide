import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { getExperienceBookingSearchUrl } from '@/lib/discoveryLinks';

const tabs = ['All', 'Food & Wine', 'Adventure', 'History', 'Religious', 'Family', 'Nightlife'];

interface Experience {
  id: number;
  title: string;
  category: string;
  city: string;
  description: string;
  price: number;
  duration: string;
  rating: number;
  reviews: number;
  provider: string;
  image_url: string;
  tags: string;
}

export default function Experiences() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExperiences();
  }, []);

  const loadExperiences = async () => {
    setLoading(true);
    try {
      const data = await api.getExperiences();
      setExperiences(data);
    } catch (error) {
      console.error('Failed to load experiences:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = activeTab === 'All' ? experiences : experiences.filter((e) => e.category === activeTab);

  return (
    <AppLayout>
      <div className="px-4 py-3">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/home')} className="p-1.5 rounded-lg hover:bg-white">
            <ArrowLeft size={20} className="text-[#1A1A2E]" />
          </button>
          <h1 className="font-display text-xl font-bold text-[#1A1A2E]">Experiences in Israel</h1>
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 px-3 py-2 rounded-full text-xs font-body font-medium transition-colors ${
                activeTab === tab ? 'bg-[#003F87] text-white' : 'bg-white text-[#1A1A2E]/70 border border-[#D4C5A9]/30'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003F87]"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((exp) => (
              <div key={exp.id} className="bg-white rounded-2xl overflow-hidden border border-[#D4C5A9]/20 shadow-sm star-pattern">
                <div className="h-32 relative overflow-hidden">
                  <img
                    src={exp.image_url || (
                      exp.category === 'Adventure' ? 'https://mgx-backend-cdn.metadl.com/generate/images/1427770/2026-07-15/sqinfaicaizq/tourism-masada-sunrise.png' :
                      exp.category === 'Food & Wine' ? 'https://mgx-backend-cdn.metadl.com/generate/images/1427770/2026-07-15/sqinetqcaiza/gastronomy-israeli-food-market.png' :
                      'https://mgx-backend-cdn.metadl.com/generate/images/1427770/2026-07-15/sqindwicai2a/hero-jerusalem-golden-hour.png'
                    )}
                    alt={exp.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-body font-semibold text-sm text-[#1A1A2E] flex-1">{exp.title}</h3>
                    <div className="flex items-center gap-0.5 ml-2">
                      <Star size={12} className="text-[#C8A96E] fill-[#C8A96E]" />
                      <span className="text-xs font-mono-data text-[#1A1A2E]">{exp.rating}</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-body px-2 py-0.5 rounded-full bg-[#003F87]/5 text-[#003F87]">{exp.category}</span>
                  <p className="text-xs font-body text-[#1A1A2E]/60 mt-2">{exp.description}</p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3 text-[10px] font-body text-[#1A1A2E]/50">
                      <span>⏱️ {exp.duration}</span>
                      {exp.provider && <span>by {exp.provider}</span>}
                    </div>
                    <span className="font-mono-data text-sm font-bold text-[#003F87]">₪{exp.price}<span className="text-[10px] font-normal text-[#1A1A2E]/50">/person</span></span>
                  </div>
                  <a
                    href={getExperienceBookingSearchUrl(exp.title, exp.provider, exp.city)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 block w-full text-center bg-[#003F87] text-white text-xs py-2.5 rounded-xl font-body font-medium active:scale-95 transition-transform"
                  >
                    Book Experience
                  </a>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">🎭</p>
                <p className="font-body text-sm text-[#1A1A2E]/50">No experiences found in this category</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}