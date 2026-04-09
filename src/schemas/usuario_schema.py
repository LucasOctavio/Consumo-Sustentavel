# importacao
from typing import Optional
from pydantic import BaseModel, EmailStr

# esquema do usuario
class UsuarioSchema(BaseModel):
    nome: str
    email: EmailStr
    senha: str

    # configuracao para ele ser identificado com uma classe que vai ser transformada em um sql
    class Config:
        from_attributes = True

# esquema do update usuario
class UsuarioUpdate(BaseModel):
    user_name: Optional[str] = None
    user_email: Optional[EmailStr] = None
    user_senha: Optional[str] = None

    # configuracao para ele ser identificado com uma classe que vai ser transformada em um sql
    class Config:
        from_attributes = True