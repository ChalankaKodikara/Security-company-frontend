/** @format */
import React, { useState, useEffect, useRef } from "react";
import moment from "moment";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Sector,
} from "recharts";
import {
  Users, UserCheck, UserX, Clock, TrendingUp, TrendingDown,
  AlertCircle, Gift, LogOut, ChevronDown, Sparkles,
  Building2, Calendar,
} from "lucide-react";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import {apiFetch} from "../../../../utils/apiClient";


function useCounter(target, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return count;
}


function CircularProgress({ value, max, color, size = 80, stroke = 7, children }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const dash = pct * circ;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

function StatCard({ label, value, total, pctLabel, icon: Icon, gradient, ring, delay = 0 }) {
  const animated = useCounter(value);
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative bg-white rounded-2xl p-5 shadow-[0_4px_24px_rgba(59,130,246,0.08)] border border-blue-50 overflow-hidden cursor-default select-none"
    >
      {/* Gradient blob */}
      <div className={`absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-500 ${gradient}`} />

      <div className="flex items-center justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg ${gradient}`}>
          <Icon size={20} className="text-white" />
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest text-right leading-tight">{label}</span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-4xl font-black text-slate-800 leading-none tracking-tight">{animated.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">{pctLabel}</p>
        </div>
        <CircularProgress value={value} max={total} color={ring} size={64} stroke={6}>
          <span className="text-[11px] font-black text-slate-600">{pct}%</span>
        </CircularProgress>
      </div>

      {/* Bottom shimmer bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: ring }} />
    </motion.div>
  );
}

const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 8) * cos;
  const sy = cy + (outerRadius + 8) * sin;
  const mx = cx + (outerRadius + 24) * cos;
  const my = cy + (outerRadius + 24) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 16;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 12} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.15} />
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" strokeWidth={1.5} />
      <circle cx={ex} cy={ey} r={3} fill={fill} />
      <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey - 4} textAnchor={textAnchor} fill="#1e293b" fontSize={11} fontWeight={700}>{payload.name}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey + 10} textAnchor={textAnchor} fill="#94a3b8" fontSize={10}>{`${value} · ${(percent * 100).toFixed(0)}%`}</text>
    </g>
  );
};

const RoundedBar = (props) => {
  const { x, y, width, height, fill } = props;
  if (!height || height < 1) return null;
  const r = Math.min(6, width / 2);
  return <path d={`M${x},${y+r} Q${x},${y} ${x+r},${y} L${x+width-r},${y} Q${x+width},${y} ${x+width},${y+r} L${x+width},${y+height} L${x},${y+height} Z`} fill={fill} />;
};

function NotifItem({ name, sub, badge, badgeColor, avatarGrad, delay = 0 }) {
  const initials = name?.split(" ").slice(0,2).map(n => n[0]).join("").toUpperCase() || "?";
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ x: 4, backgroundColor: "#eff6ff" }}
      className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-blue-100 transition-all duration-200 cursor-default"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0 shadow-md ${avatarGrad}`}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 truncate">{name}</p>
        <p className="text-xs text-slate-400 truncate">{sub}</p>
      </div>
      {badge && (
        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg shrink-0 ${badgeColor}`}>{badge}</span>
      )}
    </motion.div>
  );
}

const Dashboard = () => {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const authToken = Cookies.get("user_token");
  const [data, setData] = useState({ totalWorkforce: 0, presentWorkforce: 0, absentWorkforce: 0, lateArrivals: 0, inLeave: 0 });
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [upcomingRetirements, setUpcomingRetirements] = useState([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
  const [salaryData, setSalaryData] = useState({ total: "0", percentageChange: "0%", monthlyTrend: [] });
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [activeTab, setActiveTab] = useState("leaves");
  const [activePieIndex, setActivePieIndex] = useState(0);
  const [orgOpen, setOrgOpen] = useState(false);
  const orgRef = useRef(null);

  const selectedOrgName = organizations.find(o => o.id === selectedOrg)?.organization_name || "Select Organization";

  useEffect(() => {
    const handler = (e) => { if (orgRef.current && !orgRef.current.contains(e.target)) setOrgOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Fetches ── */
  const fetchDepartmentDistribution = async (orgId) => {
    if (!orgId) return;
    try {
      const res = await apiFetch(`${API_URL}/v1/hris/employees/employee-count?organization=${orgId}`);
      const result = await res.json();
      if (result.success && result.data?.departments) {
        const palette = ["#3b82f6","#6366f1","#06b6d4","#10b981","#f59e0b","#ec4899","#f97316","#84cc16"];
        setDepartmentData(result.data.departments.map((dept, i) => ({ name: dept.name, value: dept.employeeCount, color: palette[i % 8] })));
      } else setDepartmentData([]);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (selectedOrg) fetchDepartmentDistribution(selectedOrg); }, [selectedOrg]);

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await apiFetch(`${API_URL}/v1/hris/organizations/organization`);
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) { setOrganizations(result.data); setSelectedOrg(result.data[0]?.id || null); }
      } catch (e) { console.error(e); }
    };
    fetchOrgs();
  }, [API_URL, authToken]);

  useEffect(() => {
    if (!selectedOrg) return;
    const run = async () => {
      try {
        const res = await apiFetch(`${API_URL}/v1/hris/payroll/getPayrollTotal?organization=${selectedOrg}`);
        if (res.status === 404) { setSalaryData({ total: "0", percentageChange: "0%", monthlyTrend: [] }); return; }
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          const trend = result.data.map(item => ({ month: moment(item.month, "YYYY-MM").format("MMM"), amount: parseFloat(item.total) }));
          const latest = result.data[result.data.length - 1];
          setSalaryData({ total: latest?.total || "0", percentageChange: latest?.percentageChange || "0%", monthlyTrend: trend });
        } else setSalaryData({ total: "0", percentageChange: "0%", monthlyTrend: [] });
      } catch (e) { console.error(e); }
    };
    run();
  }, [API_URL, authToken, selectedOrg]);

  useEffect(() => {
    if (!selectedOrg) return;
    const run = async () => {
      try {
        const today = moment().format("YYYY-MM-DD");
        const res = await apiFetch(`${API_URL}/v1/hris/new-attendence/all-attendance-counts?date=${today}&organization=${selectedOrg}`);
        const result = await res.json();
        if (result.success && result.summary) {
          setData({ totalWorkforce: result.summary.totalActiveEmployees || 0, presentWorkforce: result.summary.presentWorkforce || 0, absentWorkforce: result.summary.absentWorkforce || 0, inLeave: result.summary.leaveCount || 0, lateArrivals: result.summary.lateArrivalsCount || 0 });
        }
      } catch (e) { console.error(e); }
    };
    run();
  }, [API_URL, authToken, selectedOrg]);

  useEffect(() => {
    if (!selectedOrg) return;
    const run = async () => {
      try {
        setAttendanceHistory([]);
        const res = await apiFetch(`${API_URL}/v1/hris/employees/getAttendanceStatsForLastFiveDays?organization_id=${selectedOrg}`);
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          setAttendanceHistory(result.data.map(d => ({ day: moment(d.date).format("ddd"), present: d.presentWorkforce, absent: Math.abs(d.absentWorkforce) })));
        }
      } catch (e) { console.error(e); }
    };
    run();
  }, [API_URL, authToken, selectedOrg]);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await apiFetch(`${API_URL}/v1/hris/leave/getleaveapprove1`);
        const result = await res.json();
        if (Array.isArray(result)) setPendingLeaves(result);
      } catch (e) { console.error(e); }
    };
    run();
  }, [API_URL, authToken]);

  useEffect(() => {
    if (!selectedOrg) return;
    const run = async () => {
      try {
        const res = await apiFetch(`${API_URL}/v1/hris/employees/get-retirements?organization=${selectedOrg}`);
        const result = await res.json();
        if (result.success && Array.isArray(result.data) && result.data.length > 0) setUpcomingRetirements(result.data);
        else if (result.success && result.message) setUpcomingRetirements([{ noDataMessage: result.message }]);
        else setUpcomingRetirements([{ noDataMessage: "No employees reaching retirement age this year." }]);
      } catch (e) { setUpcomingRetirements([{ noDataMessage: "Failed to load retirement data." }]); }
    };
    run();
  }, [API_URL, authToken, selectedOrg]);

  useEffect(() => {
    if (!selectedOrg) return;
    const run = async () => {
      try {
        const res = await apiFetch(`${API_URL}/v1/hris/employees/get-birthdays?organization=${selectedOrg}`);
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) setUpcomingBirthdays(result.data);
      } catch (e) { console.error(e); }
    };
    run();
  }, [API_URL, authToken, selectedOrg]);

  /* ── Derived ── */
  const attendanceRate = data.totalWorkforce ? ((data.presentWorkforce / data.totalWorkforce) * 100).toFixed(1) : 0;
  const isPositive = parseFloat(salaryData.percentageChange) >= 0;
  const todayStr = moment().format("dddd, MMMM D, YYYY");

  const tabs = [
    { key: "leaves", label: "Leaves", icon: AlertCircle, count: pendingLeaves.length },
    { key: "retirements", label: "Retire", icon: LogOut, count: null },
    { key: "birthdays", label: "Birthdays", icon: Gift, count: upcomingBirthdays.length },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/60 p-6">

      {/* ── Background Orbs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-cyan-100/20 rounded-full blur-3xl" />
      </div>

      {/* ── TOPBAR ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <Sparkles size={16} className="text-white" />
            </div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-500 bg-clip-text text-transparent tracking-tight">
              HR Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2 ml-12">
            <Calendar size={12} className="text-slate-400" />
            <p className="text-xs text-slate-400 font-medium">{todayStr}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          

        

          {/* Org selector */}
          <div className="relative" ref={orgRef}>
            <button
              onClick={() => setOrgOpen(v => !v)}
              className="flex items-center gap-2 bg-white border border-blue-100 rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-sm font-bold text-slate-700"
            >
              <Building2 size={14} className="text-blue-500 shrink-0" />
              <span className="max-w-[140px] truncate">{selectedOrgName}</span>
              <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 shrink-0 ${orgOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {orgOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 bg-white border border-blue-100 rounded-2xl shadow-2xl shadow-blue-100 py-2 z-50"
                >
                  {organizations.map(org => (
                    <button key={org.id} onClick={() => { setSelectedOrg(org.id); setOrgOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold hover:bg-blue-50 transition-colors ${org.id === selectedOrg ? "text-blue-600" : "text-slate-700"}`}>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${org.id === selectedOrg ? "bg-blue-500" : "bg-slate-200"}`} />
                      {org.organization_name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Workforce" value={data.totalWorkforce} total={data.totalWorkforce} pctLabel="Active employees" icon={Users} gradient="bg-gradient-to-br from-blue-500 to-indigo-600" ring="#6366f1" delay={0} />
        <StatCard label="Present Today" value={data.presentWorkforce} total={data.totalWorkforce} pctLabel={`${attendanceRate}% attendance rate`} icon={UserCheck} gradient="bg-gradient-to-br from-emerald-400 to-teal-600" ring="#10b981" delay={0.08} />
        <StatCard label="Absent Today" value={data.absentWorkforce} total={data.totalWorkforce} pctLabel={`Incl. ${data.inLeave} on leave`} icon={UserX} gradient="bg-gradient-to-br from-red-400 to-rose-600" ring="#ef4444" delay={0.16} />
        <StatCard label="Late Arrivals" value={data.lateArrivals} total={data.totalWorkforce} pctLabel="Today's count" icon={Clock} gradient="bg-gradient-to-br from-amber-400 to-orange-500" ring="#f97316" delay={0.24} />
      </div>

      {/* ── SALARY + DEPARTMENT ── */}
      <div className="grid grid-cols-3 gap-4 mb-4">

        {/* Salary Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="col-span-2 bg-white rounded-2xl p-6 shadow-[0_4px_24px_rgba(59,130,246,0.07)] border border-blue-50 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-base font-black text-slate-800">Monthly Salary Overview</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Total payroll expenses</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-slate-800">
                LKR {parseFloat(salaryData.total).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <div className={`inline-flex items-center gap-1 mt-1.5 px-3 py-1 rounded-full text-xs font-black ${isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {salaryData.percentageChange}
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={salaryData.monthlyTrend} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="salLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={v => `${(v/1000000).toFixed(1)}M`} />
              <Tooltip content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-white border border-blue-100 rounded-2xl px-4 py-3 shadow-2xl">
                    <p className="text-xs text-slate-400 font-semibold mb-1">{label}</p>
                    <p className="text-sm font-black text-blue-600">LKR {payload[0]?.value?.toLocaleString()}</p>
                  </div>
                );
              }} />
              <Area type="monotone" dataKey="amount" stroke="url(#salLine)" strokeWidth={2.5} fill="url(#salFill)"
                dot={{ fill: "#3b82f6", r: 3.5, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2.5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Department Pie */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl p-6 shadow-[0_4px_24px_rgba(59,130,246,0.07)] border border-blue-50 flex flex-col">
          <p className="text-base font-black text-slate-800 mb-0.5">Department Distribution</p>
          <p className="text-xs text-slate-400 font-medium mb-2">Employee count by team</p>
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie activeIndex={activePieIndex} activeShape={renderActiveShape}
                data={departmentData} cx="50%" cy="50%" innerRadius={50} outerRadius={70}
                paddingAngle={3} dataKey="value"
                onMouseEnter={(_, i) => setActivePieIndex(i)}
                animationBegin={200} animationDuration={900}>
                {departmentData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} style={{ cursor: "pointer", filter: i === activePieIndex ? `drop-shadow(0 0 6px ${entry.color}88)` : "none" }} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v} Employees`, n]} contentStyle={{ borderRadius: 14, border: "1px solid #e2e8f0", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-1 space-y-1 overflow-y-auto max-h-24 pr-1">
            {departmentData.map((d, i) => (
              <div key={i} onMouseEnter={() => setActivePieIndex(i)}
                className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors group">
                <div className="w-2.5 h-2.5 rounded-full shrink-0 group-hover:scale-125 transition-transform" style={{ backgroundColor: d.color }} />
                <span className="text-xs font-semibold text-slate-600 truncate flex-1">{d.name}</span>
                <span className="text-xs font-black text-slate-400">{d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── ATTENDANCE + NOTIFICATIONS ── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="col-span-2 bg-white rounded-2xl p-6 shadow-[0_4px_24px_rgba(59,130,246,0.07)] border border-blue-50">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-base font-black text-slate-800">Weekly Attendance Trends</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Last 5 days overview</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-gradient-to-br from-emerald-400 to-teal-500 inline-block" />Present
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-gradient-to-br from-red-400 to-rose-500 inline-block" />Absent
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={attendanceHistory} barGap={4} barCategoryGap="28%" margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="presentG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="absentG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f87171" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip cursor={{ fill: "rgba(59,130,246,0.04)", radius: 8 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-white border border-blue-100 rounded-2xl px-4 py-3 shadow-2xl">
                      <p className="text-xs text-slate-400 font-bold mb-2">{label}</p>
                      {payload.map((p, i) => (
                        <p key={i} className="text-sm font-black capitalize" style={{ color: p.dataKey === "present" ? "#10b981" : "#ef4444" }}>
                          {p.dataKey}: {p.value}
                        </p>
                      ))}
                    </div>
                  );
                }} />
              <Bar dataKey="present" fill="url(#presentG)" shape={<RoundedBar />} maxBarSize={32} />
              <Bar dataKey="absent" fill="url(#absentG)" shape={<RoundedBar />} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="bg-white rounded-2xl p-5 shadow-[0_4px_24px_rgba(59,130,246,0.07)] border border-blue-50 flex flex-col">

          {/* Tab Bar */}
          <div className="flex bg-slate-50 rounded-xl p-1 gap-1 mb-4 shrink-0">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  activeTab === t.key
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-200/50"
                    : "text-slate-500 hover:text-slate-700 hover:bg-white"
                }`}>
                <t.icon size={11} />
                {t.label}
                {t.count !== null && t.count > 0 && (
                  <span className={`text-[10px] font-black px-1.5 rounded-full ${activeTab === t.key ? "bg-white/25 text-white" : "bg-slate-200 text-slate-500"}`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto space-y-0.5 pr-0.5 max-h-64" style={{ scrollbarWidth: "thin", scrollbarColor: "#e2e8f0 transparent" }}>
            <AnimatePresence mode="wait">
              {activeTab === "leaves" && (
                <motion.div key="leaves" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {pendingLeaves.length === 0
                    ? <p className="text-center text-slate-400 text-xs py-8 italic">No pending leave requests</p>
                    : pendingLeaves.slice(0, 6).map((l, i) => (
                      <NotifItem key={i} delay={i * 0.04} name={l.employee_fullname} sub={`${l.employee_no} · ${l.days}`}
                        badge="Pending" badgeColor="bg-orange-50 text-orange-500" avatarGrad="bg-gradient-to-br from-blue-500 to-indigo-600" />
                    ))}
                </motion.div>
              )}
              {activeTab === "retirements" && (
                <motion.div key="retirements" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {upcomingRetirements.length === 0 || upcomingRetirements[0]?.noDataMessage
                    ? <p className="text-center text-slate-400 text-xs py-8 italic">{upcomingRetirements[0]?.noDataMessage || "No upcoming retirements"}</p>
                    : upcomingRetirements.map((r, i) => (
                      <NotifItem key={i} delay={i * 0.04} name={r.name} sub={r.retirementDate}
                        badge={r.message} badgeColor="bg-purple-50 text-purple-600" avatarGrad="bg-gradient-to-br from-purple-500 to-violet-600" />
                    ))}
                </motion.div>
              )}
              {activeTab === "birthdays" && (
                <motion.div key="birthdays" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {upcomingBirthdays.length === 0
                    ? <p className="text-center text-slate-400 text-xs py-8 italic">No upcoming birthdays</p>
                    : upcomingBirthdays.map((b, i) => (
                      <NotifItem key={i} delay={i * 0.04} name={b.name} sub={b.birthday}
                        badge={b.label} badgeColor="bg-pink-50 text-pink-500" avatarGrad="bg-gradient-to-br from-pink-500 to-rose-600" />
                    ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
};

export default Dashboard;