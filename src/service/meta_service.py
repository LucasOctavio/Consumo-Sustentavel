# importacao
from fastapi import HTTPException
from src.model.meta_model import Meta

# NOTE - funcao de criar

def fun_criar(dados, session, busca):
    # cria um novo pedido
    nova_meta = Meta(dados.tipo, dados.valor, dados.medida, dados.dt_inicio, dados.dt_inicio)

    # adiciona o user_id no novo consumo
    nova_meta.user_id = busca.user_id

    # adiciona no banco
    session.add(nova_meta)

    # comita no banco
    session.commit()
    return {"mensagem": f"Meta criada com sucesso."}

# NOTE - funcao de listar

def fun_listar(usuario, session):
    # busca os consumo cadastrados no usuario
    metas = session.query(Meta).filter(Meta.user_id==usuario.user_id).all()
    
    # retorna eles em uma lista
    return {
        "metas": metas
    }

# NOTE - funcao de delete

def fun_delete(meta_id, session, usuario):
    # busca um consumo q tenha o id do consumo e tenha o token do usuario que solicitou essa rota
    buscar = session.query(Meta).filter(Meta.meta_id==meta_id, Meta.user_id==usuario.user_id).first()

    # se tiver algo
    if buscar:
        # deleta
        session.delete(buscar)

        # comita
        session.commit()
        return {"mensagem": "consumo deletado com sucesso"}
    
    # se nao tiver
    else:
        # erro
        raise HTTPException(status_code=400, detail="Esse consumo nao existe")
    
# NOTE - funcao de atualizar consumo

def fun_atualizar(dados, user_id, session):
    busca = session.query(Meta).filter(Meta.user_id==user_id)
    meta = session.get(Meta, dados.meta_id)

    if meta not in busca:
        raise HTTPException(status_code=404, detail="Consumo não encontrado")
    
    for key, value in dados.dict(exclude_unset=True).items():
        if hasattr(meta, key):
            setattr(meta, key, value)
    
    session.commit()
    
    session.refresh(meta)

    return {"mensagem": "Dados do consumo atualizado"}



