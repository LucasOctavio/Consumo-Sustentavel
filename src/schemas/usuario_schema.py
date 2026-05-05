from typing import Optional
from pydantic import BaseModel, EmailStr

# Valida os dados enviados durante o cadastro de uma nova conta de usuário (Sign Up)
class UsuarioSchema(BaseModel):
    # O nome de usuário deve ser fornecido em formato string (texto)
    nome: str
    
    # O tipo EmailStr aciona uma validação interna usando regex para garantir que o texto inserido seja um e-mail válido
    email: EmailStr
    
    # A senha do usuário enviada como string
    senha: str

    class Config:
        # Habilita compatibilidade com os Models ORM do SQLAlchemy
        from_attributes = True

# Valida os dados para as atualizações no painel de perfil do usuário
class UsuarioUpdate(BaseModel):
    # A utilização do 'Optional' torna as propriedades não-obrigatórias
    user_name: Optional[str] = None
    user_senha: Optional[str] = None

    class Config:
        from_attributes = True

# Valida o envio de credenciais no endpoint de login via JSON
class UsuarioLogin(BaseModel):
    # Obriga o envio explícito do nome e senha para gerar os tokens JWT
    nome: str
    senha: str

    class Config:
        from_attributes = True

# Valida o envio do código de 6 dígitos e do token temporário no 2FA
class Usuario2FA(BaseModel):
    codigo: str
    token_2fa: str

    class Config:
        from_attributes = True

# Valida o pedido de redefinição de senha com o e-mail
class UsuarioResetRequest(BaseModel):
    email: EmailStr

    class Config:
        from_attributes = True

# Valida o envio do código, token temporário e nova senha
class UsuarioResetPassword(BaseModel):
    codigo: str
    token_reset: str
    nova_senha: str

    class Config:
        from_attributes = True

# Valida os dados para reenvio do e-mail de verificação de cadastro
class UsuarioResendVerification(BaseModel):
    # Os três campos originais do cadastro são necessários para gerar um novo token JWT
    nome: str
    email: EmailStr
    senha: str

    class Config:
        from_attributes = True