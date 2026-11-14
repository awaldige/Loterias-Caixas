
"use strict";

/* =========================================================
   LOTERIAS-CAIXAS
   Consulta de resultados das loterias da Caixa
   Projeto independente — AW TECHNOLOGY
========================================================= */

/* =========================
   CONFIGURAÇÕES
========================= */

const API_BASE =
    "https://servicebus2.caixa.gov.br/portaldeloterias/api";

const loterias = {
    megasena: {
        nome: "Mega-Sena",
        imagem: "mega-sena.png"
    },
    quina: {
        nome: "Quina",
        imagem: "quina.png"
    },
    lotofacil: {
        nome: "Lotofácil",
        imagem: "lotofácil.jpeg"
    },
    diadesorte: {
        nome: "Dia de Sorte",
        imagem: "dia-de-sorte.jpeg"
    },
    loteca: {
        nome: "Loteca",
        imagem: "loteca.png"
    },
    duplasena: {
        nome: "Dupla Sena",
        imagem: "dupla-sena.png"
    },
    lotomania: {
        nome: "Lotomania",
        imagem: "lotomania.jpeg"
    },
    maismilionaria: {
        nome: "+Milionária",
        imagem: "mais-milionaria.png"
    },
    supersete: {
        nome: "Super Sete",
        imagem: "super-sete.png"
    },
    timemania: {
        nome: "Timemania",
        imagem: "timemania.jpeg"
    }
};

const cardsContainer = document.getElementById("cards-container");
const botaoTema = document.getElementById("toggle-tema");

const requisicoesAtivas = new Set();

/* =========================
   LOCAL STORAGE SEGURO
========================= */

function salvarLocalStorage(chave, valor) {
    try {
        localStorage.setItem(chave, valor);
    } catch (erro) {
        console.warn("Não foi possível salvar a preferência:", erro);
    }
}

function lerLocalStorage(chave) {
    try {
        return localStorage.getItem(chave);
    } catch (erro) {
        console.warn("Não foi possível recuperar a preferência:", erro);
        return null;
    }
}

/* =========================
   TEMA CLARO E ESCURO
========================= */

function aplicarTema(tema) {
    const temaEscuro = tema === "escuro";

    document.body.classList.toggle("dark", temaEscuro);

    if (botaoTema) {
        const icone = botaoTema.querySelector(".theme-icon");
        const texto = botaoTema.querySelector(".theme-label");

        if (icone) {
            icone.textContent = temaEscuro ? "☀️" : "🌙";
        }

        if (texto) {
            texto.textContent = temaEscuro ? "Tema claro" : "Tema escuro";
        }

        botaoTema.setAttribute("aria-pressed", String(temaEscuro));
        botaoTema.setAttribute(
            "aria-label",
            temaEscuro ? "Ativar tema claro" : "Ativar tema escuro"
        );
    }
}

function alternarTema() {
    const temaAtual = document.body.classList.contains("dark")
        ? "escuro"
        : "claro";

    const novoTema = temaAtual === "escuro" ? "claro" : "escuro";

    aplicarTema(novoTema);
    salvarLocalStorage("tema", novoTema);
}

/* =========================
   CRIAÇÃO DOS CARDS
========================= */

function criarElemento(tag, classe, texto) {
    const elemento = document.createElement(tag);

    if (classe) {
        elemento.className = classe;
    }

    if (texto !== undefined && texto !== null) {
        elemento.textContent = texto;
    }

    return elemento;
}

function criarCards() {
    if (!cardsContainer) {
        console.error("Container dos cards não encontrado.");
        return;
    }

    cardsContainer.replaceChildren();

    Object.entries(loterias).forEach(([tipo, loteria]) => {
        const card = criarElemento("article", "card");

        const imagem = document.createElement("img");
        imagem.src = `assets/img/${loteria.imagem}`;
        imagem.alt = `Logo ${loteria.nome}`;
        imagem.loading = "lazy";
        imagem.decoding = "async";

        imagem.addEventListener("error", () => {
            imagem.style.display = "none";
        });

        const titulo = criarElemento("h2", "", loteria.nome);

        const input = document.createElement("input");
        input.type = "number";
        input.min = "1";
        input.step = "1";
        input.placeholder = "Número do concurso";
        input.id = `concurso-${tipo}`;
        input.setAttribute("aria-label", `Número do concurso da ${loteria.nome}`);

        const botoes = criarElemento("div", "botoes");

        const botaoConsultar = criarElemento("button", "", "Consultar");
        botaoConsultar.type = "button";
        botaoConsultar.addEventListener("click", () => {
            consultarLoteria(tipo);
        });

        const botaoUltimo = criarElemento("button", "", "Último resultado");
        botaoUltimo.type = "button";
        botaoUltimo.addEventListener("click", () => {
            ultimoResultado(tipo);
        });

        const botaoLimpar = criarElemento("button", "", "Limpar");
        botaoLimpar.type = "button";
        botaoLimpar.addEventListener("click", () => {
            limparResultado(tipo);
        });

        botoes.append(
            botaoConsultar,
            botaoUltimo,
            botaoLimpar
        );

        const resultado = criarElemento("div", "resultado");
        resultado.id = `resultado-${tipo}`;
        resultado.setAttribute("aria-live", "polite");

        card.append(
            imagem,
            titulo,
            input,
            botoes,
            resultado
        );

        cardsContainer.appendChild(card);

        restaurarUltimoConcurso(tipo);
    });
}

