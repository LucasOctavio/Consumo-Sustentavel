from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.dependencia import pegar_sessao, verificar_token
from src.schemas.meta_schema import MetaSchema, MetaUpdate
from src.models.usuario_model import Usuario
from src.services.meta_service import listar_metas, criar_meta, deletar_meta, atualizar_meta

# Instancia o roteador para o escopo de 'meta'. Exige autenticação global para este módulo
meta_router = APIRouter(prefix="/meta", tags=["meta"], dependencies=[Depends(verificar_token)])

# Endpoint para listar as metas associadas à conta
@meta_router.get("/read", summary='Ler meta')
async def read(session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
    '''\n \n \n Ler as metas da conta. \n \n \
    '''
    # Devolve a lista de metas chamando o serviço correspondente
    return listar_metas(usuario, session)

# Endpoint para inserir uma nova meta
@meta_router.post("/create", summary='Criar meta')
async def create(dados: MetaSchema, session: Session = Depends(pegar_sessao), busca: Usuario = Depends(verificar_token)):
    '''\n \n \n Criar uma meta. \n \n \
    tipo = "str" \n \n \
    valor = int \n \n \
    medida = "str" \n \n \
    dt_inicio = "date" \n \n \
    dt_fim = "date" \n \n \
    descricao = "str" \n \n \
    '''
    # Direciona os dados do corpo da requisição e o usuário autenticado para o construtor da meta
    return criar_meta(dados, session, busca)

# Endpoint para remover uma meta
@meta_router.delete("/delete", summary='Deletar meta')
async def delete(meta_id: int, usuario: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Deletar uma meta. \n \n \
    id = int \n \n \
    '''
    # Repassa o ID alvo e a identidade do usuário para verificação e exclusão
    return deletar_meta(meta_id, session, usuario)

# Endpoint para alterar propriedades de uma meta existente
@meta_router.patch("/update", summary='Atualizar meta')
async def update(dados: MetaUpdate, busca: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Atualizar uma meta. \n \n \
    id = int \n \n \
    tipo = "str" \n \n \
    valor = int \n \n \
    medida = "str" \n \n \
    dt_inicio = "date" \n \n \
    dt_fim = "date" \n \n \
    descricao = "str" \n \n \
    '''
    # Encaminha a solicitação de edição para o serviço correspondente
    return atualizar_meta(dados, busca.user_id, session)