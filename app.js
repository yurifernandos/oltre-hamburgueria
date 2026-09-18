/**
 * Oltre Hamburgueria - Core Application & Admin Engine
 * Handles live catalog rendering, shopping cart, checkout (MB WAY / Multibanco / WhatsApp),
 * and the instant Visual & Product Management Panel.
 */

// Fallback high-definition food images for burgers & sides (since S3 links were 404)
const FALLBACK_IMAGES = {
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
  smash: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80",
  chicken: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=800&q=80",
  fries: "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80",
  drink: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80",
  dessert: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=800&q=80",
  default: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80"
};

function getProductFallbackImage(product) {
  const name = (product.name || '').toLowerCase();
  const cat = (product.category_name || '').toLowerCase();
  if (cat.includes('smash') || name.includes('smash')) return FALLBACK_IMAGES.smash;
  if (cat.includes('chicken') || name.includes('chicken') || name.includes('frango')) return FALLBACK_IMAGES.chicken;
  if (cat.includes('entrada') || name.includes('batata') || name.includes('rings') || name.includes('fries')) return FALLBACK_IMAGES.fries;
  if (cat.includes('bebida') || cat.includes('cerveja') || name.includes('cola') || name.includes('cerveja')) return FALLBACK_IMAGES.drink;
  if (cat.includes('sobremesa') || name.includes('cheesecake') || name.includes('brownie') || name.includes('doce')) return FALLBACK_IMAGES.dessert;
  if (cat.includes('burger') || name.includes('burger')) return FALLBACK_IMAGES.burger;
  return FALLBACK_IMAGES.default;
}

// Global App State
const state = {
  products: [],
  categories: [],
  config: {},
  cart: [],
  currentCategory: 'all',
  searchTerm: '',
  orderType: 'delivery', // 'delivery' or 'takeaway'
  currentModalProduct: null,
  lastOrder: null
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  applyConfigToUI();
  renderCategoryPills();
  renderProducts();
  updateCartUI();
  populateAdminFields();
  renderAdminProductList();
});

// Load from LocalStorage or Defaults
function loadData() {
  const savedProducts = localStorage.getItem('oltre_products');
  const savedCategories = localStorage.getItem('oltre_categories');
  const savedConfig = localStorage.getItem('oltre_config');

  state.products = savedProducts ? JSON.parse(savedProducts) : JSON.parse(JSON.stringify(window.OLTRE_INITIAL_PRODUCTS || []));
  state.categories = savedCategories ? JSON.parse(savedCategories) : JSON.parse(JSON.stringify(window.OLTRE_CATEGORIES || []));
  state.config = savedConfig ? JSON.parse(savedConfig) : JSON.parse(JSON.stringify(window.OLTRE_DEFAULT_CONFIG || {}));

  // Ensure default config values
  state.config.is_open = state.config.is_open !== undefined ? state.config.is_open : true;
  state.config.delivery_fee = state.config.delivery_fee !== undefined ? state.config.delivery_fee : 2.50;
  state.config.min_order = state.config.min_order !== undefined ? state.config.min_order : 20.00;
  state.config.phone = state.config.phone || "216 028 131";
  state.config.whatsapp = state.config.whatsapp || "351964392320";
  state.config.hero_title = state.config.hero_title || "Io preferisco andare Oltre";
  state.config.hero_subtitle = state.config.hero_subtitle || "Hambúrgueres artesanais de verdade em pão brioche, com carne 100% novilho e molhos secretos. Peça agora com entrega rápida em Sesimbra!";
  state.config.top_notice = state.config.top_notice || "Entregas e Takeaway em Sesimbra | Pagamento seguro por MB WAY e Multibanco";
}

// Apply Store Configuration to the UI
function applyConfigToUI() {
  // Top Notice
  const topNoticeEl = document.getElementById('topNoticeText');
  if (topNoticeEl) topNoticeEl.textContent = state.config.top_notice;

  // Hero Section
  const heroTitleEl = document.getElementById('heroTitle');
  if (heroTitleEl) heroTitleEl.textContent = state.config.hero_title;

  const heroSubEl = document.getElementById('heroSubtitle');
  if (heroSubEl) heroSubEl.textContent = state.config.hero_subtitle;

  const heroDeliveryEl = document.getElementById('heroDeliveryFee');
  if (heroDeliveryEl) heroDeliveryEl.textContent = `Taxa fixa ${parseFloat(state.config.delivery_fee).toFixed(2)}€`;

  // Nav Contact
  const navPhoneEl = document.getElementById('navPhone');
  if (navPhoneEl) navPhoneEl.textContent = state.config.phone;

  const footerPhoneEl = document.getElementById('footerPhone');
  if (footerPhoneEl) footerPhoneEl.innerHTML = `<i class="fa-solid fa-phone text-brand-gold mr-1.5"></i> ${state.config.phone}`;

  // Store Status
  updateStoreStatusUI();
}

