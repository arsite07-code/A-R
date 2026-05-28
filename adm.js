/* ============================================================
   adm.js — Lógica completa do Painel de Administração
   Como usar: <script src="adm.js"></script> no seu adm.html
   ============================================================ */

/* ── ESTADO GLOBAL ── */
let ADM_PASS   = localStorage.getItem('adm_senha') || '1234';
let produtos   = JSON.parse(localStorage.getItem('adm_produtos') || '[]');
let editandoId = null;

/* ============================================================
   LOGIN / LOGOUT
   ============================================================ */
function fazerLogin() {
  const usuario = document.getElementById('user-in').value.trim();
  const senha   = document.getElementById('pass-in').value;
  const errEl   = document.getElementById('login-err');

  if (usuario === 'admin' && senha === ADM_PASS) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('adm-panel').style.display    = 'block';
    inicializar();
  } else {
    errEl.textContent = 'Usuário ou senha incorretos.';
  }
}

function sair() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('adm-panel').style.display    = 'none';
  document.getElementById('user-in').value  = '';
  document.getElementById('pass-in').value  = '';
  document.getElementById('login-err').textContent = '';
}

/* Enter no campo de senha faz login */
document.addEventListener('DOMContentLoaded', () => {
  const passInput = document.getElementById('pass-in');
  if (passInput) {
    passInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') fazerLogin();
    });
  }
});

/* ============================================================
   NAVEGAÇÃO (abas)
   ============================================================ */
function mudarAba(id, btn) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('sec-' + id).classList.add('active');

  if (id === 'dashboard')  renderDashboard();
  if (id === 'produtos')   renderListaProdutos();
  if (id === 'candidatos') renderListaCandidatos();
}

/* ============================================================
   TOAST (mensagem rápida na tela)
   ============================================================ */
function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

/* ============================================================
   FORMULÁRIO DE PRODUTO
   ============================================================ */
function toggleForm(id) {
  const f = document.getElementById(id);
  f.classList.toggle('open');
  if (!f.classList.contains('open')) limparFormProduto();
}

function cancelarForm() {
  document.getElementById('form-produto').classList.remove('open');
  limparFormProduto();
}

