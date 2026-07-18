/** @format */
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import debounce from "lodash.debounce";
import { apiFetch } from "../../../utils/apiClient";
const money = (v) => {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

export default function View_Calculated_Month_End_Payroll() {
  const [searchParams, setSearchParams] = useSearchParams();
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  //  Read correct query parameters
  const year = searchParams.get("year") || "";
  const month = searchParams.get("month") || "";
  const organization_id = searchParams.get("organization_id") || "";

  const ymLabel = useMemo(() => {
    if (!year || !month) return "—";
    return `${year}-${String(month).padStart(2, "0")}`;
  }, [year, month]);

  //  Corrected default selected org id
  const [organizationOptions, setOrganizationOptions] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(organization_id || "");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));
  const [limit, setLimit] = useState(Number(searchParams.get("limit") || 10));
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [dynamicColumns, setDynamicColumns] = useState([]);

  //  Keep URL in sync
  useEffect(() => {
    const sp = new URLSearchParams();
    if (year) sp.set("year", year);
    if (month) sp.set("month", String(month).padStart(2, "0"));
    if (selectedOrgId) sp.set("organization_id", selectedOrgId);
    if (search) sp.set("search", search);
    if (page) sp.set("page", String(page));
    if (limit) sp.set("limit", String(limit));
    setSearchParams(sp, { replace: true });
  }, [year, month, selectedOrgId, search, page, limit, setSearchParams]);

  /**  Fetch Organization Dropdown */
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(
          `${API_URL}/v1/hris/organizations/organization`,
          {
            credentials: "include",
          },
        );
        const json = await res.json();
        if (Array.isArray(json?.data)) {
          setOrganizationOptions(json.data);
        }
      } catch (err) {
        console.error("Error fetching organization list:", err);
      }
    })();
  }, [API_URL]);

  /**  Fetch payroll data */
  const fetchData = async (query = search) => {
    if (!year || !month || !selectedOrgId) {
      setRows([]);
      setTotalPages(1);
      setTotalRecords(0);
      return;
    }

    setIsLoading(true);
    setFetchError("");
    try {
      const params = new URLSearchParams({
        year: String(year),
        month: String(month).padStart(2, "0"),
        page: String(page),
        limit: String(limit),
        organization: String(selectedOrgId),
      });
      if (query) params.set("search", query.trim());

      const res = await apiFetch(
        `${API_URL}/v1/hris/payroll/genarated-payroll-by-month-and-year?${params.toString()}`,
        {
          credentials: "include",
        },
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const data = Array.isArray(json?.data) ? json.data : [];
      setRows(data);
      setTotalPages(Number(json?.totalPages) || 1);
      setTotalRecords(Number(json?.totalRecords) || data.length || 0);
    } catch (e) {
      console.error("Fetch error:", e);
      setFetchError("Failed to load generated payroll.");
      setRows([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setIsLoading(false);
    }
  };

  //  Debounced search
  const debouncedSearch = useCallback(
    debounce((value) => {
      setPage(1);
      fetchData(value);
    }, 600),
    [year, month, limit, selectedOrgId],
  );

  //  Re-fetch when filters/pagination change
  useEffect(() => {
    fetchData();
  }, [page, limit, year, month, selectedOrgId]);

  //  Fetch dynamic payroll columns
  useEffect(() => {
    apiFetch(`${API_URL}/v1/hris/payroll/columns`)
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json)) setDynamicColumns(json);
      })
      .catch((e) =>
        console.error("Error fetching dynamic payroll columns:", e),
      );
  }, [API_URL]);

  const gotoPrev = () => setPage((p) => Math.max(1, p - 1));
  const gotoNext = () => setPage((p) => Math.min(totalPages || 1, p + 1));

  const onReset = () => {
    setSearch("");
    setSelectedOrgId("");
    setPage(1);
    fetchData("");
  };

  return (
    <div className="p-6 font-montserrat">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          Generated Payroll for {ymLabel}
        </h2>
        <div className="text-sm text-gray-600">Total: {totalRecords}</div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Organization Filter */}
          <div>
            <label className="text-sm font-medium">Organization</label>
            <select
              value={selectedOrgId}
              onChange={(e) => {
                setSelectedOrgId(e.target.value);
                setPage(1);
              }}
              className="border p-2 rounded w-64"
            >
              <option value="">Select Organization</option>
              {organizationOptions.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.organization_name}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="text-sm font-medium">Employee Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                debouncedSearch(e.target.value);
              }}
              placeholder="Search by employee no, name or email..."
              className="border p-2 rounded w-72"
            />
          </div>

          {/* Page Size */}
          <div>
            <label className="text-sm font-medium">Page size</label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="border p-2 rounded w-28"
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onReset}
            className="ml-auto px-4 py-2 border rounded hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="shadow-md p-2 overflow-x-auto bg-white rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700 border-b">
            <tr>
              <th className="p-3">Emp No</th>
              <th className="p-3">Employee</th>
              <th className="p-3">Basic</th>
              <th className="p-3">COLA</th>
              {dynamicColumns.map((col) => (
                <th key={col.id} className="p-3">
                  {col.suggested_name}
                </th>
              ))}
              <th className="p-3">Total Allow.</th>
              <th className="p-3">Total Deduct.</th>
              <th className="p-3">Net</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="999" className="text-center py-6">
                  <div className="inline-block h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                </td>
              </tr>
            ) : fetchError ? (
              <tr>
                <td colSpan="999" className="text-center py-6 text-red-600">
                  {fetchError}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan="999" className="text-center py-6">
                  No data found.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-blue-600">{r.employee_no}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${avatarBgClass(
                          r.employee_fullname || r.employee_no,
                        )}`}
                        title={r.employee_fullname}
                      >
                        {getInitials(r.employee_fullname || r.employee_no)}
                      </div>
                      <div className="leading-5">
                        <div className="font-semibold">
                          {r.employee_fullname || "—"}
                        </div>
                        <div className="text-xs text-gray-500 opacity-70">
                          {r.employee_email || "—"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{money(r.basic_salary)}</td>
                  <td className="p-3">{money(r.cola)}</td>
                  {dynamicColumns.map((col) => (
                    <td key={col.id} className="p-3">
                      {money(r[col.actual_column_name])}
                    </td>
                  ))}
                  <td className="p-3">{money(r.total_allowances)}</td>
                  <td className="p-3">{money(r.total_deductions)}</td>
                  <td className="p-3 font-semibold">{money(r.net_salary)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
    </div>
  );
}
