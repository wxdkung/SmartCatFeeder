import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Navbar from "../../components/Navbar";

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "user",
    cat_name: "",
    age_month: "",
    weight: "",
    food_type: ""
  });

  const loadData = () => {
    api.get(`/admin/users/${id}`)
      .then(res => {
        setData(res.data);
        setFormData({
          name: res.data.user.name,
          email: res.data.user.email,
          role: res.data.user.role,
          cat_name: res.data.cat?.name || "",
          age_month: res.data.cat?.age_month || "",
          weight: res.data.cat?.weight || "",
          food_type: res.data.cat?.food_type || ""
        });
      })
      .catch(err => {
        console.error(err);
        alert("โหลดข้อมูลผู้ใช้ไม่สำเร็จ");
        navigate("/admin");
      });
  };

  useEffect(() => {
    loadData();
  }, [id, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/users/${id}`, formData);
      alert("บันทึกข้อมูลสำเร็จ");
      setIsEditing(false);
      loadData();
    } catch (err) {
      alert("บันทึกข้อมูลไม่สำเร็จ");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/admin")}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            >
              ⬅️ ย้อนกลับ
            </button>
            <h1 className="text-2xl font-bold text-slate-800">รายละเอียดผู้ใช้: {data.user.name}</h1>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-6 py-2 rounded-xl font-bold text-white transition-all shadow-lg ${isEditing ? "bg-slate-500 shadow-slate-200" : "bg-indigo-600 shadow-indigo-200"
              }`}
          >
            {isEditing ? "ยกเลิก" : "🔧 แก้ไขข้อมูล"}
          </button>
        </div>

        {isEditing ? (
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-indigo-100 animation-fade-in-down">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-600 p-2 rounded-lg text-lg">📝</span>
              ฟอร์มแก้ไขข้อมูล
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* User Fields */}
              <div className="space-y-4">
                <h3 className="font-bold text-indigo-600 uppercase tracking-wider text-xs border-b border-indigo-50 pb-2">ข้อมูลผู้ใช้</h3>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">ชื่อผู้ใช้</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">อีเมล</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">สิทธิ์การใช้งาน</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                  >
                    <option value="user">ผู้ใช้ทั่วไป</option>
                    <option value="admin">ผู้ดูแลระบบ</option>
                  </select>
                </div>
              </div>

              {/* Cat Fields */}
              <div className="space-y-4">
                <h3 className="font-bold text-orange-600 uppercase tracking-wider text-xs border-b border-orange-50 pb-2">ข้อมูลแมว</h3>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">ชื่อแมว</label>
                  <input
                    type="text"
                    value={formData.cat_name}
                    onChange={(e) => setFormData({ ...formData, cat_name: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">อายุ (เดือน)</label>
                    <input
                      type="number"
                      value={formData.age_month}
                      onChange={(e) => setFormData({ ...formData, age_month: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">น้ำหนัก (กก.)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">ยี่ห้ออาหาร</label>
                  <input
                    type="text"
                    value={formData.food_type}
                    onChange={(e) => setFormData({ ...formData, food_type: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-10 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {saving ? "กำลังบันทึก..." : "✅ บันทึกการเปลี่ยนแปลง"}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* USER INFO & CAT PROFILE */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
              {/* User Details */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg text-sm">👤</span>
                  ข้อมูลผู้ใช้
                </h2>
                <div className="space-y-2 text-sm">
                  <p className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-500">ชื่อ:</span>
                    <span className="font-medium text-slate-900">{data.user.name}</span>
                  </p>
                  <p className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-500">อีเมล:</span>
                    <span className="font-medium text-slate-900">{data.user.email}</span>
                  </p>
                  <p className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-slate-500">สิทธิ์:</span>
                    <span className={`font-bold ${data.user.role === 'admin' ? 'text-amber-600' : 'text-green-600'}`}>
                      {data.user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้ทั่วไป'}
                    </span>
                  </p>
                  <p className="flex justify-between pt-1">
                    <span className="text-slate-500">วันที่สมัคร:</span>
                    <span className="font-medium text-slate-900">{new Date(data.user.created_at).toLocaleDateString('th-TH')}</span>
                  </p>
                </div>
              </div>

              {/* Cat Profile */}
              <div className="pt-6 border-t border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="bg-orange-100 text-orange-600 p-1.5 rounded-lg text-sm">🐱</span>
                  ข้อมูลแมว
                </h2>
                {data.cat ? (
                  <div className="bg-slate-50 rounded-xl p-4 flex gap-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl shadow-sm border border-slate-100">
                      🐈
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 text-lg">{data.cat.name}</p>
                      <p className="text-sm text-slate-500">
                        อายุ {data.cat.age_month} เดือน • {data.cat.weight} กก.
                      </p>
                      <p className="text-xs text-slate-400 bg-white px-2 py-0.5 rounded-md inline-block border border-slate-100">
                        อาหาร: {data.cat.food_type}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm italic py-2">ยังไม่ได้เพิ่มข้อมูลแมว</p>
                )}
              </div>
            </div>

            {/* SCHEDULE */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="bg-purple-100 text-purple-600 p-1.5 rounded-lg text-sm">⏰</span>
                ตารางการให้อาหาร
              </h2>
              {data.schedule.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  ไม่มีตารางเวลา
                </div>
              ) : (
                <ul className="space-y-2">
                  {data.schedule.map((s, idx) => (
                    <li key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg text-purple-600 font-bold border border-slate-100">
                          {String(s.hour).padStart(2, "0")}:{String(s.minute).padStart(2, "0")}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-slate-600">
                        {s.amount} กรัม
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* LOGS */}
        {!isEditing && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg text-sm">📜</span>
              ประวัติการให้อาหาร (50 รายการล่าสุด)
            </h2>
            <div className="overflow-auto max-h-96">
              {data.logs.length === 0 ? (
                <p className="text-slate-500 text-center py-8">ไม่มีประวัติการให้อาหาร</p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-slate-200">
                      <th className="p-3 text-xs font-semibold text-slate-500 uppercase">เวลา</th>
                      <th className="p-3 text-xs font-semibold text-slate-500 uppercase">โหมด</th>
                      <th className="p-3 text-xs font-semibold text-slate-500 uppercase text-right">ปริมาณ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.logs.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="p-3 text-sm text-slate-600">
                          {new Date(l.created_at).toLocaleString('th-TH')}
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${l.mode === 'manual' ? 'bg-orange-50 text-orange-700' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                            {l.mode === 'manual' ? 'มือ' : 'อัตโนมัติ'}
                          </span>
                        </td>
                        <td className="p-3 text-right text-sm font-bold text-slate-700">
                          {l.amount} กรัม
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
