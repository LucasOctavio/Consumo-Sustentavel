from fastapi import HTTPException
from src.models.usuario_model import Usuario
from src.config import conf, bcrypt_context
from src.services.usuario_service import create_token, authenticate
from fastapi_mail import FastMail, MessageSchema, MessageType
from datetime import timedelta
from src.config import SECRET_KEY, ALGORITHM
from jose import jwt
import random

async def atualizar_via_email(dados, user_id, session):
    """Atualiza as informações do usuário após validação via e-mail."""
    
    # Busca o usuário no banco de dados utilizando o ID extraído do token
    usuario = session.get(Usuario, user_id)

    # Verifica se o usuário realmente foi encontrado no banco
    if not usuario:
        # Se não for encontrado, interrompe a execução e retorna um erro 404 (Not Found)
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Valida a tentativa de alteração do nome de usuário (user_name)
    if dados.get("user_name"):
        # Consulta o banco para ver se o nome desejado já está em uso por outro usuário (com ID diferente)
        existe = session.query(Usuario).filter(Usuario.user_name == dados.get("user_name"), Usuario.user_id != user_id).first()
        if existe:
            # Retorna um erro 409 (Conflict) informando que o nome não está disponível
            raise HTTPException(status_code=409, detail="Nome de usuário já cadastrado")

    # Verifica se o usuário solicitou alteração de senha
    if dados.get("user_senha"):
        # Criptografa a nova senha antes de armazená-la no banco de dados, utilizando o bcrypt
        dados["user_senha"] = bcrypt_context.hash(dados.get("user_senha"))

    # Itera sobre todos os dados enviados (nome, e-mail, senha, etc.)
    for key, value in dados.items():
        # Verifica se a classe Usuario possui esse atributo e se o valor fornecido não é nulo ou vazio
        if hasattr(usuario, key) and value is not None and value != "":
            # Atualiza o atributo do objeto usuário na memória
            setattr(usuario, key, value)
    
    # Confirma (commita) as alterações no banco de dados
    session.commit()
    
    # Atualiza a instância do usuário em memória com os dados mais recentes do banco
    session.refresh(usuario)

    # Retorna uma mensagem de sucesso
    return {"mensagem": "Dados da conta atualizados"}

async def verificar_2fa(codigo_digitado: str, token_2fa_str: str, session):
    """Verifica se o código digitado bate com o token 2FA gerado e autentica."""
    try:
        payload = jwt.decode(token_2fa_str, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("user_id"))
        codigo_correto = payload.get("codigo")
    except Exception:
        raise HTTPException(status_code=401, detail="Token 2FA inválido ou expirado")

    if codigo_digitado != codigo_correto:
        raise HTTPException(status_code=401, detail="Código de verificação incorreto")
    
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
    """Efetiva o cadastro após o usuário clicar no link."""
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

    if not nome or not email or not senha_criptografada:
        raise HTTPException(status_code=400, detail="Dados de cadastro incompletos no token.")

    # Verificação extra de segurança: garante que o nome ou email não foram registrados 
    # por outra pessoa enquanto o token estava pendente.
    existe = session.query(Usuario).filter(or_(Usuario.user_name == nome, Usuario.user_email == email)).first()
    if existe:
        raise HTTPException(status_code=409, detail="Este nome de usuário ou e-mail já foi validado por outra conta.")

    # Se estiver tudo certo, cria o registro definitivo no banco de dados
    novo_usuario = Usuario(nome, email, senha_criptografada, verified=True)
    
    # Salva a mudança no banco de dados
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

async def enviar_email_verificacao(emails, verification_token):
    """Envia o e-mail de verificação de conta contendo os dados assinados."""
    
    # Constrói o corpo do e-mail em formato HTML
    html = _gerar_html_email(
        titulo="Confirme seu cadastro",
        subtitulo="Obrigado por iniciar seu cadastro! Clique no botão abaixo para verificar seu e-mail e concluir a criação da conta.",
        texto_botao="Confirmar Conta",
        link_botao=f"http://127.0.0.1:8000/usuario/verify_via_email?token={verification_token}",
        texto_rodape="Se você não solicitou a criação desta conta, pode ignorar este e-mail."
    )

    # Cria a estrutura (Schema) da mensagem para a biblioteca FastMail
    message = MessageSchema(
        subject="Consumo Sustentável - Concluir Cadastro",  # Assunto do e-mail
        recipients=emails,  # Lista de destinatários
        body=html,  # Conteúdo
        subtype=MessageType.html)  # O tipo do conteúdo, neste caso HTML

    # Inicializa o gerenciador de envio instanciando o FastMail com a nossa configuração
    fm = FastMail(conf)
    
    # Envia o e-mail de forma assíncrona
    await fm.send_message(message)
    
    return {"message": "E-mail de verificação enviado"}

