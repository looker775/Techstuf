const TECHSTUF_CONFIG = typeof window !== "undefined" ? window.TECHSTUF_CONFIG || {} : {};
const SUPABASE_URL = TECHSTUF_CONFIG.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = TECHSTUF_CONFIG.SUPABASE_ANON_KEY || "";
const PAYPAL_CLIENT_ID = TECHSTUF_CONFIG.PAYPAL_CLIENT_ID || "";
const PAYPAL_CURRENCY = TECHSTUF_CONFIG.PAYPAL_CURRENCY || "USD";
const OWNER_EMAIL = (TECHSTUF_CONFIG.OWNER_EMAIL || "").toLowerCase();
const I18N = typeof window !== "undefined" ? window.TECHSTUF_I18N || null : null;
const t =
  I18N && typeof I18N.t === "function"
    ? I18N.t
    : (key, fallback, vars) => {
        if (!fallback) return key;
        if (!vars) return fallback;
        return fallback.replace(/\{\{(\w+)\}\}/g, (match, token) =>
          vars[token] === undefined ? match : String(vars[token])
        );
      };
const getLocale = () =>
  I18N && typeof I18N.getLocale === "function" ? I18N.getLocale() : "en-US";

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
    image_url: "",
    video_url: "",
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
    image_url: "",
    video_url: "",
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
    image_url: "",
    video_url: "",
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
    image_url: "",
    video_url: "",
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
    image_url: "",
    video_url: "",
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
    image_url: "",
    video_url: "",
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
    image_url: "",
    video_url: "",
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
    image_url: "",
    video_url: "",
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
    image_url: "",
    video_url: "",
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
    image_url: "",
    video_url: "",
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
  lastOrder: loadLastOrder(),
  activeCategoryId: "all",
  activeSubcategoryId: "all",
  categoryMode: "product",
  categories: [],
  subcategories: [],
  activeBundle: "Creator",
  search: "",
  reviews: {},
  supabaseInfo: { mode: "connecting", count: 0 },
  supportThreadId: null,
  supportMessages: [],
};

const elements = {
  grid: document.getElementById("productGrid"),
  filterBar: document.getElementById("filterBar"),
  cartDrawer: document.getElementById("cartDrawer"),
  cartItems: document.getElementById("cartItems"),
  cartTotal: document.getElementById("cartTotal"),
  cartCount: document.getElementById("cartCount"),
  orderSummary: document.getElementById("orderSummary"),
  orderSummaryId: document.getElementById("orderSummaryId"),
  orderSummaryTotal: document.getElementById("orderSummaryTotal"),
  orderSummaryEmail: document.getElementById("orderSummaryEmail"),
  orderSummaryStatus: document.getElementById("orderSummaryStatus"),
  overlay: document.getElementById("overlay"),
  toast: document.getElementById("toast"),
  searchInput: document.getElementById("searchInput"),
  bundleSummary: document.getElementById("bundleSummary"),
  supabaseStatus: document.getElementById("supabaseStatus"),
  setupModal: document.getElementById("setupModal"),
  paypalButtons: document.getElementById("paypalButtons"),
  categorySelect: document.getElementById("categorySelect"),
  subcategorySelect: document.getElementById("subcategorySelect"),
  buyerRegister: document.getElementById("buyerRegister"),
  buyerLogin: document.getElementById("buyerLogin"),
  buyerStatus: document.getElementById("buyerStatus"),
  buyerAccountForm: document.getElementById("buyerAccountForm"),
  buyerAccountStatus: document.getElementById("buyerAccountStatus"),
  adminRegister: document.getElementById("adminRegister"),
  adminLogin: document.getElementById("adminLogin"),
  adminStatus: document.getElementById("adminStatus"),
  ownerLogin: document.getElementById("ownerLogin"),
  ownerStatus: document.getElementById("ownerStatus"),
  logoutBtn: document.getElementById("logoutBtn"),
  reviewModal: document.getElementById("reviewModal"),
  reviewTitle: document.getElementById("reviewTitle"),
  reviewMeta: document.getElementById("reviewMeta"),
  reviewRating: document.getElementById("reviewRating"),
  reviewList: document.getElementById("reviewList"),
  reviewForm: document.getElementById("reviewForm"),
  reviewStatus: document.getElementById("reviewStatus"),
  closeReview: document.getElementById("closeReview"),
  supportChatButton: document.getElementById("openSupportChat"),
  chatModal: document.getElementById("chatModal"),
  chatMessages: document.getElementById("chatMessages"),
  chatForm: document.getElementById("chatForm"),
  chatStatus: document.getElementById("chatStatus"),
  closeChat: document.getElementById("closeChat"),
  chatSubtitle: document.getElementById("chatSubtitle"),
};

let supabaseClient = null;
let paypalButtonsInstance = null;
let paypalRenderSignature = "";
let paypalRenderInProgress = false;

