/* ============================================================
   Passa Adiante — Sebo Virtual da Faculdade
   2ª AC: front-end CONSUMINDO A API (back-end em Flask).

   COMO A PÁGINA FUNCIONA (resumo):
   1. O servidor Flask (backend/app.py) entrega esta página.
   2. Para ler ou mudar anúncios, este arquivo faz pedidos
      ao servidor com fetch() — ex.: GET /api/anuncios.
   3. O servidor responde em JSON e as funções "desenham"
      os anúncios na tela como cards.
   4. No navegador só guardamos a SESSÃO (token do login),
      os anúncios ficam no servidor.
   ============================================================ */

// Nome da "gaveta" onde o navegador guarda o login
const CHAVE_SESSAO = "passa-adiante:sessao";

// Imagem usada quando o anúncio não tem foto
const FOTO_PADRAO = "https://placehold.co/400x300?text=Sem+foto";

/* ============================================================
   PASSO 1 - Sessão (quem está logado)
   ============================================================ */

// Lê o login salvo. Formato: { token: "...", aluno: { id, nome, ... } }
function carregarSessao() {
  const texto = localStorage.getItem(CHAVE_SESSAO);
  if (texto === null) return null;
  return JSON.parse(texto);
}

let sessao = carregarSessao();

function entrar(novaSessao) {
  sessao = novaSessao;
  localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
  atualizarNavbar();
}

function sair() {
  sessao = null;
  localStorage.removeItem(CHAVE_SESSAO);
  atualizarNavbar();
}

// Mostra "Entrar" ou "Olá, Fulano + Sair" na navbar
function atualizarNavbar() {
  if (sessao === null) {
    document.getElementById("nav-entrar").classList.remove("d-none");
    document.getElementById("nav-logado").classList.add("d-none");
  } else {
    document.getElementById("nav-entrar").classList.add("d-none");
    document.getElementById("nav-logado").classList.remove("d-none");
    document.getElementById("nome-logado").textContent = "Olá, " + sessao.aluno.nome;
  }
}

document.getElementById("botao-sair").addEventListener("click", function () {
  sair();
  avisar("Você saiu da conta.");
  mostrarView("feed");
});

/* ============================================================
   PASSO 2 - Conversar com a API
   Uma função só para todos os pedidos, assim não repetimos
   o mesmo código em todo lugar.
   ============================================================ */

// metodo: "GET", "POST", "PUT" ou "DELETE"
// rota:   ex.: "/api/anuncios"
// corpo:  objeto a enviar (opcional)
async function api(metodo, rota, corpo) {
  const opcoes = { method: metodo, headers: {} };

  // Se estiver logado, manda o token para o servidor saber quem é
  if (sessao !== null) {
    opcoes.headers["Authorization"] = "Bearer " + sessao.token;
  }

  // Se tiver dados para enviar, manda como JSON
  if (corpo !== undefined) {
    opcoes.headers["Content-Type"] = "application/json";
    opcoes.body = JSON.stringify(corpo);
  }

  const resposta = await fetch(rota, opcoes);
  const dados = await resposta.json();

  // 401 = token inválido (ex.: o servidor foi reiniciado). Desloga.
  if (resposta.status === 401 && sessao !== null) {
    sair();
  }

  // Qualquer status de erro (400, 401, 403, 404...) vira um erro aqui
  if (!resposta.ok) {
    throw new Error(dados.erro);
  }
  return dados;
}

// Envia o arquivo de foto e devolve o endereço onde ele ficou salvo
async function enviarFoto(arquivo) {
  // Arquivos não vão como JSON, e sim como "FormData" (formulário)
  const formulario = new FormData();
  formulario.append("foto", arquivo);

  const resposta = await fetch("/api/upload", {
    method: "POST",
    headers: { Authorization: "Bearer " + sessao.token },
    body: formulario,
  });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro);
  return dados.url;
}

/* ============================================================
   PASSO 3 - Trocar de tela (feed / meus / novo / login)
   ============================================================ */

