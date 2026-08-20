"""Tripadvisor Terra API client — real ratings/reviews for restaurants.

Docs: https://docs.terra.tripadvisor.com/
Auth: X-API-Key header. Free tier: 1,000 calls.

No affiliate/commission program exists for restaurants (Tripadvisor's affiliate
program only pays commission on hotels — confirmed via their own FAQ), so this
is display-only: real rating, review count, and a link back to Tripadvisor.

Results are cached on the Restaurants row (tripadvisor_* columns) and only
re-fetched when stale, to stay well within the free call budget for a small
fixed set of restaurants.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
from core.config import settings

logger = logging.getLogger(__name__)

BASE_URL = "https://terra.tripadvisor.com/api"
CACHE_TTL = timedelta(days=7)


def _headers() -> dict:
    return {"X-API-Key": settings.tripadvisor_api_key}


# Tripadvisor's own "official" website field points at a Facebook page for
# some restaurants — Facebook (like Instagram, same company) refuses to be
# framed, so that link always has to leave the app anyway. Where Instagram is
# the restaurant's more actively-used profile (verified individually via live
# search, not guessed), swap in the real handle instead — same "must leave
# the app" outcome (Instagram blocks framing too), but more useful content.
# Keyed by Tripadvisor location_id (stable), not restaurant name.
#
# Only restaurants confirmed with a real, verified handle are listed here —
# several others on Facebook (Abu Hassan, Azura, Yakuta, Ni-Shi) had no
# confirmable official Instagram found, so they're left as-is rather than
# guessed at.
INSTAGRAM_OVERRIDES: dict[int, str] = {
    12451881: "https://www.instagram.com/miznontlv/",  # Miznon
    2453575: "https://www.instagram.com/dr_shakshuka/",  # Dr. Shakshuka
    7284767: "https://www.instagram.com/hummus_shlomo_and_doron/",  # Hummus Shlomo and Doron
    6813419: "https://www.instagram.com/aricha.sabich/",  # Aricha Sabich
    5926153: "https://www.instagram.com/herbertsamuel_rest/",  # Herbert Samuel Herzliya
    7251187: "https://www.instagram.com/limanibistro_caesarea/",  # Limani Bistro
}


async def search_restaurant(name: str, city: str) -> Optional[dict]:
    """Find the best-matching Tripadvisor location for a restaurant name/city.

    Uses `country_code=IL` rather than `geo_name=<city>` — verified live that
    geo_name is an exact-match filter against Tripadvisor's own place names,
    which don't always match ours (e.g. our "Akko" is their "Acre"), silently
    producing zero results. country_code is a much looser, safer net for a
    country-wide app like this one.

    The search response already includes ratings/review counts/URLs inline
    (verified live), so no separate "location details" call is needed.
    """
    if not getattr(settings, "tripadvisor_api_key", None):
        return None

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{BASE_URL}/locations/search",
                headers=_headers(),
                params={
                    "query": name,
                    "country_code": "IL",
                    "category": "RESTAURANT",
                    "size": 1,
                },
            )
            response.raise_for_status()
            data = response.json()
            items = data.get("data") or []
            return items[0]["location"] if items else None
    except Exception as e:
        logger.warning(f"Tripadvisor search failed for '{name}' in {city}: {e}")
        return None


def is_stale(updated_at: Optional[datetime]) -> bool:
    if not updated_at:
        return True
    if updated_at.tzinfo is None:
        updated_at = updated_at.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc) - updated_at > CACHE_TTL


async def get_location_detail(location_id: int) -> Optional[dict]:
    """Full detail for one location: real address, phone, coordinates,
    opening hours per day, and a price-level label. Used to power the in-app
    restaurant detail view so users don't have to leave Shalom Guide to see
    the address/hours — only "see all reviews" links out.
    """
    if not getattr(settings, "tripadvisor_api_key", None):
        return None
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(f"{BASE_URL}/locations/{location_id}", headers=_headers())
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.warning(f"Tripadvisor location detail failed for id={location_id}: {e}")
        return None


async def get_location_reviews(location_id: int, size: int = 3) -> list[dict]:
    """A handful of real review snippets (title/text/rating/author/date) so
    the app can show genuine traveler feedback in-app, with a "read more on
    Tripadvisor" link for the full list rather than sending users out just to
    see what people said.
    """
    if not getattr(settings, "tripadvisor_api_key", None):
        return []
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{BASE_URL}/locations/{location_id}/reviews",
                headers=_headers(),
                params={"size": size},
            )
            response.raise_for_status()
            return response.json().get("data") or []
    except Exception as e:
        logger.warning(f"Tripadvisor reviews failed for id={location_id}: {e}")
        return []


async def get_location_photos(location_id: int, size: int = 4) -> list[dict]:
    """A few real photos of the place, for the in-app detail view."""
    if not getattr(settings, "tripadvisor_api_key", None):
        return []
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{BASE_URL}/locations/{location_id}/photos",
                headers=_headers(),
                params={"size": size},
            )
            response.raise_for_status()
            return response.json().get("data") or []
    except Exception as e:
        logger.warning(f"Tripadvisor photos failed for id={location_id}: {e}")
        return []


async def refresh_restaurant_rating(restaurant) -> bool:
    """Resolve and refresh a restaurant's cached Tripadvisor data in place.

    Returns True if the restaurant object was updated (caller is responsible for
    committing). Safe to call even without an API key configured — it's then a no-op.
    """
    if not getattr(settings, "tripadvisor_api_key", None):
        return False
    if not is_stale(restaurant.tripadvisor_updated_at):
        return False

    match = await search_restaurant(restaurant.name, restaurant.city)
    if not match:
        return False

    ratings = match.get("traveler_ratings", {}).get("overall") or {}
    restaurant.tripadvisor_location_id = match.get("id")
    restaurant.tripadvisor_rating = ratings.get("rating")
    restaurant.tripadvisor_review_count = ratings.get("count")
    restaurant.tripadvisor_url = match.get("urls", {}).get("tripadvisor", {}).get("main")
    restaurant.tripadvisor_updated_at = datetime.now(timezone.utc)
    return True
