from fastapi import HTTPException
from src.models.usuario_model import Usuario
from src.config import bcrypt_context, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTE
from datetime import datetime, timedelta, timezone
from jose import jwt
from sqlalchemy import or_

def criar_usuario(nome, email, senha, session):
    """Cria uma nova conta de usuário."""
    # Verifica se já existe um usuário cadastrado com o mesmo e-mail ou nome
    # O comando 'or_' permite buscar por uma condição OU outra simultaneamente
    query = session.query(Usuario).filter(or_(Usuario.user_email == email, Usuario.user_name == nome)).first()

    # Se o usuário já existir, levanta um erro de conflito (409)
    if query:
        raise HTTPException(status_code=409, detail="Nome ou e-mail já cadastrado")
    
    # Criptografa a senha em texto plano usando o algoritmo definido no bcrypt_context
    senha_criptografada = bcrypt_context.hash(senha)
    
    # Instancia um novo objeto Usuario com os dados fornecidos e a senha protegida
    novo_usuario = Usuario(nome, email, senha_criptografada)

    # Adiciona a nova instância à sessão atual do banco de dados
    session.add(novo_usuario)
    
    # Efetiva (commita) a transação no banco de dados, salvando o registro
    session.commit()
    
    # Retorna uma mensagem de sucesso
    return {"mensagem": "Conta cadastrada com sucesso"}

def obter_usuario(token, session):
    """Retorna as informações do perfil do usuário logado."""
    # Busca o usuário no banco usando o user_id que foi extraído do token de autenticação
    usuario = session.query(Usuario).filter(Usuario.user_id == token.user_id).first()

    # Se o usuário existir, retorna um dicionário com os seus dados principais
    if usuario:
        return {
            "user_id": usuario.user_id,
            "user_name": usuario.user_name,
            "user_email": usuario.user_email,
            "user_senha": usuario.user_senha,
            "user_verified": usuario.user_verified
        }
    # Caso contrário, levanta um erro informando que a conta não foi encontrada (404)
    else:
        raise HTTPException(status_code=404, detail="Conta não encontrada")

def autenticar_usuario(nome, senha, session):
    """Autentica o usuário e retorna os tokens de acesso e renovação."""
    # Utiliza a função auxiliar 'authenticate' para validar as credenciais
    busca = authenticate(nome, senha, session)

    # Se as credenciais não baterem (nome de usuário ou senha errados), levanta erro 401
    if not busca:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    # Gera um Token de Acesso (JWT) que o cliente usará nas próximas requisições
    access_token = create_token(busca.user_id)
    
    # Gera um Token de Renovação (Refresh Token) com uma validade mais extensa (ex: 7 dias)
    refresh_token = create_token(busca.user_id, duracao_token=timedelta(days=7))
    
    # Retorna os tokens e informa o tipo 'Bearer' (portador)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "Bearer"
    }

def deletar_usuario(user_id, session):
    """Exclui a conta do usuário do sistema."""
    # Busca o usuário pelo ID
    usuario = session.query(Usuario).filter(Usuario.user_id == user_id).first()

    # Se o usuário for encontrado, remove o registro da sessão e commita no banco
    if usuario:
        session.delete(usuario)
        session.commit()
        return {"mensagem": "Conta deletada com sucesso"}
    # Caso contrário, levanta erro 404
    else:
        raise HTTPException(status_code=404, detail="Conta não encontrada")

def authenticate(nome, senha, session):
    """Verifica se o nome de usuário e a senha estão corretos."""
    # Localiza o usuário unicamente pelo nome fornecido
    busca = session.query(Usuario).filter(Usuario.user_name == nome).first()

    # Retorna falso imediatamente se o nome não existir no banco
    if not busca:
        return False

    # Compara a senha informada com a hash guardada no banco usando o 'bcrypt.verify'
    if not bcrypt_context.verify(senha, busca.user_senha):
        return False

    # Se o usuário existir e a senha for correta, retorna a instância do usuário
    return busca

def atualizar_usuario(dados, user_id, session):
    """Atualiza os dados cadastrais do usuário."""
    # Pega a instância do usuário do banco pelo ID
    usuario = session.get(Usuario, user_id)

    # Se a conta não existir, encerra com 404
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Se o usuário quiser mudar o nome
    if dados.user_name:
        # Verifica se o novo nome já pertence a outra pessoa
        existe = session.query(Usuario).filter(Usuario.user_name == dados.user_name, Usuario.user_id != user_id).first()
        if existe:
            raise HTTPException(status_code=409, detail="Nome de usuário já cadastrado")

    # Bloqueia a alteração do e-mail (user_email)
    if getattr(dados, "user_email", None):
        raise HTTPException(status_code=400, detail="Não é permitido alterar o e-mail")

    # Se o usuário forneceu uma nova senha, ela é criptografada antes de salvar
    if dados.user_senha:
        dados.user_senha = bcrypt_context.hash(dados.user_senha)

    # Passo 5: Itera de forma dinâmica pelas chaves e valores passados na requisição (JSON)
    for key, value in dados.dict(exclude_unset=True).items():
        # Somente altera os campos que existem na classe 'Usuario' e não estão vazios
        if hasattr(usuario, key) and value is not None and value != "":
            setattr(usuario, key, value)
    
    # Passo 6: Efetiva as alterações no banco de dados e recarrega os dados do usuário em memória
    session.commit()
    session.refresh(usuario)

    return {"mensagem": "Dados da conta atualizados"}

def renovar_token(busca):
    """Gera um novo token de acesso baseado no refresh token."""
    # Passo 1: Recebe a identidade (busca) e cria um novo access token a partir do ID do usuário
    access_token = create_token(busca.user_id)

    # Passo 2: Retorna o novo token gerado
    return {
        "access_token": access_token,
        "token_type": "Bearer"
    }

def create_token(data, duracao_token=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTE)):
    """Gera um token JWT com expiração configurada."""
    # Passo 1: Calcula qual será o exato momento em que o token deve expirar
    data_expiracao = datetime.now(timezone.utc) + duracao_token

    # Passo 2: Se o 'data' for um modelo Pydantic, convertemos para dicionário
    if hasattr(data, "dict") and callable(data.dict):
        dic_info = data.dict(exclude_unset=True)
    # Passo 3: Se for um dicionário puro, criamos uma cópia para não alterar a referência original
    elif isinstance(data, dict):
        dic_info = data.copy()
    # Passo 4: Se for apenas um valor (como um ID numérico ou string), encapsulamos em um dicionário
    else:
        dic_info = {"user_id": str(data)}

    # Passo 5: Adicionamos a propriedade 'exp' ao payload (o JWT exige isso para controlar expiração)
    dic_info["exp"] = data_expiracao
    
    # Passo 6: Assina e codifica o payload utilizando nossa chave secreta e o algoritmo (ex: HS256)
    token = jwt.encode(dic_info, SECRET_KEY, ALGORITHM)

    # Retorna a string do token gerado
    return token