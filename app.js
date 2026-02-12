const SUPABASE_URL = "https://wuxhbmqvawwkkphveaxc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1eGhibXF2YXd3a2twaHZlYXhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4OTIxODQsImV4cCI6MjA4NjQ2ODE4NH0.JUbr-P_qcKLXWV_1LXNewfaZUIb_ngrW3gUmuIc-e2g";

const DEFAULT_PRODUCTS = [
  {
    id: "ts-001",
    name: "Arc Halo Monitor",
    category: "Display",
    price: 1299,
    rating: 4.9,
    badge: "Drop",
    description: "38-inch ultra-wide with warm tone calibration.",
    hue: 190,
  },
  {
    id: "ts-002",
    name: "Pulse Audio Deck",
    category: "Audio",
    price: 429,
    rating: 4.8,
    badge: "Studio",
    description: "Compact mixer with voice isolation and USB-C.",
    hue: 150,
  },
  {
    id: "ts-003",
    name: "Stratus GPU Dock",
    category: "Compute",
    price: 899,
    rating: 4.7,
    badge: "Pro",
    description: "Thunderbolt dock with dual cooling rails.",
    hue: 24,
  },
  {
    id: "ts-004",
    name: "Vector Keyframe",
    category: "Input",
    price: 189,
    rating: 4.6,
    badge: "Hot",
    description: "Low-profile mechanical board with silent switches.",
    hue: 210,
  },
  {
    id: "ts-005",
    name: "Lumen Beam Bar",
    category: "Accessories",
    price: 139,
    rating: 4.5,
    badge: "Glow",
    description: "Bias lighting bar with cinematic presets.",
    hue: 42,
  },
  {
    id: "ts-006",
    name: "Orbit NAS Mini",
    category: "Storage",
    price: 599,
    rating: 4.8,
    badge: "Sync",
    description: "Encrypted storage hub for studios and teams.",
    hue: 112,
  },
  {
    id: "ts-007",
    name: "Signal Mesh Kit",
    category: "Networking",
    price: 349,
    rating: 4.7,
    badge: "Fast",
    description: "Tri-band mesh with creator-grade QoS.",
    hue: 280,
  },
  {
    id: "ts-008",
    name: "Axis Controller",
    category: "Input",
    price: 259,
    rating: 4.6,
    badge: "Boost",
    description: "Programmable macro pad with tactile feedback.",
    hue: 320,
  },
  {
    id: "ts-009",
    name: "Drift 4K Cam",
    category: "Video",
    price: 519,
    rating: 4.7,
    badge: "Sharp",
    description: "Studio-grade camera with low light tuning.",
    hue: 12,
  },
  {
    id: "ts-010",
    name: "Circuit Dock Pro",
    category: "Compute",
    price: 299,
    rating: 4.4,
    badge: "Flow",
    description: "One-cable dock with PD and twin HDMI.",
    hue: 168,
  },
];

const BUNDLES = {
  Creator: ["ts-002", "ts-009", "ts-008"],
  Gaming: ["ts-003", "ts-004", "ts-007"],
  Remote: ["ts-010", "ts-001", "ts-006"],
  Mobile: ["ts-005", "ts-010", "ts-004"],
};

const state = {
  products: [],
  filtered: [],
  cart: loadCart(),
  activeCategory: "All",
  search: "",
};

const elements = {
  grid: document.getElementById("productGrid"),
  filterBar: document.getElementById("filterBar"),
  cartDrawer: document.getElementById("cartDrawer"),
  cartItems: document.getElementById("cartItems"),
  cartTotal: document.getElementById("cartTotal"),
  cartCount: document.getElementById("cartCount"),
  overlay: document.getElementById("overlay"),
  toast: document.getElementById("toast"),
  searchInput: document.getElementById("searchInput"),
  bundleSummary: document.getElementById("bundleSummary"),
  supabaseStatus: document.getElementById("supabaseStatus"),
  setupModal: document.getElementById("setupModal"),
};

function formatPrice(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function loadCart() {
  try {
    const stored = localStorage.getItem("techstuf_cart");
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    return {};
  }
}

function saveCart() {
  localStorage.setItem("techstuf_cart", JSON.stringify(state.cart));
}

function updateCartCount() {
  const count = Object.values(state.cart).reduce((sum, item) => sum + item.qty, 0);
  elements.cartCount.textContent = count;
}

function renderProducts() {
  elements.grid.innerHTML = state.filtered
    .map((product) => {
      return `
        <article class="product-card" data-id="${product.id}">
          <div class="product-art" style="--hue: ${product.hue}">${product.category}</div>
          <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
          </div>
          <div class="product-meta">
            <span class="badge">${product.badge}</span>
            <span class="rating">&#9733; ${product.rating}</span>
          </div>
          <div class="product-meta">
            <strong>${formatPrice(product.price)}</strong>
            <span>${product.category}</span>
          </div>
          <button class="btn secondary" data-add="${product.id}">Add to cart</button>
        </article>
      `;
    })
    .join("");
}

function buildFilters() {
  const categories = ["All", ...new Set(state.products.map((item) => item.category))];
  elements.filterBar.innerHTML = categories
    .map(
      (category) =>
        `<button class="${category === state.activeCategory ? "active" : ""}" data-filter="${category}">${category}</button>`
    )
    .join("");
}

function applyFilters() {
  const query = state.search.toLowerCase();
  state.filtered = state.products.filter((product) => {
    const matchCategory = state.activeCategory === "All" || product.category === state.activeCategory;
    const matchSearch =
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query);
    return matchCategory && matchSearch;
  });
  renderProducts();
}

