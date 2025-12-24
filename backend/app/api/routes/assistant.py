import time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.assistant_log import AssistantLog
from app.schemas.assistant import SummarizeRequest, SummarizeResponse, AssistantLogDetailResponse
from app.api.dependencies import get_current_user
from app.services.claude_client import ClaudeClient

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.post("/summarize", response_model=SummarizeResponse, status_code=status.HTTP_201_CREATED)
def summarize_text(
    request: SummarizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generar un resumen de texto usando Claude AI.

    - Requiere autenticacion JWT
    - Envia el texto a la API de Claude (Anthropic)
    - Guarda el registro en la base de datos
    - Retorna el resumen generado
    """
    start_time = time.time()

    try:
        # Llamar a Claude API
        claude = ClaudeClient()
        result = claude.summarize(
            text=request.text,
            max_tokens=request.max_tokens
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "CLAUDE_API_ERROR",
                "message": f"Error al comunicarse con Claude API: {str(e)}"
            }
        )

    processing_time = int((time.time() - start_time) * 1000)

    # Guardar en BD
    log_entry = AssistantLog(
        user_id=current_user.id,
        original_text=request.text,
        summary=result["summary"],
        model_used=result["model"],
        tokens_input=result.get("tokens_input"),
        tokens_output=result.get("tokens_output"),
        processing_time_ms=processing_time
    )

    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)

    return log_entry


@router.get("/history", response_model=List[AssistantLogDetailResponse])
def get_summary_history(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtener historial de resumenes del usuario actual.
    Incluye texto original completo para vista expandida.
    """
    logs = db.query(AssistantLog)\
        .filter(AssistantLog.user_id == current_user.id)\
        .order_by(AssistantLog.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()

    return [
        {
            "id": log.id,
            "summary": log.summary,
            "original_text_preview": log.original_text[:100] + "..." if len(log.original_text) > 100 else log.original_text,
            "original_text": log.original_text,  # Texto completo para vista expandida
            "model_used": log.model_used,
            "created_at": log.created_at
        }
        for log in logs
    ]
