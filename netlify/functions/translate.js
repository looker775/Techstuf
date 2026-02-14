const MAX_CHUNK = 900;

function splitTextForTranslation(text, maxLen = MAX_CHUNK) {
  const normalized = String(text || "").trim();
  if (!normalized) return [];
  if (normalized.length <= maxLen) return [normalized];

  const parts = normalized.split(/\n+/);
  const chunks = [];
  for (const part of parts) {
    const sentences = part.split(/(?<=[.!?])\s+/);
    let current = "";
    for (const sentence of sentences) {
      const piece = sentence.trim();
      if (!piece) continue;
      if (piece.length > maxLen) {
        const words = piece.split(/\s+/);
        let wordChunk = "";
        for (const word of words) {
          if (!wordChunk) {
            wordChunk = word;
            continue;
          }
          if ((wordChunk + " " + word).length > maxLen) {
            chunks.push(wordChunk);
            wordChunk = word;
          } else {
            wordChunk += ` ${word}`;
          }
        }
        if (wordChunk) chunks.push(wordChunk);
        current = "";
        continue;
      }
      if (!current) {
        current = piece;
        continue;
      }
      if ((current + " " + piece).length > maxLen) {
        chunks.push(current);
        current = piece;
      } else {
        current += ` ${piece}`;
      }
    }
    if (current) chunks.push(current);
  }
  return chunks.length ? chunks : [normalized];
}

async function translateChunk(text, targetLang) {
  const safeLang = String(targetLang || "ru").toLowerCase();
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
    safeLang
  )}&dt=t&q=${encodeURIComponent(text)}`;

  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
  });
  if (!response.ok) return null;
  const data = await response.json();
  if (!Array.isArray(data) || !Array.isArray(data[0])) return null;
  const translated = data[0].map((part) => part && part[0]).filter(Boolean).join("");
  return translated ? String(translated).trim() : null;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    payload = {};
  }

  const text = typeof payload.text === "string" ? payload.text : "";
  const targetLang = payload.targetLang || "ru";

  if (!text.trim()) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ translated: "" }),
    };
  }

  const chunks = splitTextForTranslation(text, MAX_CHUNK);
  const results = [];
  for (const chunk of chunks) {
    const translated = await translateChunk(chunk, targetLang);
    results.push(translated || chunk);
  }

  const combined = results.join("\n").trim();
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify({ translated: combined }),
  };
};
