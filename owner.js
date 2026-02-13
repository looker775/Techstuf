const TECHSTUF_CONFIG = typeof window !== "undefined" ? window.TECHSTUF_CONFIG || {} : {};
const SUPABASE_URL = TECHSTUF_CONFIG.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = TECHSTUF_CONFIG.SUPABASE_ANON_KEY || "";
const OWNER_EMAIL = (TECHSTUF_CONFIG.OWNER_EMAIL || "").toLowerCase();

const elements = {
  ownerGreeting: document.getElementById("ownerGreeting"),
  ownerRoleStatus: document.getElementById("ownerRoleStatus"),
  logoutBtn: document.getElementById("logoutBtn"),
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
    return;
  }

  const { data } = await client.auth.getSession();
  const session = data?.session;
  if (!session?.user) {
    window.location.href = "/kali";
    return;
  }

  const user = session.user;
  const role = await getUserRole(user.id);
  const isOwner = role === "owner" || (OWNER_EMAIL && user.email.toLowerCase() === OWNER_EMAIL);

  if (!isOwner) {
    window.location.href = "/kali";
    return;
  }

  setText(elements.ownerGreeting, `Welcome back, ${user.email}.`);
  setText(elements.ownerRoleStatus, "Owner access granted.");
}

function bindEvents() {
  if (!elements.logoutBtn) return;
  elements.logoutBtn.addEventListener("click", async () => {
    const client = getSupabaseClient();
    if (!client) return;
    await client.auth.signOut();
    window.location.href = "/kali";
  });
}

bindEvents();
guardOwnerAccess();