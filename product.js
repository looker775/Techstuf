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
const getLanguage = () =>
  I18N && typeof I18N.getLanguage === "function" ? I18N.getLanguage() : "en";

const BASE_CURRENCY = (PAYPAL_CURRENCY || "USD").toUpperCase();
const CURRENCY_CACHE_KEY = "techstuf_currency";
const CURRENCY_CACHE_TTL = 12 * 60 * 60 * 1000;
const CURRENCY_CACHE_VERSION = 5;
const GEO_OVERRIDE_KEY = "techstuf_geo_override";
const COUNTRY_CODE_KEY = "techstuf_country_code";
const GEO_OVERRIDE_TTL = 1000 * 60 * 60 * 24 * 14;
const GEO_SOURCES = [
  "/.netlify/functions/ip-geo",
  "https://ipwho.is/",
  "https://ipapi.co/json/",
  "https://geolocation-db.com/json/",
];
const PAYPAL_SUPPORTED_CURRENCIES = new Set([
  "AUD",
  "BRL",
  "CAD",
  "CZK",
  "DKK",
  "EUR",
  "HKD",
  "HUF",
  "ILS",
  "JPY",
  "MYR",
  "MXN",
  "TWD",
  "NZD",
  "NOK",
  "PHP",
  "PLN",
  "GBP",
  "RUB",
  "SGD",
  "SEK",
  "CHF",
  "THB",
  "USD",
]);
const ZERO_DECIMAL_CURRENCIES = new Set(["HUF", "JPY", "TWD"]);
const TRANSLATION_CACHE_KEY = "techstuf_translation_cache_v1";
const TRANSLATION_CACHE_TTL = 1000 * 60 * 60 * 24 * 30;

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
let currentCurrency = BASE_CURRENCY;
let currentRate = 1;

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

function getCurrencyDigits(currency) {
  return ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2;
}

function formatMoney(value, currency = BASE_CURRENCY) {
  const safeCurrency = (currency || BASE_CURRENCY || "USD").toUpperCase();
  const amount = Number(value) || 0;
  try {
    return new Intl.NumberFormat(getLocale(), {
      style: "currency",
      currency: safeCurrency,
      maximumFractionDigits: getCurrencyDigits(safeCurrency),
    }).format(amount);
  } catch (error) {
    return `${amount.toFixed(2)} ${safeCurrency}`;
  }
}

function roundAmount(amount, currency) {
  if (!Number.isFinite(amount)) return amount;
  if (ZERO_DECIMAL_CURRENCIES.has(currency)) return Math.round(amount);
  return Math.round(amount * 100) / 100;
}

function convertAmount(amount) {
  const base = Number(amount) || 0;
  return roundAmount(base * (Number(currentRate) || 1), currentCurrency);
}

