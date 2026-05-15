# coding: utf-8
from fastapi import HTTPException
from src.models.usuario_model import Usuario
import asyncio
import base64
import httpx
import random
from datetime import timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from jose import jwt
from src.config import GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_FROM, bcrypt_context, SECRET_KEY, ALGORITHM
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
    
    try:
        session.add(novo_usuario)
        session.commit()
    except Exception:
        # Caso ocorra um erro de integridade (ex: nome/email duplicado no exato momento da inserção)
        session.rollback()
        raise HTTPException(
            status_code=409, 
            detail="Este nome de usuário ou e-mail já foi validado por outra conta."
        )

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


def gerar_html_feedback(titulo: str, mensagem: str, sucesso: bool = True) -> str:
    """Gera um HTML simples para exibição de feedback visual no navegador."""
    cor_status = "#28a745" if sucesso else "#dc3545"
    icone = "✓" if sucesso else "✕"
    
    return f"""
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{titulo}</title>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }}
            .container {{ background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); text-align: center; max-width: 450px; width: 90%; }}
            .icon {{ font-size: 70px; color: {cor_status}; margin-bottom: 20px; font-weight: bold; }}
            h1 {{ color: #333; margin-bottom: 15px; font-size: 28px; }}
            p {{ color: #666; line-height: 1.6; font-size: 18px; margin-bottom: 30px; }}
            .btn {{ display: inline-block; padding: 14px 35px; background-color: #28a745; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: transform 0.2s; }}
            .btn:hover {{ transform: scale(1.05); background-color: #218838; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="icon">{icone}</div>
            <h1>{titulo}</h1>
            <p>{mensagem}</p>
            <a href="https://consumo-sustentavel.onrender.com" class="btn">Voltar para o App</a>
        </div>
    </body>
    </html>
    """


async def _obter_access_token_gmail() -> str:
    """Obtém um access_token fresco usando o refresh_token do OAuth2 do Google."""
    url = "https://oauth2.googleapis.com/token"
    payload = {
        "client_id": GMAIL_CLIENT_ID,
        "client_secret": GMAIL_CLIENT_SECRET,
        "refresh_token": GMAIL_REFRESH_TOKEN,
        "grant_type": "refresh_token",
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(url, data=payload)
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Falha ao obter token do Gmail: {response.text}")
    return response.json()["access_token"]


async def _enviar_via_gmail_api(destinatarios: list, assunto: str, corpo_html: str):
    """Envia e-mail usando a Gmail REST API via HTTPS (porta 443). Funciona no Render."""
    access_token = await _obter_access_token_gmail()

    # Monta o e-mail no formato MIME
    mensagem = MIMEMultipart("alternative")
    mensagem["Subject"] = assunto
    mensagem["From"] = GMAIL_FROM
    mensagem["To"] = ", ".join(destinatarios)
    mensagem.attach(MIMEText("Por favor, use um leitor de e-mail compatível com HTML.", "plain"))
    mensagem.attach(MIMEText(corpo_html, "html"))

    # Codifica em base64 URL-safe conforme exigido pela Gmail API
    raw = base64.urlsafe_b64encode(mensagem.as_bytes()).decode()

    url = f"https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    payload = {"raw": raw}

    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=payload)

    if response.status_code not in [200, 201]:
        raise HTTPException(status_code=500, detail=f"Erro na Gmail API: {response.text}")

    print(f"E-mail enviado com sucesso via Gmail API para {destinatarios}")


async def _enviar_com_fallback(destinatarios: list, assunto: str, html: str, _message=None):
    """Envia e-mail via Gmail REST API (HTTPS — funciona no Render)."""
    try:
        await _enviar_via_gmail_api(destinatarios, assunto, html)
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERRO ao enviar via Gmail API: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao enviar e-mail: {str(e)}")

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

    await _enviar_com_fallback(emails, assunto, html)

    return {"message": "E-mail de verificação enviado"}


