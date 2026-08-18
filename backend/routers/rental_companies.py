import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.rental_companies import Rental_companiesService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/rental_companies", tags=["rental_companies"])


# ---------- Pydantic Schemas ----------
class Rental_companiesData(BaseModel):
    """Entity data schema (for create/update)"""
    name: str
    flag: str = None
    price_from: float
    vehicle_type: str = None
    rating: float = None
    website_url: str = None
    phone: str = None
    locations: str = None
    is_local: bool = None


class Rental_companiesUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    name: Optional[str] = None
    flag: Optional[str] = None
    price_from: Optional[float] = None
    vehicle_type: Optional[str] = None
    rating: Optional[float] = None
    website_url: Optional[str] = None
    phone: Optional[str] = None
    locations: Optional[str] = None
    is_local: Optional[bool] = None


class Rental_companiesResponse(BaseModel):
    """Entity response schema"""
    id: int
    name: str
    flag: Optional[str] = None
    price_from: float
    vehicle_type: Optional[str] = None
    rating: Optional[float] = None
    website_url: Optional[str] = None
    phone: Optional[str] = None
    locations: Optional[str] = None
    is_local: Optional[bool] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Rental_companiesListResponse(BaseModel):
    """List response schema"""
    items: List[Rental_companiesResponse]
    total: int
    skip: int
    limit: int


class Rental_companiesBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Rental_companiesData]


class Rental_companiesBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Rental_companiesUpdateData


class Rental_companiesBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Rental_companiesBatchUpdateItem]


class Rental_companiesBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Rental_companiesListResponse)
async def query_rental_companiess(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query rental_companiess with filtering, sorting, and pagination"""
    logger.debug(f"Querying rental_companiess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Rental_companiesService(db)
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
        logger.debug(f"Found {result['total']} rental_companiess")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid rental_companies query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying rental_companiess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Rental_companiesListResponse)
async def query_rental_companiess_all(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query rental_companiess with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying rental_companiess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Rental_companiesService(db)
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
        logger.debug(f"Found {result['total']} rental_companiess")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid rental_companies query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying rental_companiess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Rental_companiesResponse)
async def get_rental_companies(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single rental_companies by ID"""
    logger.debug(f"Fetching rental_companies with id: {id}, fields={fields}")
    
    service = Rental_companiesService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Rental_companies with id {id} not found")
            raise HTTPException(status_code=404, detail="Rental_companies not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching rental_companies {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Rental_companiesResponse, status_code=201)
async def create_rental_companies(
    data: Rental_companiesData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new rental_companies"""
    logger.debug(f"Creating new rental_companies with data: {data}")
    
    service = Rental_companiesService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create rental_companies")
        
        logger.info(f"Rental_companies created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating rental_companies: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating rental_companies: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Rental_companiesResponse], status_code=201)
async def create_rental_companiess_batch(
    request: Rental_companiesBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple rental_companiess in a single request"""
    logger.debug(f"Batch creating {len(request.items)} rental_companiess")
    
    service = Rental_companiesService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} rental_companiess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Rental_companiesResponse])
async def update_rental_companiess_batch(
    request: Rental_companiesBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple rental_companiess in a single request"""
    logger.debug(f"Batch updating {len(request.items)} rental_companiess")
    
    service = Rental_companiesService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} rental_companiess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Rental_companiesResponse)
async def update_rental_companies(
    id: int,
    data: Rental_companiesUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing rental_companies"""
    logger.debug(f"Updating rental_companies {id} with data: {data}")

    service = Rental_companiesService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Rental_companies with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Rental_companies not found")
        
        logger.info(f"Rental_companies {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating rental_companies {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating rental_companies {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_rental_companiess_batch(
    request: Rental_companiesBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple rental_companiess by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} rental_companiess")
    
    service = Rental_companiesService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} rental_companiess successfully")
        return {"message": f"Successfully deleted {deleted_count} rental_companiess", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_rental_companies(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single rental_companies by ID"""
    logger.debug(f"Deleting rental_companies with id: {id}")
    
    service = Rental_companiesService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Rental_companies with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Rental_companies not found")
        
        logger.info(f"Rental_companies {id} deleted successfully")
        return {"message": "Rental_companies deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting rental_companies {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")