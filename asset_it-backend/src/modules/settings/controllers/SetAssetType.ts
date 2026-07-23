// File: backend/src/modules/settings/controllers/SetAssetType.ts
import { db } from "../../../config/db";
import type { ResultSetHeader } from "mysql2";

/**
 * GET: ดึงรายการ asset types ทั้งหมด
 */
export async function getAssetTypes(): Promise<Response> {
  try {
    const [rows] = await db.query(`SELECT * FROM asset_types ORDER BY id`);
    return new Response(
      JSON.stringify({ success: true, data: rows }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("getAssetTypes error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500 }
    );
  }
}

/**
 * POST: เพิ่ม asset type ใหม่
 */
export async function addAssetType(req: Request): Promise<Response> {
    
  const body = await req.json();
  const { name, description } = body;

  if (!name || !name.trim()) {
    return new Response(JSON.stringify({ success: false, error: "Missing name" }), { status: 400 });
  }

  try {
   const [result] = await db.query<ResultSetHeader>(
   `INSERT INTO asset_types 
   (name, description, is_active, created_at, updated_at)
   VALUES (?, ?, 1, NOW(), NOW())`,
  [name, description || null]
);



    return new Response(
      JSON.stringify({ success: true, message: "Asset type created", insertedId: result.insertId }),
      { status: 201 }
    );
  } catch (error) {
    console.error("addAssetType error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500 }
    );
  }
}

/**
 * PUT: แก้ไข asset type ตาม ID
 */
export async function updateAssetType(req: Request, id: string): Promise<Response> {
  const body = await req.json();
  const { name, description, is_active } = body;

  if (!id || isNaN(Number(id))) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid ID" }),
      { status: 400 }
    );
  }

  try {
    const [result] = await db.query(
      `UPDATE asset_types
       SET
         name = ?,
         description = ?,
         is_active = ?,
         updated_at = NOW()
       WHERE id = ?`,
      [
        name || null,
        description || null,
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        id
      ]
    );

    return new Response(
      JSON.stringify({ success: true, message: "Asset type updated" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("updateAssetType error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500 }
    );
  }
}



/**
 * GET: ดึงรายการ subtypes ทั้งหมด
 */
export async function getAssetSubtypes(): Promise<Response> {
  try {
    const [rows] = await db.query(`
      SELECT s.*, t.name AS asset_type_name
      FROM asset_subtypes s
      JOIN asset_types t ON s.asset_type_id = t.id
      ORDER BY s.id
    `);

    return new Response(
      JSON.stringify({ success: true, data: rows }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("getAssetSubtypes error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500 }
    );
  }
}

/**
 * GET: ดึง subtype ตาม asset_type_id (ใช้ใน dropdown)
 */
export async function getSubtypesByTypeId(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const typeId = url.searchParams.get("asset_type_id");

  if (!typeId || isNaN(Number(typeId))) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid or missing asset_type_id" }),
      { status: 400 }
    );
  }

  try {
    const [rows] = await db.query(
      `SELECT id, name FROM asset_subtypes WHERE asset_type_id = ? AND is_active = 1 ORDER BY name ASC`,
      [typeId]
    );

    return new Response(
      JSON.stringify({ success: true, data: rows }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("getSubtypesByTypeId error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500 }
    );
  }
}

/**
 * POST: เพิ่ม subtype ใหม่
 */
export async function addAssetSubtype(req: Request): Promise<Response> {
  const body = await req.json();
  const { asset_type_id, name, description } = body;

  if (!asset_type_id || !name) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing required fields" }),
      { status: 400 }
    );
  }

  try {
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO asset_subtypes 
       (asset_type_id, name, description, is_active, created_at, updated_at)
       VALUES (?, ?, ?, 1, NOW(), NOW())`,
      [asset_type_id, name, description || null]
    );

    return new Response(
      JSON.stringify({ success: true, message: "Subtype created", insertedId: result.insertId }),
      { status: 201 }
    );
  } catch (error) {
    console.error("addAssetSubtype error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500 }
    );
  }
}

/**
 * PUT: แก้ไข subtype ตาม ID
 */
export async function updateAssetSubtype(req: Request, id: string): Promise<Response> {
  const body = await req.json();
  const { name, description, is_active, asset_type_id } = body;

  if (!id || isNaN(Number(id))) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid ID" }),
      { status: 400 }
    );
  }

  try {
    await db.query(
      `UPDATE asset_subtypes
       SET name = ?, description = ?, is_active = ?, asset_type_id = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        name || null,
        description || null,
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        asset_type_id,
        id
      ]
    );

    return new Response(
      JSON.stringify({ success: true, message: "Subtype updated" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("updateAssetSubtype error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500 }
    );
  }
}