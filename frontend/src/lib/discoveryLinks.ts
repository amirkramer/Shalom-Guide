// Outbound "discovery" links for transport and tourism/culture features:
// Moovit, Gett, Google Arts & Culture, Google Maps, and the Israel Nature and
// Parks Authority (parks.org.il).
//
// Unlike Booking.com/Expedia/trivago, none of these have a self-serve affiliate
// program with a simple tracked-link format, so these are plain deep-links —
// no commission tracking involved.

/**
 * Moovit's real Israel trip planner (verified by walking the actual site: the
 * documented format at moovit.com/developers/links/ is stale — that whole
 * domain is now Moovit's B2B/corporate site, not the consumer product.
 * The live consumer app is at moovitapp.com, and selecting "Israel" there
 * lands on https://moovitapp.com/israel-1 with a ready Start/End search box.
 *
 * Pre-filling an exact destination isn't reliably possible from just a city
 * name: a real search resolves through their autocomplete to a URL like
 * `/tripplan/israel-1/poi/<place>/t/en?tll=<lat>_<lon>&metroSeoName=Israel`,
 * which needs a resolved place + coordinates we don't have. So this returns
 * the Israel trip-planner home — the user fills in Start/End there directly.
 */
export function getMoovitUrl(_destinationCity?: string): string {
  return 'https://moovitapp.com/israel-1';
}

/**
 * Gett has no web ordering flow at all for Israel — gett.com/il (verified live)
 * is a pure marketing/business site with no booking form; ride requests only
 * happen inside their mobile app. So "open Gett" can only mean "get the app".
 */
export function getGettAppLinks(): { android: string; ios: string } {
  return {
    android: 'https://play.google.com/store/apps/details?id=com.gettaxi.android',
    ios: 'https://apps.apple.com/il/app/gett-taxi/id412802326',
  };
}

/** Google Arts & Culture search for a museum/site name (virtual exhibits, not ticketing). */
export function getArtsAndCultureUrl(query: string): string {
  return `https://artsandculture.google.com/search?q=${encodeURIComponent(query)}`;
}

/**
 * Best-effort "buy tickets" pointer for sites we don't have a confirmed official
 * URL for — a plain web search rather than a fabricated link.
 */
export function getTicketSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query + ' tickets')}`;
}

/**
 * Israel Nature and Parks Authority (parks.org.il) search for a park/reserve name.
 * Fallback for parks not in KNOWN_SITE_LINKS below.
 */
export function getParksAuthorityUrl(query: string): string {
  return `https://en.parks.org.il/?s=${encodeURIComponent(query)}`;
}

/**
 * Real, verified official sites for the mock experience providers where one
 * exists and is confirmed to actually be that specific business (checked
 * individually, not guessed). Most of the mock provider names in
 * experiences.json ("TLV Art Tours", "Desert Eco Tours", "Ramon Crater
 * Astronomy"...) don't correspond to a findable real company — searching for
 * them turns up other, different operators offering similar tours, and
 * linking those in as if they were the named provider would misattribute a
 * business we didn't actually verify. Only add an entry here once a real
 * site has been confirmed to be that exact provider.
 */
const EXPERIENCE_PROVIDER_LINKS: Record<string, string> = {
  'Kfar Hanokdim': 'https://www.kfarhanokdim.co.il/en/',
  'Aqua Sport Eilat': 'https://www.aqua-sport.com/',
};

/**
 * Best-effort booking search for a tour/experience — we don't have a confirmed
 * URL for each small local operator (see EXPERIENCE_PROVIDER_LINKS above for
 * the ones we do), so this is a plain web search combining the title,
 * operator, and city.
 */
