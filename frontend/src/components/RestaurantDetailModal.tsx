import { useEffect, useState } from 'react';
import { X, Phone, MapPin, BookOpen, Star } from 'lucide-react';
import { api } from '@/lib/api';
import { getMapsDirectionsUrl, getMenuSearchUrl } from '@/lib/discoveryLinks';
import { getOpenTableUrl, isOpenTableAvailable, getOntopoUrl } from '@/lib/affiliateLinks';

interface RestaurantSummary {
  id: number;
  name: string;
  cuisine: string;
  city: string;
  certification?: string | null;
  phone?: string | null;
  address?: string | null;
}

interface TripadvisorSubrating {
  type_name: string;
  rating: number;
  count: number;
}

interface TripadvisorReview {
  rating: number;
  title: string | null;
  text: string | null;
  author: string | null;
  author_location: string | null;
  date: string | null;
  url: string | null;
}

interface TripadvisorDetail {
  available: boolean;
  name?: string;
  address?: string | null;
  phone?: string | null;
  opening_hours?: string[] | null;
  price_level?: string | null;
  rating?: number | null;
  review_count?: number | null;
  subratings?: TripadvisorSubrating[];
  url?: string | null;
  photos?: string[];
  reviews?: TripadvisorReview[];
}

/**
 * Full restaurant detail — real address/phone/hours/photos/reviews pulled
 * live from the Tripadvisor Terra API (services/tripadvisor.py), so users
 * see this inside Shalom Guide instead of bouncing to tripadvisor.com just
 * to check the address or read what people said. Only "see all reviews"
 * still links out, since we only fetch a few review snippets per restaurant
 * to stay within the API's free call budget.
 */
export default function RestaurantDetailModal({
  restaurant,
  onClose,
}: {
  restaurant: RestaurantSummary;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<TripadvisorDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getRestaurantTripadvisorDetail(restaurant.id).then((data) => {
      if (!cancelled) {
        setDetail(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [restaurant.id]);

  const phone = detail?.phone || restaurant.phone;
  const address = detail?.address || restaurant.address;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-[#FAF8F5] w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero photo */}
        <div className="relative w-full h-44 bg-gradient-to-br from-[#C8A96E]/30 to-[#003F87]/15 flex-shrink-0">
          {detail?.photos && detail.photos.length > 0 && (
            <img src={detail.photos[0]} alt={restaurant.name} className="w-full h-full object-cover" />
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center"
          >
            <X size={16} className="text-white" />
          </button>
        </div>

        <div className="p-4">
          <h2 className="font-display text-lg font-bold text-[#1A1A2E]">{restaurant.name}</h2>
          <p className="text-xs font-body text-[#1A1A2E]/50 mt-0.5">{restaurant.cuisine} • {restaurant.city}</p>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {restaurant.certification && (
              <span className="text-[10px] font-body px-2 py-0.5 rounded-full bg-[#4A7C59]/10 text-[#4A7C59] font-medium">
                {restaurant.certification}
              </span>
            )}
            {detail?.price_level && (
              <span className="text-[10px] font-body px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#D4C5A9]/30 text-[#1A1A2E]/60">
                {detail.price_level}
              </span>
            )}
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#003F87]" />
            </div>
          )}

          {!loading && detail?.available && (
            <>
              {/* Tripadvisor rating + subratings */}
              {detail.rating != null && (
                <a
                  href={detail.url ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-4 p-3 rounded-xl bg-[#34E0A1]/10 border border-[#34E0A1]/20"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🦉</span>
                    <span className="font-body font-semibold text-sm text-[#00AA6C]">
                      {detail.rating} · {detail.review_count} Tripadvisor reviews
                    </span>
                  </div>
                  {detail.subratings && detail.subratings.length > 0 && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                      {detail.subratings.map((s) => (
                        <div key={s.type_name} className="flex items-center justify-between text-[10px] font-body text-[#1A1A2E]/60">
                          <span>{s.type_name}</span>
                          <span className="font-medium flex items-center gap-0.5">
                            <Star size={9} className="fill-[#C8A96E] text-[#C8A96E]" /> {s.rating}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </a>
              )}

              {/* Opening hours */}
              {detail.opening_hours && detail.opening_hours.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] font-body font-semibold text-[#1A1A2E]/50 uppercase tracking-wide">Hours</p>
                  {detail.opening_hours.map((line) => (
                    <p key={line} className="text-xs font-body text-[#1A1A2E]/70 mt-0.5">{line}</p>
                  ))}
                </div>
              )}

              {/* Reviews */}
              {detail.reviews && detail.reviews.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] font-body font-semibold text-[#1A1A2E]/50 uppercase tracking-wide mb-2">
                    What travelers say
                  </p>
                  <div className="space-y-2">
                    {detail.reviews.map((r, i) => (
                      <a
                        key={i}
                        href={r.url ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 rounded-xl bg-white border border-[#D4C5A9]/20"
                      >
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star
                              key={idx}
                              size={10}
                              className={idx < r.rating ? 'fill-[#C8A96E] text-[#C8A96E]' : 'text-[#D4C5A9]/40'}
                            />
                          ))}
                        </div>
                        {r.title && <p className="text-xs font-body font-semibold text-[#1A1A2E] mt-1">{r.title}</p>}
                        {r.text && <p className="text-[11px] font-body text-[#1A1A2E]/60 mt-0.5 line-clamp-3">{r.text}</p>}
                        <p className="text-[9px] font-body text-[#1A1A2E]/40 mt-1">
                          {r.author}{r.author_location ? ` · ${r.author_location}` : ''}
                        </p>
                      </a>
                    ))}
                  </div>
                  {detail.url && (
                    <a
                      href={detail.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-[11px] font-body text-[#00AA6C] font-medium mt-2"
                    >
                      🦉 See all reviews on Tripadvisor
                    </a>
                  )}
                </div>
              )}
            </>
          )}

          {!loading && !detail?.available && (
            <p className="text-xs font-body text-[#1A1A2E]/40 mt-4">
              No Tripadvisor data found for this restaurant yet.
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-[#D4C5A9]/20">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex-1 flex items-center justify-center gap-1 text-[11px] font-body font-medium text-[#003F87] py-2 rounded-lg bg-[#003F87]/5"
              >
                <Phone size={12} /> Call
              </a>
            )}
            <a
              href={getMapsDirectionsUrl(address || `${restaurant.name}, ${restaurant.city}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1 text-[11px] font-body font-medium text-[#003F87] py-2 rounded-lg bg-[#003F87]/5"
            >
              <MapPin size={12} /> Directions
            </a>
            <a
              href={getMenuSearchUrl(restaurant.name, restaurant.city)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1 text-[11px] font-body font-medium text-[#003F87] py-2 rounded-lg bg-[#003F87]/5"
            >
              <BookOpen size={12} /> Menu
            </a>
          </div>

          {address && <p className="text-[10px] font-body text-[#1A1A2E]/40 mt-2 text-center">{address}</p>}

          <div className="flex gap-2 mt-2">
            <a
              href={getOntopoUrl(restaurant.city)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1 text-[11px] font-body font-semibold text-white py-2 rounded-lg bg-[#4A7C59]"
            >
              Reserve on Ontopo
            </a>
            {isOpenTableAvailable(restaurant.city) && (
              <a
                href={getOpenTableUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1 text-[11px] font-body font-semibold text-white py-2 rounded-lg bg-[#DA3743]"
              >
                Reserve on OpenTable
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
