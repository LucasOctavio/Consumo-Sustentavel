# importacao
from dotenv import load_dotenv
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from fastapi_mail import ConnectionConfig
import os

load_dotenv()

# segredo e algoritmo do token
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

# tempo para expirar o token
ACCESS_TOKEN_EXPIRE_MINUTE = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTE", "15"))

# context para bcrypt
bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# oauth2 schema
oauth2_schema = OAuth2PasswordBearer(tokenUrl="usuario/login_form")

# configuracao do email remetente
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", "587")),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_FROM_NAME=os.getenv("MAIL_FROM_NAME", "Consumo_sustentavel_app"),
    MAIL_STARTTLS=os.getenv("MAIL_STARTTLS", "True") in ["True", "true", "1"],
    MAIL_SSL_TLS=os.getenv("MAIL_SSL_TLS", "False") in ["True", "true", "1"],
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)
