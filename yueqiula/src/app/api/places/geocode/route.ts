import { NextResponse } from "next/server";

/**
 * Amap Geocode API - convert address to coordinates
 * https://lbs.amap.com/api/webservice/guide/api/georegeo
 */
export async function GET(request: Request) {
  const key = process.env.AMAP_WEB_SERVICE_KEY || process.env.NEXT_PUBLIC_AMAP_KEY;
  if (!key) {
    return NextResponse.json({ error: "Amap key not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address")?.trim() || "";
  const city = searchParams.get("city") || "上海";

  if (!address) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  try {
    const url = new URL("https://restapi.amap.com/v3/geocode/geo");
    url.searchParams.set("key", key);
    url.searchParams.set("address", address);
    url.searchParams.set("city", city);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.status !== "1" || !data.geocodes?.length) {
      return NextResponse.json({ location: null });
    }

    const loc = data.geocodes[0].location; // "lng,lat"
    return NextResponse.json({ location: loc });
  } catch (error) {
    console.error("Geocode error:", error);
    return NextResponse.json({ location: null });
  }
}
