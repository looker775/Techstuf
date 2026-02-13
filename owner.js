const TECHSTUF_CONFIG = typeof window !== "undefined" ? window.TECHSTUF_CONFIG || {} : {};
const SUPABASE_URL = TECHSTUF_CONFIG.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = TECHSTUF_CONFIG.SUPABASE_ANON_KEY || "";
const OWNER_EMAIL = (TECHSTUF_CONFIG.OWNER_EMAIL || "").toLowerCase();
const MEDIA_BUCKET = TECHSTUF_CONFIG.MEDIA_BUCKET || "product-media";

const elements = {
  ownerGreeting: document.getElementById("ownerGreeting"),
  ownerRoleStatus: document.getElementById("ownerRoleStatus"),
  logoutBtn: document.getElementById("logoutBtn"),
  refreshDashboard: document.getElementById("refreshDashboard"),
  adminRequests: document.getElementById("adminRequests"),
  adminError: document.getElementById("adminError"),
  adminPermissions: document.getElementById("adminPermissions"),
  permissionsError: document.getElementById("permissionsError"),
  pendingCount: document.getElementById("pendingCount"),
  approvedCount: document.getElementById("approvedCount"),
  productCount: document.getElementById("productCount"),
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

function setHidden(element, hidden) {
  if (!element) return;
  element.hidden = hidden;
}

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString();
}

