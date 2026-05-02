from fastapi import APIRouter, Depends, Request
from src.services.usuario_service import obter_usuario, renovar_token, criar_usuario, autenticar_usuario, deletar_usuario, atualizar_usuario
from src.schemas.usuario_schema import UsuarioSchema, UsuarioUpdate
from src.dependencia import pegar_sessao, verificar_token
from src.models.usuario_model import Usuario
from sqlalchemy.orm import Session

# Inicializa o roteador exclusivo para os fluxos da conta do usuário
usuario_router = APIRouter(prefix="/usuario", tags=["usuario"])

# Endpoint (GET) para obter os dados do próprio usuário (perfil)
@usuario_router.get("/read", summary='Ler conta')
async def read(token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Ler as informações da conta. \n \n \
    '''
    # Repassa a identificação garantida pelo JWT para buscar os dados completos no banco
    return obter_usuario(token, session)

# Endpoint (POST) dedicado a trocar um token que está prestes a vencer por um novo
@usuario_router.post("/refresh_token", summary='refresh token')
async def refresh_token(busca: Usuario = Depends(verificar_token)):
    '''\n \n \n Utilizar refresh token para criar um access token novo. \n \n \
    '''
    # O Refresh Token precisa ser mandado no cabeçalho. Se for válido, geramos um novo Access Token
    return renovar_token(busca)

# Endpoint (POST) de registro de novas contas (Sign Up)
@usuario_router.post("/sign_up", summary='Cadastrar conta')
async def sign_up(dados: UsuarioSchema, session: Session = Depends(pegar_sessao)):
    '''\n \n \n Adicionar uma conta. \n \n \
    nome = "str" \n \n \
    email = "Emailstr" \n \n \
    senha = "str" \n \n \
    '''
    # Encaminha o nome, email e senha recebidos no corpo da requisição para a regra de negócios
    return criar_usuario(dados.nome, dados.email, dados.senha, session)

# Endpoint (POST) de autenticação que aceita tanto JSON tradicional quanto Formulários (usados pelo OAuth2 do Swagger)
@usuario_router.post("/login", summary='Acessar conta')
async def login(request: Request, session: Session = Depends(pegar_sessao)):
    '''\n \n \n Acessar uma conta. Suporta JSON e Formulário. \n \n \
    nome = "str" \n \n \
    senha = "str" \n \n \
    '''
    # Inspeciona o cabeçalho "content-type" para descobrir como o cliente enviou os dados
    content_type = request.headers.get("content-type", "")
    
    # Se os dados vieram empacotados como um formulário da web (padrão de login HTML)
    if "application/x-www-form-urlencoded" in content_type:
        form_data = await request.form()
        nome = form_data.get("username")
        senha = form_data.get("password")
    # Caso contrário, assume que os dados vieram no formato JSON moderno
    else:
        json_data = await request.json()
        nome = json_data.get("nome")
        senha = json_data.get("senha")

    # Chama o serviço passando as credenciais limpas, independentemente de como chegaram
    return autenticar_usuario(nome, senha, session)

# Endpoint (DELETE) que permite ao usuário excluir a própria conta
@usuario_router.delete("/delete", summary='Deletar conta')
async def delete(token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Deletar uma conta. \n \n \
    '''
    # O user_id é pego de dentro do token, evitando que alguém delete a conta de outro usuário
    return deletar_usuario(token.user_id, session)

# Endpoint (PATCH) para o usuário modificar seu próprio perfil (nome, senha, etc.)
@usuario_router.patch("/update", summary='Atualizar conta')
async def update(dados: UsuarioUpdate, token: Usuario = Depends(verificar_token), session: Session = Depends(pegar_sessao)):
    '''\n \n \n Atualizar uma conta. \n \n \
    name = "str" \n \n \
    email = "Emailstr" \n \n \
    senha = "str" \n \n \
    '''
    # Envia o corpo validado e a identidade do solicitante para o controlador de usuários
    return atualizar_usuario(dados, token.user_id, session)