async def enviar_email_2fa(dados, session):
    """Verifica as credenciais e envia o e-mail contendo o código de verificação 2FA para o login."""
    
    # Verifica as credenciais antes de enviar o e-mail
    busca = authenticate(dados.nome, dados.senha, session)
    
    if not busca:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    user_id = busca.user_id
    emails = [busca.user_email]

    # Gera um código numérico de 6 dígitos
    codigo_2fa = str(random.randint(100000, 999999))

    # Cria um token que guarda o user_id e o código gerado, válido por 10 minutos
    token_dados = {"user_id": user_id, "codigo": codigo_2fa}
    token_2fa = create_token(token_dados, duracao_token=timedelta(minutes=10))

    # Formata o HTML do e-mail
    html = _gerar_html_email(
        titulo="Código de Verificação",
        subtitulo=f"Seu código de acesso é:<br><br><span style='font-size: 32px; font-weight: bold; color: #28a745; letter-spacing: 4px;'>{codigo_2fa}</span>",
        texto_rodape="Se você não solicitou este código, por favor ignore este e-mail. Ele expira em 10 minutos."
    )

    # Configura e envia a mensagem
    message = MessageSchema(
        subject="Consumo Sustentável - Código de Autenticação",
        recipients=emails,
        body=html,
        subtype=MessageType.html)

    fm = FastMail(conf)
    await fm.send_message(message)
    
    # Retorna o token 2FA para o frontend armazenar temporariamente
    return {"message": "Código de verificação enviado", "token_2fa": token_2fa}

async def enviar_email_exclusao(emails, user_id, session):
    """Envia o e-mail de confirmação para exclusão de conta."""
    
    # Confirma que o e-mail alvo existe no banco
    busca = session.get(Usuario, user_id)
    
    if not busca:
        raise HTTPException(status_code=404, detail="E-mail não cadastrado")

    # Gera o JWT que validará a solicitação de exclusão
    verification_token = create_token(user_id)
    
    # Cria a interface do e-mail alertando sobre o processo destrutivo
    html = _gerar_html_email(
        titulo="Confirmar Exclusão",
        subtitulo="Sentiremos sua falta! Clique no botão abaixo para confirmar a exclusão de sua conta.",
        texto_botao="Excluir Conta",
        link_botao=f"http://127.0.0.1:8000/usuario/delete_via_email?token={verification_token}",
        texto_rodape="Se você não solicitou a exclusão, pode ignorar este e-mail."
    )

    # Configura e envia a mensagem
    message = MessageSchema(
        subject="Consumo Sustentável - Deletar Conta",
        recipients=emails,
        body=html,
        subtype=MessageType.html)

    fm = FastMail(conf)
    await fm.send_message(message)
    return {"message": "E-mail de exclusão enviado"}

async def enviar_email_atualizacao(dados, emails, user_id, session):
    """Envia o e-mail de confirmação para atualização de informações cadastrais."""
    
    # Confirma que o e-mail do requerente existe no banco
    busca = session.get(Usuario, user_id)
    
    if not busca:
        raise HTTPException(status_code=404, detail="E-mail não cadastrado")

    # Gera tokens que guardam não só quem está modificando (user_id) mas O QUE está sendo modificado (dados)
    verification_token = create_token(user_id)
    verification_dados = create_token(dados)

    # Insere os dois tokens no link que realizará o patch na API no momento do clique
    html = _gerar_html_email(
        titulo="Confirmar Atualização",
        subtitulo="Clique no botão abaixo para confirmar a atualização da sua conta.",
        texto_botao="Atualizar Conta",
        link_botao=f"http://127.0.0.1:8000/usuario/update_via_email?token={verification_token}&dados={verification_dados}",
        texto_rodape="Se você não solicitou a atualização das informações, pode ignorar este e-mail."
    )

    # Criação do corpo de disparo do FastMail e execução da chamada
    message = MessageSchema(
        subject="Consumo Sustentável - Atualizar Conta",
        recipients=emails,
        body=html,
        subtype=MessageType.html)

    fm = FastMail(conf)
    await fm.send_message(message)
    return {"message": "E-mail de atualização enviado"}