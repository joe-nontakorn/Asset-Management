// File: backend/src/modules/assets/controllers/asset.ts

import { db } from "../../../config/db";
import type { ResultSetHeader } from "mysql2";
import type { RowDataPacket } from "mysql2";

// ✅ CREATE asset หลายรายการ

// ✅ CREATE asset หลายรายการ
export async function createAsset(req: Request): Promise<Response> {
  const assets = await req.json();

  if (!Array.isArray(assets)) {
    return new Response(
      JSON.stringify({ success: false, message: "Data must be an array" }),
      { status: 400 }
    );
  }

  try {
    const company = "Jastel";
    const department = "IT";
    const values: any[] = [];

    // ✅ เตรียม Map เก็บเลขล่าสุดของแต่ละ (type_id, year)
    const counters = new Map<string, number>();

    for (const item of assets) {
      if (!item.type_id || !item.purchase_date) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "type_id and purchase_date are required to generate asset_no",
          }),
          { status: 400 }
        );
      }

      const year = new Date(item.purchase_date).getFullYear();
      const counterKey = `${item.type_id}-${year}`;

      // ✅ ถ้ายังไม่ได้โหลด MAX() สำหรับ type_id/year นี้ ให้ query ครั้งเดียว
      if (!counters.has(counterKey)) {
        const [maxRows] = await db.query<RowDataPacket[]>(
          `SELECT
             MAX(CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(asset_no, '/', 1), '-', -1) AS UNSIGNED)) as max_number
           FROM assets
           WHERE type_id = ? AND YEAR(purchase_date) = ?`,
          [item.type_id, year]
        );
        counters.set(counterKey, (maxRows[0]?.max_number ?? 0) + 1);
      }

      // ✅ ดึงหมายเลขล่าสุดจาก Map
      const nextNumber = counters.get(counterKey)!;

      // ✅ ตรวจสอบว่า type_id มีอยู่จริง
      const [typeRows] = await db.query<RowDataPacket[]>(
        `SELECT id FROM asset_types WHERE id = ?`,
        [item.type_id]
      );

      if (typeRows.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            message: `Asset type_id ${item.type_id} not found`,
          }),
          { status: 404 }
        );
      }

      // ✅ สร้าง asset_no โดยใช้ type_id แทน typeName
      const asset_no = `${company}-${department}-${item.type_id}-${nextNumber}/${year}`;


      // ✅ อัปเดต counter ใน Map (+1)
      counters.set(counterKey, nextNumber + 1);

      // ✅ เพิ่มค่า insert
      values.push([
        asset_no,
        item.serial_no,
        item.name,
        item.brand,
        item.model,
        item.type_id ?? null,
        item.subtype_id ?? null, // <<-- เพิ่มบรรทัดนี้
        item.status ?? null,
        item.emp_id ?? null,
        item.location_id ?? null,
        item.purchase_date ?? null,
        item.warranty_expiry ?? null,
        new Date(),
        new Date(),
      ]);
    }

    // ✅ Bulk insert
    const sql = `
      INSERT INTO assets (
      asset_no, serial_no, name, brand, model,
      type_id, subtype_id, status, emp_id, location_id,
      purchase_date, warranty_expiry, created_at, updated_at
      ) VALUES ?
    `;

    const [result] = await db.query<ResultSetHeader>(sql, [values]);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Assets inserted",
        inserted: result.affectedRows,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Insert asset error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Insert failed", error }),
      { status: 500 }
    );
  }
}


// ✅ GET /api/assets/generate-code?type_id=3&year=2022
export async function generateAssetCode(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const typeId = Number(url.searchParams.get("type_id"));
  const year = Number(url.searchParams.get("year")) || new Date().getFullYear();

  const company = "Jastel";
  const department = "IT";

  if (!typeId) {
    return new Response(
      JSON.stringify({ success: false, message: "Missing type_id" }),
      { status: 400 }
    );
  }

  try {
    // ✅ ใช้ MAX() ไม่ใช้ COUNT()
    const [maxRows] = await db.query<RowDataPacket[]>(
      `SELECT
         MAX(CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(asset_no, '/', 1), '-', -1) AS UNSIGNED)) as max_number
       FROM assets
       WHERE type_id = ? AND YEAR(purchase_date) = ?`,
      [typeId, year]
    );
    const nextNumber = (maxRows[0]?.max_number ?? 0) + 1;

    // ✅ ดึงชื่อประเภท
    const [typeRows] = await db.query<RowDataPacket[]>(
      `SELECT name as type_name FROM asset_types WHERE id = ?`,
      [typeId]
    );
    const typeName = typeRows[0]?.type_name?.toUpperCase();

    if (!typeName) {
      return new Response(
        JSON.stringify({ success: false, message: "Asset type not found" }),
        { status: 404 }
      );
    }

    const assetCode = `${company}-${department}-${typeName}-${nextNumber}/${year}`;

    return new Response(
      JSON.stringify({ success: true, asset_no: assetCode })
    );
  } catch (error) {
    console.error("generateAssetCode error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal Server Error" }),
      { status: 500 }
    );
  }
}


