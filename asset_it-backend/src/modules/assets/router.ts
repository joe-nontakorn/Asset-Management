// File: backend/src/modules/assets/router.ts
import { createAsset, getLocations, updateAsset, generateAssetCode } from "../assets/controllers/asset";
import { getAssetTypesID } from "../assets/controllers/assetType";
import { searchAssets,  } from "../assets/controllers/assetSearch"
import { getAssetHistory } from "../assets/controllers/assetHistory";

export async function assetRouter(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pathname = url.pathname;

    const updateMatch = pathname.match(/^\/api\/assets\/update\/(.+)$/);
    if (req.method === "PUT" && updateMatch) {
        return updateAsset(req);
    }



    // ✅ POST /api/assets (สร้าง asset)
    if (req.method === "POST" && pathname === "/api/assets") {
        return createAsset(req);
    }

    // ✅ GET /api/assets/generate-code
    if (req.method === "GET" && pathname === "/api/assets/generate-code") {
        return generateAssetCode(req);
    }

    // ✅ GET /api/assets/locations
    if (req.method === "GET" && pathname === "/api/assets/locations") {
        return getLocations(req);
    }

    // ✅ GET /api/assets/types-id
    if (req.method === "GET" && pathname === "/api/assets/types-id") {
        return getAssetTypesID(req);
    }

    // ✅ GET /api/assets/search
    if (req.method === "GET" && pathname === "/api/assets/search") {
        return searchAssets(req);
    }

    const historyMatch = pathname.match(/^\/api\/assets\/(\d+)\/history$/);
    if (req.method === "GET" && historyMatch) {
        return getAssetHistory(req);
    }


    //   // ✅ PUT /api/assets/:id
    // if (req.method === "PUT" && pathname === "/api/assets/update") {
    //   return updateAsset(req);
    // }


    return new Response("Not Found in asset router", { status: 404 });
}
