"""
============================================================
Passa Adiante — Sebo Virtual da Faculdade
2ª AC: BACK-END (API REST em Python + Flask)

COMO O BACK-END FUNCIONA (resumo para a apresentação):
1. Rodamos "python app.py" e o Flask liga um servidor em
   http://localhost:5000
2. O navegador abre essa página e recebe o front-end
   (index.html, style.css, app.js).
3. O app.js conversa com o servidor usando fetch() nas
   rotas que começam com /api (ex.: GET /api/anuncios).
4. Os dados ficam em LISTAS NA MEMÓRIA do Python.
   Quando o servidor desliga, tudo volta ao início.
   (Na 3ª AC esses dados vão para um banco de dados de verdade.)
============================================================
"""

import os
import secrets
import uuid

from flask import Flask, jsonify, request, send_from_directory
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

# Pastas do projeto
PASTA_BACKEND = os.path.dirname(os.path.abspath(__file__))
PASTA_FRONTEND = os.path.join(PASTA_BACKEND, "..", "frontend")
PASTA_UPLOADS = os.path.join(PASTA_BACKEND, "uploads")
os.makedirs(PASTA_UPLOADS, exist_ok=True)

# Tipos de imagem aceitos no upload de foto
EXTENSOES_PERMITIDAS = ["png", "jpg", "jpeg", "gif", "webp"]

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # fotos de até 5 MB


# ============================================================
# PASSO 1 - "Banco de dados" em memória
# ============================================================

# Alunos de exemplo. A senha de todos é 123456.
# Nunca guardamos a senha pura: guardamos um "hash" (senha embaralhada).
alunos = [
    {"id": 1, "nome": "Marina", "email": "marina@email.com", "curso": "Engenharia",
     "contato": "(47) 99999-1111", "senha_hash": generate_password_hash("123456")},
    {"id": 2, "nome": "Rafael", "email": "rafael@email.com", "curso": "ADS",
     "contato": "rafael@email.com", "senha_hash": generate_password_hash("123456")},
    {"id": 3, "nome": "Beatriz", "email": "beatriz@email.com", "curso": "Administração",
     "contato": "(47) 98888-2222", "senha_hash": generate_password_hash("123456")},
]

# Anúncios de exemplo. "aluno_id" diz qual aluno criou o anúncio.
anuncios = [
    {"id": 1, "titulo": "Livro de Cálculo A", "preco": 45, "categoria": "Livro",
     "curso": "Engenharia", "estado": "Usado",
     "foto": "https://placehold.co/400x300?text=Calculo+A",
     "descricao": "Livro com algumas anotações a lápis. Capa em bom estado.",
     "aluno_id": 1, "vendido": False},
    {"id": 2, "titulo": "Apostila de Lógica de Programação", "preco": 0, "categoria": "Apostila",
     "curso": "ADS", "estado": "Seminovo",
     "foto": "https://placehold.co/400x300?text=Logica",
     "descricao": "Doação! Apostila impressa, usei só um semestre.",
     "aluno_id": 2, "vendido": False},
    {"id": 3, "titulo": "Calculadora HP 12C", "preco": 180, "categoria": "Eletrônico",
     "curso": "Administração", "estado": "Seminovo",
     "foto": "https://placehold.co/400x300?text=HP+12C",
     "descricao": "Funcionando perfeitamente, acompanha capa e manual.",
     "aluno_id": 3, "vendido": True},
]

# Tokens de login: { "token": id_do_aluno }
tokens = {}

# Próximos ids livres
proximo_id_aluno = 4
proximo_id_anuncio = 4


# ============================================================
# PASSO 2 - Funções de ajuda
# ============================================================

def buscar_aluno(id_aluno):
    for aluno in alunos:
        if aluno["id"] == id_aluno:
            return aluno
    return None


def buscar_anuncio(id_anuncio):
    for anuncio in anuncios:
        if anuncio["id"] == id_anuncio:
            return anuncio
    return None


def aluno_publico(aluno):
    """Dados do aluno que podem ir para o front (sem a senha!)."""
    return {
        "id": aluno["id"],
        "nome": aluno["nome"],
        "email": aluno["email"],
        "curso": aluno["curso"],
        "contato": aluno["contato"],
    }


