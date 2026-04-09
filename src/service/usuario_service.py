# importacao
from fastapi import HTTPException
from src.model.usuario_model import Usuario
from main import bcrypt_context, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTE, SECRET_KEY
from datetime import datetime, timedelta, timezone
from jose import jwt
from sqlalchemy import or_
from fastapi_mail import FastMail, MessageSchema, MessageType
from src.config.mail_config import conf

# NOTE - funcao de criar

def fun_criar(nome, email, senha, session):
    # busca no banco de dados se já tem esse email ou esse nome
    busca = session.query(Usuario).filter(or_(Usuario.user_email==email, Usuario.user_name==nome)).first()

    # se tiver
    if busca:
        # retorna mensagem de erro
        raise HTTPException(status_code=409, detail="Nome ou email já cadastrado")
    
    # se nao
    else:
        # criptografa senha
        senha_criptografada = bcrypt_context.hash(senha)

        # cria usuario
        novo_usuario = Usuario(nome, email, senha_criptografada)

        # adiciona no banco o usuario
        session.add(novo_usuario)

        # comita
        session.commit()
        return {"mensagem": "Conta cadastrada com sucesso"}
    
# NOTE - funcao de listar

def fun_listar(token, session):
    # depois de verificar o token, busca se tem esse id
    usuario = session.query(Usuario).filter(Usuario.user_id==token.user_id).first()

    # se existir esse token
    if usuario:
        # retorna as informacoes do usuario
        return {
            "user_id": usuario.user_id,
            "user_name": usuario.user_name,
            "user_email": usuario.user_email,
            "user_senha": usuario.user_senha,
            "user_verified": usuario.user_verified
        }
    
    # se nao
    else:
        # erro
        raise HTTPException(status_code=404, detail="Conta não encontrada")

# NOTE - funcao de logar

# funcao de logar conta
def fun_logar(nome, senha, session):
    # verifica se a senha e o nome esta correto
    busca = autenticar_usuario(nome, senha, session)

    # se nao tiver um usuario com esse nome e senha
    if not busca:
        # levanta aviso de erro
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    # se tiver algo
    else:
        # cria um token de acesso e um token de refresh
        access_token = criar_token(busca.user_id)
        refrush_token = criar_token(busca.user_id, duracao_token=timedelta(days=7))
        
        # e retorna token pro usuario
        return {
            "access_token": access_token,
            "refresh_token": refrush_token,
            "token_type": "Bearer"
        }

# funcao de logar no forms
def fun_login_form(dados_formulario, session):
    # verifica se a senha e o nome esta correto
    busca = autenticar_usuario(dados_formulario.username, dados_formulario.password, session)

    # se nao tiver um usuario com esse nome e senha
    if not busca:
        # levanta aviso de erro
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    # se tiver
    else:
        # cria um token de acesso
        access_token = criar_token(busca.user_id)

        # retorna o token
        return {
            "access_token": access_token,
            "token_type": "Bearer"
        }

# NOTE - funcao de deletar

def fun_delete(busca, session):
    # depois de verificar o token, busca se tem esse id
    usuario = session.query(Usuario).filter(Usuario.user_id==busca).first()

    # se existir esse token
    if usuario:
        # deleta o usuario com o id
        session.delete(usuario)

        # comita
        session.commit()
        return{"mensagem": "Conta deletada com sucesso"}
    
    # se nao
    else:
        # erro
        raise HTTPException(status_code=404, detail="Conta não encontrada")

# NOTE - funcao de autentificar/login

def autenticar_usuario(nome, senha, session):
    # busca o usuario no banco
    busca = session.query(Usuario).filter(Usuario.user_name==nome).first()

    # se nao tiver um usuario com esse nome
    if not busca:
        return False

    # se a senha estiver errada
    elif not bcrypt_context.verify(senha, busca.user_senha):
        return False

    # se a senha estiver certa e o usuario existir
    return busca

# NOTE - funcao de atualizar

def fun_atualizar(dados, user_id, session):
    # pega as informacoes do seu usuario
    usuario = session.get(Usuario, user_id)

    # se nao conseguir pegar as informacoes
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # se o usuario tiver passado informacao de atualizar nome do usuario
    if dados.user_name:
        # busca se o nome do usuario ja existe
        existe = session.query(Usuario).filter(Usuario.user_name == dados.user_name, Usuario.user_id != user_id).first()
        
        # se sim
        if existe:
            raise HTTPException(status_code=409, detail="Nome já cadastrado")

    # se o usuario tiver passado informacao de atualizar email do usuario
    if dados.user_email:
        # busca se o email do usuario ja existe
        existe = session.query(Usuario).filter(Usuario.user_email == dados.user_email, Usuario.user_id != user_id).first()

        # se sim
        if existe:
            raise HTTPException(status_code=409, detail="Email já cadastrado")

    # se o usuario tiver passado informacao de atualizar senha do usuario
    if dados.user_senha:
        # criptografa senha
        dados.user_senha = bcrypt_context.hash(dados.user_senha)

    # para cada informacao enviada pelo usuario
    for key, value in dados.dict(exclude_unset=True).items():
        # ele verifica se tem campos vazios nas informacoes passadas
        if hasattr(usuario, key):
            # defini as informacoes com as novas informacoes
            setattr(usuario, key, value)
    
    # comita
    session.commit()
    
    # atualiza o banco
    session.refresh(usuario)

    return {"mensagem": "Dados da conta atualizado"}