function updateStoreStatusUI() {
  const dot = document.getElementById('navStatusDot');
  const label = document.getElementById('navStatusLabel');
  const adminBtn = document.getElementById('btnToggleStatus');

  if (state.config.is_open) {
    if (dot) dot.className = "w-2.5 h-2.5 rounded-full bg-emerald-500 badge-pulse";
    if (label) {
      label.className = "text-zinc-300 font-medium";
      label.textContent = "Aberto para Pedidos";
    }
    if (adminBtn) {
      adminBtn.className = "flex-1 py-2 px-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
      adminBtn.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Aberto Agora`;
    }
  } else {
    if (dot) dot.className = "w-2.5 h-2.5 rounded-full bg-rose-500";
    if (label) {
      label.className = "text-rose-400 font-medium";
      label.textContent = "Fechado Temporariamente";
    }
    if (adminBtn) {
      adminBtn.className = "flex-1 py-2 px-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all bg-rose-500/20 text-rose-400 border border-rose-500/30";
      adminBtn.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Fechado Agora`;
    }
  }
}

// Render Categories Pill Bar
function renderCategoryPills() {
  const container = document.getElementById('categoryPills');
  if (!container) return;

  let html = `
    <button onclick="selectCategory('all')" class="category-pill px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${state.currentCategory === 'all' ? 'bg-brand-gold text-zinc-950 shadow-md shadow-brand-gold/20' : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'}">
      <i class="fa-solid fa-list-ul mr-1.5"></i> Todos (${state.products.length})
    </button>
  `;

  state.categories.forEach(cat => {
    const count = state.products.filter(p => p.category_id === cat.id || p.category_name === cat.name).length;
    const isSelected = state.currentCategory === cat.id;
    html += `
      <button onclick="selectCategory(${cat.id})" class="category-pill px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${isSelected ? 'bg-brand-gold text-zinc-950 shadow-md shadow-brand-gold/20' : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'}">
        ${cat.name} (${count})
      </button>
    `;
  });

  container.innerHTML = html;
}

// Select Category
function selectCategory(catId) {
  state.currentCategory = catId;
  renderCategoryPills();

  const titleEl = document.getElementById('currentCategoryTitle');
  const descEl = document.getElementById('currentCategoryDesc');

  if (catId === 'all') {
    if (titleEl) titleEl.textContent = "Todos os Itens do Menu";
    if (descEl) descEl.textContent = "Explore o cardápio completo da Oltre Hamburgueria Sesimbra.";
  } else {
    const cat = state.categories.find(c => c.id === catId);
    if (cat) {
      if (titleEl) titleEl.textContent = cat.name;
      if (descEl) descEl.textContent = `Deliciosas opções artesanais da categoria ${cat.name}.`;
    }
  }

  renderProducts();
}

// Handle Search
function handleSearch(val) {
  state.searchTerm = val.trim().toLowerCase();
  const clearBtn = document.getElementById('clearSearchBtn');
  if (clearBtn) {
    if (state.searchTerm) clearBtn.classList.remove('hidden');
    else clearBtn.classList.add('hidden');
  }
  renderProducts();
}

function clearSearch() {
  const input = document.getElementById('searchInput');
  if (input) input.value = '';
  handleSearch('');
}