function mostrarView(nome) {
  // "Meus anúncios" e "Anunciar" exigem login
  if ((nome === "meus" || nome === "novo") && sessao === null) {
    avisar("Entre na sua conta primeiro.", true);
    nome = "login";
  }

  // Esconde todas as telas
  const telas = document.querySelectorAll("main > section");
  for (let i = 0; i < telas.length; i++) {
    telas[i].classList.add("d-none");
  }

  // Mostra só a tela pedida
  document.getElementById("view-" + nome).classList.remove("d-none");
  window.scrollTo(0, 0);

  // Redesenha o conteúdo da tela que abriu
  if (nome === "feed") desenharFeed();
  if (nome === "meus") desenharMeus();
}

// Liga o clique de todo botão/link que tem "data-view" no HTML
const botoesDeNavegacao = document.querySelectorAll("[data-view]");
for (let i = 0; i < botoesDeNavegacao.length; i++) {
  botoesDeNavegacao[i].addEventListener("click", function (evento) {
    evento.preventDefault();
    const nomeDaTela = this.dataset.view; // ex.: "feed", "meus", "novo"
    // Clicou em "Anunciar": formulário vazio, no modo de criar
    if (nomeDaTela === "novo") limparFormulario();
    mostrarView(nomeDaTela);
  });
}

/* ============================================================
   PASSO 4 - Montar o card de um anúncio
   ============================================================ */

// Transforma o preço num texto bonito
function formatarPreco(valor) {
  if (Number(valor) === 0) {
    return '<span class="preco troca">Troca / Doação</span>';
  }
  return '<span class="preco">R$ ' + Number(valor).toFixed(2) + "</span>";
}

// Cria o HTML de um card. Se "comBotoes" for true, adiciona os botões
// de "marcar vendido" e "apagar" (usados na tela Meus anúncios).
function cardAnuncio(anuncio, comBotoes) {
  const coluna = document.createElement("div");
  coluna.className = "col-12 col-sm-6 col-lg-4 col-xl-3";

  // Selo de "VENDIDO" (só aparece se o anúncio estiver vendido)
  let selo = "";
  if (anuncio.vendido) {
    selo = '<span class="badge text-bg-danger selo-vendido fs-6">VENDIDO</span>';
  }

  // Botões (só aparecem na tela Meus anúncios)
  let botoes = "";
  if (comBotoes) {
    const textoBotao = anuncio.vendido ? "Reativar" : "Marcar vendido";
    botoes =
      '<div class="d-flex gap-2 mt-2">' +
      '  <button class="btn btn-sm btn-outline-success flex-grow-1" data-acao="vender" data-id="' +
      anuncio.id + '" data-vendido="' + anuncio.vendido + '">' + textoBotao + "</button>" +
      '  <button class="btn btn-sm btn-outline-primary" data-acao="editar" data-id="' +
      anuncio.id + '" title="Editar"><i class="bi bi-pencil"></i></button>' +
      '  <button class="btn btn-sm btn-outline-danger" data-acao="apagar" data-id="' +
      anuncio.id + '"><i class="bi bi-trash"></i></button>' +
      "</div>";
  }

  coluna.innerHTML =
    '<div class="card card-anuncio h-100 position-relative ' +
    (anuncio.vendido ? "vendido" : "") + '">' +
    selo +
    '  <img class="foto card-img-top" src="' + (anuncio.foto || FOTO_PADRAO) +
    '" alt="' + anuncio.titulo + '" onerror="this.src=\'' + FOTO_PADRAO + '\'" />' +
    '  <div class="card-body d-flex flex-column">' +
    '    <h2 class="h6 card-title">' + anuncio.titulo + "</h2>" +
    '    <div class="mb-2">' + formatarPreco(anuncio.preco) + "</div>" +
    '    <div class="d-flex flex-wrap gap-1 mb-2">' +
    '      <span class="badge text-bg-light border">' + anuncio.categoria + "</span>" +
    '      <span class="badge text-bg-light border">' + anuncio.curso + "</span>" +
    '      <span class="badge text-bg-light border">' + anuncio.estado + "</span>" +
    "    </div>" +
    '    <p class="card-text small text-secondary flex-grow-1">' + anuncio.descricao + "</p>" +
    botoes +
    "  </div>" +
    "</div>";

  // Clicar no card (menos nos botões) abre o modal de detalhe
  coluna.querySelector(".card-anuncio").addEventListener("click", function (evento) {
    if (evento.target.closest("[data-acao]")) return; // clicou num botão, ignora
    abrirDetalhe(anuncio.id);
  });

  return coluna;
}

/* ============================================================
   PASSO 5 - Tela FEED (com busca e filtros)
   Agora quem filtra é o SERVIDOR: mandamos os filtros na URL.
   Ex.: /api/anuncios?busca=calc&categoria=Livro&curso=
   ============================================================ */

async function desenharFeed() {
  const lista = document.getElementById("lista-anuncios");
  const aviso = document.getElementById("vazio");
  const contador = document.getElementById("contador");

  const filtros = new URLSearchParams({
    busca: document.getElementById("busca").value,
    categoria: document.getElementById("filtro-categoria").value,
    curso: document.getElementById("filtro-curso").value,
  });

  let dados;
  try {
    dados = await api("GET", "/api/anuncios?" + filtros.toString());
  } catch (e) {
    contador.textContent = "Não foi possível falar com o servidor. Ele está ligado? (python app.py)";
    return;
  }

  lista.innerHTML = "";
  for (let i = 0; i < dados.length; i++) {
    lista.appendChild(cardAnuncio(dados[i], false));
  }

  // Mostra a mensagem "nenhum anúncio" só quando a lista está vazia
  if (dados.length === 0) {
    aviso.classList.remove("d-none");
  } else {
    aviso.classList.add("d-none");
  }
  contador.textContent = dados.length + " anúncio(s) encontrado(s)";
}

// Toda vez que a pessoa digita ou muda um filtro, redesenha o feed
document.getElementById("busca").addEventListener("input", desenharFeed);
document.getElementById("filtro-categoria").addEventListener("input", desenharFeed);
document.getElementById("filtro-curso").addEventListener("input", desenharFeed);

document.getElementById("limpar-filtros").addEventListener("click", function () {
  document.getElementById("busca").value = "";
  document.getElementById("filtro-categoria").value = "";
  document.getElementById("filtro-curso").value = "";
  desenharFeed();
});

/* ============================================================
   PASSO 6 - Tela MEUS ANÚNCIOS
   "Meus" são os anúncios cujo aluno_id é o do aluno logado.
   ============================================================ */

async function desenharMeus() {
  const lista = document.getElementById("lista-meus");
  const aviso = document.getElementById("meus-vazio");

  let todos;
  try {
    todos = await api("GET", "/api/anuncios");
  } catch (e) {
    avisar(e.message, true);
    return;
  }

  const meus = [];
  for (let i = 0; i < todos.length; i++) {
    if (todos[i].aluno_id === sessao.aluno.id) {
      meus.push(todos[i]);
    }
  }

  lista.innerHTML = "";
  for (let i = 0; i < meus.length; i++) {
    lista.appendChild(cardAnuncio(meus[i], true)); // true = mostrar botões
  }

  if (meus.length === 0) {
    aviso.classList.remove("d-none");
  } else {
    aviso.classList.add("d-none");
  }
}

