"""API router for AI Itinerary chat."""
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from services.itinerary_chat import generate_itinerary_response

router = APIRouter(prefix="/api/v1/itinerary", tags=["itinerary"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ItineraryChatRequest(BaseModel):
    messages: list[ChatMessage]
    preferences: dict | None = None


class ItineraryChatResponse(BaseModel):
    content: str


@router.post("/chat", response_model=ItineraryChatResponse)
async def chat_with_concierge(
    data: ItineraryChatRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    """Chat with the AI travel concierge to plan an itinerary."""
    try:
        messages_list = [{"role": msg.role, "content": msg.content} for msg in data.messages]
        
        response_content = await generate_itinerary_response(
            messages=messages_list,
            preferences=data.preferences if data.preferences else None,
        )
        
        return ItineraryChatResponse(content=response_content)
    except Exception as e:
        logging.error(f"Itinerary chat error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate response. Please try again.")