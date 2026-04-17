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
@email_roteador.post("/send_verify_email")
async def send_verify_email(email: EmailSchema, token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    """
    Essa é a rota de mandar um email para verificação do usuario, ele pede o seu email para enviar um email de verificação
    """
    # defini funcao
    return await fun_send_verify_email(email.email, token.user_id, session)

# rota de mandar email de verificacao
@email_roteador.post("/send_permission_email")
async def send_permission_email(email: EmailSchema, token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    """
    Essa é a rota de mandar um email para permitir a entrada de um usuario, ele pede o seu email para enviar um email de verificação
    """
    # defini funcao
    return await fun_send_permission_email(email.email, token.user_id, session)

# rota de mandar email de verificacao
@email_roteador.post("/send_delete_email")
async def send_delete_email(email: EmailSchema, token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    """
    Essa é a rota de mandar um email para verificar se voce deseja excluir a conta mesmo, ele pede o seu email para enviar um email de verificação
    """
    # defini funcao
    return await fun_send_delete_email(email.email, token.user_id, session)

# rota de mandar email de atualização
@email_roteador.post("/send_update_email")
async def send_update_email(dados: UsuarioUpdate, email: EmailSchema, token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    """
    Essa é a rota de mandar um email para verificar se voce deseja atualizar a conta mesmo, ele pede o seu email para enviar um email de verificação
    """
    # defini funcao
    return await fun_send_update_email(dados, email.email, token.user_id, session)

# NOTE - rota de modificacao da informacao por email

# rota de verificar o email
@email_roteador.get("/verify_via_email")
async def verify_via_email(token: Usuario = Depends(verificar_token_query), session: Session = Depends(pegar_sessao)):
    """
    Essa é a rota verificar o usuario recebendo o token dele do email enviado, ele pede o token que deve estar na url
    """
    # defini funcao
    return await fun_verify_via_email(session, token.user_id)

# rota de permitir a entrada via email
@email_roteador.get("/permission_via_email")
async def permission_via_email(token: Usuario = Depends(verificar_token_query), session : Session = Depends(pegar_sessao)):
    """
    Essa é a rota de permitir a entrada do usuario recebendo o token dele do email enviado, ele pede o token que deve estar na url
    """
    # defini funcao
    return await fun_permission_via_email(token.user_id, session)

# rota de deletar via email
@email_roteador.get("/delete_via_email")
async def delete_via_email(token: Usuario = Depends(verificar_token_query), session : Session = Depends(pegar_sessao)):
    """
    Essa é a rota deleta o usuario recebendo o token dele do email enviado, ele pede o token que deve estar na url
    """
    # defini funcao
    return fun_delete(token.user_id, session)

# rota de atualizar via email
@email_roteador.get("/update_via_email")
async def update_via_email(dados: dict = Depends(verificar_dados_query), token: Usuario = Depends(verificar_token_query), session : Session = Depends(pegar_sessao)):
    """
    Essa é a rota de atualizar o usuario recebendo o token dele do email enviado, ele pede o token que deve estar na url
    """
    # defini funcao
    return fun_update_via_email(dados, token.user_id, session)
