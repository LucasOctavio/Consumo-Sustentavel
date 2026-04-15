# importaçoes
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.dependencia import pegar_sessao, verificar_token
from src.schemas.consumo_schema import *
from src.models.usuario_model import Usuario
from src.services.consumo_service import *

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

@consumo_roteador.get("/read")
async def read(session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
    """
    Essa é a rota de ler os consumos cadastradas no usuario, ele pede um token
    """
    return fun_read(usuario, session)

# NOTE - rota de criar

@consumo_roteador.post("/create")
async def create(dados: ConsumoSchema, session: Session = Depends(pegar_sessao), busca: Usuario = Depends(verificar_token)):
    """
    Essa é a rota de criar um consumo, ela pede os dados do novo consumo e de um token
    """
    return fun_create(dados, session, busca)


# NOTE - rota de delete
@consumo_roteador.delete("/delete")
async def delete(con_id, usuario: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    """
    Essa é a rota de deletar um consumo, ela pede o id do consumo que deseja deletar e o token
    """
    return fun_delete(con_id, session, usuario)

# NOTE - rota de atualizar

@consumo_roteador.patch("/update")
async def update(dados: ConsumoUpdate, busca: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    """
    Essa é a rota de atualizar um consumo, ela pede os dados que deseja alterar do consumo, id do consumo e um token
    """
    return fun_update(dados, busca.user_id, session)