function getAuthStorage() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("__techstuf", "1");
      localStorage.removeItem("__techstuf");
      return localStorage;
    }
  } catch (error) {
    // ignore
  }
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("__techstuf", "1");
      sessionStorage.removeItem("__techstuf");
      return sessionStorage;
    }
  } catch (error) {
    // ignore
  }

  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
}

function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!window.supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }

  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: getAuthStorage(),
      storageKey: "techstuf-auth",
    },
  });
  return supabaseClient;
}

function formatPrice(value) {
  return new Intl.NumberFormat(getLocale(), {
    style: "currency",
    currency: PAYPAL_CURRENCY || "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMoney(value, currency = PAYPAL_CURRENCY) {
  const safeCurrency = (currency || PAYPAL_CURRENCY || "USD").toUpperCase();
  const amount = Number(value) || 0;
  try {
    return new Intl.NumberFormat(getLocale(), {
      style: "currency",
      currency: safeCurrency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    return `${amount.toFixed(2)} ${safeCurrency}`;
  }
}

function renderStars(rating) {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  const filled = "&#9733;".repeat(Math.round(safeRating));
  const empty = "&#9734;".repeat(5 - Math.round(safeRating));
  return `<span class="review-stars">${filled}${empty}</span>`;
}

function loadCart() {
  try {
    const stored = localStorage.getItem("techstuf_cart");
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    return {};
  }
}

function loadLastOrder() {
  try {
    const stored = localStorage.getItem("techstuf_last_order");
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    return null;
  }
}

function saveCart() {
  localStorage.setItem("techstuf_cart", JSON.stringify(state.cart));
}

function saveLastOrder(summary) {
  if (!summary) return;
  localStorage.setItem("techstuf_last_order", JSON.stringify(summary));
  state.lastOrder = summary;
}

function updateCartCount() {
  const count = Object.values(state.cart).reduce((sum, item) => sum + item.qty, 0);
  elements.cartCount.textContent = count;
}

function getCartItems() {
  return Object.values(state.cart).map((item) => ({
    id: item.product.id,
    name: item.product.name,
    price: Number(item.product.price),
    qty: item.qty,
  }));
}

function getCartTotal(items = getCartItems()) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function setStatus(element, message) {
  if (!element) return;
  element.textContent = message;
}

function updateSupabaseStatus() {
  if (!elements.supabaseStatus || !state.supabaseInfo) return;
  const mode = state.supabaseInfo.mode;
  if (mode === "local_demo") {
    elements.supabaseStatus.textContent = t("supabase.local_demo", "local demo");
  } else if (mode === "offline_demo") {
    elements.supabaseStatus.textContent = t("supabase.offline_demo", "offline, using demo");
  } else if (mode === "synced") {
    elements.supabaseStatus.textContent = t("supabase.synced", "synced {{count}} items", {
      count: state.supabaseInfo.count || 0,
    });
  } else {
    elements.supabaseStatus.textContent = t("hero.meta_connecting", "connecting...");
  }
}

async function getUserRole(userId) {
  const client = getSupabaseClient();
  if (!client || !userId) return null;

  const { data, error } = await client
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  return data.role;
}

async function getUserProfile(userId) {
  const client = getSupabaseClient();
  if (!client || !userId) return null;

  const { data, error } = await client
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  return data;
}

function getStoredName() {
  try {
    return localStorage.getItem("techstuf_name") || "";
  } catch (error) {
    return "";
  }
}

async function refreshAuthStatus() {
  const client = getSupabaseClient();
  if (!client) {
    setStatus(elements.buyerStatus, t("status.auth_missing", "Auth not configured."));
    setStatus(elements.adminStatus, t("status.auth_missing", "Auth not configured."));
    setStatus(elements.ownerStatus, t("status.auth_missing", "Auth not configured."));
    setChatStatus(t("chat.auth_missing", "Supabase auth not configured."));
    setChatEnabled(false);
    return;
  }

  const { data } = await client.auth.getSession();
  const session = data?.session;

  if (!session?.user) {
    setStatus(elements.buyerStatus, t("status.not_signed_in", "Not signed in."));
    setStatus(elements.adminStatus, t("status.admin_requires", "Admin access requires approval."));
    setStatus(elements.ownerStatus, t("status.owner_only", "Owner access only."));
    setChatStatus(t("chat.sign_in_required", "Sign in to start support chat."));
    setChatEnabled(false);
    return;
  }

  const user = session.user;
  const role = (await getUserRole(user.id)) || "buyer";
  setStatus(elements.buyerStatus, t("status.signed_in_as", "Signed in as {{email}}.", { email: user.email }));

  if (role === "owner" || (OWNER_EMAIL && user.email.toLowerCase() === OWNER_EMAIL)) {
    setStatus(elements.adminStatus, t("status.owner_logged_in", "Owner logged in."));
    setStatus(elements.ownerStatus, t("status.owner_access_granted", "Owner access granted."));
    if (elements.chatModal?.classList.contains("show")) {
      loadSupportMessages();
    }
    return;
  }

  if (role === "admin") {
    setStatus(elements.adminStatus, t("status.admin_access_approved", "Admin access approved."));
    setStatus(elements.ownerStatus, t("status.owner_only", "Owner access only."));
  } else {
    setStatus(elements.adminStatus, t("status.admin_access_pending", "Admin access pending owner approval."));
    setStatus(elements.ownerStatus, t("status.owner_only", "Owner access only."));
  }

  if (elements.chatModal?.classList.contains("show")) {
    loadSupportMessages();
  }
}

async function signUpUser(email, password, metadata) {
  const client = getSupabaseClient();
  if (!client) {
    showToast(t("toast.auth_missing", "Supabase auth not configured"));
    return null;
  }

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: metadata || {},
    },
  });

  if (error) {
    showToast(error.message);
    return null;
  }

  return data;
}

async function signInUser(email, password) {
  const client = getSupabaseClient();
  if (!client) {
    showToast(t("toast.auth_missing", "Supabase auth not configured"));
    return null;
  }

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    showToast(error.message);
    return null;
  }

  return data;
}

