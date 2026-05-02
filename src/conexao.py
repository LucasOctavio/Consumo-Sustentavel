from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
import os
from dotenv import load_dotenv

# Carrega as variáveis contidas no arquivo .env para o ambiente da aplicação
load_dotenv()

# Obtém a string de conexão (URL) do banco de dados a partir das variáveis de ambiente
db = os.getenv("db")

# Instancia o 'engine', que é a interface principal do SQLAlchemy para o banco de dados
# O engine gerencia as conexões físicas (pool de conexões) e traduz as queries em SQL nativo do SGBD
engine = create_engine(db)

# Cria a classe base declarativa
# Todas as classes de modelos (models) deverão herdar desta 'Base' para que o SQLAlchemy consiga
# mapeá-las para tabelas reais no banco de dados (Object-Relational Mapping - ORM)
Base = declarative_base()