from fastapi import HTTPException
from src.models.consumo_model import Consumo

def criar_consumo(dados, session, busca):
    """Cria um novo registro de consumo."""
    # Instancia um objeto Consumo utilizando as informações enviadas na requisição (tipo, valor, medida, etc.)
    novo_consumo = Consumo(dados.tipo, dados.valor, dados.medida, dados.dt, dados.simulado, dados.descricao)
    
    # Vincula o ID do usuário (extraído do token de autenticação) ao novo registro de consumo
    novo_consumo.user_id = busca.user_id

    # Prepara a inserção do novo registro na sessão do banco de dados
    session.add(novo_consumo)
    
    # Executa a transação, salvando as informações fisicamente no banco de dados
    session.commit()
    
    # Retorna uma mensagem de sucesso contendo o ID recém-criado do consumo
    return {"mensagem": f"Consumo criado com sucesso. ID: {novo_consumo.con_id}"}

def listar_consumos(usuario, session):
    """Lista todos os consumos reais cadastrados para o usuário."""
    # Realiza uma consulta na tabela Consumo filtrando pelos registros reais vinculados ao ID do usuário atual
    return session.query(Consumo).filter(Consumo.user_id == usuario.user_id, Consumo.con_simulado == False).all()

def listar_simulados(usuario, session):
    """Lista todos os consumos simulados cadastrados para o usuário."""
    # Realiza uma consulta na tabela Consumo filtrando pelos registros simulados vinculados ao ID do usuário atual
    return session.query(Consumo).filter(Consumo.user_id == usuario.user_id, Consumo.con_simulado == True).all()

def deletar_consumo(con_id, session, usuario):
    """Deleta um registro de consumo específico do usuário."""
    # Busca um consumo específico que tenha o ID solicitado E que pertença ao usuário logado
    # A dupla verificação impede que um usuário delete o consumo de outra pessoa
    buscar = session.query(Consumo).filter(Consumo.con_id == con_id, Consumo.user_id == usuario.user_id).first()

    # Se o registro for localizado no banco de dados
    if buscar:
        # Remove o objeto da sessão atual
        session.delete(buscar)
        
        # Commita a exclusão para aplicar a mudança definitiva no banco
        session.commit()
        
        return {"mensagem": "Consumo deletado com sucesso"}
    else:
        # Levanta um erro HTTP 404 caso o consumo não exista ou pertença a terceiros
        raise HTTPException(status_code=404, detail="Consumo não encontrado")

def atualizar_consumo(dados, user_id, session):
    """Atualiza as informações de um consumo existente."""
    # Localiza o registro de consumo específico garantindo que seja do dono da requisição
    consumo = session.query(Consumo).filter(Consumo.con_id == dados.con_id, Consumo.user_id == user_id).first()

    # Se a busca não retornar nada, cancela a operação com um erro 404 (Não Encontrado)
    if not consumo:
        raise HTTPException(status_code=404, detail="Consumo não encontrado")
    
    # Itera sobre os atributos do objeto enviado (exclui campos que não foram enviados na requisição)
    for key, value in dados.dict(exclude_unset=True).items():
        # Para cada chave, verifica se o modelo do banco possui o atributo correspondente
        # Garante que o valor não seja nulo ou vazio antes de sobrescrever o dado antigo
        if hasattr(consumo, key) and value is not None and value != "":
            # Atualiza o valor do atributo na memória (no objeto do banco de dados)
            setattr(consumo, key, value)
    
    # Consolida as alterações salvando-as de fato na tabela do banco
    session.commit()
    
    # Atualiza o objeto em memória para refletir os valores persistidos no banco
    session.refresh(consumo)

    # Retorna o aviso de que a modificação foi bem-sucedida
    return {"mensagem": "Dados do consumo atualizado"}
