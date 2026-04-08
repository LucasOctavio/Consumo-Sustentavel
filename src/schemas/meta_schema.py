# importacao
from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from typing import Optional

# esquema de meta
class MetaUpdate(BaseModel):
    meta_id : int
    meta_tipo: Optional[str] = None
    meta_valor: Optional[Decimal] = None
    meta_medida: Optional[str] = None
    meta_dt_inicio: Optional[datetime] = None
    meta_dt_fim: Optional[datetime] = None

    # configuracao para ele ser identificado com uma classe que vai ser transformada em um sql
    class Config:
        from_attributes = True

# esquema de update meta
class MetaSchema(BaseModel):
    tipo: Optional[str] = None
    valor: Optional[Decimal] = None
    medida: Optional[str] = None
    dt_inicio: Optional[datetime] = None
    dt_fim: Optional[datetime] = None

    # configuracao para ele ser identificado com uma classe que vai ser transformada em um sql
    class Config:
        from_attributes = True