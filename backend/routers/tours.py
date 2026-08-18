import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.tours import ToursService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/tours", tags=["tours"])


# ---------- Pydantic Schemas ----------
class ToursData(BaseModel):
    """Entity data schema (for create/update)"""
    guide_id: int
    title: str
    description: str
    city: str
    duration_hours: float
    price_ils: float
    max_participants: int = None
    is_active: bool = None


class ToursUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    guide_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    city: Optional[str] = None
    duration_hours: Optional[float] = None
    price_ils: Optional[float] = None
    max_participants: Optional[int] = None
    is_active: Optional[bool] = None


class ToursResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    guide_id: int
    title: str
    description: str
    city: str
    duration_hours: float
    price_ils: float
    max_participants: Optional[int] = None
    is_active: Optional[bool] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ToursListResponse(BaseModel):
    """List response schema"""
    items: List[ToursResponse]
    total: int
    skip: int
    limit: int


class ToursBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[ToursData]


class ToursBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: ToursUpdateData


class ToursBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[ToursBatchUpdateItem]


class ToursBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=ToursListResponse)
async def query_tourss(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query tourss with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying tourss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = ToursService(db)
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
            user_id=str(current_user.id),
        )
        logger.debug(f"Found {result['total']} tourss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid tours query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying tourss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=ToursListResponse)
async def query_tourss_all(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query tourss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying tourss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = ToursService(db)
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
        logger.debug(f"Found {result['total']} tourss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid tours query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying tourss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=ToursResponse)
async def get_tours(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single tours by ID (user can only see their own records)"""
    logger.debug(f"Fetching tours with id: {id}, fields={fields}")
    
    service = ToursService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Tours with id {id} not found")
            raise HTTPException(status_code=404, detail="Tours not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching tours {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=ToursResponse, status_code=201)
async def create_tours(
    data: ToursData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new tours"""
    logger.debug(f"Creating new tours with data: {data}")
    
    service = ToursService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create tours")
        
        logger.info(f"Tours created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating tours: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating tours: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[ToursResponse], status_code=201)
async def create_tourss_batch(
    request: ToursBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple tourss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} tourss")
    
    service = ToursService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} tourss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[ToursResponse])
async def update_tourss_batch(
    request: ToursBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple tourss in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} tourss")
    
    service = ToursService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} tourss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=ToursResponse)
async def update_tours(
    id: int,
    data: ToursUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing tours (requires ownership)"""
    logger.debug(f"Updating tours {id} with data: {data}")

    service = ToursService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Tours with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Tours not found")
        
        logger.info(f"Tours {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating tours {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating tours {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_tourss_batch(
    request: ToursBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple tourss by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} tourss")
    
    service = ToursService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} tourss successfully")
        return {"message": f"Successfully deleted {deleted_count} tourss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_tours(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single tours by ID (requires ownership)"""
    logger.debug(f"Deleting tours with id: {id}")
    
    service = ToursService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Tours with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Tours not found")
        
        logger.info(f"Tours {id} deleted successfully")
        return {"message": "Tours deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting tours {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")