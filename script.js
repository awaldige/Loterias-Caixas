// ========================
// CONFIG
// ========================
const loterias = {
  megasena: { nome: "Mega-Sena", imagem: "mega-sena.png" },
  quina: { nome: "Quina", imagem: "quina.png" },
  lotofacil: { nome: "Lotofácil", imagem: "lotofácil.jpeg" },
  diadesorte: { nome: "Dia de Sorte", imagem: "dia-de-sorte.jpeg" },
  loteca: { nome: "Loteca", imagem: "loteca.png" },
  duplasena: { nome: "Dupla Sena", imagem: "dupla-sena.png" },
  lotomania: { nome: "Lotomania", imagem: "lotomania.jpeg" },
  maismilionaria: { nome: "+Milionária", imagem: "mais-milionaria.png" },
  supersete: { nome: "Super Sete", imagem: "super-sete.png" },
  timemania: { nome: "Timemania", imagem: "timemania.jpeg" }
};

const container = document.getElementById("cards-container");

// ========================
// CRIAR CARDS
// ========================
for (const [key, { nome, imagem }] of Object.entries(loterias)) {
  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <img src="${imagem}" alt="${nome}">
    <h2>${nome}</h2>

    <input type="number" id="concurso-${key}" placeholder="Digite nº">

    <div class="botoes">
      <button onclick="consultarLoteria('${key}')">Consultar</button>
      <button onclick="ultimoResultado('${key}')">Último</button>
      <button class="limpar" onclick="limparConsulta('${key}')">Limpar</button>
    </div>

    <div class="resultado" id="resultado-${key}"></div>
  `;

  container.appendChild(card);
}

// ========================
// LOADING
// ========================
function loading(el) {
  el.innerHTML = `<div class="loader"></div>`;
}

// ========================
// LIMPAR
// ========================
function limparConsulta(tipo) {
  document.getElementById(`concurso-${tipo}`).value = "";
  document.getElementById(`resultado-${tipo}`).innerHTML = "";
  localStorage.removeItem(`ultimo-${tipo}`);
}

// ========================
// ÚLTIMO RESULTADO
// ========================
async function ultimoResultado(tipo) {
  const div = document.getElementById(`resultado-${tipo}`);
  loading(div);

  try {
    const res = await fetch(`https://servicebus2.caixa.gov.br/portaldeloterias/api/${tipo}`);
    const data = await res.json();

    mostrarResultado(tipo, data);

    document.getElementById(`concurso-${tipo}`).value = data.numero;
    localStorage.setItem(`ultimo-${tipo}`, data.numero);

  } catch {
    div.innerHTML = "Erro ao buscar último";
  }
}

// ========================
// CONSULTAR
// ========================
async function consultarLoteria(tipo) {
  const numero = document.getElementById(`concurso-${tipo}`).value;
  const div = document.getElementById(`resultado-${tipo}`);

  if (!numero) {
    div.innerHTML = "Digite um número";
    return;
  }

  loading(div);

  try {
    const res = await fetch(`https://servicebus2.caixa.gov.br/portaldeloterias/api/${tipo}/${numero}`);
    const data = await res.json();

    mostrarResultado(tipo, data);

    localStorage.setItem(`ultimo-${tipo}`, numero);

  } catch {
    div.innerHTML = "Erro na consulta";
  }
}

// ========================
// RESULTADO
// ========================
function mostrarResultado(tipo, data) {
  const div = document.getElementById(`resultado-${tipo}`);

  let html = `
    <div class="info">
      <span>Concurso ${data.numero}</span>
      <span>${data.dataApuracao || ""}</span>
    </div>
  `;

  // ========================
  // LOTECA (CORRIGIDA)
  // ========================
  if (tipo === "loteca") {
    const jogos = data.listaResultadoEquipeEsportiva || [];

    html += `<div class="loteca-container">`;

    jogos.forEach(j => {
      const t1 = j.nomeEquipeUm || j.nomeEquipeMandante || "Time 1";
      const t2 = j.nomeEquipeDois || j.nomeEquipeVisitante || "Time 2";

      const g1 =
        j.qtGolsEquipeUm ??
        j.placarEquipeUm ??
        j.nuGolEquipeUm ??
        j.golsEquipeUm;

      const g2 =
        j.qtGolsEquipeDois ??
        j.placarEquipeDois ??
        j.nuGolEquipeDois ??
        j.golsEquipeDois;

      let meio = "";

      if (
        g1 !== undefined && g1 !== null && g1 !== "" &&
        g2 !== undefined && g2 !== null && g2 !== ""
      ) {
        meio = `<div class="placar-badge">${g1} x ${g2}</div>`;
      } else if (j.icColunaUm || j.icColunaMeio || j.icColunaDois) {
        meio = `
          <div class="colunas">
            <span class="${j.icColunaUm ? "ativo" : ""}">1</span>
            <span class="${j.icColunaMeio ? "ativo" : ""}">X</span>
            <span class="${j.icColunaDois ? "ativo" : ""}">2</span>
          </div>
        `;
      } else {
        meio = `<div class="sem-resultado">-</div>`;
      }

      html += `
        <div class="jogo-card">
          <div class="jogo-times">
            <span class="time">${t1}</span>
            ${meio}
            <span class="time">${t2}</span>
          </div>
        </div>
      `;
    });

    html += `</div>`;
  }

  // ========================
  // OUTRAS LOTERIAS
  // ========================
  else {
    const dezenas =
      data.listaDezenas ||
      data.dezenasSorteadasOrdemSorteio ||
      [];

    html += `<div class="numeros">`;
    dezenas.forEach(n => html += `<span>${n}</span>`);
    html += `</div>`;

    // +Milionária (trevos com espaçamento correto)
    if (tipo === "maismilionaria") {
      const trevos =
        data.listaTrevos ||
        data.trevosSorteados ||
        [];

      html += `<div class="trevos">`;
      trevos.forEach(t => html += `<span>${t}</span>`);
      html += `</div>`;
    }

    // extras
    if (tipo === "timemania" || tipo === "diadesorte") {
      html += `<div class="extra">Extra: ${data.nomeTimeCoracaoMesSorte || "n/d"}</div>`;
    }
  }

  div.innerHTML = html;
}

// ========================
// TEMA
// ========================
const botaoTema = document.getElementById("toggle-tema");

function aplicarTema(t) {
  document.body.classList.toggle("dark", t === "dark");
}

const temaSalvo = localStorage.getItem("tema") || "light";
aplicarTema(temaSalvo);

botaoTema?.addEventListener("click", () => {
  const novo = document.body.classList.contains("dark") ? "light" : "dark";
  aplicarTema(novo);
  localStorage.setItem("tema", novo);
});

// ========================
// ENTER
// ========================
document.addEventListener("keypress", e => {
  if (e.key === "Enter") {
    const ativo = document.activeElement;
    if (ativo && ativo.id.includes("concurso-")) {
      const tipo = ativo.id.replace("concurso-", "");
      consultarLoteria(tipo);
    }
  }
});