function statusBadge(status) {
  const safeStatus = status || "pending";
  return `<span class="status-pill ${safeStatus}">${safeStatus}</span>`;
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

async function getUserRole(userId) {
  const client = getSupabaseClient();
  if (!client || !userId) return null;
  const { data, error } = await client
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data.role;
}

async function guardOwnerAccess() {
  const client = getSupabaseClient();
  if (!client) {
    setText(elements.ownerGreeting, "Auth not configured.");
    setText(elements.ownerRoleStatus, "Missing Supabase config.");
    return null;
  }

  const { data } = await client.auth.getSession();
  const session = data?.session;
  if (!session?.user) {
    window.location.href = "/kali";
    return null;
  }

  const user = session.user;
  const role = await getUserRole(user.id);
  const isOwner = role === "owner" || (OWNER_EMAIL && user.email.toLowerCase() === OWNER_EMAIL);

  if (!isOwner) {
    window.location.href = "/kali";
    return null;
  }

  setText(elements.ownerGreeting, `Welcome back, ${user.email}.`);
  setText(elements.ownerRoleStatus, "Owner access granted.");
  return user;
}

async function loadProductCount() {
  const client = getSupabaseClient();
  if (!client) return;
  const { count, error } = await client
    .from("products")
    .select("id", { count: "exact", head: true });
  if (error) {
    setText(elements.productCount, "--");
    return;
  }
  setText(elements.productCount, String(count || 0));
}

async function loadAdminRequests() {
  const client = getSupabaseClient();
  if (!client) return;

  const { data, error } = await client
    .from("admin_requests")
    .select("id, user_id, email, reason, status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    setText(elements.adminError, "Admin requests not accessible. Add owner policies in Supabase.");
    setHidden(elements.adminError, false);
    if (elements.adminRequests) {
      elements.adminRequests.innerHTML = "";
    }
    return;
  }

  setHidden(elements.adminError, true);

  const requests = data || [];
  const pending = requests.filter((item) => item.status === "pending");
  const approved = requests.filter((item) => item.status === "approved");

  setText(elements.pendingCount, String(pending.length));
  setText(elements.approvedCount, String(approved.length));

  if (!elements.adminRequests) return;

  if (!requests.length) {
    elements.adminRequests.innerHTML =
      "<tr><td colspan=\"5\">No admin requests yet.</td></tr>";
    return;
  }

  elements.adminRequests.innerHTML = requests
    .map((request) => {
      const actions =
        request.status === "pending"
          ? `
            <button class=\"action-btn approve\" data-action=\"approve\" data-id=\"${request.id}\" data-user=\"${request.user_id}\">Approve</button>
            <button class=\"action-btn reject\" data-action=\"reject\" data-id=\"${request.id}\" data-user=\"${request.user_id}\">Reject</button>
          `
          : "--";

      return `
        <tr>
          <td>${request.email}</td>
          <td>${request.reason || "--"}</td>
          <td>${statusBadge(request.status)}</td>
          <td>${formatDate(request.created_at)}</td>
          <td>${actions}</td>
        </tr>
      `;
    })
    .join("");
}

async function loadAdminPermissions() {
  const client = getSupabaseClient();
  if (!client) return;

  const { data, error } = await client
    .from("profiles")
    .select(
      "id, email, role, is_active, can_publish_products, can_manage_categories, can_manage_subcategories"
    )
    .eq("role", "admin")
    .order("email", { ascending: true });

  if (error) {
    setText(
      elements.permissionsError,
      "Admin permissions not accessible. Add owner policies in Supabase."
    );
    setHidden(elements.permissionsError, false);
    if (elements.adminPermissions) {
      elements.adminPermissions.innerHTML = "";
    }
    return;
  }

  setHidden(elements.permissionsError, true);

  const admins = data || [];
  if (!elements.adminPermissions) return;

  if (!admins.length) {
    elements.adminPermissions.innerHTML = "<tr><td colspan=\"5\">No admins yet.</td></tr>";
    return;
  }

  elements.adminPermissions.innerHTML = admins
    .map((admin) => {
      const activeChecked = admin.is_active ? "checked" : "";
      const productChecked = admin.can_publish_products ? "checked" : "";
      const categoryChecked = admin.can_manage_categories ? "checked" : "";
      const subcategoryChecked = admin.can_manage_subcategories ? "checked" : "";

      return `
        <tr>
          <td>${admin.email}</td>
          <td><input type="checkbox" data-field="is_active" data-id="${admin.id}" ${activeChecked} /></td>
          <td><input type="checkbox" data-field="can_publish_products" data-id="${admin.id}" ${productChecked} /></td>
          <td><input type="checkbox" data-field="can_manage_categories" data-id="${admin.id}" ${categoryChecked} /></td>
          <td><input type="checkbox" data-field="can_manage_subcategories" data-id="${admin.id}" ${subcategoryChecked} /></td>
        </tr>
      `;
    })
    .join("");
}

async function updateAdminPermission(adminId, field, value) {
  const client = getSupabaseClient();
  if (!client) return;

  const { error } = await client.from("profiles").update({ [field]: value }).eq("id", adminId);
  if (error) {
    alert(`Failed to update admin: ${error.message}`);
    await loadAdminPermissions();
  }
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

async function approveAdmin(requestId, userId) {
  const client = getSupabaseClient();
  if (!client) return;

  const { error: requestError } = await client
    .from("admin_requests")
    .update({ status: "approved" })
    .eq("id", requestId);

  if (requestError) {
    alert(`Failed to approve: ${requestError.message}`);
    return;
  }

  if (userId) {
    const { error: roleError } = await client
      .from("profiles")
      .update({
        role: "admin",
        is_active: true,
        can_publish_products: false,
        can_manage_categories: false,
        can_manage_subcategories: false,
      })
      .eq("id", userId);

    if (roleError) {
      alert(`Approved request, but failed to set role: ${roleError.message}`);
    }
  }

  loadAdminRequests();
  loadAdminPermissions();
}

async function rejectAdmin(requestId, userId) {
  const client = getSupabaseClient();
  if (!client) return;

  const { error: requestError } = await client
    .from("admin_requests")
    .update({ status: "rejected" })
    .eq("id", requestId);

  if (requestError) {
    alert(`Failed to reject: ${requestError.message}`);
    return;
  }

  if (userId) {
    await client
      .from("profiles")
      .update({
        role: "buyer",
        can_publish_products: false,
        can_manage_categories: false,
        can_manage_subcategories: false,
      })
      .eq("id", userId);
  }

  loadAdminRequests();
  loadAdminPermissions();
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

  if (elements.refreshDashboard) {
    elements.refreshDashboard.addEventListener("click", () => {
      loadAdminRequests();
      loadAdminPermissions();
      refreshCatalogLists();
      loadProductCount();
    });
  }

  if (elements.adminRequests) {
    elements.adminRequests.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      const action = button.dataset.action;
      const requestId = button.dataset.id;
      const userId = button.dataset.user;
      if (action === "approve") {
        approveAdmin(requestId, userId);
      }
      if (action === "reject") {
        rejectAdmin(requestId, userId);
      }
    });
  }

  if (elements.adminPermissions) {
    elements.adminPermissions.addEventListener("change", (event) => {
      const checkbox = event.target.closest("input[data-field]");
      if (!checkbox) return;
      const adminId = checkbox.dataset.id;
      const field = checkbox.dataset.field;
      const value = checkbox.checked;
      updateAdminPermission(adminId, field, value);
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

async function initDashboard() {
  const owner = await guardOwnerAccess();
  if (!owner) return;
  await loadAdminRequests();
  await loadAdminPermissions();
  await refreshCatalogLists();
  await loadProductCount();
}

bindEvents();
initDashboard();
