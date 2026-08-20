import { useState, useEffect, ReactNode } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, MapPin, Ticket, BookOpen, Bookmark, Headphones, Accessibility } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { getTicketUrl, getSiteInfoUrl, getMapsDirectionsUrl } from '@/lib/discoveryLinks';
import { canEmbedArbitraryUrl } from '@/lib/affiliateLinks';
import ExternalWebview from '@/components/ExternalWebview';

const categories = ['🏛️ Museums', '🏺 Archaeology', '⛪ Holy Sites', '🌊 Nature & Parks', '🎭 Entertainment'];
const featuredCarousel = ['Western Wall, Jerusalem', 'Masada Fortress', 'Sea of Galilee', 'Bahai Gardens, Haifa', 'Dead Sea'];

interface TouristSite {
  id: number;
  name: string;
  category: string;
  city: string;
  region: string;
  hours: string;
  price: number;
  description: string;
  audio_guide: boolean;
  accessible: boolean;
  faith: string;
  dress_code: string;
  difficulty: string;
  duration: string;
  highlights: string;
  unesco: boolean;
}

/**
 * A ticket/info link that opens in the in-app webview when the destination
 * allows itself to be embedded (most official site/park/museum pages do),
 * or a real new tab — clearly marked "↗" — for the ones that don't (mainly
 * Google-search fallbacks for sites without a confirmed official page).
 */
function SiteLink({
  href,
  onEmbed,
  className,
  children,
}: {
  href: string;
  onEmbed: (url: string) => void;
  className: string;
  children: ReactNode;
}) {
  if (canEmbedArbitraryUrl(href)) {
    return (
      <button onClick={() => onEmbed(href)} className={className}>
        {children}
      </button>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children} ↗
    </a>
  );
}

export default function Tourism() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(0);
  const [sites, setSites] = useState<TouristSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [webview, setWebview] = useState<{ url: string; label: string } | null>(null);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    setLoading(true);
    try {
      const data = await api.getTouristSites();
      setSites(data);
    } catch (error) {
      console.error('Failed to load tourist sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const museums = sites.filter(s => s.category === 'museum');
  const holySites = sites.filter(s => s.category === 'holy_site');
  const parks = sites.filter(s => s.category === 'park');
  const archaeology = parks.filter(p => p.highlights.includes('archaeology'));

  return (
    <AppLayout>
      <div className="px-4 py-3">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/home')} className="p-1.5 rounded-lg hover:bg-white">
            <ArrowLeft size={20} className="text-[#1A1A2E]" />
          </button>
          <h1 className="font-display text-xl font-bold text-[#1A1A2E]">Discover Israel</h1>
        </div>

        {/* Featured Carousel */}
        <div className="flex gap-3 overflow-x-auto hide-scrollbar mb-4 -mx-4 px-4">
          {featuredCarousel.map((place, i) => (
            <div key={place} className="flex-shrink-0 w-56 h-28 rounded-2xl p-4 flex items-end shadow-md relative overflow-hidden">
              <img
                src={i === 0 ? 'https://mgx-backend-cdn.metadl.com/generate/images/1427770/2026-07-15/sqindwicai2a/hero-jerusalem-golden-hour.png' :
                     i === 3 ? 'https://mgx-backend-cdn.metadl.com/generate/images/1427770/2026-07-15/sqinfaicaizq/tourism-masada-sunrise.png' :
                     i === 4 ? 'https://mgx-backend-cdn.metadl.com/generate/images/1427770/2026-07-15/sqineeycaiyq/featured-dead-sea-sunrise.png' :
                     ''}
                alt={place}
                className={`absolute inset-0 w-full h-full object-cover ${i === 1 || i === 2 ? 'hidden' : ''}`}
              />
              <div className={`absolute inset-0 ${i === 1 || i === 2 ? 'bg-gradient-to-br from-[#003F87]/80 to-[#003F87]/40' : 'bg-gradient-to-t from-black/60 to-transparent'}`} />
              <p className="text-white font-body font-semibold text-sm relative z-10">{place}</p>
            </div>
          ))}
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4">
          {categories.map((cat, i) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(i)}
              className={`flex-shrink-0 px-3 py-2 rounded-full text-xs font-body font-medium transition-colors ${
                activeCategory === i
                  ? 'bg-[#003F87] text-white'
                  : 'bg-white text-[#1A1A2E]/70 border border-[#D4C5A9]/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003F87]"></div>
          </div>
        ) : (
          <>
            {/* Museums */}
            {activeCategory === 0 && (
              <div className="space-y-3">
                {museums.map((museum) => (
                  <div key={museum.id} className="bg-white rounded-2xl p-4 border border-[#D4C5A9]/20 shadow-sm star-pattern">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-body font-semibold text-sm text-[#1A1A2E]">{museum.name}</h3>
                        <p className="text-[10px] font-body text-[#1A1A2E]/50 flex items-center gap-1">
                          <MapPin size={10} /> {museum.city}
                        </p>
                      </div>
                      <Bookmark size={16} className="text-[#D4C5A9]" />
                    </div>
                    <p className="text-xs font-body text-[#1A1A2E]/60 mb-2">{museum.description}</p>
                    <div className="flex items-center gap-3 text-[10px] font-body text-[#1A1A2E]/50 mb-3">
                      <span>🕐 {museum.hours}</span>
                      <span className="font-mono-data">{museum.price > 0 ? `₪${museum.price}` : 'Free'}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      {museum.audio_guide && (
                        <span className="flex items-center gap-1 text-[9px] font-body px-2 py-0.5 rounded-full bg-[#003F87]/5 text-[#003F87]">
                          <Headphones size={10} /> Audio guide
                        </span>
                      )}
                      {museum.accessible && (
                        <span className="flex items-center gap-1 text-[9px] font-body px-2 py-0.5 rounded-full bg-[#4A7C59]/10 text-[#4A7C59]">
                          <Accessibility size={10} /> Accessible
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <SiteLink
                        href={getTicketUrl(museum.name)}
                        onEmbed={(url) => setWebview({ url, label: museum.name })}
                        className="flex-1 bg-[#003F87] text-white text-xs py-2 rounded-xl font-body font-medium flex items-center justify-center gap-1"
                      >
                        <Ticket size={12} /> Buy Tickets
                      </SiteLink>
                      <SiteLink
                        href={getSiteInfoUrl(museum.name)}
                        onEmbed={(url) => setWebview({ url, label: museum.name })}
                        className="flex-1 bg-[#003F87]/5 text-[#003F87] text-xs py-2 rounded-xl font-body font-medium flex items-center justify-center gap-1"
                      >
                        <BookOpen size={12} /> Learn More
                      </SiteLink>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Holy Sites */}
            {activeCategory === 2 && (
              <div className="space-y-3">
                {holySites.map((site) => (
                  <div key={site.id} className="bg-white rounded-2xl p-4 border border-[#D4C5A9]/20 shadow-sm star-pattern">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-body font-semibold text-sm text-[#1A1A2E]">{site.name}</h3>
                        <p className="text-[10px] font-body text-[#1A1A2E]/50">{site.city} • {site.faith}</p>
                      </div>
                      <span className="text-[9px] font-body px-2 py-0.5 rounded-full bg-[#C8A96E]/10 text-[#C8A96E] font-medium">
                        {site.faith}
                      </span>
                    </div>
                    <p className="text-xs font-body text-[#1A1A2E]/60 mb-2">{site.description}</p>
                    <div className="text-xs font-body text-[#1A1A2E]/60 space-y-1 mb-3">
                      <p>🕐 {site.hours}</p>
                      {site.dress_code && <p>👔 {site.dress_code}</p>}
                      <p className="font-mono-data">{site.price === 0 ? 'Free entry' : `₪${site.price}`}</p>
                    </div>
                    <a
                      href={getMapsDirectionsUrl(`${site.name}, ${site.city}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-[#003F87]/5 text-[#003F87] text-xs py-2 rounded-xl font-body font-medium flex items-center justify-center gap-1"
                    >
                      <MapPin size={12} /> Navigate
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* Nature & Parks */}
            {activeCategory === 3 && (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-1">
                  <p className="text-xs font-body text-amber-700">⚠️ Some trails close in summer (heat). Check parks.org.il for closures before visiting.</p>
                </div>

                <div className="bg-[#4A7C59]/5 border border-[#4A7C59]/20 rounded-xl p-3 mb-1">
                  <p className="text-xs font-body text-[#4A7C59] font-medium">🎟️ National Parks Pass</p>
                  <p className="text-[10px] font-body text-[#1A1A2E]/60 mt-1">2-Week Pass (₪110 adult) grants unlimited entry to 80+ parks. Available at first park or via parks.org.il</p>
                </div>

                {parks.map((park) => (
                  <div key={park.id} className="bg-white rounded-2xl p-4 border border-[#D4C5A9]/20 shadow-sm star-pattern">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-body font-semibold text-sm text-[#1A1A2E]">{park.name}</h3>
                        <p className="text-[10px] font-body text-[#1A1A2E]/50">{park.region} • Park</p>
                      </div>
                      <div className="flex gap-1">
                        {park.unesco && (
                          <span className="text-[9px] font-body px-1.5 py-0.5 rounded-full bg-[#C8A96E]/10 text-[#C8A96E] font-medium">UNESCO</span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs font-body text-[#1A1A2E]/60 mb-2">{park.description}</p>

                    <div className="flex items-center gap-3 text-[10px] font-body text-[#1A1A2E]/50 mb-2">
                      {park.difficulty && (
                        <span className={`px-1.5 py-0.5 rounded-full ${
                          park.difficulty === 'Easy' ? 'bg-green-50 text-green-600' :
                          park.difficulty === 'Moderate' ? 'bg-amber-50 text-amber-600' :
                          'bg-red-50 text-red-600'
                        }`}>{park.difficulty}</span>
                      )}
                      {park.duration && <span>⏱️ {park.duration}</span>}
                      <span className="font-mono-data">₪{park.price}</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {park.highlights && park.highlights.split(',').map((tag) => (
                        <span key={tag} className="text-[9px] font-body px-1.5 py-0.5 rounded-full bg-[#FAF8F5] text-[#1A1A2E]/50">
                          #{tag.trim()}
                        </span>
                      ))}
                      {park.accessible && (
                        <span className="text-[9px] font-body px-1.5 py-0.5 rounded-full bg-[#4A7C59]/10 text-[#4A7C59]">♿ Accessible</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <SiteLink
                        href={getTicketUrl(park.name)}
                        onEmbed={(url) => setWebview({ url, label: park.name })}
                        className="flex-1 bg-[#003F87] text-white text-[10px] py-2 rounded-xl font-body font-medium text-center"
                      >
                        🎟️ Buy Tickets
                      </SiteLink>
                      <SiteLink
                        href={getTicketUrl(park.name)}
                        onEmbed={(url) => setWebview({ url, label: park.name })}
                        className="flex-1 bg-[#003F87]/5 text-[#003F87] text-[10px] py-2 rounded-xl font-body font-medium text-center"
                      >
                        🗺️ Trails
                      </SiteLink>
                      <SiteLink
                        href={getSiteInfoUrl(park.name)}
                        onEmbed={(url) => setWebview({ url, label: park.name })}
                        className="flex-1 bg-[#003F87]/5 text-[#003F87] text-[10px] py-2 rounded-xl font-body font-medium text-center"
                      >
                        📚 History
                      </SiteLink>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Archaeology */}
            {activeCategory === 1 && (
              <div className="space-y-3">
                {archaeology.map((site) => (
                  <div key={site.id} className="bg-white rounded-2xl p-4 border border-[#D4C5A9]/20 shadow-sm star-pattern">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-body font-semibold text-sm text-[#1A1A2E]">{site.name}</h3>
                        <p className="text-[10px] font-body text-[#1A1A2E]/50">{site.region}</p>
                      </div>
                      {site.unesco && (
                        <span className="text-[9px] font-body px-1.5 py-0.5 rounded-full bg-[#C8A96E]/10 text-[#C8A96E] font-medium">UNESCO</span>
                      )}
                    </div>
                    <p className="text-xs font-body text-[#1A1A2E]/60 mb-2">{site.description}</p>
                    <div className="flex items-center gap-2 text-[10px] font-body text-[#1A1A2E]/50 mb-3">
                      {site.duration && <span>⏱️ {site.duration}</span>}
                      <span className="font-mono-data">₪{site.price}</span>
                    </div>
                    <SiteLink
                      href={getSiteInfoUrl(site.name)}
                      onEmbed={(url) => setWebview({ url, label: site.name })}
                      className="w-full bg-[#003F87]/5 text-[#003F87] text-xs py-2 rounded-xl font-body font-medium flex items-center justify-center gap-1"
                    >
                      <BookOpen size={12} /> Learn More
                    </SiteLink>
                  </div>
                ))}
              </div>
            )}

            {/* Entertainment placeholder */}
            {activeCategory === 4 && (
              <div className="text-center py-12">
                <span className="text-4xl mb-3 block">🎭</span>
                <p className="font-body text-sm text-[#1A1A2E]/50">Entertainment listings coming soon</p>
              </div>
            )}
          </>
        )}
      </div>

      {webview && (
        <ExternalWebview
          url={webview.url}
          label={webview.label}
          color="#003F87"
          onClose={() => setWebview(null)}
        />
      )}
    </AppLayout>
  );
}