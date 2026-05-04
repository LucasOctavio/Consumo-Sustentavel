# coding: utf-8
from fastapi import HTTPException
from src.models.usuario_model import Usuario
import asyncio
import httpx
import random
import smtplib
from datetime import timedelta
from email.message import EmailMessage
from jose import jwt
from fastapi_mail import FastMail, MessageSchema, MessageType
from src.config import RESEND_API_KEY, conf, bcrypt_context, SECRET_KEY, ALGORITHM
from src.services.usuario_service import create_token, authenticate

async def atualizar_via_email(dados, user_id, session):
    """Atualiza as informações do usuário após validação via e-mail."""
    # Busca o usuário no banco de dados utilizando o ID extraído do token
    usuario = session.get(Usuario, user_id)

    # Verifica se o usuário realmente foi encontrado no banco
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    # Valida a tentativa de alteração do nome de usuário (user_name)
    if dados.get("user_name"):
        # Consulta o banco para ver se o nome desejado já está em uso por outro usuário (com ID diferente)
        existe = session.query(Usuario).filter(
            Usuario.user_name == dados.get("user_name"),
            Usuario.user_id != user_id
        ).first()
        if existe:
            raise HTTPException(status_code=409, detail="Nome de usuário já cadastrado")

    # Verifica se o usuário solicitou alteração de senha
    if dados.get("user_senha"):
        # Criptografa a nova senha antes de armazená-la no banco de dados, utilizando o bcrypt
        dados["user_senha"] = bcrypt_context.hash(dados.get("user_senha"))

    # Itera sobre todos os dados enviados (nome, e-mail, senha, etc.)
    for key, value in dados.items():
        # Verifica se a classe Usuario possui esse atributo e se o valor fornecido não é nulo ou vazio
        if hasattr(usuario, key) and value is not None and value != "":
            setattr(usuario, key, value)

    # Confirma (commita) as alterações no banco de dados
    session.commit()

    # Atualiza a instância do usuário em memória com os dados mais recentes do banco
    session.refresh(usuario)

    return {"mensagem": "Dados da conta atualizados"}


async def verificar_2fa(codigo_digitado: str, token_2fa_str: str, session):
    """Verifica se o código digitado bate com o token 2FA gerado e autentica."""
    # Decodifica o token 2FA para extrair o user_id e o código correto
    try:
        payload = jwt.decode(token_2fa_str, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("user_id"))
        codigo_correto = payload.get("codigo")
    except Exception:
        raise HTTPException(status_code=401, detail="Token 2FA inválido ou expirado")

    # Compara o código informado pelo usuário com o código armazenado no token
    if codigo_digitado != codigo_correto:
        raise HTTPException(status_code=401, detail="Código de verificação incorreto")

    # Confirma que o usuário ainda existe no banco
    usuario = session.get(Usuario, user_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    # Gera os tokens de segurança para a sessão do usuário
    access_token = create_token(usuario.user_id)
    refresh_token = create_token(usuario.user_id, duracao_token=timedelta(days=7))

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "Bearer"
    }


async def verificar_via_email(session, token_str):
    """Efetiva o cadastro após o usuário clicar no link de verificação."""
    from sqlalchemy import or_

    try:
        payload = jwt.decode(token_str, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="O link de verificação expirou.")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Link de verificação inválido.")

    # Extrai os dados do payload
    nome = payload.get("nome")
    email = payload.get("email")
    senha_criptografada = payload.get("senha")

    # Valida se todos os dados necessários estão presentes no token
    if not nome or not email or not senha_criptografada:
        raise HTTPException(status_code=400, detail="Dados de cadastro incompletos no token.")

    # Verificação de segurança: garante que o nome ou e-mail não foram registrados
    # por outra pessoa enquanto o token estava pendente
    existe = session.query(Usuario).filter(
        or_(Usuario.user_name == nome, Usuario.user_email == email)
    ).first()
    if existe:
        raise HTTPException(
            status_code=409,
            detail="Este nome de usuário ou e-mail já foi validado por outra conta."
        )

    # Cria o registro definitivo no banco de dados com a conta já verificada
    novo_usuario = Usuario(
        name=nome,
        email=email,
        senha=senha_criptografada,
        verified=True
    )
    session.add(novo_usuario)
    session.commit()

    return {"message": "Sua conta foi verificada e criada com sucesso! Você já pode fazer login."}

