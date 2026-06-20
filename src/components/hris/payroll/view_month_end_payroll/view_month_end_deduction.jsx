/** @format */
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import { apiFetch } from "../../../../utils/apiClient";

const View_Month_End_Deduction = () => {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const token = Cookies.get("accessToken");

  //  Get org_id, year, and month from URL or cookies
  const [searchParams] = useSearchParams();
  const orgId = searchParams.get("org_id") || Cookies.get("organization_id");
  const yearParam =
    searchParams.get("year") || new Date().getFullYear().toString();
  const monthParam =
    searchParams.get("month") || (new Date().getMonth() + 1).toString();

  // Data + request state
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // Pagination + filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(7);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchFilter, setSearchFilter] = useState("");

  // Completion state
  const [isCompleting, setIsCompleting] = useState(false);

  /* -------------------- Fetch Employees with Deductions -------------------- */
  useEffect(() => {
    if (!orgId) return;

    const controller = new AbortController();
    (async () => {
      setIsLoading(true);
      setFetchError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          year: yearParam,
          month: monthParam,
          approved_status_1: "APPROVED",
          organization: String(orgId),
          payroll_group: "Ho",
        });

        if (searchFilter.trim()) params.set("search", searchFilter.trim());

        const res = await apiFetch(
          `${API_URL}/v1/hris/employee-allowances/employees-with-allowances?${params.toString()}`,
          {
            credentials: "include",
            signal: controller.signal,
          },
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const list = Array.isArray(json?.employees)
          ? json.employees
          : Array.isArray(json?.employee)
            ? json.employee
            : [];

        setRows(list);

        const p = json?.pagination || {};
        setTotal(Number(p.total) || list.length || 0);
        setTotalPages(Number(p.totalPages) || 1);
        if (Number(p.totalPages) > 0 && page > Number(p.totalPages)) setPage(1);
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error("Failed to load data:", e);
          setRows([]);
          setFetchError("Failed to load data.");
          setTotal(0);
          setTotalPages(1);
        }
      } finally {
        setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [API_URL, orgId, page, limit, searchFilter, yearParam, monthParam, token]);

  /* -------------------- Column Mapper (Smart Deduction Cleaner) -------------------- */
  const columns = useMemo(() => {
    const map = new Map();

    for (const emp of rows) {
      // Handle both backend patterns: merged or separated
      const allItems = [...(emp?.deductions || []), ...(emp?.allowances || [])];

      for (const item of allItems) {
        const key = item?.actual_column_name;
        if (!key) continue;

        //  Only deduction_* fields
        if (!/^deduction_/i.test(key)) continue;

        // Build smart readable label
        let label = item?.suggested_name?.trim();
        if (!label) {
          label = key
            .replace(/^deduction_/i, "")
            .replace(/_/g, " ")
            .replace(/\b\w/g, (ch) => ch.toUpperCase());
          label = `Deduction ${label}`;
        }

        // Handle known short forms (optional)
        label = label
          .replace(/\bEpf\b/gi, "EPF")
          .replace(/\bEtf\b/gi, "ETF")
          .replace(/\bAdv\b/gi, "Advance")
          .replace(/\bSal\b/gi, "Salary");

        if (!map.has(key)) map.set(key, label);
      }
    }

    return Array.from(map.entries()).map(([actual, suggested]) => ({
      actual_column_name: actual,
      suggested_name: suggested,
    }));
  }, [rows]);

  /* -------------------- Helpers -------------------- */
  const getInitials = (fullName = "") => {
    const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "??";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const avatarBgClass = (seed = "") => {
    const palette = [
      "bg-sky-500",
      "bg-indigo-500",
      "bg-emerald-500",
      "bg-rose-500",
      "bg-amber-500",
      "bg-teal-500",
      "bg-fuchsia-500",
      "bg-cyan-500",
    ];
    let hash = 0;
    for (let i = 0; i < seed.length; i++)
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    return palette[hash % palette.length];
  };

  const renderValue = (v) => {
    if (v == null || v === "") return "—";
    const n = Number(v);
    return Number.isFinite(n)
      ? n.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      : String(v);
  };

  /* -------------------- PUT: Mark Deductions Complete -------------------- */
  const handleCompleteDeduction = async () => {
    const y = Number(yearParam);
    const m = Number(monthParam);
    if (!y || !m) {
      toast.error("Missing year or month in URL.");
      return;
    }

    setIsCompleting(true);
    try {
      const payload = {
        month: m,
        year: y,
        organization: Number(orgId),
        column: "deduction",
        status: "complete",
      };

      const res = await apiFetch(
        `${API_URL}/v1/hris/payroll/attendance-overtime-status/bulk-update`,
        {
          method: "PUT",

          credentials: "include",
          body: JSON.stringify(payload),
        },
      );

      let json = {};
      try {
        json = await res.json();
      } catch { }

      if (res.ok && json?.success !== false) {
        toast.success(json?.message || "Deductions marked as complete.");
      } else {
        toast.error(json?.message || "Failed to complete deductions.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsCompleting(false);
    }
  };

  /* -------------------- UI -------------------- */
  return (
    <div className="mx-auto mt-5 font-montserrat">
      <p className="text-[24px]">
        Monthly Deductions for Employees
        {yearParam && monthParam ? (
          <span className="text-gray-500 text-[16px]">
            {" "}
            · {yearParam}-{String(monthParam).padStart(2, "0")}
          </span>
        ) : null}
      </p>

      {/* Filters + per-page */}
      <div className="flex items-end justify-between my-4">
        <div className="flex items-end gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-700 mb-1">
              Search Employee
            </label>
            <input
              type="text"
              className="border border-gray-300 rounded px-3 py-2 w-64"
              placeholder="Employee ID or Name"
              value={searchFilter}
              onChange={(e) => {
                setSearchFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <label className="text-xs">
          Per page:&nbsp;
          <select
            className="border border-gray-300 rounded px-2 py-1"
            value={limit}
            onChange={(e) => {
              setPage(1);
              setLimit(Number(e.target.value) || 10);
            }}
            disabled={isLoading}
          >
            {[1, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Table */}
      <div className="bg-white shadow-lg p-2 rounded-lg overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-white text-gray-600 border-b border-t">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Employee</th>
              {isLoading ? (
                <th className="p-3 text-gray-400">Loading columns…</th>
              ) : fetchError ? (
                <th className="p-3 text-red-600">{fetchError}</th>
              ) : columns.length === 0 ? (
                <th className="p-3 text-gray-400">No deduction columns</th>
              ) : (
                columns.map((c) => (
                  <th key={c.actual_column_name} className="p-3">
                    {c.suggested_name || c.actual_column_name}
                  </th>
                ))
              )}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={2 + Math.max(1, columns.length)}
                  className="text-center py-6"
                >
                  Loading...
                </td>
              </tr>
            ) : fetchError ? (
              <tr>
                <td
                  colSpan={2 + Math.max(1, columns.length)}
                  className="text-center py-6 text-red-600"
                >
                  {fetchError}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={2 + Math.max(1, columns.length)}
                  className="text-center py-6"
                >
                  No data found.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.employee_no} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-blue-600">{r.employee_no}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0 ${avatarBgClass(
                          r.employee_fullname || r.employee_no,
                        )}`}
                        title={r.employee_fullname}
                      >
                        {getInitials(r.employee_fullname || r.employee_no)}
                      </div>
                      <div>
                        <div className="font-semibold leading-5">
                          {r.employee_fullname || "—"}
                        </div>
                        <div className="text-xs text-gray-500">
                          EMP ID: {r.employee_no || "—"}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Deduction columns */}
                  {columns.length === 0 ? (
                    <td className="p-3 text-gray-400">—</td>
                  ) : (
                    columns.map((c) => {
                      const allItems = [
                        ...(r?.deductions || []),
                        ...(r?.allowances || []),
                      ];
                      const match = allItems.find(
                        (item) =>
                          item?.actual_column_name === c.actual_column_name,
                      );
                      return (
                        <td key={c.actual_column_name} className="p-3">
                          {renderValue(match?.value)}
                        </td>
                      );
                    })
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pager */}
      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <div>
          Page {Math.min(page, totalPages)} of {totalPages} ({total} record
          {Number(total) === 1 ? "" : "s"})
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading}
          >
            Prev
          </button>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
          >
            Next
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-10">
        <div className="mx-auto max-w-screen-4xl">
          <div className="bg-[#2495FE] p-4 rounded-t-md shadow-lg">
            <div className="flex items-center justify-between">
              <p className="text-white text-[16px]">
                Complete Deductions
                {yearParam && monthParam
                  ? ` · ${yearParam}-${String(monthParam).padStart(2, "0")}`
                  : ""}
              </p>
              <button
                className="border border-white text-white rounded-md p-2 disabled:opacity-50"
                onClick={handleCompleteDeduction}
                disabled={isCompleting || isLoading}
              >
                {isCompleting ? "Completing..." : "Complete"}
              </button>
            </div>
          </div>
        </div>
      </footer>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default View_Month_End_Deduction;
