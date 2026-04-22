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

# NOTE - rota de listar

# rota de listar usuarios
@usuario_roteador.get("/read", summary='Ler conta')
async def read(token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Ler as informações da conta. \n \n \
    '''
    # defini funcao
    return fun_read(token, session)

# NOTE - rota de token refresh

# rota de verificar token
@usuario_roteador.post("/refresh_token", summary='refresh token')
async def refresh_token(busca: Usuario = Depends(verificar_token)):
    '''\n \n \n Utilizar refresh token para criar um access token novo. \n \n \
    '''
    # defini funcao
    return fun_refresh_token(busca)

# NOTE - rota de criar

# rota de criar conta
@usuario_roteador.post("/sign_in", summary='Cadastar conta')
async def sign_in(dados: UsuarioSchema, session: Session = Depends(pegar_sessao)):
    '''\n \n \n Adicionar uma conta. \n \n \
    nome = str \n \n \
    email = Emailstr \n \n \
    senha = str \n \n \
    '''
    # defini funcao
    return fun_sign_in(dados.nome, dados.email, dados.senha, session)
    
# NOTE - rota de logar

# rota de logar
@usuario_roteador.post("/login", summary='Acessar conta')
async def login(dados: UsuarioLogin, session: Session = Depends(pegar_sessao)):
    '''\n \n \n Acessar uma conta. \n \n \
    nome = str \n \n \
    senha = str \n \n \
    '''
    # defini funcao
    return fun_login(dados.nome, dados.senha, session)

# rota de logar
@usuario_roteador.post("/login_form", summary=' Logar via fastapi')
async def login_form(dados_formulario : OAuth2PasswordRequestForm = Depends(), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Logar um usuario no fastapi. \n \n \
    '''
    # defini funcao
    return fun_login_form(dados_formulario, session)

# NOTE - rota de deletar

@usuario_roteador.delete("/delete", summary='Deletar conta')
async def delete(token: Usuario = Depends(verificar_token), session : Session = Depends(pegar_sessao)):
    '''\n \n \n Deletar uma conta. \n \n \
    '''
    # defini funcao
    return fun_delete(token.user_id, session)

# NOTE - rota de atualizar

@usuario_roteador.patch("/update", summary='Atualizar conta')
async def update(dados: UsuarioUpdate, token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Atualizar uma conta. \n \n \
    name = str \n \n \
    email = Emailstr \n \n \
    senha = str \n \n \
    '''
    # defini funcao
    return fun_update(dados, token.user_id, session)

