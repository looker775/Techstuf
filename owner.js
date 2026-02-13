const TECHSTUF_CONFIG = typeof window !== "undefined" ? window.TECHSTUF_CONFIG || {} : {};
const SUPABASE_URL = TECHSTUF_CONFIG.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = TECHSTUF_CONFIG.SUPABASE_ANON_KEY || "";
const OWNER_EMAIL = (TECHSTUF_CONFIG.OWNER_EMAIL || "").toLowerCase();

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
}

async function initDashboard() {
  const owner = await guardOwnerAccess();
  if (!owner) return;
  await loadAdminRequests();
  await loadAdminPermissions();
  await loadProductCount();
}

bindEvents();
initDashboard();
