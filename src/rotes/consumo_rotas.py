# importaçoes
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.dependencia import pegar_sessao, verificar_token
from src.schemas.consumo_schema import *
from src.model.usuario_model import Usuario
from src.service.consumo_service import *

# defini o prefixo dele
consumo_roteador = APIRouter(prefix="/consumo", tags=["consumo"], dependencies=[Depends(verificar_token)])

# rota inicial
@consumo_roteador.get("/")
async def consumo():
    """
    Essa é a rota de consumo
    """
    return {"mensagem": "Você entrou na rota de consumo"}

# NOTE - rota de listar

@consumo_roteador.get("/lista")
async def lista_consumo(session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
    return fun_listar(usuario, session)

# NOTE - rota de criar

@consumo_roteador.post("/criar")
async def criar_consumo(dados: ConsumoSchema, session: Session = Depends(pegar_sessao), busca: Usuario = Depends(verificar_token)):
    return fun_criar(dados, session, busca)


# NOTE - rota de delete
@consumo_roteador.delete("/delete")
async def delete_consumo(con_id, usuario: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    return fun_delete(con_id, session, usuario)

# NOTE - rota de atualizar

@consumo_roteador.patch("/atualizar")
async def atualizar_consumo(dados: ConsumoUpdate, busca: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    return fun_atualizar(dados, busca.user_id, session)
