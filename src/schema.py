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