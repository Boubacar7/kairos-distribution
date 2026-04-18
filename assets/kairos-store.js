/* Kairos Distributions - Client-side data layer (localStorage)
 * Keys:
 *   kairos_products  - array of products
 *   kairos_orders    - array of orders
 *   kairos_cart      - current cart items
 *   kairos_settings  - store settings
 *   kairos_admin     - admin auth { passwordHash, loggedUntil }
 */
(function (global) {
  'use strict';

  const K = {
    PRODUCTS: 'kairos_products',
    ORDERS: 'kairos_orders',
    CART: 'kairos_cart',
    SETTINGS: 'kairos_settings',
    ADMIN: 'kairos_admin'
  };

  const DEFAULT_PRODUCTS = [
    {
      id: 'p-glow-skin',
      name: 'Glow Skin Crème',
      category: 'Beauté',
      price: 24900,
      stock: 42,
      promo: 0,
      status: 'Publié',
      description: 'Hydratation quotidienne et éclat durable pour tous types de peau.',
      image: ''
    },
    {
      id: 'p-trim-active',
      name: 'Trim Active Plus',
      category: 'Amincissant',
      price: 18500,
      stock: 35,
      promo: 10,
      status: 'Publié',
      description: 'Programme silhouette complet, résultats visibles en 4 semaines.',
      image: ''
    },
    {
      id: 'p-curve-up',
      name: 'Curve Up Gel',
      category: 'Boost postérieur',
      price: 27500,
      stock: 20,
      promo: 0,
      status: 'Publié',
      description: 'Routine tonifiante et raffermissante à appliquer matin et soir.',
      image: ''
    },
    {
      id: 'p-lip-glow',
      name: 'Lip & Glow Set',
      category: 'Promo',
      price: 15900,
      stock: 58,
      promo: 15,
      status: 'Publié',
      description: 'Pack découverte lèvres et éclat du visage à prix découverte.',
      image: ''
    }
  ];

  const DEFAULT_SETTINGS = {
    storeName: 'Kairos Distributions',
    currency: 'FCFA',
    deliveryFee: 2000,
    freeDeliveryFrom: 50000,
    supportWhatsapp: '+221 77 000 00 00',
    supportSnapchat: 'kairos.distrib',
    paymentMethods: {
      cash: true,
      orange: true,
      wave: true,
      moov: true,
      card: false
    },
    trackingPrefix: 'KDTRK'
  };

  const DEFAULT_ADMIN = {
    passwordHash: simpleHash('kairos2026'),
    loggedUntil: 0
  };

  /* ---------- utilities ---------- */
  function simpleHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return String(h);
  }

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function uid(prefix) {
    return (prefix || 'id') + '-' + Math.random().toString(36).slice(2, 9);
  }

  function fmtMoney(n, currency) {
    currency = currency || getSettings().currency;
    const v = Math.round(Number(n) || 0);
    return v.toLocaleString('fr-FR').replace(/\u202f/g, ' ') + ' ' + currency;
  }

  function todayISO() {
    return new Date().toISOString();
  }

  function formatDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  /* ---------- seed ---------- */
  function ensureSeeded() {
    if (!localStorage.getItem(K.PRODUCTS)) write(K.PRODUCTS, DEFAULT_PRODUCTS);
    if (!localStorage.getItem(K.SETTINGS)) write(K.SETTINGS, DEFAULT_SETTINGS);
    if (!localStorage.getItem(K.ADMIN)) write(K.ADMIN, DEFAULT_ADMIN);
    if (!localStorage.getItem(K.ORDERS)) write(K.ORDERS, []);
    if (!localStorage.getItem(K.CART)) write(K.CART, []);
  }

  /* ---------- products ---------- */
  function getProducts() { return read(K.PRODUCTS, []); }
  function setProducts(list) { write(K.PRODUCTS, list); }
  function getProduct(id) { return getProducts().find(p => p.id === id); }
  function saveProduct(p) {
    const list = getProducts();
    if (!p.id) p.id = uid('p');
    const i = list.findIndex(x => x.id === p.id);
    if (i >= 0) list[i] = p; else list.push(p);
    setProducts(list);
    return p;
  }
  function deleteProduct(id) {
    setProducts(getProducts().filter(p => p.id !== id));
  }
  function effectivePrice(p) {
    const promo = Number(p.promo) || 0;
    return Math.round(p.price * (1 - promo / 100));
  }

  /* ---------- cart ---------- */
  function getCart() { return read(K.CART, []); }
  function setCart(items) { write(K.CART, items); dispatch('cart-change'); }
  function addToCart(productId, qty) {
    qty = qty || 1;
    const cart = getCart();
    const existing = cart.find(x => x.productId === productId);
    if (existing) {
      existing.qty = Math.max(1, existing.qty + qty);
    } else {
      cart.push({ productId, qty: Math.max(1, qty) });
    }
    setCart(cart);
  }
  function updateCartQty(productId, qty) {
    const cart = getCart().map(x => x.productId === productId ? { ...x, qty: Math.max(1, qty) } : x);
    setCart(cart);
  }
  function removeFromCart(productId) {
    setCart(getCart().filter(x => x.productId !== productId));
  }
  function clearCart() { setCart([]); }
  function cartSummary() {
    const items = getCart().map(item => {
      const p = getProduct(item.productId);
      if (!p) return null;
      const unit = effectivePrice(p);
      return {
        productId: p.id,
        name: p.name,
        image: p.image,
        unitPrice: unit,
        qty: item.qty,
        lineTotal: unit * item.qty
      };
    }).filter(Boolean);
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const s = getSettings();
    const delivery = subtotal === 0 || subtotal >= s.freeDeliveryFrom ? 0 : s.deliveryFee;
    return { items, subtotal, delivery, total: subtotal + delivery, count: items.reduce((s, i) => s + i.qty, 0) };
  }

  /* ---------- orders ---------- */
  function getOrders() { return read(K.ORDERS, []); }
  function setOrders(list) { write(K.ORDERS, list); }
  function getOrder(id) { return getOrders().find(o => o.id === id || o.trackingNumber === id); }
  function nextOrderId() {
    const year = new Date().getFullYear();
    const orders = getOrders();
    let n = 100;
    orders.forEach(o => {
      const m = /^KD-(\d+)-(\d+)$/.exec(o.id);
      if (m && Number(m[1]) === year) {
        const v = Number(m[2]);
        if (v >= n) n = v + 1;
      }
    });
    return 'KD-' + year + '-' + String(n).padStart(4, '0');
  }
  function nextTrackingNumber() {
    const s = getSettings();
    return (s.trackingPrefix || 'KDTRK') + '-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  }
  function createOrder(payload) {
    const orders = getOrders();
    const id = nextOrderId();
    const order = {
      id,
      createdAt: todayISO(),
      updatedAt: todayISO(),
      status: 'Nouvelle',
      trackingNumber: nextTrackingNumber(),
      customer: payload.customer,
      items: payload.items,
      subtotal: payload.subtotal,
      delivery: payload.delivery,
      total: payload.total,
      paymentMethod: payload.paymentMethod,
      paymentStatus: payload.paymentMethod === 'cash' ? 'En attente' : 'En attente',
      notes: payload.notes || '',
      history: [{ at: todayISO(), status: 'Nouvelle', note: 'Commande créée' }]
    };
    orders.unshift(order);
    setOrders(orders);
    payload.items.forEach(it => {
      const p = getProduct(it.productId);
      if (p) { p.stock = Math.max(0, (Number(p.stock) || 0) - it.qty); saveProduct(p); }
    });
    clearCart();
    return order;
  }
  function updateOrderStatus(id, status, note) {
    const orders = getOrders();
    const o = orders.find(x => x.id === id);
    if (!o) return null;
    o.status = status;
    o.updatedAt = todayISO();
    o.history.push({ at: todayISO(), status, note: note || '' });
    if (status === 'Livrée') o.paymentStatus = 'Payé';
    if (status === 'Annulée') o.paymentStatus = 'Annulé';
    setOrders(orders);
    return o;
  }
  function updateOrderTracking(id, trackingNumber) {
    const orders = getOrders();
    const o = orders.find(x => x.id === id);
    if (!o) return null;
    o.trackingNumber = trackingNumber;
    o.updatedAt = todayISO();
    o.history.push({ at: todayISO(), status: o.status, note: 'Numéro de suivi mis à jour' });
    setOrders(orders);
    return o;
  }
  function deleteOrder(id) {
    setOrders(getOrders().filter(o => o.id !== id));
  }

  /* ---------- settings ---------- */
  function getSettings() { return read(K.SETTINGS, DEFAULT_SETTINGS); }
  function saveSettings(s) { write(K.SETTINGS, Object.assign({}, getSettings(), s)); dispatch('settings-change'); }

  /* ---------- admin auth ---------- */
  function adminLogin(password) {
    const a = read(K.ADMIN, DEFAULT_ADMIN);
    if (simpleHash(password) === a.passwordHash) {
      a.loggedUntil = Date.now() + 1000 * 60 * 60 * 4; // 4h session
      write(K.ADMIN, a);
      return true;
    }
    return false;
  }
  function adminLogout() {
    const a = read(K.ADMIN, DEFAULT_ADMIN);
    a.loggedUntil = 0;
    write(K.ADMIN, a);
  }
  function adminIsLogged() {
    const a = read(K.ADMIN, DEFAULT_ADMIN);
    return a.loggedUntil && a.loggedUntil > Date.now();
  }
  function adminChangePassword(oldPwd, newPwd) {
    const a = read(K.ADMIN, DEFAULT_ADMIN);
    if (simpleHash(oldPwd) !== a.passwordHash) return false;
    a.passwordHash = simpleHash(newPwd);
    write(K.ADMIN, a);
    return true;
  }

  /* ---------- events ---------- */
  function dispatch(name, detail) {
    try { window.dispatchEvent(new CustomEvent('kairos:' + name, { detail: detail || null })); } catch (e) {}
  }
  window.addEventListener('storage', function (e) {
    if (e.key === K.CART) dispatch('cart-change');
    if (e.key === K.ORDERS) dispatch('orders-change');
    if (e.key === K.PRODUCTS) dispatch('products-change');
    if (e.key === K.SETTINGS) dispatch('settings-change');
  });

  /* ---------- reset ---------- */
  function resetAll() {
    [K.PRODUCTS, K.ORDERS, K.CART, K.SETTINGS, K.ADMIN].forEach(k => localStorage.removeItem(k));
    ensureSeeded();
  }

  ensureSeeded();

  global.KairosStore = {
    K,
    fmtMoney, formatDate, uid, effectivePrice,
    getProducts, setProducts, getProduct, saveProduct, deleteProduct,
    getCart, setCart, addToCart, updateCartQty, removeFromCart, clearCart, cartSummary,
    getOrders, setOrders, getOrder, createOrder, updateOrderStatus, updateOrderTracking, deleteOrder,
    getSettings, saveSettings,
    adminLogin, adminLogout, adminIsLogged, adminChangePassword,
    resetAll
  };
})(window);
