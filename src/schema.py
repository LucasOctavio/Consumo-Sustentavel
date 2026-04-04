# importacao
from pydantic import BaseModel, Field
from datetime import datetime
from decimal import Decimal

# esquema do usuario
class UsuarioSchema(BaseModel):
    nome: str
    email: str
    senha: str

    # configuracao para ele ser identificado com uma classe que vai ser transformada em um sql
    class Config:
        from_attributes = True

from typing import Optional

class UsuarioUpdate(BaseModel):
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_senha: Optional[str] = None

    # configuracao para ele ser identificado com uma classe que vai ser transformada em um sql
    class Config:
        from_attributes = True

# esquema do consumo
class ConsumoSchema(BaseModel):
    tipo: str
    valor: Decimal = Field(max_digits=10, decimal_places=2)
    medida: str
    dt: datetime
    simulado: bool

    # configuracao para ele ser identificado com uma classe que vai ser transformada em um sql
    class Config:
        from_attributes = True

class ConsumoUpdate(BaseModel):
    con_id: int
    con_tipo: Optional[str] = None
    con_valor: Optional[Decimal] = None
    con_medida: Optional[str] = None
    con_dt: Optional[datetime] = None
    con_simulado: Optional[bool] = None

    # configuracao para ele ser identificado com uma classe que vai ser transformada em um sql
    class Config:
        from_attributes = True

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

class MetaSchema(BaseModel):
    tipo: Optional[str] = None
    valor: Optional[Decimal] = None
    medida: Optional[str] = None
    dt_inicio: Optional[datetime] = None
    dt_fim: Optional[datetime] = None

    # configuracao para ele ser identificado com uma classe que vai ser transformada em um sql
    class Config:
        from_attributes = True