import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.onboarding_cards import Onboarding_cardsService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/onboarding_cards", tags=["onboarding_cards"])


# ---------- Pydantic Schemas ----------
class Onboarding_cardsData(BaseModel):
    """Entity data schema (for create/update)"""
    title: str
    icon: str
    description: str
    sort_order: int = None


class Onboarding_cardsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    title: Optional[str] = None
    icon: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None


class Onboarding_cardsResponse(BaseModel):
    """Entity response schema"""
    id: int
    title: str
    icon: str
    description: str
    sort_order: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Onboarding_cardsListResponse(BaseModel):
    """List response schema"""
    items: List[Onboarding_cardsResponse]
    total: int
    skip: int
    limit: int


class Onboarding_cardsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Onboarding_cardsData]


class Onboarding_cardsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Onboarding_cardsUpdateData


class Onboarding_cardsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Onboarding_cardsBatchUpdateItem]


class Onboarding_cardsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Onboarding_cardsListResponse)
async def query_onboarding_cardss(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query onboarding_cardss with filtering, sorting, and pagination"""
    logger.debug(f"Querying onboarding_cardss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Onboarding_cardsService(db)
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
        logger.debug(f"Found {result['total']} onboarding_cardss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid onboarding_cards query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying onboarding_cardss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Onboarding_cardsListResponse)
async def query_onboarding_cardss_all(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query onboarding_cardss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying onboarding_cardss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Onboarding_cardsService(db)
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
        logger.debug(f"Found {result['total']} onboarding_cardss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid onboarding_cards query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying onboarding_cardss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Onboarding_cardsResponse)
async def get_onboarding_cards(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single onboarding_cards by ID"""
    logger.debug(f"Fetching onboarding_cards with id: {id}, fields={fields}")
    
    service = Onboarding_cardsService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Onboarding_cards with id {id} not found")
            raise HTTPException(status_code=404, detail="Onboarding_cards not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching onboarding_cards {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Onboarding_cardsResponse, status_code=201)
async def create_onboarding_cards(
    data: Onboarding_cardsData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new onboarding_cards"""
    logger.debug(f"Creating new onboarding_cards with data: {data}")
    
    service = Onboarding_cardsService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create onboarding_cards")
        
        logger.info(f"Onboarding_cards created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating onboarding_cards: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating onboarding_cards: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Onboarding_cardsResponse], status_code=201)
async def create_onboarding_cardss_batch(
    request: Onboarding_cardsBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple onboarding_cardss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} onboarding_cardss")
    
    service = Onboarding_cardsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} onboarding_cardss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Onboarding_cardsResponse])
async def update_onboarding_cardss_batch(
    request: Onboarding_cardsBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple onboarding_cardss in a single request"""
    logger.debug(f"Batch updating {len(request.items)} onboarding_cardss")
    
    service = Onboarding_cardsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} onboarding_cardss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Onboarding_cardsResponse)
async def update_onboarding_cards(
    id: int,
    data: Onboarding_cardsUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing onboarding_cards"""
    logger.debug(f"Updating onboarding_cards {id} with data: {data}")

    service = Onboarding_cardsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Onboarding_cards with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Onboarding_cards not found")
        
        logger.info(f"Onboarding_cards {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating onboarding_cards {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating onboarding_cards {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_onboarding_cardss_batch(
    request: Onboarding_cardsBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple onboarding_cardss by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} onboarding_cardss")
    
    service = Onboarding_cardsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} onboarding_cardss successfully")
        return {"message": f"Successfully deleted {deleted_count} onboarding_cardss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_onboarding_cards(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single onboarding_cards by ID"""
    logger.debug(f"Deleting onboarding_cards with id: {id}")
    
    service = Onboarding_cardsService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Onboarding_cards with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Onboarding_cards not found")
        
        logger.info(f"Onboarding_cards {id} deleted successfully")
        return {"message": "Onboarding_cards deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting onboarding_cards {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")