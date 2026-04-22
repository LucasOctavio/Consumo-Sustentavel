# importaçoes
from fastapi import FastAPI
from src.config import *

# criaçao do fastAPI
app = FastAPI(title="API de Consumo de Sustentável", description="API para gerenciamento de consumo de Sustentável", version="1.0.0",
              openapi_tags=[

        {
            "name": "email",
            "description": """
            Operações relacionadas ao envio de email. \n
            """
        },
        {
            "name": "usuario",
            "description": """
            Operações relacionadas aos usuários logados. \n
            """
        },
        {
            "name": "consumo",
            "description": """
            Operações relacionadas ao consumo. \n
            """
        },
        {
            "name": "meta",
            "description": """
            Operações relacionadas às metas. \n
            """
        },])

# definiçao das rotas do fastAPI
from src.routes.email_route import email_roteador
from src.routes.usuario_route import usuario_roteador
from src.routes.consumo_route import consumo_roteador
from src.routes.meta_route import meta_roteador

# inclui as rotas no fastAPI
app.include_router(email_roteador)
app.include_router(usuario_roteador)
app.include_router(consumo_roteador)
app.include_router(meta_roteador)



# config is loaded from src.config

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