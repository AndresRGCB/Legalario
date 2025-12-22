from fastapi import Header, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.services.auth import decode_token

# Security scheme para Swagger UI
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency que extrae y valida el JWT del header Authorization.
    Retorna el usuario autenticado.
    """
    token = credentials.credentials

    # Decodificar token
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "INVALID_TOKEN",
                "message": "Token invalido o expirado"
            },
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Obtener user_id del token
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "INVALID_TOKEN",
                "message": "Token no contiene informacion de usuario"
            },
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Buscar usuario en BD
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "USER_NOT_FOUND",
                "message": "Usuario no encontrado"
            },
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "USER_INACTIVE",
                "message": "Usuario desactivado"
            }
        )

    return user


async def verify_content_type(
    content_type: str = Header(..., description="Content-Type debe ser application/json")
):
    """Verificar que Content-Type sea application/json."""
    if not content_type.startswith("application/json"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail={
                "error": "INVALID_CONTENT_TYPE",
                "message": "Content-Type debe ser application/json"
            }
        )
    return True
