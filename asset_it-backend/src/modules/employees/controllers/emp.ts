// file: backend/src/controllers/employees/emp.ts
import { db } from "../../../config/db";

// ✅ 1. GET พนักงานทั้งหมด
export async function getEmployeeList(req: Request): Promise<Response> {
  try {
    const [rows] = await db.execute(`
      SELECT 
  e.id,
  e.emp_id,
  e.full_name,
  e.email,
  e.phone,
  e.office,
  e.is_active,
  l.name AS location_name,
  l.abbreviation AS location_abbreviation,
  v.name AS division_name,
  d.name AS department_name,
  s.name AS section_name
FROM employees e
LEFT JOIN locations l ON e.location_id = l.id
LEFT JOIN divisions v ON e.division_id = v.id
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN sections s ON e.section_id = s.id
ORDER BY e.full_name ASC;


    `);

    return new Response(JSON.stringify({ success: true, data: rows }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("DB Error:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Internal server error",
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}



// ✅ 2. CREATE พนักงานใหม่
export async function createEmployee(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const {
      emp_id,
      full_name,
      email,
      phone,
      office,
      location_id,
      section_id,
      department_id,
      division_id,
    } = body;

    // ตรวจสอบค่าบังคับ
    if (!full_name) {
  return new Response(JSON.stringify({
    success: false,
    message: "กรุณากรอกข้อมูลให้ครบถ้วน",
  }), { status: 400 });
}



    // ตรวจสอบว่า emp_id ซ้ำไหม
    const [existing] = await db.execute(
      "SELECT emp_id FROM employees WHERE emp_id = ?",
      [emp_id]
    );
    if ((existing as any[]).length > 0) {
      return new Response(JSON.stringify({
        success: false,
        message: "รหัสพนักงานนี้ถูกใช้ไปแล้ว",
      }), { status: 409 });
    }

    // Insert ข้อมูล
   await db.execute(`
  INSERT INTO employees (
    emp_id, full_name, email, phone, office,
    location_id, division_id, department_id, section_id,
    is_active, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
`, [
  emp_id,
  full_name,
  email || null,
  phone || null,
  office || null,
  location_id || null,
  division_id || null,
  department_id || null,
  section_id || null,
]);

    return new Response(JSON.stringify({
      success: true,
      message: "เพิ่มพนักงานสำเร็จ",
    }), { status: 201 });

  } catch (error) {
    console.error("Error creating employee:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "เกิดข้อผิดพลาดในการเพิ่มพนักงาน",
    }), { status: 500 });
  }
}



// ✅ 4. UPDATE พนักงาน

export async function updateEmployee(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const emp_id = url.pathname.split("/").pop();

    if (!emp_id) {
      return new Response(JSON.stringify({
        success: false,
        message: "ไม่พบรหัสพนักงาน",
      }), { status: 400 });
    }

    const body = await req.json();
    const {
      full_name,
      email,
      phone,
      location_id,
      office,
      division_id,
      department_id,
      section_id,
      is_active
    } = body;

    if (!full_name) {
      return new Response(JSON.stringify({
        success: false,
        message: "กรุณากรอกข้อมูลให้ครบถ้วน",
      }), { status: 400 });
    }

    const [result] = await db.execute(
      `UPDATE employees 
       SET full_name = ?, email = ?, phone = ?, location_id = ?, office = ?, 
           division_id = ?, department_id = ?, section_id = ?, 
           is_active = ?, updated_at = NOW()
       WHERE emp_id = ?`,
      [
        full_name,
        email || null,
        phone || null,
        location_id || null,  // ✅ ตำแหน่งที่ 4 - ตรงกับ SQL
        office || null,       // ✅ ตำแหน่งที่ 5 - ตรงกับ SQL
        division_id || null,
        department_id || null,
        section_id || null,
        is_active,
        emp_id
      ]
    );

    if ((result as any).affectedRows === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: "ไม่พบพนักงาน หรือไม่มีข้อมูลที่เปลี่ยนแปลง",
      }), { status: 404 });
    }

    return new Response(JSON.stringify({
      success: true,
      message: "อัปเดตข้อมูลสำเร็จ",
    }), { status: 200 });

  } catch (error) {
    console.error("Error updating employee:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดตพนักงาน",
    }), { status: 500 });
  }
}



// ✅ 5. GET พนักงานรายคน (ใช้ในหน้าแก้ไข)
export async function getEmployeeById(emp_id: string): Promise<Response> {
  try {
    const [rows] = await db.execute(
      `SELECT 
        e.emp_id, 
        e.full_name, 
        e.email, 
        e.phone, 
        e.office, 
        e.is_active,
        e.division_id,
        e.department_id,
        e.section_id,
        e.location_id,
        l.name AS location_name,  
        d.name as division_name,
        dept.name as department_name,
        s.name as section_name
      FROM employees e
      LEFT JOIN divisions d ON e.division_id = d.id
      LEFT JOIN departments dept ON e.department_id = dept.id
      LEFT JOIN sections s ON e.section_id = s.id
      LEFT JOIN locations l ON e.location_id = l.id 
      WHERE e.emp_id = ?`,
      [emp_id]
    );

    if ((rows as any[]).length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: "ไม่พบข้อมูลพนักงาน",
      }), { status: 404 });
    }

    return new Response(JSON.stringify({
      success: true,
      data: (rows as any[])[0],
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("getEmployeeById error:", err);
    return new Response(JSON.stringify({
      success: false,
      message: "เกิดข้อผิดพลาด",
    }), { status: 500 });
  }
}


export async function getDivisions(req: Request): Promise<Response> {
  const [rows] = await db.query("SELECT id, name FROM divisions WHERE is_active = TRUE");
  return Response.json(rows);
}



export async function getDepartments(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const division_id = url.searchParams.get("division_id");

  const [rows] = division_id
    ? await db.query(
        `SELECT d.id, d.name, d.division_id, v.name AS division_name
         FROM departments d
         JOIN divisions v ON d.division_id = v.id
         WHERE d.division_id = ?`,
        [division_id]
      )
    : await db.query(
        `SELECT d.id, d.name, d.division_id, v.name AS division_name
         FROM departments d
         JOIN divisions v ON d.division_id = v.id`
      );

  return Response.json(rows);
}



export async function getSections(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const department_id = url.searchParams.get("department_id");

  const [rows] = department_id
    ? await db.query(
        `SELECT s.id, s.name, s.department_id, d.name AS department_name,
                d.division_id, v.name AS division_name
         FROM sections s
         JOIN departments d ON s.department_id = d.id
         JOIN divisions v ON d.division_id = v.id
         WHERE s.department_id = ?`,
        [department_id]
      )
    : await db.query(
        `SELECT s.id, s.name, s.department_id, d.name AS department_name,
                d.division_id, v.name AS division_name
         FROM sections s
         JOIN departments d ON s.department_id = d.id
         JOIN divisions v ON d.division_id = v.id`
      );

  return Response.json(rows);
}
