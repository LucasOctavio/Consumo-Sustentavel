# importacoes
from fastapi_mail import ConnectionConfig

# configuracao do email remetente
conf = ConnectionConfig(
    MAIL_USERNAME="e83604366@gmail.com",
    MAIL_PASSWORD="inxu yrho swrh xgvr",
    MAIL_FROM="e83604366@gmail.com",
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_FROM_NAME="Consumo_sustentavel_app",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)
