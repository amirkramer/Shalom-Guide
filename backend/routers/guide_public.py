import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List

from core.database import get_db
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from models.guides import Guides
from models.tours import Tours
from models.bookings import Bookings
from models.messages import Messages

router = APIRouter(prefix="/api/v1/guide", tags=["guide"])

logger = logging.getLogger(__name__)


class GuidePublicResponse(BaseModel):
    id: int
    name: str
    bio: str
    photo_url: Optional[str] = None
    languages: str
    specialties: Optional[str] = None
    cities: str
    rating: float = 0
    total_reviews: int = 0


class TourPublicResponse(BaseModel):
    id: int
    guide_id: int
    title: str
    description: str
    city: str
    duration_hours: float
    price_ils: float
    max_participants: int = 10


class SendMessageRequest(BaseModel):
    booking_id: int
    content: str


class MessageResponse(BaseModel):
    id: int
    booking_id: int
    sender_role: str
    content: str
    created_at: Optional[str] = None


@router.get("/list")
async def list_guides(
    city: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List all active guides, optionally filtered by city"""
    query = select(Guides).where(Guides.is_active == True)
    if city:
        query = query.where(Guides.cities.ilike(f"%{city}%"))

    result = await db.execute(query)
    guides = result.scalars().all()

    return {
        "items": [
            {
                "id": g.id,
                "name": g.name,
                "bio": g.bio,
                "photo_url": g.photo_url,
                "languages": g.languages,
                "specialties": g.specialties,
                "cities": g.cities,
                "rating": float(g.rating) if g.rating else 0,
                "total_reviews": g.total_reviews or 0,
            }
            for g in guides
        ]
    }


@router.get("/tours/{guide_id}")
async def get_guide_tours(
    guide_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get all active tours for a specific guide"""
    result = await db.execute(
        select(Tours).where(Tours.guide_id == guide_id, Tours.is_active == True)
    )
    tours = result.scalars().all()

    return {
        "items": [
            {
                "id": t.id,
                "guide_id": t.guide_id,
                "title": t.title,
                "description": t.description,
                "city": t.city,
                "duration_hours": float(t.duration_hours),
                "price_ils": float(t.price_ils),
                "max_participants": t.max_participants or 10,
            }
            for t in tours
        ]
    }


@router.get("/profile/{guide_id}")
async def get_guide_profile(
    guide_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get full guide profile"""
    result = await db.execute(select(Guides).where(Guides.id == guide_id))
    guide = result.scalar_one_or_none()
    if not guide:
        raise HTTPException(status_code=404, detail="Guide not found")

    # Get tours
    tours_result = await db.execute(
        select(Tours).where(Tours.guide_id == guide_id, Tours.is_active == True)
    )
    tours = tours_result.scalars().all()

    return {
        "guide": {
            "id": guide.id,
            "name": guide.name,
            "bio": guide.bio,
            "photo_url": guide.photo_url,
            "languages": guide.languages,
            "specialties": guide.specialties,
            "cities": guide.cities,
            "rating": float(guide.rating) if guide.rating else 0,
            "total_reviews": guide.total_reviews or 0,
        },
        "tours": [
            {
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "city": t.city,
                "duration_hours": float(t.duration_hours),
                "price_ils": float(t.price_ils),
                "max_participants": t.max_participants or 10,
            }
            for t in tours
        ],
    }


@router.post("/messages/send")
async def send_message(
    data: SendMessageRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a message in a booking chat"""
    # Verify booking belongs to user or guide
    booking_result = await db.execute(select(Bookings).where(Bookings.id == data.booking_id))
    booking = booking_result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Determine sender role
    guide_result = await db.execute(
        select(Guides).where(Guides.user_id == current_user.id)
    )
    guide = guide_result.scalar_one_or_none()

    if guide and guide.id == booking.guide_id:
        sender_role = "guide"
    elif booking.user_id == current_user.id:
        sender_role = "tourist"
    else:
        raise HTTPException(status_code=403, detail="Not authorized for this booking")

    message = Messages(
        user_id=current_user.id,
        booking_id=data.booking_id,
        sender_role=sender_role,
        content=data.content,
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)

    return {
        "id": message.id,
        "booking_id": message.booking_id,
        "sender_role": message.sender_role,
        "content": message.content,
        "created_at": str(message.created_at) if message.created_at else None,
    }


@router.get("/messages/{booking_id}")
async def get_messages(
    booking_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all messages for a booking"""
    # Verify access
    booking_result = await db.execute(select(Bookings).where(Bookings.id == booking_id))
    booking = booking_result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    guide_result = await db.execute(
        select(Guides).where(Guides.user_id == current_user.id)
    )
    guide = guide_result.scalar_one_or_none()

    is_guide = guide and guide.id == booking.guide_id
    is_tourist = booking.user_id == current_user.id

    if not is_guide and not is_tourist:
        raise HTTPException(status_code=403, detail="Not authorized")

    result = await db.execute(
        select(Messages)
        .where(Messages.booking_id == booking_id)
        .order_by(Messages.created_at.asc())
    )
    messages = result.scalars().all()

    return {
        "items": [
            {
                "id": m.id,
                "booking_id": m.booking_id,
                "sender_role": m.sender_role,
                "content": m.content,
                "created_at": str(m.created_at) if m.created_at else None,
            }
            for m in messages
        ]
    }


@router.get("/my-bookings")
async def get_my_bookings(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all bookings for the current user (as tourist)"""
    result = await db.execute(
        select(Bookings)
        .where(Bookings.user_id == current_user.id)
        .order_by(Bookings.created_at.desc())
    )
    bookings = result.scalars().all()

    items = []
    for b in bookings:
        tour_result = await db.execute(select(Tours).where(Tours.id == b.tour_id))
        tour = tour_result.scalar_one_or_none()
        guide_result = await db.execute(select(Guides).where(Guides.id == b.guide_id))
        guide = guide_result.scalar_one_or_none()

        items.append({
            "id": b.id,
            "tour_title": tour.title if tour else "Unknown",
            "guide_name": guide.name if guide else "Unknown",
            "booking_date": str(b.booking_date),
            "total_price": float(b.total_price),
            "status": b.status,
            "created_at": str(b.created_at) if b.created_at else None,
        })

    return {"items": items}


@router.get("/guide-bookings")
async def get_guide_bookings(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all bookings for the current user as a guide"""
    guide_result = await db.execute(
        select(Guides).where(Guides.user_id == current_user.id)
    )
    guide = guide_result.scalar_one_or_none()
    if not guide:
        raise HTTPException(status_code=404, detail="Guide profile not found")

    result = await db.execute(
        select(Bookings)
        .where(Bookings.guide_id == guide.id)
        .order_by(Bookings.created_at.desc())
    )
    bookings = result.scalars().all()

    items = []
    for b in bookings:
        tour_result = await db.execute(select(Tours).where(Tours.id == b.tour_id))
        tour = tour_result.scalar_one_or_none()

        items.append({
            "id": b.id,
            "tour_title": tour.title if tour else "Unknown",
            "booking_date": str(b.booking_date),
            "total_price": float(b.total_price),
            "commission_amount": float(b.commission_amount),
            "guide_amount": float(b.guide_amount),
            "status": b.status,
            "guide_paid": b.guide_paid,
            "created_at": str(b.created_at) if b.created_at else None,
        })

    return {"items": items}