// Render Products Grid
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  const emptyState = document.getElementById('emptyState');
  const counter = document.getElementById('productCounter');
  if (!grid) return;

  let filtered = state.products.filter(p => {
    // Category match
    const catMatch = state.currentCategory === 'all' || p.category_id === state.currentCategory || p.category_name === state.currentCategory;
    // Search match
    const searchMatch = !state.searchTerm || 
      (p.name && p.name.toLowerCase().includes(state.searchTerm)) ||
      (p.description && p.description.toLowerCase().includes(state.searchTerm));
    return catMatch && searchMatch;
  });

  if (counter) counter.textContent = `${filtered.length} itens`;

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  let html = '';
  filtered.forEach(p => {
    const price = parseFloat(p.price || 0).toFixed(2);
    const salePrice = p.sale_price ? parseFloat(p.sale_price).toFixed(2) : null;
    const isOutOfStock = p.is_active === false || p.out_of_stock;
    const fallbackImg = getProductFallbackImage(p);

    html += `
      <div class="bg-brand-darkCard border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all group flex flex-col justify-between shadow-lg relative">
        ${isOutOfStock ? `
          <div class="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-rose-950/90 border border-rose-600 text-rose-300 text-[10px] font-bold uppercase tracking-wider">
            Esgotado
          </div>
        ` : salePrice ? `
          <div class="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-brand-gold text-zinc-950 text-[10px] font-black uppercase tracking-wider">
            Promoção
          </div>
        ` : ''}

        <div>
          <div class="h-48 sm:h-52 bg-zinc-900 overflow-hidden relative cursor-pointer" onclick="openProductModal(${p.id})">
            <img src="${p.image_url || fallbackImg}" 
                 onerror="this.onerror=null;this.src='${fallbackImg}';" 
                 alt="${p.name}" 
                 class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${isOutOfStock ? 'opacity-40 grayscale' : ''}">
            <div class="absolute inset-0 bg-gradient-to-t from-brand-darkCard via-transparent to-transparent opacity-60"></div>
          </div>

          <div class="p-4 sm:p-5">
            <div class="flex items-start justify-between gap-2 mb-1.5">
              <h3 class="font-heading font-extrabold text-base sm:text-lg text-white group-hover:text-brand-gold transition-colors cursor-pointer" onclick="openProductModal(${p.id})">
                ${p.name}
              </h3>
            </div>
            
            <p class="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-4">
              ${p.description || 'Deliciosa preparação artesanal exclusiva Oltre.'}
            </p>
          </div>
        </div>

        <div class="p-4 sm:p-5 pt-0 border-t border-zinc-800/60 mt-auto flex items-center justify-between">
          <div>
            ${salePrice ? `
              <div class="flex items-baseline gap-1.5">
                <span class="text-base sm:text-lg font-black text-brand-gold">${salePrice}€</span>
                <span class="text-xs text-zinc-500 line-through">${price}€</span>
              </div>
            ` : `
              <span class="text-base sm:text-lg font-black text-white">${price}€</span>
            `}
          </div>

          ${isOutOfStock ? `
            <button disabled class="px-3.5 py-2 rounded-xl bg-zinc-800 text-zinc-500 text-xs font-bold cursor-not-allowed">
              Indisponível
            </button>
          ` : `
            <button onclick="openProductModal(${p.id})" class="px-3.5 py-2 rounded-xl bg-brand-gold hover:bg-brand-goldHover text-zinc-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-brand-gold/15 transition-all transform active:scale-95">
              <i class="fa-solid fa-plus"></i>
              <span>Adicionar</span>
            </button>
          `}
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;
}

// Product Customization Modal
function openProductModal(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  state.currentModalProduct = product;
  const modal = document.getElementById('productModal');
  const img = document.getElementById('modalProductImage');
  const name = document.getElementById('modalProductName');
  const desc = document.getElementById('modalProductDesc');
  const badge = document.getElementById('modalCategoryBadge');
  const qty = document.getElementById('modalQuantity');
  const notes = document.getElementById('modalProductNotes');
  const donenessSection = document.getElementById('modalDonenessSection');

  const fallbackImg = getProductFallbackImage(product);
  if (img) {
    img.src = product.image_url || fallbackImg;
    img.onerror = () => { img.src = fallbackImg; };
  }

  if (name) name.textContent = product.name;
  if (desc) desc.textContent = product.description || "Hambúrguer artesanal preparado com ingredientes selecionados.";
  if (badge) badge.textContent = product.category_name || "Oltre";
  if (qty) qty.textContent = "1";
  if (notes) notes.value = "";

  // Show meat doneness option only for burgers
  const catName = (product.category_name || '').toLowerCase();
  const prodName = (product.name || '').toLowerCase();
  const isBurger = catName.includes('burger') || prodName.includes('burger');
  if (donenessSection) {
    if (isBurger && !catName.includes('chicken') && !catName.includes('bebida') && !catName.includes('sobremesa')) {
      donenessSection.classList.remove('hidden');
    } else {
      donenessSection.classList.add('hidden');
    }
  }

  // Reset checkboxes
  const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => cb.checked = false);

  updateModalPrice();
  modal.classList.remove('hidden');
}

function closeProductModal() {
  const modal = document.getElementById('productModal');
  if (modal) modal.classList.add('hidden');
  state.currentModalProduct = null;
}

function updateModalQuantity(delta) {
  const qtyEl = document.getElementById('modalQuantity');
  if (!qtyEl) return;
  let current = parseInt(qtyEl.textContent) || 1;
  current = Math.max(1, Math.min(20, current + delta));
  qtyEl.textContent = current;
  updateModalPrice();
}

function updateModalPrice() {
  if (!state.currentModalProduct) return;
  const qty = parseInt(document.getElementById('modalQuantity').textContent) || 1;
  const basePrice = parseFloat(state.currentModalProduct.sale_price || state.currentModalProduct.price || 0);

  let extrasTotal = 0;
  const modal = document.getElementById('productModal');
  const checkedBoxes = modal.querySelectorAll('input[type="checkbox"]:checked');
  checkedBoxes.forEach(cb => {
    extrasTotal += parseFloat(cb.dataset.extraPrice || 0);
  });

  const total = (basePrice + extrasTotal) * qty;
  const totalEl = document.getElementById('modalTotalPrice');
  if (totalEl) totalEl.textContent = `${total.toFixed(2)}€`;
}

// Attach checkbox listeners in modal
document.addEventListener('change', (e) => {
  if (e.target.matches('#modalExtrasSection input[type="checkbox"]')) {
    updateModalPrice();
  }
});

function addToCartFromModal() {
  if (!state.currentModalProduct) return;

  const qty = parseInt(document.getElementById('modalQuantity').textContent) || 1;
  const basePrice = parseFloat(state.currentModalProduct.sale_price || state.currentModalProduct.price || 0);

  // Extras
  const modal = document.getElementById('productModal');
  const checkedBoxes = modal.querySelectorAll('input[type="checkbox"]:checked');
  const extras = [];
  let extrasTotal = 0;
  checkedBoxes.forEach(cb => {
    const price = parseFloat(cb.dataset.extraPrice || 0);
    extras.push({ name: cb.dataset.extraName, price: price });
    extrasTotal += price;
  });

  // Doneness
  let doneness = null;
  const donenessInput = modal.querySelector('input[name="doneness"]:checked');
  if (donenessInput && !document.getElementById('modalDonenessSection').classList.contains('hidden')) {
    doneness = donenessInput.value;
  }

  // Notes
  const notes = document.getElementById('modalProductNotes').value.trim();

  const itemUnitPrice = basePrice + extrasTotal;

  state.cart.push({
    id: Date.now() + Math.random(),
    product: state.currentModalProduct,
    quantity: qty,
    unitPrice: itemUnitPrice,
    doneness: doneness,
    extras: extras,
    notes: notes
  });

  closeProductModal();
  updateCartUI();
  toggleCartDrawer(true);
}

// Cart Drawer & Calculation
function toggleCartDrawer(open) {
  const drawer = document.getElementById('cartDrawer');
  if (!drawer) return;
  if (open) drawer.classList.remove('hidden');
  else drawer.classList.add('hidden');
}

function setOrderType(type) {
  state.orderType = type;
  const btnDel = document.getElementById('btnOrderDelivery');
  const btnTak = document.getElementById('btnOrderTakeaway');
  const delRow = document.getElementById('cartDeliveryRow');
  const addrGroup = document.getElementById('checkoutAddressGroup');

  if (type === 'delivery') {
    if (btnDel) {
      btnDel.className = "py-2 px-3 text-xs font-bold rounded-lg transition-all bg-brand-gold text-zinc-950";
    }
    if (btnTak) {
      btnTak.className = "py-2 px-3 text-xs font-bold rounded-lg transition-all text-zinc-400 hover:text-white";
    }
    if (delRow) delRow.style.display = 'flex';
    if (addrGroup) addrGroup.style.display = 'block';
  } else {
    if (btnDel) {
      btnDel.className = "py-2 px-3 text-xs font-bold rounded-lg transition-all text-zinc-400 hover:text-white";
    }
    if (btnTak) {
      btnTak.className = "py-2 px-3 text-xs font-bold rounded-lg transition-all bg-brand-gold text-zinc-950";
    }
    if (delRow) delRow.style.display = 'none';
    if (addrGroup) addrGroup.style.display = 'none';
  }

  updateCartUI();
}

function updateCartItemQty(cartIndex, delta) {
  if (!state.cart[cartIndex]) return;
  state.cart[cartIndex].quantity += delta;
  if (state.cart[cartIndex].quantity <= 0) {
    state.cart.splice(cartIndex, 1);
  }
  updateCartUI();
}

function updateCartUI() {
  const totalCount = state.cart.reduce((acc, item) => acc + item.quantity, 0);
  let subtotal = 0;

  state.cart.forEach(item => {
    subtotal += item.unitPrice * item.quantity;
  });

  const packagingFee = state.cart.length > 0 ? 0.25 : 0;
  const deliveryFee = (state.orderType === 'delivery' && state.cart.length > 0) ? parseFloat(state.config.delivery_fee) : 0;
  const finalTotal = subtotal > 0 ? (subtotal + packagingFee + deliveryFee) : 0;

  // Header badges
  const cartBadge = document.getElementById('cartBadgeCount');
  const cartHeaderTotal = document.getElementById('cartHeaderTotal');
  const cartDrawerCount = document.getElementById('cartDrawerCount');

  if (cartBadge) cartBadge.textContent = totalCount;
  if (cartHeaderTotal) cartHeaderTotal.textContent = `${finalTotal.toFixed(2)}€`;
  if (cartDrawerCount) cartDrawerCount.textContent = totalCount;

  // Drawer Summary
  const summarySubtotal = document.getElementById('cartSummarySubtotal');
  const summaryDelivery = document.getElementById('cartSummaryDelivery');
  const summaryTotal = document.getElementById('cartSummaryTotal');
  const checkoutModalTotal = document.getElementById('checkoutModalTotal');

  if (summarySubtotal) summarySubtotal.textContent = `${subtotal.toFixed(2)}€`;
  if (summaryDelivery) summaryDelivery.textContent = `${parseFloat(state.config.delivery_fee).toFixed(2)}€`;
  if (summaryTotal) summaryTotal.textContent = `${finalTotal.toFixed(2)}€`;
  if (checkoutModalTotal) checkoutModalTotal.textContent = `${finalTotal.toFixed(2)}€`;

  // Render items inside drawer
  const list = document.getElementById('cartItemsList');
  if (!list) return;

  if (state.cart.length === 0) {
    list.innerHTML = `
      <div class="text-center py-12 text-zinc-500">
        <i class="fa-solid fa-bag-shopping text-4xl mb-3 text-zinc-700"></i>
        <p class="text-sm font-bold text-zinc-400">O seu carrinho está vazio</p>
        <p class="text-xs mt-1">Escolha hambúrgueres artesanais e adicione ao pedido!</p>
      </div>
    `;
    const btnGo = document.getElementById('btnGoCheckout');
    if (btnGo) btnGo.disabled = true;
    return;
  }

  const btnGo = document.getElementById('btnGoCheckout');
  if (btnGo) btnGo.disabled = false;

  let html = '';
  state.cart.forEach((item, idx) => {
    const itemTotal = (item.unitPrice * item.quantity).toFixed(2);
    html += `
      <div class="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 flex flex-col gap-2">
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1">
            <h4 class="font-heading font-bold text-white text-xs sm:text-sm">${item.product.name}</h4>
            ${item.doneness ? `<span class="text-[10px] text-brand-gold mr-2"><i class="fa-solid fa-fire text-[8px]"></i> ${item.doneness}</span>` : ''}
            ${item.extras && item.extras.length > 0 ? `
              <div class="text-[10px] text-zinc-400 mt-0.5">
                + ${item.extras.map(e => e.name).join(', ')}
              </div>
            ` : ''}
            ${item.notes ? `<div class="text-[10px] italic text-zinc-500 mt-0.5">Obs: "${item.notes}"</div>` : ''}
          </div>
          <span class="text-xs sm:text-sm font-extrabold text-white shrink-0">${itemTotal}€</span>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-zinc-800/60">
          <span class="text-[11px] text-zinc-400">${item.unitPrice.toFixed(2)}€ cada</span>
          <div class="flex items-center border border-zinc-700 rounded-lg bg-zinc-950">
            <button onclick="updateCartItemQty(${idx}, -1)" class="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white">
              <i class="fa-solid fa-minus text-[10px]"></i>
            </button>
            <span class="w-6 text-center text-xs font-bold text-white">${item.quantity}</span>
            <button onclick="updateCartItemQty(${idx}, 1)" class="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white">
              <i class="fa-solid fa-plus text-[10px]"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  });

  list.innerHTML = html;
}

