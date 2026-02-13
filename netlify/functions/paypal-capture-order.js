const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_ENV = process.env.PAYPAL_ENV || "sandbox";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PAYPAL_API_BASE =
  PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

async function getAccessToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("PayPal credentials not configured");
  }

  const basicAuth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal auth failed: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      const name = String(item.name || "").trim();
      const price = Number(item.price);
      const qty = Math.max(1, Number(item.qty) || 1);
      if (!name || !Number.isFinite(price) || price <= 0) {
        return null;
      }
      return {
        name: name.slice(0, 160),
        price,
        qty,
      };
    })
    .filter(Boolean);
}

function getCaptureInfo(order) {
  const purchaseUnit = order?.purchase_units?.[0];
  const capture = purchaseUnit?.payments?.captures?.[0];
  return {
    captureId: capture?.id || null,
    status: capture?.status || order?.status || null,
    currency:
      capture?.amount?.currency_code ||
      purchaseUnit?.amount?.currency_code ||
      null,
    total: capture?.amount?.value || purchaseUnit?.amount?.value || null,
  };
}

async function saveOrderToSupabase(orderRecord) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;

  const restUrl = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/orders`;
  try {
    await fetch(restUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(orderRecord),
    });
  } catch (error) {
    // Swallow logging failures so the checkout still succeeds.
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders, body: "Method Not Allowed" };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const orderID = payload.orderID;
    const payloadItems = normalizeItems(payload.items);
    const payloadCurrency = String(payload.currency || "").toUpperCase();
    const payloadTotal = Number(payload.total) || null;

    if (!orderID) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Missing orderID" }),
      };
    }

    const accessToken = await getAccessToken();
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify({ error: data }),
      };
    }

    const captureInfo = getCaptureInfo(data);
    const total = Number(captureInfo.total || payloadTotal || 0);
    const currency = (captureInfo.currency || payloadCurrency || "USD").toUpperCase();

    const orderRecord = {
      paypal_order_id: orderID,
      status: captureInfo.status || data.status || "captured",
      currency,
      total: Number.isFinite(total) ? total : null,
      items: payloadItems,
      payer_email: data?.payer?.email_address || null,
      payer_id: data?.payer?.payer_id || null,
      capture_id: captureInfo.captureId || null,
      source: "paypal",
    };

    await saveOrderToSupabase(orderRecord);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message || "Server error" }),
    };
  }
};
