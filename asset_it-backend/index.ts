// ใช้ dynamic import หรือ require
const { serve } = require("bun");
// หรือ
// const serve = Bun.serve;

import { mainRouter } from "./src/mainRouter";

const port = Number(process.env.PORT) || 3000;

serve({
  port,
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const origin = req.headers.get("Origin") || "*";

    // Handle CORS Preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Handle API Routes
    if (url.pathname.startsWith("/api")) {
      const res = await mainRouter(req);
      return new Response(res.body, {
        ...res,
        headers: {
          ...res.headers,
          "Access-Control-Allow-Origin": origin,
        },
      });
    }

    // Default response
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`✅ Server is running at port:${port}`);