/**
 * Oltre Hamburgueria - Core Application & Admin Engine 2.0
 * Features:
 * - Dynamic Banner Slider with auto-rotation (between title and categories)
 * - Selectable Layout Types (Grid Moderno, Lista Tradicional, Compacto)
 * - Categories with special promotion highlight
 * - Full CRUD for Products, Categories, Banners, and Extras
 * - Large Delivery & Takeaway Cart Cards with Admin Delivery Toggle
 * - Shopping Cart, Checkout, MB WAY, Multibanco (ifthenpay), and WhatsApp integration
 */

// Fallback high-definition food images for burgers & sides
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
  const cat = (product.categoryName || product.category_name || product.category || '').toLowerCase();
  if (cat.includes('smash') || name.includes('smash')) return FALLBACK_IMAGES.smash;
  if (cat.includes('chicken') || name.includes('chicken') || name.includes('frango')) return FALLBACK_IMAGES.chicken;
  if (cat.includes('entrada') || name.includes('batata') || name.includes('rings') || name.includes('fries')) return FALLBACK_IMAGES.fries;
  if (cat.includes('bebida') || cat.includes('cerveja') || name.includes('cola') || name.includes('cerveja')) return FALLBACK_IMAGES.drink;
  if (cat.includes('sobremesa') || name.includes('cheesecake') || name.includes('brownie') || name.includes('doce')) return FALLBACK_IMAGES.dessert;
  if (cat.includes('burger') || name.includes('burger')) return FALLBACK_IMAGES.burger;
  return FALLBACK_IMAGES.default;
}

// Default Banners for Slider
const DEFAULT_BANNERS = [
  {
    id: 1,
    badge: "PROMOÇÃO DA SEMANA",
    title: "Menu Especial Sesimbra",
    subtitle: "Carne 100% novilho selecionado em pão brioche com batata rústica inclusa",
    btnText: "Ver Promoções",
    categoryTarget: "promocoes",
    imageUrl: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=1600&q=80",
    active: true
  },
  {
    id: 2,
    badge: "OS MAIS PEDIDOS",
    title: "Smash Burgers Artesanais",
    subtitle: "Carne prensada na chapa com crosta caramelizada e queijo cheddar duplo",
    btnText: "Pedir Smash",
    categoryTarget: "smash-burgers",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1600&q=80",
    active: true
  },
  {
    id: 3,
    badge: "NOVIDADE CROCANTE",
    title: "Chicken Burgers Supreme",
    subtitle: "Filete de frango empanado ultra crocante com maionese especial de alho",
    btnText: "Experimentar",
    categoryTarget: "chicken-burgers",
    imageUrl: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=1600&q=80",
    active: true
  }
];

// Default Extras
const DEFAULT_EXTRAS = [
  { id: 1, name: "Bacon Crocante Extra", price: 1.20, active: true },
  { id: 2, name: "Queijo Cheddar Extra", price: 1.00, active: true },
  { id: 3, name: "Dose Extra Molho Oltre", price: 0.80, active: true },
  { id: 4, name: "Ovo Estrelado", price: 1.00, active: true },
  { id: 5, name: "Cebola Caramelizada", price: 0.90, active: true },
  { id: 6, name: "Batata Rústica Extra", price: 2.50, active: true }
];

// Global State
const state = {
  products: [],
  categories: [],
  banners: [],
  extras: [],
  config: {},
  cart: [],
  currentCategory: 'all',
  searchTerm: '',
  orderType: 'delivery',
  currentModalProduct: null,
  currentBannerIndex: 0,
  bannerInterval: null,
  lastOrder: null
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  applyConfigToUI();
  initBannerSlider();
  renderCategoryPills();
  renderProducts();
  updateCartUI();
  populateAdminFields();
  renderAdminProductList();
  renderAdminBannersList();
  renderAdminCategoriesList();
  renderAdminExtrasList();
});

// Load from LocalStorage or Defaults
function loadData() {
  const savedProducts = localStorage.getItem('oltre_products');
  const savedCategories = localStorage.getItem('oltre_categories');
  const savedBanners = localStorage.getItem('oltre_banners');
  const savedExtras = localStorage.getItem('oltre_extras');
  const savedConfig = localStorage.getItem('oltre_config');

  state.products = savedProducts ? JSON.parse(savedProducts) : JSON.parse(JSON.stringify(window.OLTRE_INITIAL_PRODUCTS || []));
  state.categories = savedCategories ? JSON.parse(savedCategories) : JSON.parse(JSON.stringify(window.OLTRE_CATEGORIES || []));
  state.banners = savedBanners ? JSON.parse(savedBanners) : JSON.parse(JSON.stringify(DEFAULT_BANNERS));
  state.extras = savedExtras ? JSON.parse(savedExtras) : JSON.parse(JSON.stringify(DEFAULT_EXTRAS));
  state.config = savedConfig ? JSON.parse(savedConfig) : JSON.parse(JSON.stringify(window.OLTRE_DEFAULT_CONFIG || {}));

  // Ensure config defaults
  state.config.layoutType = state.config.layoutType || 'grid'; // 'grid' | 'list' | 'compact'
  state.config.deliveryEnabled = state.config.deliveryEnabled !== undefined ? state.config.deliveryEnabled : true;
  state.config.isOpen = state.config.isOpen !== undefined ? state.config.isOpen : true;
  state.config.deliveryFee = state.config.deliveryFee !== undefined ? state.config.deliveryFee : 2.50;
  state.config.minOrder = state.config.minOrder !== undefined ? state.config.minOrder : 20.00;
  state.config.phone = state.config.phone || "216 028 131";
  state.config.whatsapp = state.config.whatsapp || "351964392320";
  state.config.heroSubtitle = state.config.heroSubtitle || "Hamburgueria Artesanal • Sesimbra";
  state.config.topNotice = state.config.topNotice || "Entregas e Takeaway em Sesimbra | Pagamento seguro por MB WAY e Multibanco";

  if (!state.config.deliveryEnabled) {
    state.orderType = 'takeaway';
  }
}

