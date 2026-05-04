from dotenv import load_dotenv
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from fastapi_mail import ConnectionConfig
import os

# Executa o load_dotenv() para carregar as variáveis do arquivo .env de forma global para as configurações
load_dotenv()

# Recupera a chave secreta utilizada para assinar os tokens JWT, garantindo que eles não sejam forjados
SECRET_KEY = os.getenv("SECRET_KEY")

# Define o algoritmo de criptografia padrão usado na geração dos tokens JWT
ALGORITHM = os.getenv("ALGORITHM")

# Define a vida útil do Token de Acesso em minutos, pegando a variável do .env ou assumindo 15 minutos como padrão
ACCESS_TOKEN_EXPIRE_MINUTE = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTE", "15"))

# Configura o contexto do CryptContext do Passlib especificando o uso do algoritmo bcrypt
# Ele será o responsável por "hashear" senhas novas e verificar senhas recebidas no login contra o hash do banco
bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Instancia o esquema de segurança OAuth2 do FastAPI
# O tokenUrl aponta para o endpoint oficial onde o frontend deve enviar as credenciais para obter um token
oauth2_schema = OAuth2PasswordBearer(tokenUrl="usuario/login")

# Configura os parâmetros de conexão do servidor SMTP para o disparo de e-mails (FastMail)
# Utiliza variáveis de ambiente para esconder as credenciais e garantir a segurança do servidor
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", "587")),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp-relay.gmail.com"),
    MAIL_FROM_NAME=os.getenv("MAIL_FROM_NAME", "Consumo_sustentavel_app"),
    # O FASTAPI-Mail exige booleanos verdadeiros para SSL/TLS e STARTTLS, por isso a comparação com "True" ou "1"
    MAIL_STARTTLS=os.getenv("MAIL_STARTTLS", "True") in ["True", "true", "1"],
    MAIL_SSL_TLS=os.getenv("MAIL_SSL_TLS", "False") in ["True", "true", "1"],
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=False,
)
