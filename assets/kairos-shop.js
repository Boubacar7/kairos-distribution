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
    currentVariantId: '',
    checkoutStep: 1,
    checkoutData: { customer: {}, paymentMethod: 'cash', notes: '', couponCode: '', zoneId: '' },
    lastOrder: null,
    myOrders: { target: '', verified: false },
    reviewPhoto: ''
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
      const fav = S.isInWishlist(p.id);
      const cmp = S.isInCompare(p.id);
      return `
        <article class="p" data-id="${p.id}" style="position:relative">
          <button class="wishlist-btn" data-action="fav" title="Favori" style="position:absolute;top:10px;right:10px;z-index:2;background:var(--surface)">${fav ? '♥' : '♡'}</button>
          <div class="ph" ${img}></div>
          <div class="pb">
            <span class="pill">${escapeHtml(p.category)}</span>
            <h3 style="margin:0;font-size:1.05rem">${escapeHtml(p.name)}</h3>
            <p class="small" style="margin:0">${escapeHtml(p.description || '')}</p>
            <div class="price-row">
              <span class="price">${S.fmtMoney(effective)}</span>
              ${hasPromo ? `<span class="price-old">${S.fmtMoney(p.price)}</span><span class="promo-badge">-${p.promo}%</span>` : ''}
            </div>
            <label class="small" style="display:flex;gap:6px;align-items:center;margin-top:6px;cursor:pointer">
              <input type="checkbox" data-action="cmp" ${cmp ? 'checked' : ''}> Comparer
            </label>
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
      card.querySelector('[data-action="fav"]').addEventListener('click', (e) => {
        e.stopPropagation();
        const added = S.toggleWishlist(id);
        toast(added ? 'Ajouté aux favoris' : 'Retiré des favoris', 'ok');
      });
      card.querySelector('[data-action="cmp"]').addEventListener('change', (e) => {
        e.stopPropagation();
        const res = S.toggleCompare(id);
        if (!res.ok && res.reason === 'max') {
          e.target.checked = false;
          toast('Max 4 produits à comparer', 'err');
        }
      });
    });
  }

  /* --------------- product modal --------------- */
  function openProduct(id) {
    const p = S.getProduct(id);
    if (!p) return;
    state.currentProduct = id;
    const variants = Array.isArray(p.variants) ? p.variants : [];
    state.currentVariantId = variants.length ? variants[0].id : '';
    $('#pmTitle').textContent = p.name;
    const effective = S.effectivePrice(p);
    const hasPromo = Number(p.promo) > 0;
    const img = p.image ? `<div class="ph" style="height:220px;border-radius:16px;background-image:url('${escapeAttr(p.image)}')"></div>` : `<div class="ph" style="height:220px;border-radius:16px"></div>`;
    const variantHtml = variants.length ? `
      <div style="margin-top:14px">
        <label class="small">Variante</label>
        <div class="variant-selector" id="pmVariants">
          ${variants.map(v => `<button type="button" class="variant-opt ${v.id === state.currentVariantId ? 'active' : ''}" data-vid="${escapeAttr(v.id)}" ${v.stock <= 0 ? 'disabled' : ''}>${escapeHtml(v.name)}${v.priceDelta ? ' (+' + S.fmtMoney(v.priceDelta) + ')' : ''}${v.stock <= 0 ? ' — rupture' : ''}</button>`).join('')}
        </div>
      </div>` : '';
    const stockDisplay = variants.length
      ? (variants.find(v => v.id === state.currentVariantId)?.stock || 0)
      : (Number(p.stock) || 0);
    $('#pmBody').innerHTML = `
      ${img}
      <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <span class="pill">${escapeHtml(p.category)}</span>
        <span class="small" id="pmStock">Stock: ${stockDisplay}</span>
      </div>
      <p style="margin-top:10px">${escapeHtml(p.description || 'Aucune description.')}</p>
      <div class="price-row" style="margin-top:10px" id="pmPriceRow">
        <span class="price" style="font-size:1.4rem">${S.fmtMoney(effective)}</span>
        ${hasPromo ? `<span class="price-old">${S.fmtMoney(p.price)}</span><span class="promo-badge">-${p.promo}%</span>` : ''}
      </div>
      ${variantHtml}
      <div style="margin-top:14px;display:flex;align-items:center;gap:12px">
        <label class="small">Quantité</label>
        <div class="qty">
          <button type="button" id="pmMinus">−</button>
          <span id="pmQty">1</span>
          <button type="button" id="pmPlus">+</button>
        </div>
      </div>`;
    let qty = 1;
    const getStock = () => variants.length ? (variants.find(v => v.id === state.currentVariantId)?.stock || 0) : (Number(p.stock) || 0);
    const refreshPrice = () => {
      const v = variants.find(x => x.id === state.currentVariantId);
      const price = effective + (v ? Number(v.priceDelta) || 0 : 0);
      $('#pmPriceRow').innerHTML = `
        <span class="price" style="font-size:1.4rem">${S.fmtMoney(price)}</span>
        ${hasPromo ? `<span class="price-old">${S.fmtMoney(p.price + (v ? Number(v.priceDelta) || 0 : 0))}</span><span class="promo-badge">-${p.promo}%</span>` : ''}`;
      $('#pmStock').textContent = 'Stock: ' + getStock();
    };
    if (variants.length) {
      $$('#pmVariants .variant-opt').forEach(b => b.addEventListener('click', () => {
        if (b.disabled) return;
        state.currentVariantId = b.dataset.vid;
        $$('#pmVariants .variant-opt').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        qty = 1; $('#pmQty').textContent = qty;
        refreshPrice();
      }));
    }
    $('#pmMinus').onclick = () => { qty = Math.max(1, qty - 1); $('#pmQty').textContent = qty; };
    $('#pmPlus').onclick = () => { qty = Math.min(getStock() || 99, qty + 1); $('#pmQty').textContent = qty; };
    $('#pmAdd').onclick = () => {
      if (getStock() <= 0) { toast('Rupture de stock', 'err'); return; }
      S.addToCart(id, qty, state.currentVariantId);
      toast('Ajouté au panier', 'ok');
      closeModals();
    };
    const recos = S.recommendProducts(id, 4);
    if (recos.length) {
      const recoWrap = document.createElement('div');
      recoWrap.style.marginTop = '20px';
      recoWrap.innerHTML = `
        <div class="small" style="margin-bottom:8px;font-weight:600">Produits similaires</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px">
          ${recos.map(r => `
            <div class="reco" data-id="${r.id}" style="cursor:pointer;border:1px solid var(--border);border-radius:12px;padding:8px;background:var(--surface)">
              <div class="ph" style="height:80px;border-radius:8px;${r.image ? `background-image:url('${escapeAttr(r.image)}')` : ''}"></div>
              <div style="font-size:12px;margin-top:6px;font-weight:600">${escapeHtml(r.name)}</div>
              <div style="font-size:12px;color:var(--primary)">${S.fmtMoney(S.effectivePrice(r))}</div>
            </div>`).join('')}
        </div>`;
      $('#pmBody').appendChild(recoWrap);
      $$('.reco', recoWrap).forEach(el => el.addEventListener('click', () => openProduct(el.dataset.id)));
    }
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
        <div class="line" data-id="${it.productId}" data-vid="${escapeAttr(it.variantId || '')}">
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
      const vid = line.dataset.vid || '';
      const item = sum.items.find(i => i.productId === id && (i.variantId || '') === vid);
      line.querySelector('[data-q="-"]').onclick = () => S.updateCartQty(id, item.qty - 1, vid);
      line.querySelector('[data-q="+"]').onclick = () => S.updateCartQty(id, item.qty + 1, vid);
      line.querySelector('[data-rm]').onclick = () => S.removeFromCart(id, vid);
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
      const zones = S.getZones();
      const currentZone = state.checkoutData.zoneId;
      const sum2 = S.cartSummary({ zoneId: currentZone });
      body.innerHTML = `
        <div class="form">
          <div class="full"><label>Adresse</label><input id="coAddr" placeholder="Rue, quartier, repère" value="${escapeAttr(state.checkoutData.customer.address || '')}" required></div>
          <div><label>Ville</label><input id="coCity" value="${escapeAttr(state.checkoutData.customer.city || '')}" required></div>
          <div><label>Pays</label><input id="coCountry" value="${escapeAttr(state.checkoutData.customer.country || 'Sénégal')}"></div>
          <div class="full">
            <label>Zone de livraison</label>
            <select id="coZone">
              <option value="">Tarif standard (${S.fmtMoney(settings.deliveryFee)})</option>
              ${zones.map(z => `<option value="${escapeAttr(z.id)}" ${currentZone === z.id ? 'selected' : ''}>${escapeHtml(z.name)} — ${S.fmtMoney(z.fee)}</option>`).join('')}
            </select>
          </div>
          <div class="full"><label>Notes de livraison (optionnel)</label><textarea id="coNotes">${escapeHtml(state.checkoutData.notes || '')}</textarea></div>
        </div>
        <div class="box" style="margin-top:14px">
          <div class="sum-line"><span>Sous-total</span><span>${S.fmtMoney(sum2.subtotal)}</span></div>
          <div class="sum-line"><span>Livraison${sum2.zone ? ' (' + escapeHtml(sum2.zone.name) + ')' : ''}</span><span>${sum2.delivery === 0 ? 'Offerte' : S.fmtMoney(sum2.delivery)}</span></div>
          <div class="sum-line sum-total"><span>Total</span><span>${S.fmtMoney(sum2.total)}</span></div>
          ${sum2.delivery > 0 ? `<p class="small" style="margin:8px 0 0">Livraison offerte dès ${S.fmtMoney(settings.freeDeliveryFrom)}.</p>` : ''}
        </div>`;
      $('#coZone').addEventListener('change', (e) => { state.checkoutData.zoneId = e.target.value; renderCheckout(); });
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

      const sum3 = S.cartSummary({ zoneId: state.checkoutData.zoneId, couponCode: state.checkoutData.couponCode });

      body.innerHTML = `
        <div class="pay-list">
          ${options.map(o => `
            <label class="pay ${state.checkoutData.paymentMethod === o.id ? 'active' : ''}">
              <input type="radio" name="pay" value="${o.id}" ${state.checkoutData.paymentMethod === o.id ? 'checked' : ''}>
              <div><strong>${o.label}</strong><div class="small">${o.desc}</div></div>
            </label>`).join('')}
        </div>
        <div class="box" style="margin-top:14px">
          <label class="small">Code promo</label>
          <div class="coupon-row">
            <input id="coCoupon" placeholder="Ex: BIENVENUE10" value="${escapeAttr(state.checkoutData.couponCode || '')}">
            <button class="btn btn2" type="button" id="coCouponApply">Appliquer</button>
          </div>
          ${sum3.coupon ? `<p class="small" style="color:var(--success);margin:8px 0 0">Coupon ${escapeHtml(sum3.coupon.code)} appliqué.</p>` : ''}
          ${sum3.couponError ? `<p class="small" style="color:var(--danger);margin:8px 0 0">${escapeHtml(sum3.couponError)}</p>` : ''}
        </div>
        <div class="box" style="margin-top:14px">
          <div class="sum-line"><span>Client</span><span>${escapeHtml(state.checkoutData.customer.firstName + ' ' + state.checkoutData.customer.lastName)}</span></div>
          <div class="sum-line"><span>Téléphone</span><span>${escapeHtml(state.checkoutData.customer.phone)}</span></div>
          <div class="sum-line"><span>Livraison</span><span>${escapeHtml(state.checkoutData.customer.address + ', ' + state.checkoutData.customer.city)}</span></div>
          <div class="sum-line"><span>Sous-total</span><span>${S.fmtMoney(sum3.subtotal)}</span></div>
          ${sum3.discount > 0 ? `<div class="sum-line" style="color:var(--success)"><span>Remise</span><span>-${S.fmtMoney(sum3.discount)}</span></div>` : ''}
          <div class="sum-line"><span>Livraison${sum3.zone ? ' (' + escapeHtml(sum3.zone.name) + ')' : ''}</span><span>${sum3.delivery === 0 ? 'Offerte' : S.fmtMoney(sum3.delivery)}</span></div>
          <div class="sum-line sum-total"><span>Total à payer</span><span>${S.fmtMoney(sum3.total)}</span></div>
        </div>`;
      $$('input[name="pay"]').forEach(r => r.addEventListener('change', () => {
        state.checkoutData.paymentMethod = r.value;
        $$('.pay').forEach(el => el.classList.remove('active'));
        r.closest('.pay').classList.add('active');
      }));
      $('#coCouponApply').onclick = () => {
        state.checkoutData.couponCode = $('#coCoupon').value.trim().toUpperCase();
        renderCheckout();
      };
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
        <button class="btn btn2" id="coInvoice" type="button">Facture PDF</button>
        <button class="btn" id="coTrack" type="button">Voir le suivi</button>`;
      $('#coCopy').onclick = () => {
        const txt = `Commande ${o.id} · Suivi ${o.trackingNumber}`;
        if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => toast('Copié', 'ok'));
        else { window.prompt('Copier:', txt); }
      };
      $('#coInvoice').onclick = () => downloadInvoice(o);
      $('#coTrack').onclick = () => {
        closeModals();
        $('#trackInput').value = o.id;
        runTrack(o.id);
        document.querySelector('#suivi').scrollIntoView({ behavior: 'smooth' });
      };
    }
  }

  /* --------------- PDF invoice --------------- */
  function downloadInvoice(order) {
    if (!window.jspdf || !window.jspdf.jsPDF) { toast('PDF non disponible', 'err'); return; }
    const settings = S.getSettings();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 50;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(143, 63, 93);
    doc.text(settings.storeName || 'Kairos Distributions', 40, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(120);
    y += 18;
    doc.text('Facture / Receipt', 40, y);

    doc.setFontSize(10);
    doc.setTextColor(30);
    doc.text('N° ' + order.id, pageWidth - 40, 50, { align: 'right' });
    doc.setTextColor(120);
    doc.text('Date : ' + S.formatDate(order.createdAt), pageWidth - 40, 66, { align: 'right' });
    doc.text('Suivi : ' + order.trackingNumber, pageWidth - 40, 82, { align: 'right' });

    y = 120;
    doc.setDrawColor(234, 217, 213);
    doc.line(40, y, pageWidth - 40, y);
    y += 18;

    doc.setTextColor(30);
    doc.setFont('helvetica', 'bold');
    doc.text('Client', 40, y);
    doc.setFont('helvetica', 'normal');
    y += 14;
    doc.text((order.customer.firstName || '') + ' ' + (order.customer.lastName || ''), 40, y); y += 12;
    doc.text(order.customer.phone || '', 40, y); y += 12;
    if (order.customer.email) { doc.text(order.customer.email, 40, y); y += 12; }
    doc.text(order.customer.address || '', 40, y); y += 12;
    doc.text((order.customer.city || '') + ', ' + (order.customer.country || ''), 40, y);

    let yRight = 134;
    doc.setFont('helvetica', 'bold');
    doc.text('Paiement', pageWidth - 200, yRight); yRight += 14;
    doc.setFont('helvetica', 'normal');
    doc.text(paymentLabel(order.paymentMethod), pageWidth - 200, yRight); yRight += 12;
    doc.text('Statut : ' + (order.paymentStatus || '-'), pageWidth - 200, yRight); yRight += 12;
    doc.text('Commande : ' + order.status, pageWidth - 200, yRight);

    y = Math.max(y, yRight) + 30;
    doc.setDrawColor(234, 217, 213);
    doc.line(40, y, pageWidth - 40, y);
    y += 20;

    doc.setFont('helvetica', 'bold');
    doc.text('Article', 40, y);
    doc.text('Qté', 350, y, { align: 'right' });
    doc.text('PU', 430, y, { align: 'right' });
    doc.text('Total', pageWidth - 40, y, { align: 'right' });
    y += 8;
    doc.line(40, y, pageWidth - 40, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    (order.items || []).forEach(it => {
      if (y > 720) { doc.addPage(); y = 50; }
      const name = String(it.name || '');
      const lines = doc.splitTextToSize(name, 280);
      doc.text(lines, 40, y);
      doc.text(String(it.qty), 350, y, { align: 'right' });
      doc.text(S.fmtMoney(it.unitPrice), 430, y, { align: 'right' });
      doc.text(S.fmtMoney(it.lineTotal), pageWidth - 40, y, { align: 'right' });
      y += Math.max(14, lines.length * 12);
    });

    y += 10;
    doc.line(40, y, pageWidth - 40, y);
    y += 18;
    const rightX = pageWidth - 40;
    const labelX = pageWidth - 170;
    doc.text('Sous-total', labelX, y); doc.text(S.fmtMoney(order.subtotal), rightX, y, { align: 'right' }); y += 14;
    if (order.discount) { doc.setTextColor(67, 122, 34); doc.text('Remise', labelX, y); doc.text('-' + S.fmtMoney(order.discount), rightX, y, { align: 'right' }); doc.setTextColor(30); y += 14; }
    doc.text('Livraison' + (order.zone ? ' (' + order.zone.name + ')' : ''), labelX, y); doc.text(order.delivery ? S.fmtMoney(order.delivery) : 'Offerte', rightX, y, { align: 'right' }); y += 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total', labelX, y); doc.text(S.fmtMoney(order.total), rightX, y, { align: 'right' });

    y += 40;
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.setFont('helvetica', 'normal');
    doc.text('Merci pour votre commande. Suivez-la sur notre site avec votre numéro de suivi.', 40, y);

    doc.save((order.id || 'facture') + '.pdf');
    toast('Facture téléchargée', 'ok');
  }

  function confirmOrder() {
    const sum = S.cartSummary({ zoneId: state.checkoutData.zoneId, couponCode: state.checkoutData.couponCode });
    if (!sum.items.length) { toast('Panier vide', 'err'); return; }
    const payload = {
      customer: state.checkoutData.customer,
      items: sum.items.map(it => ({ productId: it.productId, variantId: it.variantId || '', name: it.name, qty: it.qty, unitPrice: it.unitPrice, lineTotal: it.lineTotal })),
      subtotal: sum.subtotal,
      delivery: sum.delivery,
      discount: sum.discount,
      coupon: sum.coupon,
      zone: sum.zone,
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
        <div class="actions" style="margin-top:12px">
          <button class="btn btn2" type="button" id="trackPdf" data-oid="${escapeAttr(order.id)}">Télécharger la facture PDF</button>
        </div>
        <div style="margin-top:14px"><strong>Historique</strong></div>
        <div class="timeline">${history}</div>
      </div>`;
    const pdfBtn = $('#trackPdf');
    if (pdfBtn) pdfBtn.addEventListener('click', () => { const o = S.getOrder(pdfBtn.dataset.oid); if (o) downloadInvoice(o); });
  }

  /* --------------- Mes commandes (OTP) --------------- */
  function requestMyOrdersOtp(e) {
    e.preventDefault();
    const target = $('#myOrdersTarget').value.trim();
    if (!target) { toast('Téléphone ou email requis', 'err'); return; }
    const orders = S.findOrdersForBuyer(target);
    if (!orders.length) {
      toast('Aucune commande trouvée pour ce contact', 'err');
      return;
    }
    const code = S.generateOtp(target);
    state.myOrders = { target, verified: false };
    $('#otpBox').style.display = 'block';
    $('#otpInput').value = '';
    $('#otpInput').focus();
    $('#otpHint').innerHTML = 'Un code a été envoyé pour <strong>' + escapeHtml(target) + '</strong>. En démo, voir le dashboard admin ou : <code style="font-family:monospace">' + escapeHtml(code) + '</code>';
    renderMyOrders([]);
  }
  function verifyMyOrdersOtp(e) {
    e.preventDefault();
    const code = $('#otpInput').value.trim();
    if (!S.verifyOtp(state.myOrders.target, code)) { toast('Code invalide ou expiré', 'err'); return; }
    state.myOrders.verified = true;
    $('#otpBox').style.display = 'none';
    const orders = S.findOrdersForBuyer(state.myOrders.target);
    toast(orders.length + ' commande(s) trouvée(s)', 'ok');
    renderMyOrders(orders);
  }
  function cancelMyOrdersOtp() {
    state.myOrders = { target: '', verified: false };
    $('#otpBox').style.display = 'none';
    $('#myOrdersTarget').value = '';
    renderMyOrders([]);
  }
  function renderMyOrders(orders) {
    const wrap = $('#myOrdersList');
    if (!wrap) return;
    if (!state.myOrders.verified) { wrap.innerHTML = ''; return; }
    if (!orders || !orders.length) { wrap.innerHTML = '<div class="small">Aucune commande.</div>'; return; }
    wrap.innerHTML = orders.map(o => `
      <div class="tl" data-id="${escapeAttr(o.id)}">
        <strong>${escapeHtml(o.id)}</strong> · ${escapeHtml(o.status)}
        <time>${escapeHtml(S.formatDate(o.createdAt))} · ${S.fmtMoney(o.total)}</time>
        <div class="actions" style="margin-top:6px">
          <button class="btn btn2" type="button" data-track style="padding:6px 12px;font-size:12px">Suivre</button>
          <button class="btn btn2" type="button" data-pdf style="padding:6px 12px;font-size:12px">Facture PDF</button>
        </div>
      </div>`).join('');
    $$('.tl', wrap).forEach(el => {
      const id = el.dataset.id;
      el.querySelector('[data-track]').addEventListener('click', () => {
        $('#trackInput').value = id;
        runTrack(id);
        document.querySelector('#suivi').scrollIntoView({ behavior: 'smooth' });
      });
      el.querySelector('[data-pdf]').addEventListener('click', () => { const o = S.getOrder(id); if (o) downloadInvoice(o); });
    });
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
    const myOrdersForm = $('#myOrdersForm');
    if (myOrdersForm) myOrdersForm.addEventListener('submit', requestMyOrdersOtp);
    const otpForm = $('#otpForm');
    if (otpForm) otpForm.addEventListener('submit', verifyMyOrdersOtp);
    const otpCancel = $('#otpCancel');
    if (otpCancel) otpCancel.addEventListener('click', cancelMyOrdersOtp);
    const themeBtn = $('#themeToggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
    const wishBtn = $('#wishlistBtn');
    if (wishBtn) wishBtn.addEventListener('click', () => { document.querySelector('#favoris').scrollIntoView({ behavior: 'smooth' }); });
    const loyaltyForm = $('#loyaltyForm');
    if (loyaltyForm) loyaltyForm.addEventListener('submit', handleLoyaltyLookup);
    const compareClear = $('#compareClear');
    if (compareClear) compareClear.addEventListener('click', () => { S.clearCompare(); closeModals(); toast('Comparaison vidée', 'ok'); });
    const reviewForm = $('#reviewForm');
    if (reviewForm) reviewForm.addEventListener('submit', submitReview);
    const rvPhoto = $('#rvPhoto');
    if (rvPhoto) rvPhoto.addEventListener('change', handleReviewPhoto);
    window.addEventListener('kairos:reviews-change', renderReviews);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModals(); });
    window.addEventListener('kairos:cart-change', renderCart);
    window.addEventListener('kairos:products-change', () => { renderCategories(); renderProducts(); renderWishlist(); });
    window.addEventListener('kairos:orders-change', renderRecent);
    window.addEventListener('kairos:settings-change', () => { applySettings(); renderCart(); });
    window.addEventListener('kairos:wishlist-change', () => { renderWishlist(); renderProducts(); });
    window.addEventListener('kairos:compare-change', () => { renderCompareBar(); renderProducts(); });
  }

  function renderWishlist() {
    const ids = S.getWishlist();
    const grid = $('#wishlistGrid');
    const countEl = $('#wishlistCount');
    if (countEl) {
      countEl.textContent = ids.length;
      countEl.style.display = ids.length ? 'inline-block' : 'none';
    }
    if (!grid) return;
    if (!ids.length) { grid.innerHTML = '<div class="empty" style="grid-column:1/-1">Aucun favori pour l\'instant. Cliquez sur ♡ sur un produit.</div>'; return; }
    const products = ids.map(id => S.getProduct(id)).filter(Boolean);
    grid.innerHTML = products.map(p => `
      <article class="p" data-id="${p.id}" style="position:relative">
        <button class="wishlist-btn" data-action="unfav" title="Retirer" style="position:absolute;top:10px;right:10px;z-index:2;background:var(--surface)">♥</button>
        <div class="ph" ${p.image ? `style="background-image:url('${escapeAttr(p.image)}')"` : ''}></div>
        <div class="pb">
          <span class="pill">${escapeHtml(p.category)}</span>
          <h3 style="margin:0;font-size:1.05rem">${escapeHtml(p.name)}</h3>
          <div class="price-row"><span class="price">${S.fmtMoney(S.effectivePrice(p))}</span></div>
          <div style="display:flex;gap:8px;margin-top:10px">
            <button class="btn btn2" data-action="view" style="flex:1">Détail</button>
            <button class="btn" data-action="add" style="flex:1">Ajouter</button>
          </div>
        </div>
      </article>`).join('');
    $$('.p', grid).forEach(card => {
      const id = card.dataset.id;
      card.querySelector('[data-action="view"]').addEventListener('click', () => openProduct(id));
      card.querySelector('[data-action="add"]').addEventListener('click', () => { S.addToCart(id, 1); toast('Ajouté au panier', 'ok'); });
      card.querySelector('[data-action="unfav"]').addEventListener('click', () => { S.toggleWishlist(id); toast('Retiré des favoris', 'ok'); });
    });
  }

  function renderCompareBar() {
    const ids = S.getCompare();
    const bar = $('#compareBar');
    if (!bar) return;
    if (!ids.length) { bar.classList.remove('on'); bar.innerHTML = ''; return; }
    bar.classList.add('on');
    bar.innerHTML = `
      <span class="small"><strong>${ids.length}</strong> produit(s) à comparer</span>
      <button class="btn" id="openCompare" type="button" style="padding:8px 12px">Comparer</button>
      <button class="btn btn2" id="clearCompare" type="button" style="padding:8px 12px">Vider</button>`;
    $('#openCompare').addEventListener('click', openCompareModal);
    $('#clearCompare').addEventListener('click', () => { S.clearCompare(); toast('Comparaison vidée', 'ok'); });
  }

  function openCompareModal() {
    const ids = S.getCompare();
    const products = ids.map(id => S.getProduct(id)).filter(Boolean);
    if (!products.length) { toast('Aucun produit à comparer', 'err'); return; }
    const rows = [
      ['Image', p => p.image ? `<div class="ph" style="height:100px;background-image:url('${escapeAttr(p.image)}')"></div>` : '—'],
      ['Nom', p => `<strong>${escapeHtml(p.name)}</strong>`],
      ['Catégorie', p => escapeHtml(p.category)],
      ['Prix', p => S.fmtMoney(S.effectivePrice(p))],
      ['Stock', p => String(p.stock)],
      ['Description', p => escapeHtml(p.description || '')],
      ['Variantes', p => (p.variants || []).map(v => escapeHtml(v.name)).join(', ') || '—']
    ];
    const html = `
      <table style="width:100%;min-width:${100 + products.length * 180}px;border-collapse:collapse">
        <thead><tr><th style="text-align:left;padding:10px">Attribut</th>${products.map(p => `<th style="padding:10px">${escapeHtml(p.name)}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows.map(([k, fn]) => `<tr><td style="padding:10px;border-top:1px solid var(--border);font-weight:600">${k}</td>${products.map(p => `<td style="padding:10px;border-top:1px solid var(--border);vertical-align:top">${fn(p)}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>`;
    $('#compareBody').innerHTML = html;
    openModal('compareModal');
  }

  function handleLoyaltyLookup(e) {
    e.preventDefault();
    const target = $('#loyaltyTarget').value.trim();
    if (!target) return;
    const l = S.getLoyalty(target);
    $('#loyaltyInfo').innerHTML = `
      <div class="box">
        <div style="display:flex;align-items:center;gap:12px">
          <span class="loyalty-badge">${l.points} points</span>
          <span class="small">${escapeHtml(target)}</span>
        </div>
        <div class="small" style="margin-top:10px;font-weight:600">Historique</div>
        ${l.history.length ? l.history.slice(0, 10).map(h => `<div class="small">• ${S.formatDate(new Date(h.ts).toISOString())} — +${h.points} pts (${escapeHtml(h.reason)})</div>`).join('') : '<div class="small">Aucun historique.</div>'}
      </div>`;
  }

  function renderReviews() {
    const wrap = $('#reviewsList');
    if (!wrap) return;
    const reviews = S.getReviews().slice(0, 20);
    if (!reviews.length) { wrap.innerHTML = '<div class="small" style="grid-column:1/-1">Aucun avis pour l\'instant.</div>'; return; }
    wrap.innerHTML = reviews.map(r => {
      const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
      const prod = S.getProduct(r.productId);
      return `
        <div class="review">
          <strong>${stars}</strong>
          <div style="font-size:12px;color:var(--muted)">${escapeHtml(r.name)} ${prod ? '· ' + escapeHtml(prod.name) : ''}</div>
          <p>${escapeHtml(r.text)}</p>
          ${r.photo ? `<div class="ph" style="height:140px;border-radius:12px;background-image:url('${escapeAttr(r.photo)}')"></div>` : ''}
        </div>`;
    }).join('');
  }

  function populateReviewProducts() {
    const sel = $('#rvProduct');
    if (!sel) return;
    const products = S.getProducts().filter(p => p.status === 'Publié');
    sel.innerHTML = products.map(p => `<option value="${escapeAttr(p.id)}">${escapeHtml(p.name)}</option>`).join('');
  }

  function handleReviewPhoto(e) {
    const file = e.target.files[0];
    if (!file) { state.reviewPhoto = ''; $('#rvPhotoPreview').innerHTML = ''; return; }
    S.resizeImage(file, 800, 0.82).then(dataUrl => {
      state.reviewPhoto = dataUrl;
      $('#rvPhotoPreview').innerHTML = `<img src="${dataUrl}" style="max-width:160px;border-radius:12px;margin-top:6px">`;
    }).catch(() => toast('Image invalide', 'err'));
  }

  function submitReview(e) {
    e.preventDefault();
    const productId = $('#rvProduct').value;
    const rating = Number($('#rvRating').value);
    const name = $('#rvName').value.trim();
    const contact = $('#rvContact').value.trim();
    const text = $('#rvText').value.trim();
    if (!productId || !name || !text) { toast('Champs requis manquants', 'err'); return; }
    S.saveReview({ productId, rating, name, contact, text, photo: state.reviewPhoto || '', status: 'En attente' });
    toast('Merci ! Votre avis sera publié après modération.', 'ok');
    $('#reviewForm').reset();
    $('#rvPhotoPreview').innerHTML = '';
    state.reviewPhoto = '';
  }

  function applySettings() {
    const s = S.getSettings();
    const line = $('#supportLine');
    if (line) line.innerHTML = `WhatsApp : <strong>${escapeHtml(s.supportWhatsapp)}</strong> · Snapchat : <strong>${escapeHtml(s.supportSnapchat)}</strong>`;
  }

  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('kairos_theme', next); } catch (e) {}
    const btn = $('#themeToggle');
    if (btn) btn.textContent = next === 'dark' ? '☀️' : '🌙';
  }
  function applyTheme() {
    let t = 'light';
    try { t = localStorage.getItem('kairos_theme') || 'light'; } catch (e) {}
    document.documentElement.setAttribute('data-theme', t);
    const btn = $('#themeToggle');
    if (btn) btn.textContent = t === 'dark' ? '☀️' : '🌙';
  }

  /* --------------- init --------------- */
  document.addEventListener('DOMContentLoaded', () => {
    $('#year').textContent = new Date().getFullYear();
    applyTheme();
    bind();
    applySettings();
    renderCategories();
    renderProducts();
    renderCart();
    renderRecent();
    renderWishlist();
    renderCompareBar();
    populateReviewProducts();
    renderReviews();
  });
})();
