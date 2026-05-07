from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Inicializa o objeto principal da aplicação FastAPI
# Os parâmetros configuram a página de documentação interativa (Swagger UI) gerada automaticamente
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
        },
        {
            "name": "foto",
            "description": """
            Operações relacionadas à foto de perfil do usuário. \n
            """
        },])

# Adiciona o Middleware de CORS (Cross-Origin Resource Sharing)
# Ele permite que o frontend (hospedado em um domínio diferente) faça requisições para esta API
# O "allow_origins=['*']" indica que a API aceitará requisições de qualquer domínio (ideal para dev, mas requer cuidado em produção)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Deve ser False quando allow_origins=["*"] — exigência do padrão CORS
    allow_methods=["*"], # Permite todos os métodos HTTP (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"]  # Permite envio de todos os tipos de cabeçalho
)

# Importações dos Roteadores (Controllers) que contém as rotas da nossa aplicação modularizada
from src.routes.email_route import email_router
from src.routes.usuario_route import usuario_router
from src.routes.consumo_route import consumo_router
from src.routes.meta_route import meta_router
from src.routes.foto_route import foto_router

# Registra os roteadores no objeto principal (app)
# Essa estrutura garante que o arquivo principal não fique sobrecarregado, seguindo o padrão de projeto MVC
app.include_router(email_router)
app.include_router(usuario_router)
app.include_router(consumo_router)
app.include_router(meta_router)
app.include_router(foto_router)

# python -m uvicorn src.main:app --reload / roda o fastAPI

# REQUISICOES:
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