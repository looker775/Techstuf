const TECHSTUF_CONFIG = typeof window !== "undefined" ? window.TECHSTUF_CONFIG || {} : {};
const SUPABASE_URL = TECHSTUF_CONFIG.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = TECHSTUF_CONFIG.SUPABASE_ANON_KEY || "";
const PAYPAL_CURRENCY = TECHSTUF_CONFIG.PAYPAL_CURRENCY || "USD";
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

const elements = {
  productDetail: document.getElementById("productDetail"),
  productNotFound: document.getElementById("productNotFound"),
  productMedia: document.getElementById("productMedia"),
  productMediaPlaceholder: document.getElementById("productMediaPlaceholder"),
  productCategory: document.getElementById("productCategory"),
  productName: document.getElementById("productName"),
  productDescription: document.getElementById("productDescription"),
  productPrice: document.getElementById("productPrice"),
  productRating: document.getElementById("productRating"),
  viewVideoBtn: document.getElementById("viewVideoBtn"),
  addToCartBtn: document.getElementById("addToCartBtn"),
  buyNowBtn: document.getElementById("buyNowBtn"),
  scrollReviewsBtn: document.getElementById("scrollReviewsBtn"),
  productQty: document.getElementById("productQty"),
  productStatus: document.getElementById("productStatus"),
  productSku: document.getElementById("productSku"),
  productReviewTitle: document.getElementById("productReviewTitle"),
  productReviewMeta: document.getElementById("productReviewMeta"),
  productReviewRating: document.getElementById("productReviewRating"),
  productReviewList: document.getElementById("productReviewList"),
  productReviewForm: document.getElementById("productReviewForm"),
  productReviewStatus: document.getElementById("productReviewStatus"),
  toast: document.getElementById("toast"),
};

