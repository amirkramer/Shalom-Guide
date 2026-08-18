import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.shopping_stores import Shopping_storesService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/shopping_stores", tags=["shopping_stores"])


# ---------- Pydantic Schemas ----------
class Shopping_storesData(BaseModel):
    """Entity data schema (for create/update)"""
    brand_id: int = None
    name: str
    city: str
    address: str = None
    phone: str = None
    hours: str = None
    shabbat_closed: bool = None
    accessible: bool = None
    lat: float = None
    lng: float = None


class Shopping_storesUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    brand_id: Optional[int] = None
    name: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    hours: Optional[str] = None
    shabbat_closed: Optional[bool] = None
    accessible: Optional[bool] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


class Shopping_storesResponse(BaseModel):
    """Entity response schema"""
    id: int
    brand_id: Optional[int] = None
    name: str
    city: str
    address: Optional[str] = None
    phone: Optional[str] = None
    hours: Optional[str] = None
    shabbat_closed: Optional[bool] = None
    accessible: Optional[bool] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Shopping_storesListResponse(BaseModel):
    """List response schema"""
    items: List[Shopping_storesResponse]
    total: int
    skip: int
    limit: int


class Shopping_storesBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Shopping_storesData]


class Shopping_storesBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Shopping_storesUpdateData


class Shopping_storesBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Shopping_storesBatchUpdateItem]


class Shopping_storesBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Shopping_storesListResponse)
async def query_shopping_storess(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query shopping_storess with filtering, sorting, and pagination"""
    logger.debug(f"Querying shopping_storess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Shopping_storesService(db)
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
        logger.debug(f"Found {result['total']} shopping_storess")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid shopping_stores query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying shopping_storess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Shopping_storesListResponse)
async def query_shopping_storess_all(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query shopping_storess with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying shopping_storess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Shopping_storesService(db)
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
        logger.debug(f"Found {result['total']} shopping_storess")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid shopping_stores query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying shopping_storess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Shopping_storesResponse)
async def get_shopping_stores(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single shopping_stores by ID"""
    logger.debug(f"Fetching shopping_stores with id: {id}, fields={fields}")
    
    service = Shopping_storesService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Shopping_stores with id {id} not found")
            raise HTTPException(status_code=404, detail="Shopping_stores not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching shopping_stores {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Shopping_storesResponse, status_code=201)
async def create_shopping_stores(
    data: Shopping_storesData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new shopping_stores"""
    logger.debug(f"Creating new shopping_stores with data: {data}")
    
    service = Shopping_storesService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create shopping_stores")
        
        logger.info(f"Shopping_stores created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating shopping_stores: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating shopping_stores: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Shopping_storesResponse], status_code=201)
async def create_shopping_storess_batch(
    request: Shopping_storesBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple shopping_storess in a single request"""
    logger.debug(f"Batch creating {len(request.items)} shopping_storess")
    
    service = Shopping_storesService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} shopping_storess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Shopping_storesResponse])
async def update_shopping_storess_batch(
    request: Shopping_storesBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple shopping_storess in a single request"""
    logger.debug(f"Batch updating {len(request.items)} shopping_storess")
    
    service = Shopping_storesService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} shopping_storess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Shopping_storesResponse)
async def update_shopping_stores(
    id: int,
    data: Shopping_storesUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing shopping_stores"""
    logger.debug(f"Updating shopping_stores {id} with data: {data}")

    service = Shopping_storesService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Shopping_stores with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Shopping_stores not found")
        
        logger.info(f"Shopping_stores {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating shopping_stores {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating shopping_stores {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_shopping_storess_batch(
    request: Shopping_storesBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple shopping_storess by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} shopping_storess")
    
    service = Shopping_storesService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} shopping_storess successfully")
        return {"message": f"Successfully deleted {deleted_count} shopping_storess", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_shopping_stores(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single shopping_stores by ID"""
    logger.debug(f"Deleting shopping_stores with id: {id}")
    
    service = Shopping_storesService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Shopping_stores with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Shopping_stores not found")
        
        logger.info(f"Shopping_stores {id} deleted successfully")
        return {"message": "Shopping_stores deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting shopping_stores {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")