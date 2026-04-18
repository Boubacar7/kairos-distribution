/* Kairos Distributions - Storefront logic
 * Depends on window.KairosStore (kairos-store.js)
 */
(function () {
  'use strict';
  const S = window.KairosStore;
  if (!S) { console.error('KairosStore missing'); return; }

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const state = {
    category: 'all',
    search: '',
    currentProduct: null,
    checkoutStep: 1,
    checkoutData: { customer: {}, paymentMethod: 'cash', notes: '' },
    lastOrder: null
  };

  /* --------------- toasts --------------- */
  function toast(msg, kind) {
    const wrap = $('#toasts');
    const el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.textContent = msg;
    wrap.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 2600);
  }

  /* --------------- modals + drawer --------------- */
  function openDrawer() { $('#cartDrawer').classList.add('open'); $('#overlay').classList.add('open'); }
  function closeDrawer() { $('#cartDrawer').classList.remove('open'); $('#overlay').classList.remove('open'); }
  function openModal(id) { $('#' + id).classList.add('open'); $('#overlay').classList.add('open'); }
  function closeModals() {
    $$('.modal').forEach(m => m.classList.remove('open'));
    closeDrawer();
  }

  /* --------------- catalog --------------- */
  function renderCategories() {
    const cats = ['all'].concat(Array.from(new Set(S.getProducts().map(p => p.category))));
    const wrap = $('#catChips');
    wrap.innerHTML = cats.map(c =>
      `<button class="chip ${state.category === c ? 'active' : ''}" data-cat="${c}">${c === 'all' ? 'Tout' : c}</button>`
    ).join('');
    $$('.chip', wrap).forEach(btn => btn.addEventListener('click', () => {
      state.category = btn.dataset.cat;
      renderCategories();
      renderProducts();
    }));
  }

  function renderProducts() {
    const grid = $('#productGrid');
    const q = state.search.trim().toLowerCase();
    const list = S.getProducts().filter(p => {
      if (p.status !== 'Publié') return false;
      if (state.category !== 'all' && p.category !== state.category) return false;
      if (q && !(p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))) return false;
      return true;
    });
    $('#statProducts').textContent = S.getProducts().filter(p => p.status === 'Publié').length + '+';
    if (!list.length) {
      grid.innerHTML = '<div class="empty" style="grid-column:1/-1">Aucun produit trouvé.</div>';
      return;
    }
    grid.innerHTML = list.map(p => {
      const effective = S.effectivePrice(p);
      const hasPromo = Number(p.promo) > 0;
      const outOfStock = Number(p.stock) <= 0;
      const img = p.image ? `style="background-image:url('${escapeAttr(p.image)}')"` : '';
      return `
        <article class="p" data-id="${p.id}">
          <div class="ph" ${img}></div>
          <div class="pb">
            <span class="pill">${escapeHtml(p.category)}</span>
            <h3 style="margin:0;font-size:1.05rem">${escapeHtml(p.name)}</h3>
            <p class="small" style="margin:0">${escapeHtml(p.description || '')}</p>
            <div class="price-row">
              <span class="price">${S.fmtMoney(effective)}</span>
              ${hasPromo ? `<span class="price-old">${S.fmtMoney(p.price)}</span><span class="promo-badge">-${p.promo}%</span>` : ''}
            </div>
            <div style="display:flex;gap:8px;margin-top:10px">
              <button class="btn btn2" data-action="view" style="flex:1;padding:10px 12px">Détail</button>
              <button class="btn" data-action="add" style="flex:1;padding:10px 12px" ${outOfStock ? 'disabled' : ''}>${outOfStock ? 'Rupture' : 'Ajouter'}</button>
            </div>
          </div>
        </article>`;
    }).join('');

    $$('.p', grid).forEach(card => {
      const id = card.dataset.id;
      card.querySelector('[data-action="add"]').addEventListener('click', (e) => {
        e.stopPropagation();
        S.addToCart(id, 1);
        toast('Ajouté au panier', 'ok');
      });
      card.querySelector('[data-action="view"]').addEventListener('click', (e) => {
        e.stopPropagation();
        openProduct(id);
      });
    });
  }

  /* --------------- product modal --------------- */
  function openProduct(id) {
    const p = S.getProduct(id);
    if (!p) return;
    state.currentProduct = id;
    $('#pmTitle').textContent = p.name;
    const effective = S.effectivePrice(p);
    const hasPromo = Number(p.promo) > 0;
    const img = p.image ? `<div class="ph" style="height:220px;border-radius:16px;background-image:url('${escapeAttr(p.image)}')"></div>` : `<div class="ph" style="height:220px;border-radius:16px"></div>`;
    $('#pmBody').innerHTML = `
      ${img}
      <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <span class="pill">${escapeHtml(p.category)}</span>
        <span class="small">Stock: ${Number(p.stock) || 0}</span>
      </div>
      <p style="margin-top:10px">${escapeHtml(p.description || 'Aucune description.')}</p>
      <div class="price-row" style="margin-top:10px">
        <span class="price" style="font-size:1.4rem">${S.fmtMoney(effective)}</span>
        ${hasPromo ? `<span class="price-old">${S.fmtMoney(p.price)}</span><span class="promo-badge">-${p.promo}%</span>` : ''}
      </div>
      <div style="margin-top:14px;display:flex;align-items:center;gap:12px">
        <label class="small">Quantité</label>
        <div class="qty">
          <button type="button" id="pmMinus">−</button>
          <span id="pmQty">1</span>
          <button type="button" id="pmPlus">+</button>
        </div>
      </div>`;
    let qty = 1;
    $('#pmMinus').onclick = () => { qty = Math.max(1, qty - 1); $('#pmQty').textContent = qty; };
    $('#pmPlus').onclick = () => { qty = Math.min(Number(p.stock) || 99, qty + 1); $('#pmQty').textContent = qty; };
    $('#pmAdd').onclick = () => {
      if (Number(p.stock) <= 0) { toast('Rupture de stock', 'err'); return; }
      S.addToCart(id, qty);
      toast('Ajouté au panier', 'ok');
      closeModals();
    };
    openModal('productModal');
  }

  /* --------------- cart --------------- */
  function renderCart() {
    const sum = S.cartSummary();
    $('#cartCount').textContent = sum.count;
    const body = $('#cartBody');
    const foot = $('#cartFoot');
    if (!sum.items.length) {
      body.innerHTML = '<div class="empty">Votre panier est vide.<br>Ajoutez des produits depuis le catalogue.</div>';
      foot.innerHTML = '';
      return;
    }
    body.innerHTML = sum.items.map(it => {
      const p = S.getProduct(it.productId);
      const img = p && p.image ? `style="background-image:url('${escapeAttr(p.image)}')"` : '';
      return `
        <div class="line" data-id="${it.productId}">
          <div class="thumb" ${img}></div>
          <div class="info">
            <strong>${escapeHtml(it.name)}</strong>
            <div class="small">${S.fmtMoney(it.unitPrice)}</div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
              <div class="qty">
                <button type="button" data-q="-">−</button>
                <span>${it.qty}</span>
                <button type="button" data-q="+">+</button>
              </div>
              <button class="rm" data-rm>Retirer</button>
            </div>
          </div>
          <div class="row-total">${S.fmtMoney(it.lineTotal)}</div>
        </div>`;
    }).join('');
    $$('.line', body).forEach(line => {
      const id = line.dataset.id;
      const item = sum.items.find(i => i.productId === id);
      line.querySelector('[data-q="-"]').onclick = () => S.updateCartQty(id, item.qty - 1);
      line.querySelector('[data-q="+"]').onclick = () => S.updateCartQty(id, item.qty + 1);
      line.querySelector('[data-rm]').onclick = () => S.removeFromCart(id);
    });
    const free = sum.delivery === 0;
    foot.innerHTML = `
      <div class="sum-line"><span>Sous-total</span><span>${S.fmtMoney(sum.subtotal)}</span></div>
      <div class="sum-line"><span>Livraison</span><span>${free ? 'Offerte' : S.fmtMoney(sum.delivery)}</span></div>
      <div class="sum-line sum-total"><span>Total</span><span>${S.fmtMoney(sum.total)}</span></div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn btn2" id="clearCartBtn" type="button" style="flex:1">Vider</button>
        <button class="btn" id="checkoutBtn" type="button" style="flex:2">Passer commande</button>
      </div>`;
    $('#clearCartBtn').onclick = () => { if (confirm('Vider le panier ?')) S.clearCart(); };
    $('#checkoutBtn').onclick = startCheckout;
  }

  /* --------------- checkout --------------- */
  function startCheckout() {
    const sum = S.cartSummary();
    if (!sum.items.length) { toast('Panier vide', 'err'); return; }
    state.checkoutStep = 1;
    state.checkoutData = { customer: {}, paymentMethod: 'cash', notes: '' };
    renderCheckout();
    openModal('checkoutModal');
  }

  function renderCheckout() {
    const sum = S.cartSummary();
    const settings = S.getSettings();
    const body = $('#coBody');
    const foot = $('#coFoot');
    const title = $('#coTitle');

    if (state.checkoutStep === 1) {
      title.textContent = 'Étape 1/3 · Vos informations';
      body.innerHTML = `
        <div class="form">
          <div><label>Prénom</label><input id="coFirst" value="${escapeAttr(state.checkoutData.customer.firstName || '')}" required></div>
          <div><label>Nom</label><input id="coLast" value="${escapeAttr(state.checkoutData.customer.lastName || '')}" required></div>
          <div><label>Téléphone *</label><input id="coPhone" type="tel" placeholder="+221 77 000 00 00" value="${escapeAttr(state.checkoutData.customer.phone || '')}" required></div>
          <div><label>Email (optionnel)</label><input id="coEmail" type="email" value="${escapeAttr(state.checkoutData.customer.email || '')}"></div>
        </div>`;
      foot.innerHTML = `
        <button class="btn btn2" data-close type="button">Annuler</button>
        <button class="btn" id="coNext1" type="button">Continuer</button>`;
      $('#coNext1').onclick = () => {
        const first = $('#coFirst').value.trim();
        const last = $('#coLast').value.trim();
        const phone = $('#coPhone').value.trim();
        const email = $('#coEmail').value.trim();
        if (!first || !last || !phone) { toast('Nom, prénom et téléphone obligatoires', 'err'); return; }
        state.checkoutData.customer.firstName = first;
        state.checkoutData.customer.lastName = last;
        state.checkoutData.customer.phone = phone;
        state.checkoutData.customer.email = email;
        state.checkoutStep = 2;
        renderCheckout();
      };
      return;
    }

    if (state.checkoutStep === 2) {
      title.textContent = 'Étape 2/3 · Livraison';
      body.innerHTML = `
        <div class="form">
          <div class="full"><label>Adresse</label><input id="coAddr" placeholder="Rue, quartier, repère" value="${escapeAttr(state.checkoutData.customer.address || '')}" required></div>
          <div><label>Ville</label><input id="coCity" value="${escapeAttr(state.checkoutData.customer.city || '')}" required></div>
          <div><label>Pays</label><input id="coCountry" value="${escapeAttr(state.checkoutData.customer.country || 'Sénégal')}"></div>
          <div class="full"><label>Notes de livraison (optionnel)</label><textarea id="coNotes">${escapeHtml(state.checkoutData.notes || '')}</textarea></div>
        </div>
        <div class="box" style="margin-top:14px">
          <div class="sum-line"><span>Sous-total</span><span>${S.fmtMoney(sum.subtotal)}</span></div>
          <div class="sum-line"><span>Livraison</span><span>${sum.delivery === 0 ? 'Offerte' : S.fmtMoney(sum.delivery)}</span></div>
          <div class="sum-line sum-total"><span>Total</span><span>${S.fmtMoney(sum.total)}</span></div>
          ${sum.delivery > 0 ? `<p class="small" style="margin:8px 0 0">Livraison offerte dès ${S.fmtMoney(settings.freeDeliveryFrom)}.</p>` : ''}
        </div>`;
      foot.innerHTML = `
        <button class="btn btn2" id="coBack2" type="button">Retour</button>
        <button class="btn" id="coNext2" type="button">Continuer</button>`;
      $('#coBack2').onclick = () => { state.checkoutStep = 1; renderCheckout(); };
      $('#coNext2').onclick = () => {
        const addr = $('#coAddr').value.trim();
        const city = $('#coCity').value.trim();
        const country = $('#coCountry').value.trim() || 'Sénégal';
        if (!addr || !city) { toast('Adresse et ville obligatoires', 'err'); return; }
        state.checkoutData.customer.address = addr;
        state.checkoutData.customer.city = city;
        state.checkoutData.customer.country = country;
        state.checkoutData.notes = $('#coNotes').value.trim();
        state.checkoutStep = 3;
        renderCheckout();
      };
      return;
    }

    if (state.checkoutStep === 3) {
      title.textContent = 'Étape 3/3 · Paiement';
      const methods = settings.paymentMethods || {};
      const options = [];
      if (methods.cash !== false) options.push({ id: 'cash', label: 'Paiement à la livraison', desc: 'Vous payez en espèces à la réception du colis.' });
      if (methods.orange) options.push({ id: 'orange', label: 'Orange Money', desc: 'Envoyer le paiement vers notre numéro marchand.' });
      if (methods.wave) options.push({ id: 'wave', label: 'Wave', desc: 'Payer rapidement par Wave après validation.' });
      if (methods.moov) options.push({ id: 'moov', label: 'Moov Money', desc: 'Réglez via Moov Money après confirmation.' });
      if (methods.card) options.push({ id: 'card', label: 'Carte bancaire', desc: 'Paiement en ligne sécurisé.' });

      body.innerHTML = `
        <div class="pay-list">
          ${options.map(o => `
            <label class="pay ${state.checkoutData.paymentMethod === o.id ? 'active' : ''}">
              <input type="radio" name="pay" value="${o.id}" ${state.checkoutData.paymentMethod === o.id ? 'checked' : ''}>
              <div><strong>${o.label}</strong><div class="small">${o.desc}</div></div>
            </label>`).join('')}
        </div>
        <div class="box" style="margin-top:14px">
          <div class="sum-line"><span>Client</span><span>${escapeHtml(state.checkoutData.customer.firstName + ' ' + state.checkoutData.customer.lastName)}</span></div>
          <div class="sum-line"><span>Téléphone</span><span>${escapeHtml(state.checkoutData.customer.phone)}</span></div>
          <div class="sum-line"><span>Livraison</span><span>${escapeHtml(state.checkoutData.customer.address + ', ' + state.checkoutData.customer.city)}</span></div>
          <div class="sum-line sum-total"><span>Total à payer</span><span>${S.fmtMoney(sum.total)}</span></div>
        </div>`;
      $$('input[name="pay"]').forEach(r => r.addEventListener('change', () => {
        state.checkoutData.paymentMethod = r.value;
        $$('.pay').forEach(el => el.classList.remove('active'));
        r.closest('.pay').classList.add('active');
      }));
      foot.innerHTML = `
        <button class="btn btn2" id="coBack3" type="button">Retour</button>
        <button class="btn" id="coConfirm" type="button">Confirmer la commande</button>`;
      $('#coBack3').onclick = () => { state.checkoutStep = 2; renderCheckout(); };
      $('#coConfirm').onclick = confirmOrder;
      return;
    }

    if (state.checkoutStep === 4) {
      title.textContent = 'Commande confirmée';
      const o = state.lastOrder;
      body.innerHTML = `
        <div class="success-box">
          <h4>Merci pour votre commande !</h4>
          <p class="small" style="margin:0">Un récapitulatif est enregistré sur cet appareil.</p>
          <div style="margin-top:14px;display:grid;gap:10px">
            <div class="box" style="background:#fff"><div class="small">Numéro de commande</div><strong style="font-size:1.2rem">${o.id}</strong></div>
            <div class="box" style="background:#fff"><div class="small">Numéro de suivi</div><strong style="font-size:1.1rem">${o.trackingNumber}</strong></div>
            <div class="box" style="background:#fff"><div class="small">Total payé / à payer</div><strong>${S.fmtMoney(o.total)} · ${paymentLabel(o.paymentMethod)}</strong></div>
          </div>
          <p class="small" style="margin-top:14px">Conservez ces numéros pour suivre l'état de votre commande dans la section "Suivi".</p>
        </div>`;
      foot.innerHTML = `
        <button class="btn btn2" id="coCopy" type="button">Copier le numéro</button>
        <button class="btn" id="coTrack" type="button">Voir le suivi</button>`;
      $('#coCopy').onclick = () => {
        const txt = `Commande ${o.id} · Suivi ${o.trackingNumber}`;
        if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => toast('Copié', 'ok'));
        else { window.prompt('Copier:', txt); }
      };
      $('#coTrack').onclick = () => {
        closeModals();
        $('#trackInput').value = o.id;
        runTrack(o.id);
        document.querySelector('#suivi').scrollIntoView({ behavior: 'smooth' });
      };
    }
  }

  function confirmOrder() {
    const sum = S.cartSummary();
    if (!sum.items.length) { toast('Panier vide', 'err'); return; }
    const payload = {
      customer: state.checkoutData.customer,
      items: sum.items.map(it => ({ productId: it.productId, name: it.name, qty: it.qty, unitPrice: it.unitPrice, lineTotal: it.lineTotal })),
      subtotal: sum.subtotal,
      delivery: sum.delivery,
      total: sum.total,
      paymentMethod: state.checkoutData.paymentMethod,
      notes: state.checkoutData.notes
    };
    const order = S.createOrder(payload);
    state.lastOrder = order;
    state.checkoutStep = 4;
    renderCheckout();
    renderCart();
    renderRecent();
    toast('Commande enregistrée', 'ok');
  }

  function paymentLabel(m) {
    return ({ cash: 'Paiement à la livraison', orange: 'Orange Money', wave: 'Wave', moov: 'Moov Money', card: 'Carte bancaire' })[m] || m;
  }

  /* --------------- tracking --------------- */
  function runTrack(query) {
    const out = $('#trackResult');
    const q = (query || $('#trackInput').value || '').trim();
    if (!q) { out.innerHTML = ''; return; }
    const order = S.getOrder(q);
    if (!order) {
      out.innerHTML = `<div class="box" style="border-color:#f1c6cc;background:#fff3f4"><strong>Aucune commande trouvée</strong><div class="small">Vérifiez votre numéro (ex: KD-2026-0106 ou KDTRK-…).</div></div>`;
      return;
    }
    const chain = ['Nouvelle', 'Préparation', 'Expédiée', 'Livrée'];
    const isCancelled = order.status === 'Annulée';
    const idx = Math.max(0, chain.indexOf(order.status));
    const chainHtml = isCancelled
      ? `<div class="sc on" style="background:var(--danger);border-color:var(--danger)">Annulée</div>`
      : chain.map((s, i) => `<div class="sc ${i <= idx ? 'on' : ''}">${s}</div>`).join('');
    const items = (order.items || []).map(it => `<div class="small">• ${it.qty} × ${escapeHtml(it.name)} — ${S.fmtMoney(it.lineTotal)}</div>`).join('');
    const history = (order.history || []).slice().reverse().map(h =>
      `<div class="tl"><strong>${escapeHtml(h.status)}</strong>${h.note ? ' — ' + escapeHtml(h.note) : ''}<time>${S.formatDate(h.at)}</time></div>`
    ).join('');
    out.innerHTML = `
      <div class="box" style="background:#fff">
        <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">
          <div>
            <div class="small">Commande</div>
            <strong style="font-size:1.15rem">${order.id}</strong>
          </div>
          <div style="text-align:right">
            <div class="small">Numéro de suivi</div>
            <strong>${order.trackingNumber}</strong>
          </div>
        </div>
        <div class="status-chain">${chainHtml}</div>
        <div class="small">Client : ${escapeHtml(order.customer.firstName + ' ' + order.customer.lastName)} · ${escapeHtml(order.customer.phone)}</div>
        <div class="small">Livraison : ${escapeHtml(order.customer.address + ', ' + order.customer.city)}</div>
        <div style="margin-top:10px">${items}</div>
        <div class="sum-line sum-total" style="margin-top:10px"><span>Total</span><span>${S.fmtMoney(order.total)}</span></div>
        <div class="small">Paiement : ${paymentLabel(order.paymentMethod)} · ${escapeHtml(order.paymentStatus || '')}</div>
        <div style="margin-top:14px"><strong>Historique</strong></div>
        <div class="timeline">${history}</div>
      </div>`;
  }

  function renderRecent() {
    const list = S.getOrders().slice(0, 5);
    const wrap = $('#recentOrders');
    if (!list.length) { wrap.innerHTML = '<div class="small">Aucune commande enregistrée pour l\'instant.</div>'; return; }
    wrap.innerHTML = list.map(o =>
      `<div class="tl" data-id="${o.id}" style="cursor:pointer">
        <strong>${o.id}</strong> · ${escapeHtml(o.status)}
        <time>${S.formatDate(o.createdAt)} · ${S.fmtMoney(o.total)}</time>
      </div>`
    ).join('');
    $$('.tl', wrap).forEach(el => el.addEventListener('click', () => {
      $('#trackInput').value = el.dataset.id;
      runTrack(el.dataset.id);
    }));
  }

  /* --------------- utils --------------- */
  function escapeHtml(str) { return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function escapeAttr(str) { return escapeHtml(str); }

  /* --------------- bindings --------------- */
  function bind() {
    $('#cartBtn').addEventListener('click', openDrawer);
    $('#overlay').addEventListener('click', closeModals);
    $$('[data-close]').forEach(el => el.addEventListener('click', closeModals));
    $('#searchInput').addEventListener('input', (e) => { state.search = e.target.value; renderProducts(); });
    $('#trackForm').addEventListener('submit', (e) => { e.preventDefault(); runTrack(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModals(); });
    window.addEventListener('kairos:cart-change', renderCart);
    window.addEventListener('kairos:products-change', () => { renderCategories(); renderProducts(); });
    window.addEventListener('kairos:orders-change', renderRecent);
    window.addEventListener('kairos:settings-change', () => { applySettings(); renderCart(); });
  }

  function applySettings() {
    const s = S.getSettings();
    const line = $('#supportLine');
    if (line) line.innerHTML = `WhatsApp : <strong>${escapeHtml(s.supportWhatsapp)}</strong> · Snapchat : <strong>${escapeHtml(s.supportSnapchat)}</strong>`;
  }

  /* --------------- init --------------- */
  document.addEventListener('DOMContentLoaded', () => {
    $('#year').textContent = new Date().getFullYear();
    bind();
    applySettings();
    renderCategories();
    renderProducts();
    renderCart();
    renderRecent();
  });
})();
