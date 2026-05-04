from fastapi import APIRouter, Depends, Request, Body, Form
from src.services.usuario_service import obter_usuario, renovar_token, criar_usuario, deletar_usuario, atualizar_usuario
from src.services.email_service import enviar_email_2fa
from src.schemas.usuario_schema import UsuarioSchema, UsuarioUpdate, UsuarioLogin
from src.dependencia import pegar_sessao, verificar_token
from src.models.usuario_model import Usuario
from sqlalchemy.orm import Session
from fastapi import HTTPException
from src.services.usuario_service import authenticate, create_token
from datetime import timedelta

# Inicializa o roteador exclusivo para os fluxos da conta do usuário
usuario_router = APIRouter(prefix="/usuario", tags=["usuario"])

# Endpoint (GET) para obter os dados do próprio usuário (perfil)
@usuario_router.get("/read", summary='Ler conta')
async def read(token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Ler as informações da conta. \n \n \
    '''
    # Repassa a identificação garantida pelo JWT para buscar os dados completos no banco
    return obter_usuario(token, session)

# Endpoint (POST) dedicado a trocar um token que está prestes a vencer por um novo
@usuario_router.post("/refresh_token", summary='refresh token')
async def refresh_token(busca: Usuario = Depends(verificar_token)):
    '''\n \n \n Utilizar refresh token para criar um access token novo. \n \n \
    '''
    # O Refresh Token precisa ser mandado no cabeçalho. Se for válido, geramos um novo Access Token
    return renovar_token(busca)

# Endpoint (POST) de registro de novas contas (Sign Up)
@usuario_router.post("/sign_up", summary='Cadastrar conta')
async def sign_up(dados: UsuarioSchema, session: Session = Depends(pegar_sessao)):
    '''\n \n \n Adicionar uma conta. \n \n \
    nome = "str" \n \n \
    email = "Emailstr" \n \n \
    senha = "str" \n \n \
    '''
    # Encaminha o nome, email e senha recebidos no corpo da requisição para a regra de negócios
    return await criar_usuario(dados.nome, dados.email, dados.senha, session)

# Endpoint (POST) de autenticação com suporte dual (JSON/Form) e documentação via OpenAPI Extra
@usuario_router.post("/login", summary='Acessar conta', openapi_extra={"requestBody": {"content": {"application/json": {"schema": UsuarioLogin.model_json_schema()}}}})
async def login(request: Request, session: Session = Depends(pegar_sessao)):
    '''\n \n \n Acessar uma conta. Suporta JSON (nome/senha) para login real e Formulário para o Swagger (Authorize). \n \n \
    nome = "str" \n \n \
    senha = "str" \n \n \
    '''
    content_type = request.headers.get("content-type", "")
    
    # 1. Fluxo via JSON (Normal): Exige 2FA
    if "application/json" in content_type:
        try:
            # Lê o corpo bruto e valida manualmente com o Schema Pydantic
            corpo = await request.json()
            dados = UsuarioLogin(**corpo)
            # Encapsula os dados e chama o serviço que valida e envia o e-mail de 2FA
            return await enviar_email_2fa(dados, session)
        except Exception:
            raise HTTPException(status_code=422, detail="JSON de login inválido. Use os campos 'nome' e 'senha'.")
    
    # 2. Fluxo via Formulário (Bypass para o Swagger/Authorize): Retorna Tokens direto
    else:
        # Capturamos os dados do formulário manualmente
        form_data = await request.form()
        nome = form_data.get("username") or form_data.get("nome")
        senha = form_data.get("password") or form_data.get("senha")

        if not nome or not senha:
             raise HTTPException(status_code=422, detail="Credenciais não fornecidas. Use username/password no formulário.")
        
        busca = authenticate(nome, senha, session)
        if not busca:
            raise HTTPException(status_code=401, detail="Credenciais inválidas")
        
        # Gera os tokens finais diretamente para satisfazer o Swagger
        access_token = create_token(busca.user_id)
        refresh_token = create_token(busca.user_id, duracao_token=timedelta(days=7))
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer"
        }

# Endpoint (DELETE) que permite ao usuário excluir a própria conta
@usuario_router.delete("/delete", summary='Deletar conta')
async def delete(token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Deletar uma conta. \n \n \
    '''
    # O user_id é pego de dentro do token, evitando que alguém delete a conta de outro usuário
    return deletar_usuario(token.user_id, session)

# Endpoint (PATCH) para o usuário modificar seu próprio perfil (nome, senha, etc.)
@usuario_router.patch("/update", summary='Atualizar conta')
async def update(dados: UsuarioUpdate, token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Atualizar uma conta. \n \n \
    name = "str" \n \n \
    senha = "str" \n \n \
    '''
    # Envia o corpo validado e a identidade do solicitante para o controlador de usuários
    return atualizar_usuario(dados, token.user_id, session)