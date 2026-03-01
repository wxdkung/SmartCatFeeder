import { useEffect, useState } from "react";
import io from "socket.io-client";
import api from "../../api/axios";
import Navbar from "../../components/Navbar";

// Backend URL - Adjust if needed
const SOCKET_URL = `http://${window.location.hostname}:5000`;

export default function Status() {
    const [weight, setWeight] = useState(0);
    const [level, setLevel] = useState(0); // 🧊 Tank level %
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // 1. Fetch initial weight
        const fetchInitialWeight = async () => {
            try {
                const res = await api.get("/sensor/current");
                setWeight(res.data.weight || 0);
                setLevel(res.data.level || 0);
                setLastUpdated(new Date());
            } catch (err) {
                console.error("Failed to fetch weight:", err);
            }
        };

        fetchInitialWeight();

        // 2. Setup Socket.IO for real-time updates
        const socket = io(SOCKET_URL);

        socket.on("connect", () => {
            setIsConnected(true);
            console.log("Connected to Real-time weight server");
        });

        socket.on("weight-update", (data) => {
            console.log("Real-time weight received:", data);
            setWeight(data.weight);
            setLastUpdated(new Date());
        });

        socket.on("level-update", (data) => {
            console.log("Real-time level received:", data);
            setLevel(data.level);
            setLastUpdated(new Date());
        });

        socket.on("disconnect", () => {
            setIsConnected(false);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    return (
        <>
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                    {/* Header Section */}
                    <div className="p-8 border-b border-slate-50 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                <span className="bg-indigo-600 text-white p-2 rounded-xl text-xl shadow-lg ring-4 ring-indigo-50">⚖️</span>
                                สถานะเซ็นเซอร์
                            </h2>
                            <p className="text-slate-500 mt-2">ตรวจสอบปริมาณอาหารในถังแบบเรียลไทม์</p>
                        </div>

                        <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100">
                            <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></div>
                            <span className="text-sm font-semibold text-slate-600">
                                {isConnected ? "เชื่อมต่อกับอุปกรณ์แล้ว" : "ขาดการเชื่อมต่อ"}
                            </span>
                        </div>
                    </div>

                    {/* Main Display Area */}
                    <div className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-center gap-12">

                        {/* 🧊 Tank Level Visual (3D Cylinder) */}
                        <div className="flex flex-col items-center gap-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">ระดับในถังเก็บ</h3>
                            <div className="relative w-32 h-64 bg-slate-100 rounded-2xl border-4 border-slate-200 shadow-inner overflow-hidden flex flex-col justify-end p-1">
                                {/* Glass Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-black/5 pointer-events-none z-10"></div>

                                {/* 3D Cylinder Top Gap Effect */}
                                <div className="absolute top-0 left-0 right-0 h-4 bg-slate-200 rounded-full blur-[1px] opacity-50"></div>

                                {/* Dynamic Fill */}
                                <div
                                    className={`w-full rounded-xl transition-all duration-1000 ease-out relative overflow-hidden ${level > 20 ? 'bg-gradient-to-b from-indigo-400 to-indigo-600' : 'bg-gradient-to-b from-red-400 to-red-600'
                                        }`}
                                    style={{ height: `${level}%` }}
                                >
                                    {/* Bubbles/Sparkle detail */}
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-white/30"></div>
                                    <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                                </div>

                                {/* Label % */}
                                <div className="absolute inset-0 flex items-center justify-center z-20">
                                    <span className="text-2xl font-black text-slate-800 drop-shadow-sm">{level}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Weight Gauge/Display */}
                        <div className="relative group">
                            {/* Outer Glow */}
                            <div className="absolute inset-0 bg-indigo-500/20 blur-3xl group-hover:bg-indigo-500/30 transition-all rounded-full"></div>

                            <div className="relative w-64 h-64 rounded-full bg-white border-8 border-slate-50 shadow-2xl flex flex-col items-center justify-center gap-1 transition-transform hover:scale-105 duration-500">
                                <span className="text-6xl font-black text-slate-800 tracking-tight">
                                    {Number(weight).toFixed(1)}
                                </span>
                                <span className="text-xl font-bold text-slate-400 uppercase tracking-widest">Grams</span>

                                {/* Visual indicator (simple arc representation) */}
                                <div className="absolute inset-0 rounded-full border-t-8 border-indigo-500" style={{ transform: `rotate(${Math.min(weight, 100) * 3.6}deg)` }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 w-full">
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl">
                                🕒
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">อัปเดตล่าสุด</p>
                                <p className="text-slate-700 font-semibold">
                                    {lastUpdated ? lastUpdated.toLocaleTimeString() : "ยังไม่มีข้อมูล"}
                                </p>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl">
                                📦
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">สถานะอาหาร</p>
                                <p className={`font-semibold ${weight < 5 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {weight < 5 ? 'ควรเติมอาหารได้แล้ว' : 'อาหารเพียงพอ'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 w-full">
                        <p className="text-sm text-indigo-600 font-medium">
                            ข้อมูลภาพรวมน้ำหนักจะเปลี่ยนตามการวัดจริงจากตัวเครื่องผ่านโปรโตคอล MQTT แบบ Real-time
                        </p>
                    </div>
                </div>
            </main>
        </>
    );
}