// Checkout Modal & Processing
function openCheckoutModal() {
  if (state.cart.length === 0) return;

  let subtotal = state.cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  if (state.orderType === 'delivery' && subtotal < parseFloat(state.config.min_order)) {
    alert(`O valor mínimo para entrega em Sesimbra é de ${parseFloat(state.config.min_order).toFixed(2)}€. Adicione mais itens para continuar.`);
    return;
  }

  toggleCartDrawer(false);
  const modal = document.getElementById('checkoutModal');
  if (modal) modal.classList.remove('hidden');
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  if (modal) modal.classList.add('hidden');
}

function confirmOrder() {
  const name = document.getElementById('checkoutCustomerName').value.trim();
  const phone = document.getElementById('checkoutCustomerPhone').value.trim();
  const address = document.getElementById('checkoutCustomerAddress').value.trim();
  const paymentMethodInput = document.querySelector('input[name="paymentMethod"]:checked');
  const paymentMethod = paymentMethodInput ? paymentMethodInput.value : 'mbway';

  if (!name) {
    alert('Por favor insira o seu nome.');
    return;
  }
  if (!phone || phone.length < 9) {
    alert('Por favor insira um número de telemóvel válido.');
    return;
  }
  if (state.orderType === 'delivery' && !address) {
    alert('Por favor insira a morada de entrega em Sesimbra.');
    return;
  }

  // Calculate Final Totals
  let subtotal = 0;
  state.cart.forEach(item => subtotal += item.unitPrice * item.quantity);
  const packagingFee = 0.25;
  const deliveryFee = state.orderType === 'delivery' ? parseFloat(state.config.delivery_fee) : 0;
  const total = subtotal + packagingFee + deliveryFee;
  const orderNumber = 'OLT-' + Math.floor(1000 + Math.random() * 9000);

  state.lastOrder = {
    orderNumber,
    name,
    phone,
    address: state.orderType === 'delivery' ? address : 'Levantamento no Balcão (Takeaway)',
    orderType: state.orderType === 'delivery' ? 'Entrega em Casa' : 'Takeaway',
    paymentMethod,
    items: JSON.parse(JSON.stringify(state.cart)),
    subtotal: subtotal.toFixed(2),
    deliveryFee: deliveryFee.toFixed(2),
    total: total.toFixed(2),
    date: new Date().toLocaleString('pt-PT')
  };

  closeCheckoutModal();
  showOrderSuccess(state.lastOrder);
}

