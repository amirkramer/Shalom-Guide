import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.dashboard_modules import Dashboard_modulesService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/dashboard_modules", tags=["dashboard_modules"])


# ---------- Pydantic Schemas ----------
class Dashboard_modulesData(BaseModel):
    """Entity data schema (for create/update)"""
    icon: str
    label: str
    path: str
    subtitle: str = None
    highlight: bool = None
    sort_order: int = None


class Dashboard_modulesUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    icon: Optional[str] = None
    label: Optional[str] = None
    path: Optional[str] = None
    subtitle: Optional[str] = None
    highlight: Optional[bool] = None
    sort_order: Optional[int] = None


class Dashboard_modulesResponse(BaseModel):
    """Entity response schema"""
    id: int
    icon: str
    label: str
    path: str
    subtitle: Optional[str] = None
    highlight: Optional[bool] = None
    sort_order: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Dashboard_modulesListResponse(BaseModel):
    """List response schema"""
    items: List[Dashboard_modulesResponse]
    total: int
    skip: int
    limit: int


class Dashboard_modulesBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Dashboard_modulesData]


class Dashboard_modulesBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Dashboard_modulesUpdateData


class Dashboard_modulesBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Dashboard_modulesBatchUpdateItem]


class Dashboard_modulesBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Dashboard_modulesListResponse)
async def query_dashboard_moduless(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query dashboard_moduless with filtering, sorting, and pagination"""
    logger.debug(f"Querying dashboard_moduless: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Dashboard_modulesService(db)
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
        logger.debug(f"Found {result['total']} dashboard_moduless")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid dashboard_modules query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying dashboard_moduless: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Dashboard_modulesListResponse)
async def query_dashboard_moduless_all(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query dashboard_moduless with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying dashboard_moduless: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Dashboard_modulesService(db)
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
        logger.debug(f"Found {result['total']} dashboard_moduless")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid dashboard_modules query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying dashboard_moduless: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Dashboard_modulesResponse)
async def get_dashboard_modules(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single dashboard_modules by ID"""
    logger.debug(f"Fetching dashboard_modules with id: {id}, fields={fields}")
    
    service = Dashboard_modulesService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Dashboard_modules with id {id} not found")
            raise HTTPException(status_code=404, detail="Dashboard_modules not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching dashboard_modules {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Dashboard_modulesResponse, status_code=201)
async def create_dashboard_modules(
    data: Dashboard_modulesData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new dashboard_modules"""
    logger.debug(f"Creating new dashboard_modules with data: {data}")
    
    service = Dashboard_modulesService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create dashboard_modules")
        
        logger.info(f"Dashboard_modules created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating dashboard_modules: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating dashboard_modules: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Dashboard_modulesResponse], status_code=201)
async def create_dashboard_moduless_batch(
    request: Dashboard_modulesBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple dashboard_moduless in a single request"""
    logger.debug(f"Batch creating {len(request.items)} dashboard_moduless")
    
    service = Dashboard_modulesService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} dashboard_moduless successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Dashboard_modulesResponse])
async def update_dashboard_moduless_batch(
    request: Dashboard_modulesBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple dashboard_moduless in a single request"""
    logger.debug(f"Batch updating {len(request.items)} dashboard_moduless")
    
    service = Dashboard_modulesService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} dashboard_moduless successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Dashboard_modulesResponse)
async def update_dashboard_modules(
    id: int,
    data: Dashboard_modulesUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing dashboard_modules"""
    logger.debug(f"Updating dashboard_modules {id} with data: {data}")

    service = Dashboard_modulesService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Dashboard_modules with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Dashboard_modules not found")
        
        logger.info(f"Dashboard_modules {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating dashboard_modules {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating dashboard_modules {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_dashboard_moduless_batch(
    request: Dashboard_modulesBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple dashboard_moduless by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} dashboard_moduless")
    
    service = Dashboard_modulesService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} dashboard_moduless successfully")
        return {"message": f"Successfully deleted {deleted_count} dashboard_moduless", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_dashboard_modules(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single dashboard_modules by ID"""
    logger.debug(f"Deleting dashboard_modules with id: {id}")
    
    service = Dashboard_modulesService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Dashboard_modules with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Dashboard_modules not found")
        
        logger.info(f"Dashboard_modules {id} deleted successfully")
        return {"message": "Dashboard_modules deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting dashboard_modules {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")