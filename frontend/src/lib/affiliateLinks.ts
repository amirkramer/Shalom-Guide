// Hotel search deep-links for Booking.com, Expedia, and Trivago.
//
// Booking.com uses a simple, documented query param (`aid`) for affiliate tracking,
// so we can always build a working tracked link from just the affiliate ID.
//
// Expedia and Trivago route affiliate tracking through third-party networks
// (CJ Affiliate for Expedia; Awin/Travelpayouts/Involve Asia for Trivago) that
// generate an opaque wrapper link per destination URL. We can't safely fabricate
// that wrapper — a guessed format would silently break commission tracking — so
// instead we read an optional template from env with a `{TARGET_URL}` placeholder.
// Until that's configured, the buttons still work, just without tracking.

export type HotelProvider = 'booking' | 'expedia' | 'trivago';

const BOOKING_AID = import.meta.env.VITE_BOOKING_AFFILIATE_ID || '2311236'; // placeholder until real ID is set
const EXPEDIA_LINK_TEMPLATE = import.meta.env.VITE_EXPEDIA_AFFILIATE_LINK_TEMPLATE || '';
const TRIVAGO_LINK_TEMPLATE = import.meta.env.VITE_TRIVAGO_AFFILIATE_LINK_TEMPLATE || '';

/** Wrap a native destination URL with a network deep-link template, if configured. */
function applyTemplate(template: string, targetUrl: string): string {
  if (!template) return targetUrl;
  if (template.includes('{TARGET_URL}')) {
    return template.replace('{TARGET_URL}', encodeURIComponent(targetUrl));
  }
  // No placeholder provided: assume the template is a static campaign link that
  // itself points at a search page, used as-is.
  return template;
}

/** Booking.com hotel page or search results, with affiliate id applied. */
export function getBookingUrl(hotelIdOrCity: string): string {
  const isHotelId = hotelIdOrCity.includes('-');
  return isHotelId
    ? `https://www.booking.com/hotel/il/${hotelIdOrCity}.html?aid=${BOOKING_AID}`
    : `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotelIdOrCity + ', Israel')}&aid=${BOOKING_AID}`;
}

/** Expedia hotel search results for a city, with affiliate wrapper applied if configured. */
export function getExpediaUrl(city: string): string {
  const nativeUrl = `https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(city + ', Israel')}`;
  return applyTemplate(EXPEDIA_LINK_TEMPLATE, nativeUrl);
}

/**
 * Trivago hotel search results for a city, with affiliate wrapper applied if configured.
 *
 * Note: trivago's results pages key off internal numeric location codes
 * (e.g. `srl/hotels-london-united-kingdom?search=200-17399`), which aren't
 * derivable from a city name alone. This uses trivago's free-text search
 * entry point, which is less precise than a resolved deep link — once a real
 * affiliate deep link is generated in Awin/Travelpayouts, prefer that.
 */
export function getTrivagoUrl(city: string): string {
  const nativeUrl = `https://www.trivago.com/en-US/srl?search=${encodeURIComponent(city + ', Israel')}`;
  return applyTemplate(TRIVAGO_LINK_TEMPLATE, nativeUrl);
}

export function getProviderUrl(provider: HotelProvider, hotelIdOrCity: string): string {
  switch (provider) {
    case 'booking':
      return getBookingUrl(hotelIdOrCity);
    case 'expedia':
      return getExpediaUrl(hotelIdOrCity);
    case 'trivago':
      return getTrivagoUrl(hotelIdOrCity);
  }
}

/**
 * Whether a destination's own site allows itself to be shown in an iframe
 * (checked live: booking.com renders normally embedded; expedia.com and
 * trivago.com both send security headers that make the browser refuse and
 * show a blank frame instead — confirmed by actually opening each one in the
 * in-app webview, not just reading docs). Sites we couldn't confirm either
 * way default to `false` so we never trap a user on a blank screen — they get
 * the real external tab instead, which always works.
 *
 * If Expedia/trivago/OpenTable change their embedding policy later, flipping
 * these to `true` is all that's needed to try the in-app webview for them too.
 */
