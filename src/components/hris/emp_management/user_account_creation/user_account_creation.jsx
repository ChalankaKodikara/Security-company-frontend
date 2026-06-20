/** @format */

import React, { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import Select from "react-select";
import { apiFetch } from "../../../../utils/apiClient";

const API_URL = process.env.REACT_APP_FRONTEND_URL;
const API_URL_MASTER = process.env.REACT_APP_FRONTEND_URL_MASTER;

// ── Icons ─────────────────────────────────────────────────────────────────────
const IUsers = () => (
  <svg width={24} height={24} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
  </svg>
);
const ISearch = () => (
  <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <circle cx={11} cy={11} r={8} /><line x1={21} y1={21} x2={16.65} y2={16.65} />
  </svg>
);
const IFilter = () => (
  <svg width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);
const IUserPlus = () => (
  <svg width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx={9} cy={7} r={4} />
    <line x1={19} y1={8} x2={19} y2={14} /><line x1={16} y1={11} x2={22} y2={11} />
  </svg>
);
const IEdit = () => (
  <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IClose = () => (
  <svg width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <line x1={18} y1={6} x2={6} y2={18} /><line x1={6} y1={6} x2={18} y2={18} />
  </svg>
);
const IChevron = () => (
  <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const ISpinner = () => (
  <svg width={16} height={16} className="animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={4} />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────
const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const AVATAR_COLORS = [
  "from-blue-500 to-blue-700",
  "from-purple-500 to-purple-700",
  "from-emerald-500 to-emerald-700",
  "from-pink-500 to-pink-700",
  "from-amber-500 to-amber-700",
  "from-teal-500 to-teal-700",
  "from-indigo-500 to-indigo-700",
];

const avatarColor = (seed = "") => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const activeBadgeCls  = (val) => val === 1 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600";
const statusBadgeCls  = (s) => {
  switch (s?.toLowerCase()) {
    case "active":   return "bg-emerald-100 text-emerald-700";
    case "resigned": return "bg-orange-100 text-orange-600";
    default:         return "bg-gray-100 text-gray-500";
  }
};
const employmentBadgeCls = (e) =>
  e?.toLowerCase() === "yes" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500";

// ── Toggle Component ──────────────────────────────────────────────────────────
function Toggle({ checked, onChange, labelOn = "Active", labelOff = "Inactive", colorOn = "bg-emerald-500", colorOff = "bg-gray-300" }) {
  return (
    <div className="flex items-center justify-between bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3">
      <div>
        <p className={`text-sm font-semibold ${checked ? "text-emerald-600" : "text-orange-500"}`}>
          {checked ? labelOn : labelOff}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">Toggle to change</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none shadow-inner ${checked ? colorOn : colorOff}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${checked ? "translate-x-8" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

// ── EmployeeSelect — searchable dropdown ─────────────────────────────────────
function EmployeeSelect({ value, onChange }) {
  const [query, setQuery]     = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const [selected, setSelected] = useState(null);
  const inputRef = useRef(null);
  const wrapRef  = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!open) return;
      try {
        setLoading(true);
        const params = new URLSearchParams({ search: query, page: 1, pageSize: 20 });
        const res  = await apiFetch(`${API_URL}/v1/hris/employees/employee/all-details?${params}`);
        const data = await res.json();
        if (data?.success && Array.isArray(data.data)) setOptions(data.data);
        else setOptions([]);
      } catch { setOptions([]); }
      finally { setLoading(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [query, open]);

  const handleSelect = (emp) => {
    setSelected(emp);
    onChange(emp.employee_no);
    setOpen(false);
    setQuery("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelected(null);
    onChange("");
    setQuery("");
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <div
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm flex items-center justify-between cursor-pointer transition-all bg-white ${open ? "border-blue-500 ring-4 ring-blue-100" : "border-gray-200"}`}
      >
        {selected ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-gray-800 shrink-0">{selected.employee_no}</span>
            <span className="text-gray-400 text-xs truncate">— {selected.employee_fullname}</span>
          </div>
        ) : (
          <span className="text-gray-400">{value || "Search employee…"}</span>
        )}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {selected && (
            <button onClick={handleClear} className="text-gray-400 hover:text-gray-600 p-0.5 rounded">
              <IClose />
            </button>
          )}
          <span className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}><IChevron /></span>
        </div>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border-2 border-blue-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><ISearch /></span>
              <input
                ref={inputRef}
                className="w-full pl-9 pr-4 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                placeholder="Type name or employee no…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-gray-400 text-sm"><ISpinner /> Searching…</div>
            ) : options.length ? options.map(emp => (
              <div
                key={emp.id}
                onClick={() => handleSelect(emp)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 ${value === emp.employee_no ? "bg-blue-50" : ""}`}
              >
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColor(emp.employee_fullname || emp.employee_no)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {getInitials(emp.employee_fullname || emp.employee_no)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 text-sm leading-tight">{emp.employee_fullname}</p>
                  <p className="text-xs text-gray-400">{emp.employee_no} · {emp.designation_name || ""}</p>
                </div>
                {value === emp.employee_no && (
                  <svg className="ml-auto text-blue-500 shrink-0" width={16} height={16} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.172l7.879-7.879a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            )) : (
              <div className="py-6 text-center text-gray-400 text-sm">No employees found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared Modal Shell ────────────────────────────────────────────────────────
function ModalShell({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-5 rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3 text-white">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <IUserPlus />
            </div>
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <button onClick={onClose} className="text-white p-1.5 rounded-lg hover:bg-white/20 transition-all">
            <IClose />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ViewUserManagement() {
  const inp = "w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all bg-white";
  const labelCls = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5";

  // ── Table state ──
  const [users, setUsers]                   = useState([]);
  const [page, setPage]                     = useState(1);
  const [limit, setLimit]                   = useState(10);
  const [total, setTotal]                   = useState(0);
  const [totalPages, setTotalPages]         = useState(1);
  const [search, setSearch]                 = useState("");
  const [employeeStatus, setEmployeeStatus] = useState("");
  const [loading, setLoading]               = useState(false);

  // ── Shared ──
  const [roles, setRoles]           = useState([]);
  const [systemUsers, setSystemUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [toast, setToast]           = useState(null);

  // ── Add modal ──
  const BLANK_FORM = { employee_no: "", username: "", employment: "Yes", employee_status: true, user_role: "" };
  const [showAdd, setShowAdd]       = useState(false);
  const [addForm, setAddForm]       = useState(BLANK_FORM);
  const [submitting, setSubmitting] = useState(false);
  const hfAdd = (k, v) => setAddForm(p => ({ ...p, [k]: v }));

  // ── Edit modal ──
  const BLANK_EDIT = { employee_no: "", username: "", employment: "Yes", employee_status: true, user_role: "", is_active: true };
  const [showEdit, setShowEdit]     = useState(false);
  const [editForm, setEditForm]     = useState(BLANK_EDIT);
  const [editTarget, setEditTarget] = useState(null);
  const [updating, setUpdating]     = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const hfEdit = (k, v) => setEditForm(p => ({ ...p, [k]: v }));

  // ── Toast ──
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch roles ──
  useEffect(() => {
    (async () => {
      try {
        const res  = await apiFetch(`${API_URL}/v1/hris/user/roles`);
        const data = await res.json();
        if (Array.isArray(data)) setRoles(data);
        else if (data?.success && Array.isArray(data.data)) setRoles(data.data);
        else setRoles([]);
      } catch { setRoles([]); }
    })();
  }, []);

  // ── Fetch system users (username dropdown) when a modal opens ──
  const fetchSystemUsers = async () => {
    try {
      const systemId = Cookies.get("system_id");
      if (!systemId) return;
      setLoadingUsers(true);
      const res  = await apiFetch(`${API_URL_MASTER}/api/systems/${systemId}/users`);
      const data = await res.json();
      if (res.ok && data?.success && data?.message?.users) {
        setSystemUsers(
          data.message.users
            .filter(u => u.username)
            .map(u => ({ value: u.username, label: `${u.full_name} (${u.username})` }))
        );
      } else setSystemUsers([]);
    } catch { setSystemUsers([]); }
    finally { setLoadingUsers(false); }
  };

  useEffect(() => { if (showAdd || showEdit) fetchSystemUsers(); }, [showAdd, showEdit]);

  // ── Fetch table users ──
  const fetchUsers = async ({ toPage = page, toLimit = limit } = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: toPage, limit: toLimit, search, is_active: 1, employee_status: employeeStatus });
      const res  = await apiFetch(`${API_URL}/v1/hris/user/users?${params}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setPage(toPage);
      } else setUsers([]);
    } catch { setUsers([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSearch     = () => fetchUsers({ toPage: 1, toLimit: limit });
  const handlePageChange = (p) => fetchUsers({ toPage: p, toLimit: limit });
  const handleLimitChange = (val) => { const n = Number(val); setLimit(n); setPage(1); fetchUsers({ toPage: 1, toLimit: n }); };
  const handleReset      = () => { setSearch(""); setEmployeeStatus(""); setLimit(10); setPage(1); setTimeout(() => fetchUsers({ toPage: 1, toLimit: 10 }), 0); };

  // ── Open edit modal — fetch full data from API using id ──
  const openEdit = async (u) => {
    setEditTarget(u);
    setShowEdit(true);
    setEditLoading(true);
    try {
      const res  = await apiFetch(`${API_URL}/v1/hris/user/${u.id}`);
      const data = await res.json();
      if (res.ok && data?.success && data?.data) {
        const d = data.data;
        setEditForm({
          employee_no:     d.employee_no     || "",
          username:        d.username        || "",
          employment:      d.employment      || "Yes",
          employee_status: d.employee_status?.toLowerCase() === "active",
          user_role:       d.user_role       || "",
          is_active:       d.is_active === 1,
        });
      } else {
        showToast("Failed to load user details", "error");
        setShowEdit(false);
      }
    } catch {
      showToast("Error fetching user details", "error");
      setShowEdit(false);
    } finally {
      setEditLoading(false);
    }
  };

  // ── Submit Add ──
  const submitAdd = async () => {
    if (!addForm.employee_no || !addForm.username) {
      showToast("Please fill in all required fields", "error"); return;
    }
    try {
      setSubmitting(true);
      const payload = {
        employee_no:     addForm.employee_no,
        username:        addForm.username,
        employment:      addForm.employment,
        employee_status: addForm.employee_status ? "Active" : "Resigned",
        user_role:       addForm.user_role ? Number(addForm.user_role) : null,
        is_active:       1,
      };
      const res  = await apiFetch(`${API_URL}/v1/hris/user/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || "Failed to add user");
      showToast("User added successfully");
      setShowAdd(false);
      setAddForm(BLANK_FORM);
      fetchUsers({ toPage: 1, toLimit: limit });
    } catch (e) { showToast(e.message || "Something went wrong", "error"); }
    finally { setSubmitting(false); }
  };

  // ── Submit Edit ──
  const submitEdit = async () => {
    if (!editForm.employee_no || !editForm.username) {
      showToast("Please fill in all required fields", "error"); return;
    }
    try {
      setUpdating(true);
      const payload = {
        employee_no:     editForm.employee_no,
        username:        editForm.username,
        employment:      editForm.employment,
        employee_status: editForm.employee_status ? "Active" : "Resigned",
        user_role:       editForm.user_role ? Number(editForm.user_role) : null,
        is_active:       editForm.is_active ? 1 : 0,
      };
      const res  = await apiFetch(`${API_URL}/v1/hris/user/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || "Failed to update user");
      showToast("User updated successfully");
      setShowEdit(false);
      setEditForm(BLANK_EDIT);
      fetchUsers({ toPage: page, toLimit: limit });
    } catch (e) { showToast(e.message || "Something went wrong", "error"); }
    finally { setUpdating(false); }
  };

  const pageNums = (() => {
    let s = Math.max(1, page - 2);
    let e = Math.min(totalPages, s + 4);
    s = Math.max(1, e - 4);
    return Array.from({ length: e - s + 1 }, (_, i) => s + i);
  })();

  const TABLE_COLS = ["Employee No", "Full Name", "Calling Name", "Username", "Status", "Active", "Employment", "EPF No", "Action"];

  const selectStyles = {
    control: (base) => ({
      ...base,
      borderRadius: "12px",
      borderWidth: "2px",
      minHeight: "42px",
      borderColor: "#e5e7eb",
      boxShadow: "none",
      fontSize: "14px",
      "&:hover": { borderColor: "#3b82f6" },
    }),
    menu: (base) => ({ ...base, borderRadius: "12px", overflow: "hidden", zIndex: 9999 }),
  };

  // ── Shared form fields (used in both modals) ──
  const FormFields = ({ form, hf, systemUsers, loadingUsers, roles, inp, labelCls, isEdit = false }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

      {/* Employee No */}
      <div>
        <label className={labelCls}>Employee No <span className="text-red-500">*</span></label>
        {isEdit ? (
          <input className={`${inp} bg-gray-50 text-gray-500`} value={form.employee_no} readOnly />
        ) : (
          <EmployeeSelect value={form.employee_no} onChange={v => hf("employee_no", v)} />
        )}
      </div>

      {/* Username */}
      <div>
        <label className={labelCls}>Username <span className="text-red-500">*</span></label>
        <Select
          options={systemUsers}
          isLoading={loadingUsers}
          placeholder="Select username…"
          value={systemUsers.find(opt => opt.value === form.username) || null}
          onChange={sel => hf("username", sel ? sel.value : "")}
          isClearable
          styles={selectStyles}
        />
      </div>

      {/* Employment */}
      <div>
        <label className={labelCls}>Employment</label>
        <select className={inp} value={form.employment} onChange={e => hf("employment", e.target.value)}>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>

      {/* User Role */}
      <div>
        <label className={labelCls}>User Role <span className="text-red-500"></span></label>
        <select className={inp} value={form.user_role} onChange={e => hf("user_role", e.target.value)}>
          <option value="">-- Select Role --</option>
          {roles.map(r => <option key={r.id} value={r.id}>{r.role_name}</option>)}
        </select>
      </div>

      {/* Employee Status toggle */}
      <div className={isEdit ? "" : "md:col-span-2"}>
        <label className={labelCls}>Employee Status</label>
        <Toggle
          checked={form.employee_status}
          onChange={v => hf("employee_status", v)}
          labelOn="Active"
          labelOff="Resigned"
          colorOn="bg-emerald-500"
          colorOff="bg-gray-300"
        />
      </div>

      {/* is_active toggle — edit only */}
      {isEdit && (
        <div>
          <label className={labelCls}>Is Active</label>
          <Toggle
            checked={form.is_active}
            onChange={v => hf("is_active", v)}
            labelOn="Active"
            labelOff="Inactive"
            colorOn="bg-blue-500"
            colorOff="bg-gray-300"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6 font-sans">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[9999] px-5 py-3 rounded-xl text-sm font-semibold shadow-lg border transition-all ${
          toast.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0">
          <IUsers />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
            User Management
          </h1>
          <p className="text-sm text-gray-500">Settings / User Management</p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 mb-6 shadow-xl flex items-center justify-between overflow-hidden relative">
        <div className="relative z-10">
          <p className="text-blue-100 text-sm mb-1">Total Users</p>
          <p className="text-4xl font-bold text-white">{total}</p>
        </div>
        <div className="text-white opacity-10 scale-[4] mr-8 pointer-events-none"><IUsers /></div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-2 font-semibold text-gray-800 mb-4"><IFilter /><span>Filters</span></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><ISearch /></span>
            <input className={`${inp} pl-10`} placeholder="Search name / username…" value={search}
              onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} />
          </div>
          <select className={inp} value={employeeStatus} onChange={e => setEmployeeStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Resigned">Resigned</option>
          </select>
          <select className={inp} value={limit} onChange={e => handleLimitChange(e.target.value)}>
            {[10, 20, 50].map(n => <option key={n} value={n}>Limit: {n}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={handleSearch} className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold shadow hover:opacity-90 transition-all">Search</button>
            <button onClick={handleReset} className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all">Reset</button>
          </div>
        </div>
      </div>

      {/* Add User Button */}
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg hover:opacity-90 transition-all">
          <IUserPlus /> Add User
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                {TABLE_COLS.map(h => (
                  <th key={h} className={`px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap ${h === "Action" ? "text-center" : "text-left"}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={TABLE_COLS.length} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                      <span className="text-sm text-gray-400">Loading users…</span>
                    </div>
                  </td>
                </tr>
              ) : users.length ? users.map((u, i) => (
                <tr key={u.id ?? i} className="border-b border-gray-50 hover:bg-blue-50 transition-colors">
                  <td className="px-5 py-4"><span className="font-semibold text-gray-800 text-sm">{u.employee_no || "—"}</span></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(u.employee_fullname || u.employee_no || "")} flex items-center justify-center text-white text-xs font-bold shrink-0 ring-2 ring-blue-400 ring-offset-1`}>
                        {getInitials(u.employee_fullname || u.employee_no || "")}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm leading-tight">{u.employee_fullname || "—"}</p>
                        <p className="text-xs text-gray-400 mt-0.5">ID: {u.employee_no}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{u.employee_calling_name || "—"}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{u.username || "—"}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeCls(u.employee_status)}`}>
                      {u.employee_status || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${activeBadgeCls(u.is_active)}`}>
                      {u.is_active === 1 ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${employmentBadgeCls(u.employment)}`}>
                      {u.employment || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{u.epf_no || "—"}</td>
                  {/* Action */}
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => openEdit(u)}
                      className="inline-flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-sm"
                    >
                      <IEdit /> Edit
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={TABLE_COLS.length} className="py-16 text-center text-gray-400 text-sm">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-5 gap-3">
        <span className="text-sm text-gray-500">
          {total > 0 ? `Showing ${(page - 1) * limit + 1}–${Math.min(page * limit, total)} of ${total} entries` : "No entries found"}
        </span>
        <div className="flex items-center gap-1.5">
          <button disabled={page === 1} onClick={() => handlePageChange(page - 1)}
            className="px-3.5 py-2 border-2 border-gray-200 rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 transition-all">Prev</button>
          {pageNums.map(n => (
            <button key={n} onClick={() => handlePageChange(n)}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${n === page ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md" : "border-2 border-gray-200 hover:bg-gray-50"}`}>
              {n}
            </button>
          ))}
          <button disabled={page === totalPages || totalPages === 0} onClick={() => handlePageChange(page + 1)}
            className="px-3.5 py-2 border-2 border-gray-200 rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 transition-all">Next</button>
        </div>
      </div>

      {/* ── Add User Modal ──────────────────────────────────────── */}
      {showAdd && (
        <ModalShell title="Add New User" onClose={() => { setShowAdd(false); setAddForm(BLANK_FORM); }}>
          <div className="p-6">
            <FormFields
              form={addForm} hf={hfAdd}
              systemUsers={systemUsers} loadingUsers={loadingUsers}
              roles={roles} inp={inp} labelCls={labelCls}
              isEdit={false}
            />
            <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-100">
              <button onClick={() => { setShowAdd(false); setAddForm(BLANK_FORM); }}
                className="px-6 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={submitAdd} disabled={submitting}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg hover:opacity-90 transition-all disabled:opacity-60">
                {submitting ? "Saving…" : "Add User"}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* ── Edit User Modal ─────────────────────────────────────── */}
      {showEdit && (
        <ModalShell title="Edit User" onClose={() => { setShowEdit(false); setEditForm(BLANK_EDIT); }}>
          <div className="p-6">
            {editLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-sm text-gray-400">Loading user details…</span>
              </div>
            ) : (
              <>
                <FormFields
                  form={editForm} hf={hfEdit}
                  systemUsers={systemUsers} loadingUsers={loadingUsers}
                  roles={roles} inp={inp} labelCls={labelCls}
                  isEdit={true}
                />
                <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-100">
                  <button onClick={() => { setShowEdit(false); setEditForm(BLANK_EDIT); }}
                    className="px-6 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all">Cancel</button>
                  <button onClick={submitEdit} disabled={updating}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg hover:opacity-90 transition-all disabled:opacity-60">
                    {updating ? "Saving…" : "Update User"}
                  </button>
                </div>
              </>
            )}
          </div>
        </ModalShell>
      )}
    </div>
  );
}