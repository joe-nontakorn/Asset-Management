// File: backend/src/mainRouter.ts
import { assetRouter } from "./modules/assets/router";
import { authRouter } from "./modules/auth/router";
import { employeesRouter } from "./modules/employees/router";
import { repairsRouter } from "./modules/repairs/router";
import { locationRouter } from "./modules/locations/router";
import { settingsRouter } from "./modules/settings/router";

export async function mainRouter(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  if (pathname.startsWith("/api/assets")) {
    return assetRouter(req);
  }

  if (pathname.startsWith("/api/auth")) {
    return authRouter(req);
  }

  if (pathname.startsWith("/api/employees")) {
    return employeesRouter(req);
  }

  if (pathname.startsWith("/api/repairs")) {
    return repairsRouter(req);
  }

  if (pathname.startsWith("/api/dashboard")) {
    return locationRouter(req);
  }

  if (pathname.startsWith("/api/settings")) {
    return settingsRouter(req);
  }

  return new Response("Not Found", { status: 404 });
}
