# importacoes
from src.conexao import Base
from sqlalchemy import Column, Integer, String, Numeric, Date, Boolean, ForeignKey

# criar as tabelas do banco
class Consumo(Base):
    # nome da tabela
    __tablename__ = "consumo"

    # colunas
    con_id = Column("con_id", Integer, nullable=False, autoincrement=True, primary_key=True)
    con_tipo = Column("con_tipo", String, nullable=False)
    con_valor = Column("con_valor", Numeric(10, 2), nullable=False)
    con_medida = Column("con_medida", String, nullable=False)
    con_dt = Column("con_dt", Date, nullable=False)
    con_simulado = Column("con_simulado", Boolean, default=False)

    #chave estrangeira
    user_id = Column(Integer, ForeignKey('usuario.user_id', ondelete="cascade"),nullable=False)

    # construtor
    def __init__(self, tipo, valor, medida, dt, simulado=False):
        self.con_tipo = tipo
        self.con_valor = valor
        self.con_medida = medida
        self.con_dt = dt
        self.con_simulado = simulado

