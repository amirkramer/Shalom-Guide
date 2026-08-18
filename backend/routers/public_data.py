"""Public data API router - serves app content without authentication."""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from core.database import get_db
from models.restaurants import Restaurants
from models.accommodations import Accommodations
from models.tourist_sites import Tourist_sites
from models.experiences import Experiences
from models.shopping_brands import Shopping_brands
from models.shopping_stores import Shopping_stores
from models.shopping_offers import Shopping_offers
from models.transport_routes import Transport_routes
from models.emergency_services import Emergency_services
from models.knowledge_articles import Knowledge_articles
from models.rental_companies import Rental_companies
from models.taxi_info import Taxi_info
from models.featured_restaurants import Featured_restaurants

router = APIRouter(prefix="/api/v1/public", tags=["public"])
logger = logging.getLogger(__name__)


@router.get("/restaurants")
async def list_restaurants(
    city: Optional[str] = None,
    cuisine: Optional[str] = None,
    kids_menu: Optional[bool] = None,
    pet_friendly: Optional[bool] = None,
    shabbat_open: Optional[bool] = None,
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List restaurants with optional filters"""
    query = select(Restaurants)
    if city:
        query = query.where(Restaurants.city.ilike(f"%{city}%"))
    if cuisine:
        query = query.where(Restaurants.cuisine.ilike(f"%{cuisine}%"))
    if kids_menu is not None:
        query = query.where(Restaurants.kids_menu == kids_menu)
    if pet_friendly is not None:
        query = query.where(Restaurants.pet_friendly == pet_friendly)
    if shabbat_open is not None:
        query = query.where(Restaurants.shabbat_open == shabbat_open)
    query = query.order_by(Restaurants.rating.desc()).limit(limit)

    result = await db.execute(query)
    items = result.scalars().all()

    return {
        "items": [
            {
                "id": r.id,
                "name": r.name,
                "cuisine": r.cuisine,
                "rating": float(r.rating) if r.rating else 0,
                "reviews": r.reviews or 0,
                "certification": r.certification or "",
                "price_level": r.price_level or 1,
                "distance": float(r.distance) if r.distance else 0,
                "is_open": r.is_open if r.is_open is not None else True,
                "closes_at": r.closes_at or "",
                "opens_at": r.opens_at or "",
                "tags": r.tags or "",
                "city": r.city,
                "kids_menu": r.kids_menu or False,
                "pet_friendly": r.pet_friendly or False,
                "shabbat_open": r.shabbat_open or False,
                "phone": r.phone or "",
                "address": r.address or "",
                "image_url": r.image_url or "",
            }
            for r in items
        ]
    }


@router.get("/accommodations")
async def list_accommodations(
    city: Optional[str] = None,
    type: Optional[str] = None,
    min_stars: Optional[int] = None,
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List accommodations with optional filters"""
    query = select(Accommodations)
    if city:
        query = query.where(Accommodations.city.ilike(f"%{city}%"))
    if type:
        query = query.where(Accommodations.type.ilike(f"%{type}%"))
    if min_stars:
        query = query.where(Accommodations.stars >= min_stars)
    query = query.order_by(Accommodations.rating.desc()).limit(limit)

    result = await db.execute(query)
    items = result.scalars().all()

    return {
        "items": [
            {
                "id": a.id,
                "name": a.name,
                "city": a.city,
                "type": a.type,
                "stars": a.stars or 0,
                "price_from": float(a.price_from) if a.price_from else 0,
                "rating": float(a.rating) if a.rating else 0,
                "reviews": a.reviews or 0,
                "amenities": a.amenities or "",
                "booking_id": a.booking_id or "",
                "image_url": a.image_url or "",
                "description": a.description or "",
            }
            for a in items
        ]
    }


@router.get("/tourist-sites")
async def list_tourist_sites(
    category: Optional[str] = None,
    city: Optional[str] = None,
    region: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List tourist sites with optional filters"""
    query = select(Tourist_sites)
    if category:
        query = query.where(Tourist_sites.category.ilike(f"%{category}%"))
    if city:
        query = query.where(Tourist_sites.city.ilike(f"%{city}%"))
    if region:
        query = query.where(Tourist_sites.region.ilike(f"%{region}%"))
    query = query.limit(limit)

    result = await db.execute(query)
    items = result.scalars().all()

    return {
        "items": [
            {
                "id": s.id,
                "name": s.name,
                "category": s.category,
                "city": s.city,
                "region": s.region or "",
                "hours": s.hours or "",
                "price": float(s.price) if s.price else 0,
                "description": s.description or "",
                "audio_guide": s.audio_guide or False,
                "accessible": s.accessible or False,
                "faith": s.faith or "",
                "dress_code": s.dress_code or "",
                "difficulty": s.difficulty or "",
                "duration": s.duration or "",
                "highlights": s.highlights or "",
                "unesco": s.unesco or False,
                "image_url": s.image_url or "",
            }
            for s in items
        ]
    }


@router.get("/experiences")
async def list_experiences(
    category: Optional[str] = None,
    city: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List experiences with optional filters"""
    query = select(Experiences).where(Experiences.is_active == True)
    if category:
        query = query.where(Experiences.category.ilike(f"%{category}%"))
    if city:
        query = query.where(Experiences.city.ilike(f"%{city}%"))
    query = query.order_by(Experiences.rating.desc()).limit(limit)

    result = await db.execute(query)
    items = result.scalars().all()

    return {
        "items": [
            {
                "id": e.id,
                "title": e.title,
                "category": e.category,
                "city": e.city,
                "description": e.description or "",
                "price": float(e.price) if e.price else 0,
                "duration": e.duration or "",
                "rating": float(e.rating) if e.rating else 0,
                "reviews": e.reviews or 0,
                "provider": e.provider or "",
                "image_url": e.image_url or "",
                "tags": e.tags or "",
            }
            for e in items
        ]
    }


@router.get("/shopping/brands")
async def list_shopping_brands(
    category: Optional[str] = None,
    featured: Optional[bool] = None,
    made_in_israel: Optional[bool] = None,
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List shopping brands with optional filters"""
    query = select(Shopping_brands)
    if category:
        query = query.where(Shopping_brands.category.ilike(f"%{category}%"))
    if featured is not None:
        query = query.where(Shopping_brands.is_featured == featured)
    if made_in_israel is not None:
        query = query.where(Shopping_brands.made_in_israel == made_in_israel)
    query = query.limit(limit)

    result = await db.execute(query)
    items = result.scalars().all()

    return {
        "items": [
            {
                "id": b.id,
                "name": b.name,
                "category": b.category,
                "description": b.description or "",
                "logo_url": b.logo_url or "",
                "website": b.website or "",
                "is_featured": b.is_featured or False,
                "made_in_israel": b.made_in_israel or False,
                "badges": b.badges or "",
                "city": b.city or "",
            }
            for b in items
        ]
    }


@router.get("/shopping/stores")
async def list_shopping_stores(
    city: Optional[str] = None,
    brand_id: Optional[int] = None,
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List shopping stores with optional filters"""
    query = select(Shopping_stores)
    if city:
        query = query.where(Shopping_stores.city.ilike(f"%{city}%"))
    if brand_id:
        query = query.where(Shopping_stores.brand_id == brand_id)
    query = query.limit(limit)

    result = await db.execute(query)
    items = result.scalars().all()

    return {
        "items": [
            {
                "id": s.id,
                "brand_id": s.brand_id or 0,
                "name": s.name,
                "city": s.city,
                "address": s.address or "",
                "phone": s.phone or "",
                "hours": s.hours or "",
                "shabbat_closed": s.shabbat_closed or False,
                "accessible": s.accessible or False,
                "lat": float(s.lat) if s.lat else 0,
                "lng": float(s.lng) if s.lng else 0,
            }
            for s in items
        ]
    }


@router.get("/shopping/offers")
async def list_shopping_offers(
    brand_id: Optional[int] = None,
    category: Optional[str] = None,
    active_only: bool = True,
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List shopping offers with optional filters"""
    query = select(Shopping_offers)
    if active_only:
        query = query.where(Shopping_offers.is_active == True)
    if brand_id:
        query = query.where(Shopping_offers.brand_id == brand_id)
    if category:
        query = query.where(Shopping_offers.category.ilike(f"%{category}%"))
    query = query.limit(limit)

    result = await db.execute(query)
    items = result.scalars().all()

    return {
        "items": [
            {
                "id": o.id,
                "brand_id": o.brand_id or 0,
                "store_id": o.store_id or 0,
                "title": o.title,
                "description": o.description or "",
                "discount_percent": o.discount_percent or 0,
                "coupon_code": o.coupon_code or "",
                "valid_until": o.valid_until or "",
                "is_active": o.is_active or False,
                "category": o.category or "",
            }
            for o in items
        ]
    }


@router.get("/transport")
async def list_transport_routes(
    from_city: Optional[str] = None,
    to_city: Optional[str] = None,
    type: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List transport routes with optional filters"""
    query = select(Transport_routes)
    if from_city:
        query = query.where(Transport_routes.from_city.ilike(f"%{from_city}%"))
    if to_city:
        query = query.where(Transport_routes.to_city.ilike(f"%{to_city}%"))
    if type:
        query = query.where(Transport_routes.type.ilike(f"%{type}%"))
    query = query.order_by(Transport_routes.departure).limit(limit)

    result = await db.execute(query)
    items = result.scalars().all()

    return {
        "items": [
            {
                "id": r.id,
                "route_number": r.route_number,
                "from_city": r.from_city,
                "to_city": r.to_city,
                "departure": r.departure or "",
                "duration": r.duration or "",
                "stops": r.stops or 0,
                "price": float(r.price) if r.price else 0,
                "operator": r.operator or "",
                "type": r.type or "",
            }
            for r in items
        ]
    }


@router.get("/emergency")
async def list_emergency_services(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List emergency services"""
    query = select(Emergency_services)
    if category:
        query = query.where(Emergency_services.category.ilike(f"%{category}%"))
    query = query.order_by(Emergency_services.priority)

    result = await db.execute(query)
    items = result.scalars().all()

    return {
        "items": [
            {
                "id": e.id,
                "service_name": e.service_name,
                "phone_number": e.phone_number,
                "icon": e.icon or "",
                "description": e.description or "",
                "color": e.color or "",
                "category": e.category or "",
                "priority": e.priority or 0,
            }
            for e in items
        ]
    }


@router.get("/knowledge")
async def list_knowledge_articles(
    category: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List knowledge base articles"""
    query = select(Knowledge_articles)
    if category:
        query = query.where(Knowledge_articles.category.ilike(f"%{category}%"))
    query = query.limit(limit)

    result = await db.execute(query)
    items = result.scalars().all()

    return {
        "items": [
            {
                "id": a.id,
                "title": a.title,
                "category": a.category,
                "content": a.content,
                "summary": a.summary or "",
                "image_url": a.image_url or "",
                "tags": a.tags or "",
                "read_time": a.read_time or 5,
            }
            for a in items
        ]
    }


@router.get("/knowledge/{article_id}")
async def get_knowledge_article(
    article_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a single knowledge article by ID"""
    result = await db.execute(select(Knowledge_articles).where(Knowledge_articles.id == article_id))
    article = result.scalar_one_or_none()
    if not article:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Article not found")

    return {
        "id": article.id,
        "title": article.title,
        "category": article.category,
        "content": article.content,
        "summary": article.summary or "",
        "image_url": article.image_url or "",
        "tags": article.tags or "",
        "read_time": article.read_time or 5,
    }


@router.get("/rental-companies")
async def list_rental_companies(
    db: AsyncSession = Depends(get_db),
):
    """List car rental companies"""
    query = select(Rental_companies).order_by(Rental_companies.rating.desc())
    result = await db.execute(query)
    items = result.scalars().all()

    return {
        "items": [
            {
                "id": c.id,
                "name": c.name,
                "flag": c.flag or "",
                "price_from": float(c.price_from) if c.price_from else 0,
                "vehicle_type": c.vehicle_type or "",
                "rating": float(c.rating) if c.rating else 0,
                "website_url": c.website_url or "",
                "phone": c.phone or "",
                "locations": c.locations or "",
                "is_local": c.is_local or False,
            }
            for c in items
        ]
    }


@router.get("/taxi-info")
async def list_taxi_info(
    db: AsyncSession = Depends(get_db),
):
    """List taxi fare information"""
    query = select(Taxi_info).order_by(Taxi_info.price_min)
    result = await db.execute(query)
    items = result.scalars().all()

    return {
        "items": [
            {
                "id": t.id,
                "distance_range": t.distance_range,
                "distance_label": t.distance_label or "",
                "price_min": float(t.price_min) if t.price_min else 0,
                "price_max": float(t.price_max) if t.price_max else 0,
                "currency": t.currency or "ILS",
                "notes": t.notes or "",
            }
            for t in items
        ]
    }


@router.get("/featured-restaurants")
async def list_featured_restaurants(
    section: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List featured restaurants by section"""
    query = select(Featured_restaurants)
    if section:
        query = query.where(Featured_restaurants.featured_section == section)
    query = query.order_by(Featured_restaurants.sort_order)
    result = await db.execute(query)
    items = result.scalars().all()

    return {
        "items": [
            {
                "id": r.id,
                "name": r.name,
                "category": r.category,
                "city": r.city,
                "rating": float(r.rating) if r.rating else 0,
                "price_level": r.price_level or 1,
                "image_url": r.image_url or "",
                "featured_section": r.featured_section or "",
                "sort_order": r.sort_order or 0,
            }
            for r in items
        ]
    }