const TECHSTUF_CONFIG = typeof window !== "undefined" ? window.TECHSTUF_CONFIG || {} : {};
const SUPABASE_URL = TECHSTUF_CONFIG.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = TECHSTUF_CONFIG.SUPABASE_ANON_KEY || "";
const OWNER_EMAIL = (TECHSTUF_CONFIG.OWNER_EMAIL || "").toLowerCase();
const MEDIA_BUCKET = TECHSTUF_CONFIG.MEDIA_BUCKET || "product-media";
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

const elements = {
  adminGreeting: document.getElementById("adminGreeting"),
  permissionStatus: document.getElementById("permissionStatus"),
  permProducts: document.getElementById("permProducts"),
  permCategories: document.getElementById("permCategories"),
  permSubcategories: document.getElementById("permSubcategories"),
  refreshAdmin: document.getElementById("refreshAdmin"),
  logoutBtn: document.getElementById("logoutBtn"),
  productForm: document.getElementById("productForm"),
  productStatus: document.getElementById("productStatus"),
  categoryForm: document.getElementById("categoryForm"),
  categoryStatus: document.getElementById("categoryStatus"),
  subcategoryForm: document.getElementById("subcategoryForm"),
  subcategoryStatus: document.getElementById("subcategoryStatus"),
  productCategorySelect: document.getElementById("productCategorySelect"),
  productSubcategorySelect: document.getElementById("productSubcategorySelect"),
  subcategoryCategorySelect: document.getElementById("subcategoryCategorySelect"),
  salesRevenue: document.getElementById("salesRevenue"),
  salesOrders: document.getElementById("salesOrders"),
  salesAvg: document.getElementById("salesAvg"),
  salesLast7: document.getElementById("salesLast7"),
  salesTop: document.getElementById("salesTop"),
  recentOrders: document.getElementById("recentOrders"),
  salesStatus: document.getElementById("salesStatus"),
  chatThreads: document.getElementById("chatThreads"),
  chatMessages: document.getElementById("chatMessages"),
  chatReplyForm: document.getElementById("chatReplyForm"),
  chatThreadTitle: document.getElementById("chatThreadTitle"),
  chatThreadMeta: document.getElementById("chatThreadMeta"),
  chatStatus: document.getElementById("chatStatus"),
};

let supabaseClient = null;
let currentUser = null;
let activeChatThreadId = null;
let chatThreadsCache = [];
let permissions = {
  canPublishProducts: false,
  canManageCategories: false,
  canManageSubcategories: false,
  isOwner: false,
};

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

function setPermissionText(element, enabled) {
  if (!element) return;
  element.textContent = enabled ? "Yes" : "No";
}

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString();
}

function formatMoney(value, currency) {
  const safeValue = Number(value) || 0;
  const safeCurrency = (currency || PAYPAL_CURRENCY || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: safeCurrency,
      maximumFractionDigits: 2,
    }).format(safeValue);
  } catch (error) {
    return `${safeCurrency} ${safeValue.toFixed(2)}`;
  }
}

