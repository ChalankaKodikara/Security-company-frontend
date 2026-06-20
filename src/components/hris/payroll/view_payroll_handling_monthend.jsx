import React, { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Download,
  Search,
  Calendar,
  Filter,
} from "lucide-react";
import { apiFetch } from "../../../utils/apiClient";
const getInitials = (fullName = "") => {
  const tokens = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return "??";
  if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
  return (tokens[0][0] + tokens[tokens.length - 1][0]).toUpperCase();
};

const avatarBgClass = (seed = "") => {
  const palette = [
    "from-blue-500 to-blue-600",
    "from-purple-500 to-purple-600",
    "from-emerald-500 to-emerald-600",
    "from-rose-500 to-rose-600",
    "from-amber-500 to-amber-600",
    "from-teal-500 to-teal-600",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++)
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
};

export default function ViewPayrollHandlingMonthend() {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  // Get YM from URL or default to current month
  const getInitialYM = () => {
    const params = new URLSearchParams(window.location.search);
    const ymParam = params.get("ym");
    if (ymParam) return ymParam;

    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  };

  const [ym, setYm] = useState(getInitialYM());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [expandedRow, setExpandedRow] = useState(null);
  const [currency, setCurrency] = useState(Cookies.get("currency") || "LKR");
  const [symbol, setSymbol] = useState(Cookies.get("symbol") || "Rs.");
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const searchParams = new URLSearchParams(window.location.search);
  const organization = searchParams.get("org_id");
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const [showConfirm, setShowConfirm] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null); // "FINAL" | "LOCKED"
  const payrollStatus = rows?.[0]?.payroll_status;
  useEffect(() => {
    setCurrency(Cookies.get("currency") || "LKR");
    setSymbol(Cookies.get("symbol") || "Rs.");
  }, []);

  const money = (v) => {
    if (v == null || v === "") return "—";
    const num = Number(v);
    if (!Number.isFinite(num)) return String(v);
    return `${symbol} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  useEffect(() => {
    if (!organization || !year || !month) {
      console.warn("Missing params", { organization, year, month });
      return;
    }

    const controller = new AbortController();

    const fetchData = async () => {
      setIsLoading(true);
      setFetchError("");

      try {
        const params = new URLSearchParams({
          year,
          month,
          organization,
          page,
          limit,
        });

        if (search.trim()) {
          params.set("search", search.trim());
        }

        console.log("Calling API with:", Object.fromEntries(params));

        const res = await apiFetch(
          `${API_URL}/v1/hris/payroll/genarated-payroll-by-month-and-year?${params.toString()}`,
          {
            credentials: "include",
            signal: controller.signal,
          },
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();

        setRows(Array.isArray(json.data) ? json.data : []);
        setTotalRecords(Number(json.totalRecords || 0));
        setTotalPages(Math.ceil((json.totalRecords || 0) / limit));
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error(e);
          setFetchError("Failed to load payroll data");
          setRows([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [API_URL, organization, year, month, page, limit, search]);

  // Categorize columns
  const customColumns = useMemo(() => {
    if (!rows || rows.length === 0)
      return { allowances: [], deductions: [], other: [] };

    const skip = new Set([
      "id",
      "organization_id",
      "month",
      "year",
      "employee_no",
      "employee_fullname",
      "employee_email",
      "employee_calling_name",
      "job_title",
      "organization_name",
      "organization_code",
      "generated_at",
      "basic_salary",
      "cola",
      "total_allowances",
      "total_deductions",
      "net_pay",
      "net_salary",
    ]);

    const allowances = [];
    const deductions = [];
    const other = [];

    Object.keys(rows[0]).forEach((key) => {
      if (skip.has(key)) return;

      const label = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      if (key.startsWith("allowance_")) {
        allowances.push({ key, label: label.replace("Allowance ", "") });
      } else if (key.startsWith("deduction_")) {
        deductions.push({ key, label: label.replace("Deduction ", "") });
      } else {
        other.push({ key, label });
      }
    });

    return { allowances, deductions, other };
  }, [rows]);

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams({ year, month });
      if (search.trim()) params.set("search", search.trim());

      const res = await apiFetch(
        `${API_URL}/v1/hris/payroll/genarated-payroll-by-month-and-year?${params.toString()}`,
        {
          credentials: "include",
        },
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const allRows = Array.isArray(json?.data) ? json.data : [];

      if (!allRows.length) {
        toast.warn("No data available to export");
        return;
      }

      // Build all columns
      const skip = new Set([
        "id",
        "organization_id",
        "month",
        "year",
        "organization_name",
        "organization_code",
        "generated_at",
        "employee_calling_name",
        "job_title",
      ]);

      const allColumns = [
        { key: "employee_no", label: "Employee No" },
        { key: "employee_fullname", label: "Employee Name" },
        { key: "employee_email", label: "Email" },
        { key: "basic_salary", label: "Basic Salary" },
        { key: "cola", label: "COLA" },
      ];

      // Add all other columns
      Object.keys(allRows[0]).forEach((key) => {
        if (
          !skip.has(key) &&
          ![
            "employee_no",
            "employee_fullname",
            "employee_email",
            "basic_salary",
            "cola",
            "total_allowances",
            "total_deductions",
            "net_pay",
            "net_salary",
          ].includes(key)
        ) {
          allColumns.push({
            key,
            label: key
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase()),
          });
        }
      });

      allColumns.push(
        { key: "total_allowances", label: "Total Allowances" },
        { key: "total_deductions", label: "Total Deductions" },
        { key: "net_pay", label: "Net Pay" },
      );

      // Create CSV
      const csvEscape = (val) => {
        const s = val == null ? "" : String(val);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };

      const toFixed2 = (v) => {
        if (v == null || v === "") return "";
        const num = Number(v);
        return Number.isFinite(num) ? num.toFixed(2) : String(v);
      };

      const headerLine = allColumns.map((c) => csvEscape(c.label)).join(",");
      const lines = allRows.map((r) =>
        allColumns.map((c) => csvEscape(toFixed2(r[c.key]))).join(","),
      );

      const csv = "\uFEFF" + [headerLine, ...lines].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const fileName = `payroll-${year}-${month}.csv`;

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(a.href);

      toast.success(`Exported ${allRows.length} records`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to export CSV");
    }
  };

  const handleReset = () => {
    const today = new Date();
    const defYM = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    setYm(defYM);
    setSearch("");
    setPage(1);
    setLimit(10);
  };

  const handleConfirmStatusUpdate = async () => {
    if (!selectedStatus) return;

    setUpdating(true);

    try {
      const payload = {
        organization_id: Number(organization),
        month: Number(month),
        year: Number(year),
        payroll_status: selectedStatus, // "FINAL" or "LOCKED"
      };

      const res = await apiFetch(
        `${API_URL}/v1/hris/payroll/payroll-status-update`,
        {
          method: "PUT",
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) throw new Error();

      toast.success(`Payroll ${selectedStatus} successfully`);
      setShowConfirm(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update payroll status");
    } finally {
      setUpdating(false);
    }
  };
  const handleConfirmDelete = async () => {
    setDeleting(true);

    try {
      const payload = {
        organization_id: Number(organization),
        month: String(month).padStart(2, "0"), // backend expects "01"
        year: String(year),
      };

      console.log("Deleting payroll with payload:", payload);

      const res = await apiFetch(`${API_URL}/v1/hris/payroll/delete-payroll`, {
        method: "DELETE",
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();

      toast.success(json.message || "Payroll deleted successfully");

      setRows([]);
      setTotalRecords(0);
      setTotalPages(1);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete payroll");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Payroll Overview</h1>

        <div className="flex items-center justify-end gap-8 mb-2">
          <button
            onClick={handleExportCSV}
            disabled={isLoading || rows.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          <div className="relative">
            {payrollStatus !== "LOCKED" && (
              <button
                onClick={() => setShowStatusDropdown((prev) => !prev)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                Payroll Status
                <ChevronDown className="w-4 h-4" />
              </button>
            )}

            {showStatusDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                {/* DRAFT → Show FINAL */}
                {payrollStatus === "DRAFT" && (
                  <button
                    onClick={() => {
                      setSelectedStatus("FINAL");
                      setShowStatusDropdown(false);
                      setShowConfirm(true);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Final
                  </button>
                )}

                {/* FINAL → Show LOCK */}
                {payrollStatus === "FINAL" && (
                  <button
                    onClick={() => {
                      setSelectedStatus("LOCKED");
                      setShowStatusDropdown(false);
                      setShowConfirm(true);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Lock
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete Payroll
          </button>
        </div>
      </div>
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-md border border-gray-200 p-5 mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Month & Year
            </label>
            <input
              type="month"
              value={ym}
              onChange={(e) => {
                setYm(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Search Employee
            </label>
            <input
              type="text"
              placeholder="Name, No, or Email"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Items per page
            </label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleReset}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </motion.div>

      {/* Employee Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-3"
      >
        {isLoading ? (
          <div className="bg-white rounded-xl p-10 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"
            />
            <p className="text-gray-600 mt-4">Loading payroll data...</p>
          </div>
        ) : fetchError ? (
          <div className="bg-white rounded-xl p-10 text-center text-red-600">
            {fetchError}
          </div>
        ) : rows.length > 0 ? (
          rows.map((row, index) => (
            <motion.div
              key={row.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Summary Row */}
              <div
                onClick={() =>
                  setExpandedRow(expandedRow === row.id ? null : row.id)
                }
                className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Avatar */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg bg-gradient-to-br ${avatarBgClass(row.employee_fullname || row.employee_no)}`}
                    >
                      {getInitials(row.employee_fullname || row.employee_no)}
                    </div>

                    {/* Employee Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {row.employee_fullname || "—"}
                        </h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                          {row.employee_no}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {row.employee_email || "—"}
                      </p>
                    </div>

                    {/* Key Amounts */}
                    <div className="hidden md:flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Basic Salary</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {money(row.basic_salary)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Allowances</p>
                        <p className="text-sm font-semibold text-emerald-600">
                          {money(row.total_allowances)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Deductions</p>
                        <p className="text-sm font-semibold text-red-600">
                          {money(row.total_deductions)}
                        </p>
                      </div>
                      <div className="text-right bg-blue-50 px-4 py-2 rounded-lg">
                        <p className="text-xs text-blue-600 font-medium">
                          Net Pay
                        </p>
                        <p className="text-lg font-bold text-blue-700">
                          {money(row.net_pay || row.net_salary)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expand Icon */}
                  <div className="ml-4">
                    {expandedRow === row.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Mobile view */}
                <div className="md:hidden mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Basic</p>
                    <p className="text-sm font-semibold">
                      {money(row.basic_salary)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Net Pay</p>
                    <p className="text-sm font-bold text-blue-700">
                      {money(row.net_pay || row.net_salary)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedRow === row.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-200 bg-gray-50"
                  >
                    <div className="p-5 space-y-4">
                      {/* Basic Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Basic Salary
                          </p>
                          <p className="font-semibold text-gray-800">
                            {money(row.basic_salary)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">COLA</p>
                          <p className="font-semibold text-gray-800">
                            {money(row.cola)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Total Allowances
                          </p>
                          <p className="font-semibold text-emerald-600">
                            {money(row.total_allowances)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Total Deductions
                          </p>
                          <p className="font-semibold text-red-600">
                            {money(row.total_deductions)}
                          </p>
                        </div>
                      </div>

                      {/* Allowances */}
                      {customColumns.allowances.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <div className="w-1 h-4 bg-emerald-500 rounded"></div>
                            Allowances Breakdown
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {customColumns.allowances.map((col) => (
                              <div
                                key={col.key}
                                className="bg-white p-3 rounded-lg border border-emerald-100"
                              >
                                <p className="text-xs text-gray-500 mb-1">
                                  {col.label}
                                </p>
                                <p className="font-semibold text-emerald-700">
                                  {money(row[col.key])}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Deductions */}
                      {customColumns.deductions.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <div className="w-1 h-4 bg-red-500 rounded"></div>
                            Deductions Breakdown
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {customColumns.deductions.map((col) => (
                              <div
                                key={col.key}
                                className="bg-white p-3 rounded-lg border border-red-100"
                              >
                                <p className="text-xs text-gray-500 mb-1">
                                  {col.label}
                                </p>
                                <p className="font-semibold text-red-700">
                                  {money(row[col.key])}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Other Fields */}
                      {customColumns.other.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <div className="w-1 h-4 bg-blue-500 rounded"></div>
                            Other Details
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {customColumns.other.map((col) => (
                              <div
                                key={col.key}
                                className="bg-white p-3 rounded-lg border border-blue-100"
                              >
                                <p className="text-xs text-gray-500 mb-1">
                                  {col.label}
                                </p>
                                <p className="font-semibold text-blue-700">
                                  {money(row[col.key])}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Net Pay Summary */}
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Final Net Pay
                          </span>
                          <span className="text-2xl font-bold">
                            {money(row.net_pay || row.net_salary)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        ) : (
          <div className="bg-white rounded-xl p-10 text-center">
            <div className="text-gray-400 text-4xl mb-3">📋</div>
            <p className="text-gray-600">No payroll records found</p>
            <p className="text-sm text-gray-500 mt-2">
              Try adjusting your filters
            </p>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {!isLoading && rows.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 bg-white rounded-xl shadow-md border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing{" "}
              <strong>
                {(page - 1) * limit + 1}–{Math.min(page * limit, totalRecords)}
              </strong>{" "}
              of <strong>{totalRecords}</strong>
            </div>

            <div className="flex items-center gap-3">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">
                {page} / {totalPages}
              </div>

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl w-[420px] p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Confirm {selectedStatus === "FINAL" ? "Finalization" : "Lock"}
            </h3>

            <p className="text-gray-600 mb-5">
              Are you sure you want to mark payroll as{" "}
              <span className="font-semibold">{selectedStatus}</span> for{" "}
              <span className="font-semibold">
                {new Date(year, Number(month) - 1).toLocaleString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              ?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                disabled={updating}
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmStatusUpdate}
                disabled={updating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {updating ? "Updating..." : "Yes"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl w-[420px] p-6"
          >
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Delete Payroll
            </h3>

            <p className="text-gray-700 mb-4">
              This will permanently delete payroll records for{" "}
              <span className="font-semibold">
                {new Date(year, Number(month) - 1).toLocaleString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              .
            </p>

            <p className="text-sm text-red-500 mb-5">
              ⚠️ This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
