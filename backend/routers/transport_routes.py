import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.transport_routes import Transport_routesService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/transport_routes", tags=["transport_routes"])


# ---------- Pydantic Schemas ----------
class Transport_routesData(BaseModel):
    """Entity data schema (for create/update)"""
    route_number: str
    from_city: str
    to_city: str
    departure: str = None
    duration: str = None
    stops: int = None
    price: float = None
    operator: str = None
    type: str = None


class Transport_routesUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    route_number: Optional[str] = None
    from_city: Optional[str] = None
    to_city: Optional[str] = None
    departure: Optional[str] = None
    duration: Optional[str] = None
    stops: Optional[int] = None
    price: Optional[float] = None
    operator: Optional[str] = None
    type: Optional[str] = None


class Transport_routesResponse(BaseModel):
    """Entity response schema"""
    id: int
    route_number: str
    from_city: str
    to_city: str
    departure: Optional[str] = None
    duration: Optional[str] = None
    stops: Optional[int] = None
    price: Optional[float] = None
    operator: Optional[str] = None
    type: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Transport_routesListResponse(BaseModel):
    """List response schema"""
    items: List[Transport_routesResponse]
    total: int
    skip: int
    limit: int


class Transport_routesBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Transport_routesData]


class Transport_routesBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Transport_routesUpdateData


class Transport_routesBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Transport_routesBatchUpdateItem]


class Transport_routesBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Transport_routesListResponse)
async def query_transport_routess(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query transport_routess with filtering, sorting, and pagination"""
    logger.debug(f"Querying transport_routess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Transport_routesService(db)
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
        logger.debug(f"Found {result['total']} transport_routess")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid transport_routes query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying transport_routess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Transport_routesListResponse)
async def query_transport_routess_all(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query transport_routess with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying transport_routess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Transport_routesService(db)
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
        logger.debug(f"Found {result['total']} transport_routess")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid transport_routes query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying transport_routess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Transport_routesResponse)
async def get_transport_routes(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single transport_routes by ID"""
    logger.debug(f"Fetching transport_routes with id: {id}, fields={fields}")
    
    service = Transport_routesService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Transport_routes with id {id} not found")
            raise HTTPException(status_code=404, detail="Transport_routes not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching transport_routes {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Transport_routesResponse, status_code=201)
async def create_transport_routes(
    data: Transport_routesData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new transport_routes"""
    logger.debug(f"Creating new transport_routes with data: {data}")
    
    service = Transport_routesService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create transport_routes")
        
        logger.info(f"Transport_routes created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating transport_routes: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating transport_routes: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Transport_routesResponse], status_code=201)
async def create_transport_routess_batch(
    request: Transport_routesBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple transport_routess in a single request"""
    logger.debug(f"Batch creating {len(request.items)} transport_routess")
    
    service = Transport_routesService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} transport_routess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Transport_routesResponse])
async def update_transport_routess_batch(
    request: Transport_routesBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple transport_routess in a single request"""
    logger.debug(f"Batch updating {len(request.items)} transport_routess")
    
    service = Transport_routesService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} transport_routess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Transport_routesResponse)
async def update_transport_routes(
    id: int,
    data: Transport_routesUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing transport_routes"""
    logger.debug(f"Updating transport_routes {id} with data: {data}")

    service = Transport_routesService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Transport_routes with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Transport_routes not found")
        
        logger.info(f"Transport_routes {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating transport_routes {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating transport_routes {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_transport_routess_batch(
    request: Transport_routesBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple transport_routess by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} transport_routess")
    
    service = Transport_routesService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} transport_routess successfully")
        return {"message": f"Successfully deleted {deleted_count} transport_routess", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_transport_routes(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single transport_routes by ID"""
    logger.debug(f"Deleting transport_routes with id: {id}")
    
    service = Transport_routesService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Transport_routes with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Transport_routes not found")
        
        logger.info(f"Transport_routes {id} deleted successfully")
        return {"message": "Transport_routes deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting transport_routes {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")