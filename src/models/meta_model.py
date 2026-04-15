# importacoes
from src.conexao import Base
from sqlalchemy import Column, Integer, String, Date, ForeignKey, Numeric

# criar as tabelas do banco
class Meta(Base):
    # nome da tabela
    __tablename__ = "meta"

    # colunas
    meta_id = Column("meta_id", Integer, nullable=False, autoincrement=True, primary_key=True)
    meta_tipo = Column("meta_tipo", String, nullable=False)
    meta_valor = Column("meta_valor", Numeric(10, 2), nullable=False)
    meta_medida = Column("meta_medida", String, nullable=False)
    meta_dt_inicio = Column("meta_dt_inicio", Date, nullable=False)
    meta_dt_fim = Column("meta_dt_fim", Date, nullable=False)

    #chave estrangeira
    user_id = Column(Integer, ForeignKey('usuario.user_id', ondelete="cascade"),nullable=False)
    
    # construtor
    def __init__(self, tipo, valor, medida, dt_inicio, dt_fim):
        self.meta_tipo = tipo
        self.meta_valor = valor
        self.meta_medida = medida
        self.meta_dt_inicio = dt_inicio
        self.meta_dt_fim = dt_fim