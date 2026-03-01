import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api/axios";
import io from "socket.io-client";

const SOCKET_URL = `http://${window.location.hostname}:5000`;

export default function Navbar() {
  const nav = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  const logout = () => {
    localStorage.removeItem("token");
    nav("/");
  };

  const loadNotifications = async () => {
    try {
      const res = await api.get("/user/notifications");
      setNotifications(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/user/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const clearNotifications = async () => {
    try {
      if (!window.confirm("ต้องการล้างการแจ้งเตือนทั้งหมดใช่หรือไม่?")) return;
      await api.delete("/user/notifications");
      setNotifications([]);
      setOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch (err) {
        console.error("Token decode error:", err);
      }
    }
    loadNotifications();

    // 🚀 Real-time Notification listener
    const socket = io(SOCKET_URL);
    socket.on("new-notification", (data) => {
      console.log("🔔 New notification received:", data);
      loadNotifications(); // Refresh the list and unread count
    });

    // Optional: Poll for notifications every minute
    const interval = setInterval(loadNotifications, 60000);
    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  const unreadCount = notifications.filter((n) => n.is_read === 0).length;

  const NavLink = ({ to, icon, label }) => {
    const isActive = location.pathname === to;
    return (
      <button
        onClick={() => nav(to)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${isActive
          ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
      >
        <span>{icon}</span>
        <span className="font-medium">{label}</span>
      </button>
    );
  };

  const isAdmin = user?.role === "admin";

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* LOGO */}
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => nav(isAdmin ? "/admin" : "/dashboard")}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform">
              🐱
            </div>
            <span className="hidden sm:block font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              สมาร์ทฟีดเดอร์
            </span>
          </div>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-2 sm:gap-4">
            {!isAdmin && (
              <div className="hidden md:flex items-center gap-2 mr-4">
                <NavLink to="/dashboard" icon="📊" label="ภาพรวม" />
                <NavLink to="/status" icon="⚖️" label="สถานะ" />
                <NavLink to="/schedule" icon="⏰" label="ตั้งเวลา" />
                <NavLink to="/camera" icon="📷" label="กล้อง" />
              </div>
            )}

            {/* NOTIFICATIONS */}
            <div className="relative">
              <button
                className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setOpen(!open)}
              >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full border-2 border-white shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {open && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 ring-1 ring-black ring-opacity-5 animation-fade-in-down">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-slate-700">การแจ้งเตือน</h3>
                    <div className="flex items-center gap-2">
                      {notifications.length > 0 && (
                        <button
                          onClick={clearNotifications}
                          className="text-[10px] uppercase tracking-wider font-bold text-red-500 hover:text-red-700 transition-colors"
                        >
                          ล้างทั้งหมด
                        </button>
                      )}
                      {unreadCount > 0 && <span className="text-xs text-indigo-600 font-medium">{unreadCount} ใหม่</span>}
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-slate-500 text-sm">
                        ไม่มีการแจ้งเตือนใหม่
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markAsRead(n.id)}
                          className={`px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors flex gap-3 ${n.is_read ? "opacity-60" : "bg-indigo-50/30"
                            }`}
                        >
                          <div className="flex-shrink-0 text-lg mt-0.5">
                            {n.type?.includes("BOWL") ? "🥣" : n.type?.includes("TANK") ? "📦" : "🔔"}
                          </div>
                          <div>
                            <p className={`text-sm ${n.is_read ? 'text-slate-600' : 'text-slate-800 font-medium'}`}>
                              {n.message}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(n.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* LOGOUT */}
            <button
              onClick={logout}
              className="ml-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>

      {!isAdmin && (
        <div className="md:hidden border-t border-slate-100 flex justify-around p-2 bg-white">
          <button onClick={() => nav("/dashboard")} className={`p-2 rounded-lg ${location.pathname === '/dashboard' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'}`}>📊</button>
          <button onClick={() => nav("/status")} className={`p-2 rounded-lg ${location.pathname === '/status' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'}`}>⚖️</button>
          <button onClick={() => nav("/schedule")} className={`p-2 rounded-lg ${location.pathname === '/schedule' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'}`}>⏰</button>
          <button onClick={() => nav("/camera")} className={`p-2 rounded-lg ${location.pathname === '/camera' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'}`}>📷</button>
        </div>
      )}
    </nav>
  );
}