// Clique nos botões "marcar vendido" / "apagar"
document.getElementById("lista-meus").addEventListener("click", async function (evento) {
  const botao = evento.target.closest("[data-acao]");
  if (botao === null) return; // não clicou num botão

  const id = botao.dataset.id;

  try {
    if (botao.dataset.acao === "editar") {
      // Busca o anúncio no servidor e abre o formulário já preenchido
      const anuncio = await api("GET", "/api/anuncios/" + id);
      preencherFormulario(anuncio);
      mostrarView("novo");
      return;
    }

    if (botao.dataset.acao === "vender") {
      const estavaVendido = botao.dataset.vendido === "true";
      // PUT só com o campo que muda: inverte true/false
      await api("PUT", "/api/anuncios/" + id, { vendido: !estavaVendido });
      avisar(estavaVendido ? "Anúncio reativado." : "Anúncio marcado como vendido.");
    }

    if (botao.dataset.acao === "apagar") {
      if (!confirm("Apagar este anúncio?")) return;
      await api("DELETE", "/api/anuncios/" + id);
      avisar("Anúncio apagado.");
    }

    desenharMeus();
  } catch (e) {
    avisar(e.message, true);
  }
});

/* ============================================================
   PASSO 7 - Modal de detalhe do anúncio
   ============================================================ */

async function abrirDetalhe(id) {
  let anuncio;
  try {
    anuncio = await api("GET", "/api/anuncios/" + id);
  } catch (e) {
    avisar(e.message, true);
    return;
  }

  const seloVendido = anuncio.vendido
    ? '<span class="badge text-bg-danger">VENDIDO</span>'
    : "";

  document.getElementById("modal-detalhe-conteudo").innerHTML =
    '<div class="modal-header">' +
    '  <h5 class="modal-title">' + anuncio.titulo + "</h5>" +
    '  <button type="button" class="btn-close" data-bs-dismiss="modal"></button>' +
    "</div>" +
    '<div class="modal-body">' +
    '  <img class="foto-detalhe mb-3" src="' + (anuncio.foto || FOTO_PADRAO) +
    '" onerror="this.src=\'' + FOTO_PADRAO + '\'" alt="' + anuncio.titulo + '" />' +
    '  <div class="fs-4 mb-2">' + formatarPreco(anuncio.preco) + "</div>" +
    '  <div class="d-flex flex-wrap gap-1 mb-3">' +
    '    <span class="badge text-bg-secondary">' + anuncio.categoria + "</span>" +
    '    <span class="badge text-bg-secondary">' + anuncio.curso + "</span>" +
    '    <span class="badge text-bg-secondary">Estado: ' + anuncio.estado + "</span>" +
    seloVendido +
    "  </div>" +
    "  <p>" + anuncio.descricao + "</p>" +
    "  <hr />" +
    '  <p class="mb-1"><strong>Anunciante:</strong> ' + anuncio.autor + "</p>" +
    '  <p class="mb-0"><strong>Contato:</strong> ' + anuncio.contato + "</p>" +
    "</div>" +
    '<div class="modal-footer">' +
    '  <button class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>' +
    "</div>";

  const modal = new bootstrap.Modal(document.getElementById("modal-detalhe"));
  modal.show();
}

/* ============================================================
   PASSO 8 - Formulário de anúncio (criar e editar)
   O mesmo formulário serve para os dois:
   - idEmEdicao = null  -> cria um anúncio novo (POST)
   - idEmEdicao = 5     -> edita o anúncio 5 (PUT)
   ============================================================ */

const form = document.getElementById("form-anuncio");
let idEmEdicao = null;

// Deixa o formulário vazio, no modo "criar"
function limparFormulario() {
  idEmEdicao = null;
  form.reset();
  form.classList.remove("was-validated");
  document.getElementById("titulo-formulario").textContent = "Novo anúncio";
  document.getElementById("botao-publicar").innerHTML =
    '<i class="bi bi-check-lg"></i> Publicar anúncio';
}

// Coloca os dados de um anúncio no formulário, no modo "editar"
function preencherFormulario(anuncio) {
  limparFormulario();
  idEmEdicao = anuncio.id;
  form.titulo.value = anuncio.titulo;
  form.preco.value = anuncio.preco;
  form.categoria.value = anuncio.categoria;
  form.curso.value = anuncio.curso;
  form.estado.value = anuncio.estado;
  form.descricao.value = anuncio.descricao;
  document.getElementById("titulo-formulario").textContent = "Editar anúncio";
  document.getElementById("botao-publicar").innerHTML =
    '<i class="bi bi-check-lg"></i> Salvar alterações';
}

