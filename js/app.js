const USERS_DB_NAME = "meusRecadosAppUsers";
const RECADOS_DB_NAME = "meusRecadosAppRecados";
const SESSION_NAME = "meusRecadosApp";

if (
  !verificaSessaoUsuario() &&
  !(window.location.pathname === "/login.html" || window.location.pathname === "/cadastro.html")
) {
  document.body.innerHTML = "";
  window.location.href = "login.html";
}

// adiciona nome do usuario logado no html do app
const usernameSpan = document.querySelector("#usernameSpan");
if (usernameSpan) usernameSpan.innerText = usernameLogado();

// adiciona recados na table on page load
const recadosTableBody = document.getElementById("recadosTableBody");
if (recadosTableBody) atualizaTabelaRecados();

// troca direção seta em cada linha da tabela ao clicar
const tableRow = document.querySelectorAll(".main-row-table");
tableRow?.forEach((row) =>
  row.addEventListener("click", (e) => {
    let target = e.target.closest("tr").querySelector("i");

    target.classList.toggle("bi-chevron-down");
    target.classList.toggle("bi-chevron-right");
  })
);

// mostra senha no input caso acionado
function togglePasswordVisibility(event, campo) {
  const input = document.getElementById(campo);
  input.getAttribute("type") === "password"
    ? input.setAttribute("type", "text")
    : input.setAttribute("type", "password");

  const icon = event.target.tagName === "I" ? event.target : event.target.querySelector("i");

  icon.classList.toggle("bi-eye-slash-fill");
  icon.classList.toggle("bi-eye-fill");
}

// gera GUID
function generateGuid() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// form Submit novo cadastro usuário
const SignUpForm = document.querySelector("#SignUpForm");
SignUpForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const inputs = e.target.querySelectorAll("input");
  const novoUser = { id: generateGuid(), criado_em: String(Date.now()) };
  // valida inputs
  let error = false;
  inputs.forEach((input) => {
    novoUser[input.name] = input.value;
    if (!validarInput(input)) {
      adicionaErroDiv("formErrorFeedback", "Todos os campos devem ser preenchidos");
      error = true;
      return;
    }
  });
  if (error) return;
  if (novoUser.password !== novoUser.confirmPassword) {
    adicionaErroDiv("formErrorFeedback", "As senhas não conferem");
    return;
  }
  if (!verificaUsuarioUnico(novoUser.username)) {
    adicionaErroDiv("formErrorFeedback", "Uma pessoa já está utilizando este usuário");
    return;
  }
  if (!verificaEmailUnico(novoUser.email)) {
    adicionaErroDiv("formErrorFeedback", "Um usuário já está cadastrado com este e-mail");
    return;
  }
  delete novoUser.confirmPassword;
  if (!criaUsuario(novoUser)) {
    adicionaErroDiv("formErrorFeedback", "Um erro inesperado aconteceu, tente novamente!");
    return;
  }
  criaSessaoUsuario(novoUser.id);
  SignUpForm.reset();
  window.location.href = "index.html";
});

// form login
const loginForm = document.querySelector("#loginForm");
loginForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const inputs = e.target.querySelectorAll("input");
  const user = {};
  // valida inputs
  let error = false;
  inputs.forEach((input) => {
    user[input.name] = input.value;
    if (!validarInput(input)) {
      adicionaErroDiv("formErrorFeedback", "Todos os campos devem ser preenchidos");
      error = true;
      return;
    }
  });
  if (error) return;
  if (!conferirDadosLogin(user.username, user.password)) {
    adicionaErroDiv("formErrorFeedback", "Usuário e/ou senha não conferem");
    loginForm.reset();
    return;
  }

  window.location.href = "index.html";
});

// form novo recado
const novoRecadoForm = document.querySelector("#novoRecadoForm");
novoRecadoForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const inputs = e.target.querySelectorAll("input");
  const novoRecado = { userId: usuarioIdLogado() };
  let error = false;
  inputs.forEach((input) => {
    if (!validarInput(input)) {
      adicionaErroDiv("formErrorFeedback", "Todos os campos devem ser preenchidos");
      error = true;
      return;
    }
    novoRecado[input.name] = input.value;
  });
  if (error) return;
  criarRecado(novoRecado.userId, novoRecado.assunto, novoRecado.mensagem);
  atualizaTabelaRecados();
  novoRecadoForm.reset();
});

// form edita recado
const editarRecadoForm = document.querySelector("#editarRecadoForm");
const btnEditarRegistroModal = document.querySelector("#btnEditarRegistroModal");
btnEditarRegistroModal?.addEventListener("click", (e) => {
  const inputs = editarRecadoForm.querySelectorAll("input");
  const recadoEditado = {};
  let error = false;
  inputs.forEach((input) => {
    if (!validarInput(input)) {
      adicionaErroDiv("formEditarErrorFeedback", "Todos os campos devem ser preenchidos");
      error = true;
      return;
    }
    recadoEditado[input.name] = input.value;
  });
  if (error) return;
  const modalEditar = bootstrap.Modal.getInstance(document.getElementById("modalEditarRecado"));
  if (editarRecado(recadoEditado.id, recadoEditado.assunto, recadoEditado.mensagem))
    modalEditar.hide();
  editarRecadoForm.reset();
  atualizaTabelaRecados();
});