async function getProfile(userId) {
  const client = getSupabaseClient();
  if (!client || !userId) return null;
  const { data, error } = await client
    .from("profiles")
    .select("role, is_active, can_publish_products, can_manage_categories, can_manage_subcategories")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

async function guardAdminAccess() {
  const client = getSupabaseClient();
  if (!client) {
    setText(elements.adminGreeting, "Auth not configured.");
    setText(elements.permissionStatus, "Missing Supabase config.");
    return null;
  }

  let { data } = await client.auth.getSession();
  let session = data?.session;
  if (!session) {
    const refreshed = await client.auth.refreshSession();
    session = refreshed.data?.session || null;
  }
  if (!session?.user) {
    window.location.href = "/kali";
    return null;
  }

  const user = session.user;
  const profile = await getProfile(user.id);
  const role = profile?.role || "buyer";
  const isOwner = role === "owner" || (OWNER_EMAIL && user.email.toLowerCase() === OWNER_EMAIL);

  if (role !== "admin" && !isOwner) {
    window.location.href = "/kali";
    return null;
  }

  if (role === "admin" && profile && profile.is_active === false) {
    setText(elements.adminGreeting, "Admin access disabled by owner.");
    setText(elements.permissionStatus, "Your admin account is disabled.");
    return null;
  }

  currentUser = user;
  permissions = {
    canPublishProducts: isOwner || !!profile?.can_publish_products,
    canManageCategories: isOwner || !!profile?.can_manage_categories,
    canManageSubcategories: isOwner || !!profile?.can_manage_subcategories,
    isOwner,
  };

  setText(elements.adminGreeting, `Signed in as ${user.email}.`);
  setText(elements.permissionStatus, isOwner ? "Owner override enabled." : "Admin permissions loaded.");
  setPermissionText(elements.permProducts, permissions.canPublishProducts);
  setPermissionText(elements.permCategories, permissions.canManageCategories);
  setPermissionText(elements.permSubcategories, permissions.canManageSubcategories);

  return user;
}

async function loadCategories() {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("categories")
    .select("id, name")
    .eq("active", true)
    .order("name", { ascending: true });
  if (error) {
    return [];
  }
  return data || [];
}

async function loadSubcategories(categoryId) {
  const client = getSupabaseClient();
  if (!client) return [];
  if (!categoryId) return [];
  const { data, error } = await client
    .from("subcategories")
    .select("id, name")
    .eq("category_id", categoryId)
    .eq("active", true)
    .order("name", { ascending: true });
  if (error) {
    return [];
  }
  return data || [];
}

function fillSelect(select, options, placeholder) {
  if (!select) return;
  select.innerHTML = "";
  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = placeholder;
  select.appendChild(placeholderOption);
  options.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name;
    select.appendChild(option);
  });
}

async function refreshCatalogLists() {
  const categories = await loadCategories();
  fillSelect(elements.productCategorySelect, categories, "Select category (optional)");
  fillSelect(elements.subcategoryCategorySelect, categories, "Select category");

  if (elements.productCategorySelect && elements.productCategorySelect.value) {
    const subs = await loadSubcategories(elements.productCategorySelect.value);
    fillSelect(elements.productSubcategorySelect, subs, "Select subcategory (optional)");
  } else {
    fillSelect(elements.productSubcategorySelect, [], "Select subcategory (optional)");
  }
}

function normalizeOrderItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      const name = String(item?.name || "").trim();
      const price =
        Number(item?.price) ||
        Number(item?.unit_amount?.value) ||
        0;
      const qty = Math.max(1, Number(item?.qty) || Number(item?.quantity) || 1);
      if (!name || !Number.isFinite(price) || price <= 0) {
        return null;
      }
      return { name, price, qty };
    })
    .filter(Boolean);
}

