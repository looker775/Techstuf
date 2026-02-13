const TECHSTUF_CONFIG = typeof window !== "undefined" ? window.TECHSTUF_CONFIG || {} : {};
const SUPABASE_URL = TECHSTUF_CONFIG.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = TECHSTUF_CONFIG.SUPABASE_ANON_KEY || "";
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

const elements = {
  adminLogin: document.getElementById("adminLogin"),
  adminStatus: document.getElementById("adminStatus"),
  ownerLogin: document.getElementById("ownerLogin"),
  ownerStatus: document.getElementById("ownerStatus"),
  logoutBtn: document.getElementById("logoutBtn"),
};

const DASHBOARD_PATH = "/kali/dashboard/";
const ADMIN_PATH = "/kali/admin/";

function redirectToDashboard() {
  if (!window.location.pathname.startsWith(DASHBOARD_PATH)) {
    window.location.href = DASHBOARD_PATH;
  }
}

function redirectToAdmin() {
  if (!window.location.pathname.startsWith(ADMIN_PATH)) {
    window.location.href = ADMIN_PATH;
  }
}

let supabaseClient = null;

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

function setStatus(element, message) {
  if (!element) return;
  element.textContent = message;
}

async function getUserRole(userId) {
  const client = getSupabaseClient();
  if (!client || !userId) {
    return { role: null, error: t("status.auth_missing", "Auth not configured.") };
  }

  const { data, error } = await client
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return {
      role: null,
      error: `${error.message || "Role lookup failed."} (${error.code || "no_code"})`,
    };
  }

  if (!data) {
    return { role: null, error: "No profile row found or access denied." };
  }

  return { role: data.role || null, error: null };
}

async function refreshAuthStatus() {
  const client = getSupabaseClient();
  if (!client) {
    setStatus(elements.adminStatus, t("status.auth_missing", "Auth not configured."));
    setStatus(elements.ownerStatus, t("status.auth_missing", "Auth not configured."));
    return;
  }

  let { data } = await client.auth.getSession();
  let session = data?.session;
  if (!session) {
    const refreshed = await client.auth.refreshSession();
    session = refreshed.data?.session || null;
  }

  if (!session?.user) {
    setStatus(elements.adminStatus, t("status.admin_requires", "Admin access requires approval."));
    setStatus(elements.ownerStatus, t("status.owner_only", "Owner access only."));
    return;
  }

  const user = session.user;
  const roleResult = await getUserRole(user.id);

  if (roleResult.error) {
    if (OWNER_EMAIL && user.email.toLowerCase() === OWNER_EMAIL) {
      setStatus(elements.adminStatus, t("status.owner_logged_in", "Owner logged in."));
      setStatus(
        elements.ownerStatus,
        t("status.owner_access_granted", "Owner access granted.") + ` ${user.email}`
      );
      redirectToDashboard();
      return;
    }

    setStatus(
      elements.adminStatus,
      `${t("status.signed_in_as", "Signed in as {{email}}.", { email: user.email })} ${roleResult.error}`
    );
    setStatus(elements.ownerStatus, t("status.owner_only", "Owner access only."));
    console.error("Role lookup failed", roleResult.error);
    return;
  }

  const role = roleResult.role || "buyer";

  if (role === "owner") {
    setStatus(elements.adminStatus, t("status.owner_logged_in", "Owner logged in."));
    setStatus(
      elements.ownerStatus,
      t("status.owner_access_granted", "Owner access granted.") + ` ${user.email}`
    );
    redirectToDashboard();
  } else if (role === "admin") {
    setStatus(
      elements.adminStatus,
      t("status.admin_access_approved", "Admin access approved.") + ` ${user.email}`
    );
    setStatus(elements.ownerStatus, t("status.owner_only", "Owner access only."));
    redirectToAdmin();
  } else {
    setStatus(
      elements.adminStatus,
      t("status.admin_access_pending", "Admin access pending owner approval.")
    );
    setStatus(elements.ownerStatus, t("status.owner_only", "Owner access only."));
  }
}

async function signInUser(email, password) {
  const client = getSupabaseClient();
  if (!client) {
    alert(t("toast.auth_missing", "Supabase auth not configured"));
    return null;
  }

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    alert(error.message);
    return null;
  }

  return data;
}

function bindEvents() {
  if (elements.adminLogin) {
    elements.adminLogin.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const email = String(formData.get("email") || "").trim();
      const password = String(formData.get("password") || "");
      const result = await signInUser(email, password);
      if (result) {
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
        refreshAuthStatus();
      }
    });
  }

  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener("click", async () => {
      const client = getSupabaseClient();
      if (!client) {
        alert(t("toast.auth_missing", "Supabase auth not configured"));
        return;
      }
      await client.auth.signOut();
      refreshAuthStatus();
    });
  }
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

window.addEventListener("techstuf:languagechange", () => {
  refreshAuthStatus();
});

bindEvents();
initAuth();
