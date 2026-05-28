/* ============================================================
   javadosss.js  —  A/R Loja de Camisas
   Machine Learning TF-IDF + Cosine Similarity (client-side)
   + Modal de produto
   ============================================================ */

/* ──────────────────────────────────────────
   1. DATASET DE PRODUTOS
   (espelha o corpus do RecomendadorTFIDF.py)
────────────────────────────────────────── */
const PRODUTOS_ML = [
  {
    nome: "Oversized Black",
    categoria: "streetwear",
    descricao: "camiseta oversized preta visual urbano conforto identidade presenca street",
  },
  {
    nome: "Street White",
    categoria: "streetwear",
    descricao: "camiseta branca minimalista street premium acabamento leve urbano",
  },
  {
    nome: "Urban Style",
    categoria: "streetwear",
    descricao: "camiseta urban moderna confortavel versatil casual estilo atitude grafismo",
  },
  {
    nome: "Luxury Oversized",
    categoria: "luxury",
    descricao: "camiseta luxury premium oversized modelagem exclusiva sofisticacao elegancia",
  },
];

/* Tags de atalho exibidas na UI */
const TAGS_SUGERIDAS = [
  "streetwear", "luxury", "oversized", "urban",
  "minimalista", "premium", "conforto", "elegante",
];

/* ──────────────────────────────────────────
   2. STOPWORDS PT-BR
────────────────────────────────────────── */
const STOPWORDS = new Set([
  "e","de","da","do","a","o","em","com","para","por","que",
  "se","na","no","um","uma","os","as","ao","dos","das",
  "sua","seu","mais","mas","ou","ja","ate","isso","esse",
]);

/* ──────────────────────────────────────────
   3. FUNÇÕES DE TF-IDF
────────────────────────────────────────── */

/** Remove acentos, lowercase, retorna array de tokens limpos */
function tokenize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // remove acentos
    .replace(/[^a-z0-9\s]/g, " ")      // remove pontuação
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/** Term Frequency: contagem normalizada pelo total de tokens */
function computeTF(tokens) {
  const tf = {};
  tokens.forEach((t) => (tf[t] = (tf[t] || 0) + 1));
  const total = tokens.length || 1;
  Object.keys(tf).forEach((k) => (tf[k] /= total));
  return tf;
}

/**
 * Inverse Document Frequency suavizado (smooth IDF do sklearn):
 * idf(t) = log((N+1) / (df(t)+1)) + 1
 */
function computeIDF(corpus) {
  const idf = {};
  const N = corpus.length;
  corpus.forEach((doc) => {
    const unique = new Set(doc);
    unique.forEach((t) => (idf[t] = (idf[t] || 0) + 1));
  });
  Object.keys(idf).forEach(
    (k) => (idf[k] = Math.log((N + 1) / (idf[k] + 1)) + 1)
  );
  return idf;
}

/** Vetor TF-IDF de um array de tokens dado o IDF do corpus */
function tfidfVector(tokens, idf) {
  const tf = computeTF(tokens);
  const vec = {};
  Object.keys(tf).forEach((t) => {
    const idfVal = idf[t] || Math.log(2) + 1; // fallback para termos fora do corpus
    vec[t] = tf[t] * idfVal;
  });
  return vec;
}

/**
 * Cosine Similarity entre dois vetores (objetos chave→valor).
 * Retorna número de 0 a 1.
 */
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  keys.forEach((k) => {
    const va = a[k] || 0;
    const vb = b[k] || 0;
    dot += va * vb;
    normA += va * va;
    normB += vb * vb;
  });
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/* ──────────────────────────────────────────
   4. TREINO DO MODELO (executa 1× ao carregar)
────────────────────────────────────────── */
const corpusTokens = PRODUTOS_ML.map((p) =>
  tokenize(`${p.nome} ${p.categoria} ${p.descricao}`)
);
const IDF_GLOBAL = computeIDF(corpusTokens);
const corpusVecs = corpusTokens.map((doc) => tfidfVector(doc, IDF_GLOBAL));

/* Exibe tamanho do vocabulário na UI */
const vocabCount = document.getElementById("vocabCount");
if (vocabCount) vocabCount.textContent = Object.keys(IDF_GLOBAL).length;

/* ──────────────────────────────────────────
   5. FUNÇÃO PRINCIPAL: RECOMENDAR
────────────────────────────────────────── */
/**
 * Dado um texto de estilo, retorna array ordenado por similaridade:
 * [{ produto, score, pct }, ...]  (pct = 0-100 normalizado pelo melhor)
 */
function recomendar(estilo, k = 3) {
  if (!estilo || !estilo.trim()) {
    return PRODUTOS_ML.slice(0, k).map((p) => ({ produto: p, score: 0, pct: 0 }));
  }
  const qTokens = tokenize(estilo);
  const qVec = tfidfVector(qTokens, IDF_GLOBAL);

  const scores = corpusVecs.map((vec, i) => ({
    produto: PRODUTOS_ML[i],
    score: cosineSimilarity(qVec, vec),
    qVec,
  }));
  scores.sort((a, b) => b.score - a.score);

  const maxScore = scores[0].score || 1;
  return scores.slice(0, k).map((s) => ({
    produto: s.produto,
    score: s.score,
    pct: Math.round((s.score / maxScore) * 100),
    qVec: s.qVec,
  }));
}

/* ──────────────────────────────────────────
   6. HELPERS DE ANIMAÇÃO DAS ETAPAS
────────────────────────────────────────── */
function setStep(n) {
  document.querySelectorAll(".ia-step").forEach((el) => {
    const s = parseInt(el.dataset.step);
    if (s <= n) el.classList.add("active");
    else el.classList.remove("active");
  });
}

