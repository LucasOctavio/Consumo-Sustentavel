# importaçoes
from fastapi import APIRouter, Depends
from src.services.usuario_service import *
from src.schemas.usuario_schema import *
from src.schemas.mail_schema import *
from src.dependencia import *
from fastapi.security import OAuth2PasswordRequestForm
from src.models.usuario_model import Usuario
from sqlalchemy.orm import Session
from src.services.email_service import *

# defini o prefixo dele
usuario_roteador = APIRouter(prefix="/usuario", tags=["usuario"])

# rota inicial
@usuario_roteador.get("/")
async def usuario():
    """
    Essa é a rota de usuario
    """
    return {"mensagem": "Você acessou a rota de usuario"}

# NOTE - rota de listar

# rota de listar usuarios
@usuario_roteador.get("/read")
async def read(token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    """
    Essa é a rota de listar o usuario que está logado, ele pede um token
    """
    # defini funcao
    return fun_read(token, session)

# NOTE - rota de token refresh

# rota de verificar token
@usuario_roteador.post("/refresh_token")
async def refresh_token(busca: Usuario = Depends(verificar_token)):
    """
    Essa é a rota de refresh do acess token, ele pede o refresh token
    """
    # defini funcao
    return fun_refresh_token(busca)

# NOTE - rota de criar

# rota de criar conta
@usuario_roteador.post("/sign_in")
async def sign_in(dados: UsuarioSchema, session: Session = Depends(pegar_sessao)):
    """
    Essa é a rota de criar um usuario, ele pede um nome, um email e uma senha
    """
    # defini funcao
    return fun_sign_in(dados.nome, dados.email, dados.senha, session)
    
# NOTE - rota de logar

# rota de logar
@usuario_roteador.post("/login")
async def login(dados: UsuarioSchema, session: Session = Depends(pegar_sessao)):
    """
    Essa é a rota de logar em um usuario, ele pede um nome e uma senha
    """
    # defini funcao
    return fun_login(dados.nome, dados.senha, session)

# rota de logar
@usuario_roteador.post("/login_form")
async def login_form(dados_formulario : OAuth2PasswordRequestForm = Depends(), session: Session = Depends(pegar_sessao)):
    """
    Essa é a rota de logar em um usuario no fastapi, ele pede um nome e uma senha
    """
    # defini funcao
    return fun_login_form(dados_formulario, session)

# NOTE - rota de deletar

@usuario_roteador.delete("/delete")
async def delete(token: Usuario = Depends(verificar_token), session : Session = Depends(pegar_sessao)):
    """
    Essa é a rota de deletar um usuario, ele pede um token
    """
    # defini funcao
    return fun_delete(token.user_id, session)

# NOTE - rota de atualizar

@usuario_roteador.patch("/update")
async def update(dados: UsuarioUpdate, token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    """
    Essa é a rota de atualizar um usuario, ele pede os dados que deseja alterar e token do usuario
    """
    # defini funcao
    return fun_update(dados, token.user_id, session)

