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
  productFormTitle: document.getElementById("productFormTitle"),
  productSubmitBtn: document.getElementById("productSubmitBtn"),
  productCancelBtn: document.getElementById("productCancelBtn"),
  productStatus: document.getElementById("productStatus"),
  productManageList: document.getElementById("productManageList"),
  productManageStatus: document.getElementById("productManageStatus"),
  categoryForm: document.getElementById("categoryForm"),
  categoryStatus: document.getElementById("categoryStatus"),
  subcategoryForm: document.getElementById("subcategoryForm"),
  subcategoryStatus: document.getElementById("subcategoryStatus"),
  categoryList: document.getElementById("categoryList"),
  subcategoryList: document.getElementById("subcategoryList"),
  categoryManageStatus: document.getElementById("categoryManageStatus"),
  subcategoryManageStatus: document.getElementById("subcategoryManageStatus"),
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
let cachedCategories = [];
let productCache = new Map();

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

function setManageStatus(element, message) {
  if (!element) return;
  element.textContent = message;
}

function escapeAttr(value) {
  return String(value || "").replace(/"/g, "&quot;");
}

function setProductFormMode(mode, product) {
  if (!elements.productForm) return;
  const form = elements.productForm;
  const isEdit = mode === "edit" && product;
  form.dataset.editingId = isEdit ? product.id : "";
  form.dataset.imageUrl = isEdit ? product.image_url || "" : "";
  form.dataset.videoUrl = isEdit ? product.video_url || "" : "";

  if (elements.productFormTitle) {
    elements.productFormTitle.textContent = isEdit ? "Edit product" : "Publish product";
  }
  if (elements.productSubmitBtn) {
    elements.productSubmitBtn.textContent = isEdit ? "Save changes" : "Publish product";
  }
  if (elements.productCancelBtn) {
    elements.productCancelBtn.hidden = !isEdit;
  }

  if (!isEdit) {
    form.reset();
    return;
  }

  form.querySelector('input[name="name"]').value = product.name || "";
  form.querySelector('input[name="name_ru"]').value = product.name_ru || "";
  form.querySelector('input[name="price"]').value = product.price ?? "";
  form.querySelector('input[name="badge"]').value = product.badge || "";
  form.querySelector('textarea[name="description"]').value = product.description || "";
  form.querySelector('textarea[name="description_ru"]').value = product.description_ru || "";
  const activeInput = form.querySelector('input[name="active"]');
  if (activeInput) {
    activeInput.checked = product.active !== false;
  }

  const categoryId = product.category_id || "";
  const subcategoryId = product.subcategory_id || "";

  if (elements.productCategorySelect) {
    elements.productCategorySelect.value = categoryId;
  }
  if (elements.productSubcategorySelect) {
    if (categoryId) {
      loadSubcategories(categoryId).then((subs) => {
        fillSelect(elements.productSubcategorySelect, subs, "Select subcategory");
        elements.productSubcategorySelect.value = subcategoryId;
      });
    } else {
      fillSelect(elements.productSubcategorySelect, [], "Select subcategory");
    }
  }
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
  cachedCategories = data || [];
  return cachedCategories;
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
  fillSelect(elements.productCategorySelect, categories, "Select category");
  fillSelect(elements.subcategoryCategorySelect, categories, "Select category");

  if (elements.productCategorySelect && elements.productCategorySelect.value) {
    const subs = await loadSubcategories(elements.productCategorySelect.value);
    fillSelect(elements.productSubcategorySelect, subs, "Select subcategory");
  } else {
    fillSelect(elements.productSubcategorySelect, [], "Select subcategory");
  }
}

async function loadManageProducts() {
  if (!elements.productManageList) return;
  if (!permissions.canPublishProducts && !permissions.isOwner) {
    elements.productManageList.innerHTML = "";
    setManageStatus(elements.productManageStatus, "You do not have permission to manage products.");
    return;
  }

  const client = getSupabaseClient();
  if (!client) return;

  const { data, error } = await client
    .from("products")
    .select(
      "id, name, name_ru, description, description_ru, price, badge, image_url, video_url, active, category_id, subcategory_id, categories(name), subcategories(name)"
    )
    .order("name", { ascending: true });

  if (error) {
    elements.productManageList.innerHTML = "";
    setManageStatus(elements.productManageStatus, `Failed: ${error.message}`);
    return;
  }

  const products = data || [];
  productCache = new Map(products.map((item) => [item.id, item]));

  if (!products.length) {
    elements.productManageList.innerHTML = "<tr><td colspan=\"6\">No products yet.</td></tr>";
    setManageStatus(elements.productManageStatus, "No products yet.");
    return;
  }

  elements.productManageList.innerHTML = products
    .map((product) => {
      const categoryName = product.categories?.name || "--";
      const subcategoryName = product.subcategories?.name || "--";
      const priceLabel = formatMoney(product.price, PAYPAL_CURRENCY);
      return `
        <tr data-id="${product.id}">
          <td>${escapeAttr(product.name || "")}</td>
          <td>${priceLabel}</td>
          <td>${escapeAttr(categoryName)}</td>
          <td>${escapeAttr(subcategoryName)}</td>
          <td><input type="checkbox" ${product.active ? "checked" : ""} disabled /></td>
          <td class="table-actions">
            <button class="action-btn approve" data-action="edit">Edit</button>
            <button class="action-btn reject" data-action="delete">Delete</button>
          </td>
        </tr>
      `;
    })
    .join("");

  setManageStatus(elements.productManageStatus, "Loaded.");
}

function startProductEdit(productId) {
  const product = productCache.get(productId);
  if (!product) return;
  setProductFormMode("edit", product);
  if (elements.productForm) {
    elements.productForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function deleteProductRow(productId) {
  if (!productId) return;
  if (!confirm("Delete this product?")) return;
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.from("products").delete().eq("id", productId);
  if (error) {
    setManageStatus(elements.productManageStatus, `Failed: ${error.message}`);
    return;
  }
  setManageStatus(elements.productManageStatus, "Product deleted.");
  await loadManageProducts();
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

  const editingId = elements.productForm?.dataset.editingId || "";

  const formData = new FormData(event.target);
  const name = String(formData.get("name") || "").trim();
  const nameRu = String(formData.get("name_ru") || "").trim();
  const price = Number(formData.get("price") || 0);
  const badge = String(formData.get("badge") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const descriptionRu = String(formData.get("description_ru") || "").trim();
  const imageFile = formData.get("image_file");
  const videoFile = formData.get("video_file");
  const active = formData.get("active") ? true : false;
  const categoryText = String(formData.get("category_text") || "").trim();
  const categoryId = String(formData.get("category_id") || "");
  const subcategoryId = String(formData.get("subcategory_id") || "");
  const categoryFromId = categoryId
    ? cachedCategories.find((item) => item.id === categoryId)?.name
    : "";
  const resolvedCategoryText = categoryText || categoryFromId || "";

  if (!name || !price) {
    setText(elements.productStatus, "Name and price are required.");
    return;
  }

  if (!categoryId) {
    setText(elements.productStatus, "Please select a category.");
    return;
  }

  if (!subcategoryId) {
    setText(elements.productStatus, "Please select a subcategory.");
    return;
  }

  let imageUrl = elements.productForm?.dataset.imageUrl || null;
  let videoUrl = elements.productForm?.dataset.videoUrl || null;

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
    name_ru: nameRu || null,
    price,
    badge,
    description,
    description_ru: descriptionRu || null,
    image_url: imageUrl || null,
    video_url: videoUrl || null,
    category: resolvedCategoryText || undefined,
    category_id: categoryId || null,
    subcategory_id: subcategoryId || null,
    active,
    published_by: currentUser?.id || null,
  };

  const client = getSupabaseClient();
  if (!client) return;

  const { error } = editingId
    ? await client.from("products").update(payload).eq("id", editingId)
    : await client.from("products").insert(payload);
  if (error) {
    setText(elements.productStatus, `${editingId ? "Update" : "Publish"} failed: ${error.message}`);
    return;
  }

  setText(
    elements.productStatus,
    editingId ? "Product updated successfully." : "Product published successfully."
  );
  setProductFormMode("create");
  await loadManageProducts();
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

async function loadManageCategories() {
  if (!elements.categoryList) return;
  const client = getSupabaseClient();
  if (!client) return;

  const { data, error } = await client
    .from("categories")
    .select("id, name, description, active")
    .order("name", { ascending: true });

  if (error) {
    setManageStatus(elements.categoryManageStatus, `Failed: ${error.message}`);
    elements.categoryList.innerHTML = "";
    return;
  }

  const categories = data || [];
  if (!categories.length) {
    elements.categoryList.innerHTML = "<tr><td colspan=\"4\">No categories yet.</td></tr>";
    setManageStatus(elements.categoryManageStatus, "No categories yet.");
    return;
  }

  elements.categoryList.innerHTML = categories
    .map(
      (category) => `
        <tr data-id="${category.id}">
          <td><input class="table-input" type="text" value="${escapeAttr(category.name)}" /></td>
          <td><input class="table-input" type="text" value="${escapeAttr(category.description || "")}" /></td>
          <td><input type="checkbox" ${category.active ? "checked" : ""} /></td>
          <td class="table-actions">
            <button class="action-btn approve" data-action="save">Save</button>
            <button class="action-btn reject" data-action="delete">Delete</button>
          </td>
        </tr>
      `
    )
    .join("");

  setManageStatus(elements.categoryManageStatus, "Loaded.");
}

async function loadManageSubcategories() {
  if (!elements.subcategoryList) return;
  const client = getSupabaseClient();
  if (!client) return;

  const { data, error } = await client
    .from("subcategories")
    .select("id, name, description, active, category_id")
    .order("name", { ascending: true });

  if (error) {
    setManageStatus(elements.subcategoryManageStatus, `Failed: ${error.message}`);
    elements.subcategoryList.innerHTML = "";
    return;
  }

  const subs = data || [];
  if (!subs.length) {
    elements.subcategoryList.innerHTML = "<tr><td colspan=\"5\">No subcategories yet.</td></tr>";
    setManageStatus(elements.subcategoryManageStatus, "No subcategories yet.");
    return;
  }

  const categoryOptions = cachedCategories
    .map((cat) => `<option value="${cat.id}">${cat.name}</option>`)
    .join("");

  elements.subcategoryList.innerHTML = subs
    .map(
      (sub) => `
        <tr data-id="${sub.id}">
          <td><input class="table-input" type="text" value="${escapeAttr(sub.name)}" /></td>
          <td>
            <select class="table-select">
              ${categoryOptions.replace(
                `value="${sub.category_id}"`,
                `value="${sub.category_id}" selected`
              )}
            </select>
          </td>
          <td><input class="table-input" type="text" value="${escapeAttr(sub.description || "")}" /></td>
          <td><input type="checkbox" ${sub.active ? "checked" : ""} /></td>
          <td class="table-actions">
            <button class="action-btn approve" data-action="save">Save</button>
            <button class="action-btn reject" data-action="delete">Delete</button>
          </td>
        </tr>
      `
    )
    .join("");

  setManageStatus(elements.subcategoryManageStatus, "Loaded.");
}

async function saveCategoryRow(row) {
  if (!permissions.canManageCategories) {
    setManageStatus(elements.categoryManageStatus, "No permission to manage categories.");
    return;
  }
  const client = getSupabaseClient();
  if (!client) return;
  const inputs = row.querySelectorAll("input");
  const name = inputs[0]?.value?.trim();
  const description = inputs[1]?.value?.trim();
  const active = inputs[2]?.checked ?? true;
  const id = row.dataset.id;

  if (!name) {
    setManageStatus(elements.categoryManageStatus, "Name is required.");
    return;
  }

  const { error } = await client
    .from("categories")
    .update({ name, description, active })
    .eq("id", id);
  if (error) {
    setManageStatus(elements.categoryManageStatus, `Failed: ${error.message}`);
    return;
  }

  setManageStatus(elements.categoryManageStatus, "Category updated.");
  await refreshCatalogLists();
  await loadManageCategories();
  await loadManageSubcategories();
}

async function deleteCategoryRow(row) {
  if (!permissions.canManageCategories) {
    setManageStatus(elements.categoryManageStatus, "No permission to manage categories.");
    return;
  }
  const client = getSupabaseClient();
  if (!client) return;
  const id = row.dataset.id;
  if (!confirm("Delete this category? This will remove related subcategories.")) return;
  const { error } = await client.from("categories").delete().eq("id", id);
  if (error) {
    setManageStatus(elements.categoryManageStatus, `Failed: ${error.message}`);
    return;
  }
  setManageStatus(elements.categoryManageStatus, "Category deleted.");
  await refreshCatalogLists();
  await loadManageCategories();
  await loadManageSubcategories();
}

async function saveSubcategoryRow(row) {
  if (!permissions.canManageSubcategories) {
    setManageStatus(elements.subcategoryManageStatus, "No permission to manage subcategories.");
    return;
  }
  const client = getSupabaseClient();
  if (!client) return;
  const name = row.querySelector("input.table-input")?.value?.trim();
  const categoryId = row.querySelector("select.table-select")?.value || "";
  const descInput = row.querySelectorAll("input.table-input")[1];
  const description = descInput ? descInput.value.trim() : "";
  const active = row.querySelector("input[type=\"checkbox\"]")?.checked ?? true;
  const id = row.dataset.id;

  if (!name || !categoryId) {
    setManageStatus(elements.subcategoryManageStatus, "Name and category are required.");
    return;
  }

  const { error } = await client
    .from("subcategories")
    .update({ name, description, active, category_id: categoryId })
    .eq("id", id);
  if (error) {
    setManageStatus(elements.subcategoryManageStatus, `Failed: ${error.message}`);
    return;
  }

  setManageStatus(elements.subcategoryManageStatus, "Subcategory updated.");
  await refreshCatalogLists();
  await loadManageSubcategories();
}

async function deleteSubcategoryRow(row) {
  if (!permissions.canManageSubcategories) {
    setManageStatus(elements.subcategoryManageStatus, "No permission to manage subcategories.");
    return;
  }
  const client = getSupabaseClient();
  if (!client) return;
  const id = row.dataset.id;
  if (!confirm("Delete this subcategory?")) return;
  const { error } = await client.from("subcategories").delete().eq("id", id);
  if (error) {
    setManageStatus(elements.subcategoryManageStatus, `Failed: ${error.message}`);
    return;
  }
  setManageStatus(elements.subcategoryManageStatus, "Subcategory deleted.");
  await refreshCatalogLists();
  await loadManageSubcategories();
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
      loadManageProducts();
    });
  }

  if (elements.productForm) {
    elements.productForm.addEventListener("submit", handleProductSubmit);
  }

  if (elements.productCancelBtn) {
    elements.productCancelBtn.addEventListener("click", () => {
      setProductFormMode("create");
      setText(elements.productStatus, "Awaiting input.");
    });
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
      fillSelect(elements.productSubcategorySelect, subs, "Select subcategory");
    });
  }

  if (elements.categoryList) {
    elements.categoryList.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      const row = button.closest("tr");
      if (!row) return;
      const action = button.dataset.action;
      if (action === "save") {
        saveCategoryRow(row);
      }
      if (action === "delete") {
        deleteCategoryRow(row);
      }
    });
  }

  if (elements.subcategoryList) {
    elements.subcategoryList.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      const row = button.closest("tr");
      if (!row) return;
      const action = button.dataset.action;
      if (action === "save") {
        saveSubcategoryRow(row);
      }
      if (action === "delete") {
        deleteSubcategoryRow(row);
      }
    });
  }

  if (elements.productManageList) {
    elements.productManageList.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      const row = button.closest("tr");
      if (!row) return;
      const productId = row.dataset.id;
      const action = button.dataset.action;
      if (action === "edit") {
        startProductEdit(productId);
      }
      if (action === "delete") {
        deleteProductRow(productId);
      }
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
  await loadManageCategories();
  await loadManageSubcategories();
  await loadManageProducts();
  setProductFormMode("create");
}

bindEvents();
initAdmin();
