// Lightweight client-side "saved/favorited" and "itinerary" state, stored in
// localStorage. There's no login flow wired up yet (OIDC auth is pending), so
// this can't be tied to a real user account server-side — localStorage keeps
// the favorite/itinerary buttons genuinely functional in the meantime rather
// than dead. Swap this for a real backend-backed list once auth is in place.

export type SavedItemKind = 'brand' | 'store' | 'article';

interface SavedItem {
  kind: SavedItemKind;
  id: number;
  name: string;
  savedAt: string;
}

const FAVORITES_KEY = 'shalomGuide.favorites';
const ITINERARY_KEY = 'shalomGuide.itinerary';

function readList(key: string): SavedItem[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as SavedItem[]) : [];
  } catch {
    return [];
  }
}

function writeList(key: string, items: SavedItem[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // localStorage unavailable (private browsing, quota) — fail silently,
    // the button still gives visual feedback for the current session.
  }
}

function has(key: string, kind: SavedItemKind, id: number): boolean {
  return readList(key).some((i) => i.kind === kind && i.id === id);
}

export function isFavorited(kind: SavedItemKind, id: number): boolean {
  return has(FAVORITES_KEY, kind, id);
}

/** Toggle favorite state; returns the new state (true = now favorited). */
export function toggleFavorite(kind: SavedItemKind, id: number, name: string): boolean {
  const list = readList(FAVORITES_KEY);
  const exists = list.some((i) => i.kind === kind && i.id === id);
  const next = exists
    ? list.filter((i) => !(i.kind === kind && i.id === id))
    : [...list, { kind, id, name, savedAt: new Date().toISOString() }];
  writeList(FAVORITES_KEY, next);
  return !exists;
}

export function isInItinerary(kind: SavedItemKind, id: number): boolean {
  return has(ITINERARY_KEY, kind, id);
}

export function addToItinerary(kind: SavedItemKind, id: number, name: string): void {
  const list = readList(ITINERARY_KEY);
  if (list.some((i) => i.kind === kind && i.id === id)) return;
  writeList(ITINERARY_KEY, [...list, { kind, id, name, savedAt: new Date().toISOString() }]);
}

/** Native share sheet if available, otherwise copy the link to the clipboard. */
export async function shareOrCopyLink(title: string, url: string): Promise<'shared' | 'copied' | 'failed'> {
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return 'shared';
    } catch {
      // User cancelled the share sheet — not an error, don't fall through to copy.
      return 'failed';
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}
