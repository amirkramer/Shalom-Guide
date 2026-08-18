import logging
import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import stripe

from core.database import get_db
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from models.bookings import Bookings
from models.tours import Tours
from models.guides import Guides
from core.config import settings

stripe.api_key = settings.stripe_secret_key

router = APIRouter(prefix="/api/v1/payment", tags=["payment"])

logger = logging.getLogger(__name__)

COMMISSION_RATE = 0.10  # 10% for Shalom Guide


class BookTourRequest(BaseModel):
    tour_id: int
    booking_date: str
    success_url: str
    cancel_url: str


class CheckoutSessionResponse(BaseModel):
    session_id: str
    url: str


class PaymentVerificationRequest(BaseModel):
    session_id: str


class PaymentStatusResponse(BaseModel):
    status: str
    booking_id: int = None
    payment_status: str


@router.post("/create_payment_session", response_model=CheckoutSessionResponse)
async def create_payment_session(
    data: BookTourRequest,
    request: Request,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a Stripe checkout session for booking a tour"""
    try:
        # Get frontend host
        frontend_host = request.headers.get("App-Host")
        if frontend_host and not frontend_host.startswith(("http://", "https://")):
            frontend_host = f"https://{frontend_host}"

        # Get tour details
        tour_result = await db.execute(select(Tours).where(Tours.id == data.tour_id))
        tour = tour_result.scalar_one_or_none()
        if not tour:
            raise HTTPException(status_code=404, detail="Tour not found")

        # Get guide details
        guide_result = await db.execute(select(Guides).where(Guides.id == tour.guide_id))
        guide = guide_result.scalar_one_or_none()
        if not guide:
            raise HTTPException(status_code=404, detail="Guide not found")

        # Calculate amounts
        total_price = float(tour.price_ils)
        commission_amount = round(total_price * COMMISSION_RATE, 2)
        guide_amount = round(total_price - commission_amount, 2)

        # Capture the fields we need for the Stripe call now, while the ORM objects are
        # still attached to a live session. `db.rollback()` below expires them, and
        # touching an expired attribute afterwards triggers an implicit (sync) refresh
        # that AsyncSession forbids outside an awaited context ("greenlet_spawn" error).
        tour_title = tour.title
        tour_duration_hours = tour.duration_hours
        tour_city = tour.city
        tour_guide_id = tour.guide_id
        guide_name = guide.name

        # Parse booking date string (YYYY-MM-DD) into a date object; the DB column
        # is a strict Date type and rejects raw strings on some dialects (e.g. SQLite).
        try:
            parsed_booking_date = datetime.strptime(data.booking_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="booking_date must be in YYYY-MM-DD format")

        # Create booking record
        booking = Bookings(
            user_id=current_user.id,
            tour_id=data.tour_id,
            guide_id=tour_guide_id,
            booking_date=parsed_booking_date,
            total_price=total_price,
            commission_amount=commission_amount,
            guide_amount=guide_amount,
            status="pending",
            guide_paid=False,
        )
        db.add(booking)
        await db.commit()
        await db.refresh(booking)

        booking_id = booking.id

        # End DB transaction before Stripe call
        await db.rollback()

        # Create Stripe checkout session
        line_items = [
            {
                "price_data": {
                    "currency": "ils",
                    "product_data": {
                        "name": f"Tour: {tour_title}",
                        "description": f"Guide: {guide_name} | Duration: {tour_duration_hours}h | City: {tour_city}",
                    },
                    "unit_amount": int(total_price * 100),  # Stripe uses cents
                },
                "quantity": 1,
            }
        ]

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            success_url=f"{frontend_host}/payment-success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{frontend_host}/hire-guide",
            metadata={
                "booking_id": str(booking_id),
                "user_id": current_user.id,
                "guide_id": str(tour_guide_id),
            },
        )

        # Update booking with session_id
        booking_update = await db.execute(select(Bookings).where(Bookings.id == booking_id))
        booking_obj = booking_update.scalar_one_or_none()
        if booking_obj:
            booking_obj.payment_session_id = session.id
            await db.commit()

        return CheckoutSessionResponse(session_id=session.id, url=session.url)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Payment session creation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create payment session: {str(e)}")


@router.post("/verify_payment", response_model=PaymentStatusResponse)
async def verify_payment(
    data: PaymentVerificationRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Verify payment status and update booking"""
    try:
        session = stripe.checkout.Session.retrieve(data.session_id)
        booking_id = session.metadata.get("booking_id")

        status_mapping = {"complete": "confirmed", "open": "pending", "expired": "cancelled"}
        status = status_mapping.get(session.status, "pending")

        # Update booking status
        if booking_id:
            booking_result = await db.execute(select(Bookings).where(Bookings.id == int(booking_id)))
            booking = booking_result.scalar_one_or_none()
            if booking:
                booking.status = status
                await db.commit()

        return PaymentStatusResponse(
            status=status,
            booking_id=int(booking_id) if booking_id else None,
            payment_status=session.payment_status,
        )

    except Exception as e:
        logger.error(f"Payment verification error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to verify payment: {str(e)}")