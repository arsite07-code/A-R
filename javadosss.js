/* ============================================================
   javadosss.js — Sistema de Recomendação com TF-IDF + Cosseno
   Loja de Moda — Machine Learning 100% no navegador
   ============================================================ */

/* ── STOPWORDS (palavras sem significado para o algoritmo) ── */
const STOPWORDS = new Set([
  'de','da','do','das','dos','em','no','na','nos','nas','um','uma',
  'uns','umas','e','ou','mas','por','para','com','sem','que','se',
  'ao','aos','à','às','pelo','pela','pelos','pelas','este','esta',
  'estes','estas','esse','essa','esses','essas','aquele','aquela',
  'o','a','os','as','é','são','ter','tem','ser','foi','há','mais',
  'muito','também','só','já','ainda','tudo','todo','toda','todos',
  'me','te','se','nos','vos','lhe','lhes','meu','minha','seu','sua',
]);

/* ── CORPUS DE PRODUTOS ──
   Produtos padrão. O sistema também lê produtos cadastrados no ADM
   (localStorage 'adm_produtos') e os mescla automaticamente.
   ──────────────────────────────────────────────────────────────── */
const PRODUTOS_PADRAO = [
  {
    id: 1,
    nome: 'Vestido Floral Midi',
    categoria: 'Vestidos',
    descricao: 'vestido floral midi feminino verão leve colorido romântico delicado estampado flores',
    preco: 'R$ 189,90',
    imagem: '',
  },
  {
    id: 2,
    nome: 'Calça Wide Leg',
    categoria: 'Calças',
    descricao: 'calça wide leg pantalona moderna elegante trabalho escritório minimalista neutro bege',
    preco: 'R$ 159,90',
    imagem: '',
  },
  {
    id: 3,
    nome: 'Blusa Cropped Listrada',
    categoria: 'Blusas',
    descricao: 'blusa cropped listrada casual jovem descontraído verão praia listras coloridas',
    preco: 'R$ 79,90',
    imagem: '',
  },
  {
    id: 4,
    nome: 'Conjunto Alfaiataria',
    categoria: 'Conjuntos',
    descricao: 'conjunto alfaiataria blazer calça elegante sofisticado executivo trabalho formal clássico',
    preco: 'R$ 349,90',
    imagem: '',
  },
  {
    id: 5,
    nome: 'Saia Midi Plissada',
    categoria: 'Saias',
    descricao: 'saia midi plissada romântica delicada feminina cores pastel suave elegante',
    preco: 'R$ 129,90',
    imagem: '',
  },
  {
    id: 6,
    nome: 'Jaqueta Jeans Oversized',
    categoria: 'Jaquetas',
    descricao: 'jaqueta jeans oversized casual despojado streetwear vintage retro urbano',
    preco: 'R$ 219,90',
    imagem: '',
  },
  {
    id: 7,
    nome: 'Vestido Tubinho Preto',
    categoria: 'Vestidos',
    descricao: 'vestido tubinho preto clássico elegante festa jantar sofisticado atemporal básico',
    preco: 'R$ 199,90',
    imagem: '',
  },
  {
    id: 8,
    nome: 'Moletom Oversized',
    categoria: 'Moletons',
    descricao: 'moletom oversized confortável casual cozy aconchegante inverno frio básico neutro',
    preco: 'R$ 149,90',
    imagem: '',
  },
  {
    id: 9,
    nome: 'Shorts Jeans Bordado',
    categoria: 'Shorts',
    descricao: 'shorts jeans bordado verão praia casual jovem despojado colorido detalhes',
    preco: 'R$ 99,90',
    imagem: '',
  },
  {
    id: 10,
    nome: 'Blazer Oversized Rosa',
    categoria: 'Blazers',
    descricao: 'blazer oversized rosa moderno trendy estiloso fashion urbano contemporâneo cor',
    preco: 'R$ 279,90',
    imagem: '',
  },
];

/* ── MESCLA produtos padrão + produtos do ADM ── */
function getProdutos() {
  const admProdutos = JSON.parse(localStorage.getItem('adm_produtos') || '[]');
  const convertidos = admProdutos.map(p => ({
    id:        'adm_' + p.id,
    nome:      p.nome,
    categoria: p.cat,
    descricao: [p.nome, p.cat, p.estilo, p.desc].filter(Boolean).join(' '),
    preco:     'R$ ' + (p.preco || 0).toFixed(2).replace('.', ','),
    imagem:    '',
  }));
  return [...PRODUTOS_PADRAO, ...convertidos];
}

/* ============================================================
   TF-IDF — PROCESSAMENTO DE TEXTO
   ============================================================ */

