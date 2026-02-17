import { NextResponse } from "next/server";

/**
 * Proxy to Amap Place Search (Web Service API)
 * https://lbs.amap.com/api/webservice/guide/api/search
 */
export async function GET(request: Request) {
  const key = process.env.AMAP_WEB_SERVICE_KEY || process.env.NEXT_PUBLIC_AMAP_KEY;
  if (!key) {
    return NextResponse.json({ error: "Amap key not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const keywords = searchParams.get("keywords")?.trim() || "";
  const city = searchParams.get("city") || "上海";

  if (!keywords) {
    return NextResponse.json({ pois: [] });
  }

  try {
    const url = new URL("https://restapi.amap.com/v3/place/text");
    url.searchParams.set("key", key);
    url.searchParams.set("keywords", keywords);
    url.searchParams.set("city", city);
    url.searchParams.set("offset", "10");

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.status !== "1") {
      console.warn("Amap Place Search:", data.info || data.status);
      return NextResponse.json({ pois: [] });
    }

    const pois = (data.pois || []).map((p: { id: string; name: string; address?: string; location?: string; pname?: string; adname?: string }) => ({
      id: p.id,
      name: p.name,
      address: p.address || [p.pname, p.adname].filter(Boolean).join("") || p.name,
      location: p.location || "121.47,31.23",
    }));

    return NextResponse.json({ pois });
  } catch (error) {
    console.error("Place search error:", error);
    return NextResponse.json({ pois: [] });
  }
}
