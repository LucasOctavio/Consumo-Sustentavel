from pydantic import BaseModel, EmailStr
from typing import List

# Cria um esquema de validação utilizando o Pydantic para os e-mails
class EmailSchema(BaseModel):
    # A propriedade 'email' espera receber uma lista de strings.
    # O tipo EmailStr garante automaticamente que cada string da lista seja formatada como um e-mail válido (ex: aaa@bbb.com)
    email: List[EmailStr]

    # Configuração interna do Pydantic
    class Config:
        # Habilita a conversão de objetos ORM do SQLAlchemy diretamente para este modelo Pydantic
        from_attributes = True