/**
 * tokenize(text)
 * Converte texto em array de tokens normalizados e sem stopwords.
 */
function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   /* remove acentos */
    .replace(/[^a-z0-9\s]/g, ' ')     /* remove pontuação */
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t));
}

/**
 * computeTF(tokens)
 * Frequência de cada token normalizada pelo total de tokens.
 */
function computeTF(tokens) {
  const tf = {};
  tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
  const total = tokens.length || 1;
  Object.keys(tf).forEach(t => { tf[t] /= total; });
  return tf;
}

/**
 * computeIDF(corpus)
 * corpus = array de arrays de tokens (um por documento).
 * Retorna IDF suavizado para cada termo.
 */
function computeIDF(corpus) {
  const N   = corpus.length;
  const df  = {};
  corpus.forEach(doc => {
    const unicos = new Set(doc);
    unicos.forEach(t => { df[t] = (df[t] || 0) + 1; });
  });
  const idf = {};
  Object.keys(df).forEach(t => {
    idf[t] = Math.log((N + 1) / (df[t] + 1)) + 1;
  });
  return idf;
}

/**
 * tfidfVector(tokens, idf)
 * Multiplica TF × IDF para gerar o vetor do documento.
 */
function tfidfVector(tokens, idf) {
  const tf  = computeTF(tokens);
  const vec = {};
  Object.keys(tf).forEach(t => {
    vec[t] = tf[t] * (idf[t] || Math.log(2) + 1);
  });
  return vec;
}

/**
 * cosineSimilarity(a, b)
 * Similaridade do cosseno entre dois vetores (objetos chave→valor).
 */
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  Object.keys(a).forEach(t => {
    dot   += a[t] * (b[t] || 0);
    normA += a[t] ** 2;
  });
  Object.keys(b).forEach(t => { normB += b[t] ** 2; });
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/* ============================================================
   SISTEMA DE RECOMENDAÇÃO
   ============================================================ */

/**
 * recomendar(estilo, k)
 * Recebe o texto do usuário e retorna os k produtos mais similares.
 */
function recomendar(estilo, k = 3) {
  const catalogo = getProdutos();

  /* tokeniza todos os produtos */
  const corpus = catalogo.map(p => tokenize(p.descricao));

  /* IDF global */
  const idf = computeIDF(corpus);

  /* se não há texto, retorna os primeiros k com score 0 */
  if (!estilo || !estilo.trim()) {
    return catalogo.slice(0, k).map(p => ({ produto: p, score: 0, pct: 0, qVec: {} }));
  }

  /* vetor da query */
  const qTokens = tokenize(estilo);
  const qVec    = tfidfVector(qTokens, idf);

  /* calcula similaridade de cada produto */
  const scores = catalogo.map((produto, i) => {
    const pVec  = tfidfVector(corpus[i], idf);
    const score = cosineSimilarity(qVec, pVec);
    return { produto, score, pVec };
  });

  /* ordena do maior para o menor */
  scores.sort((a, b) => b.score - a.score);

  const topK   = scores.slice(0, k);
  const melhor = topK[0].score || 1;

  return topK.map(item => ({
    produto: item.produto,
    score:   item.score,
    pct:     Math.round((item.score / melhor) * 100),
    qVec,
  }));
}

/* ============================================================
   ANIMAÇÃO DAS ETAPAS ("IA steps")
   ============================================================ */
function setStep(n) {
  document.querySelectorAll('.ia-step').forEach(el => {
    el.classList.toggle('active', Number(el.dataset.step) === n);
  });
}

