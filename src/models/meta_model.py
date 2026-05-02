from sqlalchemy import Column, Integer, String, Date, ForeignKey, Numeric
from src.conexao import Base

# Classe responsável por espelhar a estrutura da tabela 'meta' do banco de dados na aplicação
class Meta(Base):
    __tablename__ = "meta"

    # Chave primária, essencial para identificar unicamente a meta. Gera números sequenciais automáticos
    meta_id = Column("meta_id", Integer, nullable=False, autoincrement=True, primary_key=True)
    
    # Campo para armazenar o tipo/categoria da meta traçada (ex: Água, Energia)
    meta_tipo = Column("meta_tipo", String, nullable=False)
    
    # Montante objetivo (meta de teto de gastos ou meta de redução). O Numeric mantém precisão decimal
    meta_valor = Column("meta_valor", Numeric(10, 2), nullable=False)
    
    # Unidade que qualifica o valor (ex: kW, Litros, R$)
    meta_medida = Column("meta_medida", String, nullable=False)
    
    # Data de início do período em que a meta deve ser perseguida
    meta_dt_inicio = Column("meta_dt_inicio", Date, nullable=False)
    
    # Data limite ou de vencimento para o atingimento da meta estipulada
    meta_dt_fim = Column("meta_dt_fim", Date, nullable=False)

    # Chave estrangeira que conecta este registro à tabela de usuários.
    # O cascade ondelete força a limpeza automática de metas se o usuário pai for removido do sistema
    user_id = Column(Integer, ForeignKey('usuario.user_id', ondelete="cascade"), nullable=False)
    
    # O método construtor injeta rapidamente os valores na criação do objeto
    def __init__(self, tipo, valor, medida, dt_inicio, dt_fim):
        self.meta_tipo = tipo
        self.meta_valor = valor
        self.meta_medida = medida
        self.meta_dt_inicio = dt_inicio
        self.meta_dt_fim = dt_fim