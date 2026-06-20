/** @format */
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import { FileText, Upload, X } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiFetch } from "../../../utils/apiClient";

const ViewIncentiveShift = ({ pageSize = 8, onRowClick }) => {
  const [searchFilter, setSearchFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const [serverCount, setServerCount] = useState(0);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [selectedCsvFile, setSelectedCsvFile] = useState(null);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const token = Cookies.get("accessToken");

  const params = new URLSearchParams(location.search);
  const orgId = params.get("org_id") || Cookies.get("organization_id");
  const currentApiYear =
    params.get("year") || new Date().getFullYear().toString();
  const currentApiMonth =
    params.get("month") || (new Date().getMonth() + 1).toString();

  let prevMonth = Number(currentApiMonth) - 1;
  let prevYear = Number(currentApiYear);

  const displayYear = currentApiYear;
  const displayMonth = String(currentApiMonth).padStart(2, "0");

  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }

  useEffect(() => {
    if (!orgId) return;

    const controller = new AbortController();

    const run = async () => {
      setIsLoading(true);
      setFetchError("");

      try {
        const params = new URLSearchParams({
          organization: String(orgId),
          year: String(displayYear),
          month: String(Number(displayMonth)),
          page: String(currentPage),
          limit: String(pageSize),
          payroll_group: "SECURITY",
        });

        if (searchFilter.trim()) {
          params.set("search", searchFilter.trim());
        }

        const res = await apiFetch(
          `${API_URL}/v1/hris/payroll/shift-summary/status?${params.toString()}`,
          {
            credentials: "include",
            signal: controller.signal,
          }
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const data = Array.isArray(json?.data) ? json.data : [];

        setRows(
          data.map((r, idx) => ({
            key: r.employee_no || idx,
            employee_no: r.employee_no ?? "-",
            employee_fullname: r.employee_fullname ?? "-",
            employee_email: r.employee_email ?? "",
            attendance: r.shift_uploaded ?? "NO",
            completed_shifts: r.completed_shifts ?? 0,
            location_type: r.location_type ?? "-",
            shift_summary_id: r.shift_summary_id ?? null,
          }))
        );

        setServerTotalPages(Number(json?.totalPages) || 1);
        setServerCount(Number(json?.count) || data.length || 0);

        if (
          Number(json?.totalPages) > 0 &&
          currentPage > Number(json?.totalPages)
        ) {
          setCurrentPage(1);
        }
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error("Fetch error:", e);
          setFetchError("Failed to load data.");
          setRows([]);
          setServerTotalPages(1);
          setServerCount(0);
        }
      } finally {
        setIsLoading(false);
      }
    };

    run();

    return () => controller.abort();
  }, [
    orgId,
    currentApiYear,
    currentApiMonth,
    displayYear,
    displayMonth,
    currentPage,
    searchFilter,
    pageSize,
    API_URL,
    token,
  ]);

  const handleCsvSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const isCsv =
      file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv");

    if (!isCsv) {
      toast.error("Please select a valid CSV file.");
      event.target.value = "";
      return;
    }

    setSelectedCsvFile(file);
  };

  const clearSelectedCsv = () => {
    setSelectedCsvFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCsvUpload = async () => {
    if (!selectedCsvFile) {
      toast.error("Please select a CSV file first.");
      return;
    }

    if (!orgId || !currentApiMonth || !currentApiYear) {
      toast.error("Organization, month, or year is missing from URL.");
      return;
    }

    const formData = new FormData();
    formData.append("organization_id", String(orgId));
    formData.append("month", String(Number(currentApiMonth)));
    formData.append("year", String(currentApiYear));
    formData.append("file", selectedCsvFile);

    try {
      setUploadingCsv(true);

      const res = await apiFetch(
        `${API_URL}/v1/hris/payroll/shift-summary/upload`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "CSV upload failed.");
      }

      const successCount = json?.summary?.success_count ?? 0;
      const failedCount = json?.summary?.failed_count ?? 0;

      if (failedCount > 0 && successCount === 0) {
        toast.warning(
          `${json.message} Success: ${successCount}, Failed: ${failedCount}`
        );
      } else {
        toast.success(
          `${json.message} Success: ${successCount}, Failed: ${failedCount}`
        );
      }

      clearSelectedCsv();
      setCurrentPage(1);
    } catch (error) {
      console.error("CSV upload error:", error);
      toast.error(error.message || "CSV upload failed.");
    } finally {
      setUploadingCsv(false);
    }
  };

  const formatFileSize = (bytes = 0) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const avatarBgClass = (seed = "") => {
    const palette = [
      "from-blue-500 to-blue-600",
      "from-purple-500 to-purple-600",
      "from-green-500 to-green-600",
      "from-pink-500 to-pink-600",
      "from-yellow-500 to-yellow-600",
      "from-teal-500 to-teal-600",
      "from-indigo-500 to-indigo-600",
    ];

    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }

    return palette[hash % palette.length];
  };

  const getInitials = (fullName = "") => {
    const tokens = String(fullName).trim().split(/\s+/);

    if (!tokens[0]) return "NA";
    if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();

    return (tokens[0][0] + tokens[tokens.length - 1][0]).toUpperCase();
  };

  const attendancePill = (status, employee_no) => {
    const s = String(status || "").toUpperCase();
    const isUploaded = s === "YES";

    const cls = isUploaded
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700 cursor-pointer";

    const label = isUploaded ? "Uploaded" : "Not Uploaded";

    const handleClick = (e) => {
      e.stopPropagation();

      if (!isUploaded) {
        const year = encodeURIComponent(displayYear);
        const month = encodeURIComponent(displayMonth);

        navigate(
          `/view-attendance-in-out?employeeId=${employee_no}&year=${year}&month=${month}&org_id=${orgId}`
        );
      }
    };



    return (
      <span
        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${cls}`}
        onClick={handleClick}
      >
        {label}
      </span>
    );

  };

  return (
    <div className="mx-5 mt-5 font-montserrat">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="flex items-center justify-between mb-5">
        <p className="text-[24px]">
          Payroll Navigation / Employee Shift upload
        </p>
      </div>

      <div className="shadow-lg p-5 rounded-lg bg-white">
        <div className="flex items-end justify-between">
          <p className="text-[20px] mb-4">
            {`Showing ${serverCount} record(s) for ${displayYear}-${displayMonth}`}
          </p>
        </div>

        <div className="flex justify-between flex-wrap gap-4 mb-4">
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Employee
            </label>
            <input
              type="text"
              className="border border-gray-300 rounded px-3 py-2 w-64"
              placeholder="Employee ID or Name"
              value={searchFilter}
              onChange={(e) => {
                setSearchFilter(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="flex items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCsvSelect}
            />

            <button
              type="button"
              disabled={uploadingCsv}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 rounded text-white hover:bg-blue-600 disabled:opacity-50"
            >
              <FileText size={16} />
              Choose CSV
            </button>
          </div>
        </div>

        {selectedCsvFile && (
          <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                  <FileText size={24} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedCsvFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(selectedCsvFile.size)} • CSV File
                  </p>
                  <p className="text-xs text-gray-500">
                    Organization: {orgId} | Month: {Number(currentApiMonth)} |
                    Year: {currentApiYear}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={uploadingCsv}
                  onClick={handleCsvUpload}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 rounded text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <Upload size={16} />
                  {uploadingCsv ? "Uploading..." : "Upload Selected CSV"}
                </button>

                <button
                  type="button"
                  disabled={uploadingCsv}
                  onClick={clearSelectedCsv}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  <X size={16} />
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
        <p className="text-sm text-red-600">*Click table row for view each employee details</p>

        <div className="mt-5 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
          {/* Employee Table */}

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full border-collapse bg-white text-left text-sm text-gray-700">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-900">
                    Employee Name / ID
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-900">
                    Attendance
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-6 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : fetchError ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-6 text-center text-red-600">
                      {fetchError}
                    </td>
                  </tr>
                ) : rows.length > 0 ? (
                  rows.map((employee) => (
                    <tr
                      key={employee.key}
                      className="hover:bg-blue-50 cursor-pointer"
                      onClick={() =>
                        navigate(
                          `/shiftemployeesummary?organization_id=${orgId}&employee_no=${employee.employee_no}`
                        )
                      }
                    >
                      <td className="px-4 py-2">
                        <div className="flex items-center">
                          <div className="relative flex-shrink-0">
                            <div className="absolute inset-0 rounded-full ring-2 ring-blue-500 ring-offset-2" />
                            <div
                              className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg bg-gradient-to-br ${avatarBgClass(
                                employee.employee_fullname || employee.employee_no
                              )}`}
                            >
                              {getInitials(
                                employee.employee_fullname || employee.employee_no
                              )}
                            </div>
                          </div>

                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.employee_fullname || "Unknown"}
                            </div>

                            <div className="text-xs text-gray-500">
                              Employee No: {employee.employee_no}
                            </div>

                            {employee.employee_email && (
                              <div className="text-xs text-gray-500">
                                {employee.employee_email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {attendancePill(employee.attendance, employee.employee_no)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-6 text-center">
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* CSV Template Card */}
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm">
            <div className="h-11 w-11 rounded-xl bg-blue-600 flex items-center justify-center text-white mb-3">
              <FileText size={22} />
            </div>

            <p className="text-sm font-semibold text-gray-900">Shift CSV Template</p>

            <p className="text-xs text-gray-500 mt-1 leading-5">
              Use this format when uploading completed shift details.
            </p>

            <div className="mt-4 rounded-xl border border-gray-200 bg-white overflow-hidden">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-2 py-2 border-b">employee_no</th>
                    <th className="px-2 py-2 border-b">shifts</th>
                    <th className="px-2 py-2 border-b">location</th>
                  </tr>
                </thead>

                <tbody className="text-gray-700">
                  <tr>
                    <td className="px-2 py-2 border-b">EMP133</td>
                    <td className="px-2 py-2 border-b">26</td>
                    <td className="px-2 py-2 border-b">COLOMBO</td>
                  </tr>

                  <tr>
                    <td className="px-2 py-2">EMP173</td>
                    <td className="px-2 py-2">30</td>
                    <td className="px-2 py-2">OUTSTATION</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <a
              href="/completed_shifts.csv"
              download="completed_shifts.csv"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <FileText size={16} />
              Download Template
            </a>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <button
            className="px-4 py-2 bg-blue-500 rounded text-white disabled:opacity-50 hover:bg-blue-600"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1 || isLoading}
          >
            Previous
          </button>

          <p>
            Page {Math.min(currentPage, serverTotalPages)} of{" "}
            {serverTotalPages}
          </p>

          <button
            className="px-4 py-2 bg-blue-500 rounded text-white disabled:opacity-50 hover:bg-blue-600"
            onClick={() =>
              setCurrentPage((p) => Math.min(serverTotalPages, p + 1))
            }
            disabled={currentPage >= serverTotalPages || isLoading}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewIncentiveShift;