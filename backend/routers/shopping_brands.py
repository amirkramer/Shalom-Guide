import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.shopping_brands import Shopping_brandsService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/shopping_brands", tags=["shopping_brands"])


# ---------- Pydantic Schemas ----------
class Shopping_brandsData(BaseModel):
    """Entity data schema (for create/update)"""
    name: str
    category: str
    description: str = None
    logo_url: str = None
    website: str = None
    is_featured: bool = None
    made_in_israel: bool = None
    badges: str = None
    city: str = None


class Shopping_brandsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    is_featured: Optional[bool] = None
    made_in_israel: Optional[bool] = None
    badges: Optional[str] = None
    city: Optional[str] = None


class Shopping_brandsResponse(BaseModel):
    """Entity response schema"""
    id: int
    name: str
    category: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    is_featured: Optional[bool] = None
    made_in_israel: Optional[bool] = None
    badges: Optional[str] = None
    city: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Shopping_brandsListResponse(BaseModel):
    """List response schema"""
    items: List[Shopping_brandsResponse]
    total: int
    skip: int
    limit: int


class Shopping_brandsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Shopping_brandsData]


class Shopping_brandsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Shopping_brandsUpdateData


class Shopping_brandsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Shopping_brandsBatchUpdateItem]


class Shopping_brandsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Shopping_brandsListResponse)
async def query_shopping_brandss(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query shopping_brandss with filtering, sorting, and pagination"""
    logger.debug(f"Querying shopping_brandss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Shopping_brandsService(db)
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
        logger.debug(f"Found {result['total']} shopping_brandss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid shopping_brands query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying shopping_brandss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Shopping_brandsListResponse)
async def query_shopping_brandss_all(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query shopping_brandss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying shopping_brandss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Shopping_brandsService(db)
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
        logger.debug(f"Found {result['total']} shopping_brandss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid shopping_brands query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying shopping_brandss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Shopping_brandsResponse)
async def get_shopping_brands(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single shopping_brands by ID"""
    logger.debug(f"Fetching shopping_brands with id: {id}, fields={fields}")
    
    service = Shopping_brandsService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Shopping_brands with id {id} not found")
            raise HTTPException(status_code=404, detail="Shopping_brands not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching shopping_brands {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Shopping_brandsResponse, status_code=201)
async def create_shopping_brands(
    data: Shopping_brandsData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new shopping_brands"""
    logger.debug(f"Creating new shopping_brands with data: {data}")
    
    service = Shopping_brandsService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create shopping_brands")
        
        logger.info(f"Shopping_brands created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating shopping_brands: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating shopping_brands: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Shopping_brandsResponse], status_code=201)
async def create_shopping_brandss_batch(
    request: Shopping_brandsBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple shopping_brandss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} shopping_brandss")
    
    service = Shopping_brandsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} shopping_brandss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Shopping_brandsResponse])
async def update_shopping_brandss_batch(
    request: Shopping_brandsBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple shopping_brandss in a single request"""
    logger.debug(f"Batch updating {len(request.items)} shopping_brandss")
    
    service = Shopping_brandsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} shopping_brandss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Shopping_brandsResponse)
async def update_shopping_brands(
    id: int,
    data: Shopping_brandsUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing shopping_brands"""
    logger.debug(f"Updating shopping_brands {id} with data: {data}")

    service = Shopping_brandsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Shopping_brands with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Shopping_brands not found")
        
        logger.info(f"Shopping_brands {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating shopping_brands {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating shopping_brands {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_shopping_brandss_batch(
    request: Shopping_brandsBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple shopping_brandss by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} shopping_brandss")
    
    service = Shopping_brandsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} shopping_brandss successfully")
        return {"message": f"Successfully deleted {deleted_count} shopping_brandss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_shopping_brands(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single shopping_brands by ID"""
    logger.debug(f"Deleting shopping_brands with id: {id}")
    
    service = Shopping_brandsService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Shopping_brands with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Shopping_brands not found")
        
        logger.info(f"Shopping_brands {id} deleted successfully")
        return {"message": "Shopping_brands deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting shopping_brands {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")