import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.tourist_sites import Tourist_sitesService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/tourist_sites", tags=["tourist_sites"])


# ---------- Pydantic Schemas ----------
class Tourist_sitesData(BaseModel):
    """Entity data schema (for create/update)"""
    name: str
    category: str
    city: str
    region: str = None
    hours: str = None
    price: float = None
    description: str = None
    audio_guide: bool = None
    accessible: bool = None
    faith: str = None
    dress_code: str = None
    difficulty: str = None
    duration: str = None
    highlights: str = None
    unesco: bool = None
    image_url: str = None


class Tourist_sitesUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    name: Optional[str] = None
    category: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    hours: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    audio_guide: Optional[bool] = None
    accessible: Optional[bool] = None
    faith: Optional[str] = None
    dress_code: Optional[str] = None
    difficulty: Optional[str] = None
    duration: Optional[str] = None
    highlights: Optional[str] = None
    unesco: Optional[bool] = None
    image_url: Optional[str] = None


class Tourist_sitesResponse(BaseModel):
    """Entity response schema"""
    id: int
    name: str
    category: str
    city: str
    region: Optional[str] = None
    hours: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    audio_guide: Optional[bool] = None
    accessible: Optional[bool] = None
    faith: Optional[str] = None
    dress_code: Optional[str] = None
    difficulty: Optional[str] = None
    duration: Optional[str] = None
    highlights: Optional[str] = None
    unesco: Optional[bool] = None
    image_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Tourist_sitesListResponse(BaseModel):
    """List response schema"""
    items: List[Tourist_sitesResponse]
    total: int
    skip: int
    limit: int


class Tourist_sitesBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Tourist_sitesData]


class Tourist_sitesBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Tourist_sitesUpdateData


class Tourist_sitesBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Tourist_sitesBatchUpdateItem]


class Tourist_sitesBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Tourist_sitesListResponse)
async def query_tourist_sitess(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query tourist_sitess with filtering, sorting, and pagination"""
    logger.debug(f"Querying tourist_sitess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Tourist_sitesService(db)
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
        logger.debug(f"Found {result['total']} tourist_sitess")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid tourist_sites query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying tourist_sitess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Tourist_sitesListResponse)
async def query_tourist_sitess_all(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query tourist_sitess with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying tourist_sitess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Tourist_sitesService(db)
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
        logger.debug(f"Found {result['total']} tourist_sitess")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid tourist_sites query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying tourist_sitess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Tourist_sitesResponse)
async def get_tourist_sites(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single tourist_sites by ID"""
    logger.debug(f"Fetching tourist_sites with id: {id}, fields={fields}")
    
    service = Tourist_sitesService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Tourist_sites with id {id} not found")
            raise HTTPException(status_code=404, detail="Tourist_sites not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching tourist_sites {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Tourist_sitesResponse, status_code=201)
async def create_tourist_sites(
    data: Tourist_sitesData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new tourist_sites"""
    logger.debug(f"Creating new tourist_sites with data: {data}")
    
    service = Tourist_sitesService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create tourist_sites")
        
        logger.info(f"Tourist_sites created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating tourist_sites: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating tourist_sites: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Tourist_sitesResponse], status_code=201)
async def create_tourist_sitess_batch(
    request: Tourist_sitesBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple tourist_sitess in a single request"""
    logger.debug(f"Batch creating {len(request.items)} tourist_sitess")
    
    service = Tourist_sitesService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} tourist_sitess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Tourist_sitesResponse])
async def update_tourist_sitess_batch(
    request: Tourist_sitesBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple tourist_sitess in a single request"""
    logger.debug(f"Batch updating {len(request.items)} tourist_sitess")
    
    service = Tourist_sitesService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} tourist_sitess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Tourist_sitesResponse)
async def update_tourist_sites(
    id: int,
    data: Tourist_sitesUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing tourist_sites"""
    logger.debug(f"Updating tourist_sites {id} with data: {data}")

    service = Tourist_sitesService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Tourist_sites with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Tourist_sites not found")
        
        logger.info(f"Tourist_sites {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating tourist_sites {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating tourist_sites {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_tourist_sitess_batch(
    request: Tourist_sitesBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple tourist_sitess by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} tourist_sitess")
    
    service = Tourist_sitesService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} tourist_sitess successfully")
        return {"message": f"Successfully deleted {deleted_count} tourist_sitess", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_tourist_sites(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single tourist_sites by ID"""
    logger.debug(f"Deleting tourist_sites with id: {id}")
    
    service = Tourist_sitesService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Tourist_sites with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Tourist_sites not found")
        
        logger.info(f"Tourist_sites {id} deleted successfully")
        return {"message": "Tourist_sites deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting tourist_sites {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")