let supabaseClient = null;
let currentProduct = null;
let currentReviews = [];

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
  if (supabaseClient) return supabaseClient;
  if (!window.supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
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

function setText(element, message) {
  if (!element) return;
  element.textContent = message;
}

function showToast(message) {
  if (!elements.toast) return;
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  setTimeout(() => elements.toast.classList.remove("show"), 2200);
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

function saveCart(cart) {
  localStorage.setItem("techstuf_cart", JSON.stringify(cart));
}

function getProductId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function loadCategoryMaps(client) {
  const categoryMap = {};
  const subcategoryMap = {};

  const categoriesResult = await client
    .from("categories")
    .select("id, name")
    .eq("active", true);
  if (!categoriesResult.error) {
    (categoriesResult.data || []).forEach((item) => {
      categoryMap[item.id] = item.name;
    });
  }

  const subcategoriesResult = await client
    .from("subcategories")
    .select("id, name")
    .eq("active", true);
  if (!subcategoriesResult.error) {
    (subcategoriesResult.data || []).forEach((item) => {
      subcategoryMap[item.id] = item.name;
    });
  }

  return { categoryMap, subcategoryMap };
}

function mapSupabaseProduct(item, index, categoryMap, subcategoryMap) {
  const hue = Number(item.image_hue) || (140 + index * 24) % 360;
  const categoryName = (item.category_id && categoryMap[item.category_id]) || item.category || "";
  const subcategoryName = (item.subcategory_id && subcategoryMap[item.subcategory_id]) || "";
  return {
    id: item.id || item.sku || `sb-${index}`,
    name: item.name || t("product.unnamed", "Unnamed product"),
    category: item.category || t("product.default_category", "Gear"),
    categoryName: categoryName || item.category || t("product.default_category", "Gear"),
    subcategoryName,
    price: Number(item.price) || 0,
    rating: Number(item.rating) || 0,
    badge: item.badge || t("product.default_badge", "Live"),
    description: item.description || t("product.default_desc", "Supabase item"),
    hue,
    image_url: item.image_url || "",
    video_url: item.video_url || "",
  };
}

async function loadSupabaseProduct(productId) {
  const client = getSupabaseClient();
  if (!client || !productId) return null;

  const { categoryMap, subcategoryMap } = await loadCategoryMaps(client);
  const { data, error } = await client
    .from("products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();

  if (error || !data) return null;
  return mapSupabaseProduct(data, 0, categoryMap, subcategoryMap);
}

async function loadReviews(productId) {
  const client = getSupabaseClient();
  if (!client || !productId) return [];

  const { data, error } = await client
    .from("product_reviews")
    .select("rating, comment, created_at, user_email")
    .eq("product_id", productId);

  if (error) return [];
  return data || [];
}

function renderReviews(product, reviews) {
  if (!elements.productReviewTitle) return;
  const average =
    reviews.length > 0
      ? reviews.reduce((sum, item) => sum + (item.rating || 0), 0) / reviews.length
      : null;

  elements.productReviewTitle.textContent = t("review.title_with_product", "{{name}} reviews", {
    name: product.name,
  });
  elements.productReviewMeta.textContent = t("review.count", "{{count}} review(s)", { count: reviews.length });
  elements.productReviewRating.innerHTML =
    average === null
      ? t("rating.none", "No ratings yet")
      : `${renderStars(average)} ${average.toFixed(1)} / 5`;

  if (!reviews.length) {
    elements.productReviewList.innerHTML = `<p>${t(
      "review.no_reviews",
      "No reviews yet. Be the first to review."
    )}</p>`;
  } else {
    elements.productReviewList.innerHTML = reviews
      .map((review) => {
        const comment = review.comment || t("review.no_comment", "No comment provided.");
        const reviewer = review.user_email || t("review.verified_buyer", "Verified buyer");
        const dateLabel = review.created_at
          ? new Date(review.created_at).toLocaleString(getLocale())
          : "";
        return `
          <div class="review-item">
            <div>${renderStars(review.rating)} ${Number(review.rating).toFixed(1)}</div>
            <p>${comment}</p>
            <small>${reviewer}${dateLabel ? ` · ${dateLabel}` : ""}</small>
          </div>
        `;
      })
      .join("");
  }
}

async function submitReview(event) {
  event.preventDefault();
  if (!currentProduct) return;

  const client = getSupabaseClient();
  if (!client) {
    setText(elements.productReviewStatus, t("toast.auth_missing", "Supabase auth not configured"));
    return;
  }

  const { data } = await client.auth.getSession();
  const session = data?.session;
  if (!session?.user) {
    setText(elements.productReviewStatus, t("review_form.login_required", "Please log in to submit a review."));
    return;
  }

  const formData = new FormData(event.target);
  const rating = Number(formData.get("rating") || 0);
  const comment = String(formData.get("comment") || "").trim();

  if (rating < 1 || rating > 5) {
    setText(elements.productReviewStatus, t("review.rating_error", "Please select a rating between 1 and 5."));
    return;
  }

  const payload = {
    product_id: currentProduct.id,
    rating,
    comment,
    user_id: session.user.id,
    user_email: session.user.email,
  };

  const { error } = await client.from("product_reviews").insert(payload);
  if (error) {
    setText(
      elements.productReviewStatus,
      t("review.submit_failed", "Submit failed: {{message}}", { message: error.message })
    );
    return;
  }

  setText(elements.productReviewStatus, t("review.submit_success", "Review submitted."));
  event.target.reset();
  currentReviews = await loadReviews(currentProduct.id);
  renderReviews(currentProduct, currentReviews);
}

function setProductImage(product) {
  if (!elements.productMedia) return;
  const hue = Number(product.hue) || 160;
  elements.productMedia.style.setProperty("--hue", hue);

  if (!product.image_url) {
    if (elements.productMediaPlaceholder) {
      elements.productMediaPlaceholder.hidden = false;
    }
    return;
  }

  const img = new Image();
  img.src = product.image_url;
  img.alt = product.name || "Product image";
  img.loading = "lazy";
  img.addEventListener("load", () => {
    if (elements.productMediaPlaceholder) {
      elements.productMediaPlaceholder.hidden = true;
    }
    const link = document.createElement("a");
    link.href = product.image_url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.className = "product-media-link";
    link.appendChild(img);
    elements.productMedia.innerHTML = "";
    elements.productMedia.appendChild(link);
  });
  img.addEventListener("error", () => {
    if (elements.productMediaPlaceholder) {
      elements.productMediaPlaceholder.hidden = false;
    }
  });
}

function renderProduct(product, reviews) {
  if (!product) {
    if (elements.productDetail) elements.productDetail.hidden = true;
    if (elements.productNotFound) elements.productNotFound.hidden = false;
    const reviewSection = document.getElementById("productReviews");
    if (reviewSection) reviewSection.hidden = true;
    return;
  }

  if (elements.productDetail) elements.productDetail.hidden = false;
  if (elements.productNotFound) elements.productNotFound.hidden = true;
  const reviewSection = document.getElementById("productReviews");
  if (reviewSection) reviewSection.hidden = false;

  setProductImage(product);
  setText(elements.productCategory, product.categoryName || product.category || "");
  setText(elements.productName, product.name || t("product.unnamed", "Unnamed product"));
  setText(elements.productDescription, product.description || "");
  setText(elements.productPrice, formatMoney(product.price || 0));
  setText(elements.productSku, `ID: ${product.id}`);

  const rating =
    reviews.length > 0
      ? reviews.reduce((sum, item) => sum + (Number(item.rating) || 0), 0) / reviews.length
      : null;
  const ratingLabel =
    rating === null
      ? t("rating.none", "No ratings yet")
      : `${renderStars(rating)} ${rating.toFixed(1)}`;
  if (elements.productRating) {
    elements.productRating.innerHTML = ratingLabel;
  }

  if (elements.viewVideoBtn) {
    if (product.video_url) {
      elements.viewVideoBtn.href = product.video_url;
      elements.viewVideoBtn.hidden = false;
    } else {
      elements.viewVideoBtn.hidden = true;
    }
  }

  renderReviews(product, reviews);
}

function addToCart(product) {
  const qty = Math.max(1, Number(elements.productQty?.value) || 1);
  const cart = loadCart();
  const existing = cart[product.id];
  cart[product.id] = {
    product,
    qty: existing ? existing.qty + qty : qty,
  };
  saveCart(cart);
  setText(
    elements.productStatus,
    t("product.added_to_cart", "Added to cart. Return to store to checkout.")
  );
  showToast(t("toast.added", "Added to cart"));
}

function buyNow(product) {
  addToCart(product);
  try {
    localStorage.setItem("techstuf_open_cart", "1");
  } catch {
    // ignore
  }
  window.location.href = "index.html#cart";
}

function initReveal() {
  const items = document.querySelectorAll("[data-reveal]");
  if (!items.length) return;
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

async function init() {
  const productId = getProductId();
  if (!productId) {
    renderProduct(null, []);
    return;
  }

  const supabaseProduct = await loadSupabaseProduct(productId);
  const product =
    supabaseProduct || DEFAULT_PRODUCTS.find((item) => item.id === productId) || null;

  currentProduct = product;
  currentReviews = product ? await loadReviews(product.id) : [];
  renderProduct(currentProduct, currentReviews);

  if (elements.addToCartBtn && currentProduct) {
    elements.addToCartBtn.addEventListener("click", () => addToCart(currentProduct));
  }

  if (elements.buyNowBtn && currentProduct) {
    elements.buyNowBtn.addEventListener("click", () => buyNow(currentProduct));
  }

  if (elements.scrollReviewsBtn) {
    elements.scrollReviewsBtn.addEventListener("click", () => {
      const target = document.getElementById("productReviews");
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  if (elements.productReviewForm) {
    elements.productReviewForm.addEventListener("submit", submitReview);
  }

  initReveal();
}

window.addEventListener("techstuf:languagechange", () => {
  renderProduct(currentProduct, currentReviews);
});

document.addEventListener("DOMContentLoaded", init);
