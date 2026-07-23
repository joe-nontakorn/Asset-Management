// File: backend/src/modules/settings/router.ts
import {
  getAssetTypes, 
  addAssetType, 
  updateAssetType, 
  getAssetSubtypes, 
  getSubtypesByTypeId, 
  addAssetSubtype, 
  updateAssetSubtype
} from "./controllers/SetAssetType";


import { getLocations, addLocation, deleteLocation, updateLocation } from "./controllers/SetLocation";
export async function settingsRouter(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Location update
  const updateMatch = pathname.match(/^\/api\/settings\/location\/update\/(\d+)$/);
  if (req.method === "PUT" && updateMatch) {
    const id = updateMatch[1];
    return updateLocation(req, id);
  }

  // ✅ Asset Type update (NEW)
  const assetTypeUpdateMatch = pathname.match(/^\/api\/settings\/asset-type\/update\/(\d+)$/);
  if (req.method === "PUT" && assetTypeUpdateMatch) {
    const id = assetTypeUpdateMatch[1];
    return updateAssetType(req, id);
  }

  // ✅ Asset Subtype update (NEW)
const assetSubtypeUpdateMatch = pathname.match(/^\/api\/settings\/asset-subtype\/update\/(\d+)$/);
if (req.method === "PUT" && assetSubtypeUpdateMatch) {
  const id = assetSubtypeUpdateMatch[1];
  return updateAssetSubtype(req, id);
}



  if (pathname.startsWith("/api/settings/location")) {
    if (req.method === "GET" && pathname === "/api/settings/location/get-locations") {
      return getLocations(req);
    }
    if (req.method === "POST" && pathname === "/api/settings/location/add") {
      return addLocation(req);
    }
    if (req.method === "DELETE" && pathname.startsWith("/api/settings/location/delete")) {
      return deleteLocation(req);
    }
  }



  if (pathname.startsWith("/api/settings/asset-type")) {
    if (req.method === "GET" && pathname === "/api/settings/asset-type/get-asset-types") {
      return getAssetTypes();
    }
    if (req.method === "POST" && pathname === "/api/settings/asset-type/add") {
      return addAssetType(req);
    }
  }

  if (pathname.startsWith("/api/settings/asset-subtype")) {
  if (req.method === "GET") {
    if (pathname === "/api/settings/asset-subtype/get-subtypes") {
      return getAssetSubtypes();
    }

    if (url.searchParams.has("asset_type_id")) {
      return getSubtypesByTypeId(req);
    }
  }

  if (req.method === "POST" && pathname === "/api/settings/asset-subtype/add") {
    return addAssetSubtype(req);
  }
}


  return new Response("Not Found in settings router", { status: 404 });
}
