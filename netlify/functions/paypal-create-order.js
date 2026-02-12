const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_ENV = process.env.PAYPAL_ENV || "sandbox";
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

function sanitizeItems(items, currency) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      const price = Number(item.price);
      const qty = Math.max(1, Number(item.qty) || 1);
      if (!item.name || !Number.isFinite(price) || price <= 0) {
        return null;
      }

      return {
        name: String(item.name).slice(0, 127),
        quantity: String(qty),
        unit_amount: {
          currency_code: currency,
          value: price.toFixed(2),
        },
      };
    })
    .filter(Boolean);
}

function calculateTotal(items) {
  return items.reduce((sum, item) => {
    return sum + Number(item.unit_amount.value) * Number(item.quantity);
  }, 0);
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
    const currency = String(payload.currency || "USD").toUpperCase();
    const sanitizedItems = sanitizeItems(payload.items, currency);
    const computedTotal = calculateTotal(sanitizedItems);
    const fallbackTotal = Number(payload.total) || 0;
    const amount = computedTotal > 0 ? computedTotal : fallbackTotal;

    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Invalid order total" }),
      };
    }

    const accessToken = await getAccessToken();
    const value = amount.toFixed(2);
    const purchaseUnit = {
      amount: {
        currency_code: currency,
        value,
      },
    };

    if (sanitizedItems.length) {
      purchaseUnit.items = sanitizedItems;
      purchaseUnit.amount.breakdown = {
        item_total: {
          currency_code: currency,
          value,
        },
      };
    }

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [purchaseUnit],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify({ error: data }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ id: data.id }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message || "Server error" }),
    };
  }
};