async function loadSalesAnalytics() {
  const client = getSupabaseClient();
  if (!client) {
    setText(elements.salesStatus, t("analytics.not_ready", "Sales analytics need Supabase config."));
    return;
  }

  setText(elements.salesStatus, t("analytics.loading", "Loading sales data..."));

  const { data, error } = await client
    .from("orders")
    .select("id, paypal_order_id, status, currency, total, items, created_at, payer_email")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    setText(
      elements.salesStatus,
      t("analytics.not_ready", "Orders table not accessible. Run the sales analytics SQL.")
    );
    if (elements.recentOrders) {
      elements.recentOrders.innerHTML =
        `<tr><td colspan="5">${t("analytics.no_orders", "No orders yet.")}</td></tr>`;
    }
    return;
  }

  const orders = data || [];
  if (!orders.length) {
    setText(elements.salesRevenue, "--");
    setText(elements.salesOrders, "0");
    setText(elements.salesAvg, "--");
    setText(elements.salesLast7, "--");
    setText(elements.salesTop, "--");
    if (elements.recentOrders) {
      elements.recentOrders.innerHTML =
        `<tr><td colspan="5">${t("analytics.no_orders", "No orders yet.")}</td></tr>`;
    }
    setText(elements.salesStatus, t("analytics.no_orders", "No orders yet."));
    return;
  }

  const currency =
    orders.find((order) => order.currency)?.currency || PAYPAL_CURRENCY || "USD";
  const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const orderCount = orders.length;
  const avgOrder = orderCount ? totalRevenue / orderCount : 0;

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const last7Total = orders.reduce((sum, order) => {
    const created = new Date(order.created_at).getTime();
    if (Number.isFinite(created) && created >= sevenDaysAgo) {
      return sum + (Number(order.total) || 0);
    }
    return sum;
  }, 0);

  const productTotals = {};
  orders.forEach((order) => {
    const items = normalizeOrderItems(order.items);
    items.forEach((item) => {
      const revenue = item.price * item.qty;
      productTotals[item.name] = (productTotals[item.name] || 0) + revenue;
    });
  });

  const topProductEntry = Object.entries(productTotals).sort((a, b) => b[1] - a[1])[0];
  const topLabel = topProductEntry
    ? `${topProductEntry[0]} (${formatMoney(topProductEntry[1], currency)})`
    : "--";

  setText(elements.salesRevenue, formatMoney(totalRevenue, currency));
  setText(elements.salesOrders, String(orderCount));
  setText(elements.salesAvg, formatMoney(avgOrder, currency));
  setText(elements.salesLast7, formatMoney(last7Total, currency));
  setText(elements.salesTop, topLabel);

  if (elements.recentOrders) {
    elements.recentOrders.innerHTML = orders
      .slice(0, 8)
      .map((order) => {
        const orderId = order.paypal_order_id || order.id || "--";
        const shortId = orderId === "--" ? "--" : orderId.slice(0, 8);
        const email = order.payer_email || "--";
        const total = formatMoney(order.total || 0, currency);
        const status = order.status || "--";
        return `
          <tr>
            <td>${formatDate(order.created_at)}</td>
            <td>${shortId}</td>
            <td>${email}</td>
            <td>${total}</td>
            <td>${status}</td>
          </tr>
        `;
      })
      .join("");
  }

  setText(elements.salesStatus, t("analytics.updated", "Sales data updated."));
}

function renderChatThreads(threads) {
  if (!elements.chatThreads) return;
  if (!threads.length) {
    elements.chatThreads.innerHTML = `<p class="chat-empty">${t(
      "chat.inbox_hint",
      "Select a thread to reply."
    )}</p>`;
    return;
  }

  elements.chatThreads.innerHTML = threads
    .map((thread) => {
      const name = thread.user_name || thread.user_email || "Customer";
      const last = thread.last_message_at ? formatDate(thread.last_message_at) : "--";
      const activeClass = thread.id === activeChatThreadId ? "active" : "";
      return `
        <button class="chat-thread ${activeClass}" data-id="${thread.id}">
          <strong>${name}</strong>
          <span>${last}</span>
        </button>
      `;
    })
    .join("");
}