function hashString(value) {
  const text = String(value || "");
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 33) ^ text.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function loadTranslationCache() {
  try {
    const raw = localStorage.getItem(TRANSLATION_CACHE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return data && typeof data === "object" ? data : {};
  } catch (error) {
    return {};
  }
}

function saveTranslationCache(cache) {
  try {
    localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    // ignore
  }
}

function readCachedTranslation(text, lang) {
  const key = `${lang}:${hashString(text)}`;
  const cache = loadTranslationCache();
  const entry = cache[key];
  if (!entry || !entry.value || !entry.updatedAt) return null;
  if (Date.now() - entry.updatedAt > TRANSLATION_CACHE_TTL) return null;
  return entry.value;
}

function writeCachedTranslation(text, lang, value) {
  const key = `${lang}:${hashString(text)}`;
  const cache = loadTranslationCache();
  cache[key] = { value, updatedAt: Date.now() };
  saveTranslationCache(cache);
}

const translationInflight = new Map();

async function translateText(text, targetLang) {
  if (!text || typeof text !== "string") return null;
  if (targetLang !== "ru") return null;
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text
    )}&langpair=en|ru`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    const data = await response.json();
    const translated = data?.responseData?.translatedText;
    if (!translated || typeof translated !== "string") return null;
    if (translated.trim().toLowerCase() === text.trim().toLowerCase()) return null;
    return translated.trim();
  } catch (error) {
    return null;
  }
}

function requestTranslation(text, targetLang, onDone) {
  const cacheValue = readCachedTranslation(text, targetLang);
  if (cacheValue) return cacheValue;
  const key = `${targetLang}:${hashString(text)}`;
  if (translationInflight.has(key)) return null;
  translationInflight.set(key, true);
  translateText(text, targetLang)
    .then((translated) => {
      if (translated) {
        writeCachedTranslation(text, targetLang, translated);
        if (typeof onDone === "function") onDone(translated);
      }
    })
    .finally(() => {
      translationInflight.delete(key);
    });
  return null;
}

function formatPrice(value) {
  return formatMoney(convertAmount(value), currentCurrency);
}

function normalizeCurrency(code, fallback = BASE_CURRENCY) {
  const normalized = typeof code === "string" ? code.trim().toUpperCase() : "";
  if (normalized && PAYPAL_SUPPORTED_CURRENCIES.has(normalized)) return normalized;
  const fallbackNormalized = typeof fallback === "string" ? fallback.trim().toUpperCase() : "";
  if (fallbackNormalized && PAYPAL_SUPPORTED_CURRENCIES.has(fallbackNormalized)) return fallbackNormalized;
  return BASE_CURRENCY;
}

function normalizeDisplayCurrency(code, fallback = BASE_CURRENCY) {
  const normalized = typeof code === "string" ? code.trim().toUpperCase() : "";
  if (normalized && normalized.length === 3) return normalized;
  const fallbackNormalized = typeof fallback === "string" ? fallback.trim().toUpperCase() : "";
  if (fallbackNormalized && fallbackNormalized.length === 3) return fallbackNormalized;
  return BASE_CURRENCY;
}

function loadCachedCurrency() {
  try {
    const raw = localStorage.getItem(CURRENCY_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.version !== CURRENCY_CACHE_VERSION) return null;
    if (!data || !data.currency || !data.rate || !data.timestamp) return null;
    if (Date.now() - data.timestamp > CURRENCY_CACHE_TTL) return null;
    if (data.baseCurrency && data.baseCurrency !== BASE_CURRENCY) return null;
    const override = loadGeoOverrideCountry();
    if (override) {
      if (!data.countryCode || data.countryCode !== override) return null;
    }
    return data;
  } catch (error) {
    return null;
  }
}

function saveCachedCurrency(currency, rate, countryCode) {
  try {
    localStorage.setItem(
      CURRENCY_CACHE_KEY,
      JSON.stringify({
        currency,
        rate,
        baseCurrency: BASE_CURRENCY,
        countryCode: countryCode || null,
        version: CURRENCY_CACHE_VERSION,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    // ignore
  }
}

function loadGeoOverrideCountry() {
  try {
    const raw = localStorage.getItem(GEO_OVERRIDE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !data.countryCode || !data.updatedAt) return null;
    if (Date.now() - data.updatedAt > GEO_OVERRIDE_TTL) return null;
    const code = String(data.countryCode).trim().toUpperCase();
    return code.length === 2 ? code : null;
  } catch (error) {
    return null;
  }
}

function loadStoredCountryCode() {
  try {
    const raw = localStorage.getItem(COUNTRY_CODE_KEY);
    if (!raw) return null;
    const code = String(raw).trim().toUpperCase();
    return code.length === 2 ? code : null;
  } catch (error) {
    return null;
  }
}

function parseCountryCode(data) {
  if (!data || data?.success === false) return null;
  const raw =
    data.country_code ||
    data.countryCode ||
    data.country_code_iso2 ||
    data.country;
  if (!raw) return null;
  const code = String(raw).trim().toUpperCase();
  return code.length === 2 ? code : null;
}

async function fetchJson(url, timeoutMs = 3500) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function fetchCountryCode() {
  const override = loadGeoOverrideCountry();
  if (override) return override;
  const candidates = [];
  const stored = loadStoredCountryCode();
  if (stored) candidates.push(stored);
  const responses = await Promise.all(
    GEO_SOURCES.map((url) => fetchJson(url, url.includes("/functions/") ? 2500 : 3500))
  );
  for (const data of responses) {
    const code = parseCountryCode(data);
    if (code) candidates.push(code);
  }
  if (!candidates.length) return null;
  const counts = new Map();
  for (const code of candidates) {
    const key = String(code).toUpperCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

async function fetchCurrencyForCountry(countryCode) {
  if (!countryCode) return null;
  try {
    const response = await fetch(
      `https://restcountries.com/v3.1/alpha/${countryCode}?fields=currencies`,
      { cache: "no-store" }
    );
    if (!response.ok) return null;
    const data = await response.json();
    const entry = Array.isArray(data) ? data[0] : data;
    const currencies = entry?.currencies;
    if (!currencies || typeof currencies !== "object") return null;
    const codes = Object.keys(currencies);
    return codes[0] || null;
  } catch (error) {
    return null;
  }
}

