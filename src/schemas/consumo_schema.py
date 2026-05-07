from pydantic import BaseModel, Field
from datetime import datetime
from decimal import Decimal
from typing import Optional

# Esquema base (Schema) usado para validar os dados que o usuário envia ao criar um Consumo via API (POST)
class ConsumoSchema(BaseModel):
    # Tipagem estrita: a API recusará requisições se "tipo" não for uma string
    tipo: str

    # Campo configurado especificamente para finanças ou medidas precisas.
    # Field(max_digits=10, decimal_places=2) limita a casa decimal para evitar erros de precisão e padronizar o envio
    valor: Decimal = Field(max_digits=10, decimal_places=2)

    # Unidade de medida do consumo
    medida: str
    
    # Valida automaticamente se a string recebida obedece ao padrão internacional de data e hora (ISO 8601)
    dt: datetime
    
    # Booleano exigido para confirmar se o registro é real ou uma simulação projetada
    simulado: bool

    # Campo que armazena a descrição do consumo (notas, comentários)
    descricao: Optional[str] = None

    # Configuração interna que avisa ao Pydantic que ele pode ler dados diretamente de objetos SQLAlchemy
    class Config:
        from_attributes = True

# Esquema para leitura (GET), garantindo que todos os campos do banco sejam retornados
class ConsumoRead(BaseModel):
    con_id: int
    con_tipo: str
    con_valor: Decimal
    con_medida: str
    con_dt: datetime
    con_simulado: bool
    con_descricao: Optional[str] = None

    class Config:
        from_attributes = True

# Esquema utilizado exclusivamente para validar requisições de alteração (PATCH/PUT)
class ConsumoUpdate(BaseModel):
    # O ID é obrigatório para sabermos qual registro atualizar
    con_id: int
    
    # O uso do 'Optional' indica que o envio destes dados não é obrigatório na requisição de atualização.
    # Apenas os dados que o usuário deseja modificar serão enviados
    con_tipo: Optional[str] = None
    con_valor: Optional[Decimal] = None
    con_medida: Optional[str] = None
    con_dt: Optional[datetime] = None
    con_simulado: Optional[bool] = None
    con_descricao: Optional[str] = None

    class Config:
        from_attributes = True