// Apply Store Configuration to UI
function applyConfigToUI() {
  // Top Notice
  const topNoticeEl = document.getElementById('topNoticeText');
  if (topNoticeEl) topNoticeEl.textContent = state.config.topNotice;

  // Hero Subtitle
  const heroSubEl = document.getElementById('heroSubtitle');
  if (heroSubEl) heroSubEl.textContent = state.config.heroSubtitle;

  // Delivery Badge in Hero
  const heroDeliveryBadge = document.getElementById('heroDeliveryBadge');
  if (heroDeliveryBadge) {
    if (state.config.deliveryEnabled) {
      heroDeliveryBadge.textContent = `Entrega em Sesimbra (${parseFloat(state.config.deliveryFee).toFixed(2)}€)`;
    } else {
      heroDeliveryBadge.textContent = "Apenas Takeaway no momento";
    }
  }

  // Cart Delivery Fee Label
  const cartDelFeeLabel = document.getElementById('cartDeliveryFeeLabel');
  if (cartDelFeeLabel) {
    cartDelFeeLabel.textContent = `+${parseFloat(state.config.deliveryFee).toFixed(2)}€ (Sesimbra)`;
  }

  // Nav Contact
  const navPhoneEl = document.getElementById('navPhone');
  if (navPhoneEl) navPhoneEl.textContent = state.config.phone;

  const footerPhoneEl = document.getElementById('footerPhone');
  if (footerPhoneEl) footerPhoneEl.innerHTML = `<i class="fa-solid fa-phone text-brand-gold mr-1.5"></i> ${state.config.phone}`;

  updateStoreStatusUI();
  updateDeliveryUI();
}

function updateStoreStatusUI() {
  const dot = document.getElementById('navStatusDot');
  const label = document.getElementById('navStatusLabel');
  const heroStatus = document.getElementById('heroStoreStatus');
  const adminBtn = document.getElementById('btnToggleStatus');

  if (state.config.isOpen) {
    if (dot) dot.className = "w-2.5 h-2.5 rounded-full bg-emerald-500 badge-pulse";
    if (label) {
      label.className = "text-zinc-300 font-medium";
      label.textContent = "Aberto para Pedidos";
    }
    if (heroStatus) heroStatus.textContent = "Aberto para Pedidos";
    if (adminBtn) {
      adminBtn.className = "flex-1 py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
      adminBtn.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500"></span> Aberto para Pedidos`;
    }
  } else {
    if (dot) dot.className = "w-2.5 h-2.5 rounded-full bg-rose-500";
    if (label) {
      label.className = "text-rose-400 font-medium";
      label.textContent = "Fechado Temporariamente";
    }
    if (heroStatus) heroStatus.textContent = "Fechado Temporariamente";
    if (adminBtn) {
      adminBtn.className = "flex-1 py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all bg-rose-500/20 text-rose-400 border border-rose-500/30";
      adminBtn.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-500"></span> Fechado Agora`;
    }
  }
}

function updateDeliveryUI() {
  const btnDel = document.getElementById('btnOrderDelivery');
  const notice = document.getElementById('cartDeliveryDisabledNotice');
  const adminBtn = document.getElementById('btnToggleDeliveryActive');

  if (state.config.deliveryEnabled) {
    if (btnDel) {
      btnDel.classList.remove('opacity-40', 'pointer-events-none');
    }
    if (notice) notice.classList.add('hidden');
    if (adminBtn) {
      adminBtn.className = "px-4 py-2 rounded-lg font-bold text-xs transition-all bg-emerald-600 hover:bg-emerald-500 text-white";
      adminBtn.textContent = "Entrega Ativada";
    }
  } else {
    if (btnDel) {
      btnDel.classList.add('opacity-40', 'pointer-events-none');
    }
    if (notice) notice.classList.remove('hidden');
    if (adminBtn) {
      adminBtn.className = "px-4 py-2 rounded-lg font-bold text-xs transition-all bg-zinc-800 hover:bg-zinc-700 text-zinc-400";
      adminBtn.textContent = "Entrega Desativada (Apenas Takeaway)";
    }
    setOrderType('takeaway');
  }
}

function toggleDeliveryService() {
  state.config.deliveryEnabled = !state.config.deliveryEnabled;
  updateDeliveryUI();
  applyConfigToUI();
}

function toggleStoreStatus() {
  state.config.isOpen = !state.config.isOpen;
  updateStoreStatusUI();
}

// ==========================================================
// BANNER SLIDER ENGINE (DESLIZA A CADA 4 SEGUNDOS)
// ==========================================================

function initBannerSlider() {
  renderBannerSlider();
  startBannerAutoSlide();
}

function startBannerAutoSlide() {
  if (state.bannerInterval) clearInterval(state.bannerInterval);
  state.bannerInterval = setInterval(() => {
    nextBanner();
  }, 4000); // 4 seconds auto slide
}

function renderBannerSlider() {
  const track = document.getElementById('bannerSliderTrack');
  const dotsContainer = document.getElementById('bannerSliderDots');
  if (!track) return;

  const activeBanners = state.banners.filter(b => b.active !== false);
  if (activeBanners.length === 0) {
    track.parentElement.classList.add('hidden');
    return;
  }
  track.parentElement.classList.remove('hidden');

  let htmlSlides = '';
  activeBanners.forEach((banner, idx) => {
    htmlSlides += `
      <div class="banner-slide relative flex-shrink-0 w-full h-full bg-cover bg-center overflow-hidden flex items-center" 
           style="background-image: url('${banner.imageUrl}');">
        <div class="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent"></div>
        
        <div class="relative z-10 p-6 sm:p-10 md:p-14 max-w-xl">
          ${banner.badge ? `
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-gold text-zinc-950 font-black text-[10px] sm:text-xs uppercase tracking-wider mb-2.5 sm:mb-3 shadow-md">
              <i class="fa-solid fa-fire"></i> ${banner.badge}
            </span>
          ` : ''}
          <h2 class="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-2 sm:mb-3 drop-shadow-md">
            ${banner.title}
          </h2>
          <p class="text-xs sm:text-sm text-zinc-300 mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-none max-w-md">
            ${banner.subtitle}
          </p>
          ${banner.btnText ? `
            <button onclick="handleBannerClick('${banner.categoryTarget || 'all'}')" class="px-5 py-2.5 bg-brand-gold hover:bg-brand-goldHover text-zinc-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-brand-gold/20 flex items-center gap-2 transition-all transform active:scale-95">
              <span>${banner.btnText}</span>
              <i class="fa-solid fa-arrow-right text-xs"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  });

  track.innerHTML = htmlSlides;

  // Dots
  if (dotsContainer) {
    let htmlDots = '';
    activeBanners.forEach((_, idx) => {
      htmlDots += `
        <button onclick="goToBanner(${idx})" class="w-2.5 h-2.5 rounded-full transition-all ${idx === state.currentBannerIndex ? 'bg-brand-gold w-6' : 'bg-white/40 hover:bg-white/70'}">
        </button>
      `;
    });
    dotsContainer.innerHTML = htmlDots;
  }

  updateBannerSlidePosition();
}