async function requestAdminAccess(reason) {
  const client = getSupabaseClient();
  if (!client) {
    showToast(t("toast.auth_missing", "Supabase auth not configured"));
    return;
  }

  const { data } = await client.auth.getSession();
  const session = data?.session;
  if (!session?.user) {
    showToast(t("toast.sign_in_first", "Sign in first to request admin access"));
    return;
  }

  const payload = {
    user_id: session.user.id,
    email: session.user.email,
    reason: reason || "Admin access requested",
    status: "pending",
  };

  const { error } = await client.from("admin_requests").insert(payload);
  if (error) {
    showToast(
      t(
        "toast.admin_request_saved_error",
        "Admin request not saved. Check admin_requests table and policies."
      )
    );
    return;
  }

  showToast(t("toast.admin_request_submitted", "Admin request submitted"));
  refreshAuthStatus();
}
function renderProducts() {
  elements.grid.innerHTML = state.filtered
    .map((product) => {
      const reviews = state.reviews[product.id] || [];
      const reviewAverage =
        reviews.length > 0
          ? reviews.reduce((sum, item) => sum + (item.rating || 0), 0) / reviews.length
          : null;
      const hue = Number(product.hue) || 160;
      const safeImage = product.image_url ? product.image_url.replace(/'/g, "\\'") : "";
      const artClass = product.image_url ? "product-art has-image" : "product-art";
      const artStyle = product.image_url
        ? `--hue: ${hue}; background-image: url('${safeImage}'), radial-gradient(circle at top left, rgba(255, 255, 255, 0.7), transparent 40%), linear-gradient(135deg, hsl(${hue} 70% 65%), hsl(${hue} 70% 45%));`
        : `--hue: ${hue}`;
      const displayCategory = product.categoryName || product.category || t("product.default_category", "Gear");
      const ratingLabel =
        reviewAverage === null
          ? t("rating.none", "No ratings yet")
          : `${renderStars(reviewAverage)} ${reviewAverage.toFixed(1)}`;
      const productHref = `product.html?id=${encodeURIComponent(product.id)}`;
      return `
        <article class="product-card" data-id="${product.id}">
          <div class="${artClass}" style="${artStyle}">${displayCategory}</div>
          <div class="product-info">
            <h3><a class="product-link" href="${productHref}">${product.name}</a></h3>
            <p>${product.description}</p>
          </div>
          <div class="product-meta">
            <span class="badge">${product.badge}</span>
            <span class="rating">${ratingLabel}</span>
          </div>
          <div class="product-meta">
            <strong>${formatPrice(product.price)}</strong>
            <span>${displayCategory}</span>
          </div>
          <button class="btn secondary" data-add="${product.id}">${t("product.add_to_cart", "Add to cart")}</button>
          <button class="btn ghost" data-review="${product.id}">${t("product.reviews", "Reviews")}</button>
        </article>
      `;
    })
    .join("");
}

function buildFilters() {
  const categorySelect = elements.categorySelect;
  const subcategorySelect = elements.subcategorySelect;
  if (!categorySelect || !subcategorySelect) return;

  let categories = [];
  if (state.categories.length) {
    categories = state.categories.map((item) => ({ value: item.id, label: item.name }));
    state.categoryMode = "table";
  } else {
    const unique = Array.from(
      new Set(
        state.products
          .map((item) => item.categoryName || item.category)
          .filter(Boolean)
      )
    );
    categories = unique.map((name) => ({ value: name, label: name }));
    state.categoryMode = "product";
  }

  const allLabel = t("filters.all", "All");
  categorySelect.innerHTML = `<option value="all">${allLabel}</option>` +
    categories.map((item) => `<option value="${item.value}">${item.label}</option>`).join("");

  if (!categories.find((item) => item.value === state.activeCategoryId)) {
    state.activeCategoryId = "all";
  }
  categorySelect.value = state.activeCategoryId;

  if (state.categoryMode === "table" && state.activeCategoryId !== "all") {
    const subs = state.subcategories.filter(
      (sub) => sub.category_id === state.activeCategoryId
    );
    subcategorySelect.disabled = !subs.length;
    const subOptions = subs.map((sub) => `<option value="${sub.id}">${sub.name}</option>`).join("");
    subcategorySelect.innerHTML = `<option value="all">${allLabel}</option>` + subOptions;
    if (!subs.find((sub) => sub.id === state.activeSubcategoryId)) {
      state.activeSubcategoryId = "all";
    }
    subcategorySelect.value = state.activeSubcategoryId;
  } else {
    state.activeSubcategoryId = "all";
    subcategorySelect.innerHTML = `<option value="all">${allLabel}</option>`;
    subcategorySelect.disabled = true;
  }
}

function applyFilters() {
  const query = state.search.toLowerCase();
  state.filtered = state.products.filter((product) => {
    let matchCategory = true;
    if (state.activeCategoryId !== "all") {
      if (state.categoryMode === "table") {
        matchCategory = product.category_id === state.activeCategoryId;
      } else {
        const categoryName = product.categoryName || product.category || "";
        matchCategory = categoryName === state.activeCategoryId;
      }
    }
    let matchSubcategory = true;
    if (state.activeSubcategoryId !== "all") {
      matchSubcategory = product.subcategory_id === state.activeSubcategoryId;
    }
    const matchSearch =
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      (product.categoryName || product.category || "").toLowerCase().includes(query);
    return matchCategory && matchSubcategory && matchSearch;
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
  showToast(t("toast.added", "Added to cart"));
}

function removeFromCart(productId) {
  if (!state.cart[productId]) return;
  delete state.cart[productId];
  saveCart();
  renderCart();
}

function renderOrderSummary(summary) {
  if (!elements.orderSummary) return;
  if (!summary) {
    elements.orderSummary.hidden = true;
    return;
  }

  const orderId = summary.id || "--";
  const total = formatMoney(summary.total || 0, summary.currency);
  const email = summary.email || "--";
  const status = summary.status || "--";

  setText(elements.orderSummaryId, orderId);
  setText(elements.orderSummaryTotal, total);
  setText(elements.orderSummaryEmail, email);
  setText(elements.orderSummaryStatus, status);
  elements.orderSummary.hidden = false;
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
            <span>${formatPrice(item.product.price)} | ${t("cart.qty", "Qty")} ${item.qty}</span>
          </div>
          <button data-remove="${item.product.id}">${t("cart.remove", "Remove")}</button>
        </div>
      `;
    })
    .join("");

  const total = getCartTotal();
  elements.cartTotal.textContent = formatPrice(total || 0);
  updateCartCount();
  renderPayPalButtons();
  renderOrderSummary(state.lastOrder);
}

function loadPayPalSdk() {
  if (!PAYPAL_CLIENT_ID) {
    if (elements.paypalButtons) {
      const wrap = elements.paypalButtons.closest(".paypal-wrap");
      if (wrap) {
        wrap.style.display = "none";
      }
    }
    return;
  }

  if (elements.paypalButtons) {
    const wrap = elements.paypalButtons.closest(".paypal-wrap");
    if (wrap) {
      wrap.style.display = "grid";
    }
  }

  if (window.paypal) {
    renderPayPalButtons();
    return;
  }

  if (document.getElementById("paypal-sdk")) {
    return;
  }

  const script = document.createElement("script");
  script.id = "paypal-sdk";
  script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=${PAYPAL_CURRENCY}&intent=capture`;
  script.addEventListener("load", renderPayPalButtons);
  script.addEventListener("error", () => showToast(t("toast.paypal_failed", "PayPal failed to load")));
  document.head.appendChild(script);
}

function renderPayPalButtons() {
  if (!elements.paypalButtons || !window.paypal) {
    return;
  }

  const items = getCartItems();
  const total = getCartTotal(items);
  const signature = `${total}|${items
    .map((item) => `${item.id}:${item.qty}:${item.price}`)
    .join("|")}`;

  if (!items.length || total <= 0) {
    elements.paypalButtons.innerHTML =
      `<p class="paypal-empty">${t("cart.empty", "Add items to checkout with PayPal.")}</p>`;
    paypalRenderSignature = "";
    if (paypalButtonsInstance && typeof paypalButtonsInstance.close === "function") {
      try {
        paypalButtonsInstance.close();
      } catch (error) {
        // ignore
      }
    }
    return;
  }

  if (paypalRenderInProgress) {
    return;
  }

  if (signature === paypalRenderSignature && paypalButtonsInstance) {
    return;
  }

  paypalRenderSignature = signature;
  elements.paypalButtons.innerHTML = "";

  paypalRenderInProgress = true;
  paypalButtonsInstance = window.paypal.Buttons({
    style: {
      layout: "vertical",
      shape: "pill",
      color: "gold",
      label: "paypal",
    },
    createOrder: async () => {
      const response = await fetch("/.netlify/functions/paypal-create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency: PAYPAL_CURRENCY,
          items,
          total,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to create order");
      }
      return data.id;
    },
    onApprove: async (data) => {
      const response = await fetch("/.netlify/functions/paypal-capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderID: data.orderID,
          items,
          total,
          currency: PAYPAL_CURRENCY,
        }),
      });

      const capture = await response.json();
      if (!response.ok) {
        throw new Error(capture.error || "Capture failed");
      }

      const purchaseUnit = capture?.purchase_units?.[0];
      const captureInfo = purchaseUnit?.payments?.captures?.[0];
      const orderSummary = {
        id: capture?.id || data.orderID || captureInfo?.id || null,
        status: captureInfo?.status || capture?.status || "captured",
        total: Number(captureInfo?.amount?.value || purchaseUnit?.amount?.value || total || 0),
        currency:
          captureInfo?.amount?.currency_code ||
          purchaseUnit?.amount?.currency_code ||
          PAYPAL_CURRENCY,
        email: capture?.payer?.email_address || null,
      };

      saveLastOrder(orderSummary);

      state.cart = {};
      saveCart();
      renderCart();
      showToast(t("toast.payment_complete", "Payment complete"));
    },
    onError: (error) => {
      console.error(error);
      showToast(t("toast.payment_failed", "Payment failed"));
    },
  });

  Promise.resolve(paypalButtonsInstance.render(elements.paypalButtons))
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      paypalRenderInProgress = false;
    });
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

