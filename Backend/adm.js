/* ============================================================
   adm.js — Painel ADM conectado ao servidor Flask
   Lê e salva tudo no banco de dados real (loja.db)
   ============================================================ */

const API = 'http://localhost:5000/api';

/* ── ESTADO ── */
let ADM_PASS   = localStorage.getItem('adm_senha') || '1234';
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
  document.getElementById('user-in').value              = '';
  document.getElementById('pass-in').value              = '';
  document.getElementById('login-err').textContent      = '';
}

document.addEventListener('DOMContentLoaded', () => {
  const passInput = document.getElementById('pass-in');
  if (passInput) passInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') fazerLogin();
  });
});

/* ============================================================
   NAVEGAÇÃO
   ============================================================ */
function mudarAba(id, btn) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('sec-' + id).classList.add('active');

  if (id === 'dashboard')  renderDashboard();
  if (id === 'produtos')   carregarProdutos();
  if (id === 'candidatos') carregarCandidatos();
  if (id === 'compras')    carregarCompras();
}

/* ============================================================
   TOAST
   ============================================================ */
function toast(msg, tipo = 'ok') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent      = msg;
  el.style.background = tipo === 'erro' ? '#A32D2D' : '#1A1916';
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}

/* ============================================================
   FETCH HELPER
   ============================================================ */
async function apiFetch(url, opcoes = {}) {
  try {
    const res  = await fetch(API + url, opcoes);
    const json = await res.json();
    if (!res.ok) throw new Error(json.erro || 'Erro na requisição');
    return json;
  } catch (err) {
    toast('Erro: ' + err.message, 'erro');
    console.error(err);
    return null;
  }
}

/* ============================================================
   DASHBOARD
   ============================================================ */
