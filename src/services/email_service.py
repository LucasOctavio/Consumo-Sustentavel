# importacao
from fastapi import HTTPException
from src.models.usuario_model import Usuario
from src.config import *
from src.services.usuario_service import create_token
from fastapi_mail import FastMail, MessageSchema, MessageType
from src.services.usuario_service import authenticate
from datetime import timedelta

# NOTE - funcoes de alterar informacoes usando email

# funcao de atualizar email
def fun_update_via_email(dados, user_id, session):
    # pega as informacoes do seu usuario
    usuario = session.get(Usuario, user_id)

    # se nao conseguir pegar as informacoes
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # se o usuario tiver passado informacao de atualizar nome do usuario
    if dados.get("user_name"):
        # busca se o nome do usuario ja existe
        existe = session.query(Usuario).filter(Usuario.user_name == dados.get("user_name"), Usuario.user_id != user_id).first()
        
        # se sim
        if existe:
            raise HTTPException(status_code=409, detail="Já cadastrado")

    # se o usuario tiver passado informacao de atualizar email do usuario
    if dados.get("user_email"):
        # busca se o email do usuario ja existe
        existe = session.query(Usuario).filter(Usuario.user_email == dados.get("user_email"), Usuario.user_id != user_id).first()

        # se sim
        if existe:
            raise HTTPException(status_code=409, detail="Já cadastrado")

    # se o usuario tiver passado informacao de atualizar senha do usuario
    if dados.get("user_senha"):
        # criptografa senha
        dados["user_senha"] = bcrypt_context.hash(dados.get("user_senha"))

    # para cada informacao enviada pelo usuario
    for key, value in dados.items():
        # ele verifica se tem campos vazios nas informacoes passadas
        if hasattr(usuario, key):
            # defini as informacoes com as novas informacoes
            setattr(usuario, key, value)
    
    # comita
    session.commit()
    
    # atualiza o banco
    session.refresh(usuario)

    return {"mensagem": "Dados da conta atualizado"}

# funcao de permitir a entrada na conta
async def fun_login_via_email(dados, token, session):
    # busca se tem um usuario com esse id
    usuario = session.get(Usuario, token)

    if usuario:
        # verifica se a senha e o nome esta correto
        busca = authenticate(dados.get("nome"), dados.get("senha"), session)

        # se nao tiver um usuario com esse nome e senha
        if not busca:
            # levanta aviso de erro
            raise HTTPException(status_code=401, detail="Credenciais inválidas")
        
        # se tiver algo
        else:
            # cria um token de acesso e um token de refresh
            access_token = create_token(busca.user_id)
            refrush_token = create_token(busca.user_id, duracao_token=timedelta(days=7))
            
            # e retorna token pro usuario
            return {
                "access_token": access_token,
                "refresh_token": refrush_token,
                "token_type": "Bearer"
            }
    
    else:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

# funcao de verificar email
async def fun_verify_via_email(session, token):

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
         
# NOTE - funcoes de mandar email

# funcao para enviar email de verificao para o email
async def fun_send_verify_email(emails, user_id, session):

    # busca se tem um usuario com esse email
    busca = session.query(Usuario).filter(Usuario.user_email.in_(emails)).first()
    
    # se tiver
    if busca:
        # cria um token com o id do usuario
        verification_token = create_token(user_id)
        
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
                <a href="https://consumo-sustentavel.onrender.com/usuario/verify_via_email?token={verification_token}" 
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

# funcao para enviar email de verificao para o email
async def fun_send_login_email(emails, user_id, dados, session):

    # busca se tem um usuario com esse email
    busca = session.query(Usuario).filter(Usuario.user_email.in_(emails)).first()
    
    # se tiver
    if busca:
        # cria um token com o id do usuario
        verification_token = create_token(user_id)
        verification_dados = create_token(dados)

        # html do email enviado
        html = f"""
        <tr> 
            <td style="
            padding:30px;
            text-align:center;"> 
                <h2 style="
                color:#333;">Permitir entrada</h2> 
                <p style="
                color:#555;f
                ont-size:16px;"> Clique no botão abaixo para permitir a entrada na conta. </p> 
                <a href="https://consumo-sustentavel.onrender.com/usuario/login_via_email?token={verification_token}&dados={verification_dados}" 
                style="
                display:inline-block;
                margin-top:20px;
                padding:15px 25px;
                background-color:#28a745;
                color:#ffffff;
                text-decoration:none;
                border-radius:5px;
                font-weight:bold;"> Entrar na Conta </a> 
                <p style="
                margin-top:30px;
                color:#999;
                font-size:12px;"> Se você não pediu para entrar nessa conta, pode ignorar este email. </p> 
            </td> 
        </tr> """

        # schema de mensagem para ser enviado
        message = MessageSchema(
            subject="Consumo Sustentável - Permitir entrada",
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
async def fun_send_delete_email(emails, user_id, session):
    # busca se tem um usuario com esse email
    busca = session.query(Usuario).filter(Usuario.user_email.in_(emails)).first()
    
    # se tiver
    if busca:
        # cria um token
        verification_token = create_token(user_id)
        
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
                <a href="https://consumo-sustentavel.onrender.com/usuario/delete_via_email?token={verification_token}" 
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
    
# funcao para enviar email de confirmacao de atualizar conta
async def fun_send_update_email(dados, emails, user_id, session):
    # busca se tem um usuario com esse email
    busca = session.query(Usuario).filter(Usuario.user_email.in_(emails)).first()
    
    # se tiver
    if busca:
        # cria um token
        verification_token = create_token(user_id)
        verification_dados = create_token(dados)

        # html do email enviado
        html = f"""
        <tr> 
            <td style="
            padding:30px;
            text-align:center;"> 
                <h2 style="
                color:#333;">Confirmar atualização</h2> 
                <p style="
                color:#555;f
                ont-size:16px;"> Clique no botão abaixo para confirmar a atualização da sua conta. </p> 
                <a href="https://consumo-sustentavel.onrender.com/usuario/update_via_email?token={verification_token}&dados={verification_dados}" 
                style="
                display:inline-block;
                margin-top:20px;
                padding:15px 25px;
                background-color:#28a745;
                color:#ffffff;
                text-decoration:none;
                border-radius:5px;
                font-weight:bold;"> Atualizar Conta </a> 
                <p style="
                margin-top:30px;
                color:#999;
                font-size:12px;"> Se você não solicitou a atualização das informações, pode ignorar este email. </p> 
            </td> 
        </tr> """

        # schema do email enviado
        message = MessageSchema(
            subject="Consumo Sustentável - Atualizar Conta",
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