function showOrderSuccess(order) {
  const modal = document.getElementById('orderSuccessModal');
  const detailsEl = document.getElementById('orderPaymentDetails');
  if (!modal || !detailsEl) return;

  let paymentHtml = '';
  if (order.paymentMethod === 'mbway') {
    paymentHtml = `
      <div class="text-brand-gold font-bold mb-1 flex items-center gap-1.5">
        <i class="fa-solid fa-mobile-screen-button"></i> Pagamento MB WAY (${order.total}€)
      </div>
      <p class="text-zinc-300">Foi enviado o pedido de pagamento para o telemóvel <strong>${order.phone}</strong>.</p>
      <p class="text-[11px] text-zinc-400">Abra a sua aplicação MB WAY para aceitar a transação da <em>Luckbunny Lda / Oltre</em>.</p>
    `;
  } else if (order.paymentMethod === 'multibanco') {
    paymentHtml = `
      <div class="text-brand-gold font-bold mb-1 flex items-center gap-1.5">
        <i class="fa-solid fa-credit-card"></i> Dados de Pagamento Multibanco (ifthenpay)
      </div>
      <div class="grid grid-cols-3 gap-2 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 text-center my-1.5">
        <div><div class="text-[10px] text-zinc-500">ENTIDADE</div><div class="font-black text-white text-sm">11249</div></div>
        <div><div class="text-[10px] text-zinc-500">REFERÊNCIA</div><div class="font-black text-white text-sm">542 918 021</div></div>
        <div><div class="text-[10px] text-zinc-500">VALOR</div><div class="font-black text-brand-gold text-sm">${order.total}€</div></div>
      </div>
      <p class="text-[11px] text-zinc-400">Pague através do seu homebanking ou caixa Multibanco.</p>
    `;
  } else {
    paymentHtml = `
      <div class="text-brand-gold font-bold mb-1 flex items-center gap-1.5">
        <i class="fa-solid fa-money-bill-wave"></i> Pagamento no Ato da Entrega (${order.total}€)
      </div>
      <p class="text-zinc-300">Prepare o montante para pagamento em numerário ou peça o terminal de Multibanco ao estafeta.</p>
    `;
  }

  detailsEl.innerHTML = `
    <div class="flex justify-between border-b border-zinc-800 pb-2 mb-2">
      <span class="text-zinc-400">Nº Encomenda:</span>
      <span class="font-black text-white">${order.orderNumber}</span>
    </div>
    <div class="flex justify-between text-zinc-400">
      <span>Modalidade:</span>
      <span class="text-white font-medium">${order.orderType}</span>
    </div>
    <div class="flex justify-between text-zinc-400">
      <span>Cliente:</span>
      <span class="text-white font-medium">${order.name} (${order.phone})</span>
    </div>
    ${order.orderType === 'Entrega em Casa' ? `
      <div class="flex justify-between text-zinc-400">
        <span>Morada:</span>
        <span class="text-white font-medium text-right">${order.address}</span>
      </div>
    ` : ''}
    <div class="pt-2 border-t border-zinc-800">
      ${paymentHtml}
    </div>
  `;

  // Empty cart
  state.cart = [];
  updateCartUI();

  modal.classList.remove('hidden');
}

