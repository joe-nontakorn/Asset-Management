// file: backend/src/modules/employees/controllers/Agency.ts
import { db } from "../../../config/db";

export async function createDivision(req: Request): Promise<Response> {
  const body = await req.json();
  const { name, description } = body;

  if (!name) {
    return new Response(JSON.stringify({ error: "name is required" }), { status: 400 });
  }

  await db.query("INSERT INTO divisions (name, description) VALUES (?, ?)", [name, description || null]);

  return Response.json({ success: true, message: "Division created successfully" });
}

export async function createDepartment(req: Request): Promise<Response> {
  const body = await req.json();
  const { name, description, division_id } = body;

  if (!name || !division_id) {
    return new Response(JSON.stringify({ error: "name and division_id are required" }), { status: 400 });
  }

  await db.query("INSERT INTO departments (name, description, division_id) VALUES (?, ?, ?)", [
    name,
    description || null,
    division_id,
  ]);

  return Response.json({ success: true, message: "Department created successfully" });
}

export async function createSection(req: Request): Promise<Response> {
  const body = await req.json();
  const { name, description, department_id } = body;

  if (!name || !department_id) {
    return new Response(JSON.stringify({ error: "name and department_id are required" }), { status: 400 });
  }

  await db.query("INSERT INTO sections (name, description, department_id) VALUES (?, ?, ?)", [
    name,
    description || null,
    department_id,
  ]);

  return Response.json({ success: true, message: "Section created successfully" });
}