// funçao para validar inputs
// retorna FALSE se possui erro
function validarInput(input) {
  const valor = input.value;
  if (!valor.length > 0) return false;
  if (input.type === "password" && valor.length < 6) return false;

  return true;
}

// adiciona mensagem de erro a div especifica
function adicionaErroDiv(divID, mensagem) {
  const divError = document.getElementById(divID);
  divError.innerText = mensagem;
  divError.classList.remove("d-none");
}

// retorna users do localStorage
function obterUsuarios() {
  return JSON.parse(localStorage.getItem(USERS_DB_NAME)) || [];
}

// verifica se existe usuario com mesmo email
// retorna TRUE se é unico
function verificaEmailUnico(emailNovo) {
  const emails = obterUsuarios();
  return !emails.map((user) => user?.email || "").includes(emailNovo);
}

// verifica se existe user com mesmo username
// retorna TRUE se é unico
function verificaUsuarioUnico(usuarioNovo) {
  const users = obterUsuarios();
  return !users.map((user) => user?.username || "").includes(usuarioNovo);
}

// gera GUID
function generateGuid() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// salva novo usuario no localStorage
function criaUsuario(user) {
  if (!user) return false;
  const usuarios = obterUsuarios();
  usuarios.push(user);
  salvaUsuarios(usuarios);
  return true;
}

// retorna objeto usuario
function obterUsuarioId(userId) {
  const usuarios = obterUsuarios();
  const indexUser = usuarios.map((user) => user.id).indexOf(userId);
  return indexUser > -1 ? usuarios[indexUser] : null;
}

// retorna objeto usuario
function obterUsuarioUsername(username) {
  const usuarios = obterUsuarios();
  const indexUser = usuarios.map((user) => user.username).indexOf(username);
  return indexUser > -1 ? usuarios[indexUser] : null;
}

// confere dados e loga usuario se certo
function conferirDadosLogin(usernameInput, passwordInput) {
  const userdb = obterUsuarioUsername(usernameInput);
  if (!userdb) return false;
  if (passwordInput !== userdb.password) return false;

  criaSessaoUsuario(userdb.id);
  return true;
}

// retorna array com recados
function obterRecados(userId = null) {
  const recados = JSON.parse(localStorage.getItem(RECADOS_DB_NAME)) || [];
  if (userId) return recados.filter((recado) => recado.userId === userId);
  return recados;
}

// retorna recado especifico
function obterRecado(recadoId) {
  const recados = JSON.parse(localStorage.getItem(RECADOS_DB_NAME)) || [];
  return recados.filter((recado) => recado.id === recadoId)[0];
}

// salva recados no localstorage
function salvaRecados(recados) {
  localStorage.setItem(RECADOS_DB_NAME, JSON.stringify(recados));
}

// cria sessao para usuario logado
function criaSessaoUsuario(userId) {
  sessionStorage.setItem(SESSION_NAME, userId);
}

// verifica sessao usuario logado
function verificaSessaoUsuario() {
  return sessionStorage.getItem(SESSION_NAME) ? true : false;
}

// deleta sessao usuario logado
function deletaSessaoUsuario() {
  sessionStorage.removeItem(SESSION_NAME);
  window.location.reload();
}

// retorna username logado
function usernameLogado() {
  return obterUsuarioId(sessionStorage.getItem(SESSION_NAME)).username;
}

// retorna id do usuario logado
function usuarioIdLogado() {
  return sessionStorage.getItem(SESSION_NAME);
}

// cria recado
function criarRecado(userId, assunto, mensagem) {
  if (!userId || !assunto || !mensagem) return;
  const novoRecado = {
    id: generateGuid(),
    userId: userId,
    assunto: assunto,
    mensagem: mensagem,
    criado_em: String(new Date().toJSON()),
    editado_em: String(new Date().toJSON()),
  };
  const recados = obterRecados();
  recados.push(novoRecado);
  salvaRecados(recados);
}

// edita recado
// retorna false se erro, ou true se tudo certo
function editarRecado(recadoId, assunto, mensagem) {
  if (!recadoId || !assunto || !mensagem) return;
  const recadoEditar = obterRecado(recadoId);
  if (!recadoEditar) return false;
  recadoEditar.assunto = assunto;
  recadoEditar.mensagem = mensagem;
  recadoEditar.editado_em = String(new Date().toJSON());

  const recados = obterRecados();
  const indexOfRecadoAEditar = recados.map((recado) => recado.id).indexOf(recadoId);
  if (indexOfRecadoAEditar < 0) return false;
  recados[indexOfRecadoAEditar] = recadoEditar;
  salvaRecados(recados);
  return true;
}

