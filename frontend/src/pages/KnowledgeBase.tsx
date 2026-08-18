import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, Search, BookOpen, Bookmark, Share2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { getArtsAndCultureUrl } from '@/lib/discoveryLinks';
import { isFavorited, toggleFavorite, shareOrCopyLink } from '@/lib/savedItems';

// Emoji per real article category (backend/mock_data/knowledge_articles.json).
// The original hardcoded list here (Archaeology, Judaism, Christianity, Islam...)
// didn't match any actual article category, so every filter click emptied the
// list. Categories are now derived from the loaded articles instead.
const CATEGORY_ICONS: Record<string, string> = {
  History: '🕰️',
  Culture: '🎎',
  Food: '🍽️',
  Nature: '🌿',
  Transport: '🚌',
  Safety: '🛡️',
  Architecture: '🏛️',
};

const artifacts = [
  { name: 'Bronze Age Canaanite Oil Lamp', period: '1500 BCE', museum: 'Israel Museum' },
  { name: 'Dead Sea Scroll Fragment', period: '150 BCE', museum: 'Shrine of the Book' },
  { name: 'Pilate Inscription', period: '26-36 CE', museum: 'Israel Museum' },
  { name: 'Herodian Stone Vessel', period: '1st Century CE', museum: 'Rockefeller Museum' },
];

const virtualTours = [
  { name: 'Israel Museum — Virtual Tour', siteName: 'Israel Museum', duration: '45 min' },
  { name: 'Yad Vashem — Virtual Tour', siteName: 'Yad Vashem', duration: '60 min' },
  { name: 'Tel Aviv Museum of Art — Virtual Tour', siteName: 'Tel Aviv Museum of Art', duration: '30 min' },
];

interface KnowledgeArticle {
  id: number;
  title: string;
  category: string;
  content: string;
  summary: string;
  image_url: string;
  tags: string;
  read_time: number;
}

