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
    ADMIN: 'kairos_admin',
    COUPONS: 'kairos_coupons',
    ZONES: 'kairos_zones',
    USERS: 'kairos_users',
    ACTIVITY: 'kairos_activity',
    OTPS: 'kairos_otps',
    SESSION: 'kairos_session'
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
      image: '',
      variants: [
        { id: 'v-rouge', name: 'Rouge', attributes: { Couleur: 'Rouge' }, priceDelta: 0, stock: 20 },
        { id: 'v-nude', name: 'Nude', attributes: { Couleur: 'Nude' }, priceDelta: 0, stock: 18 },
        { id: 'v-rose', name: 'Rose', attributes: { Couleur: 'Rose' }, priceDelta: 500, stock: 20 }
      ]
    }
  ];

  const DEFAULT_ZONES = [
    { id: 'z-dakar', name: 'Dakar centre', fee: 1500 },
    { id: 'z-banlieue', name: 'Banlieue', fee: 2500 },
    { id: 'z-region', name: 'Régions', fee: 4500 },
    { id: 'z-intl', name: 'International', fee: 15000 }
  ];

  const DEFAULT_COUPONS = [
    { code: 'BIENVENUE10', type: 'percent', value: 10, minTotal: 0, expiresAt: null, active: true, usageLimit: 0, used: 0 },
    { code: 'LIVRAISON', type: 'free_shipping', value: 0, minTotal: 10000, expiresAt: null, active: true, usageLimit: 0, used: 0 }
  ];

  const DEFAULT_USERS = [
    { id: 'u-owner', username: 'admin', passwordHash: simpleHash('kairos2026'), role: 'owner', createdAt: null }
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
    trackingPrefix: 'KDTRK',
    pushEnabled: true
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
    if (!localStorage.getItem(K.COUPONS)) write(K.COUPONS, DEFAULT_COUPONS);
    if (!localStorage.getItem(K.ZONES)) write(K.ZONES, DEFAULT_ZONES);
    if (!localStorage.getItem(K.USERS)) {
      const users = DEFAULT_USERS.map(u => ({ ...u, createdAt: todayISO() }));
      write(K.USERS, users);
    }
    if (!localStorage.getItem(K.ACTIVITY)) write(K.ACTIVITY, []);
    if (!localStorage.getItem(K.OTPS)) write(K.OTPS, []);
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
  function addToCart(productId, qty, variantId) {
    qty = qty || 1;
    const cart = getCart();
    const existing = cart.find(x => x.productId === productId && (x.variantId || '') === (variantId || ''));
    if (existing) {
      existing.qty = Math.max(1, existing.qty + qty);
    } else {
      cart.push({ productId, variantId: variantId || '', qty: Math.max(1, qty) });
    }
    setCart(cart);
  }
  function lineKey(productId, variantId) { return productId + '::' + (variantId || ''); }
  function updateCartQty(productId, qty, variantId) {
    const cart = getCart().map(x =>
      (x.productId === productId && (x.variantId || '') === (variantId || ''))
        ? { ...x, qty: Math.max(1, qty) } : x
    );
    setCart(cart);
  }
  function removeFromCart(productId, variantId) {
    setCart(getCart().filter(x => !(x.productId === productId && (x.variantId || '') === (variantId || ''))));
  }
  function clearCart() { setCart([]); }
  function cartSummary(opts) {
    opts = opts || {};
    const items = getCart().map(item => {
      const p = getProduct(item.productId);
      if (!p) return null;
      const variant = item.variantId && p.variants ? p.variants.find(v => v.id === item.variantId) : null;
      const basePrice = effectivePrice(p);
      const unit = basePrice + (variant ? Number(variant.priceDelta) || 0 : 0);
      return {
        productId: p.id,
        variantId: variant ? variant.id : '',
        variantName: variant ? variant.name : '',
        name: p.name + (variant ? ' — ' + variant.name : ''),
        image: p.image,
        unitPrice: unit,
        qty: item.qty,
        lineTotal: unit * item.qty
      };
    }).filter(Boolean);
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const settings = getSettings();

    let delivery = settings.deliveryFee;
    let zone = null;
    if (opts.zoneId) {
      zone = getZones().find(z => z.id === opts.zoneId);
      if (zone) delivery = Number(zone.fee) || 0;
    }
    if (subtotal === 0) delivery = 0;
    if (subtotal > 0 && subtotal >= settings.freeDeliveryFrom) delivery = 0;

    let discount = 0;
    let coupon = null;
    let couponError = null;
    if (opts.couponCode) {
      const found = getCoupons().find(c => c.code.toUpperCase() === String(opts.couponCode).toUpperCase());
      if (!found) couponError = 'Code promo invalide';
      else if (!found.active) couponError = 'Code inactif';
      else if (found.expiresAt && new Date(found.expiresAt).getTime() < Date.now()) couponError = 'Code expiré';
      else if (found.usageLimit && found.used >= found.usageLimit) couponError = 'Code épuisé';
      else if (subtotal < (Number(found.minTotal) || 0)) couponError = 'Minimum ' + fmtMoney(found.minTotal) + ' requis';
      else {
        coupon = found;
        if (coupon.type === 'percent') discount = Math.round(subtotal * (Number(coupon.value) || 0) / 100);
        else if (coupon.type === 'fixed') discount = Math.min(subtotal, Number(coupon.value) || 0);
        else if (coupon.type === 'free_shipping') { delivery = 0; }
      }
    }

    const total = Math.max(0, subtotal - discount) + delivery;
    return {
      items, subtotal, delivery, discount, total,
      coupon: coupon ? { code: coupon.code, type: coupon.type, value: coupon.value } : null,
      couponError,
      zone: zone ? { id: zone.id, name: zone.name, fee: zone.fee } : null,
      count: items.reduce((s, i) => s + i.qty, 0)
    };
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
      discount: payload.discount || 0,
      coupon: payload.coupon || null,
      zone: payload.zone || null,
      total: payload.total,
      paymentMethod: payload.paymentMethod,
      paymentStatus: 'En attente',
      notes: payload.notes || '',
      history: [{ at: todayISO(), status: 'Nouvelle', note: 'Commande créée' }]
    };
    orders.unshift(order);
    setOrders(orders);
    payload.items.forEach(it => {
      const p = getProduct(it.productId);
      if (!p) return;
      if (it.variantId && Array.isArray(p.variants)) {
        const v = p.variants.find(x => x.id === it.variantId);
        if (v) v.stock = Math.max(0, (Number(v.stock) || 0) - it.qty);
      } else {
        p.stock = Math.max(0, (Number(p.stock) || 0) - it.qty);
      }
      saveProduct(p);
    });
    if (payload.coupon && payload.coupon.code) {
      const list = getCoupons();
      const c = list.find(x => x.code === payload.coupon.code);
      if (c) { c.used = (Number(c.used) || 0) + 1; setCoupons(list); }
    }
    clearCart();
    logActivity('order_created', 'Commande ' + id + ' créée');
    notifyNewOrder(order);
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

  /* ---------- admin users (multi) ---------- */
  function getUsers() { return read(K.USERS, []); }
  function setUsers(list) { write(K.USERS, list); }
  function getUser(id) { return getUsers().find(u => u.id === id); }
  function saveUser(u) {
    const list = getUsers();
    if (!u.id) u.id = uid('u');
    if (!u.createdAt) u.createdAt = todayISO();
    const i = list.findIndex(x => x.id === u.id);
    if (i >= 0) list[i] = { ...list[i], ...u }; else list.push(u);
    setUsers(list);
    return u;
  }
  function deleteUser(id) {
    const list = getUsers();
    const remaining = list.filter(u => u.id !== id);
    if (!remaining.some(u => u.role === 'owner')) return false;
    setUsers(remaining);
    return true;
  }
  function setUserPassword(id, newPwd) {
    const list = getUsers();
    const u = list.find(x => x.id === id);
    if (!u) return false;
    u.passwordHash = simpleHash(newPwd);
    setUsers(list);
    return true;
  }
  function getSession() { return read(K.SESSION, null); }
  function setSession(s) { if (s) write(K.SESSION, s); else localStorage.removeItem(K.SESSION); }

  function adminLogin(usernameOrPwd, password) {
    // Supports legacy single-arg usage
    let username, pwd;
    if (password === undefined) { username = 'admin'; pwd = usernameOrPwd; }
    else { username = usernameOrPwd; pwd = password; }
    const users = getUsers();
    const user = users.find(u => u.username.toLowerCase() === String(username).toLowerCase());
    if (!user) return false;
    if (simpleHash(pwd) !== user.passwordHash) return false;
    // Mirror legacy admin key for back-compat
    const a = read(K.ADMIN, DEFAULT_ADMIN);
    a.loggedUntil = Date.now() + 1000 * 60 * 60 * 4;
    write(K.ADMIN, a);
    setSession({ userId: user.id, username: user.username, role: user.role, loggedUntil: a.loggedUntil });
    logActivity('login', 'Connexion ' + user.username, user.id);
    return true;
  }
  function adminLogout() {
    const s = getSession();
    if (s) logActivity('logout', 'Déconnexion ' + (s.username || ''), s.userId);
    const a = read(K.ADMIN, DEFAULT_ADMIN);
    a.loggedUntil = 0;
    write(K.ADMIN, a);
    setSession(null);
  }
  function adminIsLogged() {
    const s = getSession();
    if (s && s.loggedUntil > Date.now()) return true;
    const a = read(K.ADMIN, DEFAULT_ADMIN);
    return a.loggedUntil && a.loggedUntil > Date.now();
  }
  function currentUser() {
    const s = getSession();
    if (!s) return null;
    return getUser(s.userId);
  }
  function hasRole(roles) {
    const u = currentUser();
    if (!u) return false;
    if (!roles) return true;
    const list = Array.isArray(roles) ? roles : [roles];
    return list.indexOf(u.role) >= 0;
  }
  function adminChangePassword(oldPwd, newPwd) {
    const u = currentUser();
    if (!u) return false;
    if (simpleHash(oldPwd) !== u.passwordHash) return false;
    setUserPassword(u.id, newPwd);
    logActivity('password_change', 'Mot de passe modifié', u.id);
    return true;
  }

  /* ---------- coupons ---------- */
  function getCoupons() { return read(K.COUPONS, []); }
  function setCoupons(list) { write(K.COUPONS, list); dispatch('coupons-change'); }
  function saveCoupon(c) {
    const list = getCoupons();
    c.code = String(c.code || '').toUpperCase().trim();
    if (!c.code) return null;
    const i = list.findIndex(x => x.code === c.code);
    if (i >= 0) list[i] = { ...list[i], ...c }; else list.push({ used: 0, ...c });
    setCoupons(list);
    logActivity('coupon_save', 'Coupon ' + c.code + ' enregistré');
    return c;
  }
  function deleteCoupon(code) {
    setCoupons(getCoupons().filter(c => c.code !== code));
    logActivity('coupon_delete', 'Coupon ' + code + ' supprimé');
  }

  /* ---------- zones ---------- */
  function getZones() { return read(K.ZONES, DEFAULT_ZONES); }
  function setZones(list) { write(K.ZONES, list); dispatch('zones-change'); }
  function saveZone(z) {
    const list = getZones();
    if (!z.id) z.id = uid('z');
    const i = list.findIndex(x => x.id === z.id);
    if (i >= 0) list[i] = { ...list[i], ...z }; else list.push(z);
    setZones(list);
    logActivity('zone_save', 'Zone ' + z.name + ' enregistrée');
    return z;
  }
  function deleteZone(id) {
    setZones(getZones().filter(z => z.id !== id));
    logActivity('zone_delete', 'Zone ' + id + ' supprimée');
  }

  /* ---------- activity log ---------- */
  function logActivity(type, message, userId) {
    const log = read(K.ACTIVITY, []);
    const entry = { id: uid('a'), at: todayISO(), type, message: String(message || ''), userId: userId || null };
    log.unshift(entry);
    if (log.length > 500) log.length = 500;
    write(K.ACTIVITY, log);
    dispatch('activity-change');
    return entry;
  }
  function getActivity() { return read(K.ACTIVITY, []); }
  function clearActivity() { write(K.ACTIVITY, []); dispatch('activity-change'); }

  /* ---------- OTP (phone/email) ---------- */
  function generateOtp(target) {
    target = String(target || '').trim();
    if (!target) return null;
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const list = read(K.OTPS, []).filter(o => o.target !== target);
    list.unshift({ target, code, createdAt: todayISO(), expiresAt: Date.now() + 1000 * 60 * 10, consumed: false });
    if (list.length > 100) list.length = 100;
    write(K.OTPS, list);
    dispatch('otp-change');
    logActivity('otp_issued', 'Code OTP généré pour ' + target);
    return code;
  }
  function verifyOtp(target, code) {
    target = String(target || '').trim();
    const list = read(K.OTPS, []);
    const item = list.find(o => o.target === target && o.code === String(code).trim() && !o.consumed);
    if (!item) return false;
    if (Date.now() > item.expiresAt) return false;
    item.consumed = true;
    write(K.OTPS, list);
    return true;
  }
  function getPendingOtps() {
    const list = read(K.OTPS, []);
    return list.filter(o => !o.consumed && Date.now() < o.expiresAt);
  }

  /* ---------- orders lookup for buyer ---------- */
  function findOrdersForBuyer(target) {
    const q = String(target || '').toLowerCase().trim();
    if (!q) return [];
    return getOrders().filter(o => {
      const phone = (o.customer && o.customer.phone || '').toLowerCase();
      const email = (o.customer && o.customer.email || '').toLowerCase();
      return phone === q || email === q || phone.replace(/\s|\+|-/g, '') === q.replace(/\s|\+|-/g, '');
    });
  }

  /* ---------- image utilities ---------- */
  function resizeImage(file, maxSize, quality) {
    maxSize = maxSize || 800;
    quality = quality == null ? 0.82 : quality;
    return new Promise((resolve, reject) => {
      if (!file) { reject(new Error('no file')); return; }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('read error'));
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > height && width > maxSize) { height = Math.round(height * maxSize / width); width = maxSize; }
          else if (height > maxSize) { width = Math.round(width * maxSize / height); height = maxSize; }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          resolve(canvas.toDataURL(type, quality));
        };
        img.onerror = () => reject(new Error('decode error'));
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ---------- push notifications ---------- */
  function canPush() {
    return typeof window.Notification !== 'undefined';
  }
  function requestPush() {
    if (!canPush()) return Promise.resolve('unsupported');
    if (Notification.permission === 'granted') return Promise.resolve('granted');
    return Notification.requestPermission();
  }
  function notifyNewOrder(order) {
    try {
      const s = getSettings();
      if (!s.pushEnabled) return;
      if (!canPush() || Notification.permission !== 'granted') return;
      const n = new Notification('Nouvelle commande ' + order.id, {
        body: (order.customer.firstName || '') + ' ' + (order.customer.lastName || '') + ' — ' + fmtMoney(order.total),
        tag: order.id
      });
      setTimeout(() => { try { n.close(); } catch (e) {} }, 8000);
    } catch (e) {}
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
    if (e.key === K.COUPONS) dispatch('coupons-change');
    if (e.key === K.ZONES) dispatch('zones-change');
    if (e.key === K.USERS) dispatch('users-change');
    if (e.key === K.ACTIVITY) dispatch('activity-change');
  });

  /* ---------- reset ---------- */
  function resetAll() {
    Object.values(K).forEach(k => localStorage.removeItem(k));
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
    adminLogin, adminLogout, adminIsLogged, adminChangePassword, currentUser, hasRole,
    getUsers, getUser, saveUser, deleteUser, setUserPassword,
    getCoupons, saveCoupon, deleteCoupon,
    getZones, saveZone, deleteZone,
    logActivity, getActivity, clearActivity,
    generateOtp, verifyOtp, getPendingOtps,
    findOrdersForBuyer,
    resizeImage,
    canPush, requestPush, notifyNewOrder,
    resetAll
  };
})(window);
