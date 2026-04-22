# importaçoes
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.dependencia import pegar_sessao, verificar_token
from src.schemas.consumo_schema import *
from src.models.usuario_model import Usuario
from src.services.consumo_service import *

# defini o prefixo dele
consumo_roteador = APIRouter(prefix="/consumo", tags=["consumo"], dependencies=[Depends(verificar_token)])

# NOTE - rota de listar

@consumo_roteador.get("/read", summary='Ler consumo')
async def read(session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
    '''\n \n \n Ler um consumo. \n \n \
    '''
    return fun_read(usuario, session)

# NOTE - rota de criar

@consumo_roteador.post("/create", summary='Criar consumo')
async def create(dados: ConsumoSchema, session: Session = Depends(pegar_sessao), busca: Usuario = Depends(verificar_token)):
    '''\n \n \n Criar um consumo. \n \n \
    tipo = str \n \n \
    valor = int \n \n \
    medida = str \n \n \
    dt = date \n \n \
    simulado = bool \n \n \
    '''
    return fun_create(dados, session, busca)


# NOTE - rota de delete
@consumo_roteador.delete("/delete", summary='Deletar consumo')
async def delete(con_id, usuario: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Deletar um consumo. \n \n \
    id = int \n \n \
    '''
    return fun_delete(con_id, session, usuario)

# NOTE - rota de atualizar

@consumo_roteador.patch("/update", summary='Atualizar consumo')
async def update(dados: ConsumoUpdate, busca: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Atualizar um consumo. \n \n \
    id = int \n \n \
    tipo = str \n \n \
    valor = int \n \n \
    medida = str \n \n \
    dt = date \n \n \
    simulado = bool \n \n \
    '''
    return fun_update(dados, busca.user_id, session)
