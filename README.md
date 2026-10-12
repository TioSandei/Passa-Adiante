# Passa Adiante — Sebo Virtual da Faculdade

Plataforma onde alunos anunciam livros, apostilas e materiais usados para
vender, doar ou trocar com outros alunos.

Projeto acadêmico dividido em 3 camadas ao longo das entregas:
**1ª AC — Front-end · 2ª AC — Back-end · 3ª AC — Banco de dados · Entrega final — integração + funcionalidade extra**

---

## Alunos do grupo

- Nome 1 — RA 000000
- Nome 2 — RA 000000
- (até 7)

## Links

- **Board do projeto:** https://trello.com/... (preencher)
- **Repositório GitHub:** https://github.com/... (preencher)
- **Vídeo da 1ª AC:** https://... (preencher)

---

## 1ª AC — Front-end (entrega 14/09)

Somente interface. **Não há back-end**: os dados são salvos no `localStorage`
do navegador, funcionando como um "banco de dados falso" só para demonstração.

### Funcionalidade apresentada no vídeo

Ciclo de um anúncio pela ótica do aluno:

1. **Feed de anúncios** — cards com foto, preço, categoria, curso e estado.
2. **Busca e filtros** — por texto, categoria e curso.
3. **Novo anúncio** — formulário com validação; o anúncio aparece no feed.
4. **Detalhe do anúncio** — modal com descrição completa e contato do anunciante.
5. **Meus anúncios** — marcar como vendido / reativar / apagar.

### Como executar

Não precisa instalar nada. Abra o arquivo:

```
frontend/index.html
```

direto no navegador (dois cliques). O Bootstrap é carregado pela internet (CDN).

> Dica: para "zerar" os dados de exemplo, abra o Console do navegador (F12) e rode
> `localStorage.clear()` e atualize a página.

### Estrutura

```
frontend/
├── index.html   → todas as telas (feed, meus anúncios, novo anúncio, modal)
├── style.css    → ajustes visuais próprios
└── app.js       → navegação, filtros, formulário e persistência no localStorage
```

---

## 2ª AC — Back-end (entrega 13/10)

API REST em **Python + Flask**. O front agora busca e grava os anúncios no
servidor com `fetch()`. Os dados ficam **em listas na memória do Python**
(ao desligar o servidor, voltam aos exemplos) — o banco de dados entra na 3ª AC.

### Como executar

Precisa do **Python 3** instalado (https://www.python.org/downloads/ — marque
*"Add python.exe to PATH"* na instalação).

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Depois abra **http://localhost:5000** no navegador.
(Não abra mais o `index.html` com dois cliques: a página precisa do servidor.)

Contas de teste (senha `123456`): `marina@email.com`, `rafael@email.com`, `beatriz@email.com`.

### Rotas da API

| Método | Rota | Login? | O que faz |
|---|---|---|---|
| GET | `/api/teste` | não | Rota de teste ("API funcionando") |
| POST | `/api/alunos` | não | Cadastro de aluno (`nome, email, senha, curso, contato`) |
| POST | `/api/login` | não | Login (`email, senha`) → devolve um `token` |
| GET | `/api/anuncios?busca=&categoria=&curso=` | não | Lista anúncios com filtros |
| GET | `/api/anuncios/<id>` | não | Detalhe de um anúncio |
| POST | `/api/anuncios` | sim | Cria anúncio (o dono é quem está logado) |
| PUT | `/api/anuncios/<id>` | sim, dono | Edita / marca como vendido (`{"vendido": true}`) |
| DELETE | `/api/anuncios/<id>` | sim, dono | Apaga anúncio |
| POST | `/api/upload` | sim | Upload de foto (campo `foto`) → devolve a `url` |

**Login com token:** ao entrar, o servidor gera um código aleatório (token) e
o front manda ele em todo pedido no cabeçalho `Authorization: Bearer <token>`.
Assim o servidor sabe quem é o aluno. A senha é guardada como *hash*
(embaralhada), nunca em texto puro.

**Códigos de resposta usados:** `200` ok · `201` criado · `400` dado inválido ·
`401` sem login · `403` não é o dono · `404` não encontrado · `409` e-mail já cadastrado.

### Estrutura

```
backend/
├── app.py            → servidor Flask: rotas da API + entrega o front-end
├── requirements.txt  → bibliotecas Python (Flask)
└── uploads/          → fotos enviadas (criada automaticamente)
frontend/
├── index.html        → telas (feed, meus anúncios, novo anúncio, login/cadastro)
├── style.css
└── app.js            → fetch() na API, login, filtros, formulários
```

---

## Próximas entregas (planejado)

| Entrega | Camada | O que entra |
|---|---|---|
| 3ª AC (08/11) | Banco | PostgreSQL: aluno ↔ anúncio ↔ categoria; favoritos; consultas com JOIN; relatório |
| Final | Integração | Front + back + banco juntos + chat OU avaliação do vendedor |

## Tecnologias

- **Front:** HTML, CSS, JavaScript puro, Bootstrap 5
- **Back:** Python + Flask
- **Banco (previsto):** SQLite → PostgreSQL
