from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.dependencia import pegar_sessao, verificar_token
from src.schemas.consumo_schema import ConsumoSchema, ConsumoUpdate
from src.models.usuario_model import Usuario
from src.services.consumo_service import listar_consumos, criar_consumo, deletar_consumo, atualizar_consumo

# Instancia um roteador específico para agrupar as operações de 'consumo'
# O uso de 'dependencies=[Depends(verificar_token)]' obriga que todas as rotas exijam um token válido
consumo_router = APIRouter(prefix="/consumo", tags=["consumo"], dependencies=[Depends(verificar_token)])

# Endpoint para leitura (GET) dos consumos cadastrados
@consumo_router.get("/read", summary='Ler consumo')
async def read(session: Session = Depends(pegar_sessao), usuario: Usuario = Depends(verificar_token)):
    '''\n \n \n Ler um consumo. \n \n \
    '''
    # Chama o serviço responsável por listar os consumos, repassando o usuário atual
    return listar_consumos(usuario, session)

# Endpoint para criação (POST) de um novo consumo
@consumo_router.post("/create", summary='Criar consumo')
async def create(dados: ConsumoSchema, session: Session = Depends(pegar_sessao), busca: Usuario = Depends(verificar_token)):
    '''\n \n \n Criar um consumo. \n \n \
    tipo = "str" \n \n \
    valor = int \n \n \
    medida = "str" \n \n \
    dt = "date" \n \n \
    simulado = "bool" \n \n \
    descricao = "str" \n \n \
    '''
    # Passa o payload validado (dados) para a função de serviço efetivar o cadastro no banco
    return criar_consumo(dados, session, busca)

# Endpoint para deleção (DELETE) de um consumo específico
@consumo_router.delete("/delete", summary='Deletar consumo')
async def delete(con_id: int, usuario: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Deletar um consumo. \n \n \
    id = int \n \n \
    '''
    # Aciona o serviço de deleção garantindo que o consumo pertence ao usuário que solicitou
    return deletar_consumo(con_id, session, usuario)

# Endpoint para atualização (PATCH) de dados do consumo
@consumo_router.patch("/update", summary='Atualizar consumo')
async def update(dados: ConsumoUpdate, busca: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Atualizar um consumo. \n \n \
    id = int \n \n \
    tipo = "str" \n \n \
    valor = int \n \n \
    medida = "str" \n \n \
    dt = "date" \n \n \
    simulado = "bool" \n \n \
    descricao = "str" \n \n \
    '''
    # Envia os dados opcionais recebidos para a função de atualização
    return atualizar_consumo(dados, busca.user_id, session)