def anuncio_completo(anuncio):
    """Junta o anúncio com o nome e o contato de quem anunciou."""
    dono = buscar_aluno(anuncio["aluno_id"])
    resultado = dict(anuncio)  # copia o anúncio
    resultado["autor"] = dono["nome"]
    resultado["contato"] = dono["contato"]
    return resultado


def aluno_logado():
    """
    Descobre quem está fazendo o pedido.
    O front manda o cabeçalho:  Authorization: Bearer <token>
    Se o token for válido, devolve o aluno. Senão, devolve None.
    """
    cabecalho = request.headers.get("Authorization", "")
    token = cabecalho.replace("Bearer ", "")
    id_aluno = tokens.get(token)
    if id_aluno is None:
        return None
    return buscar_aluno(id_aluno)


def campo_vazio(dados, campo):
    """True se o campo não veio no pedido ou veio em branco."""
    valor = dados.get(campo)
    return valor is None or str(valor).strip() == ""


def erro(mensagem, status):
    return jsonify({"erro": mensagem}), status


# ============================================================
# PASSO 3 - Rota de teste
# ============================================================

@app.get("/api/teste")
def teste():
    return jsonify({"mensagem": "API do Passa Adiante funcionando!"})


# ============================================================
# PASSO 4 - Cadastro e login de aluno
# ============================================================

@app.post("/api/alunos")
def cadastrar_aluno():
    global proximo_id_aluno
    dados = request.get_json() or {}

    # Todos os campos são obrigatórios
    campos = ["nome", "email", "senha", "curso", "contato"]
    for campo in campos:
        if campo_vazio(dados, campo):
            return erro("O campo '" + campo + "' é obrigatório.", 400)

    email = dados["email"].strip().lower()

    # Não pode ter dois alunos com o mesmo e-mail
    for aluno in alunos:
        if aluno["email"] == email:
            return erro("Já existe um aluno com esse e-mail.", 409)

    novo = {
        "id": proximo_id_aluno,
        "nome": dados["nome"].strip(),
        "email": email,
        "curso": dados["curso"],
        "contato": dados["contato"].strip(),
        "senha_hash": generate_password_hash(dados["senha"]),
    }
    alunos.append(novo)
    proximo_id_aluno += 1

    return jsonify(aluno_publico(novo)), 201


@app.post("/api/login")
def login():
    dados = request.get_json() or {}
    email = str(dados.get("email", "")).strip().lower()
    senha = str(dados.get("senha", ""))

    for aluno in alunos:
        if aluno["email"] == email and check_password_hash(aluno["senha_hash"], senha):
            # Gera um token aleatório e lembra de qual aluno ele é
            token = secrets.token_hex(16)
            tokens[token] = aluno["id"]
            return jsonify({"token": token, "aluno": aluno_publico(aluno)})

    return erro("E-mail ou senha incorretos.", 401)


# ============================================================
# PASSO 5 - Anúncios (CRUD)
# ============================================================

# GET /api/anuncios?busca=calc&categoria=Livro&curso=ADS
@app.get("/api/anuncios")
def listar_anuncios():
    busca = request.args.get("busca", "").lower()
    categoria = request.args.get("categoria", "")
    curso = request.args.get("curso", "")

    resultado = []
    for anuncio in anuncios:
        combina_texto = busca == "" or busca in anuncio["titulo"].lower()
        combina_categoria = categoria == "" or anuncio["categoria"] == categoria
        combina_curso = curso == "" or anuncio["curso"] == curso

        if combina_texto and combina_categoria and combina_curso:
            resultado.append(anuncio_completo(anuncio))

    return jsonify(resultado)


@app.get("/api/anuncios/<int:id_anuncio>")
def ver_anuncio(id_anuncio):
    anuncio = buscar_anuncio(id_anuncio)
    if anuncio is None:
        return erro("Anúncio não encontrado.", 404)
    return jsonify(anuncio_completo(anuncio))


