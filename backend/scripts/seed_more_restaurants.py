"""One-off seed: expand the restaurants table to cover Israel's major cities.

Run once against the live DB (mock_data/*.json only auto-seeds an EMPTY table,
and restaurants already had rows from the original mock set, so it never
re-ran automatically). Idempotent — skips any (name, city) pair that already
exists, so it's safe to re-run.

Every entry below was verified live against the Tripadvisor Terra API
(services/tripadvisor.py) before being added — see services/tripadvisor.py's
docstring for why country_code=IL is used instead of geo_name. The
tripadvisor_* fields are pre-filled here with the exact match found during
that verification (id/rating/review_count/url), rather than left for the
per-request refresh pass to re-resolve, since a couple of names on Tripadvisor
are shared by more than one Israeli location (e.g. "Sinta Bar" has both a
787-review Haifa listing and a near-empty 3-review one) and the refresh pass
always takes the first search hit, which isn't reliably the right one.

certification/phone/address are left null for all of these — we don't have
verified kashrut status or a confirmed street address for them, and previous
work in this app established never fabricating that kind of data. The
Gastronomy.tsx card UI already treats those fields as fully optional.

Run with: ./.venv/Scripts/python.exe scripts/seed_more_restaurants.py
"""
import asyncio
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select

from core.database import db_manager
from models.restaurants import Restaurants

NOW = datetime.now(timezone.utc)

