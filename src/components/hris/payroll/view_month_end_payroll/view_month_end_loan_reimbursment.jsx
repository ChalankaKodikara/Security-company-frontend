/** @format */
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import { apiFetch } from "../../../../utils/apiClient";

const ViewMonthEndLoanReimbursment = () => {
  const [searchParams] = useSearchParams();

  const year = searchParams.get("year") || new Date().getFullYear();
  const month = searchParams.get("month") || new Date().getMonth() + 1;
  const orgId = searchParams.get("org_id") || Cookies.get("organization_id");

  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const token = Cookies.get("accessToken");

  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isCompleting, setIsCompleting] = useState(false);

  // 🧭 Helpers
  const renderMoney = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "—";
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const statusPill = (s) => {
    const v = String(s || "").toLowerCase();
    let cls = "bg-gray-200 text-gray-700";
    if (v === "approved" || v === "complete" || v === "completed")
      cls = "bg-green-100 text-green-700";
    else if (v === "rejected") cls = "bg-red-100 text-red-700";
    else if (v === "pending" || v === "inprogress")
      cls = "bg-yellow-100 text-yellow-700";
    return (
      <span className={`px-3 py-1 rounded-full text-xs capitalize ${cls}`}>
        {s || "—"}
      </span>
    );
  };

  const getInitials = (fullName = "") => {
    const parts = String(fullName)
      .replace(/[^\p{L}\p{N}\s'-]/gu, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
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

  // 🧾 Fetch data
  useEffect(() => {
    if (!orgId) {
      toast.error("Missing organization ID.");
      return;
    }

    const controller = new AbortController();
    (async () => {
      setIsLoading(true);
      setFetchError("");
      try {
        const params = new URLSearchParams({
          month: String(Number(month)),
          year: String(year),
          page: String(page),
          limit: String(limit),
          organization: String(orgId),
        });
        if (searchFilter.trim()) params.set("search", searchFilter.trim());

        const res = await apiFetch(
          `${API_URL}/v1/hris/payroll/reimbursements/pending-installments?${params.toString()}`,
          {
            credentials: "include",
            signal: controller.signal,
          },
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        console.log("Loan reimbursement data fetched:", json);

        const data = Array.isArray(json?.data) ? json.data : [];
        const p = json?.pagination || {};

        setRows(
          data.map((r) => ({
            application_id: r.application_id,
            installment_id: r.installment_id,
            employee_no: r.employee_no,
            full_name: r.full_name || r.employee_name || "",
            email: r.email || "",
            amount: r.amount,
            status: r.status,
            loan_type: r.loan_type,
          })),
        );

        setTotal(Number(p.total) || data.length || 0);
        setTotalPages(Number(p.totalPages) || 1);
        setFetchError("");
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error("Failed to fetch loan data:", e);
          setFetchError("Failed to load pending installments.");
          setRows([]);
          setTotal(0);
          setTotalPages(1);
        }
      } finally {
        setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [API_URL, orgId, token, year, month, page, limit, searchFilter]);

  //  PUT Complete (loan_reimbursement)
  const handleComplete = async () => {
    if (!year || !month) {
      toast.error("Year and month are required.");
      return;
    }

    if (!orgId) {
      toast.error("Missing organization ID.");
      return;
    }

    setIsCompleting(true);
    try {
      const payload = {
        month: Number(month),
        year: Number(year),
        organization: Number(orgId),
        column: "loan_reimbursement",
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
        toast.success(
          json?.message || "Loan reimbursement marked as complete.",
        );
      } else {
        toast.error(json?.message || "Failed to complete loan reimbursement.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsCompleting(false);
    }
  };

  // 🧩 UI
  return (
    <div className="mx-auto mt-5 font-montserrat">
      <p className="text-[24px] mb-4">
        Loan Reimbursement · {year}-{String(month).padStart(2, "0")}
      </p>

      {/* Filters */}
      <div className="flex items-end gap-4 my-4 flex-wrap">
        <div className="flex flex-col">
          <label className="text-sm text-gray-700 mb-1">Search Employee</label>
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

        <div className="flex-1" />

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
            {[10, 20, 50].map((n) => (
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
              <th className="p-3">Employee</th>
              <th className="p-3">Loan Type</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="text-center py-6">
                  Loading...
                </td>
              </tr>
            ) : fetchError ? (
              <tr>
                <td colSpan={4} className="text-center py-6 text-red-600">
                  {fetchError}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-6">
                  No data found.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={`${r.application_id}-${r.installment_id}`}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0 ${avatarBgClass(
                          r.full_name || r.employee_no || "",
                        )}`}
                      >
                        {getInitials(r.full_name || r.employee_no || "")}
                      </div>
                      <div>
                        <div className="font-semibold leading-5">
                          {r.full_name || "—"}
                        </div>
                        <div className="text-xs text-gray-500">
                          EMP ID: {r.employee_no || "—"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{r.loan_type || "—"}</td>
                  <td className="p-3">{renderMoney(r.amount)}</td>
                  <td className="p-3">{statusPill(r.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <div>
          Page {Math.min(page, totalPages)} of {totalPages} ({total} records)
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
                Complete Loan Reimbursement
              </p>
              <button
                className="border border-white text-white rounded-md p-2 disabled:opacity-50"
                onClick={handleComplete}
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

export default ViewMonthEndLoanReimbursment;
