# coding: utf-8
from dotenv import load_dotenv
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
import os

# Carrega as variáveis do arquivo .env usando caminho absoluto para evitar erros de diretório
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(BASE_DIR, ".env"))

# Recupera a chave secreta utilizada para assinar os tokens JWT, com fallback de segurança
SECRET_KEY = os.getenv("SECRET_KEY", "consumo-sustentavel-default-key-2025")

# Define o algoritmo de criptografia padrão usado na geração dos tokens JWT
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# Define a vida útil do Token de Acesso em minutos
ACCESS_TOKEN_EXPIRE_MINUTE = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTE", "15"))

# Contexto do bcrypt responsável por "hashear" e verificar senhas
bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Esquema OAuth2 — o tokenUrl aponta para o endpoint onde o frontend busca o token
oauth2_schema = OAuth2PasswordBearer(tokenUrl="usuario/login")

# -----------------------------------------------------------------------
# Credenciais da Gmail API (OAuth2) — usadas para envio via HTTPS (porta 443)
# Funciona no Render e qualquer servidor cloud sem bloqueios de SMTP
# -----------------------------------------------------------------------
GMAIL_CLIENT_ID     = os.getenv("GMAIL_CLIENT_ID", "").strip()
GMAIL_CLIENT_SECRET = os.getenv("GMAIL_CLIENT_SECRET", "").strip()
GMAIL_REFRESH_TOKEN = os.getenv("GMAIL_REFRESH_TOKEN", "").strip()
GMAIL_FROM          = os.getenv("GMAIL_FROM", "").strip()
