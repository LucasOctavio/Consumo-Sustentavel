from fastapi import HTTPException
from src.models.meta_model import Meta

def criar_meta(dados, session, busca):
    """Cria uma nova meta de consumo."""
    # Inicializa um objeto da classe Meta com as informações provenientes do payload da requisição
    nova_meta = Meta(dados.tipo, dados.valor, dados.medida, dados.dt_inicio, dados.dt_fim, dados.descricao)
    
    # Associa a nova meta ao usuário que a solicitou, usando o ID contido no token
    nova_meta.user_id = busca.user_id

    # Adiciona a instância construída na fila da sessão do banco de dados
    session.add(nova_meta)
    
    # Salva efetivamente a transação no banco de dados persistindo os dados
    session.commit()
    
    # Retorna uma resposta de sucesso informando que a operação foi concluída
    return {"mensagem": "Meta criada com sucesso."}

def listar_metas(usuario, session):
    """Lista as metas cadastradas para o usuário."""
    # Faz uma consulta no banco recuperando todas as metas que pertencem ao usuário logado
    metas = session.query(Meta).filter(Meta.user_id == usuario.user_id).all()
    
    # Avalia se a consulta retornou pelo menos um resultado
    if metas:
        # Se existem metas cadastradas, retorna a estrutura convertida para o cliente
        return {"metas": metas}
    else:
        # Se não há metas, retorna uma mensagem de aviso para que o cliente saiba o estado atual
        return {"mensagem": "Sem metas cadastradas"}

def deletar_meta(meta_id, session, usuario):
    """Deleta uma meta específica do usuário."""
    # Tenta localizar a meta exata que o usuário deseja excluir, validando o ID da meta e o ID do usuário
    buscar = session.query(Meta).filter(Meta.meta_id == meta_id, Meta.user_id == usuario.user_id).first()

    # Verifica se a meta foi encontrada (o que indica que existe e pertence àquele usuário)
    if buscar:
        # Define a exclusão da meta da base de dados através da sessão do SQLAlchemy
        session.delete(buscar)
        
        # Conclui a operação de remoção sincronizando a sessão com o banco de dados
        session.commit()
        
        # Confirma para o cliente que a deleção foi um sucesso
        return {"mensagem": "Meta deletada com sucesso"}
    else:
        # Caso a meta não exista ou o usuário tente deletar a de outro, bloqueia com o erro 404
        raise HTTPException(status_code=404, detail="Meta não encontrada")

def atualizar_meta(dados, user_id, session):
    """Atualiza os dados de uma meta existente."""
    # Busca a meta a ser modificada garantindo, por segurança, que o proprietário é quem está solicitando a alteração
    meta = session.query(Meta).filter(Meta.meta_id == dados.meta_id, Meta.user_id == user_id).first()

    # Se a meta for encontrada no banco de dados
    if meta:
        # Faz uma iteração pelas chaves e valores presentes no objeto de dados recebido pela API
        # A flag exclude_unset assegura que lidaremos apenas com campos explicitamente enviados, prevenindo que nulos sobrescrevam dados
        for key, value in dados.dict(exclude_unset=True).items():
            # Checa se a propriedade de fato pertence ao modelo Meta e assegura que não seja vazia
            if hasattr(meta, key) and value is not None and value != "":
                # Atualiza dinamicamente o atributo correspondente no objeto com o novo valor fornecido
                setattr(meta, key, value)
        
        # Persiste no banco de dados as modificações feitas no objeto em memória
        session.commit()
        
        # Recarrega a instância da meta com o que está consolidado no banco para garantir sua integridade na memória
        session.refresh(meta)
        
        # Informa ao usuário que as propriedades da meta foram atualizadas
        return {"mensagem": "Meta atualizada"}
    else:
        # Aciona uma exceção 404 se a meta informada não constar no sistema
        raise HTTPException(status_code=404, detail="Meta não encontrada")