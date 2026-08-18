import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.shabbat_times import Shabbat_timesService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/shabbat_times", tags=["shabbat_times"])


# ---------- Pydantic Schemas ----------
class Shabbat_timesData(BaseModel):
    """Entity data schema (for create/update)"""
    city: str
    parasha: str
    candle_lighting: str
    havdalah: str
    date_friday: str = None
    hebrew_date: str = None
    is_current: bool = None


class Shabbat_timesUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    city: Optional[str] = None
    parasha: Optional[str] = None
    candle_lighting: Optional[str] = None
    havdalah: Optional[str] = None
    date_friday: Optional[str] = None
    hebrew_date: Optional[str] = None
    is_current: Optional[bool] = None


class Shabbat_timesResponse(BaseModel):
    """Entity response schema"""
    id: int
    city: str
    parasha: str
    candle_lighting: str
    havdalah: str
    date_friday: Optional[str] = None
    hebrew_date: Optional[str] = None
    is_current: Optional[bool] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Shabbat_timesListResponse(BaseModel):
    """List response schema"""
    items: List[Shabbat_timesResponse]
    total: int
    skip: int
    limit: int


class Shabbat_timesBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Shabbat_timesData]


class Shabbat_timesBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Shabbat_timesUpdateData


class Shabbat_timesBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Shabbat_timesBatchUpdateItem]


class Shabbat_timesBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Shabbat_timesListResponse)
async def query_shabbat_timess(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query shabbat_timess with filtering, sorting, and pagination"""
    logger.debug(f"Querying shabbat_timess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Shabbat_timesService(db)
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
        logger.debug(f"Found {result['total']} shabbat_timess")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid shabbat_times query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying shabbat_timess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Shabbat_timesListResponse)
async def query_shabbat_timess_all(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query shabbat_timess with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying shabbat_timess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Shabbat_timesService(db)
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
        logger.debug(f"Found {result['total']} shabbat_timess")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid shabbat_times query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying shabbat_timess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Shabbat_timesResponse)
async def get_shabbat_times(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single shabbat_times by ID"""
    logger.debug(f"Fetching shabbat_times with id: {id}, fields={fields}")
    
    service = Shabbat_timesService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Shabbat_times with id {id} not found")
            raise HTTPException(status_code=404, detail="Shabbat_times not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching shabbat_times {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Shabbat_timesResponse, status_code=201)
async def create_shabbat_times(
    data: Shabbat_timesData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new shabbat_times"""
    logger.debug(f"Creating new shabbat_times with data: {data}")
    
    service = Shabbat_timesService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create shabbat_times")
        
        logger.info(f"Shabbat_times created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating shabbat_times: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating shabbat_times: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Shabbat_timesResponse], status_code=201)
async def create_shabbat_timess_batch(
    request: Shabbat_timesBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple shabbat_timess in a single request"""
    logger.debug(f"Batch creating {len(request.items)} shabbat_timess")
    
    service = Shabbat_timesService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} shabbat_timess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Shabbat_timesResponse])
async def update_shabbat_timess_batch(
    request: Shabbat_timesBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple shabbat_timess in a single request"""
    logger.debug(f"Batch updating {len(request.items)} shabbat_timess")
    
    service = Shabbat_timesService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} shabbat_timess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Shabbat_timesResponse)
async def update_shabbat_times(
    id: int,
    data: Shabbat_timesUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing shabbat_times"""
    logger.debug(f"Updating shabbat_times {id} with data: {data}")

    service = Shabbat_timesService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Shabbat_times with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Shabbat_times not found")
        
        logger.info(f"Shabbat_times {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating shabbat_times {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating shabbat_times {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_shabbat_timess_batch(
    request: Shabbat_timesBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple shabbat_timess by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} shabbat_timess")
    
    service = Shabbat_timesService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} shabbat_timess successfully")
        return {"message": f"Successfully deleted {deleted_count} shabbat_timess", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_shabbat_times(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single shabbat_times by ID"""
    logger.debug(f"Deleting shabbat_times with id: {id}")
    
    service = Shabbat_timesService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Shabbat_times with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Shabbat_times not found")
        
        logger.info(f"Shabbat_times {id} deleted successfully")
        return {"message": "Shabbat_times deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting shabbat_times {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")