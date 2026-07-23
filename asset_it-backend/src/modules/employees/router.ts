import {
  getEmployeeList,
  createEmployee,
  updateEmployee,
  getEmployeeById,
  getDivisions,
  getDepartments,
  getSections
} from "../employees/controllers/emp";

import { createDivision, createDepartment, createSection } from "../employees/controllers/Agency"; // Assuming you're using Express.js

export async function employeesRouter(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  if (req.method === "GET" && pathname === "/api/employees/list") {
    return await getEmployeeList(req);
  }

  if (req.method === "POST" && pathname === "/api/employees/agency/add/division") {
    return await createDivision(req);
  }

  if (req.method === "POST" && pathname === "/api/employees/agency/add/department") {
    return await createDepartment(req);
  }
  if (req.method === "POST" && pathname === "/api/employees/agency/add/section") {
    return await createSection(req);
  }


  if (req.method === "GET" && pathname === "/api/employees/list/divisions") {
    return await getDivisions(req);
  }

  if (req.method === "GET" && pathname === "/api/employees/list/departments") {
    return await getDepartments(req);
  }

  if (req.method === "GET" && pathname === "/api/employees/list/sections") {
    return await getSections(req);
  }

  if (req.method === "POST" && pathname === "/api/employees/create") {
    return await createEmployee(req);
  }

  if (req.method === "PUT" && pathname.startsWith("/api/employees/update/")) {
    return await updateEmployee(req);
  }

  if (req.method === "GET" && pathname.match(/^\/api\/employees\/[^/]+$/)) {
    const emp_id = pathname.split("/").pop();
    return await getEmployeeById(emp_id!);
  }


 

  return new Response("Not Found", { status: 404 });
}