# NOTE - funcoes token 

# funcao de refresh token
def refresh_token(busca):
    # cria um token baseado no refresh token
    access_token = criar_token(busca.user_id)

    # retorna o token
    return {
            "access_token": access_token,
            "token_type": "Bearer"
        }

# funcao de criar token
def criar_token(id, duracao_token=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTE)):
    # defini a data de expiracao baseada no tempo definido para cada token
    data_expiracao = datetime.now(timezone.utc) + duracao_token

    # guarda as informacoes em um dicionario
    dic_info = {"user_id": str(id), "exp": data_expiracao}

    # codifica o dicionario gerando um token
    token = jwt.encode(dic_info, SECRET_KEY, ALGORITHM)

    # retorna o token
    return token

# NOTE - funcoes email verificacao

# funcao de verificar email
async def verificar_email_service(session, token):

    # busca se tem um usuario com esse id
    busca = session.query(Usuario).filter(Usuario.user_id == token).first()

    # se sim
    if busca:
        # e se ja for um usuario verifacado
        if busca.user_verified:
            # erro
            raise HTTPException(status_code=400, detail="Email já verificado")
        
        # se nao for um usuario verificado
        # altera o estado de verificado para verdadeiro
        busca.user_verified = True

        # comita no banco
        session.commit()

        # atualiza o banco
        session.refresh(busca)
        return {"message": "Email verificado com sucesso"}
    
    # se nao tiver um usuario com esse id
    else:
        # erro
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
         
# funcao para enviar email de verificao para o email
async def enviar_email_verificar(emails, user_id, session):

    # busca se tem um usuario com esse email
    busca = session.query(Usuario).filter(Usuario.user_email.in_(emails)).first()
    
    # se tiver
    if busca:
        # cria um token com o id do usuario
        verification_token = criar_token(user_id)
        
        # html do email enviado
        html = f"""
        <tr> 
            <td style="
            padding:30px;
            text-align:center;"> 
                <h2 style="
                color:#333;">Confirme seu email</h2> 
                <p style="
                color:#555;f
                ont-size:16px;"> Obrigado por criar sua conta! Clique no botão abaixo para verificar seu email. </p> 
                <a href="http://localhost:8000/usuario/verificar?token={verification_token}" 
                style="
                display:inline-block;
                margin-top:20px;
                padding:15px 25px;
                background-color:#28a745;
                color:#ffffff;
                text-decoration:none;
                border-radius:5px;
                font-weight:bold;"> Confirmar Conta </a> 
                <p style="
                margin-top:30px;
                color:#999;
                font-size:12px;"> Se você não criou essa conta, pode ignorar este email. </p> 
            </td> 
        </tr> """

        # schema de mensagem para ser enviado
        message = MessageSchema(
            subject="Consumo Sustentável - Verificação de Email",
            recipients=emails,
            body=html,
            subtype=MessageType.html)

        # configuracao do email remetente
        fm = FastMail(conf)

        # manda o email
        await fm.send_message(message)
        return {"message": "email enviado"}
    
    # se nao tiver um usuario com esse email
    else:
        raise HTTPException(status_code=404, detail="Email não cadastrado, verifique o email digitado")

# funcao para enviar email de confirmacao de deletar conta
async def enviar_email_deletar(emails, user_id, session):
    # busca se tem um usuario com esse email
    busca = session.query(Usuario).filter(Usuario.user_email.in_(emails)).first()
    
    # se tiver
    if busca:
        # cria um token
        verification_token = criar_token(user_id)
        
        # html do email enviado
        html = f"""
        <tr> 
            <td style="
            padding:30px;
            text-align:center;"> 
                <h2 style="
                color:#333;">Confirmar Exclusão</h2> 
                <p style="
                color:#555;f
                ont-size:16px;"> Sentiremos sua falta! Clique no botão abaixo para confirmar a exclusão de sua conta. </p> 
                <a href="http://localhost:8000/usuario/delete?token={verification_token}" 
                style="
                display:inline-block;
                margin-top:20px;
                padding:15px 25px;
                background-color:#28a745;
                color:#ffffff;
                text-decoration:none;
                border-radius:5px;
                font-weight:bold;"> Excluir Conta </a> 
                <p style="
                margin-top:30px;
                color:#999;
                font-size:12px;"> Se você não solicitou a exclusão, pode ignorar este email. </p> 
            </td> 
        </tr> """

        # schema do email enviado
        message = MessageSchema(
            subject="Consumo Sustentável - Deletar Conta",
            recipients=emails,
            body=html,
            subtype=MessageType.html)

        # configuracao do email remetente
        fm = FastMail(conf)
        
        # envia a mensagem
        await fm.send_message(message)
        
        return {"message": "email enviado"}
    
    # se nao tiver um usuario com esse email
    else:
        raise HTTPException(status_code=404, detail="Email não cadastrado, verifique o email digitado")