# importaçoes
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.dependencia import pegar_sessao, verificar_token
from src.schemas.meta_schema import *
from src.models.usuario_model import Usuario
from src.services.meta_service import *

# defini o prefixo dele
meta_roteador = APIRouter(prefix="/meta", tags=["meta"], dependencies=[Depends(verificar_token)])

# NOTE - rota de listar

@meta_roteador.get("/read", summary='Ler meta')
async def read(session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
    '''\n \n \n Atualizar uma meta. \n \n \
    '''
    return fun_read(usuario, session)

# NOTE - rota de criar

@meta_roteador.post("/create", summary='Criar meta')
async def create(dados: MetaSchema, session: Session = Depends(pegar_sessao), busca: Usuario = Depends(verificar_token)):
    '''\n \n \n Criar uma meta. \n \n \
    tipo = str \n \n \
    valor = int \n \n \
    medida = str \n \n \
    dt_inicio = date \n \n \
    dt_fim = date \n \n \
    '''
    return fun_create(dados, session, busca)

# NOTE - rota de delete
@meta_roteador.delete("/delete", summary='Deletar meta')
async def delete(meta_id, usuario: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Deletar uma meta. \n \n \
    id = int \n \n \
    '''
    return fun_delete(meta_id, session, usuario)

# NOTE - rota de atualizar

@meta_roteador.patch("/update", summary='Atualizar meta')
async def update(dados: MetaUpdate, busca: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Atualizar uma meta. \n \n \
    id = int \n \n \
    tipo = str \n \n \
    valor = int \n \n \
    medida = str \n \n \
    dt_inicio = date \n \n \
    dt_fim = date \n \n \
    '''
    return fun_update(dados, busca.user_id, session)
    