function resetSteps() {
  document.querySelectorAll('.ia-step').forEach(el => el.classList.remove('active'));
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* ============================================================
   RENDERIZAÇÃO NA INTERFACE
   ============================================================ */

/**
 * renderResultados(resultados)
 * Escreve os resultados no elemento #resultadoLista.
 */
function renderResultados(resultados) {
  const lista = document.getElementById('resultadoLista');
  if (!lista) return;

  if (!resultados.length) {
    lista.innerHTML = '<li class="sem-resultado">Nenhum resultado encontrado.</li>';
    return;
  }

  lista.innerHTML = resultados.map((r, i) => {
    const pct   = r.pct;
    const score = (r.score * 100).toFixed(1);
    const cor   = pct >= 70 ? '#3B6D11' : pct >= 40 ? '#BA7517' : '#888780';

    return `
      <li class="resultado-item" style="animation-delay:${i * 0.1}s">
        <div class="resultado-header">
          <span class="resultado-rank">#${i + 1}</span>
          <div class="resultado-info">
            <strong class="resultado-nome">${r.produto.nome}</strong>
            <span class="resultado-cat">${r.produto.categoria}</span>
          </div>
          <span class="resultado-preco">${r.produto.preco}</span>
        </div>
        <div class="resultado-barra-wrap">
          <div class="resultado-barra" style="width:${pct}%; background:${cor};"></div>
          <span class="resultado-score" style="color:${cor}">${score}% de compatibilidade</span>
        </div>
      </li>`;
  }).join('');
}

/**
 * renderVetor(qVec, query)
 * Exibe os termos mais relevantes da query em #vectorGrid.
 */
function renderVetor(qVec, query) {
  const section = document.getElementById('vectorSection');
  const grid    = document.getElementById('vectorGrid');
  if (!section || !grid) return;

  const termos = Object.entries(qVec)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  if (!termos.length) {
    section.style.display = 'none';
    return;
  }

  const max = termos[0][1] || 1;
  grid.innerHTML = termos.map(([termo, peso]) => {
    const opacidade = 0.25 + 0.75 * (peso / max);
    return `
      <div class="vetor-termo" style="opacity:${opacidade.toFixed(2)}">
        <span class="vetor-palavra">${termo}</span>
        <span class="vetor-peso">${peso.toFixed(3)}</span>
      </div>`;
  }).join('');

  section.style.display = 'block';
}

/* ============================================================
   FLUXO PRINCIPAL — analisarEstilo()
   ============================================================ */
async function analisarEstilo() {
  const inputEl  = document.getElementById('estiloInput');
  const listaEl  = document.getElementById('resultadoLista');
  const secaoVec = document.getElementById('vectorSection');

  if (!inputEl || !listaEl) return;

  const estilo = inputEl.value.trim();

  /* feedback imediato */
  listaEl.innerHTML = '<li class="carregando">Analisando seu estilo...</li>';
  if (secaoVec) secaoVec.style.display = 'none';
  resetSteps();

  /* animação das etapas */
  await delay(300);  setStep(1);   /* tokenizando */
  await delay(600);  setStep(2);   /* calculando TF-IDF */
  await delay(600);  setStep(3);   /* calculando similaridade */
  await delay(500);  setStep(4);   /* ordenando resultados */
  await delay(300);  resetSteps();

  /* recomendação */
  const resultados = recomendar(estilo, 3);

  renderResultados(resultados);

  /* vetor do melhor resultado */
  if (resultados.length && resultados[0].qVec) {
    renderVetor(resultados[0].qVec, estilo);
  }
}

/* ============================================================
   INICIALIZAÇÃO — DOMContentLoaded
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* botão Analisar */
  const btn = document.getElementById('btnAnalisar');
  if (btn) btn.addEventListener('click', analisarEstilo);

  /* Enter no input */
  const input = document.getElementById('estiloInput');
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') analisarEstilo();
    });
  }

  /* tags sugeridas (chips) */
  document.querySelectorAll('.tag-sugestao').forEach(tag => {
    tag.addEventListener('click', () => {
      if (input) {
        const atual = input.value.trim();
        const texto = tag.textContent.trim();
        input.value = atual ? atual + ' ' + texto : texto;
        analisarEstilo();
      }
    });
  });

  /* modal de produto */
  const modal    = document.getElementById('modal');
  const closeBtn = document.getElementById('modalClose');

  document.querySelectorAll('.produto').forEach(card => {
    card.addEventListener('click', e => {
      if (!modal) return;
      const nome  = card.querySelector('.produto-nome')?.textContent  || '';
      const cat   = card.querySelector('.produto-cat')?.textContent   || '';
      const preco = card.querySelector('.produto-preco')?.textContent || '';
      const desc  = card.querySelector('.produto-desc')?.textContent  || '';
      const img   = card.querySelector('img')?.src                    || '';

      const mNome  = document.getElementById('modalNome');
      const mCat   = document.getElementById('modalCategoria');
      const mPreco = document.getElementById('modalPreco');
      const mDesc  = document.getElementById('modalDesc');
      const mImg   = document.getElementById('modalImagem');

      if (mNome)  mNome.textContent  = nome;
      if (mCat)   mCat.textContent   = cat;
      if (mPreco) mPreco.textContent = preco;
      if (mDesc)  mDesc.textContent  = desc;
      if (mImg && img) mImg.src      = img;

      modal.style.display = 'flex';
    });

    /* botão "Ver" dentro do card */
    const btnVer = card.querySelector('.btn-ver');
    if (btnVer) {
      btnVer.addEventListener('click', e => {
        e.stopPropagation();
        card.click();
      });
    }
  });

  /* fechar modal */
  if (closeBtn) closeBtn.addEventListener('click', () => { if (modal) modal.style.display = 'none'; });
  if (modal)    modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

  /* fechar com Escape */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
      modal.style.display = 'none';
    }
  });

});
