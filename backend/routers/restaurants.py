import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.restaurants import RestaurantsService
from services.tripadvisor import (
    get_location_detail,
    get_location_photos,
    get_location_reviews,
    refresh_restaurant_rating,
)

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/restaurants", tags=["restaurants"])


# ---------- Pydantic Schemas ----------
class RestaurantsData(BaseModel):
    """Entity data schema (for create/update)"""
    name: str
    cuisine: str
    rating: float = None
    reviews: int = None
    certification: str = None
    price_level: int = None
    distance: float = None
    is_open: bool = None
    closes_at: str = None
    opens_at: str = None
    tags: str = None
    city: str
    kids_menu: bool = None
    pet_friendly: bool = None
    shabbat_open: bool = None
    phone: str = None
    address: str = None
    image_url: str = None


class RestaurantsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    name: Optional[str] = None
    cuisine: Optional[str] = None
    rating: Optional[float] = None
    reviews: Optional[int] = None
    certification: Optional[str] = None
    price_level: Optional[int] = None
    distance: Optional[float] = None
    is_open: Optional[bool] = None
    closes_at: Optional[str] = None
    opens_at: Optional[str] = None
    tags: Optional[str] = None
    city: Optional[str] = None
    kids_menu: Optional[bool] = None
    pet_friendly: Optional[bool] = None
    shabbat_open: Optional[bool] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    image_url: Optional[str] = None


class RestaurantsResponse(BaseModel):
    """Entity response schema"""
    id: int
    name: str
    cuisine: str
    rating: Optional[float] = None
    reviews: Optional[int] = None
    certification: Optional[str] = None
    price_level: Optional[int] = None
    distance: Optional[float] = None
    is_open: Optional[bool] = None
    closes_at: Optional[str] = None
    opens_at: Optional[str] = None
    tags: Optional[str] = None
    city: str
    kids_menu: Optional[bool] = None
    pet_friendly: Optional[bool] = None
    shabbat_open: Optional[bool] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    image_url: Optional[str] = None
    tripadvisor_rating: Optional[float] = None
    tripadvisor_review_count: Optional[int] = None
    tripadvisor_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RestaurantsListResponse(BaseModel):
    """List response schema"""
    items: List[RestaurantsResponse]
    total: int
    skip: int
    limit: int


class RestaurantsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[RestaurantsData]


class RestaurantsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: RestaurantsUpdateData


class RestaurantsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[RestaurantsBatchUpdateItem]


class RestaurantsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=RestaurantsListResponse)
async def query_restaurantss(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query restaurantss with filtering, sorting, and pagination"""
    logger.debug(f"Querying restaurantss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = RestaurantsService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")
        
        result = await service.get_list(
            skip=skip,
            limit=limit,
            query_dict=query_dict,
            sort=sort,
        )
        logger.debug(f"Found {result['total']} restaurantss")

        # Best-effort: refresh cached Tripadvisor ratings for any stale/unresolved
        # restaurants in this page. No-ops entirely if TRIPADVISOR_API_KEY isn't
        # set. Failures here shouldn't break the listing, so they're swallowed.
        try:
            changed = False
            for restaurant in result["items"]:
                if await refresh_restaurant_rating(restaurant):
                    changed = True
            if changed:
                await db.commit()
        except Exception as e:
            logger.warning(f"Tripadvisor refresh pass failed: {e}")

        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid restaurants query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying restaurantss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=RestaurantsListResponse)
async def query_restaurantss_all(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query restaurantss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying restaurantss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = RestaurantsService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")

        result = await service.get_list(
            skip=skip,
            limit=limit,
            query_dict=query_dict,
            sort=sort
        )
        logger.debug(f"Found {result['total']} restaurantss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid restaurants query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying restaurantss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=RestaurantsResponse)
async def get_restaurants(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single restaurants by ID"""
    logger.debug(f"Fetching restaurants with id: {id}, fields={fields}")
    
    service = RestaurantsService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Restaurants with id {id} not found")
            raise HTTPException(status_code=404, detail="Restaurants not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching restaurants {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}/tripadvisor")
async def get_restaurant_tripadvisor_detail(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Rich Tripadvisor detail for the in-app restaurant detail view: real
    address/phone/opening hours, subratings, a few photos, and a few review
    snippets — so users can see this in Shalom Guide itself instead of
    bouncing to tripadvisor.com just to check the address or read a review.

    Called on-demand (only when a user opens a restaurant's detail card), not
    on every list load, so it stays well within the Tripadvisor free call
    budget even though it makes up to 3 API calls.
    """
    service = RestaurantsService(db)
    restaurant = await service.get_by_id(id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurants not found")

    if not restaurant.tripadvisor_location_id:
        # Not resolved yet (e.g. stale-refresh pass hasn't run) — try once now.
        if await refresh_restaurant_rating(restaurant):
            await db.commit()

    if not restaurant.tripadvisor_location_id:
        return {"available": False}

    location_id = restaurant.tripadvisor_location_id
    detail, reviews, photos = None, [], []
    try:
        detail = await get_location_detail(location_id)
        reviews = await get_location_reviews(location_id, size=3)
        photos = await get_location_photos(location_id, size=4)
    except Exception as e:
        logger.warning(f"Tripadvisor detail fetch failed for restaurant {id}: {e}")

    if not detail:
        return {"available": False}

    address = (detail.get("addresses") or [{}])[0]
    phones = detail.get("phone_numbers") or []

    def _text(entries, key="value"):
        for e in entries or []:
            if e.get("primary"):
                return e.get(key)
        return (entries or [{}])[0].get(key) if entries else None

    return {
        "available": True,
        "name": (detail.get("names") or [{}])[0].get("value"),
        "address": address.get("formatted"),
        "phone": phones[0].get("value") if phones else None,
        "coordinates": detail.get("coordinates"),
        "opening_hours": (detail.get("opening_hours") or {}).get("formatted"),
        "price_level": detail.get("price_level"),
        "rating": (detail.get("traveler_ratings") or {}).get("overall", {}).get("rating"),
        "review_count": (detail.get("traveler_ratings") or {}).get("overall", {}).get("count"),
        "subratings": (detail.get("traveler_ratings") or {}).get("subratings", []),
        "url": (detail.get("urls") or {}).get("tripadvisor", {}).get("main"),
        "photos": [p.get("photo", {}).get("original_size_url") for p in photos if p.get("photo")],
        "reviews": [
            {
                "rating": r.get("rating"),
                "title": _text(r.get("title")),
                "text": _text(r.get("text")),
                "author": (r.get("user") or {}).get("username"),
                "author_location": (r.get("user") or {}).get("geo"),
                "date": r.get("travel_date"),
                "url": r.get("url"),
            }
            for r in reviews
        ],
    }


@router.post("", response_model=RestaurantsResponse, status_code=201)
async def create_restaurants(
    data: RestaurantsData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new restaurants"""
    logger.debug(f"Creating new restaurants with data: {data}")
    
    service = RestaurantsService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create restaurants")
        
        logger.info(f"Restaurants created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating restaurants: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating restaurants: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[RestaurantsResponse], status_code=201)
async def create_restaurantss_batch(
    request: RestaurantsBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple restaurantss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} restaurantss")
    
    service = RestaurantsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} restaurantss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[RestaurantsResponse])
async def update_restaurantss_batch(
    request: RestaurantsBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple restaurantss in a single request"""
    logger.debug(f"Batch updating {len(request.items)} restaurantss")
    
    service = RestaurantsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} restaurantss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=RestaurantsResponse)
async def update_restaurants(
    id: int,
    data: RestaurantsUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing restaurants"""
    logger.debug(f"Updating restaurants {id} with data: {data}")

    service = RestaurantsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Restaurants with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Restaurants not found")
        
        logger.info(f"Restaurants {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating restaurants {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating restaurants {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_restaurantss_batch(
    request: RestaurantsBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple restaurantss by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} restaurantss")
    
    service = RestaurantsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} restaurantss successfully")
        return {"message": f"Successfully deleted {deleted_count} restaurantss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_restaurants(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single restaurants by ID"""
    logger.debug(f"Deleting restaurants with id: {id}")
    
    service = RestaurantsService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Restaurants with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Restaurants not found")
        
        logger.info(f"Restaurants {id} deleted successfully")
        return {"message": "Restaurants deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting restaurants {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")