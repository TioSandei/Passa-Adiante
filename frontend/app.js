/* ============================================================
   Passa Adiante — Sebo Virtual da Faculdade
   1ª AC: apenas FRONT-END.

   COMO A PÁGINA FUNCIONA (resumo para a apresentação):
   1. O navegador abre o index.html.
   2. Este arquivo (app.js) guarda a lista de anúncios numa variável.
   3. Essa lista também é salva no localStorage do navegador,
      que funciona como um "banco de dados falso".
   4. Funções "desenham" os anúncios na tela como cards.
   ============================================================ */

// Nome da "gaveta" onde o navegador guarda os anúncios
const CHAVE = "passa-adiante:anuncios";

// Imagem usada quando o anúncio não tem foto
const FOTO_PADRAO = "https://placehold.co/400x300?text=Sem+foto";

/* ---------- Dados de exemplo (aparecem no primeiro acesso) ---------- */
const EXEMPLOS = [
  {
    id: 1,
    titulo: "Livro de Cálculo A",
    preco: 45,
    categoria: "Livro",
    curso: "Engenharia",
    estado: "Usado",
    foto: "https://placehold.co/400x300?text=Calculo+A",
    descricao: "Livro com algumas anotações a lápis. Capa em bom estado.",
    autor: "Marina",
    contato: "(47) 99999-1111",
    vendido: false,
  },
  {
    id: 2,
    titulo: "Apostila de Lógica de Programação",
    preco: 0,
    categoria: "Apostila",
    curso: "ADS",
    estado: "Seminovo",
    foto: "https://placehold.co/400x300?text=Logica",
    descricao: "Doação! Apostila impressa, usei só um semestre.",
    autor: "Rafael",
    contato: "rafael@email.com",
    vendido: false,
  },
  {
    id: 3,
    titulo: "Calculadora HP 12C",
    preco: 180,
    categoria: "Eletrônico",
    curso: "Administração",
    estado: "Seminovo",
    foto: "https://placehold.co/400x300?text=HP+12C",
    descricao: "Funcionando perfeitamente, acompanha capa e manual.",
    autor: "Beatriz",
    contato: "(47) 98888-2222",
    vendido: true,
  },
];

/* ============================================================
   PASSO 1 - Carregar e salvar os anúncios no navegador
   ============================================================ */

// Lê os anúncios que estão salvos no navegador.
// Se não houver nada salvo, usa a lista de exemplos.
function carregarAnuncios() {
  const textoSalvo = localStorage.getItem(CHAVE);

  if (textoSalvo === null) {
    // Primeira vez que a pessoa abre a página: salva os exemplos.
    localStorage.setItem(CHAVE, JSON.stringify(EXEMPLOS));
    return EXEMPLOS;
  }

  // O localStorage só guarda texto, então convertemos o texto de volta em lista.
  return JSON.parse(textoSalvo);
}

// Salva a lista atual de anúncios no navegador (como texto).
function salvarAnuncios(lista) {
  localStorage.setItem(CHAVE, JSON.stringify(lista));
}

// Esta variável é a nossa "lista de anúncios" enquanto a página está aberta.
let anuncios = carregarAnuncios();

/* ============================================================
   PASSO 2 - Trocar de tela (feed / meus anúncios / novo)
   ============================================================ */

function mostrarView(nome) {
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
    mostrarView(nomeDaTela);
  });
}

/* ============================================================
   PASSO 3 - Montar o card de um anúncio
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
      anuncio.id + '">' + textoBotao + "</button>" +
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
   PASSO 4 - Tela FEED (com busca e filtros)
   ============================================================ */

// Devolve só os anúncios que passam pela busca e pelos filtros
function anunciosFiltrados() {
  const texto = document.getElementById("busca").value.toLowerCase();
  const categoria = document.getElementById("filtro-categoria").value;
  const curso = document.getElementById("filtro-curso").value;

  const resultado = [];
  for (let i = 0; i < anuncios.length; i++) {
    const a = anuncios[i];

    const combinaTexto = texto === "" || a.titulo.toLowerCase().includes(texto);
    const combinaCategoria = categoria === "" || a.categoria === categoria;
    const combinaCurso = curso === "" || a.curso === curso;

    if (combinaTexto && combinaCategoria && combinaCurso) {
      resultado.push(a);
    }
  }
  return resultado;
}

