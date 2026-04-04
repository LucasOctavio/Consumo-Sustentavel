# importaçoes
from src.conexao import Base
from sqlalchemy import Column, Integer, String

# criar as tabelas do banco
class Usuario(Base):
    # nome da tabela
    __tablename__ = "usuario"

    # colunas
    user_id = Column("user_id", Integer, primary_key=True,)
    user_name = Column("user_name", String(120), nullable=False, unique=True)
    user_email = Column("user_email", String(120), nullable=False, unique=True)
    user_senha = Column("user_senha", String(255), nullable=False)

    # construtor
    def __init__(self, name, email, senha):
        self.user_name = name
        self.user_email = email
        self.user_senha = senha