async function fetchExchangeRate(baseCurrency, targetCurrency) {
  if (baseCurrency === targetCurrency) return 1;
  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data?.result !== "success" || !data?.rates) return null;
    const rate = data.rates[targetCurrency];
    return typeof rate === "number" ? rate : null;
  } catch (error) {
    return null;
  }
}

async function initCurrency() {
  const cached = loadCachedCurrency();
  if (cached) {
    currentCurrency = cached.currency;
    currentRate = cached.rate;
    return;
  }

  const countryCode = await fetchCountryCode();
  const rawCurrency = await fetchCurrencyForCountry(countryCode);
  let currency = normalizeDisplayCurrency(rawCurrency, BASE_CURRENCY);
  let rate = await fetchExchangeRate(BASE_CURRENCY, currency);
  if (!rate) {
    currency = BASE_CURRENCY;
    rate = 1;
  }

  currentCurrency = currency;
  currentRate = rate || 1;
  saveCachedCurrency(currency, currentRate, countryCode);
}

function renderStars(rating) {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  const filled = "&#9733;".repeat(Math.round(safeRating));
  const empty = "&#9734;".repeat(5 - Math.round(safeRating));
  return `<span class="review-stars">${filled}${empty}</span>`;
}

function getLocalizedProductField(product, field) {
  if (!product) return "";
  const lang = getLanguage();
  if (lang === "ru") {
    const ruValue = product[`${field}_ru`];
    if (ruValue && String(ruValue).trim()) {
      return ruValue;
    }
    if (field === "description" && product.description) {
      const cached = readCachedTranslation(product.description, "ru");
      if (cached) return cached;
    }
  }
  return product[field] || "";
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
    name_ru: item.name_ru || "",
    category: item.category || t("product.default_category", "Gear"),
    categoryName: categoryName || item.category || t("product.default_category", "Gear"),
    subcategoryName,
    price: Number(item.price) || 0,
    rating: Number(item.rating) || 0,
    badge: item.badge || t("product.default_badge", "Live"),
    description: item.description || t("product.default_desc", "Supabase item"),
    description_ru: item.description_ru || "",
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

  const reviewName = getLocalizedProductField(product, "name") || product.name;
  elements.productReviewTitle.textContent = t("review.title_with_product", "{{name}} reviews", {
    name: reviewName,
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
  img.loading = "eager";
  img.decoding = "async";
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
  const displayName = getLocalizedProductField(product, "name") || product.name || t("product.unnamed", "Unnamed product");
  const displayDescription = getLocalizedProductField(product, "description") || product.description || "";
  setText(elements.productCategory, product.categoryName || product.category || "");
  setText(elements.productName, displayName);
  setText(elements.productDescription, displayDescription);
  setText(elements.productPrice, formatPrice(product.price || 0));
  setText(elements.productSku, `ID: ${product.id}`);

  if (getLanguage() === "ru" && !product.description_ru && product.description) {
    requestTranslation(product.description, "ru", (translated) => {
      if (currentProduct && currentProduct.id === product.id && elements.productDescription) {
        setText(elements.productDescription, translated);
      }
    });
  }

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
  await initCurrency();
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