function renderChatMessages(messages) {
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
      const isStaff = message.sender_role === "owner" || message.sender_role === "admin";
      const bubbleClass = isStaff ? "chat-bubble staff" : "chat-bubble self";
      const name = message.sender_name || message.sender_email || t("chat.support", "Support");
      const timestamp = message.created_at ? formatDate(message.created_at) : "";
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

async function loadSupportThreads() {
  const client = getSupabaseClient();
  if (!client) return;

  const { data, error } = await client
    .from("support_threads")
    .select("id, user_email, user_name, status, last_message_at")
    .order("last_message_at", { ascending: false })
    .limit(50);

  if (error) {
    setText(elements.chatStatus, t("chat.thread_failed", "Support chat not available."));
    renderChatThreads([]);
    return;
  }

  chatThreadsCache = data || [];
  renderChatThreads(chatThreadsCache);

  if (!activeChatThreadId && chatThreadsCache.length) {
    await selectChatThread(chatThreadsCache[0].id);
  }
}

async function selectChatThread(threadId) {
  activeChatThreadId = threadId;
  const thread = chatThreadsCache.find((item) => item.id === threadId);
  if (elements.chatThreadTitle) {
    elements.chatThreadTitle.textContent = thread?.user_name || thread?.user_email || "Customer";
  }
  if (elements.chatThreadMeta) {
    elements.chatThreadMeta.textContent = thread?.user_email || "";
  }
  renderChatThreads(chatThreadsCache);
  await loadChatMessages(threadId);
}

async function loadChatMessages(threadId) {
  const client = getSupabaseClient();
  if (!client || !threadId) return;

  const { data, error } = await client
    .from("support_messages")
    .select("id, sender_role, sender_name, sender_email, message, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    setText(elements.chatStatus, t("chat.load_failed", "Could not load messages."));
    return;
  }

  renderChatMessages(data || []);
  setText(elements.chatStatus, t("chat.ready", "Support online. Send a message."));
}

async function sendChatReply(message) {
  const client = getSupabaseClient();
  if (!client || !activeChatThreadId || !currentUser) return;

  const senderRole = permissions.isOwner ? "owner" : "admin";
  const payload = {
    thread_id: activeChatThreadId,
    sender_id: currentUser.id,
    sender_role: senderRole,
    sender_name: currentUser.user_metadata?.full_name || currentUser.email,
    sender_email: currentUser.email,
    message,
  };

  const { error } = await client.from("support_messages").insert(payload);
  if (error) {
    setText(elements.chatStatus, t("chat.send_failed", "Message failed to send."));
    return;
  }

  await client
    .from("support_threads")
    .update({ last_message_at: new Date().toISOString(), status: "open" })
    .eq("id", activeChatThreadId);

  await loadChatMessages(activeChatThreadId);
  await loadSupportThreads();
}

function buildFileName(file, folder) {
  const cleanName = file.name ? file.name.replace(/\s+/g, "-") : "upload";
  const ext = cleanName.includes(".") ? cleanName.split(".").pop() : "";
  const base = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now();
  return `${folder}/${base}${ext ? "." + ext : ""}`;
}

async function uploadMedia(file, folder) {
  if (!file) return null;
  const client = getSupabaseClient();
  if (!client) return null;

  const fileName = buildFileName(file, folder);
  const { error } = await client.storage.from(MEDIA_BUCKET).upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) {
    throw error;
  }

  const { data } = client.storage.from(MEDIA_BUCKET).getPublicUrl(fileName);
  return data?.publicUrl || null;
}

