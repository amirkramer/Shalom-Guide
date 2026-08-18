import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.shopping_offers import Shopping_offersService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/shopping_offers", tags=["shopping_offers"])


# ---------- Pydantic Schemas ----------
class Shopping_offersData(BaseModel):
    """Entity data schema (for create/update)"""
    brand_id: int = None
    store_id: int = None
    title: str
    description: str = None
    discount_percent: int = None
    coupon_code: str = None
    valid_until: str = None
    is_active: bool = None
    category: str = None


class Shopping_offersUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    brand_id: Optional[int] = None
    store_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    discount_percent: Optional[int] = None
    coupon_code: Optional[str] = None
    valid_until: Optional[str] = None
    is_active: Optional[bool] = None
    category: Optional[str] = None


class Shopping_offersResponse(BaseModel):
    """Entity response schema"""
    id: int
    brand_id: Optional[int] = None
    store_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    discount_percent: Optional[int] = None
    coupon_code: Optional[str] = None
    valid_until: Optional[str] = None
    is_active: Optional[bool] = None
    category: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Shopping_offersListResponse(BaseModel):
    """List response schema"""
    items: List[Shopping_offersResponse]
    total: int
    skip: int
    limit: int


class Shopping_offersBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Shopping_offersData]


class Shopping_offersBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Shopping_offersUpdateData


class Shopping_offersBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Shopping_offersBatchUpdateItem]


class Shopping_offersBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Shopping_offersListResponse)
async def query_shopping_offerss(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query shopping_offerss with filtering, sorting, and pagination"""
    logger.debug(f"Querying shopping_offerss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Shopping_offersService(db)
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
        logger.debug(f"Found {result['total']} shopping_offerss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid shopping_offers query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying shopping_offerss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Shopping_offersListResponse)
async def query_shopping_offerss_all(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query shopping_offerss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying shopping_offerss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Shopping_offersService(db)
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
        logger.debug(f"Found {result['total']} shopping_offerss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid shopping_offers query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying shopping_offerss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Shopping_offersResponse)
async def get_shopping_offers(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single shopping_offers by ID"""
    logger.debug(f"Fetching shopping_offers with id: {id}, fields={fields}")
    
    service = Shopping_offersService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Shopping_offers with id {id} not found")
            raise HTTPException(status_code=404, detail="Shopping_offers not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching shopping_offers {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Shopping_offersResponse, status_code=201)
async def create_shopping_offers(
    data: Shopping_offersData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new shopping_offers"""
    logger.debug(f"Creating new shopping_offers with data: {data}")
    
    service = Shopping_offersService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create shopping_offers")
        
        logger.info(f"Shopping_offers created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating shopping_offers: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating shopping_offers: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Shopping_offersResponse], status_code=201)
async def create_shopping_offerss_batch(
    request: Shopping_offersBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple shopping_offerss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} shopping_offerss")
    
    service = Shopping_offersService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} shopping_offerss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Shopping_offersResponse])
async def update_shopping_offerss_batch(
    request: Shopping_offersBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple shopping_offerss in a single request"""
    logger.debug(f"Batch updating {len(request.items)} shopping_offerss")
    
    service = Shopping_offersService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} shopping_offerss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Shopping_offersResponse)
async def update_shopping_offers(
    id: int,
    data: Shopping_offersUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing shopping_offers"""
    logger.debug(f"Updating shopping_offers {id} with data: {data}")

    service = Shopping_offersService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Shopping_offers with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Shopping_offers not found")
        
        logger.info(f"Shopping_offers {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating shopping_offers {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating shopping_offers {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_shopping_offerss_batch(
    request: Shopping_offersBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple shopping_offerss by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} shopping_offerss")
    
    service = Shopping_offersService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} shopping_offerss successfully")
        return {"message": f"Successfully deleted {deleted_count} shopping_offerss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_shopping_offers(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single shopping_offers by ID"""
    logger.debug(f"Deleting shopping_offers with id: {id}")
    
    service = Shopping_offersService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Shopping_offers with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Shopping_offers not found")
        
        logger.info(f"Shopping_offers {id} deleted successfully")
        return {"message": "Shopping_offers deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting shopping_offers {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")