function openReviewModal(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product || !elements.reviewModal) return;
  const reviews = state.reviews[productId] || [];
  const average =
    reviews.length > 0
      ? reviews.reduce((sum, item) => sum + (item.rating || 0), 0) / reviews.length
      : product.rating;

  elements.reviewTitle.textContent = t("review.title_with_product", "{{name}} reviews", {
    name: product.name,
  });
  elements.reviewMeta.textContent = t("review.count", "{{count}} review(s)", { count: reviews.length });
  const averageLabel =
    reviews.length > 0
      ? `${renderStars(average)} ${average.toFixed(1)} / 5`
      : t("rating.none", "No ratings yet");
  elements.reviewRating.innerHTML = averageLabel;

  if (!reviews.length) {
    elements.reviewList.innerHTML = `<p>${t("review.no_reviews", "No reviews yet. Be the first to review.")}</p>`;
  } else {
    elements.reviewList.innerHTML = reviews
      .map((review) => {
        const comment = review.comment || t("review.no_comment", "No comment provided.");
        const reviewer = review.user_email || t("review.verified_buyer", "Verified buyer");
        return `
          <div class="review-item">
            <div>${renderStars(review.rating)} ${Number(review.rating).toFixed(1)}</div>
            <p>${comment}</p>
            <small>${reviewer} &middot; ${new Date(review.created_at).toLocaleString(getLocale())}</small>
          </div>
        `;
      })
      .join("");
  }

  if (product.video_url) {
    elements.reviewMeta.insertAdjacentHTML(
      "beforeend",
      ` &middot; <a href="${product.video_url}" target="_blank" rel="noreferrer">${t(
        "review.view_video",
        "View video"
      )}</a>`
    );
  }

  elements.reviewForm.dataset.productId = productId;
  elements.reviewModal.classList.add("show");
  elements.reviewModal.setAttribute("aria-hidden", "false");
}

