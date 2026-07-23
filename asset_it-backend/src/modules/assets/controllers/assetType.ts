// File: backend/src/controllers/assetType.ts
import { db } from "../../../config/db";

export async function getAssetTypesID(req: Request): Promise<Response> {
  try {
    const [rows] = await db.query(
      `SELECT id, name FROM asset_types ORDER BY id ASC`
    );

    return Response.json({
      success: true,
      message: "OK",
      results: (rows as any[]).length,
      data: rows,
    });
  } catch (error) {
    console.error("Get asset types error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
