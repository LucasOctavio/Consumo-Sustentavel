# importacao
from fastapi import HTTPException
from src.models.usuario_model import Usuario
from src.config import *
from datetime import datetime, timedelta, timezone
from jose import jwt
from sqlalchemy import or_

# NOTE - funcao de criar

def fun_sign_in(nome, email, senha, session):
    # busca no banco de dados se já tem esse email ou esse nome
    query = session.query(Usuario).filter(or_(Usuario.user_email==email, Usuario.user_name==nome)).first()

    # se tiver
    if query:
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

def fun_read(token, session):
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
def fun_login(nome, senha, session):
    # verifica se a senha e o nome esta correto
    busca = authenticate(nome, senha, session)

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

# funcao de logar no forms
def fun_login_form(dados_formulario, session):
    # verifica se a senha e o nome esta correto
    busca = authenticate(dados_formulario.username, dados_formulario.password, session)

    # se nao tiver um usuario com esse nome e senha
    if not busca:
        # levanta aviso de erro
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    # se tiver
    else:
        # cria um token de acesso
        access_token = create_token(busca.user_id)

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

def authenticate(nome, senha, session):
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

def fun_update(dados, user_id, session):
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
            raise HTTPException(status_code=409, detail="Já cadastrado")

    # se o usuario tiver passado informacao de atualizar email do usuario
    if dados.user_email:
        # busca se o email do usuario ja existe
        existe = session.query(Usuario).filter(Usuario.user_email == dados.user_email, Usuario.user_id != user_id).first()

        # se sim
        if existe:
            raise HTTPException(status_code=409, detail="Já cadastrado")

    # se o usuario tiver passado informacao de atualizar senha do usuario
    if dados.user_senha:
        # criptografa senha
        dados.user_senha = bcrypt_context.hash(dados.user_senha)

    # para cada informacao enviada pelo usuario
    for key, value in dados.dict(exclude_unset=True).items():
        # ele verifica se tem campos vazios nas informacoes passadas
        if hasattr(usuario, key) and value is not None and value != "":
            # defini as informacoes com as novas informacoes
            setattr(usuario, key, value)
    
    # comita
    session.commit()
    
    # atualiza o banco
    session.refresh(usuario)

    return {"mensagem": "Dados da conta atualizado"}

# NOTE - funcoes token 

# funcao de refresh token
def fun_refresh_token(busca):
    # cria um token baseado no refresh token
    access_token = create_token(busca.user_id)

    # retorna o token
    return {
            "access_token": access_token,
            "token_type": "Bearer"
        }

# funcao de criar token
def create_token(data, duracao_token=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTE)):
    # defini a data de expiracao baseada no tempo definido para cada token
    data_expiracao = datetime.now(timezone.utc) + duracao_token

    # permite gerar token para um id ou para um payload de dados
    if hasattr(data, "dict") and callable(data.dict):
        dic_info = data.dict(exclude_unset=True)
    elif isinstance(data, dict):
        dic_info = data.copy()
    else:
        dic_info = {"user_id": str(data)}

    # adiciona expiração ao payload
    dic_info["exp"] = data_expiracao

    # codifica o dicionario gerando um token
    token = jwt.encode(dic_info, SECRET_KEY, ALGORITHM)

    # retorna o token
    return token