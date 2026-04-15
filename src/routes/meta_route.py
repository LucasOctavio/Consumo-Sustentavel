# importaçoes
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.dependencia import pegar_sessao, verificar_token
from src.schemas.meta_schema import *
from src.models.usuario_model import Usuario
from src.services.meta_service import *

# defini o prefixo dele
meta_roteador = APIRouter(prefix="/meta", tags=["meta"], dependencies=[Depends(verificar_token)])

# rota inicial
@meta_roteador.get("/")
async def meta():
    """
    Essa é a rota de meta
    """
    return {"mensagem": "Você entrou na rota de meta"}

# NOTE - rota de listar

@meta_roteador.get("/read")
async def read(session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
    """
    Essa é a rota de ler as metas cadastradas no usuario, ele pede um token
    """
    return fun_read(usuario, session)

# NOTE - rota de criar

@meta_roteador.post("/create")
async def create(dados: MetaSchema, session: Session = Depends(pegar_sessao), busca: Usuario = Depends(verificar_token)):
    """
    Essa é a rota de criar uma meta, ela pede os dados da nova meta e de um token
    """
    return fun_create(dados, session, busca)

# NOTE - rota de delete
@meta_roteador.delete("/delete")
async def delete(meta_id, usuario: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    """
    Essa é a rota de deletar uma meta, ela pede o id da meta que deseja deletar e o token
    """
    return fun_delete(meta_id, session, usuario)

# NOTE - rota de atualizar

@meta_roteador.patch("/update")
async def update(dados: MetaUpdate, busca: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    """
    Essa é a rota de atualizar uma meta, ela pede os dados que deseja alterar da meta, id da meta e um token
    """
    return fun_update(dados, busca.user_id, session)
