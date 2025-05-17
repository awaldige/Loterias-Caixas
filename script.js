const loterias = {
  megasena: { nome: "Mega-Sena", imagem: "mega-sena.png" },
  quina: { nome: "Quina", imagem: "quina.png" },
  lotofacil: { nome: "Lotofácil", imagem: "lotofácil.jpeg" },
  diadesorte: { nome: "Dia de Sorte", imagem: "dia-de-sorte.jpeg" },
  loteca: { nome: "Loteca", imagem: "loteca.png" },
  duplasena: { nome: "Dupla Sena", imagem: "dupla-sena.png" },
  lotomania: { nome: "Lotomania", imagem: "lotomania.jpeg" },
  maismilionaria: { nome: "+Milionária", imagem: "+milionária.png" },
  supersete: { nome: "Super Sete", imagem: "super-sete.png" },
  timemania: { nome: "Timemania", imagem: "timemania.jpeg" }
};

const container = document.getElementById("cards-container");

for (const [key, { nome, imagem }] of Object.entries(loterias)) {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <img src="${imagem}" alt="${nome}">
    <h2>${nome}</h2>
    <label for="concurso-${key}">Concurso:</label>
    <input type="number" id="concurso-${key}" placeholder="Digite o nº do concurso" min="1">
    <button onclick="consultarLoteria('${key}')">Consultar</button>
    <div class="resultado" id="resultado-${key}"></div>
  `;
  container.appendChild(card);
}

async function consultarLoteria(tipo) {
  const concursoInput = document.getElementById(`concurso-${tipo}`);
  const resultadoDiv = document.getElementById(`resultado-${tipo}`);
  const numero = concursoInput.value;

  if (!numero) {
    resultadoDiv.textContent = "Informe um número de concurso.";
    return;
  }

  const url = `https://servicebus2.caixa.gov.br/portaldeloterias/api/${tipo}/${numero}`;

  try {
    const res = await fetch(url, {
      headers: { "Accept": "application/json" }
    });

    if (!res.ok) {
      throw new Error(`Erro ${res.status}: concurso não encontrado ou indisponível.`);
    }

    const data = await res.json();
    const dataApuracao = data.dataApuracao || "Data não disponível";
    let resultado = `<strong>Data:</strong> ${dataApuracao}<br>`;

    if (tipo === "maismilionaria") {
      const dezenas = data.listaDezenas || [];
      const trevos = data.listaTrevos || data.listaDezenasSegundoSorteio || data.trevosSorteados || [];
      resultado += `<strong>Dezenas:</strong> ${dezenas.join(", ")}`;
      resultado += trevos.length > 0
        ? `<br><strong>Trevos da Sorte:</strong> ${trevos.join(", ")}`
        : `<br><strong>Trevos da Sorte:</strong> Informação indisponível.`;
    } else if (tipo === "loteca") {
      if (data.listaResultadoEquipeEsportiva && data.listaResultadoEquipeEsportiva.length > 0) {
        resultado += "<strong>Jogos:</strong><br>";

        data.listaResultadoEquipeEsportiva.forEach(jogo => {
          const diaSemana = jogo.diaSemana || "Dia não disponível";
          const dtJogo = jogo.dtJogo || "Data não disponível";
          const nomeCampeonato = jogo.nomeCampeonato || "Campeonato não disponível";
          const timeMandante = jogo.nomeEquipeUm || "Time Mandante não disponível";
          const timeVisitante = jogo.nomeEquipeDois || "Time Visitante não disponível";
          const placarMandante = jogo.placarMandante;
          const placarVisitante = jogo.placarVisitante;

          resultado += `<br><strong>${diaSemana}, ${dtJogo}</strong><br>`;
          resultado += `Campeonato: ${nomeCampeonato}<br>`;

          const placarValido = (p) => p !== null && p !== undefined && p !== '' && !isNaN(p);
          if (placarValido(placarMandante) && placarValido(placarVisitante)) {
            resultado += `${timeMandante} ${placarMandante} x ${placarVisitante} ${timeVisitante}`;
          } else {
            resultado += `${timeMandante} x ${timeVisitante} (Placar indisponível)`;
          }
        });
      } else {
        resultado += "Resultados dos jogos indisponíveis.";
      }
    } else {
      const dezenas = data.listaDezenas || data.dezenasSorteadasOrdemSorteio || [];
      resultado += `<strong>Números sorteados:</strong> ${dezenas.join(", ")}`;

      if (tipo === "timemania" && data.nomeTimeCoracaoMesSorte) {
        resultado += `<br><strong>Time do Coração:</strong> ${data.nomeTimeCoracaoMesSorte}`;
      }
    }

    resultadoDiv.innerHTML = resultado;

  } catch (error) {
    console.error(error);
    resultadoDiv.textContent = `Erro: ${error.message}`;
  }
}
document.getElementById("toggle-tema").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

  
  
