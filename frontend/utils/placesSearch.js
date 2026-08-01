import * as Location from 'expo-location';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

const CATEGORY_LABELS = {
  restaurant: 'Restaurant',
  cafe: 'Cafe',
  fast_food: 'Fast Food',
  bar: 'Bar',
  pub: 'Pub',
  supermarket: 'Grocery',
  convenience: 'Convenience Store',
  mall: 'Shopping',
  shop: 'Store',
  retail: 'Store',
  clothes: 'Clothing Store',
  bakery: 'Bakery',
  pharmacy: 'Pharmacy',
  bank: 'Bank',
  hotel: 'Hotel',
  cinema: 'Cinema',
  hospital: 'Hospital',
  school: 'School',
  university: 'University',
  parking: 'Parking',
  fuel: 'Gas Station',
};

function inferCategory(type, categoryClass) {
  const key = String(type || '').toLowerCase();

  if (CATEGORY_LABELS[key]) {
    return CATEGORY_LABELS[key];
  }

  if (categoryClass === 'shop' || categoryClass === 'amenity') {
    return CATEGORY_LABELS[key] || 'Place';
  }

  return 'Place';
}

function formatNominatimAddress(item) {
  const address = item.address || {};
  const parts = [
    address.house_number && address.road
      ? `${address.house_number} ${address.road}`
      : address.road,
    address.city || address.town || address.village,
    address.state,
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(', ');
  }

  const display = String(item.display_name || '');
  return display.split(',').slice(0, 3).join(', ');
}

function mapNominatimResult(item) {
  return {
    id: `place-${item.place_id}`,
    name:
      item.namedetails?.name ||
      item.name ||
      String(item.display_name || 'Place').split(',')[0],
    address: formatNominatimAddress(item),
    latitude: Number(item.lat),
    longitude: Number(item.lon),
    category: inferCategory(item.type, item.class),
    type: item.type || 'place',
    source: 'place',
    phone: null,
    website: null,
    hours: null,
  };
}

function mapGeocodeResult(text, result, index) {
  return {
    id: `geocode-${index}-${result.latitude}-${result.longitude}`,
    name: text,
    address: [
      result.name,
      result.street,
      result.city,
      result.region,
    ]
      .filter(Boolean)
      .join(', '),
    latitude: result.latitude,
    longitude: result.longitude,
    category: 'Address',
    type: 'address',
    source: 'address',
    phone: null,
    website: null,
    hours: null,
  };
}

function dedupePlaces(places) {
  const seen = new Set();

  return places.filter((place) => {
    const key = `${place.latitude.toFixed(5)}:${place.longitude.toFixed(5)}:${place.name}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function fetchNominatim(query, near) {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '1',
    namedetails: '1',
    limit: '10',
    countrycodes: 'us',
  });

  if (near?.latitude != null && near?.longitude != null) {
    const lat = near.latitude;
    const lng = near.longitude;
    const delta = 0.12;
    params.set(
      'viewbox',
      `${lng - delta},${lat + delta},${lng + delta},${lat - delta}`
    );
    params.set('bounded', '1');
  }

  const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'IntelliPark/1.0',
    },
  });

  if (!response.ok) {
    return [];
  }

  const rows = await response.json();
  return Array.isArray(rows) ? rows.map(mapNominatimResult) : [];
}

export async function searchPlaces(query, near = null) {
  const trimmed = query.trim();

  if (trimmed.length < 3) {
    return [];
  }

  const [nominatimResults, geocodeResults] = await Promise.all([
    fetchNominatim(trimmed, near).catch(() => []),
    Location.geocodeAsync(trimmed).catch(() => []),
  ]);

  const geocoded = geocodeResults.map((result, index) =>
    mapGeocodeResult(trimmed, result, index)
  );

  return dedupePlaces([...nominatimResults, ...geocoded]).slice(0, 10);
}

export async function loadPlaceDetails(place) {
  if (!place?.latitude || !place?.longitude) {
    return place;
  }

  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: place.latitude,
      longitude: place.longitude,
    });

    if (!results?.length) {
      return place;
    }

    const row = results[0];
    const address = [
      row.name,
      row.street,
      row.city,
      row.region,
    ]
      .filter(Boolean)
      .join(', ');

    return {
      ...place,
      address: address || place.address,
      phone: place.phone || row.phone || null,
    };
  } catch {
    return place;
  }
}