function closeReviewModal() {
  if (!elements.reviewModal) return;
  elements.reviewModal.classList.remove("show");
  elements.reviewModal.setAttribute("aria-hidden", "true");
}

async function loadReviews() {
  const client = getSupabaseClient();
  if (!client) return;
  const { data, error } = await client
    .from("product_reviews")
    .select("id, product_id, rating, comment, created_at, user_email")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) {
    return;
  }

  state.reviews = data.reduce((acc, review) => {
    const key = review.product_id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(review);
    return acc;
  }, {});
}

async function submitReview(formData) {
  const client = getSupabaseClient();
  if (!client) {
    showToast(t("toast.auth_missing", "Supabase auth not configured"));
    return;
  }

  const { data } = await client.auth.getSession();
  const session = data?.session;
  if (!session?.user) {
    setStatus(elements.reviewStatus, t("review_form.login_required", "Please log in to submit a review."));
    return;
  }

  const productId = String(elements.reviewForm.dataset.productId || "");
  const rating = Number(formData.get("rating") || 0);
  const comment = String(formData.get("comment") || "").trim();

  if (!productId || rating < 1 || rating > 5) {
    setStatus(elements.reviewStatus, t("review.rating_error", "Please select a rating between 1 and 5."));
    return;
  }

  const payload = {
    product_id: productId,
    rating,
    comment,
    user_id: session.user.id,
    user_email: session.user.email,
  };

  const { error } = await client.from("product_reviews").insert(payload);
  if (error) {
    setStatus(
      elements.reviewStatus,
      t("review.submit_failed", "Submit failed: {{message}}", { message: error.message })
    );
    return;
  }

  setStatus(elements.reviewStatus, t("review.submit_success", "Review submitted."));
  elements.reviewForm.reset();
  await loadReviews();
  renderProducts();
  openReviewModal(productId);
}