async function handleProductSubmit(event) {
  event.preventDefault();
  if (!permissions.canPublishProducts) {
    setText(elements.productStatus, "You do not have permission to publish products.");
    return;
  }

  const formData = new FormData(event.target);
  const name = String(formData.get("name") || "").trim();
  const price = Number(formData.get("price") || 0);
  const rating = Number(formData.get("rating") || 4.5);
  const badge = String(formData.get("badge") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const imageFile = formData.get("image_file");
  const videoFile = formData.get("video_file");
  const categoryText = String(formData.get("category_text") || "").trim();
  const categoryId = String(formData.get("category_id") || "");
  const subcategoryId = String(formData.get("subcategory_id") || "");

  if (!name || !price) {
    setText(elements.productStatus, "Name and price are required.");
    return;
  }

  let imageUrl = null;
  let videoUrl = null;

  try {
    if (imageFile && imageFile.size) {
      imageUrl = await uploadMedia(imageFile, "images");
    }
    if (videoFile && videoFile.size) {
      videoUrl = await uploadMedia(videoFile, "videos");
    }
  } catch (error) {
    setText(elements.productStatus, `Upload failed: ${error.message}`);
    return;
  }

  const payload = {
    name,
    price,
    rating,
    badge,
    description,
    image_url: imageUrl,
    video_url: videoUrl,
    category: categoryText || undefined,
    category_id: categoryId || null,
    subcategory_id: subcategoryId || null,
    active: true,
    published_by: currentUser?.id || null,
  };

  const client = getSupabaseClient();
  if (!client) return;

  const { error } = await client.from("products").insert(payload);
  if (error) {
    setText(elements.productStatus, `Publish failed: ${error.message}`);
    return;
  }

  setText(elements.productStatus, "Product published successfully.");
  event.target.reset();
}

async function handleCategorySubmit(event) {
  event.preventDefault();
  if (!permissions.canManageCategories) {
    setText(elements.categoryStatus, "You do not have permission to manage categories.");
    return;
  }

  const formData = new FormData(event.target);
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!name) {
    setText(elements.categoryStatus, "Category name is required.");
    return;
  }

  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.from("categories").insert({ name, description, active: true });
  if (error) {
    setText(elements.categoryStatus, `Failed: ${error.message}`);
    return;
  }

  setText(elements.categoryStatus, "Category created.");
  event.target.reset();
  await refreshCatalogLists();
}

async function handleSubcategorySubmit(event) {
  event.preventDefault();
  if (!permissions.canManageSubcategories) {
    setText(elements.subcategoryStatus, "You do not have permission to manage subcategories.");
    return;
  }

  const formData = new FormData(event.target);
  const name = String(formData.get("name") || "").trim();
  const categoryId = String(formData.get("category_id") || "");
  const description = String(formData.get("description") || "").trim();

  if (!name || !categoryId) {
    setText(elements.subcategoryStatus, "Subcategory name and category are required.");
    return;
  }

  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client
    .from("subcategories")
    .insert({ name, category_id: categoryId, description, active: true });
  if (error) {
    setText(elements.subcategoryStatus, `Failed: ${error.message}`);
    return;
  }

  setText(elements.subcategoryStatus, "Subcategory created.");
  event.target.reset();
  await refreshCatalogLists();
}

function bindEvents() {
  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener("click", async () => {
      const client = getSupabaseClient();
      if (!client) return;
      await client.auth.signOut();
      window.location.href = "/kali";
    });
  }

  if (elements.refreshAdmin) {
    elements.refreshAdmin.addEventListener("click", () => {
      refreshCatalogLists();
      loadSalesAnalytics();
      loadSupportThreads();
    });
  }

  if (elements.productForm) {
    elements.productForm.addEventListener("submit", handleProductSubmit);
  }

  if (elements.categoryForm) {
    elements.categoryForm.addEventListener("submit", handleCategorySubmit);
  }

  if (elements.subcategoryForm) {
    elements.subcategoryForm.addEventListener("submit", handleSubcategorySubmit);
  }

  if (elements.productCategorySelect) {
    elements.productCategorySelect.addEventListener("change", async (event) => {
      const subs = await loadSubcategories(event.target.value);
      fillSelect(elements.productSubcategorySelect, subs, "Select subcategory (optional)");
    });
  }

  if (elements.chatThreads) {
    elements.chatThreads.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-id]");
      if (!button) return;
      selectChatThread(button.dataset.id);
    });
  }

  if (elements.chatReplyForm) {
    elements.chatReplyForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const message = String(formData.get("message") || "").trim();
      if (!message) return;
      await sendChatReply(message);
      event.target.reset();
    });
  }
}

async function initAdmin() {
  const user = await guardAdminAccess();
  if (!user) return;
  await refreshCatalogLists();
  await loadSalesAnalytics();
  await loadSupportThreads();
}

bindEvents();
initAdmin();
