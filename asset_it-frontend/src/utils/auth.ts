import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  id: number;
  role: string;
  exp?: number;
}

export const isTokenValid = (): boolean => {
  const token = localStorage.getItem("token");

  // ✅ ตรวจว่า token เป็น string จริง ๆ
  if (!token || typeof token !== "string" || token === "undefined" || token === "null") {
    return false;
  }

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    if (decoded.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp > currentTime;
    }
    return true;
  } catch (err) {
    if (err instanceof Error) {
      console.error("Token decode error:", err.message);
    } else {
      console.error("Unknown error decoding token");
    }
    return false;
  }
};