async function handleBuyerAccountUpdate(event) {
  event.preventDefault();
  const client = getSupabaseClient();
  if (!client) {
    setStatus(elements.buyerAccountStatus, t("status.auth_missing", "Auth not configured."));
    return;
  }

  const { data } = await client.auth.getSession();
  const session = data?.session;
  if (!session?.user) {
    setStatus(elements.buyerAccountStatus, t("status.not_signed_in", "Not signed in."));
    return;
  }

  const formData = new FormData(event.target);
  const newEmail = String(formData.get("new_email") || "").trim();
  const newPassword = String(formData.get("new_password") || "");
  const confirmPassword = String(formData.get("confirm_password") || "");

  if (!newEmail && !newPassword) {
    setStatus(
      elements.buyerAccountStatus,
      t("status.account_update_missing", "Enter a new email or password.")
    );
    return;
  }

  if (newPassword && newPassword.length < 6) {
    setStatus(
      elements.buyerAccountStatus,
      t("status.account_update_password_short", "Password must be at least 6 characters.")
    );
    return;
  }

  if (newPassword && newPassword !== confirmPassword) {
    setStatus(
      elements.buyerAccountStatus,
      t("status.account_update_password_mismatch", "Password confirmation does not match.")
    );
    return;
  }

  const updateData = {};
  if (newEmail) updateData.email = newEmail;
  if (newPassword) updateData.password = newPassword;

  const { error } = await client.auth.updateUser(updateData);
  if (error) {
    setStatus(elements.buyerAccountStatus, error.message);
    return;
  }

  setStatus(
    elements.buyerAccountStatus,
    t(
      "status.account_update_success",
      "Update requested. Check your email to confirm changes if prompted."
    )
  );
  event.target.reset();
}

function setChatStatus(message) {
  if (!elements.chatStatus) return;
  elements.chatStatus.textContent = message;
}

function setChatEnabled(enabled) {
  if (!elements.chatForm) return;
  const textarea = elements.chatForm.querySelector("textarea");
  const button = elements.chatForm.querySelector("button[type=\"submit\"]");
  if (textarea) textarea.disabled = !enabled;
  if (button) button.disabled = !enabled;
}

function renderSupportMessages(messages, currentEmail) {
  if (!elements.chatMessages) return;
  if (!messages.length) {
    elements.chatMessages.innerHTML = `<p class="chat-empty">${t(
      "chat.empty",
      "No messages yet. Say hello to start the chat."
    )}</p>`;
    return;
  }

  elements.chatMessages.innerHTML = messages
    .map((message) => {
      const isSelf =
        message.sender_role === "buyer" ||
        (currentEmail && message.sender_email === currentEmail);
      const bubbleClass = isSelf ? "chat-bubble self" : "chat-bubble staff";
      const name = message.sender_name || message.sender_email || t("chat.support", "Support");
      const timestamp = message.created_at
        ? new Date(message.created_at).toLocaleString(getLocale())
        : "";
      return `
        <div class="${bubbleClass}">
          <div class="chat-meta">
            <strong>${name}</strong>
            <span>${timestamp}</span>
          </div>
          <p>${message.message}</p>
        </div>
      `;
    })
    .join("");
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

async function ensureSupportThread() {
  const client = getSupabaseClient();
  if (!client) {
    setChatStatus(t("chat.auth_missing", "Supabase auth not configured."));
    return null;
  }

  const { data } = await client.auth.getSession();
  const session = data?.session;
  if (!session?.user) {
    setChatStatus(t("chat.sign_in_required", "Sign in to start support chat."));
    setChatEnabled(false);
    return null;
  }

  const user = session.user;
  const { data: threadData, error } = await client
    .from("support_threads")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    setChatStatus(t("chat.thread_failed", "Unable to load your chat thread."));
    return null;
  }

  if (threadData && threadData.length) {
    state.supportThreadId = threadData[0].id;
    return state.supportThreadId;
  }

  const profile = await getUserProfile(user.id);
  const fullName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    getStoredName() ||
    "";

  const payload = {
    user_id: user.id,
    user_email: user.email,
    user_name: fullName || null,
    status: "open",
    last_message_at: new Date().toISOString(),
  };

  const { data: newThread, error: insertError } = await client
    .from("support_threads")
    .insert(payload)
    .select("id")
    .single();

  if (insertError || !newThread) {
    setChatStatus(t("chat.thread_failed", "Unable to start a new chat thread."));
    return null;
  }

  state.supportThreadId = newThread.id;
  return state.supportThreadId;
}

async function loadSupportMessages() {
  const client = getSupabaseClient();
  if (!client) return;

  const { data } = await client.auth.getSession();
  const session = data?.session;
  const user = session?.user;

  const threadId = await ensureSupportThread();
  if (!threadId) return;

  const { data: messages, error } = await client
    .from("support_messages")
    .select("id, sender_role, sender_name, sender_email, message, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    setChatStatus(t("chat.load_failed", "Could not load messages."));
    return;
  }

  state.supportMessages = messages || [];
  setChatEnabled(true);
  setChatStatus(t("chat.ready", "Support online. Send a message."));
  renderSupportMessages(state.supportMessages, user?.email);
}

