# importaçoes
from fastapi import FastAPI
from passlib.context import CryptContext
import os
from dotenv import load_dotenv
from fastapi.security import OAuth2PasswordBearer

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")

bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = os.getenv("ALGORITHM")

ACCESS_TOKEN_EXPIRE_MINUTE = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTE"))

oauth2_schema = OAuth2PasswordBearer(tokenUrl="usuario/login_form")

# criaçao do fastAPI
app = FastAPI()

# definiçao das rotas do fastAPI
from src.rotes.usuario_rotas import usuario_roteador
from src.rotes.consumo_rotas import consumo_roteador
from src.rotes.meta_rotas import meta_roteador

# inclui as rotas no fastAPI
app.include_router(usuario_roteador)
app.include_router(consumo_roteador)
app.include_router(meta_roteador)

# uvicorn main:app --reload / roda o fastAPI

# SQLALCHEMY REQUISISOES
# CRUD
# POST - CREATE
# GET - READ
# PUT/PATCH - UPDATE
# DELETE - DELETE

# requisitos:
# python -m venv .venv
# pip install -r requirements.txt
# alembic init alembic
# criar arquivo .env com informacao do db e da SECRET_KEY

# migracao de banco
# alembic revision --autogenerate -m "initial migration"
# alembic upgrade head

# oque deve ter no .env:
# db = url_banco
# SECRET_KEY = secretkeygenerator
# ALGORITHM = HS256
# ACCESS_TOKEN_EXPIRE_MINUTE = tempo para expirar o token