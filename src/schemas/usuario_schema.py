# importacao
from pydantic import BaseModel
from typing import Optional

# esquema do usuario
class UsuarioSchema(BaseModel):
    nome: str
    email: str
    senha: str

    # configuracao para ele ser identificado com uma classe que vai ser transformada em um sql
    class Config:
        from_attributes = True

# esquema do update usuario
class UsuarioUpdate(BaseModel):
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_senha: Optional[str] = None

    # configuracao para ele ser identificado com uma classe que vai ser transformada em um sql
    class Config:
        from_attributes = True