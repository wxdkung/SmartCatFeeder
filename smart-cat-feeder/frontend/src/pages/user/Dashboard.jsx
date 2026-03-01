import { useEffect, useState } from "react";
import io from "socket.io-client";
import api from "../../api/axios";
import FeedingChart from "../../components/FeedingChart";
import Navbar from "../../components/Navbar";

const SOCKET_URL = `http://${window.location.hostname}:5000`;

export default function Dashboard() {
  const [cat, setCat] = useState(null);
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [today, setToday] = useState({ total_today: 0 });
  const [feedAmount, setFeedAmount] = useState(10);
  const [chipId, setChipId] = useState("");
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [isPairing, setIsPairing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    age_month: "",
    weight: "",
    food_type: ""
  });
  const loadData = async () => {
    try {
      const authRes = await api.get("/auth/me");
      setUser(authRes.data);

      const catRes = await api.get("/user/cat");
      if (catRes.data) {
        setCat(catRes.data);
        setForm({
          name: catRes.data.name || "",
          age_month: catRes.data.age_month || "",
          weight: catRes.data.weight || "",
          food_type: catRes.data.food_type || ""
        });
      }

      const logRes = await api.get("/user/feed/logs");
      setLogs(logRes.data || []);

      const todayRes = await api.get("/user/feed/today");
      setToday(todayRes.data || { total_today: 0 });
    } catch (err) {
      console.error("Error loading data", err);
    }
  };

  useEffect(() => {
    loadData();

    const socket = io(SOCKET_URL);

    socket.on("weight-update", (data) => {
      setCat(prev => {
        if (prev && String(data.userId) === String(prev.user_id)) {
          return { ...prev, status: { ...prev.status, weight: data.weight } };
        }
        return prev;
      });
    });

    socket.on("level-update", (data) => {
      setCat(prev => {
        if (prev && String(data.userId) === String(prev.user_id)) {
          return { ...prev, status: { ...prev.status, tank_level: data.level } };
        }
        return prev;
      });
    });

    socket.on("feed-update", (data) => {
      if (cat && String(data.userId) === String(cat.user_id)) {
        console.log("🍖 Feed update received, reloading...");
        loadData();
      }
    });

    socket.on("device-discovered", (data) => {
      setDiscoveredDevices(prev => {
        if (prev.find(d => d.chipId === data.chipId)) return prev;
        return [...prev, data];
      });
    });

    const interval = setInterval(loadData, 30000);
    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  const submitCat = async () => {
    try {
      await api.post("/user/cat", form);
      alert("บันทึกข้อมูลแมวแล้ว 🐱");
      loadData();
    } catch (err) {
      alert("Error saving cat profile");
    }
  };

  const manualFeed = async () => {
    if (feedAmount <= 0) return alert("กรุณาใส่ปริมาณอาหาร");

    try {
      await api.post("/user/feed", {
        amount: feedAmount,
        mode: "manual"
      });

      alert("ให้อาหารเรียบร้อย 🍽");
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "ให้อาหารไม่สำเร็จ");
    }
  };

  const handlePairDevice = async () => {
    if (!chipId) return alert("กรุณาระบุ Device Chip ID");
    setIsPairing(true);
    try {
      await api.post("/user/device/pair", { chipId });
      alert("ส่งคำสั่งจับคู่แล้ว! กรุณาตรวจสอบที่ตัวเครื่อง (Serial Monitor)");
    } catch (err) {
      alert(err.response?.data?.message || "การจับคู่ล้มเหลว");
    } finally {
      setIsPairing(false);
    }
  };

  const bowlWeight = cat?.status?.weight ?? 0;

  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* TOP SECTION: PROFILE & CORE STATS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 🐱 LEFT: CAT PROFILE & NUTRITION */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                  <span className="bg-indigo-600 text-white p-2 rounded-xl text-lg shadow-lg shadow-indigo-100">🐱</span>
                  ข้อมูลน้องแมว
                </h2>
                <div className="flex flex-col items-end gap-1">
                  {user && (
                    <div className="bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                      <span className="text-xs font-bold text-indigo-600">User ID: {user.id}</span>
                    </div>
                  )}
                  {cat?.status?.chip_id && (
                    <div className="bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500 italic">Device ID: {cat.status.chip_id}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="group">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">ชื่อ</label>
                  <input
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="ระบุชื่อแมว"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">อายุ (เดือน)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      placeholder="0"
                      value={form.age_month}
                      onChange={e => setForm({ ...form, age_month: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">น้ำหนัก (กก.)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      placeholder="0.0"
                      value={form.weight}
                      onChange={e => setForm({ ...form, weight: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">ประเภทอาหาร</label>
                  <input
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="เช่น อาหารเม็ด"
                    value={form.food_type}
                    onChange={e => setForm({ ...form, food_type: e.target.value })}
                  />
                </div>

                <button
                  className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
                  onClick={submitCat}
                >
                  {cat ? "อัปเดตข้อมูล" : "สร้างโปรไฟล์"}
                </button>
              </div>

              {/* 📱 Device Pairing Card */}
              <div className="mt-6 p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="text-lg">📱</span> เชื่อมต่ออุปกรณ์ใหม่
                </h3>
                <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
                  ระบุ Chip ID หรือคลิกเลือกอุปกรณ์ด้านล่าง เพื่อจับคู่กับบัญชีนี้
                </p>

                {discoveredDevices.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">พบอุปกรณ์ใกล้เคียง:</p>
                    <div className="flex flex-wrap gap-2">
                      {discoveredDevices.map(dev => (
                        <button
                          key={dev.chipId}
                          onClick={() => setChipId(dev.chipId)}
                          className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition-colors"
                        >
                          📡 {dev.chipId}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  <input
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="ใส่ Chip ID (เช่น 1234567)"
                    value={chipId}
                    onChange={(e) => setChipId(e.target.value)}
                  />
                  <button
                    disabled={isPairing}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${isPairing
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                      : "bg-slate-800 text-white hover:bg-slate-900 active:scale-95"
                      }`}
                    onClick={handlePairDevice}
                  >
                    {isPairing ? "กำลังส่งคำสั่ง..." : "จับคู่อุปกรณ์ (Pair)"}
                  </button>
                </div>
              </div>

              {cat && cat.nutrition && cat.nutrition.food_per_day > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-50">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-5 border border-emerald-100/50">
                    <h3 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
                      <span className="text-xl">🥗</span> คำแนะนำอาหาร
                    </h3>
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center bg-white/50 px-3 py-2 rounded-xl">
                        <span className="text-xs font-bold text-emerald-600/70 uppercase tracking-wider">ช่วงวัย</span>
                        <span className="font-bold text-emerald-900">{cat.nutrition.stage}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/50 px-3 py-2 rounded-xl">
                        <span className="text-xs font-bold text-emerald-600/70 uppercase tracking-wider">ต่อวัน</span>
                        <span className="font-bold text-emerald-900">{cat.nutrition.food_per_day} g</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/50 px-3 py-2 rounded-xl border-2 border-emerald-200/30">
                        <span className="text-xs font-bold text-emerald-600/70 uppercase tracking-wider">ต่อมื้อ (3 มื้อ)</span>
                        <span className="font-bold text-emerald-900">{cat.nutrition.food_per_meal} g</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 🍽 RIGHT: FEEDING CONTROL & LIVE STATUS */}
          <div className="lg:col-span-2 space-y-6">

            {/* ROW 1: ACTIONS & BOWL WEIGHT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Manual Feed */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <span className="bg-orange-600 text-white p-2 rounded-xl text-lg shadow-lg shadow-orange-100">🍽</span>
                    ให้อาหารทันที
                  </h2>
                  <div className="flex items-center justify-center gap-6 mb-8">
                    <button
                      onClick={() => setFeedAmount(Math.max(10, feedAmount - 10))}
                      className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-200 flex items-center justify-center text-xl font-black border border-slate-100 transition-all active:scale-90"
                    >
                      -
                    </button>
                    <div className="text-center">
                      <span className="text-5xl font-black text-indigo-600 tracking-tighter">{feedAmount}</span>
                      <span className="text-sm font-bold text-slate-400 ml-2 uppercase">g</span>
                    </div>
                    <button
                      onClick={() => setFeedAmount(feedAmount + 10)}
                      className="w-14 h-14 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center text-xl font-black shadow-lg shadow-indigo-100 transition-all active:scale-90"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-slate-200 active:scale-[0.98] text-lg flex items-center justify-center gap-3"
                  onClick={manualFeed}
                >
                  ปล่อยอาหารไปยังจาน 🚀
                </button>
              </div>

              {/* Live Bowl Weight indicator */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute top-4 right-6 flex items-center gap-1.5 px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Live Status</span>
                </div>

                <div className="relative mb-2">
                  <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full scale-150"></div>
                  <div className="relative bg-white w-40 h-40 rounded-full border-[12px] border-slate-50 shadow-inner flex flex-col items-center justify-center transition-transform group-hover:scale-105 duration-500">
                    <span className="text-4xl font-black text-slate-800 tracking-tight">{Number(bowlWeight).toFixed(1)}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px]">Grams in Bowl</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-col items-center">
                  <span className="bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                    ปริมาณในจานปัจจุบัน
                  </span>
                </div>

                {/* Decorative background icon */}
                <div className="absolute -bottom-10 -left-10 text-9xl text-slate-50 opacity-20 pointer-events-none group-hover:rotate-12 transition-transform duration-700">⚖️</div>
              </div>
            </div>

            {/* ROW 2: SUMMARY STATS (Moved up for better flow) */}
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-8 rounded-3xl shadow-xl shadow-indigo-200 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/15 transition-all duration-700"></div>

              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-white/20 p-2 rounded-xl text-xl backdrop-blur-md">📊</span>
                    <h2 className="text-lg font-bold text-indigo-100 uppercase tracking-widest">สรุปการรวมวันนี้</h2>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-7xl font-black tracking-tighter">{today.total_today}</span>
                    <span className="text-2xl font-bold opacity-60">กรัม</span>
                  </div>
                  <p className="mt-3 text-indigo-100/70 text-sm font-medium">รวมปริมาณอาหารทั้งหมดที่เครื่องทำงานในวันนี้</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 md:min-w-[200px]">
                  <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1.5 text-center">ให้อาหารครั้งล่าสุด</p>
                  <p className="text-2xl font-black text-white text-center">
                    {logs.length > 0 ? new Date(logs[0].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,1)]"></span>
                    <span className="text-[10px] font-bold text-emerald-400">System Ready</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-3">
              <span className="text-amber-500 text-xl">⚠️</span>
              <p className="text-sm font-bold text-amber-800">
                คำเตือน: ปริมาณอาหารอาจคาดเคลื่อน +/- 5 กรัม
              </p>
            </div>
          </div>
        </div>

        {/* 📊 BOTTOM SECTION: LOGS TABLE */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
              <span className="bg-indigo-600 text-white p-1.5 rounded-lg text-lg">📝</span>
              ประวัติการทำงานล่าสุด
            </h2>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
              Auto-updating
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[2px]">วัน/เวลา</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[2px]">รูปแบบการทำงาน</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[2px]">จ่ายไป (g)</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[2px] text-indigo-500">ปริมาณที่กิน (g)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-medium">ไม่มีประวัติการให้อาหารในขณะนี้</td>
                  </tr>
                ) : (
                  logs.slice(0, 5).map((l, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-slate-700 block">{new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(l.created_at).toLocaleDateString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${l.mode === 'manual'
                          ? 'bg-orange-50 text-orange-600 border-orange-100'
                          : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                          }`}>
                          {l.mode === 'manual' ? 'กดปุ่มเอง' : 'ตามกาหนดการ'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-800">{l.amount}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex min-w-[40px] justify-center items-center py-1.5 rounded-xl font-black text-xs ${l.amount_eaten > 0
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                          : 'bg-slate-100 text-slate-400'
                          }`}>
                          {l.amount_eaten || 0} g
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
