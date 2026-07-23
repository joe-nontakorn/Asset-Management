// file: backend/src/routes/repairsRouter.ts
import {
  listEmployees,
  getAssetsByEmp,
  createRepair,
  listAllRepairs,
  updateRepairStatus,
  getRepairById
} from "../repairs/controllers/repairs";

export async function repairsRouter(req: Request): Promise<Response> {
  console.log("🛠️ repairsRouter HIT:", req.method, req.url);

  const url = new URL(req.url);
  const pathname = url.pathname;

  console.log("METHOD:", req.method);
  console.log("URL:", req.url);
  console.log("PATHNAME:", pathname);




  // ✅ พนักงาน: ดึงรายชื่อพนักงาน
  if (req.method === "GET" && pathname === "/api/repairs/employees/list") {
    return await listEmployees(req);
  }

  // ✅ พนักงาน: ดึงรายการอุปกรณ์ตาม emp_id
  if (req.method === "GET" && pathname.startsWith("/api/repairs/assets/by-emp/")) {
    return await getAssetsByEmp(req);
  }

  // ✅ พนักงาน: แจ้งซ่อม
  if (req.method === "POST" && pathname === "/api/repairs/create") {
    return await createRepair(req);
  }

  // ✅ แอดมิน: ดึงรายการแจ้งซ่อมทั้งหมด
  if (req.method === "GET" && pathname === "/api/repairs/listrepairs") {
    return await listAllRepairs(req); // ✅ ถูก
  }

if (
  req.method === "GET" &&
  pathname.startsWith("/api/repairs/repair-tracking/")
) {
  return await getRepairById(req);
}



  // ✅ แอดมิน: อัปเดตสถานะการซ่อม
 if (
  req.method === "PUT" &&
  pathname.match(/^\/api\/repairs\/update\/\d+\/status$/)
) {
  console.log("✅ Match route for updateRepairStatus:", pathname);
  return await updateRepairStatus(req);
} else {
  console.log("❌ No match:", req.method, pathname);
}


  return new Response("Not Found", { status: 404 });
}
