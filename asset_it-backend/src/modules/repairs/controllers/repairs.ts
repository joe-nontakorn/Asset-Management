// file: backend/src/controllers/repairs/repairs.ts

import { db } from "../../../config/db";
import type { RowDataPacket } from "mysql2/promise";


// ✅ 1. คืนรายชื่อพนักงานทั้งหมด
export async function listEmployees(req: Request): Promise<Response> {
  const [rows] = await db.query(
    "SELECT id, emp_id, full_name FROM employees ORDER BY full_name ASC"
  );
  return Response.json(rows);
}

// ✅ 2. คืนรายการอุปกรณ์ที่ emp_id = employees.id
export async function getAssetsByEmp(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const employeeId = url.pathname.split("/").pop();

  if (!employeeId || isNaN(Number(employeeId))) {
    return new Response(JSON.stringify({ error: "Invalid employee id" }), { status: 400 });
  }

  const [employeeRows] = await db.query<RowDataPacket[]>(
    `SELECT id, emp_id, full_name FROM employees WHERE id = ?`,
    [employeeId]
  );

  if (employeeRows.length === 0) {
    return new Response(JSON.stringify({ error: "ไม่พบพนักงานที่ระบุ" }), { status: 404 });
  }

  const employee = employeeRows[0];

  const [assetRows] = await db.query<RowDataPacket[]>(
    `SELECT id, asset_no, name, serial_no, status FROM assets WHERE emp_id = ?`,
    [employee.id]
  );

  return new Response(
    JSON.stringify({
      success: true,
      message: "OK",
      employee: {
        emp_id: employee.emp_id,
        full_name: employee.full_name,
      },
      results: assetRows.length,
      data: assetRows,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}

// ✅ 3. แจ้งซ่อม (สร้างรายการใหม่ใน asset_repairs)
export async function createRepair(req: Request): Promise<Response> {
  const { asset_id, requested_by, issue_description } = await req.json();

  if (!asset_id || !requested_by || !issue_description) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
    });
  }

  // ✅ ตรวจสอบรายการแจ้งซ่อมที่ยังไม่เสร็จ
  const [existing] = await db.query<RowDataPacket[]>(
    `SELECT id FROM asset_repairs 
     WHERE asset_id = ? AND repair_status IN ('reported', 'acknowledged', 'in_progress')`,
    [asset_id]
  );

  if (existing.length > 0) {
    return new Response(
      JSON.stringify({ error: "มีรายการแจ้งซ่อมอยู่แล้วในระบบ" }),
      { status: 409 }
    );
  }

  // ✅ สร้างหมายเลขแจ้งซ่อม (repair_no)
  const [lastRow] = await db.query<RowDataPacket[]>(
    `SELECT uuid FROM asset_repairs 
     WHERE uuid IS NOT NULL AND uuid LIKE 'RPR-%' 
     ORDER BY id DESC LIMIT 1`
  );

  let nextRepairNo = "RPR-000001";
  if (lastRow.length > 0) {
    const lastNumber = parseInt(lastRow[0].uuid.replace("RPR-", ""), 10);
    const newNumber = lastNumber + 1;
    nextRepairNo = `RPR-${newNumber.toString().padStart(6, "0")}`;
  }

  // ✅ บันทึกข้อมูล
  await db.query(
    `INSERT INTO asset_repairs 
    (uuid, asset_id, requested_by, issue_description, repair_status, request_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'reported', NOW(), NOW(), NOW())`,
    [nextRepairNo, asset_id, requested_by, issue_description]
  );

  return Response.json({
    success: true,
    message: "แจ้งซ่อมสำเร็จแล้ว",
    repair_no: nextRepairNo,
  });
}

// ✅ ดึงรายการแจ้งซ่อมทั้งหมด
export async function listAllRepairs(req: Request): Promise<Response> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT ar.id, ar.uuid, a.asset_no, a.model, a.serial_no, 
            e.full_name AS employee_name,
            ar.issue_description, ar.repair_status, ar.created_at
     FROM asset_repairs ar
     JOIN assets a ON ar.asset_id = a.id
     JOIN employees e ON ar.requested_by = e.id
     ORDER BY ar.created_at DESC`
  );

  return Response.json(rows);
}


// ✅ อัปเดตสถานะรายการซ่อม (เฉพาะ: reported → acknowledged → in_progress → completed)
export async function updateRepairStatus(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const id = url.pathname.split("/").slice(-2, -1)[0];

  if (!id || isNaN(Number(id))) {
    return new Response(JSON.stringify({ error: "Invalid ID" }), { status: 400 });
  }

  const { repair_status } = await req.json();
  const allowedStatuses = ["reported", "acknowledged", "in_progress", "completed"];

  if (!allowedStatuses.includes(repair_status)) {
    return new Response(JSON.stringify({ error: "Invalid status" }), { status: 400 });
  }

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT asset_id FROM asset_repairs WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) {
    return new Response(JSON.stringify({ error: "Repair not found" }), { status: 404 });
  }
  const asset_id = rows[0].asset_id;

  await db.query(
    `UPDATE asset_repairs SET repair_status = ?, updated_at = NOW() WHERE id = ?`,
    [repair_status, id]
  );

  if (repair_status === "completed") {
    await db.query(
      `UPDATE assets SET status = 'in_use', updated_at = NOW() WHERE id = ?`,
      [asset_id]
    );
  }

  return Response.json({ success: true, message: "สถานะได้รับการอัปเดตแล้ว" });
}



// ✅ GET /api/repairs/:id
export async function getRepairById(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const uuid = url.pathname.split("/").pop();

  if (!uuid) {
    return new Response(JSON.stringify({ error: "Missing UUID" }), { status: 400 });
  }

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT ar.*, a.asset_no, a.model, a.serial_no, e.full_name AS employee_name
     FROM asset_repairs ar
     JOIN assets a ON ar.asset_id = a.id
     JOIN employees e ON ar.requested_by = e.id
     WHERE ar.uuid = ?`,
    [uuid]
  );

  if (!rows.length) {
    return new Response(JSON.stringify({ error: "Repair not found" }), { status: 404 });
  }

  return Response.json({ success: true, data: rows[0] });
}
