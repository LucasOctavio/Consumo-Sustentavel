# importacao
from fastapi import HTTPException
from src.model.usuario_model import Usuario
from main import bcrypt_context, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTE, SECRET_KEY
from datetime import datetime, timedelta, timezone
from jose import jwt
from sqlalchemy import or_


# NOTE - funcao de criar

def fun_criar(nome, email, senha, session):
    # busca no banco de dados se já tem esse email ou esse nome
    busca = session.query(Usuario).filter(or_(Usuario.user_email==email, Usuario.user_name==nome)).first()

    # se tiver
    if busca:
        # retorna mensagem de erro
        raise HTTPException(status_code=400, detail="Esse nome ou email, já é cadastrado")
    
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
    
# NOTE - funcao de logar

# funcao de logar conta
def fun_logar(nome, senha, session):
    # busca no banco
    busca = autenticar_usuario(nome, senha, session)

    # se nao tiver nada na busca
    if not busca:
        # levanta aviso de erro
        raise HTTPException(status_code=400, detail="Usuario nao encontrado ou credenciais invalidas")
    
    # se tiver algo
    else:
        # cria um token de acesso e um token de refresh
        access_token = criar_token(busca.user_id)
        refrush_token = criar_token(busca.user_id, duracao_token=timedelta(days=7))
        
        # e retorna e token pro usuario
        return {
            "access_token": access_token,
            "refresh_token": refrush_token,
            "token_type": "Bearer"
        }

# funcao de logar no forms
def fun_login_form(dados_formulario, session):
    # busca no banco
    busca = autenticar_usuario(dados_formulario.username, dados_formulario.password, session)

    # se nao tiver nada na busca
    if not busca:
        # levanta aviso de erro
        raise HTTPException(status_code=400, detail="Usuario nao encontrado ou credenciais invalidas")
    
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
    # depois de verificar o token busca se tem esse id
    buscar = session.query(Usuario).filter(Usuario.user_id==busca.user_id).first()

    # se existir esse token
    if buscar:
        # deleta o usuario com o id
        session.delete(buscar)

        # comita
        session.commit()
        return{"mensagem": "Conta deletada com sucesso"}
    
    # se nao
    else:
        # erro
        raise HTTPException(status_code=400, detail="essa conta nao existe")

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
    usuario = session.get(Usuario, user_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    if dados.user_name:
        existe = session.query(Usuario).filter(Usuario.user_name == dados.user_name, Usuario.user_id != user_id).first()
        if existe:
            raise HTTPException(status_code=400, detail="Nome já cadastrado para outro usuário")

    if dados.user_email:
        existe = session.query(Usuario).filter(Usuario.user_email == dados.user_email, Usuario.user_id != user_id).first()
        if existe:
            raise HTTPException(status_code=400, detail="Email já cadastrado para outro usuário")

    if dados.user_senha:
        # criptografa senha
        dados.user_senha = bcrypt_context.hash(dados.user_senha)

    for key, value in dados.dict(exclude_unset=True).items():
        if hasattr(usuario, key):
            setattr(usuario, key, value)
    
    session.commit()
    
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

    return token