const IFRAME_EMBEDDABLE: Record<string, boolean> = {
  booking: true,
  expedia: false,
  trivago: false,
  discovercars: true, // CSP frame-ancestors on discovercars.com permits any origin
  ontopo: true, // no framing-restriction headers found
  opentable: false, // unconfirmed — default to a real new tab
};

export function canEmbedInIframe(destination: keyof typeof IFRAME_EMBEDDABLE): boolean {
  return IFRAME_EMBEDDABLE[destination] ?? false;
}

/**
 * For arbitrary third-party URLs (a restaurant's own website, pulled from
 * Tripadvisor — could be anything) rather than our fixed list of known
 * providers above: major platforms are confirmed (via response headers) to
 * always refuse framing — Google search sends `X-Frame-Options: SAMEORIGIN`,
 * Facebook/Instagram send `frame-ancestors 'self'` — so trying to embed a
 * link on one of these domains would just be another blank screen like
 * Expedia/trivago were before that got fixed. Independent small-business
 * sites (the common case for a restaurant's own site) essentially never set
 * these headers, so those are worth trying in the in-app webview.
 */
const KNOWN_FRAME_BLOCKING_HOSTS = [
  'google.com',
  'facebook.com',
  'fb.com',
  'instagram.com',
  'twitter.com',
  'x.com',
  'tiktok.com',
  'linkedin.com',
];

export function canEmbedArbitraryUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\.|^m\./, '');
    return !KNOWN_FRAME_BLOCKING_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
  } catch {
    return false;
  }
}

export const PROVIDER_LABELS: Record<HotelProvider, string> = {
  booking: 'Booking.com',
  expedia: 'Expedia',
  trivago: 'trivago',
};

export const PROVIDER_COLORS: Record<HotelProvider, string> = {
  booking: '#003580',
  expedia: '#191E3B',
  trivago: '#C3170D',
};

const KNOWN_PLACEHOLDER_BOOKING_AID = '2311236';

/** Whether this provider's link is actually earning commission (real credentials set). */
export function isProviderTracked(provider: HotelProvider): boolean {
  switch (provider) {
    case 'booking':
      return BOOKING_AID !== KNOWN_PLACEHOLDER_BOOKING_AID;
    case 'expedia':
      return Boolean(EXPEDIA_LINK_TEMPLATE);
    case 'trivago':
      return Boolean(TRIVAGO_LINK_TEMPLATE);
  }
}

// --- Car rental (Discover Cars) --------------------------------------------
//
// Discover Cars doesn't use a simple query-param affiliate id either — their
// dashboard generates a per-link "unique tracking code" (text link / banner /
// widget), same situation as Expedia/trivago above. Same fix: an optional
// env template with a `{TARGET_URL}` placeholder wrapping the native URL.

const DISCOVER_CARS_LINK_TEMPLATE = import.meta.env.VITE_DISCOVER_CARS_AFFILIATE_LINK_TEMPLATE || '';

/** Discover Cars search for Israel (confirmed real page: discovercars.com/israel). */
export function getDiscoverCarsUrl(): string {
  return applyTemplate(DISCOVER_CARS_LINK_TEMPLATE, 'https://www.discovercars.com/israel');
}

export function isDiscoverCarsTracked(): boolean {
  return Boolean(DISCOVER_CARS_LINK_TEMPLATE);
}

// --- Restaurant reservations (OpenTable + Ontopo) ---------------------------
//
// TheFork doesn't operate in Israel at all (verified live: not in their list of
// 22 countries, no Israel restaurants). Two real alternatives, each partial:
//
// - OpenTable: real booking flow, but (verified live) only has Tel Aviv
//   coverage in Israel — Jerusalem returns a 404. Has a real affiliate program
//   (commission on seated diners) via CJ Affiliate — the same network already
//   used for Expedia — approval is case-by-case. Same {TARGET_URL} template
//   pattern as Expedia/trivago/Discover Cars.
// - Ontopo: Israeli platform with real nationwide coverage (confirmed Tel Aviv,
//   Jerusalem, and most other cities), but their business model is paid
//   restaurant promotion, not per-booking commission — no affiliate program
//   exists to plug in. Always untracked, used as the reliable fallback.

