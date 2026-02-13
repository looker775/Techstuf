const TECHSTUF_CONFIG = typeof window !== "undefined" ? window.TECHSTUF_CONFIG || {} : {};
const SUPABASE_URL = TECHSTUF_CONFIG.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = TECHSTUF_CONFIG.SUPABASE_ANON_KEY || "";

const elements = {
  adminLogin: document.getElementById("adminLogin"),
  adminStatus: document.getElementById("adminStatus"),
  ownerLogin: document.getElementById("ownerLogin"),
  ownerStatus: document.getElementById("ownerStatus"),
  logoutBtn: document.getElementById("logoutBtn"),
};

let supabaseClient = null;

function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!window.supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }

  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabaseClient;
}

function setStatus(element, message) {
  if (!element) return;
  element.textContent = message;
}

async function getUserRole(userId) {
  const client = getSupabaseClient();
  if (!client || !userId) {
    return { role: null, error: "Auth not configured." };
  }

  const { data, error } = await client
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) {
    return {
      role: null,
      error: `${error.message || "Role lookup failed."} (${error.code || "no_code"})`,
    };
  }

  if (!data) {
    return { role: null, error: "No profile row found for this user." };
  }

  return { role: data.role || null, error: null };
}

async function refreshAuthStatus() {
  const client = getSupabaseClient();
  if (!client) {
    setStatus(elements.adminStatus, "Auth not configured.");
    setStatus(elements.ownerStatus, "Auth not configured.");
    return;
  }

  const { data } = await client.auth.getSession();
  const session = data?.session;

  if (!session?.user) {
    setStatus(elements.adminStatus, "Admin access requires approval.");
    setStatus(elements.ownerStatus, "Owner access only.");
    return;
  }

  const user = session.user;
  const roleResult = await getUserRole(user.id);

  if (roleResult.error) {
    setStatus(
      elements.adminStatus,
      `Signed in as ${user.email}. Role lookup failed: ${roleResult.error}`
    );
    setStatus(elements.ownerStatus, "Owner access only.");
    console.error("Role lookup failed", roleResult.error);
    return;
  }

  const role = roleResult.role || "buyer";

  if (role === "owner") {
    setStatus(elements.adminStatus, "Owner logged in.");
    setStatus(elements.ownerStatus, `Owner access granted: ${user.email}`);
  } else if (role === "admin") {
    setStatus(elements.adminStatus, `Admin access granted: ${user.email}`);
    setStatus(elements.ownerStatus, "Owner access only.");
  } else {
    setStatus(elements.adminStatus, `Signed in as ${user.email}. Admin approval pending.`);
    setStatus(elements.ownerStatus, "Owner access only.");
  }
}

async function signInUser(email, password) {
  const client = getSupabaseClient();
  if (!client) {
    alert("Supabase auth not configured");
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
        alert("Supabase auth not configured");
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

bindEvents();
initAuth();