def _gerar_html_email(titulo: str, subtitulo: str, texto_botao: str = None, link_botao: str = None, texto_rodape: str = "") -> str:
    """Gera um template HTML completo e estilizado para os e-mails."""
    botao_html = ""
    if texto_botao and link_botao:
        botao_html = f"""<a href="{link_botao}" style="display: inline-block; padding: 15px 30px; background-color: #28a745; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                            {texto_botao}
                        </a>"""

    return f"""
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{titulo}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f7f6; padding: 40px 0;">
            <tr>
                <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; max-width: 600px;">
                        <tr>
                            <td style="background-color: #28a745; padding: 30px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Consumo Sustentável</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px 30px; text-align: center;">
                                <h2 style="color: #333333; margin-top: 0; margin-bottom: 20px; font-size: 22px;">{titulo}</h2>
                                <p style="color: #555555; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                                    {subtitulo}
                                </p>
                                {botao_html}
                                <p style="margin-top: 40px; color: #999999; font-size: 13px; line-height: 1.4;">
                                    {texto_rodape}
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
                                <p style="color: #aaaaaa; font-size: 12px; margin: 0;">
                                    &copy; Consumo Sustentável. Todos os direitos reservados.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


async def _enviar_email_resend(destinatarios: list, assunto: str, corpo_html: str) -> bool:
    """Envia e-mail usando a API HTTP do Resend (porta 443), imune a bloqueios de rede em servidores cloud."""
    if not RESEND_API_KEY:
        print("RESEND_API_KEY não configurada. Pulando para fallback SMTP.")
        return False

    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json"
    }
    # Enquanto o domínio não for verificado no painel do Resend, utiliza o remetente padrão deles
    payload = {
        "from": "Consumo Sustentavel <onboarding@resend.dev>",
        "to": destinatarios,
        "subject": assunto,
        "html": corpo_html
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code in [200, 201]:
                print("E-mail enviado com sucesso via Resend!")
                return True
            else:
                print(f"Erro no Resend (status {response.status_code}): {response.text}")
                return False
    except Exception as e:
        print(f"Erro ao conectar no Resend: {e}")
        return False


def _enviar_email_sincrono(destinatarios: list, assunto: str, corpo_html: str):
    """Fallback de segurança: envia e-mail de forma síncrona via smtplib."""
    msg = EmailMessage()
    msg.set_content("Por favor, use um leitor de e-mail compatível com HTML.")
    msg.add_alternative(corpo_html, subtype="html")
    msg["Subject"] = assunto
    msg["From"] = conf.MAIL_FROM
    msg["To"] = ", ".join(destinatarios)

    try:
        if conf.MAIL_PORT == 465:
            server = smtplib.SMTP_SSL(conf.MAIL_SERVER, conf.MAIL_PORT, timeout=30)
        else:
            server = smtplib.SMTP(conf.MAIL_SERVER, conf.MAIL_PORT, timeout=30)
            if conf.MAIL_STARTTLS:
                server.starttls()

        server.login(conf.MAIL_USERNAME, conf.MAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print(f"Erro no envio síncrono (fallback SMTP): {e}")


async def _enviar_com_fallback(destinatarios: list, assunto: str, html: str, message: MessageSchema):
    """Orquestra as tentativas de envio: Resend -> FastMail assíncrono -> smtplib síncrono."""
    # Tentativa 1: Resend via HTTP (ideal para ambientes cloud como Render)
    if await _enviar_email_resend(destinatarios, assunto, html):
        return

    # Tentativa 2: FastMail (SMTP assíncrono)
    try:
        fm = FastMail(conf)
        await fm.send_message(message)
        return
    except Exception:
        pass

    # Tentativa 3: smtplib em thread separada (SMTP síncrono)
    await asyncio.to_thread(_enviar_email_sincrono, destinatarios, assunto, html)


# ==============================================================================
# FUNÇÕES PÚBLICAS DE ENVIO DE E-MAIL
# ==============================================================================

async def enviar_email_verificacao(emails: list, verification_token: str):
    """Envia o e-mail de verificação de conta contendo os dados assinados."""
    assunto = "Consumo Sustentável - Concluir Cadastro"

    html = _gerar_html_email(
        titulo="Confirme seu cadastro",
        subtitulo="Obrigado por iniciar seu cadastro! Clique no botão abaixo para verificar seu e-mail e concluir a criação da conta.",
        texto_botao="Confirmar Conta",
        link_botao=f"https://consumo-sustentavel.onrender.com/usuario/verify_via_email?token={verification_token}",
        texto_rodape="Se você não solicitou a criação desta conta, pode ignorar este e-mail."
    )

    message = MessageSchema(subject=assunto, recipients=emails, body=html, subtype=MessageType.html)
    await _enviar_com_fallback(emails, assunto, html, message)

    return {"message": "E-mail de verificação enviado"}


async def enviar_email_2fa(dados, session):
    """Verifica as credenciais e envia o e-mail contendo o código de verificação 2FA."""
    # Autentica o usuário antes de enviar o código
    busca = authenticate(dados.nome, dados.senha, session)
    if not busca:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    emails = [busca.user_email]
    assunto = "Consumo Sustentável - Código de Autenticação"

    # Gera um código numérico de 6 dígitos
    codigo_2fa = str(random.randint(100000, 999999))

    # Cria um token que guarda o user_id e o código gerado, válido por 10 minutos
    token_dados = {"user_id": busca.user_id, "codigo": codigo_2fa}
    token_2fa = create_token(token_dados, duracao_token=timedelta(minutes=10))

    html = _gerar_html_email(
        titulo="Código de Verificação",
        subtitulo=f"Seu código de acesso é:<br><br><span style='font-size: 32px; font-weight: bold; color: #28a745; letter-spacing: 4px;'>{codigo_2fa}</span>",
        texto_rodape="Se você não solicitou este código, por favor ignore este e-mail. Ele expira em 10 minutos."
    )

    message = MessageSchema(subject=assunto, recipients=emails, body=html, subtype=MessageType.html)
    await _enviar_com_fallback(emails, assunto, html, message)

    # Retorna o token 2FA para o frontend armazenar temporariamente
    return {"message": "Código de verificação enviado", "token_2fa": token_2fa}


async def enviar_email_exclusao(emails: list, user_id: int, session):
    """Envia o e-mail de confirmação para exclusão de conta."""
    # Confirma que o usuário alvo existe no banco
    busca = session.get(Usuario, user_id)
    if not busca:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    assunto = "Consumo Sustentável - Deletar Conta"
    verification_token = create_token(user_id)

    html = _gerar_html_email(
        titulo="Confirmar Exclusão",
        subtitulo="Sentiremos sua falta! Clique no botão abaixo para confirmar a exclusão de sua conta.",
        texto_botao="Excluir Conta",
        link_botao=f"https://consumo-sustentavel.onrender.com/usuario/delete_via_email?token={verification_token}",
        texto_rodape="Se você não solicitou a exclusão, pode ignorar este e-mail."
    )

    message = MessageSchema(subject=assunto, recipients=emails, body=html, subtype=MessageType.html)
    await _enviar_com_fallback(emails, assunto, html, message)

    return {"message": "E-mail de exclusão enviado"}


async def enviar_email_atualizacao(dados, emails: list, user_id: int, session):
    """Envia o e-mail de confirmação para atualização de informações cadastrais."""
    # Confirma que o requerente existe no banco
    busca = session.get(Usuario, user_id)
    if not busca:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    assunto = "Consumo Sustentável - Atualizar Conta"

    # Gera tokens que guardam quem está modificando (user_id) e O QUE está sendo modificado (dados)
    verification_token = create_token(user_id)
    verification_dados = create_token(dados)

    html = _gerar_html_email(
        titulo="Confirmar Atualização",
        subtitulo="Clique no botão abaixo para confirmar a atualização da sua conta.",
        texto_botao="Atualizar Conta",
        link_botao=f"https://consumo-sustentavel.onrender.com/usuario/update_via_email?token={verification_token}&dados={verification_dados}",
        texto_rodape="Se você não solicitou a atualização das informações, pode ignorar este e-mail."
    )

    message = MessageSchema(subject=assunto, recipients=emails, body=html, subtype=MessageType.html)
    await _enviar_com_fallback(emails, assunto, html, message)

    return {"message": "E-mail de atualização enviado"}