async def reenviar_email_verificacao(nome: str, email: str, senha: str, session):
    """Reenvia o link de verificação para uma conta ainda em processo de cadastro.

    Como o usuário só entra no banco APÓS verificar o e-mail, esta função recebe
    os dados originais, gera um novo token JWT e reenvia o link. Bloqueia o reenvio
    se o nome ou e-mail já foram verificados por uma conta existente.
    """
    from sqlalchemy import or_
    from datetime import timedelta

    # Verifica se o nome ou e-mail já foram confirmados no banco por alguém
    ja_verificado = session.query(Usuario).filter(
        or_(Usuario.user_email == email, Usuario.user_name == nome)
    ).first()

    if ja_verificado:
        raise HTTPException(
            status_code=409,
            detail="Esta conta já foi verificada. Faça login normalmente."
        )

    # Criptografa a senha novamente para gerar um token fresco com hash atualizado
    senha_criptografada = bcrypt_context.hash(senha)

    # Empacota os dados em um novo token JWT com validade de 24 horas
    dados_cadastro = {"nome": nome, "email": email, "senha": senha_criptografada}
    novo_token = create_token(dados_cadastro, duracao_token=timedelta(hours=24))

    # Reenvia o e-mail com o novo link de verificação
    await enviar_email_verificacao([email], novo_token)

    return {"message": "E-mail de verificação reenviado com sucesso. Verifique sua caixa de entrada."}


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

    await _enviar_com_fallback(emails, assunto, html)

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

    await _enviar_com_fallback(emails, assunto, html)

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

    await _enviar_com_fallback(emails, assunto, html)

    return {"message": "E-mail de atualização enviado"}


async def enviar_email_recuperacao_senha(email: str, session):
    """Verifica se o usuário existe e envia o e-mail contendo o código de recuperação."""
    busca = session.query(Usuario).filter(Usuario.user_email == email).first()
    
    if not busca:
        # Retornamos a mesma mensagem de sucesso mesmo se não existir por segurança (evitar enumerar contas)
        return {"message": "Se o e-mail estiver cadastrado, você receberá um código de recuperação."}

    emails = [busca.user_email]
    assunto = "Consumo Sustentável - Recuperação de Senha"

    # Gera um código numérico de 6 dígitos
    codigo_reset = str(random.randint(100000, 999999))

    # Cria um token que guarda o user_id e o código gerado, válido por 10 minutos
    token_dados = {"user_id": busca.user_id, "codigo": codigo_reset}
    token_reset = create_token(token_dados, duracao_token=timedelta(minutes=10))

    html = _gerar_html_email(
        titulo="Recuperação de Senha",
        subtitulo=f"Seu código para redefinir a senha é:<br><br><span style='font-size: 32px; font-weight: bold; color: #28a745; letter-spacing: 4px;'>{codigo_reset}</span>",
        texto_rodape="Se você não solicitou este código, por favor ignore este e-mail. Ele expira em 10 minutos."
    )

    await _enviar_com_fallback(emails, assunto, html)

    # Retorna o token para o frontend armazenar temporariamente e mandar junto com a nova senha
    return {"message": "Se o e-mail estiver cadastrado, você receberá um código de recuperação.", "token_reset": token_reset}


async def verificar_recuperacao_senha(codigo_digitado: str, token_reset_str: str, nova_senha: str, session):
    """Verifica o código de redefinição e atualiza a senha."""
    try:
        payload = jwt.decode(token_reset_str, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("user_id"))
        codigo_correto = payload.get("codigo")
    except Exception:
        raise HTTPException(status_code=401, detail="Token de recuperação inválido ou expirado")

    if codigo_digitado != codigo_correto:
        raise HTTPException(status_code=401, detail="Código de verificação incorreto")

    usuario = session.get(Usuario, user_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    # Criptografa e atualiza a senha
    usuario.user_senha = bcrypt_context.hash(nova_senha)
    session.commit()
    session.refresh(usuario)

    return {"message": "Senha redefinida com sucesso."}