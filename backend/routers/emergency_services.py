import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.emergency_services import Emergency_servicesService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/emergency_services", tags=["emergency_services"])


# ---------- Pydantic Schemas ----------
class Emergency_servicesData(BaseModel):
    """Entity data schema (for create/update)"""
    service_name: str
    phone_number: str
    icon: str = None
    description: str = None
    color: str = None
    category: str = None
    priority: int = None


class Emergency_servicesUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    service_name: Optional[str] = None
    phone_number: Optional[str] = None
    icon: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[int] = None


class Emergency_servicesResponse(BaseModel):
    """Entity response schema"""
    id: int
    service_name: str
    phone_number: str
    icon: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Emergency_servicesListResponse(BaseModel):
    """List response schema"""
    items: List[Emergency_servicesResponse]
    total: int
    skip: int
    limit: int


class Emergency_servicesBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Emergency_servicesData]


class Emergency_servicesBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Emergency_servicesUpdateData


class Emergency_servicesBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Emergency_servicesBatchUpdateItem]


class Emergency_servicesBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Emergency_servicesListResponse)
async def query_emergency_servicess(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query emergency_servicess with filtering, sorting, and pagination"""
    logger.debug(f"Querying emergency_servicess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Emergency_servicesService(db)
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
        logger.debug(f"Found {result['total']} emergency_servicess")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid emergency_services query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying emergency_servicess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Emergency_servicesListResponse)
async def query_emergency_servicess_all(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query emergency_servicess with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying emergency_servicess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Emergency_servicesService(db)
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
        logger.debug(f"Found {result['total']} emergency_servicess")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid emergency_services query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying emergency_servicess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Emergency_servicesResponse)
async def get_emergency_services(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single emergency_services by ID"""
    logger.debug(f"Fetching emergency_services with id: {id}, fields={fields}")
    
    service = Emergency_servicesService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Emergency_services with id {id} not found")
            raise HTTPException(status_code=404, detail="Emergency_services not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching emergency_services {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Emergency_servicesResponse, status_code=201)
async def create_emergency_services(
    data: Emergency_servicesData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new emergency_services"""
    logger.debug(f"Creating new emergency_services with data: {data}")
    
    service = Emergency_servicesService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create emergency_services")
        
        logger.info(f"Emergency_services created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating emergency_services: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating emergency_services: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Emergency_servicesResponse], status_code=201)
async def create_emergency_servicess_batch(
    request: Emergency_servicesBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple emergency_servicess in a single request"""
    logger.debug(f"Batch creating {len(request.items)} emergency_servicess")
    
    service = Emergency_servicesService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} emergency_servicess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Emergency_servicesResponse])
async def update_emergency_servicess_batch(
    request: Emergency_servicesBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple emergency_servicess in a single request"""
    logger.debug(f"Batch updating {len(request.items)} emergency_servicess")
    
    service = Emergency_servicesService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} emergency_servicess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Emergency_servicesResponse)
async def update_emergency_services(
    id: int,
    data: Emergency_servicesUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing emergency_services"""
    logger.debug(f"Updating emergency_services {id} with data: {data}")

    service = Emergency_servicesService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Emergency_services with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Emergency_services not found")
        
        logger.info(f"Emergency_services {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating emergency_services {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating emergency_services {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_emergency_servicess_batch(
    request: Emergency_servicesBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple emergency_servicess by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} emergency_servicess")
    
    service = Emergency_servicesService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} emergency_servicess successfully")
        return {"message": f"Successfully deleted {deleted_count} emergency_servicess", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_emergency_services(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single emergency_services by ID"""
    logger.debug(f"Deleting emergency_services with id: {id}")
    
    service = Emergency_servicesService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Emergency_services with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Emergency_services not found")
        
        logger.info(f"Emergency_services {id} deleted successfully")
        return {"message": "Emergency_services deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting emergency_services {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")