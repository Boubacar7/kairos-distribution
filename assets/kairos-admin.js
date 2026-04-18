/* Kairos Distributions - Admin logic */
(function () {
  'use strict';
  const S = window.KairosStore;
  if (!S) { console.error('KairosStore missing'); return; }

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const state = { orderFilter: 'all', orderSearch: '', productVariants: [], currentOrderIds: [] };

  /* ---------- toasts ---------- */
  function toast(msg, kind) {
    const wrap = $('#toasts');
    const el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.textContent = msg;
    wrap.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 2600);
  }

  /* ---------- auth ---------- */
  function showLogin() { $('#loginWrap').classList.remove('hidden'); $('#app').classList.add('hidden'); }
  function showApp() { $('#loginWrap').classList.add('hidden'); $('#app').classList.remove('hidden'); renderAll(); }
  function initAuth() {
    if (S.adminIsLogged()) showApp(); else showLogin();
    $('#loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const user = $('#loginUser').value.trim() || 'admin';
      const pwd = $('#loginPwd').value;
      const ok = S.adminLogin(user, pwd);
      if (ok) { $('#loginPwd').value = ''; showApp(); toast('Bienvenue', 'ok'); }
      else toast('Identifiants incorrects', 'err');
    });
    $('#logoutBtn').addEventListener('click', () => { S.adminLogout(); showLogin(); });
  }
  function updateSessionLabel() {
    const u = S.currentUser();
    const lbl = $('#sessionLabel');
    if (!lbl) return;
    lbl.textContent = u ? (u.username + ' · ' + u.role) : '';
  }
  function requireRole(roles) {
    const u = S.currentUser();
    if (!u) return false;
    return !roles || (Array.isArray(roles) ? roles : [roles]).indexOf(u.role) >= 0;
  }

  /* ---------- utilities ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function statusBadgeClass(status) {
    return ({ 'Nouvelle': 'b-new', 'Préparation': 'b-prep', 'Expédiée': 'b-shipped', 'Livrée': 'b-done', 'Annulée': 'b-cancel' })[status] || 'b-new';
  }
  function paymentLabel(m) {
    return ({ cash: 'Cash livraison', orange: 'Orange Money', wave: 'Wave', moov: 'Moov Money', card: 'Carte' })[m] || m || '-';
  }

  /* ---------- dashboard ---------- */
  function renderStats() {
    const orders = S.getOrders();
    const products = S.getProducts();
    const now = new Date();
    const thisMonth = now.getFullYear() + '-' + now.getMonth();
    const monthRevenue = orders.filter(o => o.status !== 'Annulée').filter(o => {
      const d = new Date(o.createdAt);
      return d.getFullYear() + '-' + d.getMonth() === thisMonth;
    }).reduce((s, o) => s + (o.total || 0), 0);
    const pending = orders.filter(o => o.status === 'Nouvelle' || o.status === 'Préparation').length;
    const wrap = $('#statsWrap');
    wrap.innerHTML = `
      <div class="stat"><span class="small">CA mois</span><strong>${S.fmtMoney(monthRevenue)}</strong></div>
      <div class="stat"><span class="small">Commandes</span><strong>${orders.length}</strong></div>
      <div class="stat"><span class="small">En attente</span><strong>${pending}</strong></div>
      <div class="stat"><span class="small">Produits</span><strong>${products.length}</strong></div>`;
  }

  function renderNotifs() {
    const orders = S.getOrders();
    const lowStock = S.getProducts().filter(p => Number(p.stock) <= 5 && p.status === 'Publié');
    const latest = orders.slice(0, 3);
    const wrap = $('#notifWrap');
    if (!latest.length && !lowStock.length) {
      wrap.innerHTML = '<div class="note small">Aucune notification.</div>';
      return;
    }
    wrap.innerHTML = [
      ...latest.map(o => `<div class="note"><strong>${esc(o.id)}</strong><div class="small">${esc(o.customer.firstName)} ${esc(o.customer.lastName)} — ${esc(o.status)} · ${S.fmtMoney(o.total)}</div></div>`),
      ...lowStock.slice(0, 3).map(p => `<div class="note"><strong>Stock faible: ${esc(p.name)}</strong><div class="small">Reste ${p.stock} unité(s).</div></div>`)
    ].join('');
  }

  function renderKPI() {
    const orders = S.getOrders().filter(o => o.status !== 'Annulée');
    const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    const avg = orders.length ? Math.round(revenue / orders.length) : 0;
    const delivered = orders.filter(o => o.status === 'Livrée').length;
    const newCount = S.getOrders().filter(o => o.status === 'Nouvelle').length;
    const cancelled = S.getOrders().filter(o => o.status === 'Annulée').length;
    $('#kpiWrap').innerHTML = `
      <div class="kpi"><div class="small">CA total</div><span class="v">${S.fmtMoney(revenue)}</span></div>
      <div class="kpi"><div class="small">Panier moyen</div><span class="v">${S.fmtMoney(avg)}</span></div>
      <div class="kpi"><div class="small">Livrées</div><span class="v">${delivered}</span></div>
      <div class="kpi"><div class="small">Nouvelles</div><span class="v">${newCount}</span></div>
      <div class="kpi"><div class="small">Annulées</div><span class="v">${cancelled}</span></div>`;
  }

  function renderChart() {
    const year = new Date().getFullYear();
    const months = Array(12).fill(0);
    S.getOrders().forEach(o => {
      if (o.status === 'Annulée') return;
      const d = new Date(o.createdAt);
      if (d.getFullYear() === year) months[d.getMonth()] += (o.total || 0);
    });
    const max = Math.max.apply(null, months.concat([1]));
    $('#bars').innerHTML = months.map(v => {
      const h = Math.max(4, Math.round((v / max) * 100));
      return `<span title="${S.fmtMoney(v)}" style="height:${h}%"></span>`;
    }).join('');
  }

  function renderOps() {
    const lowStock = S.getProducts().filter(p => Number(p.stock) <= 5 && p.status === 'Publié').length;
    const late = S.getOrders().filter(o => {
      if (o.status !== 'Préparation' && o.status !== 'Nouvelle') return false;
      const age = (Date.now() - new Date(o.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return age > 2;
    }).length;
    const promo = S.getProducts().filter(p => Number(p.promo) > 0 && p.status === 'Publié').length;
    $('#opsWrap').innerHTML = `
      <div class="item"><strong>${promo} produit(s) en promo</strong><div class="small">Mettez-les en avant.</div></div>
      <div class="item"><strong>${lowStock} produit(s) en stock critique</strong><div class="small">Pensez à réapprovisionner.</div></div>
      <div class="item"><strong>${late} commande(s) en retard</strong><div class="small">Plus de 2 jours sans expédition.</div></div>`;
  }

  /* ---------- orders ---------- */
  function renderOrders() {
    const all = S.getOrders();
    const q = state.orderSearch.trim().toLowerCase();
    const rows = all.filter(o => {
      if (state.orderFilter !== 'all' && o.status !== state.orderFilter) return false;
      if (!q) return true;
      const hay = [o.id, o.trackingNumber, o.customer.firstName, o.customer.lastName, o.customer.phone, o.status, (o.items || []).map(i => i.name).join(' ')].join(' ').toLowerCase();
      return hay.includes(q);
    });
    const tbody = $('#ordersTable tbody');
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--muted)">Aucune commande.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(o => `
      <tr data-id="${esc(o.id)}">
        <td><strong>${esc(o.id)}</strong></td>
        <td>${esc(o.customer.firstName)} ${esc(o.customer.lastName)}<br><span class="small">${esc(o.customer.phone || '')}</span></td>
        <td>${(o.items || []).length} article(s)</td>
        <td>${S.fmtMoney(o.total)}</td>
        <td>${esc(paymentLabel(o.paymentMethod))}<br><span class="small">${esc(o.paymentStatus || '')}</span></td>
        <td><span class="badge ${statusBadgeClass(o.status)}">${esc(o.status)}</span></td>
        <td><span class="small">${esc(o.trackingNumber)}</span></td>
        <td><span class="small">${esc(S.formatDate(o.createdAt))}</span></td>
        <td><button class="btn" data-open-order="${esc(o.id)}" type="button">Ouvrir</button></td>
      </tr>`).join('');
    $$('[data-open-order]', tbody).forEach(btn => btn.addEventListener('click', () => openOrderModal(btn.dataset.openOrder)));
  }

  function openOrderModal(id) {
    const o = S.getOrder(id);
    if (!o) return;
    $('#orderModalTitle').textContent = 'Commande ' + o.id;
    const items = (o.items || []).map(i => `<div class="item">${i.qty} × ${esc(i.name)} — ${S.fmtMoney(i.lineTotal)}</div>`).join('');
    const history = (o.history || []).slice().reverse().map(h => `<div class="item"><strong>${esc(h.status)}</strong>${h.note ? ' — ' + esc(h.note) : ''}<div class="small">${esc(S.formatDate(h.at))}</div></div>`).join('');
    $('#orderModalBody').innerHTML = `
      <div class="cards">
        <div class="card"><strong>Client</strong><div class="mini">${esc(o.customer.firstName)} ${esc(o.customer.lastName)}<br>${esc(o.customer.phone)}${o.customer.email ? '<br>' + esc(o.customer.email) : ''}</div></div>
        <div class="card"><strong>Livraison</strong><div class="mini">${esc(o.customer.address)}<br>${esc(o.customer.city)}, ${esc(o.customer.country || '')}</div></div>
        <div class="card"><strong>Paiement</strong><div class="mini">${esc(paymentLabel(o.paymentMethod))}<br>Statut : ${esc(o.paymentStatus || '-')}</div></div>
        <div class="card"><strong>Total</strong><div class="mini">${S.fmtMoney(o.total)}<br>Livraison : ${S.fmtMoney(o.delivery)}</div></div>
      </div>
      <div style="margin-top:14px"><strong>Articles</strong><div class="list" style="margin-top:8px">${items}</div></div>
      <div style="margin-top:14px">
        <label>Statut</label>
        <select id="omStatus">
          <option ${o.status === 'Nouvelle' ? 'selected' : ''}>Nouvelle</option>
          <option ${o.status === 'Préparation' ? 'selected' : ''}>Préparation</option>
          <option ${o.status === 'Expédiée' ? 'selected' : ''}>Expédiée</option>
          <option ${o.status === 'Livrée' ? 'selected' : ''}>Livrée</option>
          <option ${o.status === 'Annulée' ? 'selected' : ''}>Annulée</option>
        </select>
      </div>
      <div style="margin-top:10px">
        <label>Numéro de suivi</label>
        <input id="omTracking" value="${esc(o.trackingNumber)}">
      </div>
      <div style="margin-top:10px">
        <label>Note (optionnel)</label>
        <input id="omNote" placeholder="Ex: colis remis au livreur">
      </div>
      ${o.notes ? `<div class="small" style="margin-top:10px">Note client : ${esc(o.notes)}</div>` : ''}
      <div style="margin-top:14px"><strong>Historique</strong><div class="list" style="margin-top:8px">${history || '<div class="item small">Aucun événement.</div>'}</div></div>`;
    $('#orderModalFoot').innerHTML = `
      <button class="btn danger" id="omDelete" type="button">Supprimer</button>
      <button class="btn" data-close type="button">Fermer</button>
      <button class="btn primary" id="omSave" type="button">Enregistrer</button>`;
    $('#orderModalFoot [data-close]').onclick = closeOverlays;
    $('#omSave').onclick = () => {
      const newStatus = $('#omStatus').value;
      const newTracking = $('#omTracking').value.trim();
      const note = $('#omNote').value.trim();
      if (newTracking && newTracking !== o.trackingNumber) S.updateOrderTracking(o.id, newTracking);
      if (newStatus !== o.status || note) S.updateOrderStatus(o.id, newStatus, note);
      toast('Commande mise à jour', 'ok');
      closeOverlays();
      renderAll();
    };
    $('#omDelete').onclick = () => {
      if (confirm('Supprimer définitivement cette commande ?')) {
        S.deleteOrder(o.id);
        toast('Commande supprimée', 'ok');
        closeOverlays();
        renderAll();
      }
    };
    $('#orderOverlay').classList.add('open');
  }

  /* ---------- products ---------- */
  function renderProducts() {
    const list = S.getProducts();
    $('#catList').innerHTML = Array.from(new Set(list.map(p => p.category))).map(c => `<option value="${esc(c)}">`).join('');
    const wrap = $('#prodList');
    if (!list.length) { wrap.innerHTML = '<div class="item small">Aucun produit. Cliquez sur "Nouveau" pour ajouter.</div>'; return; }
    wrap.innerHTML = list.map(p => {
      const img = p.image ? `style="background-image:url('${esc(p.image)}')"` : '';
      const effective = S.effectivePrice(p);
      return `
        <div class="prow" data-id="${esc(p.id)}">
          <div class="th" ${img}></div>
          <div class="info">
            <strong>${esc(p.name)}</strong>
            <div class="small">${esc(p.category)} · Stock ${p.stock} · ${esc(p.status)}</div>
          </div>
          <div style="text-align:right">
            <div><strong>${S.fmtMoney(effective)}</strong></div>
            ${Number(p.promo) > 0 ? `<div class="small">-${p.promo}%</div>` : ''}
          </div>
          <button class="btn" data-edit type="button">Modifier</button>
        </div>`;
    }).join('');
    $$('[data-edit]', wrap).forEach(btn => btn.addEventListener('click', () => openProductModal(btn.closest('.prow').dataset.id)));

    const low = list.filter(p => Number(p.stock) <= 5);
    $('#stockList').innerHTML = low.length
      ? low.map(p => `<div class="item"><strong>${esc(p.name)}</strong> — ${p.stock} restant(s)</div>`).join('')
      : '<div class="item small">Tous les stocks sont corrects.</div>';
  }

  function openProductModal(id) {
    const form = $('#productForm');
    form.reset();
    $('#prodDeleteBtn').classList.toggle('hidden', !id);
    state.productVariants = [];
    if (id) {
      const p = S.getProduct(id);
      if (!p) return;
      $('#prodModalTitle').textContent = 'Modifier : ' + p.name;
      form.id.value = p.id;
      form.name.value = p.name;
      form.category.value = p.category || '';
      form.price.value = p.price || 0;
      form.stock.value = p.stock || 0;
      form.promo.value = p.promo || 0;
      form.status.value = p.status || 'Publié';
      form.image.value = p.image || '';
      form.description.value = p.description || '';
      state.productVariants = (p.variants || []).map(v => ({ ...v }));
    } else {
      $('#prodModalTitle').textContent = 'Nouveau produit';
      form.id.value = '';
      form.status.value = 'Publié';
      form.promo.value = 0;
      form.image.value = '';
    }
    updateImagePreview(form.image.value);
    renderVariantList();
    $('#imgFile').value = '';
    $('#productOverlay').classList.add('open');
  }

  function updateImagePreview(src) {
    const p = $('#imgPreview');
    if (!p) return;
    if (src) p.style.backgroundImage = `url('${src.replace(/'/g, "\\'")}')`;
    else p.style.backgroundImage = '';
    const info = $('#imgInfo');
    if (info) info.textContent = src ? (Math.round((src.length * 3 / 4) / 1024) + ' ko environ') : 'Aucune image sélectionnée.';
  }

  function renderVariantList() {
    const wrap = $('#variantList');
    if (!wrap) return;
    if (!state.productVariants.length) { wrap.innerHTML = '<div class="item small">Aucune variante. Le produit utilisera le stock de base.</div>'; return; }
    wrap.innerHTML = state.productVariants.map((v, i) => `
      <div class="item" data-i="${i}" style="display:grid;grid-template-columns:1fr 1fr 110px 90px 40px;gap:8px;align-items:center">
        <input data-field="name" value="${esc(v.name || '')}" placeholder="Nom (ex: Rouge)">
        <input data-field="attr" value="${esc(attrToString(v.attributes))}" placeholder="Couleur:Rouge, Taille:M">
        <input data-field="priceDelta" type="number" value="${v.priceDelta || 0}" placeholder="+ prix">
        <input data-field="stock" type="number" value="${v.stock || 0}" min="0" placeholder="stock">
        <button type="button" class="btn danger" data-rm style="padding:6px 10px;min-height:auto">×</button>
      </div>`).join('');
    $$('#variantList .item').forEach(row => {
      const i = Number(row.dataset.i);
      $$('input', row).forEach(inp => inp.addEventListener('input', () => {
        const v = state.productVariants[i];
        const f = inp.dataset.field;
        if (f === 'name') v.name = inp.value;
        else if (f === 'attr') v.attributes = parseAttr(inp.value);
        else if (f === 'priceDelta') v.priceDelta = Number(inp.value) || 0;
        else if (f === 'stock') v.stock = Math.max(0, Number(inp.value) || 0);
      }));
      row.querySelector('[data-rm]').addEventListener('click', () => {
        state.productVariants.splice(i, 1);
        renderVariantList();
      });
    });
  }

  function attrToString(a) {
    if (!a || typeof a !== 'object') return '';
    return Object.keys(a).map(k => k + ':' + a[k]).join(', ');
  }
  function parseAttr(s) {
    const out = {};
    String(s || '').split(',').forEach(part => {
      const [k, v] = part.split(':').map(x => (x || '').trim());
      if (k && v) out[k] = v;
    });
    return out;
  }

  function saveProduct() {
    const form = $('#productForm');
    const variants = state.productVariants.filter(v => v.name).map(v => ({
      id: v.id || S.uid('v'),
      name: v.name,
      attributes: v.attributes || {},
      priceDelta: Number(v.priceDelta) || 0,
      stock: Math.max(0, Number(v.stock) || 0)
    }));
    const variantStock = variants.reduce((s, v) => s + v.stock, 0);
    const data = {
      id: form.id.value || undefined,
      name: form.name.value.trim(),
      category: form.category.value.trim(),
      price: Number(form.price.value) || 0,
      stock: variants.length ? variantStock : Number(form.stock.value) || 0,
      promo: Number(form.promo.value) || 0,
      status: form.status.value,
      image: form.image.value.trim(),
      description: form.description.value.trim(),
      variants: variants
    };
    if (!data.name || !data.category || data.price < 0) { toast('Champs invalides', 'err'); return; }
    S.saveProduct(data);
    S.logActivity('product_save', 'Produit ' + data.name + ' enregistré');
    toast('Produit enregistré', 'ok');
    closeOverlays();
    renderAll();
  }

  async function handleImageFile(file) {
    if (!file) return;
    if (!/^image\//.test(file.type)) { toast('Fichier image invalide', 'err'); return; }
    try {
      const dataUrl = await S.resizeImage(file, 800, 0.82);
      $('#productForm').image.value = dataUrl;
      updateImagePreview(dataUrl);
      toast('Image redimensionnée', 'ok');
    } catch (e) {
      toast('Erreur image', 'err');
    }
  }

  /* ---------- settings ---------- */
  function loadSettings() {
    const s = S.getSettings();
    const f = $('#settingsForm');
    f.storeName.value = s.storeName;
    f.currency.value = s.currency;
    f.deliveryFee.value = s.deliveryFee;
    f.freeDeliveryFrom.value = s.freeDeliveryFrom;
    f.supportWhatsapp.value = s.supportWhatsapp;
    f.supportSnapchat.value = s.supportSnapchat;
    f.trackingPrefix.value = s.trackingPrefix;
    const pm = s.paymentMethods || {};
    f.pay_cash.checked = pm.cash !== false;
    f.pay_orange.checked = !!pm.orange;
    f.pay_wave.checked = !!pm.wave;
    f.pay_moov.checked = !!pm.moov;
    f.pay_card.checked = !!pm.card;
  }
  function saveSettingsForm(e) {
    e.preventDefault();
    const f = e.target;
    S.saveSettings({
      storeName: f.storeName.value.trim(),
      currency: f.currency.value.trim(),
      deliveryFee: Number(f.deliveryFee.value) || 0,
      freeDeliveryFrom: Number(f.freeDeliveryFrom.value) || 0,
      supportWhatsapp: f.supportWhatsapp.value.trim(),
      supportSnapchat: f.supportSnapchat.value.trim(),
      trackingPrefix: f.trackingPrefix.value.trim() || 'KDTRK',
      paymentMethods: {
        cash: f.pay_cash.checked,
        orange: f.pay_orange.checked,
        wave: f.pay_wave.checked,
        moov: f.pay_moov.checked,
        card: f.pay_card.checked
      }
    });
    toast('Réglages enregistrés', 'ok');
  }
  function handlePasswordChange(e) {
    e.preventDefault();
    const f = e.target;
    const ok = S.adminChangePassword(f.old.value, f.new.value);
    if (ok) { toast('Mot de passe changé', 'ok'); f.reset(); }
    else toast('Ancien mot de passe invalide', 'err');
  }

  /* ---------- coupons ---------- */
  function renderCoupons() {
    const list = S.getCoupons();
    const tbody = $('#couponsTable tbody');
    if (!tbody) return;
    if (!list.length) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:18px;color:var(--muted)">Aucun coupon.</td></tr>'; return; }
    const typeLabel = { percent: '%', fixed: 'FCFA', free_shipping: 'Livraison' };
    tbody.innerHTML = list.map(c => `
      <tr data-code="${esc(c.code)}">
        <td><strong>${esc(c.code)}</strong></td>
        <td>${esc(typeLabel[c.type] || c.type)}</td>
        <td>${c.type === 'free_shipping' ? '—' : (c.type === 'percent' ? (c.value + '%') : S.fmtMoney(c.value || 0))}</td>
        <td>${S.fmtMoney(c.minTotal || 0)}</td>
        <td>${c.expiresAt ? esc(c.expiresAt) : '—'}</td>
        <td>${c.used || 0}${c.usageLimit ? ' / ' + c.usageLimit : ''}</td>
        <td><span class="badge ${c.active ? 'b-shipped' : 'b-cancel'}">${c.active ? 'Actif' : 'Inactif'}</span></td>
        <td><button class="btn" data-edit-c="${esc(c.code)}" type="button">Modifier</button></td>
      </tr>`).join('');
    $$('[data-edit-c]', tbody).forEach(b => b.addEventListener('click', () => openCouponModal(b.dataset.editC)));
  }
  function openCouponModal(code) {
    const form = $('#couponForm');
    form.reset();
    $('#couponDeleteBtn').classList.toggle('hidden', !code);
    if (code) {
      const c = S.getCoupons().find(x => x.code === code);
      if (!c) return;
      $('#couponModalTitle').textContent = 'Modifier : ' + c.code;
      form.originalCode.value = c.code;
      form.code.value = c.code;
      form.type.value = c.type || 'percent';
      form.value.value = c.value || 0;
      form.minTotal.value = c.minTotal || 0;
      form.expiresAt.value = c.expiresAt || '';
      form.usageLimit.value = c.usageLimit || 0;
      form.active.checked = c.active !== false;
    } else {
      $('#couponModalTitle').textContent = 'Nouveau coupon';
      form.originalCode.value = '';
      form.type.value = 'percent';
      form.active.checked = true;
    }
    $('#couponOverlay').classList.add('open');
  }
  function saveCoupon() {
    const f = $('#couponForm');
    const original = f.originalCode.value;
    const data = {
      code: f.code.value.trim().toUpperCase(),
      type: f.type.value,
      value: Number(f.value.value) || 0,
      minTotal: Number(f.minTotal.value) || 0,
      expiresAt: f.expiresAt.value || null,
      usageLimit: Number(f.usageLimit.value) || 0,
      active: f.active.checked
    };
    if (!data.code) { toast('Code obligatoire', 'err'); return; }
    if (original && original !== data.code) S.deleteCoupon(original);
    S.saveCoupon(data);
    toast('Coupon enregistré', 'ok');
    closeOverlays();
    renderCoupons();
  }

  /* ---------- zones ---------- */
  function renderZones() {
    const list = S.getZones();
    const wrap = $('#zonesList');
    if (!wrap) return;
    if (!list.length) { wrap.innerHTML = '<div class="item small">Aucune zone.</div>'; return; }
    wrap.innerHTML = list.map(z => `
      <div class="item" data-id="${esc(z.id)}" style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <div><strong>${esc(z.name)}</strong><div class="small">${S.fmtMoney(z.fee)}</div></div>
        <div class="actions">
          <button class="btn" data-edit-z type="button">Modifier</button>
          <button class="btn danger" data-del-z type="button">Supprimer</button>
        </div>
      </div>`).join('');
    $$('[data-edit-z]', wrap).forEach(b => b.addEventListener('click', () => {
      const z = S.getZones().find(x => x.id === b.closest('[data-id]').dataset.id);
      if (!z) return;
      const f = $('#zoneForm');
      f.id.value = z.id; f.name.value = z.name; f.fee.value = z.fee;
      $('#zones').scrollIntoView({ behavior: 'smooth' });
    }));
    $$('[data-del-z]', wrap).forEach(b => b.addEventListener('click', () => {
      const id = b.closest('[data-id]').dataset.id;
      if (confirm('Supprimer cette zone ?')) { S.deleteZone(id); renderZones(); toast('Zone supprimée', 'ok'); }
    }));
  }
  function saveZoneForm(e) {
    e.preventDefault();
    const f = e.target;
    const z = { id: f.id.value || undefined, name: f.name.value.trim(), fee: Number(f.fee.value) || 0 };
    if (!z.name) { toast('Nom obligatoire', 'err'); return; }
    S.saveZone(z);
    f.reset();
    toast('Zone enregistrée', 'ok');
    renderZones();
  }

  /* ---------- users ---------- */
  function renderUsers() {
    const list = S.getUsers();
    const wrap = $('#usersList');
    if (!wrap) return;
    const me = S.currentUser();
    if (!list.length) { wrap.innerHTML = '<div class="item small">Aucun utilisateur.</div>'; return; }
    wrap.innerHTML = list.map(u => `
      <div class="item" data-id="${esc(u.id)}" style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <div><strong>${esc(u.username)}</strong><div class="small">${esc(u.role)}${me && me.id === u.id ? ' · vous' : ''}</div></div>
        <div class="actions">
          <button class="btn" data-edit-u type="button">Modifier</button>
          <button class="btn danger" data-del-u type="button" ${u.role === 'owner' ? 'disabled' : ''}>Supprimer</button>
        </div>
      </div>`).join('');
    $$('[data-edit-u]', wrap).forEach(b => b.addEventListener('click', () => {
      const u = S.getUser(b.closest('[data-id]').dataset.id);
      if (!u) return;
      const f = $('#userForm');
      f.id.value = u.id; f.username.value = u.username; f.role.value = u.role; f.password.value = '';
      $('#users').scrollIntoView({ behavior: 'smooth' });
    }));
    $$('[data-del-u]', wrap).forEach(b => b.addEventListener('click', () => {
      const id = b.closest('[data-id]').dataset.id;
      if (confirm('Supprimer cet utilisateur ?')) {
        const ok = S.deleteUser(id);
        if (!ok) toast('Impossible : dernier owner', 'err');
        else { renderUsers(); toast('Utilisateur supprimé', 'ok'); }
      }
    }));
  }
  function saveUserForm(e) {
    e.preventDefault();
    const f = e.target;
    if (!requireRole(['owner'])) { toast('Réservé au owner', 'err'); return; }
    const id = f.id.value || undefined;
    const data = { id, username: f.username.value.trim(), role: f.role.value };
    if (!data.username) { toast('Nom obligatoire', 'err'); return; }
    if (!id) {
      if (!f.password.value) { toast('Mot de passe obligatoire', 'err'); return; }
      data.passwordHash = (function (p) { let h = 0; for (let i = 0; i < p.length; i++) { h = ((h << 5) - h) + p.charCodeAt(i); h |= 0; } return String(h); })(f.password.value);
    }
    const saved = S.saveUser(data);
    if (f.password.value && id) S.setUserPassword(saved.id, f.password.value);
    f.reset();
    toast('Utilisateur enregistré', 'ok');
    renderUsers();
  }

  /* ---------- activity ---------- */
  function renderActivity() {
    const list = S.getActivity();
    const wrap = $('#activityList');
    if (!wrap) return;
    if (!list.length) { wrap.innerHTML = '<div class="item small">Aucune activité.</div>'; return; }
    wrap.innerHTML = list.slice(0, 100).map(a => `<div class="item"><strong>${esc(a.type)}</strong> — ${esc(a.message)}<div class="small">${esc(S.formatDate(a.at))}</div></div>`).join('');
  }

  /* ---------- OTP ---------- */
  function renderOtps() {
    const list = S.getPendingOtps();
    const wrap = $('#otpList');
    if (!wrap) return;
    if (!list.length) { wrap.innerHTML = '<div class="item small">Aucun code en attente.</div>'; return; }
    wrap.innerHTML = list.slice(0, 8).map(o => `
      <div class="item">
        <strong>${esc(o.target)}</strong>
        <div style="font-family:monospace;font-size:1.1rem;letter-spacing:.15em">${esc(o.code)}</div>
        <div class="small">Expire à ${esc(new Date(o.expiresAt).toLocaleTimeString('fr-FR'))}</div>
      </div>`).join('');
  }

  /* ---------- push ---------- */
  async function handlePushToggle() {
    if (!S.canPush()) { toast('Notifications non supportées', 'err'); return; }
    const res = await S.requestPush();
    toast(res === 'granted' ? 'Notifications activées' : 'Notifications refusées', res === 'granted' ? 'ok' : 'err');
  }
  function exportCSV() {
    const orders = S.getOrders();
    if (!orders.length) { toast('Aucune commande à exporter', 'err'); return; }
    const headers = ['id', 'date', 'status', 'tracking', 'client', 'phone', 'email', 'address', 'city', 'items', 'subtotal', 'delivery', 'total', 'paymentMethod', 'paymentStatus'];
    const esc2 = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const rows = orders.map(o => [
      o.id,
      o.createdAt,
      o.status,
      o.trackingNumber,
      (o.customer.firstName || '') + ' ' + (o.customer.lastName || ''),
      o.customer.phone || '',
      o.customer.email || '',
      o.customer.address || '',
      o.customer.city || '',
      (o.items || []).map(i => i.qty + 'x ' + i.name).join(' | '),
      o.subtotal, o.delivery, o.total,
      o.paymentMethod, o.paymentStatus
    ].map(esc2).join(','));
    const csv = [headers.join(',')].concat(rows).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kairos-orders-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast('Export lancé', 'ok');
  }

  /* ---------- overlays ---------- */
  function closeOverlays() { $$('.overlay').forEach(o => o.classList.remove('open')); }

  /* ---------- nav highlight ---------- */
  function initNav() {
    const links = $$('#mainNav a');
    function onScroll() {
      let current = '';
      links.forEach(a => {
        const el = document.querySelector(a.getAttribute('href'));
        if (el && el.getBoundingClientRect().top < 120) current = a.getAttribute('href');
      });
      links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === current));
    }
    window.addEventListener('scroll', onScroll);
    onScroll();
  }

  /* ---------- global binds ---------- */
  function bind() {
    $$('.overlay [data-close]').forEach(el => el.addEventListener('click', closeOverlays));
    $$('.overlay').forEach(o => o.addEventListener('click', (e) => { if (e.target === o) closeOverlays(); }));

    $('#orderSearch').addEventListener('input', (e) => { state.orderSearch = e.target.value; renderOrders(); });
    $$('.filters .chip[data-filter]').forEach(ch => ch.addEventListener('click', () => {
      $$('.filters .chip[data-filter]').forEach(x => x.classList.remove('active'));
      ch.classList.add('active');
      state.orderFilter = ch.dataset.filter;
      renderOrders();
    }));

    $('#newProductBtn').addEventListener('click', () => openProductModal());
    $('#quickAddProduct').addEventListener('click', () => openProductModal());
    $('#quickSeed').addEventListener('click', () => {
      if (confirm('Réinitialiser la démo ? Toutes les commandes, produits, réglages seront remis à zéro.')) {
        S.resetAll(); renderAll(); toast('Démo réinitialisée', 'ok');
      }
    });
    $('#prodSaveBtn').addEventListener('click', saveProduct);
    $('#prodDeleteBtn').addEventListener('click', () => {
      const id = $('#productForm').id.value;
      if (id && confirm('Supprimer ce produit ?')) {
        S.deleteProduct(id); closeOverlays(); toast('Produit supprimé', 'ok'); renderAll();
      }
    });

    $('#settingsForm').addEventListener('submit', saveSettingsForm);
    $('#pwdForm').addEventListener('submit', handlePasswordChange);
    $('#resetAllBtn').addEventListener('click', () => {
      if (confirm('Effacer TOUTES les données (produits, commandes, réglages) ?')) {
        S.resetAll(); renderAll(); toast('Données réinitialisées', 'ok');
      }
    });

    $('#exportBtn').addEventListener('click', exportCSV);

    // image upload
    const imgFile = $('#imgFile');
    if (imgFile) imgFile.addEventListener('change', (e) => handleImageFile(e.target.files[0]));
    const imgClear = $('#imgClear');
    if (imgClear) imgClear.addEventListener('click', () => { $('#productForm').image.value = ''; updateImagePreview(''); $('#imgFile').value = ''; });

    // variants
    const addV = $('#addVariant');
    if (addV) addV.addEventListener('click', () => {
      state.productVariants.push({ id: S.uid('v'), name: '', attributes: {}, priceDelta: 0, stock: 0 });
      renderVariantList();
    });

    // coupons
    const newCBtn = $('#newCouponBtn');
    if (newCBtn) newCBtn.addEventListener('click', () => openCouponModal());
    const saveCBtn = $('#couponSaveBtn');
    if (saveCBtn) saveCBtn.addEventListener('click', saveCoupon);
    const delCBtn = $('#couponDeleteBtn');
    if (delCBtn) delCBtn.addEventListener('click', () => {
      const code = $('#couponForm').originalCode.value;
      if (code && confirm('Supprimer ce coupon ?')) { S.deleteCoupon(code); closeOverlays(); renderCoupons(); toast('Coupon supprimé', 'ok'); }
    });

    // zones
    const zForm = $('#zoneForm');
    if (zForm) zForm.addEventListener('submit', saveZoneForm);
    const zReset = $('#zoneReset');
    if (zReset) zReset.addEventListener('click', () => $('#zoneForm').reset());

    // users
    const uForm = $('#userForm');
    if (uForm) uForm.addEventListener('submit', saveUserForm);
    const uReset = $('#userReset');
    if (uReset) uReset.addEventListener('click', () => $('#userForm').reset());

    // activity
    const clrA = $('#clearActivityBtn');
    if (clrA) clrA.addEventListener('click', () => { if (confirm('Vider le journal ?')) { S.clearActivity(); renderActivity(); } });

    // push
    const pushB = $('#pushBtn');
    if (pushB) pushB.addEventListener('click', handlePushToggle);

    window.addEventListener('kairos:orders-change', () => { renderOrders(); renderStats(); renderNotifs(); renderKPI(); renderChart(); renderOps(); renderActivity(); });
    window.addEventListener('kairos:products-change', () => { renderProducts(); renderStats(); renderNotifs(); renderOps(); });
    window.addEventListener('kairos:settings-change', loadSettings);
    window.addEventListener('kairos:coupons-change', renderCoupons);
    window.addEventListener('kairos:zones-change', renderZones);
    window.addEventListener('kairos:users-change', renderUsers);
    window.addEventListener('kairos:activity-change', renderActivity);
    window.addEventListener('kairos:otp-change', renderOtps);

    // Periodic OTP refresh (expiry)
    setInterval(renderOtps, 30000);

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeOverlays(); });
  }

  function renderAll() {
    updateSessionLabel();
    renderStats();
    renderNotifs();
    renderKPI();
    renderChart();
    renderCoupons();
    renderZones();
    renderUsers();
    renderActivity();
    renderOtps();
    renderOps();
    renderOrders();
    renderProducts();
    loadSettings();
  }

  document.addEventListener('DOMContentLoaded', () => {
    bind();
    initAuth();
    initNav();
  });
})();
