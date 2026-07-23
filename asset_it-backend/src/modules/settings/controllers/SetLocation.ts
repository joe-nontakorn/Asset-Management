// File: backend/src/modules/settings/controllers/SetLocation.ts
import { db } from "../../../config/db";

export async function getLocations(req: Request): Promise<Response> {
  // ✅ Query ทุก location ที่ is_active = 1
  const [rows] = await db.query(
    `SELECT 
       id,
       name,
       abbreviation,
       description,
       latitude,
       longitude,
       created_at,
       updated_at
     FROM locations
     WHERE is_active = 1
     ORDER BY name ASC`
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



export async function addLocation(req: Request): Promise<Response> {
    const { name, abbreviation, description, latitude, longitude } = await req.json();

    // 🔒 Validate input
    if (!name || !abbreviation) {
        return new Response(
            JSON.stringify({ error: "Name and abbreviation are required." }),
            { status: 400 }
        );
    }

    // ✅ Insert into locations table
    const [result] = await db.query(
        `INSERT INTO locations 
   (name, abbreviation, description, latitude, longitude, is_active, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [
            name,
            abbreviation,
            description || "",
            latitude || null,
            longitude || null
        ]
    );
    ;

    return new Response(
        JSON.stringify({ success: true, id: (result as any).insertId }),
        { status: 201 }
    );
}

export async function deleteLocation(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const parts = pathname.split("/");
  const id = parts[parts.length - 1];

  if (!id) {
    return new Response(
      JSON.stringify({ error: "Location ID is required in URL" }),
      { status: 400 }
    );
  }

  // Soft delete
  const [result] = await db.query(
    `UPDATE locations SET is_active = 0, updated_at = NOW() WHERE id = ?`,
    [id]
  );

  const affectedRows = (result as any).affectedRows || 0;
  console.log(`Deleted location id=${id}, affectedRows=${affectedRows}`);

  if (affectedRows === 0) {
    return new Response(
      JSON.stringify({ error: "Location not found" }),
      { status: 404 }
    );
  }

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200 }
  );
}



export async function updateLocation(req: Request, id: string): Promise<Response> {
  console.log("🔍 updateLocation - Using ID from router:", id);

  if (!id || isNaN(Number(id))) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Missing or invalid Location ID"
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    const requestBody = await req.json();
    const { name, abbreviation, description, latitude, longitude, is_active } = requestBody;

    // ตรวจสอบว่า location มีอยู่จริงหรือไม่
    const [checkRows] = await db.query(
      `SELECT id FROM locations WHERE id = ?`,
      [id]
    ) as [any[], any];

    if (!checkRows || checkRows.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Location not found"
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // อัปเดต
    const updateParams = [
      name || null,
      abbreviation || null,
      description || null,
      latitude !== undefined ? latitude : null,
      longitude !== undefined ? longitude : null,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      id
    ];

    const [updateResult] = await db.query(
      `UPDATE locations 
       SET 
         name = ?,
         abbreviation = ?,
         description = ?,
         latitude = ?,
         longitude = ?,
         is_active = ?,
         updated_at = NOW()
       WHERE id = ?`,
      updateParams
    ) as [any, any];

    if (updateResult.affectedRows === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No changes made to the location"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const responseData = {
      success: true,
      message: "Location updated successfully",
      data: {
        id: Number(id),
        name,
        abbreviation,
        description,
        latitude,
        longitude,
        is_active: is_active !== undefined ? is_active : true
      }
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("❌ updateLocation - Error occurred:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
