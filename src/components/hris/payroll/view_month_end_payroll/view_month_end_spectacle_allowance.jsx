/** @format */
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import { apiFetch } from "../../../../utils/apiClient";
const ViewMonthEndSpectacleAllowance = () => {
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

  // 🧭 Helper functions
  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d)) return "—";
    return d.toLocaleDateString("en-CA");
  };

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
          typeId: "1",
          month: String(Number(month)),
          year: String(year),
          page: String(page),
          limit: String(limit),
          organization: String(orgId),
        });
        if (searchFilter.trim()) params.set("search", searchFilter.trim());

        const res = await apiFetch(
          `${API_URL}/v1/hris/payroll/spectacleMedical?${params.toString()}`,
          {
            credentials: "include",
            signal: controller.signal,
          },
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        console.log("Spectacle data fetched:", json);

        const data = Array.isArray(json?.data) ? json.data : [];
        const p = json?.pagination || {};

        setRows(
          data.map((r) => ({
            id: r.id,
            empId: r.empId,
            employee_fullname: r.employee_fullname,
            claim_Amount: r.claim_Amount,
            status: r.status,
            claimRecivedDate: r.claimRecivedDate,
            spectacle_type: r.spectacle_type,
            max_amount: r.max_amount,
            min_amount: r.min_amount,
          })),
        );

        setTotal(Number(p.total) || data.length || 0);
        setTotalPages(Number(p.totalPages) || 1);
        setFetchError("");
      } catch (e) {
        if (e.name !== "AbortError") {
          setFetchError("Failed to load spectacle/medical data.");
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

  //  PUT Complete (spectacle_allowance)
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
        column: "spectacle_allowance",
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
          json?.message || "Spectacle/Medical allowance completed.",
        );
      } else {
        toast.error(json?.message || "Failed to complete process.");
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
        Spectacles / Medical Allowance · {year}-{String(month).padStart(2, "0")}
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
              <th className="p-3">Requested Date</th>
              <th className="p-3">Claim Amount</th>
              <th className="p-3">Type</th>
              <th className="p-3">Status</th>
              <th className="p-3">Max</th>
              <th className="p-3">Min</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-6">
                  Loading...
                </td>
              </tr>
            ) : fetchError ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-red-600">
                  {fetchError}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6">
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
                          r.employee_fullname || r.empId || "",
                        )}`}
                      >
                        {getInitials(r.employee_fullname || r.empId || "")}
                      </div>
                      <div>
                        <div className="font-semibold leading-5">
                          {r.employee_fullname || "—"}
                        </div>
                        <div className="text-xs text-gray-500">
                          EMP ID: {r.empId || "—"}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="p-3">{fmtDate(r.claimRecivedDate)}</td>
                  <td className="p-3">{renderMoney(r.claim_Amount)}</td>
                  <td className="p-3 capitalize">{r.spectacle_type || "—"}</td>
                  <td className="p-3">{statusPill(r.status)}</td>
                  <td className="p-3">{renderMoney(r.max_amount)}</td>
                  <td className="p-3">{renderMoney(r.min_amount)}</td>
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
                Complete Spectacle / Medical Allowance
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

export default ViewMonthEndSpectacleAllowance;
