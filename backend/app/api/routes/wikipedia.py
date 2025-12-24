import time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.wikipedia_log import WikipediaLog
from app.schemas.wikipedia import WikipediaSearchRequest, WikipediaSearchResponse, WikipediaHistoryResponse
from app.api.dependencies import get_current_user
from app.services.wikipedia_scraper import WikipediaScraper
from app.services.claude_client import ClaudeClient

router = APIRouter(prefix="/wikipedia", tags=["wikipedia"])


@router.post("/search", response_model=WikipediaSearchResponse, status_code=status.HTTP_201_CREATED)
def wikipedia_search(
    request: WikipediaSearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Buscar en Wikipedia, extraer primer parrafo y generar resumen con IA.

    - Requiere autenticacion JWT
    - Usa Selenium headless para scraping de Wikipedia
    - Llama a Claude API para generar resumen
    - Guarda el registro en la base de datos
    """
    start_time = time.time()

    # 1. Extraer texto de Wikipedia
    try:
        scraper = WikipediaScraper()
        wiki_result = scraper.search_and_extract(request.search_term)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "WIKIPEDIA_SCRAPE_ERROR",
                "message": f"Error al buscar en Wikipedia: {str(e)}"
            }
        )

    extracted_text = wiki_result["text"]
    wikipedia_url = wiki_result["url"]

    # 2. Generar resumen con Claude
    try:
        claude = ClaudeClient()
        summary_result = claude.summarize(
            text=extracted_text,
            max_tokens=request.max_tokens
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "CLAUDE_API_ERROR",
                "message": f"Error al generar resumen con Claude: {str(e)}"
            }
        )

    processing_time = int((time.time() - start_time) * 1000)

    # 3. Guardar en BD
    log_entry = WikipediaLog(
        user_id=current_user.id,
        search_term=request.search_term,
        wikipedia_url=wikipedia_url,
        extracted_text=extracted_text,
        summary=summary_result["summary"],
        model_used=summary_result["model"],
        processing_time_ms=processing_time
    )

    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)

    return log_entry


@router.get("/history", response_model=List[WikipediaHistoryResponse])
def get_wikipedia_history(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtener historial de busquedas Wikipedia del usuario actual.
    """
    logs = db.query(WikipediaLog)\
        .filter(WikipediaLog.user_id == current_user.id)\
        .order_by(WikipediaLog.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()

    return logs
