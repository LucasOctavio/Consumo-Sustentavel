from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from typing import Optional

# Valida os dados oriundos de uma requisição de atualização de metas (PATCH)
class MetaUpdate(BaseModel):
    # Identificador único da meta que sofrerá a alteração
    meta_id : int
    
    # Campos opcionais. O usuário manda apenas o que deseja alterar, e o Pydantic valida o tipo
    meta_tipo: Optional[str] = None
    meta_valor: Optional[Decimal] = None
    meta_medida: Optional[str] = None
    meta_dt_inicio: Optional[datetime] = None
    meta_dt_fim: Optional[datetime] = None
    meta_descricao: Optional[str] = None

    class Config:
        # Atributo que converte modelos do banco de dados relacional em JSON legível pela API
        from_attributes = True

# Valida os dados no momento da criação de uma nova meta (POST)
class MetaSchema(BaseModel):
    # Na modelagem atual, os campos foram marcados como opcionais, permitindo a criação inicial de metas "vazias" ou incompletas
    tipo: Optional[str] = None
    valor: Optional[Decimal] = None
    medida: Optional[str] = None
    dt_inicio: Optional[datetime] = None
    dt_fim: Optional[datetime] = None
    descricao: Optional[str] = None

    class Config:
        from_attributes = True

# Esquema para leitura (GET) das metas
class MetaRead(BaseModel):
    meta_id: int
    meta_tipo: str
    meta_valor: Decimal
    meta_medida: str
    meta_dt_inicio: datetime
    meta_dt_fim: datetime
    meta_descricao: Optional[str] = None

    class Config:
        from_attributes = True