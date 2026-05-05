from fastapi import HTTPException
from src.models.usuario_model import Usuario
from fastapi.responses import Response

def obter_foto(usuario, session):
    """Retorna a foto de perfil do usuário logado."""
    # O objeto 'usuario' já vem validado pela dependência de token
    if usuario and usuario.user_foto:
        # Devolve os bytes brutos da imagem configurando o cabeçalho HTTP adequado (media_type)
        return Response(content=usuario.user_foto, media_type="image/jpeg")
    
    # Caso o usuário não tenha foto, sinaliza com um erro 404
    raise HTTPException(status_code=404, detail="Foto não encontrada")

def salvar_foto(usuario, foto, session):
    """Salva uma nova foto de perfil para o usuário."""
    # Atribui o blob da nova foto ao atributo 'user_foto' do objeto Usuario em memória
    usuario.user_foto = foto
    
    # Salva as alterações na base de dados
    session.commit()
    session.refresh(usuario)
    
    return {"mensagem": "Foto adicionada com sucesso"}

def atualizar_foto(usuario, foto, session):
    """Atualiza a foto de perfil do usuário."""
    # Sobrescreve o conteúdo do campo da foto com os novos bytes (blob)
    usuario.user_foto = foto
    
    # Commita a atualização consolidando a imagem nova na tabela do banco
    session.commit()
    session.refresh(usuario)
    
    return {"mensagem": "Foto atualizada com sucesso"}

def deletar_foto(usuario, session):
    """Remove a foto de perfil do usuário."""
    # Define o atributo de foto como nulo (None)
    usuario.user_foto = None
    
    # Persiste o estado modificado (sem foto) no banco
    session.commit()
    session.refresh(usuario)
    
    return {"mensagem": "Foto deletada com sucesso"}
