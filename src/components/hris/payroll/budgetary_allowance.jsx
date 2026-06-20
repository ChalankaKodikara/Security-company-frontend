// BudgetaryAllowance.jsx
import React, { useEffect, useRef, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select"; // Import react-select
import Cookies from "js-cookie";
import * as XLSX from "xlsx";
import { apiFetch } from "../../../utils/apiClient";

const API_URL = process.env.REACT_APP_FRONTEND_URL;
const token = Cookies.get("accessToken"); // Get token from cookies

/* Helpers */
const getInitials = (nameOrSeed = "") => {
  const s = String(nameOrSeed || "").trim();
  if (!s) return "??";
  const tokens = s
    .replace(/[^\p{L}\p{N}\s'-]/gu, "")
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return (s.slice(0, 2) || "??").toUpperCase();
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
const formatCurrency = (v) =>
  v != null && v !== ""
    ? `Rs. ${Number(v).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
    : "—";
const formatBytes = (b = 0) => {
  if (!b) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${(b / Math.pow(1024, i)).toFixed(1)} ${u[i]}`;
};

const BudgetaryAllowance = () => {

  const downloadSampleExcel = () => {
    const data = [
      {
        employee_no: "EMP00001",
        budget1: 5000,
        budget2: 0,
      },
      {
        employee_no: "EMP00002",
        budget1: 4500,
        budget2: 1000,
      },
    ];

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Budgetary Allowance");

    // Auto column width
    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
    ];

    // Download
    XLSX.writeFile(workbook, "budgetary-allowance-sample.xlsx");
  };

  /* Table state */
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  /* Filter (server-side) */
  const [searchFilter, setSearchFilter] = useState(""); // Combined search
  const [organizationOptions, setOrganizationOptions] = useState([]);
  const [selectedOrganizationFilter, setSelectedOrganizationFilter] = useState(null);

  /* Pagination (server-side) */
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  /* Upload state */
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  /* Initial-load success toast suppression */
  const isFirstLoadRef = useRef(true);

  const MAX_CSV_SIZE = 5 * 1024 * 1024; // 5MB
  const suggestedName = "Budgetary Allowance";

  /* Fetch Organizations */
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const res = await apiFetch(`${API_URL}/v1/hris/organizations/organization`, {
         
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json?.success && Array.isArray(json.data)) {
          setOrganizationOptions(json.data.map(org => ({
            value: org.id,
            label: org.organization_name
          })));
        }
      } catch (e) {
        console.error("Failed to load organizations:", e);
      }
    };
    fetchOrganizations();
  }, [API_URL, token]);


  /* Central fetcher */
  const fetchRows = async ({
    page = currentPage,
    limit = pageSize,
    search = searchFilter, // Use searchFilter for search
    organization = selectedOrganizationFilter?.value, // Use selectedOrganizationFilter
    notifySuccess = true,
  } = {}) => {
    setIsLoading(true);
    setFetchError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search && search.trim()) params.set("search", search.trim());
      if (organization) params.set("organization", organization);

      const res = await apiFetch(
        `${API_URL}/v1/hris/budgetary-allowances?${params.toString()}`,
        {
         
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const data = Array.isArray(json?.data) ? json.data : [];
      const pg = json?.pagination || {};

      setRows(data);
      setTotalRecords(Number(pg.totalRecords ?? data.length ?? 0));
      setTotalPages(
        Number(
          pg.totalPages ??
          Math.max(1, Math.ceil((pg.totalRecords ?? data.length) / limit))
        )
      );
      if (pg.currentPage) setCurrentPage(Number(pg.currentPage));
    } catch (err) {
      console.error(err);
      setRows([]);
      setTotalRecords(0);
      setTotalPages(1);
      setFetchError("Failed to load budgetary allowances.");
      toast.error("Failed to load budgetary allowances. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* Initial + reactive fetch */
  useEffect(() => {
    const notify = !isFirstLoadRef.current;
    fetchRows({ notifySuccess: notify });
    if (isFirstLoadRef.current) isFirstLoadRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchFilter, selectedOrganizationFilter, currentPage, pageSize, API_URL, token]); // Added API_URL and token

  /* Handlers: filter + pagination */
  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset page on new filter application
    // fetchRows will be called by the useEffect due to searchFilter or selectedOrganizationFilter change
  };
  const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNextPage = () =>
    setCurrentPage((p) => Math.min(totalPages, p + 1));

  /* Upload handlers */
  const pickFile = (f) => {
    if (!f) {
      setUploadFile(null);
      return;
    }
    if (!/\.csv$/i.test(f.name)) {
      toast.warn("File must be a .csv");
      return;
    }
    if (f.size > MAX_CSV_SIZE) {
      toast.warn(`Max size ${formatBytes(MAX_CSV_SIZE)}`);
      return;
    }
    setUploadFile(f);
  };
  const handleFileChange = (e) => pickFile(e.target.files?.[0]);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const clearFile = () => {
    setUploadFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const downloadSampleCSV = () => {
    const csv =
      "employee_no,budget1,budget2\nEMP00001,5000,0\nEMP00002,4500,1000\n";
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "budgetary-allowances-sample.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.warn("Please choose a CSV file first.");
      return;
    }

    const fd = new FormData();
    fd.append("file", uploadFile);

    try {
      setIsUploading(true);

      const res = await apiFetch(
        `${API_URL}/v1/hris/budgetary-allowances/upload-csv`,
        {
          method: "POST",
          body: fd,
          credentials: "include",
         
        }
      );

      const json = await res.json();

      if (res.ok) {
        //  Success message
        if (json.message) {
          toast.success(`${json.message} · Inserted: ${json.inserted ?? 0}`, {
            autoClose: 2500,
          });
        }

        // ⚠️ Show each error separately if present
        if (Array.isArray(json.errors) && json.errors.length > 0) {
          json.errors.forEach((err) => {
            toast.error(`Employee ${err.employee_no}: ${err.error}`, {
              autoClose: 4000,
            });
          });
        }

        clearFile();
        setCurrentPage(1);
        await fetchRows({ page: 1, notifySuccess: false });
      } else {
        toast.error(json.message || "Upload failed", { autoClose: 2500 });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload CSV. Please try again.", {
        autoClose: 2500,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mt-5 font-montserrat">
      <p className="text-[25px] mb-5">
        Payroll Navigation / Payroll Allowance / Budgetary Allowance
      </p>

      <div className="shadow-lg p-5 rounded-lg bg-white w-[100%]">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4 items-end">
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Employee
            </label>
            <input
              type="text"
              className="border border-gray-300 rounded px-3 py-2 w-64"
              placeholder="e.g. EMP03583 or Employee Name"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organization
            </label>
            <Select
              options={organizationOptions}
              placeholder="Select Organization"
              value={selectedOrganizationFilter}
              onChange={(opt) => setSelectedOrganizationFilter(opt)}
              isClearable
              className="w-64"
              classNamePrefix="select"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleApplyFilters}
              disabled={isLoading}
            >
              Search
            </button>
          </div>

          {/* Page size */}
          <div className="flex items-end ml-auto"> {/* Adjusted for alignment */}
            <label className="mr-2 text-sm text-gray-700">Page size</label>
            <select
              className="border border-gray-300 rounded px-3 py-2"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value) || 10);
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="mt-5">
          <div className="table-container">
            <table className="w-full border-collapse bg-white text-left text-sm text-gray-700">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-900">
                    Employee ID
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-900">
                    Employee
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-900">
                    Budget 1
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-900">
                    Budget 2
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td className="px-6 py-6 text-center" colSpan={4}>
                      <div className="inline-block h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                    </td>
                  </tr>
                ) : fetchError ? (
                  <tr>
                    <td
                      className="px-6 py-6 text-center text-red-600"
                      colSpan={4}
                    >
                      {fetchError}
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td className="px-6 py-6 text-center" colSpan={4}>
                      No records found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const emp = row.Employee || {};
                    const displayName =
                      emp.employee_fullname || row.employee_no || "—";
                    return (
                      <tr key={row.id} className="hover:bg-blue-50">
                        <td className="px-6 py-4">{row.employee_no}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-8 w-8 flex-shrink-0 rounded-full ${avatarBgClass(
                                displayName
                              )} flex items-center justify-center text-white font-bold text-xs`}
                              title={displayName}
                            >
                              {getInitials(displayName)}
                            </div>
                            <div className="leading-5">
                              <div className="text-sm font-semibold text-gray-900">
                                {displayName}
                              </div>
                              {emp.employee_basic_salary && (
                                <div className="text-xs text-gray-500">
                                  Basic:{" "}
                                  {formatCurrency(emp.employee_basic_salary)}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {formatCurrency(row.budget1)}
                        </td>
                        <td className="px-6 py-4">
                          {formatCurrency(row.budget2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between mt-4">
          <button
            className="px-4 py-2 bg-blue-500 rounded text-white hover:bg-blue-600 disabled:opacity-50"
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || isLoading}
          >
            Previous
          </button>
          <p>
            Page {currentPage} of {totalPages} · {totalRecords} record(s)
          </p>
          <button
            className="px-4 py-2 bg-blue-500 rounded text-white hover:bg-blue-600 disabled:opacity-50"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages || isLoading}
          >
            Next
          </button>
        </div>
      </div>

      {/* CSV Upload (polished) */}
      <div className="mt-5 flex justify-startml-auto w-full sm:w-[420px]">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={[
            "relative rounded-2xl border-2 p-5 transition shadow-sm",
            "bg-gray-50 border-dashed border-gray-300",
            isDragging ? "border-blue-500 bg-blue-50" : "",
          ].join(" ")}
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-6 w-6"
            >
              <path
                d="M12 16V7m0 0l-3.5 3.5M12 7l3.5 3.5M5 16a4 4 0 014-4h6a4 4 0 014 4v2H5v-2z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          <p className="text-center text-sm text-gray-700">
            <span className="font-semibold">Drag & drop</span> your CSV here, or
            <label className="mx-1 inline-block cursor-pointer text-blue-600 hover:underline">
              browse
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </p>
          <p className="mt-1 text-center text-xs text-gray-500">
            Accepted: .csv · Max {formatBytes(MAX_CSV_SIZE)}
          </p>
          <div className="mt-4 flex items-center justify-between">
            

            <button
              type="button"
              onClick={downloadSampleExcel}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Download Sample Excel
            </button>
          </div>

          {/* Selected file chip / sample */}
          {uploadFile ? (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-gray-200">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-gray-900">
                  {uploadFile.name}
                </div>
                <div className="text-xs text-gray-500">
                  {formatBytes(uploadFile.size)}
                </div>
              </div>
              <button
                type="button"
                onClick={clearFile}
                className="ml-3 rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
                title="Remove file"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Columns: <code>employee_no, budget1, budget2</code>
              </span>
            </div>
          )}

          {/* Upload button */}
          <div className="mt-4 flex items-center justify-end">
            <button
              type="button"
              onClick={handleUpload}
              disabled={!uploadFile || isUploading}
              className={[
                "inline-flex items-center rounded-lg px-4 py-2 text-white",
                "bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50",
                "shadow-sm",
              ].join(" ")}
            >
              {isUploading ? (
                <>
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="white"
                      strokeWidth="4"
                      fill="none"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="white"
                      d="M4 12a8 8 0 018-8v4l3.5-3.5L12 0v4a8 8 0 000 16v4l3.5-3.5L12 20v4a12 12 0 110-24z"
                    />
                  </svg>
                  Uploading…
                </>
              ) : (
                "Upload CSV"
              )}
            </button>
          </div>

          {/* Indeterminate progress bar */}
          {isUploading && (
            <div className="absolute inset-x-0 bottom-0 h-1 overflow-hidden rounded-b-2xl">
              <div className="h-full w-1/2 animate-[progress_1.2s_ease-in-out_infinite] bg-emerald-500"></div>
            </div>
          )}
        </div>
      </div>

      {/* One-off keyframes for the upload bar */}
      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(50%); }
          100% { transform: translateX(200%); }
        }
      `}</style>

      <ToastContainer position="top-right" autoClose={1800} />
    </div>
  );
};

export default BudgetaryAllowance;