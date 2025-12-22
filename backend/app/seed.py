"""
Script para crear el usuario seed permanente.
Se ejecuta al iniciar la aplicación.
"""
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.services.auth import get_password_hash


# Usuario permanente
DEFAULT_USER = {
    "email": "user",
    "password": "password",
    "full_name": "Usuario Admin"
}


def create_default_user():
    """Crear usuario por defecto si no existe."""
    db: Session = SessionLocal()
    try:
        # Verificar si ya existe
        existing = db.query(User).filter(User.email == DEFAULT_USER["email"]).first()
        if existing:
            print(f"Usuario '{DEFAULT_USER['email']}' ya existe.")
            return existing

        # Crear usuario
        user = User(
            email=DEFAULT_USER["email"],
            hashed_password=get_password_hash(DEFAULT_USER["password"]),
            full_name=DEFAULT_USER["full_name"],
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"Usuario '{DEFAULT_USER['email']}' creado exitosamente.")
        return user
    except Exception as e:
        print(f"Error creando usuario: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_default_user()
