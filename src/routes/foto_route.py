from fastapi import APIRouter, Depends, UploadFile, File
from src.services.foto_service import *
from src.dependencia import *
from src.models.usuario_model import Usuario
from sqlalchemy.orm import Session

# defini o prefixo dele
foto_roteador = APIRouter(prefix="/foto", tags=["foto"])

# rota de criar foto
@foto_roteador.post("/create", summary='Adicionar foto da conta')
async def create_foto(foto: UploadFile = File(...), token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Adicionar a foto de uma conta. \n \n \
    foto = "UploadFile" \n \n \
    '''
    foto_bytes = await foto.read()
    return fun_create_foto(token, foto_bytes, session)

# rota de ler foto
@foto_roteador.get("/read", summary='Ler foto da conta')
async def read_foto(token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Ler a foto de uma conta. \n \n \
    '''
    return fun_read_foto(token, session)

# rota de atualizar foto
@foto_roteador.patch("/update", summary='Atualizar foto da conta')
async def update_foto(foto: UploadFile = File(...), token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Atualizar a foto de uma conta. \n \n \
    foto = "UploadFile" \n \n \
    '''
    foto_bytes = await foto.read()
    return fun_update_foto(token, foto_bytes, session)

# rota de deletar foto
@foto_roteador.delete("/delete", summary='Deletar foto da conta')
async def delete_foto(token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Deletar a foto de uma conta. \n \n \
    '''
    return fun_delete_foto(token, session)