async function renderDashboard() {
  const data = await apiFetch('/dashboard');
  if (!data) return;

  const dataEl = document.getElementById('data-hoje');
  if (dataEl) dataEl.textContent = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const grid = document.getElementById('stats-grid');
  if (grid) {
    grid.innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Produtos</div>
        <div class="stat-value">${data.total_produtos}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Itens em Estoque</div>
        <div class="stat-value">${data.total_estoque}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Valor em Estoque</div>
        <div class="stat-value">R$ ${data.valor_estoque.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Compras</div>
        <div class="stat-value">${data.total_compras}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Receita Total</div>
        <div class="stat-value">R$ ${data.receita_total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Candidatos</div>
        <div class="stat-value">${data.total_candidatos}</div>
      </div>
    `;
  }

  const baixoEl = document.getElementById('lista-estoque-baixo');
  if (baixoEl) {
    if (!data.estoque_baixo.length) {
      baixoEl.innerHTML = `<div class="empty"><i class="ti ti-check"></i><p>Todos os produtos têm estoque adequado.</p></div>`;
    } else {
      baixoEl.innerHTML = data.estoque_baixo.map(p => `
        <div class="list-item">
          <div class="item-info">
            <div class="item-name">${p.nome}</div>
            <div class="item-sub">${p.categoria}</div>
          </div>
          <span class="badge badge-estoque-low">${p.estoque} unid.</span>
        </div>
      `).join('');
    }
  }
}

/* ============================================================
   PRODUTOS
   ============================================================ */
async function carregarProdutos(q = '') {
  const data = await apiFetch('/produtos');
  if (!data) return;

  const lista = q
    ? data.filter(p =>
        p.nome.toLowerCase().includes(q.toLowerCase()) ||
        p.categoria.toLowerCase().includes(q.toLowerCase()) ||
        (p.estilo || '').toLowerCase().includes(q.toLowerCase())
      )
    : data;

  renderListaProdutos(lista);
}

function filtrarProdutos(q) { carregarProdutos(q); }

function renderListaProdutos(lista) {
  const el = document.getElementById('lista-produtos');
  if (!el) return;

  if (!lista.length) {
    el.innerHTML = `<div class="empty">
      <i class="ti ti-shirt"></i>
      <p>Nenhum produto cadastrado ainda.<br>Clique em "+ Novo Produto" para começar.</p>
    </div>`;
    return;
  }

  el.innerHTML = lista.map(p => `
    <div class="list-item">
      <div class="item-info">
        <div class="item-name">${p.nome}</div>
        <div class="item-sub">
          Cadastrado em ${p.criado_em} · Estoque: ${p.estoque}
          ${p.estilo ? '· ' + p.estilo : ''}
        </div>
      </div>
      <div class="item-badges">
        <span class="badge badge-cat">${p.categoria}</span>
        <span class="badge badge-price">R$ ${parseFloat(p.preco).toFixed(2)}</span>
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
  ['p-nome','p-preco','p-estoque','p-estilo','p-desc'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const cat = document.getElementById('p-cat');
  if (cat) cat.selectedIndex = 0;
  editandoId = null;
}

async function salvarProduto() {
  const nome  = document.getElementById('p-nome').value.trim();
  const preco = parseFloat(document.getElementById('p-preco').value) || 0;

  if (!nome)      { toast('Informe o nome do produto.', 'erro'); return; }
  if (preco <= 0) { toast('Informe um preço válido.', 'erro');   return; }

  const dados = {
    nome,
    categoria: document.getElementById('p-cat').value,
    preco,
    estoque:   parseInt(document.getElementById('p-estoque').value) || 0,
    estilo:    document.getElementById('p-estilo').value.trim(),
    descricao: document.getElementById('p-desc').value.trim(),
  };

  let resultado;
  if (editandoId !== null) {
    resultado = await apiFetch(`/produtos/${editandoId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(dados),
    });
    if (resultado) toast('Produto atualizado!');
  } else {
    resultado = await apiFetch('/produtos', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(dados),
    });
    if (resultado) toast('Produto adicionado!');
  }

  if (resultado) {
    cancelarForm();
    carregarProdutos();
  }
}

async function editarProduto(id) {
  const data = await apiFetch('/produtos');
  if (!data) return;
  const p = data.find(x => x.id === id);
  if (!p) return;

  editandoId = id;
  document.getElementById('p-nome').value    = p.nome;
  document.getElementById('p-cat').value     = p.categoria;
  document.getElementById('p-preco').value   = p.preco;
  document.getElementById('p-estoque').value = p.estoque;
  document.getElementById('p-estilo').value  = p.estilo    || '';
  document.getElementById('p-desc').value    = p.descricao || '';

  const f = document.getElementById('form-produto');
  if (!f.classList.contains('open')) f.classList.add('open');
  f.scrollIntoView({ behavior: 'smooth' });
}

async function deletarProduto(id) {
  if (!confirm('Deletar este produto? Esta ação não pode ser desfeita.')) return;
  const res = await apiFetch(`/produtos/${id}`, { method: 'DELETE' });
  if (res) {
    toast('Produto removido.');
    carregarProdutos();
  }
}

/* ============================================================
   COMPRAS
   ============================================================ */
async function carregarCompras(q = '') {
  const data = await apiFetch('/compras');
  if (!data) return;

  const lista = q
    ? data.filter(c =>
        c.cliente_nome.toLowerCase().includes(q.toLowerCase()) ||
        c.produto_nome.toLowerCase().includes(q.toLowerCase())
      )
    : data;

  renderListaCompras(lista);
}

function filtrarCompras(q) { carregarCompras(q); }

function renderListaCompras(lista) {
  const el = document.getElementById('lista-compras');
  if (!el) return;

  if (!lista.length) {
    el.innerHTML = `<div class="empty">
      <i class="ti ti-shopping-bag"></i>
      <p>Nenhuma compra registrada ainda.<br>As compras aparecem quando clientes compram no site.</p>
    </div>`;
    return;
  }

  const corStatus = {
    pendente:  { bg: '#FFF8E1', color: '#BA7517' },
    pago:      { bg: '#EAF3DE', color: '#3B6D11' },
    cancelado: { bg: '#FCEBEB', color: '#A32D2D' },
  };

  el.innerHTML = lista.map(c => {
    const cor = corStatus[c.status] || corStatus.pendente;
    return `
      <div class="list-item">
        <div class="item-info">
          <div class="item-name">${c.cliente_nome}</div>
          <div class="item-sub">
            ${c.produto_nome} · Qtd: ${c.quantidade} · ${c.criado_em}
            <br><small>${c.cliente_email}</small>
          </div>
        </div>
        <div class="item-badges">
          <span class="badge" style="background:${cor.bg};color:${cor.color}">${c.status}</span>
          <span class="badge badge-price">R$ ${parseFloat(c.total).toFixed(2)}</span>
        </div>
        <div class="item-actions">
          <select onchange="atualizarStatus(${c.id}, this.value)"
            style="padding:5px 8px;border:1px solid #ddd;border-radius:8px;font-size:12px;cursor:pointer;">
            <option value="pendente"  ${c.status==='pendente'  ? 'selected':''}>Pendente</option>
            <option value="pago"      ${c.status==='pago'      ? 'selected':''}>Pago</option>
            <option value="cancelado" ${c.status==='cancelado' ? 'selected':''}>Cancelado</option>
          </select>
        </div>
      </div>`;
  }).join('');
}

async function atualizarStatus(id, status) {
  const res = await apiFetch(`/compras/${id}/status`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ status }),
  });
  if (res) toast(`Status: ${status}`);
}

async function exportarComprasCSV() {
  const data = await apiFetch('/compras');
  if (!data || !data.length) { toast('Nenhuma compra para exportar.', 'erro'); return; }

  const csv = 'Cliente,Email,Produto,Quantidade,Total,Status,Data\n'
    + data.map(c =>
        `"${c.cliente_nome}","${c.cliente_email}","${c.produto_nome}","${c.quantidade}","${c.total}","${c.status}","${c.criado_em}"`
      ).join('\n');

  const a    = document.createElement('a');
  a.href     = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'compras.csv';
  a.click();
  toast('CSV exportado!');
}

/* ============================================================
   CANDIDATOS
   ============================================================ */
async function carregarCandidatos(q = '') {
  const data = await apiFetch('/candidatos');
  if (!data) return;

  const lista = q
    ? data.filter(c =>
        c.nome.toLowerCase().includes(q.toLowerCase()) ||
        c.email.toLowerCase().includes(q.toLowerCase())
      )
    : data;

  renderListaCandidatos(lista);
}

function filtrarCandidatos(q) { carregarCandidatos(q); }

function renderListaCandidatos(lista) {
  const el = document.getElementById('lista-candidatos');
  if (!el) return;

  if (!lista.length) {
    el.innerHTML = `<div class="empty">
      <i class="ti ti-users"></i>
      <p>Nenhum candidato cadastrado ainda.</p>
    </div>`;
    return;
  }

  el.innerHTML = lista.map(c => `
    <div class="cand-item">
      <div class="cand-name">${c.nome}</div>
      <div class="cand-details">
        <span class="cand-detail"><i class="ti ti-mail"></i>${c.email}</span>
        <span class="cand-detail"><i class="ti ti-calendar"></i>${c.data_nasc || c.criado_em}</span>
      </div>
    </div>
  `).join('');
}

async function exportarCSV() {
  const data = await apiFetch('/candidatos');
  if (!data || !data.length) { toast('Nenhum candidato para exportar.', 'erro'); return; }

  const csv = 'Nome,Email,Data\n'
    + data.map(c => `"${c.nome}","${c.email}","${c.data_nasc}"`).join('\n');

  const a    = document.createElement('a');
  a.href     = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'candidatos.csv';
  a.click();
  toast('CSV exportado!');
}

/* ============================================================
   CONFIGURAÇÕES
   ============================================================ */
function salvarConfig() {
  const nome   = document.getElementById('cfg-nome').value.trim();
  const senha  = document.getElementById('cfg-senha').value;
  const senha2 = document.getElementById('cfg-senha2')?.value;

  if (senha && senha !== senha2) { toast('As senhas não coincidem.', 'erro'); return; }

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

/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */
function inicializar() {
  const nomeSalvo = localStorage.getItem('adm_nome_loja');
  if (nomeSalvo) {
    const el  = document.getElementById('nome-loja');
    const cfg = document.getElementById('cfg-nome');
    if (el)  el.textContent = nomeSalvo;
    if (cfg) cfg.value      = nomeSalvo;
  }
  renderDashboard();
}
