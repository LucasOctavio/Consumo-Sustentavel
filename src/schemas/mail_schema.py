# importacoes
from pydantic import BaseModel, EmailStr
from typing import List

# esquema do email
class EmailSchema(BaseModel):
    email: List[EmailStr]

    # configuracao para ele ser identificado com uma classe que vai ser transformada em um sql
    class Config:
        from_attributes = True