async function sendSupportMessage(formData) {
  const client = getSupabaseClient();
  if (!client) return;

  const { data } = await client.auth.getSession();
  const session = data?.session;
  if (!session?.user) {
    setChatStatus(t("chat.sign_in_required", "Sign in to start support chat."));
    setChatEnabled(false);
    return;
  }

  const threadId = await ensureSupportThread();
  if (!threadId) return;

  const message = String(formData.get("message") || "").trim();
  if (!message) return;

  const profile = await getUserProfile(session.user.id);
  const senderName =
    profile?.full_name || session.user.user_metadata?.full_name || getStoredName() || null;

  const payload = {
    thread_id: threadId,
    sender_id: session.user.id,
    sender_role: "buyer",
    sender_name: senderName,
    sender_email: session.user.email,
    message,
  };

  const { error } = await client.from("support_messages").insert(payload);
  if (error) {
    setChatStatus(t("chat.send_failed", "Message failed to send."));
    return;
  }

  await client
    .from("support_threads")
    .update({ last_message_at: new Date().toISOString(), status: "open" })
    .eq("id", threadId);

  if (elements.chatForm) {
    elements.chatForm.reset();
  }
  await loadSupportMessages();
}

function openChatModal() {
  if (!elements.chatModal) return;
  elements.chatModal.classList.add("show");
  elements.chatModal.setAttribute("aria-hidden", "false");
  setChatStatus(t("chat.status_idle", "Sign in to start chat."));
  setChatEnabled(false);
  loadSupportMessages();
}

function closeChatModal() {
  if (!elements.chatModal) return;
  elements.chatModal.classList.remove("show");
  elements.chatModal.setAttribute("aria-hidden", "true");
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
  state.activeBundle = bundle;
  const items = ids
    .map((id) => state.products.find((product) => product.id === id))
    .filter(Boolean)
    .map((product) => `&bull; ${product.name}`)
    .join("<br />");
  const kitLabel = t("bundles.kit", "{{bundle}} kit", { bundle });
  elements.bundleSummary.innerHTML = `<strong>${kitLabel}</strong><br />${items}`;
}

function initAuth() {
  const client = getSupabaseClient();
  if (!client) {
    refreshAuthStatus();
    return;
  }

  client.auth.onAuthStateChange(() => {
    refreshAuthStatus();
  });
  refreshAuthStatus();
}

