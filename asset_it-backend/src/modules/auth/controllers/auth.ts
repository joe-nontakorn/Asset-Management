// File: backend/src/controllers/auth.ts
import { db } from "../../../config/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";


const JWT_SECRET = process.env.JWT_SECRET || "secret";

export async function register(req: Request): Promise<Response> {
  const { username, email, password, role } = await req.json();

  if (!username || !email || !password)
    return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });

  const [rows] = await db.query("SELECT * FROM users WHERE username = ? OR email = ?", [username, email]);
  if ((rows as any[]).length > 0)
    return new Response(JSON.stringify({ error: "User already exists" }), { status: 409 });

  const hashedPassword = await bcrypt.hash(password, 10);
  await db.query(
    "INSERT INTO users (username, email, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
    [username, email, hashedPassword, role || "user"]
  );

  return new Response(JSON.stringify({ success: true }), { status: 201 });
}




export async function login(req: Request): Promise<Response> {
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
    });
  }

  const { username, password } = body;

  if (!username || !password) {
    return new Response(JSON.stringify({ error: "Missing username or password" }), {
      status: 400,
    });
  }

  const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
  const user = (rows as any[])[0];

  if (!user) {
    // ป้องกัน timing attack
    await bcrypt.compare(password, "$2b$10$invalidinvalidinvalidinvalidinvalida");
    return new Response(
      JSON.stringify({ error: "Invalid username or password" }),
      { status: 401 }
    );
  }

  // เช็ก role ว่าเป็น admin หรือไม่
  if (user.role !== "admin") {
    return new Response(
      JSON.stringify({ error: "Unauthorized: Admin access only" }),
      { status: 403 }
    );
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return new Response(
      JSON.stringify({ error: "Invalid username or password" }),
      { status: 401 }
    );
  }

  const payload = {
    id: user.id,
    role: user.role,
    jti: uuidv4(), // ให้ token นี้มี ID แยก (ใช้สำหรับ revoke รายตัวได้ในอนาคต)
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET || "secret", {
    expiresIn: "3h",
  });

  return new Response(JSON.stringify({ token }), { status: 200 });
}