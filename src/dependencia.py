from sqlalchemy.orm import sessionmaker, Session
from fastapi import Depends, HTTPException, Query
from src.models.usuario_model import Usuario
from jose import jwt, JWTError
from dotenv import load_dotenv
from src.config import SECRET_KEY, ALGORITHM, oauth2_schema
from src.conexao import engine

def pegar_sessao():
    """Gera uma sessão do banco de dados."""
    
    # O bloco try garante que a sessão será adequadamente gerenciada
    try:
        # Cria a fábrica de sessões associada ao 'engine' (conexão com o banco)
        SessionLocal = sessionmaker(bind=engine)
        
        # Instancia uma sessão única para a requisição atual
        session = SessionLocal() 
        
        # Usa 'yield' para entregar a sessão para o endpoint que a solicitou (injeção de dependência)
        # Quando a rota concluir a execução, o código retoma a partir deste ponto
        yield session
        
    finally:
        # O bloco finally assegura que, em caso de sucesso ou erro na rota, a conexão com o banco seja fechada
        session.close()

def verificar_token(token: str = Depends(oauth2_schema), session: Session = Depends(pegar_sessao)):
    """Verifica a validade do token JWT e retorna o usuário."""
    # Tenta decodificar o token fornecido utilizando a chave secreta da aplicação e o algoritmo definido
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Extrai o ID do usuário de dentro da carga útil (payload) do token
        user_id = int(payload.get("user_id"))
        
    except JWTError:
        # Se ocorrer uma falha ao decodificar (ex: token expirado ou forjado), aciona o Erro HTTP 401
        raise HTTPException(status_code=401, detail="Acesso Negado, verifique a validade do token")

    # Utiliza o ID extraído para consultar o usuário ativo diretamente no banco de dados
    usuario = session.query(Usuario).filter(Usuario.user_id == user_id).first()
    
    # Valida a existência do usuário para impedir acesso via tokens de contas já deletadas
    if not usuario:
        raise HTTPException(status_code=401, detail="Acesso Inválido")

    # Retorna o modelo do usuário que passa a estar disponível nos endpoints (rotas protegidas)
    return usuario

def verificar_token_query(token: str = Query(...), session: Session = Depends(pegar_sessao)):
    """Verifica a validade do token JWT passado via query parameter e retorna o usuário."""
    # Tenta descriptografar o token oriundo da URL (ex: ?token=ey...) usando as configurações globais
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Recupera a identificação do dono da conta
        user_id = int(payload.get("user_id"))
        
    except JWTError:
        # Rejeita requisições onde o token no link foi adulterado ou o prazo de validade esgotou
        raise HTTPException(status_code=401, detail="Acesso Negado, verifique a validade do token")

    # Puxa o objeto do usuário persistido em banco correspondente a este ID
    usuario = session.query(Usuario).filter(Usuario.user_id == user_id).first()
    
    # Se a conta correspondente ao token não for achada, denega o seguimento da rota
    if not usuario:
        raise HTTPException(status_code=401, detail="Acesso Inválido")

    # Passa as informações validadas do usuário para a função da rota
    return usuario

def verificar_dados_query(dados: str = Query(...), session: Session = Depends(pegar_sessao)):
    """Decodifica dados de atualização codificados em um token JWT via query parameter."""
    # Recebe informações secundárias criptografadas por JWT através da URL
    try:
        # Decodifica recuperando a carga de dados que acompanha a requisição (ex: dados a serem atualizados)
        payload = jwt.decode(dados, SECRET_KEY, algorithms=[ALGORITHM])
        
    except JWTError:
        # Aborta caso a assinatura não coincida
        raise HTTPException(status_code=401, detail="Acesso Negado, verifique a validade do token")

    # Remove o carimbo de tempo de expiração do dicionário de dados (para que não tente salvá-lo no banco acidentalmente)
    payload.pop("exp", None)
    
    # Devolve o dicionário limpo contendo unicamente as chaves e valores a atualizar
    return payload