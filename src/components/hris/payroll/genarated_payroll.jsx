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
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return palette[hash % palette.length];
};

export default function ModernPayrollView() {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  const getInitialYM = () => {
    const params = new URLSearchParams(window.location.search);
    const ymParam = params.get("ym");

    if (ymParam) return ymParam;

    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0",
    )}`;
  };

  const [ym, setYm] = useState(getInitialYM());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [expandedRow, setExpandedRow] = useState(null);

  const [year, month] = useMemo(() => {
    const [y, m] = ym.split("-");
    return [y, m?.padStart(2, "0")];
  }, [ym]);

  const [symbol, setSymbol] = useState(Cookies.get("symbol") || "Rs.");

  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    setSymbol(Cookies.get("symbol") || "Rs.");
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("ym", ym);
    if (search) params.set("search", search);
    params.set("page", String(page));
    params.set("limit", String(limit));

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  }, [ym, search, page, limit]);

  const money = (v) => {
    if (v == null || v === "") return "—";
    const num = Number(v);
    if (!Number.isFinite(num)) return String(v);

    return `${symbol} ${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  useEffect(() => {
    if (!year || !month) return;

    const controller = new AbortController();

    const fetchData = async () => {
      setIsLoading(true);
      setFetchError("");

      try {
        const params = new URLSearchParams({
          year,
          month,
          page,
          limit,
          payroll_type: "SECURITY",
        });

        if (search.trim()) {
          params.set("search", search.trim());
        }

        const res = await apiFetch(
          `${API_URL}/v1/hris/payroll/genarated-payroll-by-month-and-year?${params.toString()}`,
          {
            credentials: "include",
            signal: controller.signal,
          },
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const data = Array.isArray(json?.data) ? json.data : [];

        setRows(data);
        setTotalPages(Number(json?.totalPages) || 1);
        setTotalRecords(Number(json?.totalRecords) || data.length || 0);

        if (Number(json?.currentPage) && json.currentPage !== page) {
          setPage(json.currentPage);
        }
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error(e);
          setFetchError("Failed to load payroll data");
          setRows([]);
          toast.error("Failed to load payroll data");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => controller.abort();
  }, [API_URL, year, month, search, page, limit]);

  const customColumns = useMemo(() => {
    if (!rows || rows.length === 0) {
      return { allowances: [], deductions: [], other: [] };
    }

    const skip = new Set([
      "id",
      "organization_id",
      "month",
      "year",
      "employee_no",
      "employee_table_no",
      "employee_fullname",
      "employee_email",
      "employee_calling_name",
      "job_title",
      "organization_name",
      "organization_code",
      "generated_at",
      "basic_salary",
      "payable_basic_salary",
      "completed_shifts",
      "extra_shift_pay",
      "overtime_pay",
      "cola",
      "total_allowances",
      "total_deductions",
      "gross_pay",
      "total_earnings",
      "net_pay",
      "net_salary",
      "epf_8",
      "epf_12",
      "etf_3",
      "payroll_type",
      "payroll_status",
      "employee_category",
      "payroll_scheme",
      "payroll_location_type",
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

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams({
        year,
        month,
        payroll_type: "SECURITY",
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

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
        "employee_table_no",
      ]);

      const allColumns = [
        { key: "employee_no", label: "Employee No" },
        { key: "employee_fullname", label: "Employee Name" },
        { key: "employee_email", label: "Email" },
        { key: "employee_category", label: "Category" },
        { key: "payroll_type", label: "Payroll Type" },
        { key: "completed_shifts", label: "Completed Shifts" },
        { key: "payable_basic_salary", label: "Shift Pay" },
        { key: "overtime_pay", label: "OT Pay" },
        { key: "extra_shift_pay", label: "Extra Shift Pay" },
        { key: "basic_salary", label: "Basic Salary" },
        { key: "gross_pay", label: "Gross Pay" },
      ];

      Object.keys(allRows[0]).forEach((key) => {
        if (
          !skip.has(key) &&
          !allColumns.some((c) => c.key === key) &&
          ![
            "total_allowances",
            "total_deductions",
            "total_earnings",
            "net_pay",
            "net_salary",
            "epf_8",
            "epf_12",
            "etf_3",
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
        { key: "epf_8", label: "EPF 8%" },
        { key: "epf_12", label: "EPF 12%" },
        { key: "etf_3", label: "ETF 3%" },
        { key: "total_earnings", label: "Total Earnings" },
        { key: "net_pay", label: "Net Pay" },
      );

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
      const fileName = `security-payroll-${year}-${month}.csv`;

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
    const defYM = `${today.getFullYear()}-${String(
      today.getMonth() + 1,
    ).padStart(2, "0")}`;

    setYm(defYM);
    setSearch("");
    setPage(1);
    setLimit(10);
  };

  const securityCardItems = (row) => [
    {
      label: "Completed Shifts",
      value: row.completed_shifts ?? "0",
      className: "text-indigo-600",
    },
    {
      label: "Shift Pay",
      value: money(row.payable_basic_salary || row.basic_salary),
      className: "text-blue-700",
    },
    {
      label: "OT Pay",
      value: money(row.overtime_pay),
      className: "text-emerald-700",
    },
    {
      label: "Net Pay",
      value: money(row.net_pay || row.net_salary),
      className: "text-blue-700 text-lg",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Security Payroll Overview
            </h1>
            <p className="text-gray-600 mt-1">
              {new Date(year, month - 1).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={isLoading || rows.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

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
              transition={{ delay: index * 0.03 }}
              className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div
                onClick={() =>
                  setExpandedRow(expandedRow === row.id ? null : row.id)
                }
                className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg bg-gradient-to-br ${avatarBgClass(
                        row.employee_fullname || row.employee_no,
                      )}`}
                    >
                      {getInitials(row.employee_fullname || row.employee_no)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {row.employee_fullname || "—"}
                        </h3>

                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                          {row.employee_no}
                        </span>

                        {row.employee_category && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                            {row.employee_category}
                          </span>
                        )}

                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded">
                          SECURITY
                        </span>
                      </div>

                      <p className="text-sm text-gray-500">
                        {row.employee_email || "—"}
                      </p>
                    </div>

                    <div className="hidden xl:flex items-center gap-5">
                      {securityCardItems(row).map((item) => (
                        <div key={item.label} className="text-right">
                          <p className="text-xs text-gray-500">{item.label}</p>
                          <p
                            className={`text-sm font-semibold ${item.className}`}
                          >
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="ml-4">
                    {expandedRow === row.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="xl:hidden mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {securityCardItems(row).map((item) => (
                    <div key={item.label}>
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className={`text-sm font-semibold ${item.className}`}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <AnimatePresence>
                {expandedRow === row.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-200 bg-gray-50"
                  >
                    <div className="p-5 space-y-5">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <div className="w-1 h-4 bg-blue-500 rounded"></div>
                          Security Payroll Details
                        </h4>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-white p-3 rounded-lg border border-blue-100">
                            <p className="text-xs text-gray-500 mb-1">
                              Completed Shifts
                            </p>
                            <p className="font-semibold text-blue-700">
                              {row.completed_shifts || 0}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-blue-100">
                            <p className="text-xs text-gray-500 mb-1">
                              Payable Shift Salary
                            </p>
                            <p className="font-semibold text-blue-700">
                              {money(
                                row.payable_basic_salary || row.basic_salary,
                              )}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-blue-100">
                            <p className="text-xs text-gray-500 mb-1">
                              Overtime Pay
                            </p>
                            <p className="font-semibold text-blue-700">
                              {money(row.overtime_pay)}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-blue-100">
                            <p className="text-xs text-gray-500 mb-1">
                              Extra Shift Pay
                            </p>
                            <p className="font-semibold text-blue-700">
                              {money(row.extra_shift_pay)}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-blue-100">
                            <p className="text-xs text-gray-500 mb-1">
                              Gross Pay
                            </p>
                            <p className="font-semibold text-blue-700">
                              {money(row.gross_pay)}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-blue-100">
                            <p className="text-xs text-gray-500 mb-1">
                              Total Earnings
                            </p>
                            <p className="font-semibold text-blue-700">
                              {money(row.total_earnings)}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-blue-100">
                            <p className="text-xs text-gray-500 mb-1">
                              Payroll Status
                            </p>
                            <p className="font-semibold text-blue-700">
                              {row.payroll_status || "DRAFT"}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-blue-100">
                            <p className="text-xs text-gray-500 mb-1">
                              Payroll Type
                            </p>
                            <p className="font-semibold text-blue-700">
                              {row.payroll_type || "SECURITY"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <div className="w-1 h-4 bg-indigo-500 rounded"></div>
                          EPF / ETF
                        </h4>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-white p-3 rounded-lg border border-indigo-100">
                            <p className="text-xs text-gray-500 mb-1">
                              EPF Base
                            </p>
                            <p className="font-semibold text-indigo-700">
                              {money(row.epf_base)}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-indigo-100">
                            <p className="text-xs text-gray-500 mb-1">EPF 8%</p>
                            <p className="font-semibold text-indigo-700">
                              {money(row.epf_8)}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-indigo-100">
                            <p className="text-xs text-gray-500 mb-1">
                              EPF 12%
                            </p>
                            <p className="font-semibold text-indigo-700">
                              {money(row.epf_12)}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-indigo-100">
                            <p className="text-xs text-gray-500 mb-1">ETF 3%</p>
                            <p className="font-semibold text-indigo-700">
                              {money(row.etf_3)}
                            </p>
                          </div>
                        </div>
                      </div>

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

                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <div className="w-1 h-4 bg-orange-500 rounded"></div>
                          Other Details
                        </h4>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-white p-3 rounded-lg border border-orange-100">
                            <p className="text-xs text-gray-500 mb-1">
                              Total Allowances
                            </p>
                            <p className="font-semibold text-emerald-700">
                              {money(row.total_allowances)}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-orange-100">
                            <p className="text-xs text-gray-500 mb-1">
                              Total Deductions
                            </p>
                            <p className="font-semibold text-red-700">
                              {money(row.total_deductions)}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-orange-100">
                            <p className="text-xs text-gray-500 mb-1">
                              Salary Advance
                            </p>
                            <p className="font-semibold text-orange-700">
                              {money(row.salary_advance)}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-orange-100">
                            <p className="text-xs text-gray-500 mb-1">No Pay</p>
                            <p className="font-semibold text-orange-700">
                              {money(row.calculated_nopay)}
                            </p>
                          </div>

                          {customColumns.other.map((col) => (
                            <div
                              key={col.key}
                              className="bg-white p-3 rounded-lg border border-orange-100"
                            >
                              <p className="text-xs text-gray-500 mb-1">
                                {col.label}
                              </p>
                              <p className="font-semibold text-orange-700">
                                {money(row[col.key])}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

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
    </div>
  );
}
