# coding: utf-8
from dotenv import load_dotenv
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from fastapi_mail import ConnectionConfig
import os

# Carrega as variáveis do arquivo .env de forma global para todas as configurações
load_dotenv()

# Recupera a chave secreta utilizada para assinar os tokens JWT, com fallback de segurança
SECRET_KEY = os.getenv("SECRET_KEY", "consumo-sustentavel-default-key-2025")

# Define o algoritmo de criptografia padrão usado na geração dos tokens JWT
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# Define a vida útil do Token de Acesso em minutos, pegando a variável do .env ou assumindo 15 minutos como padrão
ACCESS_TOKEN_EXPIRE_MINUTE = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTE", "15"))

# Contexto do bcrypt responsável por "hashear" e verificar senhas
bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Esquema OAuth2 — o tokenUrl aponta para o endpoint onde o frontend busca o token
oauth2_schema = OAuth2PasswordBearer(tokenUrl="usuario/login")

# Configuração de conexão SMTP para o envio de e-mails via FastMail
# Utiliza variáveis de ambiente para proteger as credenciais no servidor
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", "").strip(),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", "").strip(),
    MAIL_FROM=os.getenv("MAIL_FROM", "").strip(),
    MAIL_PORT=int(os.getenv("MAIL_PORT", "587").strip()),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com").strip(),
    MAIL_FROM_NAME=os.getenv("MAIL_FROM_NAME", "Consumo Sustentavel").strip(),
    # Usando porta 587 com STARTTLS para maior compatibilidade
    MAIL_STARTTLS=os.getenv("MAIL_STARTTLS", "True").strip() in ["True", "true", "1"],
    MAIL_SSL_TLS=os.getenv("MAIL_SSL_TLS", "False").strip() in ["True", "true", "1"],
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=False,
)

# Configuração finalizada para FastMail SMTP
