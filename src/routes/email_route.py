# importaçoes
from fastapi import APIRouter, Depends
from src.services.usuario_service import *
from src.schemas.usuario_schema import *
from src.schemas.mail_schema import *
from src.dependencia import *
from src.models.usuario_model import Usuario
from sqlalchemy.orm import Session
from src.services.email_service import *

# defini o prefixo dele
email_roteador = APIRouter(prefix="/usuario", tags=["email"])

# NOTE - rotas de email verificacao

# rota de mandar email de verificacao
@email_roteador.post("/send_verify_email", summary='enviar e-mail Verificão')
async def send_verify_email(email: EmailSchema, token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Mandar verificador via e-mail da conta. \n \n \
    email = Emailstr   \n \n \
    '''
    # defini funcao
    return await fun_send_verify_email(email.email, token.user_id, session)

# rota de mandar email de verificacao
@email_roteador.post("/send_login_email", summary='enviar e-mail login')
async def send_login_email(dados: UsuarioLogin, email: EmailSchema, token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Mandar acesso via e-mail. \n \n \
    nome = str    \n \n \
    senha = str   \n \n \
    email = Emailstr   \n \n \
    '''
    # defini funcao
    return await fun_send_login_email(email.email, token.user_id, dados, session)

# rota de mandar email de verificacao
@email_roteador.post("/send_delete_email", summary='enviar e-mail Deletar')
async def send_delete_email(email: EmailSchema, token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Deletar uma conta pelo e-mail. \n \n \
    email = Emailstr \n \n \
    '''
    # defini funcao
    return await fun_send_delete_email(email.email, token.user_id, session)

# rota de mandar email de atualização
@email_roteador.post("/send_update_email", summary='Atualizar e-mail')
async def send_update_email(dados: UsuarioUpdate, email: EmailSchema, token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Atualiza uma conta pelo e-mail. \n \n \
    user_name = str \n \n \
    user_email = Emailstr \n \n \
    user_senha = str \n \n \
    \n \n \
    email = Emailstr \n \n \
    '''
    # defini funcao
    return await fun_send_update_email(dados, email.email, token.user_id, session)

# NOTE - rota de modificacao da informacao por email

# rota de verificar o email
@email_roteador.get("/verify_via_email", summary='Verificar via e-mail')
async def verify_via_email(token: Usuario = Depends(verificar_token_query), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Verificar uma conta pelo e-mail. \n \n \
    '''
    # defini funcao
    return await fun_verify_via_email(session, token.user_id)

# rota de permitir a entrada via email
@email_roteador.get("/login_via_email", summary='Logar via e-mail')
async def login_via_email(dados: dict = Depends(verificar_dados_query), token: Usuario = Depends(verificar_token_query), session : Session = Depends(pegar_sessao)):
    '''\n \n \n Acessar uma conta pelo e-mail. \n \n \
    '''
    # defini funcao
    return await fun_login_via_email(dados, token.user_id, session)

# rota de deletar via email
@email_roteador.get("/delete_via_email", summary='Deletar via e-mail')
async def delete_via_email(token: Usuario = Depends(verificar_token_query), session : Session = Depends(pegar_sessao)):
    '''\n \n \n Deletar uma conta por e-mail. \n \n \
    '''
    # defini funcao
    return fun_delete(token.user_id, session)

# rota de atualizar via email
@email_roteador.get("/update_via_email", summary='Atualizar via e-mail')
async def update_via_email(dados: dict = Depends(verificar_dados_query), token: Usuario = Depends(verificar_token_query), session : Session = Depends(pegar_sessao)):
    '''\n \n \n Atualizar uma conta por e-mail. \n \n \
    '''
    # defini funcao
    return fun_update_via_email(dados, token.user_id, session)
