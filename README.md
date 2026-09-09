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

## Próximas entregas (planejado)

| Entrega | Camada | O que entra |
|---|---|---|
| 2ª AC (13/10) | Back-end | API REST em Python/Flask: cadastro/login, CRUD de anúncio, upload de foto, status |
| 3ª AC (08/11) | Banco | PostgreSQL: aluno ↔ anúncio ↔ categoria; favoritos; consultas com JOIN; relatório |
| Final | Integração | Front + back + banco juntos + chat OU avaliação do vendedor |

## Tecnologias

- **Front:** HTML, CSS, JavaScript puro, Bootstrap 5
- **Back (previsto):** Python + Flask
- **Banco (previsto):** SQLite → PostgreSQL