// ✅ GET สถานที่
// ✅ GET สถานที่ (เฉพาะที่ active)
export async function getLocations(req: Request): Promise<Response> {
  const [rows] = await db.query(
    "SELECT id, name FROM locations WHERE is_active = 1 ORDER BY name ASC"
  );

  return new Response(
    JSON.stringify({
      success: true,
      message: "OK",
      results: (rows as any[]).length,
      data: rows,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}


// ✅ GET ประเภททรัพย์สิน
export async function getAssetTypes(req: Request): Promise<Response> {
  const [rows] = await db.query("SELECT type_id, name FROM asset_types ORDER BY name ASC");
  return new Response(
    JSON.stringify({
      success: true,
      message: "OK",
      results: (rows as any[]).length,
      data: rows,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}






export async function updateAsset(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const serialNo = url.pathname.split("/").pop();

  if (!serialNo) {
    return new Response(JSON.stringify({ error: "Missing serial_no" }), { status: 400 });
  }

  const {
    name,
    brand,
    model,
    type_id,
    subtype_id,
    status,
    emp_id,
    location_id
  } = await req.json();

  try {
    const validStatus = ["available", "in_use", "under_repair", "broken", "retired", "disposed"];
    if (status && !validStatus.includes(status)) {
      return new Response(JSON.stringify({ error: `Invalid status: ${status}` }), { status: 400 });
    }

    let employeeId: number | null = null;
    if (emp_id !== null && emp_id !== undefined && emp_id !== "") {
      const idToCheck = Number(emp_id);
      if (isNaN(idToCheck)) {
        return new Response(JSON.stringify({ error: `Invalid emp_id: '${emp_id}'` }), { status: 400 });
      }
      const [empRows] = await db.query<RowDataPacket[]>(`SELECT id FROM employees WHERE id = ?`, [idToCheck]);
      if (empRows.length === 0) {
        return new Response(JSON.stringify({ error: `Employee id '${idToCheck}' not found` }), { status: 400 });
      }
      employeeId = idToCheck;
    }

    let assetSubtypeId: number | null = null;
    if (subtype_id !== null && subtype_id !== undefined && subtype_id !== "") {
      const idToCheck = Number(subtype_id);
      if (isNaN(idToCheck)) {
        return new Response(JSON.stringify({ error: `Invalid subtype_id: '${subtype_id}'` }), { status: 400 });
      }
      const [subtypeRows] = await db.query<RowDataPacket[]>(
        `SELECT id FROM asset_subtypes WHERE id = ?`,
        [idToCheck]
      );
      if (subtypeRows.length === 0) {
        return new Response(JSON.stringify({ error: `Subtype id '${idToCheck}' not found` }), { status: 400 });
      }
      assetSubtypeId = idToCheck;
    }

    const [assetRows] = await db.query<RowDataPacket[]>(
      `SELECT id, asset_no, emp_id AS from_emp_id, location_id AS from_location_id FROM assets WHERE serial_no = ?`,
      [serialNo]
    );
    if (assetRows.length === 0) {
      return new Response(JSON.stringify({ error: "Asset not found" }), { status: 404 });
    }

    const asset_id = assetRows[0].id;
    const from_emp_id = assetRows[0].from_emp_id;
    const from_location_id = assetRows[0].from_location_id;
    const oldAssetNo: string = assetRows[0].asset_no;

    const parts = oldAssetNo.split("-");
    if (parts.length !== 4) {
      return new Response(JSON.stringify({ error: `Invalid asset_no format: '${oldAssetNo}'` }), { status: 400 });
    }

    const [oldRunning, year] = parts[3].split("/");
    let newRunning = 1;
    let newAssetNo = "";

    // ลูปเพื่อหา asset_no ที่ไม่ซ้ำ
    while (true) {
      newAssetNo = `Jastel-IT-${type_id}-${newRunning}/${year}`;
      const [dupRows] = await db.query<RowDataPacket[]>(
        `SELECT 1 FROM assets WHERE asset_no = ? AND serial_no != ?`,
        [newAssetNo, serialNo]
      );
      if (dupRows.length === 0) break;
      newRunning++;
    }

    const disposedDateValue = status === "disposed" ? new Date() : null;

    // อัปเดต asset
    await db.query(
      `UPDATE assets 
       SET asset_no = ?, name = ?, brand = ?, model = ?, type_id = ?, subtype_id = ?, 
           status = ?, emp_id = ?, location_id = ?, 
           disposed_date = ?, updated_at = NOW()
       WHERE serial_no = ?`,
      [
        newAssetNo,
        name || null,
        brand || null,
        model || null,
        type_id || null,
        assetSubtypeId,
        status || "available",
        employeeId,
        location_id !== undefined ? location_id : null,
        disposedDateValue,
        serialNo
      ]
    );

    // สร้าง transaction_type ตาม status
    let transactionType: string;
    switch (status) {
      case "available": transactionType = "check_in"; break;
      case "in_use":
      case "broken":
      case "retired":
      case "disposed": transactionType = "check_out"; break;
      case "under_repair": transactionType = "repair"; break;
      default: transactionType = "update";
    }

    // บันทึกประวัติการเปลี่ยนแปลง
    await db.query(
      `INSERT INTO asset_transactions (
         asset_id, from_emp_id, to_emp_id, from_location_id, to_location_id,
         transaction_type, action, remarks, date, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        asset_id,
        from_emp_id,
        employeeId,
        from_location_id,
        location_id !== undefined ? location_id : null,
        transactionType,
        "Update via UI",
        `Name: ${name || 'N/A'}, Brand: ${brand || 'N/A'}, Model: ${model || 'N/A'}`
      ]
    );

    return new Response(
      JSON.stringify({ success: true, message: "Asset updated and transaction logged" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Update asset error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
