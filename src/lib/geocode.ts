const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  if (!address || !MAPBOX_TOKEN) return null;

  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        address
      )}.json?access_token=${MAPBOX_TOKEN}&limit=1`
    );
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
  } catch (err) {
    console.error('Geocoding failed:', err);
  }
  return null;
}