async function loadSupabaseProducts() {
  const client = getSupabaseClient();
  if (!client) {
    state.supabaseInfo = { mode: "local_demo", count: 0 };
    updateSupabaseStatus();
    return null;
  }

  let categories = [];
  let subcategories = [];
  const categoriesResult = await client
    .from("categories")
    .select("id, name")
    .eq("active", true)
    .order("name", { ascending: true });
  if (!categoriesResult.error) {
    categories = categoriesResult.data || [];
  }

  const subcategoriesResult = await client
    .from("subcategories")
    .select("id, name, category_id")
    .eq("active", true)
    .order("name", { ascending: true });
  if (!subcategoriesResult.error) {
    subcategories = subcategoriesResult.data || [];
  }

  state.categories = categories;
  state.subcategories = subcategories;

  const categoryMap = categories.reduce((acc, item) => {
    acc[item.id] = item.name;
    return acc;
  }, {});
  const categoryNameToId = categories.reduce((acc, item) => {
    acc[item.name] = item.id;
    return acc;
  }, {});
  const subcategoryMap = subcategories.reduce((acc, item) => {
    acc[item.id] = item.name;
    return acc;
  }, {});

  const { data, error } = await client.from("products").select("*").limit(50);

  if (error || !data) {
    state.supabaseInfo = { mode: "offline_demo", count: 0 };
    updateSupabaseStatus();
    return null;
  }

  const mapped = data
    .filter((item) => item.active !== false)
    .map((item, index) => ({
      id: item.id || item.sku || `sb-${index}`,
      name: item.name || t("product.unnamed", "Unnamed product"),
      category_id: item.category_id || categoryNameToId[item.category] || null,
      subcategory_id: item.subcategory_id || null,
      category: item.category || t("product.default_category", "Gear"),
      categoryName:
        (item.category_id && categoryMap[item.category_id]) ||
        categoryMap[categoryNameToId[item.category]] ||
        item.category ||
        t("product.default_category", "Gear"),
      subcategoryName:
        (item.subcategory_id && subcategoryMap[item.subcategory_id]) || "",
      price: Number(item.price) || 0,
      rating: Number(item.rating) || 4.5,
      badge: item.badge || t("product.default_badge", "Live"),
      description: item.description || t("product.default_desc", "Supabase item"),
      hue: Number(item.image_hue) || (140 + index * 24) % 360,
      image_url: item.image_url || "",
      video_url: item.video_url || "",
    }));

  state.supabaseInfo = { mode: "synced", count: mapped.length };
  updateSupabaseStatus();
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

  if (elements.categorySelect) {
    elements.categorySelect.addEventListener("change", (event) => {
      state.activeCategoryId = event.target.value || "all";
      state.activeSubcategoryId = "all";
      buildFilters();
      applyFilters();
    });
  }

  if (elements.subcategorySelect) {
    elements.subcategorySelect.addEventListener("change", (event) => {
      state.activeSubcategoryId = event.target.value || "all";
      applyFilters();
    });
  }

  elements.grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add]");
    if (!button) return;
    addToCart(button.dataset.add);
  });

  elements.grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-review]");
    if (!button) return;
    openReviewModal(button.dataset.review);
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
    showToast(t("toast.newsletter", "Welcome to the signal update"));
    event.target.reset();
  });

  document.getElementById("viewSetup").addEventListener("click", openSetup);
  document.getElementById("closeSetup").addEventListener("click", closeSetup);

  if (elements.closeReview) {
    elements.closeReview.addEventListener("click", closeReviewModal);
  }

  if (elements.reviewForm) {
    elements.reviewForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await submitReview(new FormData(event.target));
    });
  }

  if (elements.supportChatButton) {
    elements.supportChatButton.addEventListener("click", openChatModal);
  }

  if (elements.closeChat) {
    elements.closeChat.addEventListener("click", closeChatModal);
  }

  if (elements.chatForm) {
    elements.chatForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await sendSupportMessage(new FormData(event.target));
    });
  }

  if (elements.buyerRegister) {
    elements.buyerRegister.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const fullName = String(formData.get("full_name") || "").trim();
      const email = String(formData.get("email") || "").trim();
      const password = String(formData.get("password") || "");
      if (fullName) {
        try {
          localStorage.setItem("techstuf_name", fullName);
        } catch (error) {
          // ignore storage failures
        }
      }
      const result = await signUpUser(email, password, {
        role: "buyer",
        full_name: fullName || undefined,
      });
      if (result) {
        showToast(t("toast.buyer_created", "Buyer account created. Check email to confirm."));
        event.target.reset();
        refreshAuthStatus();
      }
    });
  }

  if (elements.buyerLogin) {
    elements.buyerLogin.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const email = String(formData.get("email") || "").trim();
      const password = String(formData.get("password") || "");
      const result = await signInUser(email, password);
      if (result) {
        showToast(t("toast.buyer_login", "Buyer login successful"));
        event.target.reset();
        refreshAuthStatus();
      }
    });
  }

  if (elements.buyerAccountForm) {
    elements.buyerAccountForm.addEventListener("submit", handleBuyerAccountUpdate);
  }

  if (elements.adminRegister) {
    elements.adminRegister.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const email = String(formData.get("email") || "").trim();
      const password = String(formData.get("password") || "");
      const reason = String(formData.get("reason") || "").trim();
      const result = await signUpUser(email, password, { role: "admin_request" });
      if (result) {
        showToast(t("toast.admin_created", "Admin account created. Requesting approval."));
        await requestAdminAccess(reason);
        event.target.reset();
      }
    });
  }

  if (elements.adminLogin) {
    elements.adminLogin.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const email = String(formData.get("email") || "").trim();
      const password = String(formData.get("password") || "");
      const result = await signInUser(email, password);
      if (result) {
        showToast(t("toast.admin_login", "Admin login successful"));
        event.target.reset();
        refreshAuthStatus();
      }
    });
  }

  if (elements.ownerLogin) {
    elements.ownerLogin.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const email = String(formData.get("email") || "").trim();
      const password = String(formData.get("password") || "");
      const result = await signInUser(email, password);
      if (result) {
        showToast(t("toast.owner_login", "Owner login successful"));
        event.target.reset();
        refreshAuthStatus();
      }
    });
  }

  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener("click", async () => {
      const client = getSupabaseClient();
      if (!client) {
        showToast(t("toast.auth_missing", "Supabase auth not configured"));
        return;
      }
      await client.auth.signOut();
      refreshAuthStatus();
      showToast(t("toast.signed_out", "Signed out"));
    });
  }
}

async function init() {
  const supabaseProducts = await loadSupabaseProducts();
  state.products = supabaseProducts || DEFAULT_PRODUCTS;
  state.filtered = state.products;
  await loadReviews();
  buildFilters();
  renderProducts();
  renderBundle(state.activeBundle);
  renderCart();
  bindEvents();
  loadPayPalSdk();
  initAuth();
  initReveal();
}

window.addEventListener("techstuf:toast", (event) => {
  const message = event?.detail?.message;
  if (message) {
    showToast(message);
  }
});

window.addEventListener("techstuf:languagechange", () => {
  buildFilters();
  applyFilters();
  renderBundle(state.activeBundle || "Creator");
  renderCart();
  updateSupabaseStatus();
  refreshAuthStatus();
});

document.addEventListener("DOMContentLoaded", init);
