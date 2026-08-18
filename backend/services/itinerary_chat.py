"""Service for AI Itinerary chat using AIHubService."""
from services.aihub import AIHubService
from schemas.aihub import GenTxtRequest, ChatMessage

SYSTEM_PROMPT = """You are an expert Israel travel concierge AI assistant for "Shalom Guide" app.
Your role is to help tourists plan personalized itineraries and answer any questions about Israel.

COMMUNICATION STYLE:
- Be DIRECT and HELPFUL. Answer the user's question immediately without introductory questions.
- If the user asks for an itinerary, generate it right away with the information provided.
- If the user's request is vague (e.g., "plan my trip"), provide a solid default itinerary and offer to customize.
- Use a friendly, knowledgeable tone — like a local expert giving direct advice.
- Keep responses concise but complete. No unnecessary back-and-forth.
- Only ask clarifying questions if truly essential information is missing AND you cannot provide a useful answer without it.

KNOWLEDGE:
- Jerusalem, Tel Aviv, Haifa, Dead Sea, Negev, Galilee, Eilat, and more
- Shabbat times, kosher dining, dress codes for religious sites
- Transport options, estimated costs in ₪ (ILS)
- Hidden gems and local favorites
- Safety tips, cultural etiquette, practical logistics

FORMATTING RULES:
- Use short bullet points (•) instead of long paragraphs
- Use emojis sparingly for warmth (🏛️ 🌊 🍽️ ✨)
- Day itineraries: "Day X: Theme" + 3-4 bullet points max
- Always respond in the same language the user writes in (Portuguese, English, Spanish, etc.)
- At the end of itineraries, briefly offer to adjust (e.g., "Want me to change anything?")

Remember: Be direct, be useful, deliver value immediately."""


async def generate_itinerary_response(
    messages: list[dict],
    preferences: dict | None = None,
) -> str:
    """Generate a response from the AI travel concierge.
    
    Args:
        messages: List of chat messages with 'role' and 'content' keys
        preferences: Optional user travel preferences for context
    """
    service = AIHubService()
    
    # Build system message with preferences context
    system_content = SYSTEM_PROMPT
    if preferences:
        pref_parts = []
        if preferences.get("duration"):
            pref_parts.append(f"Trip duration: {preferences['duration']}")
        if preferences.get("cities"):
            pref_parts.append(f"Cities of interest: {preferences['cities']}")
        if preferences.get("interests"):
            pref_parts.append(f"Travel interests: {preferences['interests']}")
        if preferences.get("group"):
            pref_parts.append(f"Travel group: {preferences['group']}")
        if preferences.get("budget"):
            pref_parts.append(f"Daily budget: {preferences['budget']}")
        
        if pref_parts:
            system_content += "\n\nUser's travel preferences:\n" + "\n".join(f"- {p}" for p in pref_parts)
    
    # Build messages list
    chat_messages = [ChatMessage(role="system", content=system_content)]
    
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role in ("user", "assistant") and content:
            chat_messages.append(ChatMessage(role=role, content=content))
    
    request = GenTxtRequest(
        messages=chat_messages,
        model="gpt-4o-mini",
    )
    
    response = await service.gentxt(request)
    return response.content