function resetSteps() {
  document.querySelectorAll(".ia-step").forEach((el) =>
    el.classList.remove("active")
  );
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ──────────────────────────────────────────
   7. RENDERIZAÇÃO DOS RESULTADOS
────────────────────────────────────────── */
function renderResultados(resultados) {
  const lista = document.getElementById("resultadoLista");
  if (!lista) return;

  if (!resultados.length) {
    lista.innerHTML = '<li class="result-placeholder">Nenhum resultado encontrado.</li>';
    return;
  }

  lista.innerHTML = resultados
    .map(
      ({ produto, score, pct }, i) => `
      <li class="result-item" style="animation-delay:${i * 80}ms">
        <div class="result-rank">${i + 1}</div>
        <div class="result-info">
          <div class="result-name">${produto.nome}</div>
          <div class="result-cat">${produto.categoria}</div>
          <div class="result-bar-wrap">
            <div class="result-bar-labels">
              <span>similaridade</span>
              <span>${score > 0 ? (score * 100).toFixed(1) + "%" : "—"}</span>
            </div>
            <div class="result-bar-bg">
              <div class="result-bar" style="width:${pct}%"></div>
            </div>
          </div>
        </div>
      </li>`
    )
    .join("");
}

function renderVetor(qVec, query) {
  const section = document.getElementById("vectorSection");
  const grid = document.getElementById("vectorGrid");
  if (!section || !grid) return;

  const entries = Object.entries(qVec)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  if (!entries.length) {
    section.style.display = "none";
    return;
  }

  const max = entries[0][1] || 1;
  grid.innerHTML = entries
    .map(([word, val]) => {
      const opacity = (0.3 + 0.7 * (val / max)).toFixed(2);
      return `<div class="vector-cell" style="opacity:${opacity}">
        <div class="vector-word">${word}</div>
        <div class="vector-val">${val.toFixed(2)}</div>
      </div>`;
    })
    .join("");

  section.style.display = "block";
}

/* ──────────────────────────────────────────
   8. FLUXO PRINCIPAL COM ANIMAÇÃO
────────────────────────────────────────── */
async function analisarEstilo() {
  const input = document.getElementById("estiloInput");
  if (!input) return;

  const estilo = input.value.trim();
  const lista = document.getElementById("resultadoLista");

  if (lista) {
    lista.innerHTML = '<li class="result-placeholder">Analisando...</li>';
  }
  const section = document.getElementById("vectorSection");
  if (section) section.style.display = "none";

  resetSteps();

  /* Animação das etapas do algoritmo */
  await delay(120); setStep(1);
  await delay(120); setStep(2);
  await delay(120); setStep(3);
  await delay(120); setStep(4);
  await delay(120); setStep(5);

  const resultados = recomendar(estilo, 3);
  renderResultados(resultados);

  if (resultados.length && resultados[0].qVec) {
    renderVetor(resultados[0].qVec, estilo);
  }
}

/* ──────────────────────────────────────────
   9. INICIALIZAÇÃO DA UI
────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {

  /* Botão Analisar */
  const btnAnalisar = document.getElementById("btnAnalisar");
  if (btnAnalisar) {
    btnAnalisar.addEventListener("click", analisarEstilo);
  }

  /* Enter no input */
  const estiloInput = document.getElementById("estiloInput");
  if (estiloInput) {
    estiloInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") analisarEstilo();
    });
  }

  /* Gerar tags de atalho */
  const tagContainer = document.getElementById("iaTags");
  if (tagContainer) {
    TAGS_SUGERIDAS.forEach((tag) => {
      const el = document.createElement("span");
      el.className = "ia-tag";
      el.textContent = tag;
      el.addEventListener("click", () => {
        if (estiloInput) estiloInput.value = tag;
        document.querySelectorAll(".ia-tag").forEach((t) =>
          t.classList.remove("active")
        );
        el.classList.add("active");
        analisarEstilo();
      });
      tagContainer.appendChild(el);
    });
  }

  /* ── MODAL DE PRODUTO ── */
  const modal = document.getElementById("modal");
  const closeBtn = document.getElementById("closeModal");

  /* Abre modal ao clicar no card do produto */
  document.querySelectorAll(".produto").forEach((card) => {
    card.addEventListener("click", (e) => {
      /* ignora se o clique foi direto no botão "Comprar" do modal */
      if (e.target.classList.contains("btn-ver")) return;

      const nome = card.dataset.nome || card.querySelector("h2")?.textContent || "";
      const desc = card.dataset.desc || card.querySelector(".descricao")?.textContent || "";
      const preco = card.dataset.preco || card.querySelector(".preco")?.textContent || "";
      const img = card.dataset.img || card.querySelector("img")?.src || "";

      document.getElementById("modalImg").src = img;
      document.getElementById("modalImg").alt = nome;
      document.getElementById("modalTitle").textContent = nome;
      document.getElementById("modalDesc").textContent = desc;
      document.getElementById("modalPrice").textContent = preco;

      modal.style.display = "flex";
    });

    /* botão "Ver produto" dentro do card também abre o modal */
    const btnVer = card.querySelector(".btn-ver");
    if (btnVer) {
      btnVer.addEventListener("click", (e) => {
        e.stopPropagation();
        card.click();
      });
    }
  });

  /* Fecha modal pelo X */
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  /* Fecha modal clicando fora */
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.style.display = "none";
    });
  }

  /* Fecha modal com Escape */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.style.display === "flex") {
      modal.style.display = "none";
    }
  });
});