function updateBannerSlidePosition() {
  const track = document.getElementById('bannerSliderTrack');
  const dotsContainer = document.getElementById('bannerSliderDots');
  if (!track) return;

  const activeBanners = state.banners.filter(b => b.active !== false);
  if (activeBanners.length === 0) return;

  if (state.currentBannerIndex >= activeBanners.length) {
    state.currentBannerIndex = 0;
  }
  if (state.currentBannerIndex < 0) {
    state.currentBannerIndex = activeBanners.length - 1;
  }

  track.style.transform = `translateX(-${state.currentBannerIndex * 100}%)`;

  // Update dots
  if (dotsContainer) {
    const dots = dotsContainer.querySelectorAll('button');
    dots.forEach((dot, idx) => {
      if (idx === state.currentBannerIndex) {
        dot.className = "w-6 h-2.5 rounded-full bg-brand-gold transition-all shadow-md";
      } else {
        dot.className = "w-2.5 h-2.5 rounded-full bg-white/40 hover:bg-white/70 transition-all";
      }
    });
  }
}

function nextBanner() {
  const activeBanners = state.banners.filter(b => b.active !== false);
  if (activeBanners.length <= 1) return;
  state.currentBannerIndex = (state.currentBannerIndex + 1) % activeBanners.length;
  updateBannerSlidePosition();
}

function prevBanner() {
  const activeBanners = state.banners.filter(b => b.active !== false);
  if (activeBanners.length <= 1) return;
  state.currentBannerIndex = (state.currentBannerIndex - 1 + activeBanners.length) % activeBanners.length;
  updateBannerSlidePosition();
}

function goToBanner(idx) {
  state.currentBannerIndex = idx;
  updateBannerSlidePosition();
  startBannerAutoSlide(); // reset timer
}

function handleBannerClick(targetCategory) {
  if (targetCategory && targetCategory !== 'all') {
    selectCategory(targetCategory);
  }
  const productsArea = document.getElementById('productsGrid');
  if (productsArea) {
    productsArea.scrollIntoView({ behavior: 'smooth' });
  }
}

// ==========================================================
// SELEÇÃO DE TIPO DE LAYOUT (GRID, LISTA, COMPACTO)
// ==========================================================

function setLayoutType(type) {
  state.config.layoutType = type;
  renderProducts();
  populateAdminFields();
}

// ==========================================================
// CATEGORIAS & DESTAQUE DE PROMOÇÕES
// ==========================================================

function renderCategoryPills() {
  const container = document.getElementById('categoryPills');
  if (!container) return;

  let html = `
    <button onclick="selectCategory('all')" class="category-pill px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${state.currentCategory === 'all' ? 'bg-brand-gold text-zinc-950 shadow-md shadow-brand-gold/20' : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'}">
      <i class="fa-solid fa-list-ul mr-1.5"></i> Todos (${state.products.length})
    </button>
  `;

  state.categories.forEach(cat => {
    const count = state.products.filter(p => p.category_id === cat.id || p.category === cat.id || p.categoryName === cat.name).length;
    const isSelected = state.currentCategory === cat.id;
    const isPromo = cat.isPromo || cat.id === 'promocoes' || (cat.name && cat.name.toLowerCase().includes('promo'));

    if (isPromo) {
      // Destaque visual dourado com fogo
      html += `
        <button onclick="selectCategory('${cat.id}')" class="category-pill px-4 py-2 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all border-2 border-brand-gold ${isSelected ? 'bg-brand-gold text-zinc-950 shadow-lg shadow-brand-gold/30 scale-105' : 'bg-brand-gold/15 text-brand-gold hover:bg-brand-gold hover:text-zinc-950'}">
          ${cat.icon || '🔥'} ${cat.name} (${count})
        </button>
      `;
    } else {
      html += `
        <button onclick="selectCategory('${cat.id}')" class="category-pill px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${isSelected ? 'bg-brand-gold text-zinc-950 shadow-md shadow-brand-gold/20' : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'}">
          ${cat.icon || ''} ${cat.name} (${count})
        </button>
      `;
    }
  });

  container.innerHTML = html;
}

function selectCategory(catId) {
  state.currentCategory = catId;
  renderCategoryPills();

  const titleEl = document.getElementById('currentCategoryTitle');
  const descEl = document.getElementById('currentCategoryDesc');

  if (catId === 'all') {
    if (titleEl) titleEl.textContent = "Menu Completo";
    if (descEl) descEl.textContent = "Explore o cardápio completo da Oltre Hamburgueria Sesimbra.";
  } else {
    const cat = state.categories.find(c => c.id == catId);
    if (cat) {
      if (titleEl) titleEl.textContent = `${cat.icon ? cat.icon + ' ' : ''}${cat.name}`;
      if (descEl) descEl.textContent = cat.isPromo || cat.id === 'promocoes' ? "Aproveite as ofertas exclusivas e promoções da Oltre Sesimbra!" : `Deliciosas opções artesanais da categoria ${cat.name}.`;
    }
  }

  renderProducts();
}

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

// ==========================================================
// RENDERIZAÇÃO DOS PRODUTOS (LAYOUT GRID, LISTA OU COMPACTO)
// ==========================================================

