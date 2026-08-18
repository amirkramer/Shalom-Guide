import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.quick_access_items import Quick_access_itemsService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/quick_access_items", tags=["quick_access_items"])


# ---------- Pydantic Schemas ----------
class Quick_access_itemsData(BaseModel):
    """Entity data schema (for create/update)"""
    icon: str
    label: str
    action: str
    sort_order: int = None


class Quick_access_itemsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    icon: Optional[str] = None
    label: Optional[str] = None
    action: Optional[str] = None
    sort_order: Optional[int] = None


class Quick_access_itemsResponse(BaseModel):
    """Entity response schema"""
    id: int
    icon: str
    label: str
    action: str
    sort_order: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Quick_access_itemsListResponse(BaseModel):
    """List response schema"""
    items: List[Quick_access_itemsResponse]
    total: int
    skip: int
    limit: int


class Quick_access_itemsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Quick_access_itemsData]


class Quick_access_itemsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Quick_access_itemsUpdateData


class Quick_access_itemsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Quick_access_itemsBatchUpdateItem]


class Quick_access_itemsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Quick_access_itemsListResponse)
async def query_quick_access_itemss(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query quick_access_itemss with filtering, sorting, and pagination"""
    logger.debug(f"Querying quick_access_itemss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Quick_access_itemsService(db)
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
        logger.debug(f"Found {result['total']} quick_access_itemss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid quick_access_items query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying quick_access_itemss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Quick_access_itemsListResponse)
async def query_quick_access_itemss_all(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query quick_access_itemss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying quick_access_itemss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Quick_access_itemsService(db)
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
        logger.debug(f"Found {result['total']} quick_access_itemss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid quick_access_items query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying quick_access_itemss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Quick_access_itemsResponse)
async def get_quick_access_items(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single quick_access_items by ID"""
    logger.debug(f"Fetching quick_access_items with id: {id}, fields={fields}")
    
    service = Quick_access_itemsService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Quick_access_items with id {id} not found")
            raise HTTPException(status_code=404, detail="Quick_access_items not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching quick_access_items {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Quick_access_itemsResponse, status_code=201)
async def create_quick_access_items(
    data: Quick_access_itemsData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new quick_access_items"""
    logger.debug(f"Creating new quick_access_items with data: {data}")
    
    service = Quick_access_itemsService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create quick_access_items")
        
        logger.info(f"Quick_access_items created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating quick_access_items: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating quick_access_items: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Quick_access_itemsResponse], status_code=201)
async def create_quick_access_itemss_batch(
    request: Quick_access_itemsBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple quick_access_itemss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} quick_access_itemss")
    
    service = Quick_access_itemsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} quick_access_itemss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Quick_access_itemsResponse])
async def update_quick_access_itemss_batch(
    request: Quick_access_itemsBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple quick_access_itemss in a single request"""
    logger.debug(f"Batch updating {len(request.items)} quick_access_itemss")
    
    service = Quick_access_itemsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} quick_access_itemss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Quick_access_itemsResponse)
async def update_quick_access_items(
    id: int,
    data: Quick_access_itemsUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing quick_access_items"""
    logger.debug(f"Updating quick_access_items {id} with data: {data}")

    service = Quick_access_itemsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Quick_access_items with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Quick_access_items not found")
        
        logger.info(f"Quick_access_items {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating quick_access_items {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating quick_access_items {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_quick_access_itemss_batch(
    request: Quick_access_itemsBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple quick_access_itemss by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} quick_access_itemss")
    
    service = Quick_access_itemsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} quick_access_itemss successfully")
        return {"message": f"Successfully deleted {deleted_count} quick_access_itemss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_quick_access_items(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single quick_access_items by ID"""
    logger.debug(f"Deleting quick_access_items with id: {id}")
    
    service = Quick_access_itemsService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Quick_access_items with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Quick_access_items not found")
        
        logger.info(f"Quick_access_items {id} deleted successfully")
        return {"message": "Quick_access_items deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting quick_access_items {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")