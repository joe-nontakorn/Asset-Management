// file: LocationRouters.ts
import { AssetLocation } from "../locations/controllers/locations";
import { getRecentActivity } from "../locations/controllers/locations";


export async function locationRouter(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // ✅ เปลี่ยนเส้นทางตามที่ระบุ
  if (req.method === "GET" && pathname === "/api/dashboard/location/asset-location") {
    return await AssetLocation(req);
  }

  if (req.method === "GET" && pathname === "/api/dashboard/RecentActivity") {
    return await getRecentActivity(req);
  }



  return new Response("Not Found", { status: 404 });
}