# (name, cuisine, city, price_level, rating, reviews, ta_id, ta_rating, ta_reviews, ta_url)
NEW_RESTAURANTS = [
    ("Fattoush", "Lebanese", "Haifa", 2, 4.2, 1411, 1020765, 4.2, 1411,
     "https://www.tripadvisor.com/Restaurant_Review-g293982-d1020765-Reviews-Fattoush-Haifa_Haifa_District.html?m=70260"),
    ("Douzan", "Middle Eastern", "Haifa", 2, 4.3, 828, 1388943, 4.3, 828,
     "https://www.tripadvisor.com/Restaurant_Review-g293982-d1388943-Reviews-Douzan-Haifa_Haifa_District.html?m=70260"),
    ("Hanamal 24", "French", "Haifa", 3, 4.3, 611, 1595889, 4.3, 611,
     "https://www.tripadvisor.com/Restaurant_Review-g293982-d1595889-Reviews-Hanamal_24-Haifa_Haifa_District.html?m=70260"),
    ("Sinta Bar", "Bar & Grill", "Haifa", 2, 4.2, 787, 784434, 4.2, 787,
     "https://www.tripadvisor.com/Restaurant_Review-g293982-d784434-Reviews-Sinta_Bar-Haifa_Haifa_District.html?m=70260"),
    ("Dream Nemo", "Sushi", "Haifa", 2, 3.8, 212, 3579359, 3.8, 212,
     "https://www.tripadvisor.com/Restaurant_Review-g293982-d3579359-Reviews-Dream_Nemo-Haifa_Haifa_District.html?m=70260"),
    ("Santa Maria", "Cafe", "Haifa", 1, 3.7, 150, 4735987, 3.7, 150,
     "https://www.tripadvisor.com/Restaurant_Review-g293982-d4735987-Reviews-Santa_Maria-Haifa_Haifa_District.html?m=70260"),

    ("Hummus Shlomo and Doron", "Israeli", "Tel Aviv", 1, 4.8, 108, 7284767, 4.8, 108,
     "https://www.tripadvisor.com/Restaurant_Review-g293984-d7284767-Reviews-Hummus_Shlomo_and_Doron-Tel_Aviv_Tel_Aviv_District.html?m=70260"),
    ("Garger Hazahav", "Israeli", "Tel Aviv", 1, 4.1, 58, 9857980, 4.1, 58,
     "https://www.tripadvisor.com/Restaurant_Review-g293984-d9857980-Reviews-Garger_Hazahav-Tel_Aviv_Tel_Aviv_District.html?m=70260"),

    ("Aricha Sabich", "Israeli", "Jerusalem", 1, 4.8, 114, 6813419, 4.8, 114,
     "https://www.tripadvisor.com/Restaurant_Review-g293983-d6813419-Reviews-Aricha_Sabich-Jerusalem_Jerusalem_District.html?m=70260"),
    ("Ha'Agas 1", "Vegetarian", "Jerusalem", 1, 4.3, 63, 3293731, 4.3, 63,
     "https://www.tripadvisor.com/Restaurant_Review-g293983-d3293731-Reviews-Ha_Agas_1-Jerusalem_Jerusalem_District.html?m=70260"),

    ("The Last Refuge", "Seafood", "Eilat", 2, 4.0, 1018, 953820, 4.0, 1018,
     "https://www.tripadvisor.com/Restaurant_Review-g293980-d953820-Reviews-The_Last_Refuge-Eilat_Southern_District.html?m=70260"),
    ("Pedro Restuarant", "Mediterranean", "Eilat", 2, 4.6, 1940, 2346785, 4.6, 1940,
     "https://www.tripadvisor.com/Restaurant_Review-g293980-d2346785-Reviews-Pedro_Restuarant-Eilat_Southern_District.html?m=70260"),
    ("Pastory", "Italian", "Eilat", 2, 4.8, 8846, 3158822, 4.8, 8846,
     "https://www.tripadvisor.com/Restaurant_Review-g293980-d3158822-Reviews-Pastory-Eilat_Southern_District.html?m=70260"),
    ("Les Sardines", "Seafood", "Eilat", 2, 4.7, 1867, 6518020, 4.7, 1867,
     "https://www.tripadvisor.com/Restaurant_Review-g293980-d6518020-Reviews-Les_Sardines-Eilat_Southern_District.html?m=70260"),

    ("Yakuta", "Moroccan", "Beer Sheva", 2, 4.4, 345, 2225704, 4.4, 345,
     "https://www.tripadvisor.com/Restaurant_Review-g297741-d2225704-Reviews-Yakuta-Beersheba_Southern_District.html?m=70260"),
    ("Saba Jebeto", "Sandwiches", "Beer Sheva", 1, 4.4, 327, 2454505, 4.4, 327,
     "https://www.tripadvisor.com/Restaurant_Review-g297741-d2454505-Reviews-Saba_Jebeto-Beersheba_Southern_District.html?m=70260"),

    ("Alabama", "BBQ", "Netanya", 2, 4.4, 311, 3989700, 4.4, 311,
     "https://www.tripadvisor.com/Restaurant_Review-g297759-d3989700-Reviews-Alabama-Netanya_Central_District.html?m=70260"),
    ("Ni-Shi", "Asian", "Netanya", 2, 4.3, 274, 14210276, 4.3, 274,
     "https://www.tripadvisor.com/Restaurant_Review-g297759-d14210276-Reviews-Ni_Shi-Netanya_Central_District.html?m=70260"),
    ("Red Burger Bar", "Burgers", "Netanya", 1, 3.8, 222, 4993530, 3.8, 222,
     "https://www.tripadvisor.com/Restaurant_Review-g297759-d4993530-Reviews-Red_Burger_Bar-Netanya_Central_District.html?m=70260"),

    ("Herbert Samuel Herzliya", "European", "Herzliya", 3, 4.2, 410, 5926153, 4.2, 410,
     "https://www.tripadvisor.com/Restaurant_Review-g297747-d5926153-Reviews-Herbert_Samuel_Herzliya-Herzliya_Tel_Aviv_District.html?m=70260"),
    ("Bistro 56", "Mediterranean", "Herzliya", 2, 4.5, 814, 1163756, 4.5, 814,
     "https://www.tripadvisor.com/Restaurant_Review-g297747-d1163756-Reviews-Bistro_56-Herzliya_Tel_Aviv_District.html?m=70260"),
    ("Yam 7", "Seafood", "Herzliya", 2, 4.0, 631, 2399548, 4.0, 631,
     "https://www.tripadvisor.com/Restaurant_Review-g297747-d2399548-Reviews-Yam_7-Herzliya_Tel_Aviv_District.html?m=70260"),
    ("Sebastian", "Mediterranean", "Herzliya", 2, 4.1, 779, 873187, 4.1, 779,
     "https://www.tripadvisor.com/Restaurant_Review-g297747-d873187-Reviews-Sebastian-Herzliya_Tel_Aviv_District.html?m=70260"),

    ("Tishreen", "Middle Eastern", "Nazareth", 2, 4.4, 1028, 971418, 4.4, 1028,
     "https://www.tripadvisor.com/Restaurant_Review-g297758-d971418-Reviews-Tishreen-Nazareth_Galilee_Region.html?m=70260"),
    ("Amani Cafe", "Cafe", "Nazareth", 1, 5.0, 31, 19298587, 5.0, 31,
     "https://www.tripadvisor.com/Restaurant_Review-g297758-d19298587-Reviews-Amani_Cafe-Nazareth_Galilee_Region.html?m=70260"),

    ("Little Tiberias", "French", "Tiberias", 3, 4.3, 915, 1837739, 4.3, 915,
     "https://www.tripadvisor.com/Restaurant_Review-g297765-d1837739-Reviews-Little_Tiberias-Tiberias_Galilee_Region.html?m=70260"),
    ("Decks Restaurant", "Grill", "Tiberias", 2, 4.0, 704, 1127711, 4.0, 704,
     "https://www.tripadvisor.com/Restaurant_Review-g297765-d1127711-Reviews-Decks_Restaurant-Tiberias_Galilee_Region.html?m=70260"),
    ("Levin Baguette", "Sandwiches", "Tiberias", 1, 4.9, 8, 15849618, 4.9, 8,
     "https://www.tripadvisor.com/Restaurant_Review-g297765-d15849618-Reviews-Levin_Baguette-Tiberias_Galilee_Region.html?m=70260"),

    ("Limani Bistro", "Seafood", "Caesarea", 2, 4.1, 396, 7251187, 4.1, 396,
     "https://www.tripadvisor.com/Restaurant_Review-g297742-d7251187-Reviews-Limani_Bistro-Caesarea_Haifa_District.html?m=70260"),
    ("Aresto", "Italian", "Caesarea", 2, 3.5, 132, 3375213, 3.5, 132,
     "https://www.tripadvisor.com/Restaurant_Review-g297742-d3375213-Reviews-Aresto-Caesarea_Haifa_District.html?m=70260"),
]


