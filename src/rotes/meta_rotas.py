# importaçoes
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.dependencia import pegar_sessao, verificar_token
from src.schema import *
from src.model.usuario_model import Usuario
from src.service.meta_service import *

# defini o prefixo dele
meta_roteador = APIRouter(prefix="/meta", tags=["meta"], dependencies=[Depends(verificar_token)])

# rota inicial
@meta_roteador.get("/")
async def meta():
    """
    Essa é a rota de meta
    """
    return {"mensagem": "Você entrou na rota de meta"}

# NOTE - rota de criar

@meta_roteador.post("/criar")
async def criar_meta(dados: MetaSchema, session: Session = Depends(pegar_sessao), busca: Usuario = Depends(verificar_token)):
    return fun_criar(dados, session, busca)

# NOTE - rota de listar

@meta_roteador.get("/lista")
async def lista_meta(session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
    return fun_listar(usuario, session)

# NOTE - rota de delete
@meta_roteador.delete("/delete")
async def delete_meta(meta_id, usuario: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    return fun_delete(meta_id, session, usuario)

# NOTE - rota de atualizar

@meta_roteador.patch("/atualizar")
async def atualizar_meta(dados: MetaUpdate, busca: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    return fun_atualizar(dados, busca.user_id, session)
