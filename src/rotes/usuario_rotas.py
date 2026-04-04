# importaçoes
from fastapi import APIRouter, Depends
from src.service.usuario_service import *
from src.schema import *
from src.dependencia import *
from fastapi.security import OAuth2PasswordRequestForm

# defini o prefixo dele
usuario_roteador = APIRouter(prefix="/usuario", tags={"usuario"})

# rota inicial
@usuario_roteador.get("/")
async def home():
    """
    Essa é a rota de usuario
    """
    return {"mensagem": "Você acessou a rota de usuario"}

# NOTE - rota de criar

# rota de criar conta
@usuario_roteador.post("/criar")
async def criar(dados: UsuarioSchema, session: Session = Depends(pegar_sessao)):
    return fun_criar(dados.nome, dados.email, dados.senha, session)
    
# NOTE - rota de logar

# rota de logar
@usuario_roteador.post("/login")
async def login(dados: UsuarioSchema, session: Session = Depends(pegar_sessao)):
    # defini funcao
    return fun_logar(dados.nome, dados.senha, session)

# rota de logar
@usuario_roteador.post("/login_form")
async def login_form(dados_formulario : OAuth2PasswordRequestForm = Depends(), session: Session = Depends(pegar_sessao)):
    # defini funcao
    return fun_login_form(dados_formulario, session)

# NOTE - rota de deletar

@usuario_roteador.delete("/delete")
async def delete(busca: Usuario = Depends(verificar_token), session : Session = Depends(pegar_sessao)):
    # defini funcao
    return fun_delete(busca, session)

# NOTE - rota de atualizar

@usuario_roteador.patch("/atualizar")
async def atualizar(dados: UsuarioUpdate, busca: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    return fun_atualizar(dados, busca.user_id, session)

# NOTE - rota de token refresh

# rota de verificar token
@usuario_roteador.get("/refresh")
async def use_refresh_token(busca: Usuario = Depends(verificar_token)):
    # defini funcao
    return refresh_token(busca)