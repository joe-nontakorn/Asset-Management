import { db } from "../../../config/db";

export async function AssetLocation(req: Request): Promise<Response> {
  try {
    const [rows] = await db.query(
      `SELECT 
         l.name AS location_name,
         COUNT(DISTINCT a.id) AS asset_count,
         COUNT(DISTINCT e.id) AS employee_count
       FROM locations l
       LEFT JOIN assets a ON a.location_id = l.id
       LEFT JOIN employees e ON e.location_id = l.id
       WHERE l.is_active = 1
       GROUP BY l.id, l.name
       ORDER BY l.name`
    );

    return new Response(JSON.stringify({
      success: true,
      message: "Location asset summary fetched",
      data: rows
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error fetching asset location data:", error);

    return new Response(JSON.stringify({
      success: false,
      message: "Failed to fetch asset location data",
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}


export async function getRecentActivity(req: Request): Promise<Response> {
  try {
    const [rows] = await db.query(`
      SELECT
        t.*,
        CONVERT_TZ(t.date, '+00:00', '+07:00') AS date_thai,
        e_from.full_name AS from_emp_name,
        e_to.full_name AS to_emp_name,
        l_from.name AS from_location_name,
        l_from.abbreviation AS from_location_abbreviation,
        l_to.name AS to_location_name,
        l_to.abbreviation AS to_location_abbreviation,
        a.asset_no,
        a.name AS asset_name
      FROM asset_transactions t
      LEFT JOIN employees e_from ON t.from_emp_id = e_from.id
      LEFT JOIN employees e_to ON t.to_emp_id = e_to.id
      LEFT JOIN locations l_from ON t.from_location_id = l_from.id
      LEFT JOIN locations l_to ON t.to_location_id = l_to.id
      LEFT JOIN assets a ON t.asset_id = a.id
      ORDER BY t.date DESC
      LIMIT 10;
    `);

    return new Response(JSON.stringify({
      success: true,
      data: rows
    }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (error) {
    console.error("Error fetching activity:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), { status: 500 });
  }
}
