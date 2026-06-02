// ===== MODAL ZOOM =====
const zoom = document.getElementById('zoom');
const zoomImg = document.getElementById('zoomImg');
const zoomTitle = document.getElementById('zoomTitle');
const zoomDesc = document.getElementById('zoomDesc');
const zoomPrice = document.getElementById('zoomPrice');
const closeZoom = document.getElementById('closeZoom');

document.querySelectorAll('.produto').forEach(produto => {

    // Abrir zoom ao clicar no card (mas não no botão comprar)
    produto.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-comprar')) return;

        zoomImg.src = this.dataset.img;
        zoomTitle.textContent = this.dataset.title;
        zoomDesc.textContent = this.dataset.desc;
        zoomPrice.textContent = this.dataset.price;
        zoom.classList.add('ativo');
    });
});

closeZoom.addEventListener('click', () => zoom.classList.remove('ativo'));
zoom.addEventListener('click', (e) => { if (e.target === zoom) zoom.classList.remove('ativo'); });

// ===== BOTÃO COMPRAR =====
document.querySelectorAll('.btn-comprar').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.stopPropagation(); // não abre o zoom

        const produto = this.closest('.produto');
        const nome = produto.dataset.title;

        // Já comprado? Ignora
        if (this.classList.contains('comprado')) return;

        // Muda visual do botão
        this.classList.add('comprado');
        this.textContent = '✅ Comprado!';

        // Cria notificação
        mostrarNotificacao(nome);

        // Volta ao normal depois de 3s
        setTimeout(() => {
            this.classList.remove('comprado');
            this.textContent = ' Comprar Agora';
        }, 3000);
    });
});

// ===== NOTIFICAÇÃO =====
function mostrarNotificacao(nome) {
    // Remove notificação anterior se existir
    const antiga = document.querySelector('.notificacao');
    if (antiga) antiga.remove();

    const notif = document.createElement('div');
    notif.classList.add('notificacao');
    notif.innerHTML = `
        <span class="notif-icon">✅</span>
        <div>
            <strong>${nome}</strong>
            <p>adicionado ao pedido!</p>
        </div>
    `;
    document.body.appendChild(notif);

    // Aparece
    setTimeout(() => notif.classList.add('visivel'), 50);

    // Some após 3s
    setTimeout(() => {
        notif.classList.remove('visivel');
        setTimeout(() => notif.remove(), 400);
    }, 3000);
}
