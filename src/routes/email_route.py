from fastapi import APIRouter, Depends
from src.schemas.usuario_schema import UsuarioLogin, UsuarioUpdate
from src.schemas.mail_schema import EmailSchema
from src.dependencia import pegar_sessao, verificar_token, verificar_token_query, verificar_dados_query
from src.models.usuario_model import Usuario
from sqlalchemy.orm import Session
from src.services.email_service import (
    enviar_email_verificacao, 
    enviar_email_login, 
    enviar_email_exclusao, 
    enviar_email_atualizacao, 
    verificar_via_email, 
    autenticar_via_email, 
    atualizar_via_email
)
from src.services.usuario_service import deletar_usuario

# Instancia do roteador que lida especificamente com operações mediadas por confirmações via E-mail
email_router = APIRouter(prefix="/usuario", tags=["email"])

# Endpoint para requisitar o envio de um e-mail com link de confirmação de cadastro
@email_router.post("/send_verify_email", summary='enviar e-mail Verificação')
async def send_verify_email(email: EmailSchema, token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Mandar verificador via e-mail da conta. \n \n \
    email = "Emailstr"   \n \n \
    '''
    # Chama a função de serviço aguardando o disparo real (assíncrono) da mensagem SMTP
    return await enviar_email_verificacao(email.email, token.user_id, session)

# Endpoint para requisitar envio de um e-mail contendo um link para login rápido/seguro ("Magic Link")
@email_router.post("/send_login_email", summary='enviar e-mail login')
async def send_login_email(dados: UsuarioLogin, email: EmailSchema, token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Mandar acesso via e-mail. \n \n \
    nome = "str"    \n \n \
    senha = "str"   \n \n \
    email = "Emailstr"   \n \n \
    '''
    # Transmite além do remetente, as credenciais inseridas na tentativa de login
    return await enviar_email_login(email.email, token.user_id, dados, session)

# Endpoint para solicitar que a plataforma envie um alerta/confirmação antes de excluir a conta definitivamente
@email_router.post("/send_delete_email", summary='enviar e-mail Deletar')
async def send_delete_email(email: EmailSchema, token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Deletar uma conta pelo e-mail. \n \n \
    email = "Emailstr" \n \n \
    '''
    return await enviar_email_exclusao(email.email, token.user_id, session)

# Endpoint para solicitar aprovação por e-mail quando o usuário decide alterar dados sensíveis
@email_router.post("/send_update_email", summary='Atualizar e-mail')
async def send_update_email(dados: UsuarioUpdate, email: EmailSchema, token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Atualiza uma conta pelo e-mail. \n \n \
    user_name = "str" \n \n \
    user_email = "Emailstr" \n \n \
    user_senha = "str" \n \n \
    \n \n \
    email = "Emailstr" \n \n \
    '''
    return await enviar_email_atualizacao(dados, email.email, token.user_id, session)

# Endpoint que efetiva a verificação da conta quando o usuário clica no link do seu e-mail
@email_router.get("/verify_via_email", summary='Verificar via e-mail')
async def verify_via_email(token: Usuario = Depends(verificar_token_query), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Verificar uma conta pelo e-mail. \n \n \
    '''
    # Perceba que usamos "verificar_token_query", ou seja, o token vem escrito na URL e não no cabeçalho
    return await verificar_via_email(session, token.user_id)

# Endpoint que efetiva o login do usuário no momento em que ele clica no e-mail recebido
@email_router.get("/login_via_email", summary='Logar via e-mail')
async def login_via_email(dados: dict = Depends(verificar_dados_query), token: Usuario = Depends(verificar_token_query), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Acessar uma conta pelo e-mail. \n \n \
    '''
    # Recupera tanto o token de segurança principal quanto os dados secundários contidos na própria URL
    return await autenticar_via_email(dados, token.user_id, session)

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
