import { login, register } from "../auth/controllers/auth";

export async function authRouter(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const { pathname } = url;

  if (req.method === "POST" && pathname === "/api/auth/register") {
    return register(req);
  }

  if (req.method === "POST" && pathname === "/api/auth/login") {
    return login(req);
  }

  return new Response("Not Found in auth router", { status: 404 });
}