async def main():
    await db_manager.init_db()
    async with db_manager.async_session_maker() as db:
        added = 0
        skipped = 0
        for (name, cuisine, city, price_level, rating, reviews,
             ta_id, ta_rating, ta_reviews, ta_url) in NEW_RESTAURANTS:
            existing = await db.execute(
                select(Restaurants).where(Restaurants.name == name, Restaurants.city == city)
            )
            if existing.scalar_one_or_none():
                skipped += 1
                continue
            db.add(Restaurants(
                name=name,
                cuisine=cuisine,
                rating=rating,
                reviews=reviews,
                certification=None,
                price_level=price_level,
                distance=1.0,
                is_open=True,
                closes_at="22:00",
                opens_at="12:00",
                tags="Popular on Tripadvisor",
                city=city,
                kids_menu=False,
                pet_friendly=False,
                shabbat_open=False,
                phone=None,
                address=None,
                tripadvisor_location_id=ta_id,
                tripadvisor_rating=ta_rating,
                tripadvisor_review_count=ta_reviews,
                tripadvisor_url=ta_url,
                tripadvisor_updated_at=NOW,
            ))
            added += 1
        await db.commit()
        print(f"Added {added} restaurants, skipped {skipped} already present.")


if __name__ == "__main__":
    asyncio.run(main())
