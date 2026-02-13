const TECHSTUF_CONFIG = typeof window !== "undefined" ? window.TECHSTUF_CONFIG || {} : {};
const SUPABASE_URL = TECHSTUF_CONFIG.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = TECHSTUF_CONFIG.SUPABASE_ANON_KEY || "";
const OWNER_EMAIL = (TECHSTUF_CONFIG.OWNER_EMAIL || "").toLowerCase();

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
};

let supabaseClient = null;
let currentUser = null;
let permissions = {
  canPublishProducts: false,
  canManageCategories: false,
  canManageSubcategories: false,
  isOwner: false,
};

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  if (!window.supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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

  const { data } = await client.auth.getSession();
  const session = data?.session;
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
  const imageHue = Number(formData.get("image_hue") || 140);
  const categoryText = String(formData.get("category_text") || "").trim();
  const categoryId = String(formData.get("category_id") || "");
  const subcategoryId = String(formData.get("subcategory_id") || "");

  if (!name || !price) {
    setText(elements.productStatus, "Name and price are required.");
    return;
  }

  const payload = {
    name,
    price,
    rating,
    badge,
    description,
    image_hue: imageHue,
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
}

async function initAdmin() {
  const user = await guardAdminAccess();
  if (!user) return;
  await refreshCatalogLists();
}

bindEvents();
initAdmin();