const OPENTABLE_LINK_TEMPLATE = import.meta.env.VITE_OPENTABLE_AFFILIATE_LINK_TEMPLATE || '';

/** OpenTable only has confirmed Israel coverage for Tel Aviv. */
export function isOpenTableAvailable(city: string): boolean {
  return city.trim().toLowerCase() === 'tel aviv';
}

export function getOpenTableUrl(): string {
  return applyTemplate(OPENTABLE_LINK_TEMPLATE, 'https://www.opentable.com/israel/tel-aviv');
}

export function isOpenTableTracked(): boolean {
  return Boolean(OPENTABLE_LINK_TEMPLATE);
}

/**
 * Ontopo city/region slugs, confirmed live from their own site footer
 * (ontopo.com/en/il) — covers every region they list. Cities in this app's
 * mock data that aren't their own dedicated page fall back to the closest
 * listed region (Jaffa -> Tel Aviv metro; Akko -> "The North" region).
 */
const ONTOPO_CITY_SLUGS: Record<string, string> = {
  'tel aviv': 'tel-aviv',
  jaffa: 'tel-aviv',
  jerusalem: 'jerusalem',
  akko: 'the_north',
  haifa: 'haifa',
  eilat: 'eilat',
  netanya: 'natanya',
  ashdod: 'ashdod',
  ashkelon: 'ashkelon',
  'beer sheva': 'beer-sheva',
  "be'er sheva": 'beer-sheva',
  herzliya: 'herzeliya',
  'kfar saba': 'kfar_saba',
  'petah tikva': 'petah_tikva',
  "ra'anana": 'raanana',
  raanana: 'raanana',
  'ramat gan': 'ramatgan',
  rehovot: 'rehovot',
  'rishon lezion': 'rishon_lezion',
  caesarea: 'caesarya',
  modiin: 'modiin',
  "modi'in": 'modiin',
};

/** Ontopo restaurant search — real nationwide coverage, no commission available. */
export function getOntopoUrl(city: string): string {
  const slug = ONTOPO_CITY_SLUGS[city.trim().toLowerCase()];
  return slug ? `https://ontopo.com/en/il/${slug}` : 'https://ontopo.com/en/il';
}

// --- Shopping brands (Awin) --------------------------------------------------
//
// Awin's deep-link format is publicly documented and stable (unlike Discover
// Cars/Expedia/trivago's opaque dashboard links), so we can build it directly:
// https://www.awin1.com/cread.php?awinmid=<advertiser id>&awinaffid=<publisher id>&ued=<encoded target url>
//
// awinaffid is one fixed value (your publisher account id). awinmid is
// per-advertiser and only exists for brands that actually have a live Awin
// program — there's no way to know that from outside their advertiser
// directory, so it's a lookup filled in brand-by-brand as you confirm them
// there. Brands not in the map fall back to their plain website_url,
// untracked.

const AWIN_PUBLISHER_ID = import.meta.env.VITE_AWIN_PUBLISHER_ID || '';

/**
 * Confirmed Awin advertiser (merchant) IDs, keyed by this app's brand `slug`
 * (backend/mock_data/shopping_brands.json). Add an entry here once you find
 * the brand in Awin's advertiser directory and note its Advertiser/Merchant ID.
 */
const AWIN_MERCHANT_IDS: Record<string, string> = {
  // ahava: '12345',
};

export function isAwinConfigured(): boolean {
  return Boolean(AWIN_PUBLISHER_ID);
}

export function hasAwinProgram(brandSlug: string): boolean {
  return brandSlug in AWIN_MERCHANT_IDS;
}

/**
 * Awin-tracked link for a brand's website if it has a confirmed program;
 * otherwise the plain website URL, untracked.
 */
export function getBrandUrl(brandSlug: string, websiteUrl: string): string {
  const merchantId = AWIN_MERCHANT_IDS[brandSlug];
  if (!merchantId || !AWIN_PUBLISHER_ID) return websiteUrl;
  const params = new URLSearchParams({
    awinmid: merchantId,
    awinaffid: AWIN_PUBLISHER_ID,
    ued: websiteUrl,
  });
  return `https://www.awin1.com/cread.php?${params.toString()}`;
}
