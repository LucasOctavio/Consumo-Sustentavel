from fastapi import HTTPException
from src.models.usuario_model import Usuario
from fastapi.responses import Response

def obter_foto(token, session):
    """Retorna a foto de perfil do usuário logado."""
    # Procura no banco de dados o registro do usuário usando o ID validado fornecido no token
    usuario = session.query(Usuario).filter(Usuario.user_id == token.user_id).first()

    # Confirma se o usuário existe e se ele de fato possui uma foto cadastrada (não nula)
    if usuario and usuario.user_foto:
        # Se possuir, devolve os bytes brutos da imagem configurando o cabeçalho HTTP adequado (media_type)
        # Isso instrui o navegador ou cliente a interpretar o conteúdo como uma imagem JPEG
        return Response(content=usuario.user_foto, media_type="image/jpeg")
    
    # Caso o usuário não tenha foto ou o usuário não exista, sinaliza com um erro 404
    raise HTTPException(status_code=404, detail="Foto não encontrada")

def salvar_foto(token, foto, session):
    """Salva uma nova foto de perfil para o usuário."""
    # Busca a instância do usuário para associá-la à foto recebida
    usuario = session.query(Usuario).filter(Usuario.user_id == token.user_id).first()

    # Valida se a conta solicitante foi encontrada no banco
    if usuario:
        # Atribui o blob da nova foto ao atributo 'user_foto' do objeto Usuario em memória
        usuario.user_foto = foto
        
        # Salva as alterações na base de dados (o banco fará a persistência do blob binário)
        session.commit()
        
        # Recarrega a entidade do usuário com as modificações mais recentes para evitar inconsistências
        session.refresh(usuario)
        
        # Responde com uma mensagem confirmando o registro da foto
        return {"mensagem": "Foto adicionada com sucesso"}
    
    # Levanta erro caso o token seja inválido ou o usuário correspondente tenha sido deletado
    raise HTTPException(status_code=404, detail="Conta não encontrada")

def atualizar_foto(token, foto, session):
    """Atualiza a foto de perfil do usuário."""
    # Localiza o usuário específico no sistema
    usuario = session.query(Usuario).filter(Usuario.user_id == token.user_id).first()

    # Confirmação de existência do registro
    if usuario:
        # Sobrescreve o conteúdo do campo da foto com os novos bytes (blob)
        usuario.user_foto = foto
        
        # Commita a atualização consolidando a imagem nova na tabela do banco
        session.commit()
        
        # Atualiza as propriedades locais para manter a coerência da aplicação
        session.refresh(usuario)
        
        # Envia retorno amigável da conclusão
        return {"mensagem": "Foto atualizada com sucesso"}
    
    # Retorna erro 404 caso seja impossível achar o dono da conta
    raise HTTPException(status_code=404, detail="Conta não encontrada")

def deletar_foto(token, session):
    """Remove a foto de perfil do usuário."""
    # Procura a conta ligada à solicitação usando a chave estrangeira garantida pelo JWT (token)
    usuario = session.query(Usuario).filter(Usuario.user_id == token.user_id).first()

    # Valida se realmente existe esse usuário
    if usuario:
        # Define o atributo de foto como nulo (None), que remove os bytes do banco e efetiva a deleção visual
        usuario.user_foto = None
        
        # Persiste o estado modificado (sem foto) no banco relacional
        session.commit()
        
        # Traz as novidades para o objeto
        session.refresh(usuario)
        
        # Mostra o status final positivo da ação
        return {"mensagem": "Foto deletada com sucesso"}
    
    # Encerra o processo se a conta não estiver no banco
    raise HTTPException(status_code=404, detail="Conta não encontrada")
