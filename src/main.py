# importaçoes
from fastapi import FastAPI
from passlib.context import CryptContext
import os
from dotenv import load_dotenv
from fastapi.security import OAuth2PasswordBearer
from fastapi_mail import ConnectionConfig

load_dotenv()

# defini a secret key pra codificar o token
SECRET_KEY = os.getenv("SECRET_KEY")

# defini o algorithm pra codificar o token
ALGORITHM = os.getenv("ALGORITHM")

# defini o tempo para expirar o token
ACCESS_TOKEN_EXPIRE_MINUTE = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTE"))

# usado para criptografar senhas
bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# usado para pegar o token que vem na head da requisicao
oauth2_schema = OAuth2PasswordBearer(tokenUrl="usuario/login_form")

# criaçao do fastAPI
app = FastAPI()

# definiçao das rotas do fastAPI
from src.routes.usuario_route import usuario_roteador
from src.routes.consumo_route import consumo_roteador
from src.routes.meta_route import meta_roteador

# inclui as rotas no fastAPI
app.include_router(usuario_roteador)
app.include_router(consumo_roteador)
app.include_router(meta_roteador)

# configuracao do email remetente
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_FROM_NAME="Consumo_sustentavel_app",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)

# uvicorn src.main:app --reload / roda o fastAPI

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