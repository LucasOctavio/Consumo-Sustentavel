from sqlalchemy import Column, Integer, String, Boolean, LargeBinary
from src.conexao import Base

# A classe Usuario herda de 'Base', permitindo ao SQLAlchemy mapeá-la para o banco de dados relacional
class Usuario(Base):
    # O atributo '__tablename__' define exatamente o nome da tabela que será gerada no SGBD
    __tablename__ = "usuario"

    # Define a coluna 'user_id' do tipo Inteiro, configurada como Chave Primária (Primary Key)
    user_id = Column("user_id", Integer, primary_key=True)
    
    # Define a coluna de nome de usuário. O 'unique=True' impede que dois usuários tenham o mesmo nome
    user_name = Column("user_name", String(120), nullable=False, unique=True)
    
    # Define a coluna de e-mail, também única, essencial para a recuperação e notificação da conta
    user_email = Column("user_email", String(120), nullable=False, unique=True)
    
    # Coluna que armazenará a senha do usuário, que será salva já criptografada (hash)
    user_senha = Column("user_senha", String(255), nullable=False)
    
    # Status de verificação da conta, começando falso por padrão até que o usuário confirme via e-mail
    user_verified = Column("user_verified", Boolean, nullable=False, default=False)
    
    # Coluna projetada para guardar arquivos binários (BLOB). Neste caso, as fotos de perfil
    user_foto = Column("user_foto", LargeBinary, nullable=True)

    # O método '__init__' é o construtor da classe. Ele facilita a criação do objeto no código Python (nos serviços)
    def __init__(self, name, email, senha, verified=False, foto=None):
        self.user_name = name
        self.user_email = email
        self.user_senha = senha
        self.user_verified = verified
        self.user_foto = foto