form.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  // Validação visual do Bootstrap (mostra os campos obrigatórios vazios)
  if (!form.checkValidity()) {
    form.classList.add("was-validated");
    return;
  }

  try {
    // Dados do anúncio. Autor e contato o servidor descobre
    // sozinho pelo token de quem está logado.
    const dados = {
      titulo: form.titulo.value.trim(),
      preco: Number(form.preco.value),
      categoria: form.categoria.value,
      curso: form.curso.value,
      estado: form.estado.value,
      descricao: form.descricao.value.trim(),
    };

    // Se escolheu uma foto, envia ela primeiro e guarda o endereço.
    // (Editando sem escolher foto, a foto antiga continua.)
    const arquivo = form.foto.files[0];
    if (arquivo !== undefined) {
      dados.foto = await enviarFoto(arquivo);
    }

    if (idEmEdicao === null) {
      await api("POST", "/api/anuncios", dados);
      avisar("Anúncio publicado com sucesso!");
      limparFormulario();
      mostrarView("feed");
    } else {
      await api("PUT", "/api/anuncios/" + idEmEdicao, dados);
      avisar("Anúncio atualizado!");
      limparFormulario();
      mostrarView("meus");
    }
  } catch (e) {
    avisar(e.message, true);
  }
});

/* ============================================================
   PASSO 9 - Login e cadastro
   ============================================================ */

const formLogin = document.getElementById("form-login");

formLogin.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  if (!formLogin.checkValidity()) {
    formLogin.classList.add("was-validated");
    return;
  }

  try {
    // O servidor responde { token, aluno }
    const resposta = await api("POST", "/api/login", {
      email: formLogin.email.value,
      senha: formLogin.senha.value,
    });
    entrar(resposta);
    formLogin.reset();
    formLogin.classList.remove("was-validated");
    avisar("Bem-vindo(a), " + resposta.aluno.nome + "!");
    mostrarView("feed");
  } catch (e) {
    avisar(e.message, true);
  }
});

const formCadastro = document.getElementById("form-cadastro");

formCadastro.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  if (!formCadastro.checkValidity()) {
    formCadastro.classList.add("was-validated");
    return;
  }

  const email = formCadastro.email.value;
  const senha = formCadastro.senha.value;

  try {
    // 1º) Cria a conta
    await api("POST", "/api/alunos", {
      nome: formCadastro.nome.value,
      curso: formCadastro.curso.value,
      email: email,
      senha: senha,
      contato: formCadastro.contato.value,
    });

    // 2º) Já faz o login com a conta nova
    const resposta = await api("POST", "/api/login", { email: email, senha: senha });
    entrar(resposta);
    formCadastro.reset();
    formCadastro.classList.remove("was-validated");
    avisar("Conta criada! Você já está logado(a).");
    mostrarView("feed");
  } catch (e) {
    avisar(e.message, true);
  }
});

/* ============================================================
   PASSO 10 - Mensagem de aviso (toast) no canto da tela
   Verde para sucesso, vermelho quando "ehErro" for true.
   ============================================================ */

function avisar(mensagem, ehErro) {
  const caixa = document.getElementById("toast");
  if (ehErro) {
    caixa.classList.replace("text-bg-success", "text-bg-danger");
  } else {
    caixa.classList.replace("text-bg-danger", "text-bg-success");
  }
  document.getElementById("toast-msg").textContent = mensagem;
  const toast = new bootstrap.Toast(caixa, { delay: 2500 });
  toast.show();
}

/* ============================================================
   INÍCIO - quando a página abre, ajusta a navbar e mostra o feed
   ============================================================ */

atualizarNavbar();
mostrarView("feed");
