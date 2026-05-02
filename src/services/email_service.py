from fastapi import HTTPException
from src.models.usuario_model import Usuario
from src.config import conf, bcrypt_context
from src.services.usuario_service import create_token, authenticate
from fastapi_mail import FastMail, MessageSchema, MessageType
from datetime import timedelta

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

async def autenticar_via_email(dados, token, session):
    """Realiza o login do usuário após confirmação via e-mail."""
    
    # Obtém o usuário no banco usando o ID do token de e-mail
    usuario = session.get(Usuario, token)

    # Se o usuário não existir, levanta um erro 404
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    # Utiliza a função authenticate para verificar se o nome e a senha (decodificados do token) estão corretos
    busca = authenticate(dados.get("nome"), dados.get("senha"), session)

    # Se as credenciais estiverem incorretas, bloqueia o acesso com erro 401 (Unauthorized)
    if not busca:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    # Gera os tokens de segurança para a sessão do usuário
    # Cria o token de acesso principal (Access Token)
    access_token = create_token(busca.user_id)
    # Cria um token de renovação (Refresh Token) com validade maior (ex: 7 dias)
    refresh_token = create_token(busca.user_id, duracao_token=timedelta(days=7))
    
    # Retorna as chaves geradas para o cliente frontend utilizar nas próximas requisições
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "Bearer"
    }

async def verificar_via_email(session, token):
    """Marca o e-mail do usuário como verificado."""
    
    # Busca o usuário a partir do token contido no link clicado no e-mail
    busca = session.query(Usuario).filter(Usuario.user_id == token).first()

    # Verifica se o usuário foi encontrado
    if not busca:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
    # Verifica se o e-mail deste usuário já consta como verificado (user_verified == True)
    if busca.user_verified:
        # Retorna um erro 400 (Bad Request) informando que não é necessário verificar novamente
        raise HTTPException(status_code=400, detail="E-mail já verificado")
    
    # Altera o status da conta para 'verificada'
    busca.user_verified = True
    
    # Salva a mudança no banco de dados e recarrega a instância
    session.commit()
    session.refresh(busca)
    
    return {"message": "E-mail verificado com sucesso"}

def _gerar_html_email(titulo: str, subtitulo: str, texto_botao: str, link_botao: str, texto_rodape: str) -> str:
    """Gera um template HTML completo e estilizado para os e-mails."""
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
                                <a href="{link_botao}" style="display: inline-block; padding: 15px 30px; background-color: #28a745; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                                    {texto_botao}
                                </a>
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

async def enviar_email_verificacao(emails, user_id, session):
    """Envia o e-mail de verificação de conta."""
    
    # Checa no banco se o e-mail digitado pertence a algum usuário cadastrado
    busca = session.query(Usuario).filter(Usuario.user_email.in_(emails)).first()
    
    # Se não encontrar, retorna erro 404
    if not busca:
        raise HTTPException(status_code=404, detail="E-mail não cadastrado")

    # Gera um Token JWT exclusivo contendo o ID do usuário, para colocar no link
    verification_token = create_token(user_id)
    
    # Constrói o corpo do e-mail em formato HTML
    # Note que injetamos o 'verification_token' diretamente na tag <a> do link
    html = _gerar_html_email(
        titulo="Confirme seu e-mail",
        subtitulo="Obrigado por criar sua conta! Clique no botão abaixo para verificar seu e-mail.",
        texto_botao="Confirmar Conta",
        link_botao=f"https://consumo-sustentavel.onrender.com/usuario/verify_via_email?token={verification_token}",
        texto_rodape="Se você não criou essa conta, pode ignorar este e-mail."
    )

    # Cria a estrutura (Schema) da mensagem para a biblioteca FastMail
    message = MessageSchema(
        subject="Consumo Sustentável - Verificação de E-mail",  # Assunto do e-mail
        recipients=emails,  # Lista de destinatários
        body=html,  # Conteúdo
        subtype=MessageType.html)  # O tipo do conteúdo, neste caso HTML

    # Inicializa o gerenciador de envio instanciando o FastMail com a nossa configuração
    fm = FastMail(conf)
    
    # Envia o e-mail de forma assíncrona
    await fm.send_message(message)
    
    return {"message": "E-mail de verificação enviado"}

async def enviar_email_login(emails, user_id, dados, session):
    """Envia o e-mail para permitir o login na conta."""
    
    # Busca o usuário pelo e-mail
    busca = session.query(Usuario).filter(Usuario.user_email.in_(emails)).first()
    
    if not busca:
        raise HTTPException(status_code=404, detail="E-mail não cadastrado")

    # Cria um token para o usuário (identidade) e um token específico para as credenciais (dados de login)
    verification_token = create_token(user_id)
    verification_dados = create_token(dados)

    # Formata o HTML contendo os DOIS tokens (token e dados) no parâmetro do link
    html = _gerar_html_email(
        titulo="Permitir Entrada",
        subtitulo="Clique no botão abaixo para permitir a entrada na conta.",
        texto_botao="Entrar na Conta",
        link_botao=f"https://consumo-sustentavel.onrender.com/usuario/login_via_email?token={verification_token}&dados={verification_dados}",
        texto_rodape="Se você não pediu para entrar nessa conta, pode ignorar este e-mail."
    )

    # Configura e envia a mensagem
    message = MessageSchema(
        subject="Consumo Sustentável - Permitir Entrada",
        recipients=emails,
        body=html,
        subtype=MessageType.html)

    fm = FastMail(conf)
    await fm.send_message(message)
    return {"message": "E-mail de login enviado"}

async def enviar_email_exclusao(emails, user_id, session):
    """Envia o e-mail de confirmação para exclusão de conta."""
    
    # Confirma que o e-mail alvo existe no banco
    busca = session.query(Usuario).filter(Usuario.user_email.in_(emails)).first()
    
    if not busca:
        raise HTTPException(status_code=404, detail="E-mail não cadastrado")

    # Gera o JWT que validará a solicitação de exclusão
    verification_token = create_token(user_id)
    
    # Cria a interface do e-mail alertando sobre o processo destrutivo
    html = _gerar_html_email(
        titulo="Confirmar Exclusão",
        subtitulo="Sentiremos sua falta! Clique no botão abaixo para confirmar a exclusão de sua conta.",
        texto_botao="Excluir Conta",
        link_botao=f"https://consumo-sustentavel.onrender.com/usuario/delete_via_email?token={verification_token}",
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
    busca = session.query(Usuario).filter(Usuario.user_email.in_(emails)).first()
    
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
        link_botao=f"https://consumo-sustentavel.onrender.com/usuario/update_via_email?token={verification_token}&dados={verification_dados}",
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