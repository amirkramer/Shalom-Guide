import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.accommodations import AccommodationsService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/accommodations", tags=["accommodations"])


# ---------- Pydantic Schemas ----------
class AccommodationsData(BaseModel):
    """Entity data schema (for create/update)"""
    name: str
    city: str
    type: str
    stars: int = None
    price_from: float = None
    rating: float = None
    reviews: int = None
    amenities: str = None
    booking_id: str = None
    image_url: str = None
    description: str = None


class AccommodationsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    name: Optional[str] = None
    city: Optional[str] = None
    type: Optional[str] = None
    stars: Optional[int] = None
    price_from: Optional[float] = None
    rating: Optional[float] = None
    reviews: Optional[int] = None
    amenities: Optional[str] = None
    booking_id: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None


class AccommodationsResponse(BaseModel):
    """Entity response schema"""
    id: int
    name: str
    city: str
    type: str
    stars: Optional[int] = None
    price_from: Optional[float] = None
    rating: Optional[float] = None
    reviews: Optional[int] = None
    amenities: Optional[str] = None
    booking_id: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AccommodationsListResponse(BaseModel):
    """List response schema"""
    items: List[AccommodationsResponse]
    total: int
    skip: int
    limit: int


class AccommodationsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[AccommodationsData]


class AccommodationsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: AccommodationsUpdateData


class AccommodationsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[AccommodationsBatchUpdateItem]


class AccommodationsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=AccommodationsListResponse)
async def query_accommodationss(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query accommodationss with filtering, sorting, and pagination"""
    logger.debug(f"Querying accommodationss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = AccommodationsService(db)
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
        logger.debug(f"Found {result['total']} accommodationss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid accommodations query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying accommodationss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=AccommodationsListResponse)
async def query_accommodationss_all(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query accommodationss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying accommodationss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = AccommodationsService(db)
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
        logger.debug(f"Found {result['total']} accommodationss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid accommodations query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying accommodationss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=AccommodationsResponse)
async def get_accommodations(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single accommodations by ID"""
    logger.debug(f"Fetching accommodations with id: {id}, fields={fields}")
    
    service = AccommodationsService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Accommodations with id {id} not found")
            raise HTTPException(status_code=404, detail="Accommodations not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching accommodations {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=AccommodationsResponse, status_code=201)
async def create_accommodations(
    data: AccommodationsData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new accommodations"""
    logger.debug(f"Creating new accommodations with data: {data}")
    
    service = AccommodationsService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create accommodations")
        
        logger.info(f"Accommodations created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating accommodations: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating accommodations: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[AccommodationsResponse], status_code=201)
async def create_accommodationss_batch(
    request: AccommodationsBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple accommodationss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} accommodationss")
    
    service = AccommodationsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} accommodationss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[AccommodationsResponse])
async def update_accommodationss_batch(
    request: AccommodationsBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple accommodationss in a single request"""
    logger.debug(f"Batch updating {len(request.items)} accommodationss")
    
    service = AccommodationsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} accommodationss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=AccommodationsResponse)
async def update_accommodations(
    id: int,
    data: AccommodationsUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing accommodations"""
    logger.debug(f"Updating accommodations {id} with data: {data}")

    service = AccommodationsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Accommodations with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Accommodations not found")
        
        logger.info(f"Accommodations {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating accommodations {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating accommodations {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_accommodationss_batch(
    request: AccommodationsBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple accommodationss by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} accommodationss")
    
    service = AccommodationsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} accommodationss successfully")
        return {"message": f"Successfully deleted {deleted_count} accommodationss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_accommodations(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single accommodations by ID"""
    logger.debug(f"Deleting accommodations with id: {id}")
    
    service = AccommodationsService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Accommodations with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Accommodations not found")
        
        logger.info(f"Accommodations {id} deleted successfully")
        return {"message": "Accommodations deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting accommodations {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")