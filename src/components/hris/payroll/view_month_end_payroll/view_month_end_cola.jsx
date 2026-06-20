/** @format */
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import { apiFetch } from "../../../../utils/apiClient";

const View_Month_End_Cola = () => {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const token = Cookies.get("accessToken");

  //  Get org_id, year, month
  const [searchParams] = useSearchParams();
  const orgId = searchParams.get("org_id") || Cookies.get("organization_id");
  const yearParam = searchParams.get("year") || new Date().getFullYear();
  const monthParam =
    searchParams.get("month") || String(new Date().getMonth() + 1);

  //  Table & pagination state
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchFilter, setSearchFilter] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);

  //  Helpers
  const getInitials = (fullName = "") => {
    const tokens = String(fullName)
      .replace(/[^\p{L}\p{N}\s'-]/gu, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (tokens.length === 0) return "??";
    if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
    const first = tokens[0][0] || "";
    const last = tokens[tokens.length - 1][0] || "";
    return (first + last).toUpperCase();
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
    const num = Number(v);
    if (!Number.isNaN(num))
      return num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    return String(v);
  };

  const availabilityPill = (val) => {
    const v = String(val || "").toLowerCase();
    const cls =
      v === "yes"
        ? "bg-green-100 text-green-700 border border-green-200"
        : v === "no"
          ? "bg-rose-100 text-rose-700 border border-rose-200"
          : "bg-gray-100 text-gray-700 border border-gray-200";
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${cls}`}>
        {val ?? "—"}
      </span>
    );
  };

  /* -------------------- Fetch COLA Data -------------------- */
  useEffect(() => {
    if (!orgId) {
      toast.error("Organization ID missing.");
      return;
    }

    const controller = new AbortController();
    (async () => {
      setIsLoading(true);
      setFetchError("");
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
          organization: String(orgId),
        });
        if (searchFilter.trim()) params.set("search", searchFilter.trim());

        const res = await apiFetch(
          `${API_URL}/v1/hris/cola/with-cola-availability?${params.toString()}`,
          {
            credentials: "include",
            signal: controller.signal,
          },
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        console.log("COLA data fetched:", json);

        const data = Array.isArray(json?.data) ? json.data : [];
        const pag = json?.pagination || {};

        setRows(data);
        setFetchError("");
        setTotalPages(Number(pag.totalPages) || 1);
        setTotalRecords(Number(pag.totalRecords) || data.length);
      } catch (e) {
        console.error("Failed to load COLA data:", e);
        setRows([]);
        setTotalPages(1);
        setTotalRecords(0);
        setFetchError("Failed to load data.");
      } finally {
        setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [API_URL, token, orgId, page, pageSize, searchFilter]);

  /* -------------------- PUT: Mark COLA as Complete -------------------- */
  const handleCompleteCola = async () => {
    const y = Number(yearParam);
    const m = Number(monthParam);
    if (!y || !m) {
      toast.error("Missing year or month in URL.");
      return;
    }

    if (!orgId) {
      toast.error("Missing organization ID.");
      return;
    }

    setIsCompleting(true);
    try {
      const payload = {
        month: m,
        year: y,
        organization: Number(orgId),
        column: "cola_allowance",
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

      const json = await res.json().catch(() => ({}));

      if (res.ok && json?.success !== false) {
        toast.success(json?.message || "COLA marked as complete.");
      } else {
        toast.error(json?.message || "Failed to complete COLA.");
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
        Monthly COLA Allowances for Employees
        {yearParam && monthParam ? (
          <span className="text-gray-500 text-[16px]">
            {" "}
            · {yearParam}-{String(monthParam).padStart(2, "0")}
          </span>
        ) : null}
      </p>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 mb-3 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs text-gray-600 mb-1">
            Search Employee
          </label>
          <input
            className="w-full border rounded-md p-2"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="ID or Name"
          />
        </div>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setPage(1)}
            disabled={isLoading}
          >
            Search
          </button>
          <button
            className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
            onClick={() => {
              setSearchFilter("");
              setPage(1);
            }}
            disabled={isLoading || !searchFilter}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-lg p-2 rounded-lg overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-white text-gray-600 border-b border-t">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Employee</th>
              <th className="p-3">Email</th>
              <th className="p-3">COLA Amount</th>
              <th className="p-3">Remark</th>
              <th className="p-3">Availability</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-6">
                  Loading...
                </td>
              </tr>
            ) : fetchError ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-red-600">
                  {fetchError}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6">
                  No data found.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr
                  key={r.employee_no || i}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-3 text-blue-600">{r.employee_no}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0 ${avatarBgClass(
                          r.employee_calling_name || r.employee_no,
                        )}`}
                      >
                        {getInitials(r.employee_calling_name || r.employee_no)}
                      </div>
                      <div>
                        <div className="font-semibold leading-5">
                          {r.employee_calling_name || "—"}
                        </div>
                        <div className="text-xs text-gray-500">
                          EMP ID: {r.employee_no}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{r.employee_email || "—"}</td>
                  <td className="p-3">
                    {renderValue(r.cola_amount ?? r.price)}
                  </td>
                  <td className="p-3">{r.remark ?? "—"}</td>
                  <td className="p-3">{availabilityPill(r.availability)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pager */}
      <div className="flex flex-wrap items-center justify-between mt-4 text-sm text-gray-700 gap-3">
        <div>
          Page {Math.min(page, totalPages)} of {totalPages} ({totalRecords}{" "}
          records)
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs">Rows:</label>
          <select
            className="border rounded p-1"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            disabled={isLoading}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={isLoading || page <= 1}
          >
            Prev
          </button>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={isLoading || page >= totalPages}
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
                Complete COLA
                {yearParam && monthParam
                  ? ` · ${yearParam}-${String(monthParam).padStart(2, "0")}`
                  : ""}
              </p>
              <button
                className="border border-white text-white rounded-md p-2 disabled:opacity-50"
                onClick={handleCompleteCola}
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

export default View_Month_End_Cola;
