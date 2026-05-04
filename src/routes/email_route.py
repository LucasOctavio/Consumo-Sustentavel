from fastapi import APIRouter, Depends
from src.schemas.usuario_schema import UsuarioLogin, UsuarioUpdate, Usuario2FA
from src.schemas.mail_schema import EmailSchema
from src.dependencia import pegar_sessao, verificar_token, verificar_token_query, verificar_dados_query
from src.models.usuario_model import Usuario
from sqlalchemy.orm import Session
from src.services.email_service import (
    enviar_email_verificacao, 
    enviar_email_2fa, 
    enviar_email_exclusao, 
    enviar_email_atualizacao, 
    verificar_via_email, 
    verificar_2fa, 
    atualizar_via_email
)
from src.services.usuario_service import deletar_usuario

# Instancia do roteador que lida especificamente com operações mediadas por confirmações via E-mail
email_router = APIRouter(prefix="/usuario", tags=["email"])



# Endpoint para requisitar envio de um e-mail contendo um código 2FA para login
@email_router.post("/send_2fa_email", summary='Enviar e-mail de 2 Fatores')
async def send_2fa_email(dados: UsuarioLogin, session: Session = Depends(pegar_sessao)):
    '''\n \n \n Mandar código 2FA via e-mail para acesso. \n \n \
    nome = "str"    \n \n \
    senha = "str"   \n \n \
    '''
    return await enviar_email_2fa(dados, session)

# Endpoint para solicitar que a plataforma envie um alerta/confirmação antes de excluir a conta definitivamente
@email_router.post("/send_delete_email", summary='Enviar e-mail deletar')
async def send_delete_email(email: EmailSchema, token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Deletar uma conta pelo e-mail. \n \n \
    email = "Emailstr" \n \n \
    '''
    return await enviar_email_exclusao(email.email, token.user_id, session)

# Endpoint para solicitar aprovação por e-mail quando o usuário decide alterar dados sensíveis
@email_router.post("/send_update_email", summary='Enviar e-mail de atualizar')
async def send_update_email(dados: UsuarioUpdate, email: EmailSchema, token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Atualiza uma conta pelo e-mail. \n \n \
    user_name = "str" \n \n \
    user_senha = "str" \n \n \
    \n \n \
    email = "Emailstr" \n \n \
    '''
    return await enviar_email_atualizacao(dados, email.email, token.user_id, session)

# Endpoint que efetiva o login validando o código 2FA
@email_router.post("/verify_2fa", summary='Verificar 2FA e Logar')
async def verify_2fa(dados: Usuario2FA, session: Session = Depends(pegar_sessao)):
    '''\n \n \n Validar o código de 6 dígitos recebido no e-mail para acessar a conta. \n \n \
    codigo = "str" \n \n \
    token_2fa = "str" \n \n \
    '''
    return await verificar_2fa(dados.codigo, dados.token_2fa, session)

# Endpoint que efetiva a verificação da conta quando o usuário clica no link do seu e-mail
@email_router.get("/verify_via_email", summary='Verificar via e-mail')
async def verify_via_email(token: str, session: Session = Depends(pegar_sessao)):
    '''\n \n \n Verificar uma conta pelo e-mail. \n \n \
    '''
    # Passa a string do token diretamente para ser validada e criar o usuário no banco
    return await verificar_via_email(session, token)

# Endpoint que efetiva a exclusão completa do usuário após ele clicar no botão recebido no e-mail
@email_router.get("/delete_via_email", summary='Deletar via e-mail')
async def delete_via_email(token: Usuario = Depends(verificar_token_query), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Deletar uma conta por e-mail. \n \n \
    '''
    # Reutiliza o serviço padrão de exclusão da conta
    return deletar_usuario(token.user_id, session)

# Endpoint que consolida a atualização de um dado sensível só após confirmação do e-mail
@email_router.get("/update_via_email", summary='Atualizar via e-mail')
async def update_via_email(dados: dict = Depends(verificar_dados_query), token: Usuario = Depends(verificar_token_query), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Atualizar uma conta por e-mail. \n \n \
    '''
    # Conclui as modificações com segurança baseada em token validado pelo cliente de e-mail do usuário
    return await atualizar_via_email(dados, token.user_id, session)
