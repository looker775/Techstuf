const IP_GEO_SOURCES = [
  'https://ipwho.is/',
  'https://ipapi.co/json/',
  'https://geolocation-db.com/json/',
];

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

exports.handler = async (event) => {
  const headers = event?.headers || {};
  const netlifyGeo = parseNetlifyGeo(headers);
  if (netlifyGeo) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify(netlifyGeo),
    };
  }

  for (const url of IP_GEO_SOURCES) {
    const location = await fetchIpLocation(url);
    if (location) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify(location),
      };
    }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify({}),
  };
};
