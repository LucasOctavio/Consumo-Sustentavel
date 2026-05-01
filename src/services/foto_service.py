from fastapi import HTTPException
from src.models.usuario_model import Usuario
from fastapi.responses import Response

# funcao de ler foto
def fun_read_foto(token, session):
    usuario = session.query(Usuario).filter(Usuario.user_id==token.user_id).first()

    if usuario and usuario.user_foto:
        return Response(content=usuario.user_foto, media_type="image/jpeg")
    
    raise HTTPException(status_code=404, detail="Foto não encontrada")

# funcao de criar foto
def fun_create_foto(token, foto, session):
    usuario = session.query(Usuario).filter(Usuario.user_id==token.user_id).first()

    if usuario:
        usuario.user_foto = foto
        session.commit()
        session.refresh(usuario)
        return {"mensagem": "Foto adicionada com sucesso"}
    
    raise HTTPException(status_code=404, detail="Conta não encontrada")

# funcao de atualizar foto
def fun_update_foto(token, foto, session):
    usuario = session.query(Usuario).filter(Usuario.user_id==token.user_id).first()

    if usuario:
        usuario.user_foto = foto
        session.commit()
        session.refresh(usuario)
        return {"mensagem": "Foto atualizada com sucesso"}
    
    raise HTTPException(status_code=404, detail="Conta não encontrada")

# funcao de deletar foto
def fun_delete_foto(token, session):
    usuario = session.query(Usuario).filter(Usuario.user_id==token.user_id).first()

    if usuario:
        usuario.user_foto = None
        session.commit()
        session.refresh(usuario)
        return {"mensagem": "Foto deletada com sucesso"}
    
    raise HTTPException(status_code=404, detail="Conta não encontrada")
