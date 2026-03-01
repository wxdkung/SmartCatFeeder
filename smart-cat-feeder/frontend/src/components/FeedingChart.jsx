import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Defs,
  LinearGradient,
  Stop
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-sm text-indigo-600 font-bold">
          {payload[0].value} กรัม
        </p>
      </div>
    );
  }
  return null;
};

export default function FeedingChart({ logs = [] }) {
  if (!logs.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <span className="text-4xl mb-2">📊</span>
        <p>ไม่มีข้อมูลการให้อาหาร</p>
      </div>
    );
  }

  // Convert logs to data for chart
  const data = logs
    .slice()
    .reverse()
    .map(l => ({
      time: new Date(l.created_at).toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }),
      amount: l.amount
    }));

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={250}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis
          dataKey="time"
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          dy={10}
        />
        <YAxis
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          dx={-10}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '3 3' }} />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#6366f1"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorAmount)"
          activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