function renderProducts() {
  const container = document.getElementById('productsGrid');
  const emptyState = document.getElementById('emptyState');
  const counter = document.getElementById('productCounter');
  if (!container) return;

  const layout = state.config.layoutType || 'grid';

  // Configurar classes de grelha conforme o tipo de layout
  if (layout === 'grid') {
    container.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6";
  } else if (layout === 'list') {
    container.className = "flex flex-col gap-4 max-w-4xl mx-auto";
  } else if (layout === 'compact') {
    container.className = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4";
  }

  let filtered = state.products.filter(p => {
    const catMatch = state.currentCategory === 'all' || 
      p.category === state.currentCategory || 
      p.category_id == state.currentCategory || 
      p.categoryName === state.currentCategory;
    
    const searchMatch = !state.searchTerm || 
      (p.name && p.name.toLowerCase().includes(state.searchTerm)) ||
      (p.description && p.description.toLowerCase().includes(state.searchTerm));
    
    return catMatch && searchMatch;
  });

  if (counter) counter.textContent = `${filtered.length} itens`;

  if (filtered.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  let html = '';
  filtered.forEach(p => {
    const price = parseFloat(p.price || 0).toFixed(2);
    const salePrice = p.salePrice || p.sale_price ? parseFloat(p.salePrice || p.sale_price).toFixed(2) : null;
    const isOutOfStock = p.is_active === false || p.inStock === false || p.out_of_stock;
    const fallbackImg = getProductFallbackImage(p);
    const imgUrl = p.image || p.image_url || fallbackImg;

    if (layout === 'list') {
      // 2. LAYOUT LISTA / MENU TRADICIONAL
      html += `
        <div class="bg-brand-darkCard border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 transition-all flex items-center justify-between gap-4 shadow-md group">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="font-heading font-black text-base sm:text-lg text-white group-hover:text-brand-gold transition-colors truncate cursor-pointer" onclick="openProductModal(${p.id})">
                ${p.name}
              </h3>
              ${isOutOfStock ? `
                <span class="px-2 py-0.5 rounded bg-rose-950 text-rose-400 text-[10px] font-bold uppercase">Esgotado</span>
              ` : salePrice ? `
                <span class="px-2 py-0.5 rounded bg-brand-gold text-zinc-950 text-[10px] font-black uppercase">Promo</span>
              ` : ''}
            </div>
            <p class="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-2">
              ${p.description || 'Hambúrguer artesanal preparado na hora com produtos frescos e de primeira qualidade.'}
            </p>
            <div class="flex items-baseline gap-2">
              ${salePrice ? `
                <span class="text-base font-black text-brand-gold">${salePrice}€</span>
                <span class="text-xs text-zinc-500 line-through">${price}€</span>
              ` : `
                <span class="text-base font-black text-white">${price}€</span>
              `}
            </div>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 cursor-pointer" onclick="openProductModal(${p.id})">
              <img src="${imgUrl}" onerror="this.onerror=null;this.src='${fallbackImg}';" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${isOutOfStock ? 'opacity-40 grayscale' : ''}">
            </div>
            ${isOutOfStock ? `
              <button disabled class="w-9 h-9 rounded-xl bg-zinc-800 text-zinc-500 flex items-center justify-center cursor-not-allowed">
                <i class="fa-solid fa-ban text-xs"></i>
              </button>
            ` : `
              <button onclick="openProductModal(${p.id})" class="w-9 h-9 sm:px-3 sm:py-2 sm:w-auto rounded-xl bg-brand-gold hover:bg-brand-goldHover text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-brand-gold/15 transition-all transform active:scale-95">
                <i class="fa-solid fa-plus"></i>
                <span class="hidden sm:inline">Adicionar</span>
              </button>
            `}
          </div>
        </div>
      `;
    } else if (layout === 'compact') {
      // 3. LAYOUT COMPACTO
      html += `
        <div class="bg-brand-darkCard border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all group flex flex-col justify-between shadow-md">
          <div class="h-32 sm:h-36 bg-zinc-900 overflow-hidden relative cursor-pointer" onclick="openProductModal(${p.id})">
            <img src="${imgUrl}" onerror="this.onerror=null;this.src='${fallbackImg}';" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${isOutOfStock ? 'opacity-40 grayscale' : ''}">
            ${isOutOfStock ? `
              <span class="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-rose-950/90 text-rose-300 text-[9px] font-bold uppercase">Esgotado</span>
            ` : salePrice ? `
              <span class="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-brand-gold text-zinc-950 text-[9px] font-black uppercase">Promo</span>
            ` : ''}
          </div>
          <div class="p-3 flex flex-col flex-1 justify-between">
            <div>
              <h3 class="font-heading font-bold text-xs sm:text-sm text-white line-clamp-1 group-hover:text-brand-gold cursor-pointer" onclick="openProductModal(${p.id})">
                ${p.name}
              </h3>
            </div>
            <div class="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/60">
              <span class="text-xs sm:text-sm font-black text-white">${salePrice || price}€</span>
              ${isOutOfStock ? `
                <span class="text-[10px] text-zinc-500 font-bold">Sem Stock</span>
              ` : `
                <button onclick="openProductModal(${p.id})" class="w-7 h-7 rounded-lg bg-brand-gold text-zinc-950 flex items-center justify-center text-xs font-bold shadow transition-all active:scale-90">
                  <i class="fa-solid fa-plus"></i>
                </button>
              `}
            </div>
          </div>
        </div>
      `;
    } else {
      // 1. LAYOUT GRID MODERNO (PADRÃO)
      html += `
        <div class="bg-brand-darkCard border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all group flex flex-col justify-between shadow-xl relative">
          ${isOutOfStock ? `
            <div class="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-rose-950/90 border border-rose-600 text-rose-300 text-[10px] font-bold uppercase tracking-wider shadow">
              Esgotado
            </div>
          ` : salePrice ? `
            <div class="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-brand-gold text-zinc-950 text-[10px] font-black uppercase tracking-wider shadow">
              Promoção
            </div>
          ` : ''}

          <div>
            <div class="h-48 sm:h-52 bg-zinc-900 overflow-hidden relative cursor-pointer" onclick="openProductModal(${p.id})">
              <img src="${imgUrl}" onerror="this.onerror=null;this.src='${fallbackImg}';" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${isOutOfStock ? 'opacity-40 grayscale' : ''}">
              <div class="absolute inset-0 bg-gradient-to-t from-brand-darkCard via-transparent to-transparent opacity-60"></div>
            </div>

            <div class="p-4 sm:p-5">
              <div class="flex items-start justify-between gap-2 mb-1.5">
                <h3 class="font-heading font-black text-base sm:text-lg text-white group-hover:text-brand-gold transition-colors cursor-pointer" onclick="openProductModal(${p.id})">
                  ${p.name}
                </h3>
              </div>
              <p class="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-4">
                ${p.description || 'Hambúrguer artesanal preparado na hora com produtos selecionados.'}
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
              <button onclick="openProductModal(${p.id})" class="px-4 py-2 rounded-xl bg-brand-gold hover:bg-brand-goldHover text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-brand-gold/15 transition-all transform active:scale-95">
                <i class="fa-solid fa-plus"></i>
                <span>Adicionar</span>
              </button>
            `}
          </div>
        </div>
      `;
    }
  });

  container.innerHTML = html;
}

// ==========================================================
// MODAL DE PRODUTO & ADICIONAIS EXTRAS DINÂMICOS
// ==========================================================

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
  const extrasList = document.getElementById('modalExtrasList');

  const fallbackImg = getProductFallbackImage(product);
  if (img) {
    img.src = product.image || product.image_url || fallbackImg;
    img.onerror = () => { img.src = fallbackImg; };
  }

  if (name) name.textContent = product.name;
  if (desc) desc.textContent = product.description || "Hambúrguer artesanal preparado com ingredientes selecionados.";
  if (badge) badge.textContent = product.categoryName || product.category || "Oltre";
  if (qty) qty.textContent = "1";
  if (notes) notes.value = "";

  // Mostra ponto da carne se for hambúrguer
  const catName = (product.categoryName || product.category || '').toLowerCase();
  const prodName = (product.name || '').toLowerCase();
  const isBurger = catName.includes('burger') || prodName.includes('burger');
  if (donenessSection) {
    if (isBurger && !catName.includes('chicken') && !catName.includes('bebida') && !catName.includes('sobremesa')) {
      donenessSection.classList.remove('hidden');
    } else {
      donenessSection.classList.add('hidden');
    }
  }

  // Renderizar extras dinâmicos
  if (extrasList) {
    const activeExtras = state.extras.filter(e => e.active !== false);
    if (activeExtras.length === 0) {
      extrasList.parentElement.classList.add('hidden');
    } else {
      extrasList.parentElement.classList.remove('hidden');
      let htmlExtras = '';
      activeExtras.forEach(ext => {
        htmlExtras += `
          <label class="flex items-center justify-between p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-all">
            <div class="flex items-center gap-2.5">
              <input type="checkbox" data-extra-name="${ext.name}" data-extra-price="${ext.price}" class="rounded border-zinc-700 bg-zinc-800 text-brand-gold focus:ring-0">
              <span class="text-xs text-zinc-300 font-medium">${ext.name}</span>
            </div>
            <span class="text-xs font-bold text-brand-gold">+${parseFloat(ext.price).toFixed(2)}€</span>
          </label>
        `;
      });
      extrasList.innerHTML = htmlExtras;
    }
  }

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
  const basePrice = parseFloat(state.currentModalProduct.salePrice || state.currentModalProduct.sale_price || state.currentModalProduct.price || 0);

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

document.addEventListener('change', (e) => {
  if (e.target.matches('#modalExtrasList input[type="checkbox"]')) {
    updateModalPrice();
  }
});

function addToCartFromModal() {
  if (!state.currentModalProduct) return;

  const qty = parseInt(document.getElementById('modalQuantity').textContent) || 1;
  const basePrice = parseFloat(state.currentModalProduct.salePrice || state.currentModalProduct.sale_price || state.currentModalProduct.price || 0);

  const modal = document.getElementById('productModal');
  const checkedBoxes = modal.querySelectorAll('input[type="checkbox"]:checked');
  const extras = [];
  let extrasTotal = 0;
  checkedBoxes.forEach(cb => {
    const price = parseFloat(cb.dataset.extraPrice || 0);
    extras.push({ name: cb.dataset.extraName, price: price });
    extrasTotal += price;
  });

  let doneness = null;
  const donenessInput = modal.querySelector('input[name="doneness"]:checked');
  if (donenessInput && !document.getElementById('modalDonenessSection').classList.contains('hidden')) {
    doneness = donenessInput.value;
  }

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

// ==========================================================
// CARRINHO & OPÇÕES GRANDES DE ENTREGA/TAKEAWAY
// ==========================================================

function toggleCartDrawer(open) {
  const drawer = document.getElementById('cartDrawer');
  if (!drawer) return;
  if (open) drawer.classList.remove('hidden');
  else drawer.classList.add('hidden');
}

function setOrderType(type) {
  if (type === 'delivery' && !state.config.deliveryEnabled) {
    alert('As entregas ao domicílio estão desativadas no momento. Por favor selecione Takeaway.');
    return;
  }

  state.orderType = type;
  const btnDel = document.getElementById('btnOrderDelivery');
  const btnTak = document.getElementById('btnOrderTakeaway');
  const delRow = document.getElementById('cartDeliveryRow');
  const addrGroup = document.getElementById('checkoutAddressGroup');

  if (type === 'delivery') {
    if (btnDel) {
      btnDel.className = "p-3.5 rounded-xl border-2 transition-all flex flex-col items-center text-center bg-brand-gold/15 border-brand-gold text-white shadow-md shadow-brand-gold/15 ring-2 ring-brand-gold/30";
      btnDel.querySelector('div').className = "w-10 h-10 rounded-full bg-brand-gold/20 text-brand-gold flex items-center justify-center text-lg mb-1.5";
    }
    if (btnTak) {
      btnTak.className = "p-3.5 rounded-xl border-2 transition-all flex flex-col items-center text-center bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700";
      btnTak.querySelector('div').className = "w-10 h-10 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-lg mb-1.5";
    }
    if (delRow) delRow.style.display = 'flex';
    if (addrGroup) addrGroup.style.display = 'block';
  } else {
    if (btnDel) {
      btnDel.className = "p-3.5 rounded-xl border-2 transition-all flex flex-col items-center text-center bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700";
      btnDel.querySelector('div').className = "w-10 h-10 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-lg mb-1.5";
    }
    if (btnTak) {
      btnTak.className = "p-3.5 rounded-xl border-2 transition-all flex flex-col items-center text-center bg-brand-gold/15 border-brand-gold text-white shadow-md shadow-brand-gold/15 ring-2 ring-brand-gold/30";
      btnTak.querySelector('div').className = "w-10 h-10 rounded-full bg-brand-gold/20 text-brand-gold flex items-center justify-center text-lg mb-1.5";
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
  const deliveryFee = (state.orderType === 'delivery' && state.cart.length > 0 && state.config.deliveryEnabled) ? parseFloat(state.config.deliveryFee) : 0;
  const finalTotal = subtotal > 0 ? (subtotal + packagingFee + deliveryFee) : 0;

  // Badges & Counters
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
  if (summaryDelivery) summaryDelivery.textContent = `${deliveryFee.toFixed(2)}€`;
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

// Checkout Processing
function openCheckoutModal() {
  if (state.cart.length === 0) return;

  let subtotal = state.cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  if (state.orderType === 'delivery' && subtotal < parseFloat(state.config.minOrder)) {
    alert(`O valor mínimo para entrega em Sesimbra é de ${parseFloat(state.config.minOrder).toFixed(2)}€. Adicione mais itens para continuar.`);
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

  let subtotal = 0;
  state.cart.forEach(item => subtotal += item.unitPrice * item.quantity);
  const packagingFee = 0.25;
  const deliveryFee = (state.orderType === 'delivery' && state.config.deliveryEnabled) ? parseFloat(state.config.deliveryFee) : 0;
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
// PAINEL DE GESTÃO RÁPIDA (MODO ADMIN)
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
  const tabs = ['visual', 'layout', 'banners', 'categories', 'products', 'extras'];
  tabs.forEach(t => {
    const content = document.getElementById(`tabContent${capitalize(t)}`);
    const btn = document.getElementById(`tabBtn${capitalize(t)}`);
    if (t === tab) {
      if (content) content.classList.remove('hidden');
      if (btn) btn.className = "px-3 py-2 rounded-lg text-xs font-semibold bg-brand-gold text-zinc-950 shadow";
    } else {
      if (content) content.classList.add('hidden');
      if (btn) btn.className = "px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-300 hover:text-white";
    }
  });

  if (tab === 'products') renderAdminProductList();
  if (tab === 'banners') renderAdminBannersList();
  if (tab === 'categories') renderAdminCategoriesList();
  if (tab === 'extras') renderAdminExtrasList();
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function populateAdminFields() {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) el.value = val;
  };

  setVal('adminInputStatusText', state.config.statusText || 'Terça a Domingo: 12h00 - 15h00 | 19h00 - 23h00');
  setVal('adminInputTopNotice', state.config.topNotice);
  setVal('adminInputHeroSubtitle', state.config.heroSubtitle);
  setVal('adminInputDeliveryFee', state.config.deliveryFee);
  setVal('adminInputMinOrder', state.config.minOrder);
  setVal('adminInputPhone', state.config.phone);
  setVal('adminInputWhatsapp', state.config.whatsapp);

  // Set layout radio
  const layoutRadios = document.querySelectorAll('input[name="adminLayoutChoice"]');
  layoutRadios.forEach(radio => {
    radio.checked = radio.value === (state.config.layoutType || 'grid');
  });

  // Update Counters
  const countProd = document.getElementById('adminProductCount');
  const countBan = document.getElementById('adminBannerCount');
  const countCat = document.getElementById('adminCategoryCount');
  const countExt = document.getElementById('adminExtrasCount');

  if (countProd) countProd.textContent = state.products.length;
  if (countBan) countBan.textContent = state.banners.length;
  if (countCat) countCat.textContent = state.categories.length;
  if (countExt) countExt.textContent = state.extras.length;

  // Populate category filters in modals & tables
  const catFilter = document.getElementById('adminCategoryFilter');
  const prodCatSelect = document.getElementById('adminEditProdCategory');
  const banCatSelect = document.getElementById('adminBannerCategorySelect');

  let opts = `<option value="all">Todas as Categorias</option>`;
  state.categories.forEach(c => {
    opts += `<option value="${c.id}">${c.name}</option>`;
  });

  if (catFilter) catFilter.innerHTML = opts;
  if (prodCatSelect) prodCatSelect.innerHTML = opts;
  if (banCatSelect) banCatSelect.innerHTML = opts;
}

// ----------------------------------------------------------
// ADMIN: PRODUTOS
// ----------------------------------------------------------
function renderAdminProductList() {
  const tbody = document.getElementById('adminProductsTableBody');
  if (!tbody) return;

  const search = (document.getElementById('adminProductSearch')?.value || '').toLowerCase();
  const catFilter = document.getElementById('adminCategoryFilter')?.value || 'all';

  const filtered = state.products.filter(p => {
    const matchesSearch = !search || (p.name && p.name.toLowerCase().includes(search));
    const matchesCat = catFilter === 'all' || p.category_id == catFilter || p.category == catFilter;
    return matchesSearch && matchesCat;
  });

  let html = '';
  filtered.forEach(p => {
    const isOut = p.is_active === false || p.inStock === false || p.out_of_stock;
    const fallbackImg = getProductFallbackImage(p);
    const imgUrl = p.image || p.image_url || fallbackImg;
    const price = p.price || 0;
    const salePrice = p.salePrice || p.sale_price || '';

    html += `
      <tr class="hover:bg-zinc-900/80 transition-colors">
        <td class="py-2.5 px-3 flex items-center gap-2.5">
          <img src="${imgUrl}" onerror="this.onerror=null;this.src='${fallbackImg}';" class="w-9 h-9 rounded-lg object-cover bg-zinc-900 shrink-0">
          <div>
            <div class="font-bold text-white text-xs">${p.name}</div>
            <div class="text-[10px] text-zinc-500">ID: #${p.id}</div>
          </div>
        </td>
        <td class="py-2.5 px-3 text-zinc-400 text-xs">
          ${p.categoryName || p.category || 'Geral'}
        </td>
        <td class="py-2.5 px-3">
          <input type="number" step="0.1" value="${price}" 
                 onchange="quickUpdatePrice(${p.id}, this.value, false)" 
                 class="w-20 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white font-bold text-xs focus:border-brand-gold">
        </td>
        <td class="py-2.5 px-3">
          <input type="number" step="0.1" value="${salePrice}" placeholder="-" 
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
  if (isPromo) {
    p.salePrice = num;
    p.sale_price = num;
  } else {
    p.price = num;
  }
  renderProducts();
}

function quickToggleStock(id) {
  const p = state.products.find(item => item.id === id);
  if (!p) return;
  const currentInStock = !(p.is_active === false || p.inStock === false || p.out_of_stock);
  p.is_active = !currentInStock;
  p.inStock = !currentInStock;
  p.out_of_stock = currentInStock;
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
    document.getElementById('adminEditProdSalePrice').value = p.salePrice || p.sale_price || '';
    document.getElementById('adminEditProdCategory').value = p.category || p.category_id || (state.categories[0]?.id || '');
    document.getElementById('adminEditProdDesc').value = p.description || '';
    document.getElementById('adminEditProdImage').value = p.image || p.image_url || '';
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
  const catVal = document.getElementById('adminEditProdCategory').value;
  const desc = document.getElementById('adminEditProdDesc').value.trim();
  const img = document.getElementById('adminEditProdImage').value.trim();

  if (!name) {
    alert('O nome do produto é obrigatório.');
    return;
  }

  const categoryObj = state.categories.find(c => c.id == catVal);
  const catName = categoryObj ? categoryObj.name : 'Geral';

  if (id) {
    const p = state.products.find(item => item.id == id);
    if (p) {
      p.name = name;
      p.price = price;
      p.salePrice = salePrice;
      p.sale_price = salePrice;
      p.category = catVal;
      p.category_id = catVal;
      p.categoryName = catName;
      p.description = desc;
      p.image = img;
      p.image_url = img;
    }
  } else {
    state.products.unshift({
      id: Date.now(),
      name,
      price,
      salePrice,
      sale_price: salePrice,
      category: catVal,
      category_id: catVal,
      categoryName: catName,
      description: desc,
      image: img,
      image_url: img,
      inStock: true,
      is_active: true
    });
  }

  closeAdminProductEditModal();
  renderAdminProductList();
  renderCategoryPills();
  renderProducts();
  populateAdminFields();
}

function deleteProduct(id) {
  const p = state.products.find(item => item.id === id);
  if (!p) return;
  if (confirm(`Tem a certeza que deseja eliminar "${p.name}"?`)) {
    state.products = state.products.filter(item => item.id !== id);
    renderAdminProductList();
    renderCategoryPills();
    renderProducts();
    populateAdminFields();
  }
}

// ----------------------------------------------------------
// ADMIN: BANNERS DO SLIDER
// ----------------------------------------------------------
function renderAdminBannersList() {
  const container = document.getElementById('adminBannersList');
  if (!container) return;

  let html = '';
  state.banners.forEach(b => {
    html += `
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden p-3 flex flex-col justify-between">
        <div class="h-24 rounded-lg overflow-hidden bg-zinc-950 relative mb-2">
          <img src="${b.imageUrl}" class="w-full h-full object-cover">
          <div class="absolute inset-0 bg-black/40"></div>
          <span class="absolute top-2 left-2 text-[9px] font-black uppercase px-2 py-0.5 rounded bg-brand-gold text-zinc-950">${b.badge || 'Banner'}</span>
        </div>
        <div>
          <h4 class="font-bold text-white text-xs">${b.title}</h4>
          <p class="text-[10px] text-zinc-400 line-clamp-1">${b.subtitle}</p>
        </div>
        <div class="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800">
          <button onclick="toggleBannerActive(${b.id})" class="text-[10px] font-bold px-2 py-0.5 rounded ${b.active !== false ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-zinc-800 text-zinc-500'}">
            ${b.active !== false ? 'Ativo' : 'Oculto'}
          </button>
          <div class="flex items-center gap-1">
            <button onclick="openBannerModal(${b.id})" class="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded" title="Editar">
              <i class="fa-solid fa-pen-to-square text-xs"></i>
            </button>
            <button onclick="deleteBanner(${b.id})" class="p-1 hover:bg-rose-950/60 text-zinc-500 hover:text-rose-400 rounded" title="Eliminar">
              <i class="fa-solid fa-trash text-xs"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function openBannerModal(id) {
  const modal = document.getElementById('adminBannerModal');
  const title = document.getElementById('adminBannerModalTitle');
  if (!modal) return;

  populateAdminFields(); // refresh select

  if (id) {
    const b = state.banners.find(item => item.id === id);
    if (!b) return;
    title.textContent = "Editar Banner";
    document.getElementById('adminBannerId').value = b.id;
    document.getElementById('adminBannerBadge').value = b.badge || '';
    document.getElementById('adminBannerTitle').value = b.title || '';
    document.getElementById('adminBannerSubtitle').value = b.subtitle || '';
    document.getElementById('adminBannerBtnText').value = b.btnText || '';
    document.getElementById('adminBannerCategorySelect').value = b.categoryTarget || 'all';
    document.getElementById('adminBannerImage').value = b.imageUrl || '';
  } else {
    title.textContent = "Novo Banner";
    document.getElementById('adminBannerId').value = '';
    document.getElementById('adminBannerBadge').value = 'NOVIDADE';
    document.getElementById('adminBannerTitle').value = '';
    document.getElementById('adminBannerSubtitle').value = '';
    document.getElementById('adminBannerBtnText').value = 'Ver Mais';
    document.getElementById('adminBannerCategorySelect').value = 'all';
    document.getElementById('adminBannerImage').value = 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=1600&q=80';
  }

  modal.classList.remove('hidden');
}

function closeBannerModal() {
  const modal = document.getElementById('adminBannerModal');
  if (modal) modal.classList.add('hidden');
}

function saveAdminBanner() {
  const id = document.getElementById('adminBannerId').value;
  const badge = document.getElementById('adminBannerBadge').value.trim();
  const title = document.getElementById('adminBannerTitle').value.trim();
  const subtitle = document.getElementById('adminBannerSubtitle').value.trim();
  const btnText = document.getElementById('adminBannerBtnText').value.trim();
  const categoryTarget = document.getElementById('adminBannerCategorySelect').value;
  const imageUrl = document.getElementById('adminBannerImage').value.trim();

  if (!title) {
    alert('O título do banner é obrigatório.');
    return;
  }

  if (id) {
    const b = state.banners.find(item => item.id == id);
    if (b) {
      b.badge = badge;
      b.title = title;
      b.subtitle = subtitle;
      b.btnText = btnText;
      b.categoryTarget = categoryTarget;
      b.imageUrl = imageUrl;
    }
  } else {
    state.banners.push({
      id: Date.now(),
      badge,
      title,
      subtitle,
      btnText,
      categoryTarget,
      imageUrl,
      active: true
    });
  }

  closeBannerModal();
  renderAdminBannersList();
  renderBannerSlider();
  populateAdminFields();
}

function toggleBannerActive(id) {
  const b = state.banners.find(item => item.id === id);
  if (!b) return;
  b.active = b.active === false ? true : false;
  renderAdminBannersList();
  renderBannerSlider();
}

function deleteBanner(id) {
  if (confirm('Tem a certeza que deseja eliminar este banner?')) {
    state.banners = state.banners.filter(item => item.id !== id);
    renderAdminBannersList();
    renderBannerSlider();
    populateAdminFields();
  }
}

// ----------------------------------------------------------
// ADMIN: CATEGORIAS
// ----------------------------------------------------------
function renderAdminCategoriesList() {
  const tbody = document.getElementById('adminCategoriesTableBody');
  if (!tbody) return;

  let html = '';
  state.categories.forEach(c => {
    const isPromo = c.isPromo || c.id === 'promocoes' || (c.name && c.name.toLowerCase().includes('promo'));
    html += `
      <tr class="hover:bg-zinc-900/80 transition-colors">
        <td class="py-2.5 px-3 text-lg">${c.icon || '🍔'}</td>
        <td class="py-2.5 px-3 font-bold text-white text-xs">${c.name}</td>
        <td class="py-2.5 px-3 text-zinc-400 text-xs font-mono">${c.id}</td>
        <td class="py-2.5 px-3 text-center">
          <span class="text-xs ${isPromo ? 'text-brand-gold font-bold' : 'text-zinc-600'}">
            ${isPromo ? 'Sim 🔥' : 'Não'}
          </span>
        </td>
        <td class="py-2.5 px-3 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <button onclick="openCategoryModal('${c.id}')" class="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded" title="Editar">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="deleteCategory('${c.id}')" class="p-1.5 hover:bg-rose-950/60 text-zinc-500 hover:text-rose-400 rounded" title="Eliminar">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function openCategoryModal(id) {
  const modal = document.getElementById('adminCategoryModal');
  const title = document.getElementById('adminCategoryModalTitle');
  if (!modal) return;

  if (id) {
    const c = state.categories.find(item => item.id == id);
    if (!c) return;
    title.textContent = "Editar Categoria";
    document.getElementById('adminCategoryId').value = c.id;
    document.getElementById('adminCatIcon').value = c.icon || '🍔';
    document.getElementById('adminCatName').value = c.name;
    document.getElementById('adminCatSlug').value = c.id;
    document.getElementById('adminCatIsPromo').checked = !!(c.isPromo || c.id === 'promocoes');
  } else {
    title.textContent = "Nova Categoria";
    document.getElementById('adminCategoryId').value = '';
    document.getElementById('adminCatIcon').value = '🍔';
    document.getElementById('adminCatName').value = '';
    document.getElementById('adminCatSlug').value = '';
    document.getElementById('adminCatIsPromo').checked = false;
  }

  modal.classList.remove('hidden');
}

function closeCategoryModal() {
  const modal = document.getElementById('adminCategoryModal');
  if (modal) modal.classList.add('hidden');
}

function saveAdminCategory() {
  const originalId = document.getElementById('adminCategoryId').value;
  const icon = document.getElementById('adminCatIcon').value.trim() || '🍔';
  const name = document.getElementById('adminCatName').value.trim();
  let slug = document.getElementById('adminCatSlug').value.trim().toLowerCase().replace(/\s+/g, '-');
  const isPromo = document.getElementById('adminCatIsPromo').checked;

  if (!name) {
    alert('O nome da categoria é obrigatório.');
    return;
  }
  if (!slug) {
    slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  if (originalId) {
    const c = state.categories.find(item => item.id == originalId);
    if (c) {
      c.icon = icon;
      c.name = name;
      c.id = slug;
      c.isPromo = isPromo;
    }
  } else {
    state.categories.push({
      id: slug,
      name,
      icon,
      isPromo
    });
  }

  closeCategoryModal();
  renderAdminCategoriesList();
  renderCategoryPills();
  populateAdminFields();
}

function deleteCategory(id) {
  if (confirm('Tem a certeza que deseja eliminar esta categoria?')) {
    state.categories = state.categories.filter(item => item.id != id);
    renderAdminCategoriesList();
    renderCategoryPills();
    populateAdminFields();
  }
}

// ----------------------------------------------------------
// ADMIN: ADICIONAIS EXTRAS
// ----------------------------------------------------------
function renderAdminExtrasList() {
  const tbody = document.getElementById('adminExtrasTableBody');
  if (!tbody) return;

  let html = '';
  state.extras.forEach(ext => {
    html += `
      <tr class="hover:bg-zinc-900/80 transition-colors">
        <td class="py-2.5 px-3 font-bold text-white text-xs">${ext.name}</td>
        <td class="py-2.5 px-3 font-black text-brand-gold text-xs">
          ${parseFloat(ext.price).toFixed(2)}€
        </td>
        <td class="py-2.5 px-3 text-center">
          <button onclick="toggleExtraActive(${ext.id})" class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ext.active !== false ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-zinc-800 text-zinc-500'}">
            ${ext.active !== false ? 'Ativo' : 'Oculto'}
          </button>
        </td>
        <td class="py-2.5 px-3 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <button onclick="openExtraModal(${ext.id})" class="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded" title="Editar">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="deleteExtra(${ext.id})" class="p-1.5 hover:bg-rose-950/60 text-zinc-500 hover:text-rose-400 rounded" title="Eliminar">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function openExtraModal(id) {
  const modal = document.getElementById('adminExtraModal');
  const title = document.getElementById('adminExtraModalTitle');
  if (!modal) return;

  if (id) {
    const ext = state.extras.find(item => item.id === id);
    if (!ext) return;
    title.textContent = "Editar Adicional Extra";
    document.getElementById('adminExtraId').value = ext.id;
    document.getElementById('adminExtraName').value = ext.name;
    document.getElementById('adminExtraPrice').value = ext.price;
  } else {
    title.textContent = "Novo Adicional Extra";
    document.getElementById('adminExtraId').value = '';
    document.getElementById('adminExtraName').value = '';
    document.getElementById('adminExtraPrice').value = '1.00';
  }

  modal.classList.remove('hidden');
}

function closeExtraModal() {
  const modal = document.getElementById('adminExtraModal');
  if (modal) modal.classList.add('hidden');
}

function saveAdminExtra() {
  const id = document.getElementById('adminExtraId').value;
  const name = document.getElementById('adminExtraName').value.trim();
  const price = parseFloat(document.getElementById('adminExtraPrice').value) || 0;

  if (!name) {
    alert('O nome do adicional é obrigatório.');
    return;
  }

  if (id) {
    const ext = state.extras.find(item => item.id == id);
    if (ext) {
      ext.name = name;
      ext.price = price;
    }
  } else {
    state.extras.push({
      id: Date.now(),
      name,
      price,
      active: true
    });
  }

  closeExtraModal();
  renderAdminExtrasList();
  populateAdminFields();
}

function toggleExtraActive(id) {
  const ext = state.extras.find(item => item.id === id);
  if (!ext) return;
  ext.active = ext.active === false ? true : false;
  renderAdminExtrasList();
}

function deleteExtra(id) {
  if (confirm('Tem a certeza que deseja eliminar este adicional extra?')) {
    state.extras = state.extras.filter(item => item.id !== id);
    renderAdminExtrasList();
    populateAdminFields();
  }
}

// ----------------------------------------------------------
// SAVE ALL CHANGES & RESET
// ----------------------------------------------------------
function saveAllChanges() {
  const getVal = (id) => document.getElementById(id)?.value;

  state.config.statusText = getVal('adminInputStatusText');
  state.config.topNotice = getVal('adminInputTopNotice');
  state.config.heroSubtitle = getVal('adminInputHeroSubtitle');
  state.config.deliveryFee = parseFloat(getVal('adminInputDeliveryFee')) || 2.50;
  state.config.minOrder = parseFloat(getVal('adminInputMinOrder')) || 20.00;
  state.config.phone = getVal('adminInputPhone');
  state.config.whatsapp = getVal('adminInputWhatsapp');

  localStorage.setItem('oltre_products', JSON.stringify(state.products));
  localStorage.setItem('oltre_categories', JSON.stringify(state.categories));
  localStorage.setItem('oltre_banners', JSON.stringify(state.banners));
  localStorage.setItem('oltre_extras', JSON.stringify(state.extras));
  localStorage.setItem('oltre_config', JSON.stringify(state.config));

  applyConfigToUI();
  renderBannerSlider();
  renderCategoryPills();
  renderProducts();

  alert('Alterações guardadas com sucesso no navegador! Estão ativas imediatamente.');
}

function resetDefaults() {
  if (confirm('Tem a certeza que deseja restaurar as definições e o catálogo original da Oltre?')) {
    localStorage.removeItem('oltre_products');
    localStorage.removeItem('oltre_categories');
    localStorage.removeItem('oltre_banners');
    localStorage.removeItem('oltre_extras');
    localStorage.removeItem('oltre_config');
    location.reload();
  }
}
