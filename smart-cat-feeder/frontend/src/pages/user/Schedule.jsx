import { useEffect, useState } from "react";
import api from "../../api/axios";
import Navbar from "../../components/Navbar";

export default function Schedule() {
  const [list, setList] = useState([]);
  const [time, setTime] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(""); // 📅 One-time date
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const res = await api.get("/user/schedule");
      setList(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!time || !amount) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    const [hour, minute] = time.split(":").map(Number);
    setLoading(true);

    try {
      await api.post("/user/schedule", {
        hour,
        minute,
        amount: Number(amount),
        date: date || null // Send null for Daily
      });

      setTime("");
      setAmount("");
      setDate("");
      load();
    } catch (err) {
      console.error(err);
      alert("เพิ่มตารางเวลาไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("ต้องการลบตารางเวลานี้ใช่ไหม?")) return;

    try {
      await api.delete(`/user/schedule/${id}`);
      load();
    } catch (err) {
      console.error(err);
      alert("ลบไม่สำเร็จ");
    }
  };

  return (
    <>
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">

          <div className="p-8 border-b border-slate-50 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <span className="bg-purple-600 text-white p-2 rounded-xl text-xl shadow-lg shadow-purple-100">⏰</span>
                ตั้งเวลาให้อาหาร
              </h2>
              <p className="text-slate-500 mt-2">กำหนดรอบการจ่ายอาหารอัตโนมัติ (เลือกวันที่ระบุรอบเดียว หรือเว้นไว้เพื่อให้ทุกวัน)</p>
            </div>

            {/* ENHANCED ADD FORM */}
            <form onSubmit={add} className="flex flex-wrap items-end gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">เวลา</label>
                <input
                  type="time"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ปริมาณ (กรัม)</label>
                <input
                  type="number"
                  placeholder="20"
                  className="w-24 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ระบุวันที่ (ถ้ามี)</label>
                <input
                  type="date"
                  className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white h-[46px] px-8 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-50"
              >
                {loading ? "..." : "+ เพิ่มตาราง"}
              </button>
            </form>
          </div>

          <div className="p-4 md:p-8">
            {list.length === 0 ? (
              <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                <div className="w-20 h-20 bg-white text-slate-300 rounded-3xl shadow-sm flex items-center justify-center text-4xl mx-auto mb-6">
                  📅
                </div>
                <h3 className="text-slate-800 font-bold text-lg">ยังไม่มีตารางการให้อาหาร</h3>
                <p className="text-slate-500 max-w-xs mx-auto mt-2">เพิ่มเวลาที่ต้องการให้เครื่องทำงานอัตโนมัติเพื่อให้แมวของคุณไม่หิวโหย</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {list.sort((a, b) => (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute)).map(s => (
                  <div key={s.id} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex flex-col items-center justify-center shadow-lg shadow-indigo-100">
                        <span className="text-2xl font-black leading-none">{String(s.hour).padStart(2, "0")}</span>
                        <span className="text-sm font-bold opacity-80 mt-1">{String(s.minute).padStart(2, "0")}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${s.scheduled_date ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {s.scheduled_date ? 'ตามวันที่ระบุ' : 'จ่ายทุกวัน'}
                          </span>
                        </div>
                        <h4 className="text-slate-800 font-bold text-lg mt-1">
                          {s.scheduled_date ? new Date(s.scheduled_date).toLocaleDateString() : 'เวียนทุก 24 ชม.'}
                        </h4>
                        <p className="text-slate-400 text-sm font-medium">จ่ายปริมาณ <span className="text-indigo-600">{s.amount} กรัม</span></p>
                      </div>
                    </div>
                    <button
                      onClick={() => remove(s.id)}
                      className="text-slate-300 hover:text-red-500 p-3 rounded-xl hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
