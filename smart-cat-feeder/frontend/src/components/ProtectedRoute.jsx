import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem("token");

  // ❌ ไม่มี token
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);

    // ❌ token หมดอายุ
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      return <Navigate to="/login" replace />;
    }

    // ❌ role ไม่ตรง (กรณี admin / user)
    if (role && decoded.role !== role) {
      return <Navigate to="/login" replace />;
    }

    // ✅ ผ่านทุกอย่าง
    return children;

  } catch (err) {
    // ❌ token พัง / decode ไม่ได้
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }
}