export default function KnowledgeBase() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedArticleId, setExpandedArticleId] = useState<number | null>(null);
  const [favoritedIds, setFavoritedIds] = useState<Set<number>>(new Set());
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await api.getKnowledgeArticles();
      setArticles(data);
      setFavoritedIds(new Set(data.filter((a: KnowledgeArticle) => isFavorited('article', a.id)).map((a: KnowledgeArticle) => a.id)));
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(articles.map((a) => a.category)))];

  const filteredArticles = articles.filter((a) => {
    if (activeCategory !== 'All' && a.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const haystack = `${a.title} ${a.summary} ${a.tags}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const handleToggleFavorite = (article: KnowledgeArticle) => {
    const nowFavorited = toggleFavorite('article', article.id, article.title);
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      if (nowFavorited) next.add(article.id);
      else next.delete(article.id);
      return next;
    });
  };

  return (
    <AppLayout>
      <div className="px-4 py-3">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate('/home')} className="p-1.5 rounded-lg hover:bg-white">
            <ArrowLeft size={20} className="text-[#1A1A2E]" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-[#1A1A2E]">Discover the Depth of Israel</h1>
            <p className="text-[10px] font-body text-[#1A1A2E]/50">History, archaeology, religion and culture</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl p-3 border border-[#D4C5A9]/20 shadow-sm mb-3">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-[#1A1A2E]/40" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history, sites, figures, artifacts..."
              className="flex-1 text-sm font-body outline-none bg-transparent placeholder:text-[#1A1A2E]/30"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-body font-medium transition-colors ${
                activeCategory === cat ? 'bg-[#C8A96E] text-white' : 'bg-white text-[#1A1A2E]/70 border border-[#D4C5A9]/30'
              }`}
            >
              {CATEGORY_ICONS[cat] ? `${CATEGORY_ICONS[cat]} ` : ''}{cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003F87]"></div>
          </div>
        ) : (
          <>
            {/* Featured Articles */}
            <div className="mb-4">
              <h3 className="font-display text-base font-semibold text-[#1A1A2E] mb-3">Deep Dive</h3>
              <div className="space-y-3">
                {filteredArticles.map((article) => (
                  <div key={article.id} className="bg-white rounded-2xl p-4 border border-[#D4C5A9]/20 shadow-sm star-pattern">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-[9px] font-body px-2 py-0.5 rounded-full bg-[#C8A96E]/10 text-[#C8A96E] font-medium">
                        {article.category}
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => handleToggleFavorite(article)}>
                          <Bookmark
                            size={14}
                            className={favoritedIds.has(article.id) ? 'text-[#C8A96E] fill-[#C8A96E]' : 'text-[#D4C5A9]'}
                          />
                        </button>
                        <button onClick={() => shareOrCopyLink(article.title, window.location.href)}>
                          <Share2 size={14} className="text-[#D4C5A9]" />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-display text-sm font-semibold text-[#1A1A2E] mb-1 leading-tight">{article.title}</h4>
                    <p className="text-xs font-body text-[#1A1A2E]/60 mb-2">{article.summary}</p>
                    <div className="flex items-center gap-2 text-[10px] font-body text-[#1A1A2E]/50">
                      <span>{article.category}</span>
                      <span>•</span>
                      <span>{article.read_time} min read</span>
                    </div>
                    {article.tags && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {article.tags.split(',').map((tag) => (
                          <span key={tag} className="text-[9px] font-body px-1.5 py-0.5 rounded-full bg-[#FAF8F5] text-[#1A1A2E]/50">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-xs">🇺🇸</span>
                      <span className="text-xs">🇧🇷</span>
                      <span className="text-xs">🇪🇸</span>
                      <span className="text-xs">🇷🇺</span>
                      <span className="text-xs">🇫🇷</span>
                    </div>
                    {expandedArticleId === article.id && (
                      <p className="text-xs font-body text-[#1A1A2E]/70 mt-3 pt-3 border-t border-[#D4C5A9]/10 leading-relaxed">
                        {article.content}
                      </p>
                    )}
                    <button
                      onClick={() => setExpandedArticleId((prev) => (prev === article.id ? null : article.id))}
                      className="mt-3 w-full bg-[#003F87]/5 text-[#003F87] text-xs py-2 rounded-xl font-body font-medium flex items-center justify-center gap-1"
                    >
                      <BookOpen size={12} /> {expandedArticleId === article.id ? 'Hide Article' : 'Read Article'}
                    </button>
                  </div>
                ))}

                {filteredArticles.length === 0 && (
                  <div className="text-center py-8">
                    <p className="font-body text-sm text-[#1A1A2E]/50">No articles match your search</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Artifact Viewer */}
        <div className="mb-4">
          <h3 className="font-display text-base font-semibold text-[#1A1A2E] mb-3">Virtual Artifact Room</h3>
          <div className="grid grid-cols-2 gap-2">
            {artifacts.map((artifact) => (
              <div key={artifact.name} className="bg-white rounded-xl p-3 border border-[#C8A96E]/20 shadow-sm">
                <div className="w-full h-20 bg-gradient-to-br from-[#C8A96E]/10 to-[#003F87]/5 rounded-lg mb-2 border border-[#C8A96E]/10" />
                <p className="text-[10px] font-body font-semibold text-[#1A1A2E] leading-tight">{artifact.name}</p>
                <p className="text-[9px] font-mono-data text-[#1A1A2E]/40 mt-0.5">{artifact.period}</p>
                <p className="text-[9px] font-body text-[#C8A96E] mt-0.5">{artifact.museum}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Virtual Tours */}
        <div className="mb-4">
          <h3 className="font-display text-base font-semibold text-[#1A1A2E] mb-3">Virtual Museum Tours</h3>
          <div className="space-y-2">
            {virtualTours.map((tour) => (
              <div key={tour.name} className="bg-white rounded-xl p-3 border border-[#D4C5A9]/20 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-body font-medium text-[#1A1A2E]">{tour.name}</p>
                  <p className="text-[10px] font-body text-[#1A1A2E]/50">{tour.duration}</p>
                </div>
                <a
                  href={getArtsAndCultureUrl(tour.siteName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-[#003F87]/5 rounded-lg"
                >
                  <ExternalLink size={14} className="text-[#003F87]" />
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Knowledge Sources */}
        <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#D4C5A9]/20">
          <h3 className="font-body font-semibold text-xs text-[#1A1A2E] mb-2">Knowledge Sources</h3>
          <div className="space-y-1 text-[10px] font-body text-[#1A1A2E]/60">
            <p>📖 Wikipedia & Wikivoyage</p>
            <p>🏛️ Israel Antiquities Authority</p>
            <p>🖼️ Israel Museum Digital Collection</p>
            <p>🌍 Europeana Cultural Heritage</p>
            <p>🎨 Google Arts & Culture</p>
            <p>📚 World History Encyclopedia</p>
            <p>🕍 Yad Vashem Digital Archive</p>
            <p>📜 National Library of Israel</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}