// deleta recado
function deletaRecado(recadoId) {
  const recados = obterRecados().filter((recado) => recado.id !== recadoId);
  salvaRecados(recados);
  atualizaTabelaRecados();
}

// retorna indexOf usuario no array de usuarios
function indexOfUserId(userId) {
  const usuarios = obterUsuarios();
  return usuarios.map((user) => user.id).indexOf(userId);
}

// salva dados usuarios
function salvaUsuarios(users) {
  localStorage.setItem(USERS_DB_NAME, JSON.stringify(users));
}

// converte data para dd/mm/YYYY
function converteData(data) {
  data = data.slice(0, 10).split("-");
  return `${data[2]}/${data[1]}/${data[0]}`;
}

function atualizaTabelaRecados() {
  recadosTableBody.innerHTML = "";
  const recados = obterRecados(usuarioIdLogado());

  recados.forEach((recado) => {
    // cria <tr>
    const tr = document.createElement("tr");
    tr.role = "button";
    tr.setAttribute("data-bs-toggle", "collapse");
    tr.setAttribute("data-bs-target", `#recado_${recado.id}`);
    tr.classList.add("align-middle", "main-row-table");
    // cria <td> icon
    const tdIcon = document.createElement("td");
    tdIcon.innerHTML = "<i class='bi bi-chevron-down'></i>";
    tr.appendChild(tdIcon);
    // cria <td> assunto
    const tdAssunto = document.createElement("td");
    tdAssunto.classList.add("text-break");
    tdAssunto.innerText = `${recado.assunto}`;
    tr.appendChild(tdAssunto);
    // cria <td> mensagem
    const tdMensagem = document.createElement("td");
    tdMensagem.classList.add("text-break");
    tdMensagem.innerText = `${recado.mensagem}`;
    tr.appendChild(tdMensagem);
    // cria <td> buttons
    const tdButtons = document.createElement("td");
    const divButtons = document.createElement("div");
    divButtons.classList.add(
      "d-flex",
      "flex-column",
      "flex-md-row",
      "gap-2",
      "justify-content-center",
      "align-content-center"
    );
    // cria button Editar
    const buttonEditar = document.createElement("button");
    buttonEditar.classList.add("btn", "btn-sm", "btn-outline-primary");
    buttonEditar.onclick = `carregarEditar(${recado.id})`;
    buttonEditar.setAttribute("onClick", `carregarEditar('${recado.id}')`);
    buttonEditar.setAttribute("data-bs-toggle", "modal");
    buttonEditar.setAttribute("data-bs-target", "#modalEditarRecado");
    buttonEditar.innerText = "Editar";
    divButtons.appendChild(buttonEditar);
    // cria button Deletar
    const buttonDeletar = document.createElement("button");
    buttonDeletar.classList.add("btn", "btn-sm", "btn-outline-danger", "inline-block");
    buttonDeletar.setAttribute("onClick", `carregarDeletar('${recado.id}')`);
    buttonDeletar.innerText = "Deletar";
    buttonDeletar.setAttribute("data-bs-toggle", "modal");
    buttonDeletar.setAttribute("data-bs-target", "#modalConfirmarExclusao");
    divButtons.appendChild(buttonDeletar);
    tdButtons.appendChild(divButtons);
    tr.appendChild(tdButtons);
    recadosTableBody.appendChild(tr);

    // cria tr com info extra
    const trInfo = document.createElement("tr");
    trInfo.classList.add("collapse", "accordion-collapse");
    trInfo.id = `recado_${recado.id}`;
    trInfo.setAttribute("data-bs-parent", `.table`);
    const tdCriado = document.createElement("td");
    tdCriado.colSpan = "2";
    tdCriado.classList.add("text-center", "text-small");
    tdCriado.innerHTML = `<span class="fw-bold">Criado em: </span><br /><span>${converteData(
      recado.criado_em
    )}</span>`;
    const tdEditado = document.createElement("td");
    tdEditado.colSpan = "2";
    tdEditado.classList.add("text-center", "text-small");
    tdEditado.innerHTML = `<span class="fw-bold">Editado em: </span><br /><span>${converteData(
      recado.editado_em
    )}</span>`;

    trInfo.appendChild(tdCriado);
    trInfo.appendChild(tdEditado);
    recadosTableBody.appendChild(trInfo);
  });
}

// atualiza info modal para excluir recado
function carregarDeletar(idRecado) {
  const btnExcluirRegistroModal = document.getElementById("btnExcluirRegistroModal");
  btnExcluirRegistroModal.setAttribute("onClick", `deletaRecado('${idRecado}')`);
}

// atualiza info modal para editar recado
function carregarEditar(idRecado) {
  const recado = obterRecado(idRecado);
  const inputs = editarRecadoForm.querySelectorAll("input");
  inputs.forEach((input) => {
    input.value = recado[input.name];
  });
}

// limpa erro do modal editar ao sair da tela
document.getElementById("modalEditarRecado")?.addEventListener("hidden.bs.modal", () => {
  document.querySelector("#formEditarErrorFeedback").classList.add("d-none");
});