@app.post("/api/anuncios")
def criar_anuncio():
    global proximo_id_anuncio

    aluno = aluno_logado()
    if aluno is None:
        return erro("Faça login para anunciar.", 401)

    dados = request.get_json() or {}

    campos = ["titulo", "preco", "categoria", "curso", "estado", "descricao"]
    for campo in campos:
        if campo_vazio(dados, campo):
            return erro("O campo '" + campo + "' é obrigatório.", 400)

    try:
        preco = float(dados["preco"])
    except (ValueError, TypeError):
        return erro("Preço inválido.", 400)
    if preco < 0:
        return erro("O preço não pode ser negativo.", 400)

    novo = {
        "id": proximo_id_anuncio,
        "titulo": dados["titulo"].strip(),
        "preco": preco,
        "categoria": dados["categoria"],
        "curso": dados["curso"],
        "estado": dados["estado"],
        "foto": dados.get("foto", ""),
        "descricao": dados["descricao"].strip(),
        "aluno_id": aluno["id"],  # o dono é quem está logado
        "vendido": False,
    }
    anuncios.append(novo)
    proximo_id_anuncio += 1

    return jsonify(anuncio_completo(novo)), 201


@app.put("/api/anuncios/<int:id_anuncio>")
def editar_anuncio(id_anuncio):
    aluno = aluno_logado()
    if aluno is None:
        return erro("Faça login primeiro.", 401)

    anuncio = buscar_anuncio(id_anuncio)
    if anuncio is None:
        return erro("Anúncio não encontrado.", 404)

    # Só o dono pode editar o próprio anúncio
    if anuncio["aluno_id"] != aluno["id"]:
        return erro("Você só pode editar os seus anúncios.", 403)

    dados = request.get_json() or {}

    # Atualiza só os campos que vieram no pedido.
    # Ex.: {"vendido": true} marca como vendido e não mexe no resto.
    campos_editaveis = ["titulo", "preco", "categoria", "curso",
                        "estado", "foto", "descricao", "vendido"]
    for campo in campos_editaveis:
        if campo in dados:
            anuncio[campo] = dados[campo]

    return jsonify(anuncio_completo(anuncio))


@app.delete("/api/anuncios/<int:id_anuncio>")
def apagar_anuncio(id_anuncio):
    aluno = aluno_logado()
    if aluno is None:
        return erro("Faça login primeiro.", 401)

    anuncio = buscar_anuncio(id_anuncio)
    if anuncio is None:
        return erro("Anúncio não encontrado.", 404)

    if anuncio["aluno_id"] != aluno["id"]:
        return erro("Você só pode apagar os seus anúncios.", 403)

    anuncios.remove(anuncio)
    return jsonify({"mensagem": "Anúncio apagado."})


# ============================================================
# PASSO 6 - Upload de foto
# ============================================================

@app.post("/api/upload")
def upload_foto():
    if aluno_logado() is None:
        return erro("Faça login primeiro.", 401)

    arquivo = request.files.get("foto")
    if arquivo is None or arquivo.filename == "":
        return erro("Nenhuma foto enviada.", 400)

    # Confere a extensão (.jpg, .png, ...)
    extensao = arquivo.filename.rsplit(".", 1)[-1].lower()
    if extensao not in EXTENSOES_PERMITIDAS:
        return erro("Envie uma imagem (png, jpg, gif ou webp).", 400)

    # Nome único para não sobrescrever fotos com o mesmo nome
    nome = uuid.uuid4().hex + "_" + secure_filename(arquivo.filename)
    arquivo.save(os.path.join(PASTA_UPLOADS, nome))

    # Devolve o endereço onde a foto pode ser vista
    return jsonify({"url": "/uploads/" + nome}), 201


@app.get("/uploads/<nome>")
def ver_foto(nome):
    return send_from_directory(PASTA_UPLOADS, nome)


# ============================================================
# PASSO 7 - Entregar o front-end (index.html, app.js, style.css)
# ============================================================

@app.get("/")
def pagina_inicial():
    return send_from_directory(PASTA_FRONTEND, "index.html")


@app.get("/<path:arquivo>")
def arquivos_do_front(arquivo):
    return send_from_directory(PASTA_FRONTEND, arquivo)


# ============================================================
# INÍCIO - liga o servidor
# ============================================================

if __name__ == "__main__":
    print("Abra no navegador: http://localhost:5000")
    app.run(debug=True)
