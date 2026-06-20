/** @format */
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import { apiFetch } from "../../../../utils/apiClient";

const ViewMonthEndSalaryAdvanced = () => {
  const [searchParams] = useSearchParams();

  const now = new Date();
  const [year] = useState(
    searchParams.get("year") || String(now.getFullYear())
  );
  const [month] = useState(
    searchParams.get("month") || String(now.getMonth() + 1)
  );
  const orgId = searchParams.get("org_id") || Cookies.get("organization_id");

  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const token = Cookies.get("accessToken");

  // Filters / pagination
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Server data/meta
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // UX
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // PUT status
  const [isCompleting, setIsCompleting] = useState(false);

  /* -------------------- Helpers -------------------- */
  const getInitials = (fullName = "") => {
    const tokens = String(fullName)
      .replace(/[^\p{L}\p{N}\s'-]/gu, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (tokens.length === 0) return "??";
    if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
    return (tokens[0][0] + tokens[tokens.length - 1][0]).toUpperCase();
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

  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const renderMoney = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "—";
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const statusPill = (status) => {
    const s = String(status || "").toUpperCase();
    let cls = "bg-gray-200 text-gray-800";
    if (s === "PENDING") cls = "bg-yellow-100 text-yellow-800";
    if (s === "APPROVED") cls = "bg-green-100 text-green-700";
    if (s === "REJECTED") cls = "bg-red-100 text-red-700";
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${cls}`}>
        {s || "—"}
      </span>
    );
  };

  /* -------------------- Fetch Salary Advance Data -------------------- */
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
          month: String(Number(month)),
          year: String(year),
          organization: String(orgId),
          payroll_group: "Ho",
        });
        if (search.trim()) params.set("search", search.trim());

        const res = await apiFetch(
          `${API_URL}/v1/hris/payroll/salary-advance-pending?${params.toString()}`,
          {

            credentials: "include",
            signal: controller.signal,
          }
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const data = Array.isArray(json?.data) ? json.data : [];
        setRows(
          data.map((r) => ({
            id: r.id,
            employee_fullname: r.employee_fullname,
            employee_number: r.employee_number,
            request_date: r.request_date,
            advance_amount: r.advance_amount,
            reason: r.reason,
            status: r.status,
          }))
        );
        setTotal(Number(json?.total) || data.length || 0);

        const t = Number(json?.total) || 0;
        const l = Number(json?.limit) || 10;
        setTotalPages(Math.max(1, Math.ceil(t / l)));
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error("Failed to load salary advances:", e);
          setFetchError("Failed to load salary advance requests.");
          setRows([]);
          setTotal(0);
          setTotalPages(1);
        }
      } finally {
        setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [API_URL, token, orgId, page, limit, month, year, search]);

  /* -------------------- PUT Complete (salary_advanced) -------------------- */
  const handleComplete = async () => {
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
        column: "salary_advanced",
        status: "complete",
      };

      const res = await apiFetch(
        `${API_URL}/v1/hris/payroll/attendance-overtime-status/bulk-update`,
        {
          method: "PUT",

          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(json?.message || "Salary advances marked as complete.");
      } else {
        toast.error(json?.message || "Failed to complete salary advances.");
      }
    } catch (err) {
      toast.error("Internal server error");
    } finally {
      setIsCompleting(false);
    }
  };

  /* -------------------- UI -------------------- */
  return (
    <div className="mx-auto mt-5 font-montserrat">
      <p className="text-[24px] mb-4">
        Salary Advance Requests · {year || "—"}-
        {String(month || "").padStart(2, "0")}
      </p>

      {/* Search Filter */}
      <div className="mb-3 flex gap-4 items-end flex-wrap">
        <div className="flex flex-col">
          <label className="text-sm text-gray-700 mb-1">Search</label>
          <input
            className="border border-gray-300 rounded px-3 py-2 w-72"
            placeholder="ID / EMP No / Name"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-lg p-2 rounded-lg overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-white text-gray-600 border-b border-t">
            <tr>
              <th className="p-3">Employee</th>
              <th className="p-3">Requested Date</th>
              <th className="p-3">Advance Amount</th>
              <th className="p-3">Reason</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-6">
                  Loading...
                </td>
              </tr>
            ) : fetchError ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-red-600">
                  {fetchError}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6">
                  No data found.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0 ${avatarBgClass(
                          r.employee_fullname || r.employee_number || ""
                        )}`}
                        title={r.employee_fullname}
                      >
                        {getInitials(
                          r.employee_fullname || r.employee_number || ""
                        )}
                      </div>
                      <div>
                        <div className="font-semibold leading-5">
                          {r.employee_fullname || "—"}
                        </div>
                        <div className="text-xs text-gray-500">
                          EMP ID: {r.employee_number || "—"}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="p-3">{fmtDate(r.request_date)}</td>
                  <td className="p-3">{renderMoney(r.advance_amount)}</td>
                  <td className="p-3">{r.reason || "—"}</td>
                  <td className="p-3">{statusPill(r.status)}</td>
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
        <div className="flex items-center gap-2">
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
              <p className="text-white text-[16px]">Complete Salary Advances</p>
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

export default ViewMonthEndSalaryAdvanced;