function closeSuccessModal() {
  const modal = document.getElementById('orderSuccessModal');
  if (modal) modal.classList.add('hidden');
}

function sendOrderToWhatsapp() {
  if (!state.lastOrder) return;
  const o = state.lastOrder;

  let text = `*NOVO PEDIDO - OLTRE HAMBURGUERIA SESIMBRA*\n`;
  text += `*Encomenda:* ${o.orderNumber}\n`;
  text += `*Cliente:* ${o.name} (${o.phone})\n`;
  text += `*Tipo:* ${o.orderType}\n`;
  if (o.orderType === 'Entrega em Casa') text += `*Morada:* ${o.address}\n`;
  text += `*Pagamento:* ${o.paymentMethod.toUpperCase()}\n\n`;
  text += `*ITENS DO PEDIDO:*\n`;

  o.items.forEach(i => {
    text += `- ${i.quantity}x ${i.product.name} (${(i.unitPrice * i.quantity).toFixed(2)}€)`;
    if (i.doneness) text += ` [${i.doneness}]`;
    if (i.extras && i.extras.length > 0) text += ` (+${i.extras.map(e => e.name).join(', ')})`;
    if (i.notes) text += ` (Obs: ${i.notes})`;
    text += `\n`;
  });

  text += `\n*TOTAL A PAGAR: ${o.total}€*`;

  const phone = state.config.whatsapp || "351964392320";
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

// ==========================================================
// PAINEL DE GESTÃO RÁPIDA (MODO ADMIN / EDIÇÃO)
// ==========================================================

function toggleAdminBar() {
  const panel = document.getElementById('adminPanel');
  if (!panel) return;
  const isHidden = panel.classList.contains('hidden');
  if (isHidden) {
    panel.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    panel.classList.add('hidden');
  }
}

function switchAdminTab(tab) {
  const contentVisual = document.getElementById('tabContentVisual');
  const contentProds = document.getElementById('tabContentProducts');
  const btnVisual = document.getElementById('tabBtnVisual');
  const btnProds = document.getElementById('tabBtnProducts');

  if (tab === 'visual') {
    contentVisual.classList.remove('hidden');
    contentProds.classList.add('hidden');
    btnVisual.className = "px-4 py-2 rounded-lg text-sm font-medium bg-brand-gold text-zinc-950";
    btnProds.className = "px-4 py-2 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 hover:text-white";
  } else {
    contentVisual.classList.add('hidden');
    contentProds.classList.remove('hidden');
    btnVisual.className = "px-4 py-2 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 hover:text-white";
    btnProds.className = "px-4 py-2 rounded-lg text-sm font-medium bg-brand-gold text-zinc-950";
    renderAdminProductList();
  }
}

function toggleStoreStatus() {
  state.config.is_open = !state.config.is_open;
  updateStoreStatusUI();
}

function populateAdminFields() {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) el.value = val;
  };

  setVal('adminInputStatusText', state.config.status_text || 'Terça a Domingo: 12h00 - 15h00 | 19h00 - 23h00');
  setVal('adminInputTopNotice', state.config.top_notice);
  setVal('adminInputHeroTitle', state.config.hero_title);
  setVal('adminInputHeroSubtitle', state.config.hero_subtitle);
  setVal('adminInputDeliveryFee', state.config.delivery_fee);
  setVal('adminInputMinOrder', state.config.min_order);
  setVal('adminInputPhone', state.config.phone);
  setVal('adminInputBannerUrl', state.config.banner_url || '');

  // Populate category filter
  const catFilter = document.getElementById('adminCategoryFilter');
  const prodCatSelect = document.getElementById('adminEditProdCategory');
  if (catFilter) {
    let opts = `<option value="all">Todas as Categorias</option>`;
    state.categories.forEach(c => {
      opts += `<option value="${c.id}">${c.name}</option>`;
    });
    catFilter.innerHTML = opts;
  }
  if (prodCatSelect) {
    let opts = '';
    state.categories.forEach(c => {
      opts += `<option value="${c.id}">${c.name}</option>`;
    });
    prodCatSelect.innerHTML = opts;
  }

  const countBadge = document.getElementById('adminProductCount');
  if (countBadge) countBadge.textContent = state.products.length;
}

