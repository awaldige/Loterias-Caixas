// ========================
// CONFIGURAÇÃO LOTERIAS
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

// ========================
// CRIAR CARDS
// ========================
const container = document.getElementById("cards-container");

for (const [key, { nome, imagem }] of Object.entries(loterias)) {
  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <img src="${imagem}" alt="${nome}">
    <h2>${nome}</h2>

    <label for="concurso-${key}">Concurso:</label>
    <input type="number" id="concurso-${key}" placeholder="Digite nº" min="1">

    <button onclick="consultarLoteria('${key}')">Consultar</button>

    <div class="resultado" id="resultado-${key}"></div>
  `;

  container.appendChild(card);
}

// ========================
// CONSULTAR LOTERIA
// ========================
async function consultarLoteria(tipo) {
  const resultadoDiv = document.getElementById(`resultado-${tipo}`);
  const numero = document.getElementById(`concurso-${tipo}`).value;

  if (!numero) {
    resultadoDiv.textContent = "Informe um número.";
    return;
  }

  resultadoDiv.innerHTML = "Carregando...";

  try {
    const url = `https://servicebus2.caixa.gov.br/portaldeloterias/api/${tipo}/${numero}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error("Concurso não encontrado.");

    const data = await res.json();

    let html = `<strong>Data:</strong> ${data.dataApuracao || "n/d"}<br>`;

    // ========================
    // LOTECA (VERSÃO DEFINITIVA)
    // ========================
    if (tipo === "loteca") {

      const jogos = data.listaResultadoEquipeEsportiva;

      if (jogos && jogos.length > 0) {

        jogos.forEach((j, i) => {

          console.log("DEBUG LOTECA:", j);

          const time1 = j.nomeEquipeUm || j.nomeEquipeMandante || "Time 1";
          const time2 = j.nomeEquipeDois || j.nomeEquipeVisitante || "Time 2";

          let resultado = "";

          // ========================
          // 1. PLACAR DIRETO
          // ========================
          const g1 =
            j.qtGolsEquipeUm ??
            j.placarEquipeUm ??
            j.nuGolEquipeUm;

          const g2 =
            j.qtGolsEquipeDois ??
            j.placarEquipeDois ??
            j.nuGolEquipeDois;

          if (
            g1 !== undefined && g2 !== undefined &&
            g1 !== null && g2 !== null &&
            String(g1) !== "" && String(g2) !== ""
          ) {
            resultado = `<strong>${g1} x ${g2}</strong>`;
          }

          // ========================
          // 2. COLUNAS (1 X 2)
          // ========================
          else if (
            j.icColunaUm ||
            j.icColunaMeio ||
            j.icColunaDois
          ) {
            const c1 = j.icColunaUm ? "<b>1</b>" : "1";
            const cE = j.icColunaMeio ? "<b>X</b>" : "X";
            const c2 = j.icColunaDois ? "<b>2</b>" : "2";

            resultado = `${c1} | ${cE} | ${c2}`;
          }

          // ========================
          // 3. RESULTADO TEXTO
          // ========================
          else if (j.descResultado && j.descResultado.trim() !== "") {
            resultado = `<strong>${j.descResultado}</strong>`;
          }

          else if (j.resultado && j.resultado.trim() !== "") {
            resultado = `<strong>${j.resultado}</strong>`;
          }

          else if (j.sgResultado && j.sgResultado.trim() !== "") {
            resultado = `<strong>${j.sgResultado}</strong>`;
          }

          // ========================
          // 4. FALLBACK FINAL
          // ========================
          else {
            resultado = "<em>Resultado não disponível</em>";
          }

          html += `
            <div style="margin-bottom:10px">
              <strong>Jogo ${i + 1}:</strong><br>
              ${time1} ${resultado} ${time2}
              <br><small>${j.nomeCampeonato || ""}</small>
            </div>
            <hr style="border:0;border-top:1px solid #eee;">
          `;
        });

      } else {
        html += "Nenhum jogo encontrado para este concurso.";
      }
    }

    // ========================
    // OUTRAS LOTERIAS
    // ========================
    else {

      const dezenas =
        data.listaDezenas ||
        data.dezenasSorteadasOrdemSorteio ||
        [];

      html += `<strong>Números:</strong> ${dezenas.join(" - ")}`;

      // +Milionária
      if (tipo === "maismilionaria") {
        const trevos =
          data.listaTrevos ||
          data.listaDezenasSegundoSorteio ||
          (data.trevosSorteados ? [data.trevosSorteados] : []);

        if (trevos.length > 0) {
          html += `<br><b style="color:#d4af37">Trevos: ${trevos.join(" - ")}</b>`;
        }
      }

      // Timemania / Dia de Sorte
      if (tipo === "timemania" || tipo === "diadesorte") {
        html += `<br><strong>Extra:</strong> ${data.nomeTimeCoracaoMesSorte || "n/d"}`;
      }

      // Dupla Sena
      if (tipo === "duplasena" && data.listaDezenasSegundoSorteio) {
        html += `<br><strong>2º Sorteio:</strong> ${data.listaDezenasSegundoSorteio.join(" - ")}`;
      }
    }

    resultadoDiv.innerHTML = html;

  } catch (e) {
    resultadoDiv.innerHTML = `<span style="color:red">Erro na API da Caixa: ${e.message}</span>`;
    console.error("Erro completo:", e);
  }
}

// ========================
// TEMA DARK
// ========================
document.getElementById("toggle-tema").onclick = () => {
  document.body.classList.toggle("dark");
};