function limparFormProduto() {
  ['p-nome', 'p-preco', 'p-estoque', 'p-estilo', 'p-desc'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const cat = document.getElementById('p-cat');
  if (cat) cat.selectedIndex = 0;
  editandoId = null;
}

function salvarProduto() {
  const nome  = document.getElementById('p-nome').value.trim();
  const preco = parseFloat(document.getElementById('p-preco').value) || 0;

  if (!nome)      { toast('Informe o nome do produto.');  return; }
  if (preco <= 0) { toast('Informe um preço válido.');    return; }

  const dados = {
    nome,
    cat:     document.getElementById('p-cat').value,
    preco,
    estoque: parseInt(document.getElementById('p-estoque').value) || 0,
    estilo:  document.getElementById('p-estilo').value.trim(),
    desc:    document.getElementById('p-desc').value.trim(),
  };

  if (editandoId !== null) {
    const i = produtos.findIndex(p => p.id === editandoId);
    if (i > -1) produtos[i] = { ...produtos[i], ...dados };
    toast('Produto atualizado!');
    editandoId = null;
  } else {
    produtos.push({
      id: Date.now(),
      ...dados,
      criado: new Date().toLocaleDateString('pt-BR'),
    });
    toast('Produto adicionado!');
  }

  salvarProdutosLS();
  cancelarForm();
  renderListaProdutos();
  atualizarStats();
}

function editarProduto(id) {
  const p = produtos.find(x => x.id === id);
  if (!p) return;

  editandoId = id;
  document.getElementById('p-nome').value    = p.nome;
  document.getElementById('p-cat').value     = p.cat;
  document.getElementById('p-preco').value   = p.preco;
  document.getElementById('p-estoque').value = p.estoque;
  document.getElementById('p-estilo').value  = p.estilo || '';
  document.getElementById('p-desc').value    = p.desc   || '';

  const f = document.getElementById('form-produto');
  if (!f.classList.contains('open')) f.classList.add('open');
  f.scrollIntoView({ behavior: 'smooth' });
}

function deletarProduto(id) {
  if (!confirm('Deletar este produto? Esta ação não pode ser desfeita.')) return;
  produtos = produtos.filter(p => p.id !== id);
  salvarProdutosLS();
  renderListaProdutos();
  atualizarStats();
  toast('Produto removido.');
}

function salvarProdutosLS() {
  localStorage.setItem('adm_produtos', JSON.stringify(produtos));
}

/* ============================================================
   RENDERIZAÇÃO — PRODUTOS
   ============================================================ */
function filtrarProdutos(q) {
  renderListaProdutos(q);
}

function renderListaProdutos(q = '') {
  const el = document.getElementById('lista-produtos');
  if (!el) return;

  const lista = q
    ? produtos.filter(p =>
        p.nome.toLowerCase().includes(q.toLowerCase()) ||
        p.cat.toLowerCase().includes(q.toLowerCase()) ||
        (p.estilo || '').toLowerCase().includes(q.toLowerCase())
      )
    : produtos;

  if (!lista.length) {
    el.innerHTML = `
      <div class="empty">
        <i class="ti ti-shirt"></i>
        <p>${q
          ? 'Nenhum produto encontrado para "' + q + '".'
          : 'Nenhum produto cadastrado ainda.<br>Clique em "+ Novo Produto" para começar.'
        }</p>
      </div>`;
    return;
  }

  el.innerHTML = lista.map(p => `
    <div class="list-item">
      <div class="item-info">
        <div class="item-name">${p.nome}</div>
        <div class="item-sub">
          Adicionado em ${p.criado || '—'} · Estoque: ${p.estoque}
          ${p.estilo ? '· ' + p.estilo : ''}
        </div>
      </div>
      <div class="item-badges">
        <span class="badge badge-cat">${p.cat}</span>
        <span class="badge badge-price">R$ ${p.preco.toFixed(2)}</span>
        ${p.estoque <= 3 ? '<span class="badge badge-estoque-low">Estoque baixo</span>' : ''}
      </div>
      <div class="item-actions">
        <button class="btn-icon" onclick="editarProduto(${p.id})" title="Editar">
          <i class="ti ti-edit"></i>
        </button>
        <button class="btn-icon del" onclick="deletarProduto(${p.id})" title="Deletar">
          <i class="ti ti-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

/* ============================================================
   CANDIDATOS
   ============================================================ */
function getCandidatos() {
  const raw = localStorage.getItem('candidato');
  if (!raw) return [];
  try {
    const d = JSON.parse(raw);
    /* formato antigo: array simples [nome, email, data] */
    if (Array.isArray(d) && typeof d[0] === 'string') {
      return [{ nome: d[0], email: d[1], data: d[2] }];
    }
    /* formato novo: array de arrays */
    if (Array.isArray(d) && Array.isArray(d[0])) {
      return d.map(c => ({ nome: c[0], email: c[1], data: c[2] }));
    }
    return [];
  } catch {
    return [];
  }
}

function filtrarCandidatos(q) {
  renderListaCandidatos(q);
}

function renderListaCandidatos(q = '') {
  const el = document.getElementById('lista-candidatos');
  if (!el) return;

  const todos = getCandidatos();
  const lista = q
    ? todos.filter(c =>
        (c.nome  || '').toLowerCase().includes(q.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(q.toLowerCase())
      )
    : todos;

  if (!lista.length) {
    el.innerHTML = `
      <div class="empty">
        <i class="ti ti-users"></i>
        <p>${q
          ? 'Nenhum candidato encontrado.'
          : 'Nenhum candidato cadastrado ainda.<br>Os candidatos aparecem quando alguém preenche o formulário do site.'
        }</p>
      </div>`;
    return;
  }

  el.innerHTML = lista.map(c => `
    <div class="cand-item">
      <div class="cand-name">${c.nome || '—'}</div>
      <div class="cand-details">
        <span class="cand-detail"><i class="ti ti-mail"></i>${c.email || '—'}</span>
        <span class="cand-detail"><i class="ti ti-calendar"></i>${c.data  || '—'}</span>
      </div>
    </div>
  `).join('');
}

function exportarCSV() {
  const todos = getCandidatos();
  if (!todos.length) { toast('Nenhum candidato para exportar.'); return; }

  const linhas = todos.map(c => `"${c.nome}","${c.email}","${c.data}"`);
  const csv    = 'Nome,Email,Data\n' + linhas.join('\n');

  const a    = document.createElement('a');
  a.href     = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'candidatos.csv';
  a.click();
  toast('CSV exportado!');
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function atualizarStats() {
  const cands       = getCandidatos();
  const totalEstoque = produtos.reduce((s, p) => s + p.estoque, 0);
  const totalValor   = produtos.reduce((s, p) => s + p.preco * p.estoque, 0);
  const cats         = [...new Set(produtos.map(p => p.cat))].length;

  const el = document.getElementById('stats-grid');
  if (!el) return;

  el.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Produtos</div>
      <div class="stat-value">${produtos.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Itens em Estoque</div>
      <div class="stat-value">${totalEstoque}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Valor Total</div>
      <div class="stat-value">R$ ${totalValor.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Categorias</div>
      <div class="stat-value">${cats}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Candidatos</div>
      <div class="stat-value">${cands.length}</div>
    </div>
  `;
}

function renderDashboard() {
  atualizarStats();

  const el    = document.getElementById('lista-estoque-baixo');
  if (!el) return;

  const baixo = produtos.filter(p => p.estoque <= 3);

  if (!baixo.length) {
    el.innerHTML = `
      <div class="empty">
        <i class="ti ti-check"></i>
        <p>Todos os produtos têm estoque adequado.</p>
      </div>`;
    return;
  }

  el.innerHTML = baixo.map(p => `
    <div class="list-item">
      <div class="item-info">
        <div class="item-name">${p.nome}</div>
        <div class="item-sub">${p.cat}</div>
      </div>
      <span class="badge badge-estoque-low">${p.estoque} unid.</span>
    </div>
  `).join('');
}

/* ============================================================
   CONFIGURAÇÕES
   ============================================================ */
function salvarConfig() {
  const nome   = document.getElementById('cfg-nome').value.trim();
  const senha  = document.getElementById('cfg-senha').value;
  const senha2 = document.getElementById('cfg-senha2').value;

  if (senha && senha !== senha2) { toast('As senhas não coincidem.'); return; }

  if (senha) {
    ADM_PASS = senha;
    localStorage.setItem('adm_senha', senha);
  }
  if (nome) {
    localStorage.setItem('adm_nome_loja', nome);
    const el = document.getElementById('nome-loja');
    if (el) el.textContent = nome;
  }
  toast('Configurações salvas!');
}

function limparProdutos() {
  if (!confirm('Apagar TODOS os produtos? Isso não pode ser desfeito.')) return;
  produtos = [];
  salvarProdutosLS();
  renderListaProdutos();
  atualizarStats();
  toast('Produtos apagados.');
}

/* ============================================================
   INICIALIZAÇÃO (chamada após login bem-sucedido)
   ============================================================ */
function inicializar() {
  /* nome da loja salvo */
  const nomeSalvo = localStorage.getItem('adm_nome_loja');
  if (nomeSalvo) {
    const el = document.getElementById('nome-loja');
    if (el) el.textContent = nomeSalvo;
    const cfg = document.getElementById('cfg-nome');
    if (cfg) cfg.value = nomeSalvo;
  }

  /* data de hoje no dashboard */
  const dataEl = document.getElementById('data-hoje');
  if (dataEl) {
    dataEl.textContent = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  renderDashboard();
}
