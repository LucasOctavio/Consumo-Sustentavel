# importaçoes
from sqlalchemy.orm import sessionmaker, Session
from fastapi import Depends, HTTPException, Query
from src.models.usuario_model import Usuario
from jose import jwt, JWTError
from dotenv import load_dotenv
from src.config import SECRET_KEY, ALGORITHM, oauth2_schema
from src.conexao import engine

# funcao de sessao
def pegar_sessao():

    load_dotenv()

    # tenta iniciar uma sessao
    try:
        # cria sesao
        Session = sessionmaker(bind=engine)
        session = Session() 
        
        # retorna a sessao sem terminar a funcao
        yield session

    # roda independente de dar errado ou nao
    finally:
        # fecha sesao 
        session.close()

# verificar token
def verificar_token(token: str = Depends(oauth2_schema), session: Session = Depends(pegar_sessao)):
    # tenta
    try:
        # decodificar o token
        dic_info = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # pega o id do token
        user_id = int(dic_info.get("user_id"))

    # erro ao tentar entrar com o token errado
    except JWTError:
        raise HTTPException(status_code=401, detail="Acesso Negado, verifique a validade do token")

    # busca o usuario com o id do token
    usuario = session.query(Usuario).filter(Usuario.user_id==user_id).first()

    # se nao tiver um usuario
    if not usuario:
        raise HTTPException(status_code=401, detail="Acesso Invalido")

    # retorna o usuario
    return usuario

# verificar token por url
def verificar_token_query(token: str = Query(...), session: Session = Depends(pegar_sessao)):
    # tenta
    try:
        # decodificar o token
        dic_info = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # pega o id do token
        user_id = int(dic_info.get("user_id"))

    # erro ao tentar entrar com o token errado
    except JWTError:
        raise HTTPException(status_code=401, detail="Acesso Negado, verifique a validade do token")

    # busca o usuario com o id do token
    usuario = session.query(Usuario).filter(Usuario.user_id==user_id).first()

    # se nao tiver um usuario
    if not usuario:
        raise HTTPException(status_code=401, detail="Acesso Invalido")

    # retorna o usuario
    return usuario

# verificar dados de atualização codificados na URL
def verificar_dados_query(dados: str = Query(...), session: Session = Depends(pegar_sessao)):
    # tenta
    try:
        # decodificar o token que contém os dados de atualização
        dic_info = jwt.decode(dados, SECRET_KEY, algorithms=[ALGORITHM])

    # erro ao tentar entrar com o token errado
    except JWTError:
        raise HTTPException(status_code=401, detail="Acesso Negado, verifique a validade do token")

    # remove campos de expiração antes de retornar os dados
    dic_info.pop("exp", None)
    return dic_info