/* =========================
   RESTAURAR ÚLTIMO CONCURSO
========================= */

function restaurarUltimoConcurso(tipo) {
    const numero = lerLocalStorage(`ultimo-${tipo}`);
    const input = document.getElementById(`concurso-${tipo}`);

    if (input && numero) {
        input.value = numero;
    }
}

/* =========================
   MENSAGENS E CARREGAMENTO
========================= */

function mostrarCarregamento(tipo) {
    const resultado = document.getElementById(`resultado-${tipo}`);

    if (!resultado) return;

    resultado.replaceChildren();

    const carregamento = criarElemento("div", "carregamento");
    const loader = criarElemento("div", "loader");
    const mensagem = criarElemento("p", "", "Consultando resultado...");

    carregamento.append(loader, mensagem);
    resultado.appendChild(carregamento);
}

function mostrarMensagem(tipo, mensagem, classe = "mensagem-erro") {
    const resultado = document.getElementById(`resultado-${tipo}`);

    if (!resultado) return;

    resultado.replaceChildren();

    const paragrafo = criarElemento("p", classe, mensagem);
    resultado.appendChild(paragrafo);
}

/* =========================
   REQUISIÇÃO À API
========================= */

async function buscarResultado(tipo, numero = null) {
    if (!loterias[tipo]) {
        mostrarMensagem(tipo, "Modalidade não reconhecida.");
        return null;
    }

    const resultado = document.getElementById(`resultado-${tipo}`);

    if (!resultado || requisicoesAtivas.has(tipo)) {
        return null;
    }

    requisicoesAtivas.add(tipo);
    mostrarCarregamento(tipo);

    const controlador = new AbortController();
    const tempoLimite = setTimeout(() => controlador.abort(), 20000);

    try {
        let url = `${API_BASE}/${encodeURIComponent(tipo)}`;

        if (numero !== null) {
            url += `/${encodeURIComponent(numero)}`;
        }

        const resposta = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json, text/plain, */*"
            },
            cache: "no-store",
            signal: controlador.signal
        });


if (!resposta.ok) {
    const corpoErro = await resposta.text();

    let detalhe = corpoErro;

    try {
        const erroApi = JSON.parse(corpoErro);

        detalhe =
            erroApi.exceptionMessage ||
            erroApi.message ||
            erroApi.mensagem ||
            corpoErro;
    } catch {
        // Mantém o conteúdo original caso não seja JSON.
    }

    console.error("Erro retornado pela API da Caixa:", {
        modalidade: tipo,
        url,
        status: resposta.status,
        detalhe
    });

    throw new Error(
        `Erro ${resposta.status}: ${detalhe}`
    );
}


        const dados = await resposta.json();

        if (!dados || typeof dados !== "object" || !dados.numero) {
            throw new Error("A resposta recebida não contém um resultado válido.");
        }

        salvarLocalStorage(`ultimo-${tipo}`, dados.numero);

        const input = document.getElementById(`concurso-${tipo}`);

        if (input) {
            input.value = dados.numero;
        }

        mostrarResultado(tipo, dados);

        return dados;


} catch (erro) {
    console.error(`Erro na consulta de ${tipo}:`, erro);

    let mensagem = erro.message || "Ocorreu um erro inesperado.";

    if (erro.name === "AbortError") {
        mensagem = "A consulta demorou demais. Tente novamente.";
    } else if (erro instanceof TypeError) {
        mensagem = "Não foi possível acessar a API. Verifique sua conexão ou tente novamente mais tarde.";
    } else if (tipo === "supersete" && mensagem.includes("500")) {
        mensagem = "O Super Sete está temporariamente indisponível. O serviço de consulta da Caixa apresentou uma falha. Tente novamente mais tarde.";
    }

    mostrarMensagem(tipo, mensagem);

    return null;

    } finally {
        clearTimeout(tempoLimite);
        requisicoesAtivas.delete(tipo);
    }
}

/* =========================
   CONSULTAR CONCURSO
========================= */

async function consultarLoteria(tipo) {
    const input = document.getElementById(`concurso-${tipo}`);

    if (!input) return;

    const numero = input.value.trim();

    if (!numero || !/^[1-9]\d*$/.test(numero)) {
        mostrarMensagem(tipo, "Informe um número de concurso válido.");
        input.focus();
        return;
    }

    await buscarResultado(tipo, numero);
}

/* =========================
   ÚLTIMO RESULTADO
========================= */

async function ultimoResultado(tipo) {
    await buscarResultado(tipo);
}

/* =========================
   LIMPAR RESULTADO
========================= */

function limparResultado(tipo) {
    const input = document.getElementById(`concurso-${tipo}`);
    const resultado = document.getElementById(`resultado-${tipo}`);

    if (input) {
        input.value = "";
    }

    if (resultado) {
        resultado.replaceChildren();
    }

    salvarLocalStorage(`ultimo-${tipo}`, "");
}

/* =========================
   FORMATAÇÃO DE RESULTADOS
========================= */

function adicionarTitulo(resultado, texto) {
    resultado.appendChild(
        criarElemento("h3", "resultado-titulo", texto)
    );
}

function adicionarInformacoes(resultado, dados) {
    const informacoes = criarElemento("div", "info");

    const concurso = criarElemento(
        "p",
        "",
        `Concurso: ${dados.numero}`
    );

    const data = criarElemento(
        "p",
        "",
        `Data do sorteio: ${dados.dataApuracao || "Não informada"}`
    );

    informacoes.append(concurso, data);
    resultado.appendChild(informacoes);
}

function adicionarNumeros(resultado, numeros, classe = "numeros") {
    if (!Array.isArray(numeros) || numeros.length === 0) {
        return;
    }

    const container = criarElemento("div", classe);

    numeros.forEach(numero => {
        const bola = criarElemento(
            "span",
            "numero",
            String(numero)
        );

        container.appendChild(bola);
    });

    resultado.appendChild(container);
}

function adicionarExtra(resultado, titulo, valor) {
    if (!valor) return;

    const extra = criarElemento("div", "extra");

    extra.appendChild(
        criarElemento("strong", "", titulo)
    );

    extra.appendChild(
        criarElemento("p", "", String(valor))
    );

    resultado.appendChild(extra);
}

/* =========================
   RESULTADO DA DUPLA SENA
========================= */

function mostrarDuplaSena(resultado, dados) {
    const primeiroSorteio =
        dados.listaDezenas || dados.dezenasSorteadasOrdemSorteio;

    const segundoSorteio =
        dados.listaDezenasSegundoSorteio ||
        dados.dezenasSorteadasSegundoSorteio;

    if (Array.isArray(primeiroSorteio) && primeiroSorteio.length) {
        adicionarTitulo(resultado, "1º Sorteio");
        adicionarNumeros(resultado, primeiroSorteio);
    }

    if (Array.isArray(segundoSorteio) && segundoSorteio.length) {
        adicionarTitulo(resultado, "2º Sorteio");
        adicionarNumeros(resultado, segundoSorteio);
    }
}

/* =========================
   RESULTADO DA +MILIONÁRIA
========================= */

function mostrarMaisMilionaria(resultado, dados) {
    const dezenas =
        dados.listaDezenas ||
        dados.dezenasSorteadasOrdemSorteio;

    const trevos =
        dados.listaTrevos ||
        dados.trevosSorteados;

    adicionarTitulo(resultado, "Dezenas sorteadas");
    adicionarNumeros(resultado, dezenas);

    if (Array.isArray(trevos) && trevos.length) {
        adicionarTitulo(resultado, "Trevos sorteados");
        adicionarNumeros(resultado, trevos, "trevos");
    }
}

/* =========================
   RESULTADO DA LOTECA
========================= */

function mostrarLoteca(resultado, dados) {
    const jogos = dados.listaResultadoEquipeEsportiva;

    if (!Array.isArray(jogos) || jogos.length === 0) {
        adicionarExtra(
            resultado,
            "Resultado",
            "Os dados dos jogos não estão disponíveis."
        );
        return;
    }

    adicionarTitulo(resultado, "Resultados dos jogos");

    const container = criarElemento("div", "loteca-container");

    jogos.forEach((jogo, indice) => {
        const card = criarElemento("div", "jogo-card");

        const equipeUm =
            jogo.nomeEquipeUm ||
            jogo.nomeTimeUm ||
            jogo.equipeUm ||
            "Equipe 1";

        const equipeDois =
            jogo.nomeEquipeDois ||
            jogo.nomeTimeDois ||
            jogo.equipeDois ||
            "Equipe 2";

        const golsUm =
            jogo.qtGolsEquipeUm ??
            jogo.placarEquipeUm ??
            jogo.nuGolEquipeUm ??
            jogo.golsEquipeUm;

        const golsDois =
            jogo.qtGolsEquipeDois ??
            jogo.placarEquipeDois ??
            jogo.nuGolEquipeDois ??
            jogo.golsEquipeDois;

        const tituloJogo = criarElemento(
            "strong",
            "jogo-titulo",
            `Jogo ${indice + 1}`
        );

        const times = criarElemento("div", "jogo-times");

        const timeUm = criarElemento("span", "time", String(equipeUm));
        const placar = criarElemento(
            "span",
            "placar-badge",
            golsUm !== undefined && golsDois !== undefined
                ? `${golsUm} x ${golsDois}`
                : "Placar indisponível"
        );
        const timeDois = criarElemento("span", "time", String(equipeDois));

        times.append(timeUm, placar, timeDois);

        const coluna =
            jogo.icColunaUm ||
            jogo.icColunaMeio ||
            jogo.icColunaDois;

        card.append(tituloJogo, times);

        if (coluna) {
            card.appendChild(
                criarElemento("p", "coluna-resultado", `Resultado: ${coluna}`)
            );
        }

        container.appendChild(card);
    });

    resultado.appendChild(container);
}

/* =========================
   RESULTADO PADRÃO
========================= */

function mostrarResultadoPadrao(resultado, dados) {
    const dezenas =
        dados.listaDezenas ||
        dados.dezenasSorteadasOrdemSorteio;

    adicionarTitulo(resultado, "Números sorteados");
    adicionarNumeros(resultado, dezenas);

    if (!Array.isArray(dezenas) || dezenas.length === 0) {
        adicionarExtra(
            resultado,
            "Informação",
            "Os números sorteados não estão disponíveis nesta resposta."
        );
    }

    if (dados.listaDezenasSegundoSorteio) {
        adicionarTitulo(resultado, "Segundo sorteio");
        adicionarNumeros(resultado, dados.listaDezenasSegundoSorteio);
    }
}

/* =========================
   EXIBIÇÃO DO RESULTADO
========================= */

function mostrarResultado(tipo, dados) {
    const resultado = document.getElementById(`resultado-${tipo}`);

    if (!resultado) return;
        if (tipo === "loteca") {
        console.log("DADOS COMPLETOS DA LOTECA:", dados);
    }

    resultado.replaceChildren();

    adicionarInformacoes(resultado, dados);

    switch (tipo) {
        case "duplasena":
            mostrarDuplaSena(resultado, dados);
            break;

        case "maismilionaria":
            mostrarMaisMilionaria(resultado, dados);
            break;

        case "loteca":
            mostrarLoteca(resultado, dados);
            break;

        default:
            mostrarResultadoPadrao(resultado, dados);
            break;
    }

    if (tipo === "timemania") {
        adicionarExtra(
            resultado,
            "Time do coração",
            dados.nomeTimeCoracao
        );
    }

    if (tipo === "diadesorte") {
        adicionarExtra(
            resultado,
            "Mês da sorte",
            dados.nomeTimeCoracaoMesSorte ||
            dados.mesSorte
        );
    }


    const local = [
        dados.localSorteio,
        dados.nomeMunicipioUFSorteio
    ]
        .filter(valor => valor && valor.trim() && valor.trim() !== ",")
        .map(valor => valor.trim())
        .join(" - ");

    if (local) {
        adicionarExtra(resultado, "Local do sorteio", local);
    } else if (tipo === "loteca") {
        adicionarExtra(
            resultado,
            "Local do sorteio",
            "Local não informado pela Caixa."
        );
    }

    const observacao = dados.observacao;

    if (observacao) {
        adicionarExtra(resultado, "Observação", observacao);
    }
}


/* =========================
   TECLA ENTER
========================= */

function configurarTeclaEnter() {
    if (!cardsContainer) return;

    cardsContainer.addEventListener("keydown", evento => {
        if (
            evento.key !== "Enter" ||
            !evento.target.matches("input")
        ) {
            return;
        }

        const tipo = evento.target.id.replace("concurso-", "");

        if (loterias[tipo]) {
            consultarLoteria(tipo);
        }
    });
}

/* =========================
   INICIALIZAÇÃO
========================= */

function inicializar() {
    const temaSalvo = lerLocalStorage("tema") || "claro";

    aplicarTema(temaSalvo);

    if (botaoTema) {
        botaoTema.addEventListener("click", alternarTema);
    }

    criarCards();
    configurarTeclaEnter();

    console.log("Loterias-Caixas inicializado com sucesso.");
}

document.addEventListener("DOMContentLoaded", inicializar);