export function getExperienceBookingSearchUrl(title: string, provider: string, city: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`${title} ${provider} ${city} booking`)}`;
}

/** Real provider site when confirmed, else the search fallback above. */
export function getExperienceBookingUrl(title: string, provider: string, city: string): string {
  return EXPERIENCE_PROVIDER_LINKS[provider] ?? getExperienceBookingSearchUrl(title, provider, city);
}

/**
 * Confirmed official ticket/visit pages for the specific sites in this app's
 * tourist_sites mock data (see backend/mock_data/tourist_sites.json), looked
 * up by exact site name. `tickets` is the direct booking/entry page; `info`
 * is the general visit/about page (falls back to `tickets` when there's no
 * separate one). Sites not listed here fall back to a search (see
 * getTicketUrl / getSiteInfoUrl below) — new mock sites will need an entry
 * added here to get a direct link instead of a search fallback.
 */
const KNOWN_SITE_LINKS: Record<string, { tickets: string; info?: string }> = {
  'Israel Museum': {
    tickets: 'https://www.imj.org.il/en/content/entrance-tickets',
    info: 'https://www.imj.org.il/en',
  },
  'Tel Aviv Museum of Art': {
    tickets: 'https://www.tamuseum.org.il/en/tickets-purchase/',
    info: 'https://www.tamuseum.org.il/en/visit/',
  },
  'Yad Vashem': {
    tickets: 'https://online-reservations.yadvashem.org/en/home',
    info: 'https://www.yadvashem.org/visiting/',
  },
  Masada: { tickets: 'https://en.parks.org.il/reserve-park/masada-national-park/' },
  'Ein Gedi': { tickets: 'https://en.parks.org.il/reserve-park/en-gedi-nature-reserve/' },
  Caesarea: { tickets: 'https://en.parks.org.il/reserve-park/caesarea-national-park/' },
  Banias: { tickets: 'https://en.parks.org.il/reserve-park/hermon-stream-banias-nature-reserve/' },
  'Timna Park': {
    tickets: 'https://parktimna.co.il/en/tickets/',
    info: 'https://parktimna.co.il/en/timna-park/',
  },
  // Free entry, no ticketing system — `tickets` points at the same official
  // visit-info page rather than a separate purchase flow that doesn't exist.
  'Western Wall': {
    tickets: 'https://thekotel.org/en/visitor-info/',
    info: 'https://thekotel.org/en/',
  },
  'Church of the Holy Sepulchre': {
    tickets: 'https://thechurchoftheholysepulchre.com/plan-your-visit/',
    info: 'https://thechurchoftheholysepulchre.com/',
  },
  // No single official visitor site exists (managed by the Jordanian Waqf);
  // itraveljerusalem.com is the Jerusalem Development Authority's own
  // tourism resource, the closest to an official source available.
  'Al-Aqsa Mosque': {
    tickets: 'https://www.itraveljerusalem.com/attraction/al-aqsa-mosque',
  },
  'Basilica of the Annunciation': {
    tickets: 'https://www.basilicanazareth.org',
  },
  'Bahai World Centre': {
    tickets: 'https://ganbahai.org.il/visit-us-haifa/',
  },
};

/** Direct ticket/entry link for a known site, falling back to a search when unknown. */
export function getTicketUrl(siteName: string): string {
  return KNOWN_SITE_LINKS[siteName]?.tickets ?? getTicketSearchUrl(siteName);
}

/** Direct visit/info link for a known site, falling back to Arts & Culture search when unknown. */
export function getSiteInfoUrl(siteName: string): string {
  const entry = KNOWN_SITE_LINKS[siteName];
  if (entry) return entry.info ?? entry.tickets;
  return getArtsAndCultureUrl(siteName);
}

/**
 * Best-effort restaurant menu pointer — there's no menu URL in our data, and no
 * Israel-wide source for exact menu pages, so this is a plain web search.
 */
export function getMenuSearchUrl(restaurantName: string, city: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`${restaurantName} ${city} menu`)}`;
}

/** Google Maps directions to a named place. */
export function getMapsDirectionsUrl(destination: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination + ', Israel')}`;
}

/**
 * Google Maps transit directions between an origin and destination.
 * Documented URL scheme (no API key needed):
 * https://developers.google.com/maps/documentation/urls/get-started#directions-action
 */
export function getTransitDirectionsUrl(origin: string, destination: string): string {
  const params = new URLSearchParams({
    api: '1',
    origin: `${origin}, Israel`,
    destination: `${destination}, Israel`,
    travelmode: 'transit',
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Open a URL in a new tab, safely (no window.opener access). */
export function openExternal(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}
