const IP_GEO_SOURCES = [
  'https://ipwho.is/',
  'https://ipapi.co/json/',
  'https://geolocation-db.com/json/',
];

function getClientIp(headers) {
  const direct = headers['x-nf-client-connection-ip'] || headers['X-NF-CLIENT-CONNECTION-IP'];
  if (direct && typeof direct === 'string') return direct.trim();

  const forwarded = headers['x-forwarded-for'] || headers['X-FORWARDED-FOR'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }

  return null;
}

function buildIpSources(clientIp) {
  if (!clientIp) return IP_GEO_SOURCES;
  return [
    `https://ipwho.is/${encodeURIComponent(clientIp)}`,
    `https://ipapi.co/${encodeURIComponent(clientIp)}/json/`,
    `https://geolocation-db.com/json/${encodeURIComponent(clientIp)}`,
  ];
}

function parseIpLocation(data) {
  if (!data || data?.success === false) return null;

  const city =
    data.city ||
    data.region ||
    data.region_name ||
    data.state ||
    data.province ||
    data.locality;

  const countryCode =
    data.country_code ||
    data.countryCode ||
    data.country_code_iso2 ||
    data.country;

  let latRaw = data.latitude ?? data.lat ?? data.location?.lat;
  let lngRaw = data.longitude ?? data.lon ?? data.lng ?? data.location?.lng;

  const locRaw = data.loc || data.location?.loc;
  if ((latRaw === undefined || lngRaw === undefined) && typeof locRaw === 'string' && locRaw.includes(',')) {
    const [latPart, lngPart] = locRaw.split(',');
    if (latRaw === undefined) latRaw = latPart;
    if (lngRaw === undefined) lngRaw = lngPart;
  }

  const lat = typeof latRaw === 'number' ? latRaw : Number(latRaw);
  const lng = typeof lngRaw === 'number' ? lngRaw : Number(lngRaw);

  const location = {};
  if (typeof city === 'string' && city.trim()) location.city = city.trim();
  if (typeof countryCode === 'string' && countryCode.trim()) location.countryCode = countryCode.trim().toUpperCase();
  if (!Number.isNaN(lat)) location.lat = lat;
  if (!Number.isNaN(lng)) location.lng = lng;

  if (!location.city && !location.countryCode && location.lat === undefined && location.lng === undefined) {
    return null;
  }

  return location;
}

function parseNetlifyGeo(headers) {
  const raw = headers['x-nf-geo'] || headers['X-NF-GEO'];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const location = parseIpLocation(parsed);
      if (location) return location;
    } catch {
      // ignore JSON parsing errors
    }
  }

  const city = headers['x-nf-geo-city'] || headers['X-NF-GEO-CITY'];
  const countryCode = headers['x-nf-geo-country'] || headers['X-NF-GEO-COUNTRY'];
  const latRaw = headers['x-nf-geo-latitude'] || headers['X-NF-GEO-LATITUDE'];
  const lngRaw = headers['x-nf-geo-longitude'] || headers['X-NF-GEO-LONGITUDE'];

  if (!city && !countryCode && !latRaw && !lngRaw) return null;

  const lat = latRaw !== undefined ? Number(latRaw) : undefined;
  const lng = lngRaw !== undefined ? Number(lngRaw) : undefined;

  return {
    city: city ? String(city) : undefined,
    countryCode: countryCode ? String(countryCode).toUpperCase() : undefined,
    lat: Number.isNaN(lat) ? undefined : lat,
    lng: Number.isNaN(lng) ? undefined : lng,
  };
}

async function fetchIpLocation(url) {
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    const data = await response.json();
    return parseIpLocation(data);
  } catch {
    return null;
  }
}

function pickBestLocation(locations) {
  if (!locations.length) return null;

  const cityCounts = new Map();
  const countryCounts = new Map();

  for (const loc of locations) {
    if (loc.city) {
      const key = String(loc.city).trim().toLowerCase();
      if (key) cityCounts.set(key, (cityCounts.get(key) || 0) + 1);
    }
    if (loc.countryCode) {
      const key = String(loc.countryCode).toUpperCase();
      countryCounts.set(key, (countryCounts.get(key) || 0) + 1);
    }
  }

  const bestCityKey = [...cityCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const bestCountry = [...countryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  let bestCity;
  let lat;
  let lng;

  if (bestCityKey) {
    const match = locations.find((loc) => String(loc.city || '').trim().toLowerCase() === bestCityKey);
    bestCity = match?.city;
    if (match?.lat !== undefined && match?.lng !== undefined) {
      lat = match.lat;
      lng = match.lng;
    }
  }

  if (lat === undefined || lng === undefined) {
    const latValues = locations.map((loc) => loc.lat).filter((v) => typeof v === 'number');
    const lngValues = locations.map((loc) => loc.lng).filter((v) => typeof v === 'number');
    if (latValues.length && lngValues.length) {
      lat = latValues.reduce((a, b) => a + b, 0) / latValues.length;
      lng = lngValues.reduce((a, b) => a + b, 0) / lngValues.length;
    }
  }

  if (!bestCity && lat === undefined && lng === undefined && !bestCountry) return null;

  return {
    city: bestCity,
    countryCode: bestCountry,
    lat,
    lng,
  };
}

exports.handler = async (event) => {
  const headers = event?.headers || {};
  const candidates = [];
  const netlifyGeo = parseNetlifyGeo(headers);
  if (netlifyGeo) candidates.push(netlifyGeo);

  const clientIp = getClientIp(headers);
  const sources = buildIpSources(clientIp);
  const results = await Promise.all(sources.map((url) => fetchIpLocation(url)));
  for (const result of results) {
    if (result) candidates.push(result);
  }

  const best = pickBestLocation(candidates);
  if (best) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify(best),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify({}),
  };
};
