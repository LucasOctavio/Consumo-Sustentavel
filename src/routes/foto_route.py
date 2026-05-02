from fastapi import APIRouter, Depends, UploadFile, File
from src.services.foto_service import obter_foto, salvar_foto, atualizar_foto, deletar_foto
from src.dependencia import pegar_sessao, verificar_token
from src.models.usuario_model import Usuario
from sqlalchemy.orm import Session

# Cria um agrupamento de rotas para o envio e obtenção da foto de perfil
foto_router = APIRouter(prefix="/foto", tags=["foto"])

# Endpoint que recebe o arquivo de foto e o envia para o banco
@foto_router.post("/create", summary='Adicionar foto da conta')
async def create_foto(foto: UploadFile = File(...), token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Adicionar a foto de uma conta. \n \n \
    foto = "UploadFile" \n \n \
    '''
    # Extrai o arquivo binário enviado no multipart/form-data
    foto_bytes = await foto.read()
    
    # Aciona a função que fará a atribuição dos bytes ao usuário no banco
    return salvar_foto(token, foto_bytes, session)

# Endpoint que serve o arquivo binário (imagem JPEG) guardado no banco
@foto_router.get("/read", summary='Ler foto da conta')
async def read_foto(token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Ler a foto de uma conta. \n \n \
    '''
    # Puxa o conteúdo e retorna formatado como uma imagem diretamente no navegador
    return obter_foto(token, session)

# Endpoint para atualizar a imagem de perfil
@foto_router.patch("/update", summary='Atualizar foto da conta')
async def update_foto(foto: UploadFile = File(...), token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Atualizar a foto de uma conta. \n \n \
    foto = "UploadFile" \n \n \
    '''
    # Acessa os bytes transmitidos na atualização do formulário
    foto_bytes = await foto.read()
    
    # Chama o serviço correspondente
    return atualizar_foto(token, foto_bytes, session)

# Endpoint que exclui a foto (seta NULL no banco)
@foto_router.delete("/delete", summary='Deletar foto da conta')
async def delete_foto(token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Deletar a foto de uma conta. \n \n \
    '''
    # Exige apenas a autenticação para prosseguir com a remoção
    return deletar_foto(token, session)