// Render Fast Product Table in Admin
function renderAdminProductList() {
  const tbody = document.getElementById('adminProductsTableBody');
  if (!tbody) return;

  const search = (document.getElementById('adminProductSearch')?.value || '').toLowerCase();
  const catFilter = document.getElementById('adminCategoryFilter')?.value || 'all';

  const filtered = state.products.filter(p => {
    const matchesSearch = !search || (p.name && p.name.toLowerCase().includes(search));
    const matchesCat = catFilter === 'all' || p.category_id == catFilter;
    return matchesSearch && matchesCat;
  });

  let html = '';
  filtered.forEach(p => {
    const isOut = p.is_active === false || p.out_of_stock;
    const fallbackImg = getProductFallbackImage(p);
    html += `
      <tr class="hover:bg-zinc-900/80 transition-colors">
        <td class="py-2.5 px-3 flex items-center gap-2.5">
          <img src="${p.image_url || fallbackImg}" 
               onerror="this.onerror=null;this.src='${fallbackImg}';" 
               class="w-9 h-9 rounded-lg object-cover bg-zinc-900 shrink-0">
          <div>
            <div class="font-bold text-white text-xs">${p.name}</div>
            <div class="text-[10px] text-zinc-500">ID: #${p.id}</div>
          </div>
        </td>
        <td class="py-2.5 px-3 text-zinc-400 text-xs">
          ${p.category_name || 'Geral'}
        </td>
        <td class="py-2.5 px-3">
          <input type="number" step="0.1" value="${p.price || 0}" 
                 onchange="quickUpdatePrice(${p.id}, this.value, false)" 
                 class="w-20 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white font-bold text-xs focus:border-brand-gold">
        </td>
        <td class="py-2.5 px-3">
          <input type="number" step="0.1" value="${p.sale_price || ''}" placeholder="-" 
                 onchange="quickUpdatePrice(${p.id}, this.value, true)" 
                 class="w-20 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-brand-gold font-bold text-xs focus:border-brand-gold">
        </td>
        <td class="py-2.5 px-3 text-center">
          <button onclick="quickToggleStock(${p.id})" class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${isOut ? 'bg-rose-950/80 text-rose-400 border border-rose-800' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'}">
            ${isOut ? 'Esgotado' : 'Disponível'}
          </button>
        </td>
        <td class="py-2.5 px-3 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <button onclick="openAdminProductEditModal(${p.id})" class="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded" title="Editar Detalhes">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="deleteProduct(${p.id})" class="p-1.5 hover:bg-rose-950/60 text-zinc-500 hover:text-rose-400 rounded" title="Eliminar">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function quickUpdatePrice(id, val, isPromo) {
  const p = state.products.find(item => item.id === id);
  if (!p) return;
  const num = val === '' ? null : parseFloat(val);
  if (isPromo) p.sale_price = num;
  else p.price = num;
  renderProducts();
}

function quickToggleStock(id) {
  const p = state.products.find(item => item.id === id);
  if (!p) return;
  p.is_active = (p.is_active === false) ? true : false;
  p.out_of_stock = !p.is_active;
  renderAdminProductList();
  renderProducts();
}

function openAdminProductEditModal(id) {
  const modal = document.getElementById('adminProductEditModal');
  const title = document.getElementById('adminEditModalTitle');
  if (!modal) return;

  if (id) {
    const p = state.products.find(item => item.id === id);
    if (!p) return;
    title.textContent = `Editar: ${p.name}`;
    document.getElementById('adminEditProdId').value = p.id;
    document.getElementById('adminEditProdName').value = p.name;
    document.getElementById('adminEditProdPrice').value = p.price || 0;
    document.getElementById('adminEditProdSalePrice').value = p.sale_price || '';
    document.getElementById('adminEditProdCategory').value = p.category_id || (state.categories[0]?.id || '');
    document.getElementById('adminEditProdDesc').value = p.description || '';
    document.getElementById('adminEditProdImage').value = p.image_url || '';
  } else {
    title.textContent = 'Novo Produto';
    document.getElementById('adminEditProdId').value = '';
    document.getElementById('adminEditProdName').value = '';
    document.getElementById('adminEditProdPrice').value = '10.00';
    document.getElementById('adminEditProdSalePrice').value = '';
    document.getElementById('adminEditProdCategory').value = state.categories[0]?.id || '';
    document.getElementById('adminEditProdDesc').value = '';
    document.getElementById('adminEditProdImage').value = '';
  }

  modal.classList.remove('hidden');
}

function closeAdminProductEditModal() {
  const modal = document.getElementById('adminProductEditModal');
  if (modal) modal.classList.add('hidden');
}

function saveAdminProductDetails() {
  const id = document.getElementById('adminEditProdId').value;
  const name = document.getElementById('adminEditProdName').value.trim();
  const price = parseFloat(document.getElementById('adminEditProdPrice').value) || 0;
  const salePriceVal = document.getElementById('adminEditProdSalePrice').value;
  const salePrice = salePriceVal ? parseFloat(salePriceVal) : null;
  const catId = parseInt(document.getElementById('adminEditProdCategory').value);
  const desc = document.getElementById('adminEditProdDesc').value.trim();
  const img = document.getElementById('adminEditProdImage').value.trim();

  if (!name) {
    alert('O nome do produto é obrigatório.');
    return;
  }

  const category = state.categories.find(c => c.id === catId);
  const catName = category ? category.name : 'Geral';

  if (id) {
    const p = state.products.find(item => item.id == id);
    if (p) {
      p.name = name;
      p.price = price;
      p.sale_price = salePrice;
      p.category_id = catId;
      p.category_name = catName;
      p.description = desc;
      p.image_url = img;
    }
  } else {
    state.products.unshift({
      id: Date.now(),
      name,
      price,
      sale_price: salePrice,
      category_id: catId,
      category_name: catName,
      description: desc,
      image_url: img,
      is_active: true
    });
  }

  closeAdminProductEditModal();
  renderAdminProductList();
  renderCategoryPills();
  renderProducts();
}

function deleteProduct(id) {
  const p = state.products.find(item => item.id === id);
  if (!p) return;
  if (confirm(`Tem a certeza que deseja eliminar "${p.name}"?`)) {
    state.products = state.products.filter(item => item.id !== id);
    renderAdminProductList();
    renderCategoryPills();
    renderProducts();
  }
}

function saveAllChanges() {
  // Sync form inputs to config
  const getVal = (id) => document.getElementById(id)?.value;

  state.config.status_text = getVal('adminInputStatusText');
  state.config.top_notice = getVal('adminInputTopNotice');
  state.config.hero_title = getVal('adminInputHeroTitle');
  state.config.hero_subtitle = getVal('adminInputHeroSubtitle');
  state.config.delivery_fee = parseFloat(getVal('adminInputDeliveryFee')) || 2.50;
  state.config.min_order = parseFloat(getVal('adminInputMinOrder')) || 20.00;
  state.config.phone = getVal('adminInputPhone');
  state.config.banner_url = getVal('adminInputBannerUrl');

  localStorage.setItem('oltre_products', JSON.stringify(state.products));
  localStorage.setItem('oltre_categories', JSON.stringify(state.categories));
  localStorage.setItem('oltre_config', JSON.stringify(state.config));

  applyConfigToUI();
  renderProducts();

  alert('Alterações guardadas com sucesso no navegador! Estão ativas imediatamente.');
}

function resetDefaults() {
  if (confirm('Tem a certeza que deseja restaurar o catálogo e definições originais da Oltre?')) {
    localStorage.removeItem('oltre_products');
    localStorage.removeItem('oltre_categories');
    localStorage.removeItem('oltre_config');
    location.reload();
  }
}
