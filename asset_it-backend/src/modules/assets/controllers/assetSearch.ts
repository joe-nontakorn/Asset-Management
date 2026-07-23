// File: backend/src/modules/assets/controllers/assetSearch.ts
import { db } from "../../../config/db";
export async function searchAssets(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const typeId = url.searchParams.get("type_id");
  const serialNo = url.searchParams.get("serial_no");
  const employeeName = url.searchParams.get("employee_name");
  const locationName = url.searchParams.get("location_name");
  const status = url.searchParams.get("status");
  const assetNo = url.searchParams.get("asset_no");


 let sql = `
  SELECT 
    assets.id,
    assets.asset_no,
    assets.serial_no,
    assets.name,
    assets.brand,
    assets.model,
    assets.type_id,
    assets.subtype_id,
    assets.status,
    assets.emp_id,
    assets.disposed_date,
    asset_types.name AS type_name,
    asset_subtypes.name AS subtype_name,       
    employees.full_name AS employee_name,
    locations.name AS location_name,
    locations.abbreviation AS location_abbreviation,
    assets.location_id,
    assets.purchase_date,
    assets.warranty_expiry
  FROM assets
  LEFT JOIN asset_types ON assets.type_id = asset_types.id
  LEFT JOIN asset_subtypes ON assets.subtype_id = asset_subtypes.id
  LEFT JOIN employees ON assets.emp_id = employees.id
  LEFT JOIN locations ON assets.location_id = locations.id AND locations.is_active = 1
  WHERE 1=1
`;


const params: any[] = [];

if (typeId) {
  sql += " AND assets.type_id = ?";
  params.push(typeId);
}

if (serialNo) {
  sql += " AND assets.serial_no = ?";
  params.push(serialNo);
}

if (assetNo) {
  sql += " AND assets.asset_no = ?";
  params.push(assetNo);
}

if (employeeName) {
  sql += " AND employees.full_name LIKE ?";
  params.push(`%${employeeName}%`);
}

if (locationName) {
  sql += " AND locations.name LIKE ?";
  params.push(`%${locationName}%`);
}

if (status) {
  sql += " AND assets.status = ?";
  params.push(status);
}

sql += " ORDER BY assets.type_id ASC";


  try {
    const [rows] = await db.query(sql, params);

    if ((rows as any[]).length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Asset not found",
          data: [],
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "OK",
        results: (rows as any[]).length,
        data: rows,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("searchAssets error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal Server Error" }),
      { status: 500 }
    );
  }
}
