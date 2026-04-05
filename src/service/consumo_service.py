# importacao
from fastapi import HTTPException
from src.model.consumo_model import Consumo

# NOTE - funcao de criar

def fun_criar(dados, session, busca):
    # cria um novo pedido
    novo_consumo = Consumo(dados.tipo, dados.valor, dados.medida, dados.dt, dados.simulado)

    # adiciona o user_id no novo consumo
    novo_consumo.user_id = busca.user_id

    # adiciona no banco
    session.add(novo_consumo)

    # comita no banco
    session.commit()
    return {"mensagem": f"Consumo criado com sucesso. ID: {novo_consumo.con_id}"}

# NOTE - funcao de listar

def fun_listar(usuario, session):
    # busca os consumo cadastrados no usuario
    consumos = session.query(Consumo).filter(Consumo.user_id==usuario.user_id).all()
    
    # se tiver
    if consumos:
        # retorna eles em uma lista
        return {
            "consumos": consumos
        }
    
    else:
        return{"mensagem": "Sem consumos cadastrados"}

# NOTE - funcao de delete

def fun_delete(con_id, session, usuario):
    # busca um consumo q tenha o id do consumo e tenha o token do usuario que solicitou essa rota
    buscar = session.query(Consumo).filter(Consumo.con_id==con_id, Consumo.user_id==usuario.user_id).first()

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
        raise HTTPException(status_code=404, detail="Consumo não encontrado")
    
# NOTE - funcao de atualizar consumo

def fun_atualizar(dados, user_id, session):
    consumo = session.query(Consumo).filter(Consumo.con_id == dados.con_id, Consumo.user_id == user_id).first()

    if not consumo:
        raise HTTPException(status_code=404, detail="Consumo não encontrado")
    
    for key, value in dados.dict(exclude_unset=True).items():
        if hasattr(consumo, key):
            setattr(consumo, key, value)
    
    session.commit()
    
    session.refresh(consumo)

    return {"mensagem": "Dados do consumo atualizado"}



