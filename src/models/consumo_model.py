from sqlalchemy import Column, Integer, String, Numeric, Date, Boolean, ForeignKey
from src.conexao import Base

# A classe Consumo herda de 'Base', instruindo o ORM a transformá-la em uma tabela relacional
class Consumo(Base):
    __tablename__ = "consumo"

    # Chave primária da tabela. O 'autoincrement=True' delega a criação do ID sequencial ao banco
    con_id = Column("con_id", Integer, nullable=False, autoincrement=True, primary_key=True)
    
    # Campo que armazena a natureza do consumo (ex: Água, Luz, Gás)
    con_tipo = Column("con_tipo", String, nullable=False)
    
    # Armazena valores exatos sem arredondamentos imperfeitos. Ideal para medições financeiras ou quantitativas
    con_valor = Column("con_valor", Numeric(10, 2), nullable=False)
    
    # Unidade de medida (ex: m³, kWh, L)
    con_medida = Column("con_medida", String, nullable=False)
    
    # A data exata da leitura ou registro do consumo
    con_dt = Column("con_dt", Date, nullable=False)
    
    # Campo lógico que indica se a medição é uma projeção (simulação) ou um dado real
    con_simulado = Column("con_simulado", Boolean, default=False)

    # Campo que armazena a descrição do consumo (notas, comentários)
    con_descricao = Column("con_descricao", String, nullable=True)

    # Chave estrangeira que vincula o consumo a um usuário específico.
    # O 'ondelete="cascade"' fará com que todos os consumos sejam destruídos automaticamente se o usuário dono for deletado
    user_id = Column(Integer, ForeignKey('usuario.user_id', ondelete="cascade"), nullable=False)

    # Construtor da classe, facilitando a criação programática nos métodos de CRUD da API
    def __init__(self, tipo, valor, medida, dt, simulado=False, descricao=""):
        self.con_tipo = tipo
        self.con_valor = valor
        self.con_medida = medida
        self.con_dt = dt
        self.con_simulado = simulado
        self.con_descricao = descricao
