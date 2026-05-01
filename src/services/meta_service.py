# importacao
from fastapi import HTTPException
from src.models.meta_model import Meta

# NOTE - funcao de criar

def fun_create(dados, session, busca):
    # cria um nova meta
    nova_meta = Meta(dados.tipo, dados.valor, dados.medida, dados.dt_inicio, dados.dt_fim)

    # adiciona o user_id na nova meta
    nova_meta.user_id = busca.user_id

    # adiciona no banco
    session.add(nova_meta)

    # comita no banco
    session.commit()
    return {"mensagem": "Meta criada com sucesso."}

# NOTE - funcao de listar

def fun_read(usuario, session):
    # busca as metas cadastrados no usuario
    metas = session.query(Meta).filter(Meta.user_id==usuario.user_id).all()
    
    if metas:
        # retorna elas em uma lista
        return {
            "metas": metas
        }

    else:
        return {"mensagem": "Sem metas cadastradas"}


# NOTE - funcao de delete

def fun_delete(meta_id, session, usuario):
    # busca a meta selecionada e verifica se pertence ao usuario
    buscar = session.query(Meta).filter(Meta.meta_id==meta_id, Meta.user_id==usuario.user_id).first()

    # se tiver algo
    if buscar:
        # deleta
        session.delete(buscar)

        # comita
        session.commit()
        return {"mensagem": "Meta deletada com sucesso"}
    
    # se nao tiver
    else:
        # erro
        raise HTTPException(status_code=404, detail="Meta não encontrada")
    
# NOTE - funcao de atualizar consumo

def fun_update(dados, user_id, session):
    # busca a meta selecionada e verifica se pertence ao usuario
    meta = session.query(Meta).filter(Meta.meta_id==dados.meta_id, Meta.user_id==user_id).first()

    # se sim
    if meta:
        # para cada valor dentro dos dados
        for key, value in dados.dict(exclude_unset=True).items():
            # verifica se tem campos vazios nas informacoes passadas
            if hasattr(meta, key) and value is not None and value != "":
                # defini o atributo com as novas informacoes
                setattr(meta, key, value)

    # se nao
    else:
        # erro
        raise HTTPException(status_code=404, detail="Consumo não encontrado")
    
    # comita
    session.commit()
    
    # atualiza no banco
    session.refresh(meta)

    return {"mensagem": "Meta atualizada"}