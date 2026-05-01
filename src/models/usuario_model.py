# importaçoes
from src.conexao import Base
from sqlalchemy import Column, Integer, String, Boolean, LargeBinary

# criar as tabelas do banco
class Usuario(Base):
    # nome da tabela
    __tablename__ = "usuario"

    # colunas
    user_id = Column("user_id", Integer, primary_key=True,)
    user_name = Column("user_name", String(120), nullable=False, unique=True)
    user_email = Column("user_email", String(120), nullable=False, unique=True)
    user_senha = Column("user_senha", String(255), nullable=False)
    user_verified = Column("user_verified", Boolean, nullable=False, default=False)
    user_foto = Column("user_foto", LargeBinary, nullable=True)

    # construtor
    def __init__(self, name, email, senha, verified=False, foto=None):
        self.user_name = name
        self.user_email = email
        self.user_senha = senha
        self.user_verified = verified
        self.user_foto = foto