function addToCart(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;
  const existing = state.cart[productId];
  state.cart[productId] = {
    product,
    qty: existing ? existing.qty + 1 : 1,
  };
  saveCart();
  renderCart();
  showToast(`${product.name} added`);
}

function removeFromCart(productId) {
  if (!state.cart[productId]) return;
  delete state.cart[productId];
  saveCart();
  renderCart();
}

function renderCart() {
  const items = Object.values(state.cart);
  elements.cartItems.innerHTML = items
    .map((item) => {
      return `
        <div class="cart-item">
          <div class="thumb"></div>
          <div>
            <h4>${item.product.name}</h4>
            <span>${formatPrice(item.product.price)} | Qty ${item.qty}</span>
          </div>
          <button data-remove="${item.product.id}">Remove</button>
        </div>
      `;
    })
    .join("");

  const total = items.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  elements.cartTotal.textContent = formatPrice(total || 0);
  updateCartCount();
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  setTimeout(() => elements.toast.classList.remove("show"), 2200);
}

function openCart() {
  elements.cartDrawer.classList.add("open");
  elements.overlay.classList.add("show");
  elements.cartDrawer.setAttribute("aria-hidden", "false");
}

function closeCart() {
  elements.cartDrawer.classList.remove("open");
  elements.overlay.classList.remove("show");
  elements.cartDrawer.setAttribute("aria-hidden", "true");
}

function openSetup() {
  elements.setupModal.classList.add("show");
  elements.setupModal.setAttribute("aria-hidden", "false");
}

function closeSetup() {
  elements.setupModal.classList.remove("show");
  elements.setupModal.setAttribute("aria-hidden", "true");
}

function initReveal() {
  const items = document.querySelectorAll("[data-reveal]");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );
  items.forEach((item) => observer.observe(item));
}

function renderBundle(bundle) {
  const ids = BUNDLES[bundle];
  if (!ids) return;
  const items = ids
    .map((id) => state.products.find((product) => product.id === id))
    .filter(Boolean)
    .map((product) => `&bull; ${product.name}`)
    .join("<br />");
  elements.bundleSummary.innerHTML = `<strong>${bundle} kit</strong><br />${items}`;
}

async function loadSupabaseProducts() {
  if (!window.supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    elements.supabaseStatus.textContent = "local demo";
    return null;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await client.from("products").select("*").limit(50);

  if (error || !data) {
    elements.supabaseStatus.textContent = "offline, using demo";
    return null;
  }

  const mapped = data
    .filter((item) => item.active !== false)
    .map((item, index) => ({
      id: item.id || item.sku || `sb-${index}`,
      name: item.name || "Unnamed product",
      category: item.category || "Gear",
      price: Number(item.price) || 0,
      rating: Number(item.rating) || 4.5,
      badge: item.badge || "Live",
      description: item.description || "Supabase item",
      hue: Number(item.image_hue) || (140 + index * 24) % 360,
    }));

  elements.supabaseStatus.textContent = `synced ${mapped.length} items`;
  return mapped.length ? mapped : null;
}

function bindEvents() {
  document.getElementById("openCart").addEventListener("click", openCart);
  document.getElementById("closeCart").addEventListener("click", closeCart);
  elements.overlay.addEventListener("click", () => {
    closeCart();
    closeSetup();
  });

  document.getElementById("jumpShop").addEventListener("click", () => {
    document.getElementById("shop").scrollIntoView({ behavior: "smooth" });
  });
  document.getElementById("jumpBundles").addEventListener("click", () => {
    document.getElementById("bundles").scrollIntoView({ behavior: "smooth" });
  });

  elements.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    applyFilters();
  });

  elements.filterBar.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    state.activeCategory = button.dataset.filter;
    buildFilters();
    applyFilters();
  });

  elements.grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add]");
    if (!button) return;
    addToCart(button.dataset.add);
  });

  elements.cartItems.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove]");
    if (!button) return;
    removeFromCart(button.dataset.remove);
  });

  document.querySelectorAll(".bundle").forEach((button) => {
    button.addEventListener("click", () => renderBundle(button.dataset.bundle));
  });

  document.getElementById("newsletter").addEventListener("submit", (event) => {
    event.preventDefault();
    showToast("Welcome to the signal update");
    event.target.reset();
  });

  document.getElementById("viewSetup").addEventListener("click", openSetup);
  document.getElementById("closeSetup").addEventListener("click", closeSetup);
}

async function init() {
  const supabaseProducts = await loadSupabaseProducts();
  state.products = supabaseProducts || DEFAULT_PRODUCTS;
  state.filtered = state.products;
  buildFilters();
  renderProducts();
  renderCart();
  bindEvents();
  initReveal();
}

document.addEventListener("DOMContentLoaded", init);
