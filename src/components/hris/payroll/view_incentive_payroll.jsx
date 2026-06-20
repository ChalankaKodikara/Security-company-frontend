import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Cookies from "js-cookie"; // Import Cookies
import { apiFetch } from "../../../utils/apiClient";
const statusColorMap = {
  complete: "text-green-600 font-semibold",
  incomplete: "text-rose-600 font-semibold",
};

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

function renderStatus(val) {
  const s = String(val || "").toLowerCase();
  const cls = statusColorMap[s] || "";
  return <span className={cls}>{val || "-"}</span>;
}

export default function ViewIncentivePayroll() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const orgId = searchParams.get("orgId") || "";

  // Get organization_id from Cookies
  const organization_id = Cookies.get("organization_id");

  const year = searchParams.get("year") || "";
  const month = searchParams.get("month") || "";
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  // --- Console logs for debugging ---
  console.log("ViewIncentivePayroll Component Rendered");
  console.log("URL Year:", year);
  console.log("URL Month:", month);
  console.log("Organization ID from Cookies:", organization_id);
  // --- End Console logs ---

  // table
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // button visibility from server
  const [buttonVisible, setButtonVisible] = useState("no");

  // filters
  // ⭐ MODIFIED: Renamed employeeFilter to searchFilter and it now reads from "search" param
  const [searchFilter, setSearchFilter] = useState(
    searchParams.get("search") || ""
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || ""
  );

  // pagination (default page size 7)
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));
  const [limit, setLimit] = useState(Number(searchParams.get("limit") || 7));
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // live loader modal states
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcSuccess, setCalcSuccess] = useState(false);
  const [calcError, setCalcError] = useState("");
  const [progress, setProgress] = useState(0);

  const ymLabel = useMemo(() => {
    if (!year || !month) return "—";
    return `${year}-${String(month).padStart(2, "0")}`;
  }, [year, month]);

  // keep URL in sync (removed organization_id from URL sync as it's from cookie now)
  useEffect(() => {
    const sp = new URLSearchParams();
    if (year) sp.set("year", year);
    if (month) sp.set("month", String(month).padStart(2, "0"));
    // We are no longer expecting org_id in the URL to keep it in sync here,
    // as the primary source for this component is the cookie.
    // ⭐ MODIFIED: Use searchFilter for the "search" URL parameter
    if (searchFilter) sp.set("search", searchFilter);
    if (statusFilter) sp.set("status", statusFilter);
    if (page) sp.set("page", String(page));
    if (limit) sp.set("limit", String(limit));
    setSearchParams(sp, { replace: true });
  }, [
    year,
    month,
    searchFilter, // ⭐ MODIFIED: Dependency for URL sync
    statusFilter,
    page,
    limit,
    setSearchParams,
  ]);

  // fetch table + buttonVisible
  useEffect(() => {
    console.log("useEffect for data fetching triggered.");
    console.log(
      "  Dependencies values: year=",
      year,
      "month=",
      month,
      "organization_id (from cookie)=",
      organization_id,
      "searchFilter=",
      searchFilter // ⭐ MODIFIED: console log for searchFilter
    );

    // Prevent fetch if essential parameters are missing (including organization_id from cookie)
    if (!year || !month || !organization_id) {
      console.log("  Missing year, month, or organization_id. Skipping fetch.");
      setRows([]);
      setTotal(0);
      setTotalPages(0);
      setFetchError("");
      setButtonVisible("no");
      return;
    }

    const controller = new AbortController();

    (async () => {
      setIsLoading(true);
      setFetchError("");
      try {
        const params = new URLSearchParams({
          orgId: String(orgId),
          year: String(year),
          month: String(month).padStart(2, "0"),
          page: String(page),
          limit: String(limit),
          organization_id: organization_id, // Include organization_id from cookie in GET request params
          payroll_group: "Ho",
        });

        // ⭐ MODIFIED: Include searchFilter as the "search" API parameter
        if (searchFilter) params.set("search", searchFilter.trim());
        if (statusFilter) params.set("status", statusFilter.trim());

        const fetchUrl = `${API_URL}/v1/hris/payroll/incomplete-attendance-overtime?${params.toString()}`;
        console.log("  Fetching table data from URL:", fetchUrl);

        const res = await apiFetch(fetchUrl, {

          credentials: "include",
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        console.log("  Table data fetched successfully:", json);

        const data = Array.isArray(json?.data) ? json.data : [];
        const p = json?.pagination || {};
        setRows(data);
        setTotal(Number(p?.total) || data.length || 0);
        setTotalPages(Number(p?.totalPages) || 1);

        setButtonVisible(
          typeof json?.buttonVisible === "string" ? json.buttonVisible : "no"
        );

        const serverPage = Number(p?.page) || page;
        if (serverPage !== page) setPage(serverPage);
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error("  Error fetching table data:", e);
          setFetchError("Failed to load data.");
          setRows([]);
          setTotal(0);
          setTotalPages(0);
          setButtonVisible("no");
        }
      } finally {
        setIsLoading(false);
      }
    })();

    return () => {
      console.log("  Cleanup for data fetching useEffect.");
      controller.abort();
    };
  }, [
    year,
    month,
    page,
    limit,
    searchFilter, // ⭐ MODIFIED: Add searchFilter to dependencies
    statusFilter,
    organization_id,
    API_URL,
  ]);

  // live progress while waiting (slowly to 90%), stop on success/error
  useEffect(() => {
    if (!isCalculating || calcSuccess || calcError) return;
    setProgress(0);
    const id = setInterval(() => {
      setProgress((p) => (p < 90 ? p + 10 : p));
    }, 600);
    return () => clearInterval(id);
  }, [isCalculating, calcSuccess, calcError]);

  // actions
  const gotoPrev = () => setPage((p) => Math.max(1, p - 1));
  const gotoNext = () => setPage((p) => Math.min(totalPages || 1, p + 1));
  const onLimitChange = (e) => {
    const v = Number(e.target.value) || 7;
    setLimit(v);
    setPage(1);
  };
  const onStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };
  // ⭐ MODIFIED: Renamed onEmployeeChange to onSearchChange to match the new filter name
  const onSearchChange = (e) => {
    setSearchFilter(e.target.value);
    setPage(1); // Reset to first page on search change
  };

  const handleGenerate = async () => {
    // Prevent generation if essential parameters are missing or already calculating
    if (!year || !month || !organization_id || isCalculating) {
      console.log(
        "  Skipping generate: Missing year, month, organization_id (from cookie), or already calculating."
      );
      return;
    }
    setIsCalculating(true);
    setCalcSuccess(false);
    setCalcError("");
    setProgress(0);

    try {
      const payload = {
        organization_id: Number(organization_id), // Set organization_id from cookie to POST body
        month: Number(month),
        year: Number(year),
      };
      console.log("  Attempting to generate payroll with payload:", payload);

      const res = await apiFetch(
        `${API_URL}/v1/hris/payroll/generate/security`,
        {
          method: "POST",
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const apiErrorMessage =
          json?.error || json?.message || `HTTP ${res.status}`;
        throw new Error(apiErrorMessage);
      }

      console.log("  Payroll generation successful. Response:", json);
      // success: fill bar & show the "Show payroll data" CTA
      setProgress(100);
      setCalcSuccess(true);
    } catch (err) {
      console.error("  Error during payroll generation:", err);
      setCalcError(err?.message || "Failed to start payroll calculation.");
      setProgress(0);
    }
  };

  const handleViewPayrollData = () => {
    // close modal and go to calculated page with query params
    setIsCalculating(false);
    // Include organization_id in the navigation URL
    navigate(
      `/view-calculated-month-end-payroll?year=${encodeURIComponent(
        year
      )}&month=${encodeURIComponent(month)}&org_id=${encodeURIComponent(
        organization_id
      )}`
    );
  };

  const closeModal = () => {
    setIsCalculating(false);
    setCalcSuccess(false);
    setCalcError("");
    setProgress(0);
  };

  return (
    <div className="p-6 font-montserrat">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          Pre-generation status for {ymLabel}
        </h2>
        <div className="text-sm text-gray-600">Total: {total}</div>
      </div>

      {/* Filters */}
      <div className="mb-3">
        <div className="flex gap-3 items-end">
          {/* ⭐ MODIFIED: This is now the single "Search" input */}
          <div>
            <label className="text-sm">Search</label>
            <input
              type="text"
              value={searchFilter} // Bound to searchFilter state
              onChange={onSearchChange} // Uses onSearchChange handler
              placeholder="ID or Name"
              className="border p-2 rounded w-64"
            />
          </div>

          <div>
            <label className="text-sm">Status</label>
            <select
              value={statusFilter}
              onChange={onStatusChange}
              className="border p-2 rounded w-48"
            >
              <option value="">All</option>
              <option value="complete">Complete</option>
              <option value="incomplete">Incomplete</option>
            </select>
          </div>

          <div>
            <label className="text-sm">Page size</label>
            <select
              value={limit}
              onChange={onLimitChange}
              className="border p-2 rounded w-28"
            >
              <option value={7}>7</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="shadow-md p-2 overflow-x-auto bg-white rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-white text-gray-600 border-b border-t">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Employee</th>
              <th className="p-3">Month</th>
              <th className="p-3">Year</th>
              <th className="p-3">Attendance</th>
              <th className="p-3">Overtime</th>
              <th className="p-3">Allowances</th>
              <th className="p-3">Deduction</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="16" className="text-center py-6">
                  Loading...
                </td>
              </tr>
            ) : fetchError ? (
              <tr>
                <td colSpan="16" className="text-center py-6 text-red-600">
                  {fetchError}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan="16" className="text-center py-6">
                  No data found.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={`${r.id ?? ""}-${r.employee_no}`}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-3 text-blue-600">{r.employee_no}</td>

                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0 ${avatarBgClass(
                          r.employee_fullname || r.employee_no
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
                          {r.employee_email || "—"}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="p-3">{r.month ?? "-"}</td>
                  <td className="p-3">{r.year ?? "-"}</td>
                  <td className="p-3">{renderStatus(r.attendance_status)}</td>
                  <td className="p-3">{renderStatus(r.overtime_status)}</td>
                  <td className="p-3">{renderStatus(r.allowances)}</td>
                  <td className="p-3">{renderStatus(r.deduction)}</td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={gotoPrev}
          disabled={page <= 1 || isLoading}
          className="border px-3 py-1 rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span className="text-sm">
          Page {page} / {totalPages || 1}
        </span>
        <button
          onClick={gotoNext}
          disabled={page >= (totalPages || 1) || isLoading}
          className="border px-3 py-1 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Footer with Generate */}
      <footer className="mt-10">
        <div className="mx-auto max-w-screen-4xl">
          <div className="bg-[#2495FE] p-4 rounded-t-md shadow-lg">
            <div className="flex items-center justify-between">
              <p className="text-white text-[16px]">
                Start payroll generation for {ymLabel}
              </p>
              <button
                className="border border-white text-white rounded-md p-2 disabled:opacity-50"
                disabled={buttonVisible !== "yes" || isCalculating}
                onClick={handleGenerate}
                title={
                  buttonVisible !== "yes"
                    ? "Please complete attendance, overtime, and allowances first"
                    : "Start payroll generation"
                }
              >
                Generate
              </button>

            </div>
          </div>
        </div>
      </footer>

      {/* Loader / Result modal */}
      {isCalculating && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-sm text-center">
            {/* Progress track */}
            <div className="h-2 w-full bg-gray-200 rounded overflow-hidden mb-4">
              <div
                className={`h-full rounded ${calcSuccess
                  ? "bg-green-500"
                  : calcError
                    ? "bg-rose-500"
                    : "bg-blue-500"
                  }`}
                style={{
                  width: `${calcSuccess ? 100 : progress}%`,
                  transition: "width 400ms linear",
                }}
              />
            </div>

            {!calcSuccess && !calcError && (
              <>
                <p className="font-semibold text-gray-800">
                  Calculating payroll for {ymLabel}…
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  This may take a moment. Please keep this tab open.
                </p>
              </>
            )}

            {calcSuccess && (
              <>
                <p className="font-semibold text-green-700">
                  Payroll calculated!
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  View the generated payroll details for {ymLabel}.
                </p>
                <div className="mt-4 flex gap-2 justify-center">
                  <button
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                    onClick={handleViewPayrollData}
                  >
                    Show payroll data
                  </button>
                  <button
                    className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
                    onClick={closeModal}
                  >
                    Close
                  </button>
                </div>
              </>
            )}

            {calcError && (
              <>
                <p className="font-semibold text-rose-600">
                  Calculation failed
                </p>
                <p className="text-sm text-gray-600 mt-1">{calcError}</p>
                <div className="mt-4 flex gap-2 justify-center">
                  <button
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                    onClick={handleGenerate}
                  >
                    Retry
                  </button>
                  <button
                    className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
                    onClick={closeModal}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
