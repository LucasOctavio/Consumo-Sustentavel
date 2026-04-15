# importaçoes
from fastapi import APIRouter, Depends
from src.services.usuario_service import *
from src.schemas.usuario_schema import *
from src.schemas.mail_schema import *
from src.dependencia import *
from fastapi.security import OAuth2PasswordRequestForm

# defini o prefixo dele
usuario_roteador = APIRouter(prefix="/usuario", tags={"usuario"})

# rota inicial
@usuario_roteador.get("/")
async def home():
    """
    Essa é a rota de usuario
    """
    return {"mensagem": "Você acessou a rota de usuario"}

# NOTE - rota de listar

# rota de listar usuarios
@usuario_roteador.get("/listar")
async def listar(token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    # defini funcao
    return fun_listar(token, session)

# NOTE - rota de atualizar a informacao de verificacao

# rota de verificar o email
@usuario_roteador.get("/verificar")
async def verificar_email(token: Usuario = Depends(verificar_token_query), session: Session = Depends(pegar_sessao)):
    # defini funcao
    return await verificar_email_service(session, token["user_id"])

# rota de deletar via email
@usuario_roteador.get("/delete_via_email")
async def delete(token: Usuario = Depends(verificar_token_query), session : Session = Depends(pegar_sessao)):
    # defini funcao
    return fun_delete(token["user_id"], session)

# NOTE - rota de token refresh

# rota de verificar token
@usuario_roteador.post("/refresh")
async def use_refresh_token(busca: Usuario = Depends(verificar_token)):
    # defini funcao
    return refresh_token(busca)

# NOTE - rota de criar

# rota de criar conta
@usuario_roteador.post("/criar")
async def criar(dados: UsuarioSchema, session: Session = Depends(pegar_sessao)):
    return fun_criar(dados.nome, dados.email, dados.senha, session)
    
# NOTE - rota de logar

# rota de logar
@usuario_roteador.post("/login")
async def login(dados: UsuarioSchema, session: Session = Depends(pegar_sessao)):
    # defini funcao
    return fun_logar(dados.nome, dados.senha, session)

# rota de logar
@usuario_roteador.post("/login_form")
async def login_form(dados_formulario : OAuth2PasswordRequestForm = Depends(), session: Session = Depends(pegar_sessao)):
    # defini funcao
    return fun_login_form(dados_formulario, session)

# NOTE - rotas de email verificacao

# rota de mandar email de verificacao
@usuario_roteador.post("/mandar_email_verificar")
async def enviar_email(email: EmailSchema, token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    # defini funcao
    return await enviar_email_verificar(email.email, token.user_id, session)

# rota de mandar email de verificacao
@usuario_roteador.post("/mandar_email_deletar")
async def enviar_deletar_email(email: EmailSchema, token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    # defini funcao
    return await enviar_email_deletar(email.email, token.user_id, session)

# NOTE - rota de deletar

@usuario_roteador.delete("/deletar")
async def deletar(token: Usuario = Depends(verificar_token), session : Session = Depends(pegar_sessao)):
    # defini funcao
    return fun_delete(token.user_id, session)

# NOTE - rota de atualizar

@usuario_roteador.patch("/atualizar")
async def atualizar(dados: UsuarioUpdate, token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    return fun_atualizar(dados, token, session)