function desenharFeed() {
  const lista = document.getElementById("lista-anuncios");
  const aviso = document.getElementById("vazio");
  const contador = document.getElementById("contador");

  const dados = anunciosFiltrados();

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
   PASSO 5 - Tela MEUS ANÚNCIOS
   Como não há login, "meus" são os anúncios criados nesta
   máquina (eles têm o campo meuAnuncio = true).
   ============================================================ */

function desenharMeus() {
  const lista = document.getElementById("lista-meus");
  const aviso = document.getElementById("meus-vazio");

  const meus = [];
  for (let i = 0; i < anuncios.length; i++) {
    if (anuncios[i].meuAnuncio === true) {
      meus.push(anuncios[i]);
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
document.getElementById("lista-meus").addEventListener("click", function (evento) {
  const botao = evento.target.closest("[data-acao]");
  if (botao === null) return; // não clicou num botão

  const id = Number(botao.dataset.id);

  // Acha o anúncio clicado dentro da lista
  let anuncioClicado = null;
  for (let i = 0; i < anuncios.length; i++) {
    if (anuncios[i].id === id) anuncioClicado = anuncios[i];
  }

  if (botao.dataset.acao === "vender") {
    anuncioClicado.vendido = !anuncioClicado.vendido; // inverte true/false
    salvarAnuncios(anuncios);
    desenharMeus();
    avisar(anuncioClicado.vendido ? "Anúncio marcado como vendido." : "Anúncio reativado.");
  }

  if (botao.dataset.acao === "apagar") {
    if (!confirm("Apagar este anúncio?")) return;

    // Monta uma nova lista sem o anúncio apagado
    const novaLista = [];
    for (let i = 0; i < anuncios.length; i++) {
      if (anuncios[i].id !== id) novaLista.push(anuncios[i]);
    }
    anuncios = novaLista;

    salvarAnuncios(anuncios);
    desenharMeus();
    avisar("Anúncio apagado.");
  }
});

/* ============================================================
   PASSO 6 - Modal de detalhe do anúncio
   ============================================================ */

function abrirDetalhe(id) {
  // Acha o anúncio pelo id
  let anuncio = null;
  for (let i = 0; i < anuncios.length; i++) {
    if (anuncios[i].id === id) anuncio = anuncios[i];
  }
  if (anuncio === null) return;

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
   PASSO 7 - Formulário de novo anúncio
   ============================================================ */

const form = document.getElementById("form-anuncio");

form.addEventListener("submit", function (evento) {
  evento.preventDefault();

  // Validação visual do Bootstrap (mostra os campos obrigatórios vazios)
  if (!form.checkValidity()) {
    form.classList.add("was-validated");
    return;
  }

  // Lê cada campo do formulário pelo atributo "name"
  const novo = {
    id: Date.now(), // número único baseado no horário atual
    titulo: form.titulo.value.trim(),
    preco: Number(form.preco.value),
    categoria: form.categoria.value,
    curso: form.curso.value,
    estado: form.estado.value,
    foto: form.foto.value.trim(),
    descricao: form.descricao.value.trim(),
    autor: form.autor.value.trim(),
    contato: form.contato.value.trim(),
    vendido: false,
    meuAnuncio: true, // marca que fui eu que criei
  };

  anuncios.push(novo);
  salvarAnuncios(anuncios);

  form.reset();
  form.classList.remove("was-validated");
  avisar("Anúncio publicado com sucesso!");
  mostrarView("feed");
});

/* ============================================================
   PASSO 8 - Mensagem de aviso (toast) no canto da tela
   ============================================================ */

function avisar(mensagem) {
  document.getElementById("toast-msg").textContent = mensagem;
  const toast = new bootstrap.Toast(document.getElementById("toast"), { delay: 2500 });
  toast.show();
}

/* ============================================================
   INÍCIO - quando a página abre, mostra o feed
   ============================================================ */

mostrarView("feed");
