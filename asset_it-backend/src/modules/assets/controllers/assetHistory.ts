// File: backend/src/modules/assets/controllers/assetHistory.ts
import { db } from "../../../config/db";

export async function getAssetHistory(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/")[3]; // /api/assets/:id/history

    // ✅ ดึงข้อมูลหลักของ asset
    const [assets] = await db.query(`
      SELECT 
        a.*, 
        e.full_name AS employee_name,
        l.name AS location_name
      FROM assets a
      LEFT JOIN employees e ON a.emp_id = e.id
      LEFT JOIN locations l ON a.location_id = l.id
      WHERE a.id = ?
    `, [id]);

    if ((assets as any[]).length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "Asset not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const asset = (assets as any[])[0];

    // ✅ ดึงประวัติ
    const [historyRaw] = await db.query(`
      SELECT 
        at.date,
        e1.full_name AS from_employee,
        e2.full_name AS to_employee,
        l1.name AS from_location,
        l2.name AS to_location,
        at.remarks
      FROM asset_transactions at
      LEFT JOIN employees e1 ON at.from_emp_id = e1.id
      LEFT JOIN employees e2 ON at.to_emp_id = e2.id
      LEFT JOIN locations l1 ON at.from_location_id = l1.id
      LEFT JOIN locations l2 ON at.to_location_id = l2.id
      WHERE at.asset_id = ?
      ORDER BY at.date ASC
    `, [id]);

    const history = (historyRaw as any[]).map((item, index, arr) => {
      const currentDate = new Date(item.date);
      const nextDate = arr[index + 1] ? new Date(arr[index + 1].date) : new Date();

      const durationMs = nextDate.getTime() - currentDate.getTime();
      const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));

      return {
        ...item,
        duration: durationDays > 0 ? `${durationDays} วัน` : "น้อยกว่า 1 วัน",
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          asset,
          history,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("getAssetHistory error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
