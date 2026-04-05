# importaçoes
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

# definindo a url do banco
db = os.getenv("db")

# criando a conexao do banco
engine = create_engine(db)

# criando a base do banco
Base = declarative_base()