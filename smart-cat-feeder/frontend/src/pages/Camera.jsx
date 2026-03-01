import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { io } from "socket.io-client";

export default function Camera() {
  // 🔧 แก้ IP ตรงนี้เป็นของ ESP32-CAM นาย
  const [show, setShow] = useState(false);
  const [image, setImage] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!show) return;

    const socket = io("http://localhost:5000");

    socket.on("connect", () => {
      console.log("✅ Socket Connected");
      setIsConnected(true);
    });

    socket.on("camera-frame", (base64Image) => {
      setImage(`data:image/jpeg;base64,${base64Image}`);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [show]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        {/* Background Decorative Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-indigo-600/10 blur-[120px] rounded-full -z-10"></div>

        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-wider uppercase mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                Monitoring System
              </div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                กล้องถ่ายทอดสด
                <span className="text-indigo-500">.</span>
              </h1>
              <p className="text-slate-400 mt-2 text-lg">เฝ้าดูเจ้าเหมียวของคุณแบบคมชัดผ่านระบบ Cloud</p>
            </div>

            <div className="flex items-center gap-3">
              {show && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-500 ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}></div>
                  <span className="text-sm font-bold uppercase tracking-widest">
                    {isConnected ? 'Live Connected' : 'Disconnected'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Main Viewport */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>

            <div className="relative bg-slate-900 rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden aspect-video flex items-center justify-center">
              {!show ? (
                <div className="text-center p-12 transition-all duration-700 animate-in fade-in zoom-in slide-in-from-bottom-4">
                  <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 bg-indigo-500 rounded-3xl blur-2xl opacity-20 animate-pulse"></div>
                    <div className="relative w-full h-full bg-slate-800 rounded-3xl border border-white/10 flex items-center justify-center text-5xl shadow-inner">
                      📷
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-3">ระบบพร้อมทำงาน</h3>
                  <p className="text-slate-500 mb-10 max-w-sm mx-auto leading-relaxed">
                    เชื่อมต่อสตรีมมิ่งจากกล้อง Smart Feeder ของคุณเพื่อดูภาพสดแบบเรียลไทม์
                  </p>

                  <button
                    onClick={() => setShow(true)}
                    className="group relative inline-flex items-center justify-center px-10 py-4 font-bold text-white transition-all duration-200 bg-indigo-600 font-pj rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 hover:bg-indigo-500 shadow-[0_10px_20px_-10px_rgba(79,70,229,0.5)]"
                  >
                    <svg className="w-6 h-6 mr-2 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    เริ่มถ่ายทอดสด
                  </button>
                </div>
              ) : (
                <div className="w-full h-full relative flex items-center justify-center bg-black animate-in fade-in duration-500">
                  {image ? (
                    <img
                      src={image}
                      alt="ESP32 Camera Stream"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative w-12 h-12">
                        <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20"></div>
                        <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
                      </div>
                      <p className="text-indigo-400 font-medium tracking-wide animate-pulse">กำลังเรียกข้อมูลสตรีมมิ่ง...</p>
                    </div>
                  )}

                  {/* Glassmorphic Overlay Controls */}
                  <div className="absolute top-6 left-6 flex items-center gap-3">
                    <div className="px-3 py-1 bg-red-600 rounded-lg text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-red-900/40 animate-pulse flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                      Live
                    </div>
                    {isConnected && (
                      <div className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-lg text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        Stable Connection
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center translate-y-4 opacity-0 hover:translate-y-0 hover:opacity-100 transition-all duration-500 ease-out">
                    <div className="bg-slate-950/60 backdrop-blur-lg border border-white/5 px-4 py-2 rounded-xl flex items-center gap-4 text-xs font-mono text-slate-300">
                      <div className="flex items-center gap-2 border-r border-white/10 pr-4">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        320x240 QVGA
                      </div>
                      <span>{new Date().toLocaleTimeString()}</span>
                    </div>

                    <button
                      onClick={() => setShow(false)}
                      className="group bg-red-500/80 hover:bg-red-500 backdrop-blur-md text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-red-900/20 active:scale-95 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                      หยุดสตรีม
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-colors">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-xl mb-4 border border-indigo-500/20">⚡</div>
              <h4 className="text-white font-bold mb-1">Ultra-Low Latency</h4>
              <p className="text-slate-500 text-sm">การหน่วงเวลาต่ำพิเศษเพื่อการดูย้อนหลังที่แม่นยำ</p>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-colors">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-xl mb-4 border border-purple-500/20">☁️</div>
              <h4 className="text-white font-bold mb-1">MQTT over Socket</h4>
              <p className="text-slate-500 text-sm">ระบบส่งข้อมูลที่ปลอดภัยและมีเสถียรภาพ</p>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-colors">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-xl mb-4 border border-emerald-500/20">📱</div>
              <h4 className="text-white font-bold mb-1">Responsive Design</h4>
              <p className="text-slate-500 text-sm">รองรับการทำงานในทุกอุปกรณ์ พร้อมการใช้งานที่ลื่นไหล</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
