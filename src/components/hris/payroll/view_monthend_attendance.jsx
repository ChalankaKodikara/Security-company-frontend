/** @format */
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import { apiFetch } from "../../../utils/apiClient";

const ViewMonthendAttendance = ({ pageSize = 8, onRowClick }) => {

  const [searchFilter, setSearchFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
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
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const [serverCount, setServerCount] = useState(0);

  /* -------------------- Fetch Employees (Filtered by org_id) -------------------- */
  useEffect(() => {
    if (!orgId) return; // Stop if no org id found

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
          payroll_group: "Ho",
        });


        if (searchFilter.trim()) params.set("search", searchFilter.trim());

        const res = await apiFetch(
          `${API_URL}/v1/hris/employees/employees/active?${params.toString()}`,
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
            attendance: r.attendance ?? "-",
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
    currentPage,
    searchFilter,
    pageSize,
    API_URL,
    token,
  ]);

  /* -------------------- Helpers -------------------- */
  const initials = (name) =>
    (name || "")
      .trim()
      .split(/\s+/)
      .map((n) => n[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "NA";

  const attendancePill = (status, employee_no) => {
    const s = String(status || "").toLowerCase();
    const isComplete = s === "complete";
    const cls = isComplete
      ? "bg-green-100 text-green-700"
      : "bg-gray-100 text-gray-700 cursor-pointer";
    const label = isComplete ? "Complete" : "Incomplete";

    const handleClick = () => {
      if (!isComplete && prevYear && prevMonth) {
        const year = encodeURIComponent(displayYear);
        const month = encodeURIComponent(displayMonth);

        navigate(
          `/view-attendance-in-out?employeeId=${employee_no}&year=${year}&month=${month}&org_id=${orgId}`
        );
      }
    };

    return (
      <span
        className={`inline-block px-3 py-1 rounded-full text-sm ${cls}`}
        onClick={handleClick}
      >
        {label}
      </span>
    );
  };

  /* -------------------- UI -------------------- */
  return (
    <div className="mx-5 mt-5 font-montserrat">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-[24px]">Payroll Navigation / Payroll Attendance</p>

      </div>

      <div className="shadow-lg p-5 rounded-lg bg-white w-[70%]">
        <div className="flex items-end justify-between">
          <p className="text-[20px] mb-4">
            {`Showing ${serverCount} record(s) for ${displayYear}-${displayMonth}`}
          </p>
        </div>

        {/* Filter Field (Search only) */}
        <div className="flex flex-wrap gap-4 mb-4">
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
        </div>

        {/* Table */}
        <div className="mt-5">
          <table className="w-full border-collapse bg-white text-left text-sm text-gray-700">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-900">
                  Employee ID
                </th>
                <th className="px-6 py-3 font-medium text-gray-900">
                  Employee Name
                </th>
                <th className="px-6 py-3 font-medium text-gray-900">
                  Attendances
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-6 text-center">
                    Loading...
                  </td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-6 text-center text-red-600"
                  >
                    {fetchError}
                  </td>
                </tr>
              ) : rows.length > 0 ? (
                rows.map((employee) => (
                  <tr
                    key={employee.key}
                    className="hover:bg-blue-50 cursor-pointer"
                    onClick={() => onRowClick?.(employee)}
                  >
                    <td className="px-6 py-4">{employee.employee_no}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 flex-shrink-0 rounded-full bg-blue-300 flex items-center justify-center text-white font-bold">
                          {initials(employee.employee_fullname)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.employee_fullname || "Unknown"}
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
                      {attendancePill(
                        employee.attendance,
                        employee.employee_no
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-6 text-center">
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <button
            className="px-4 py-2 bg-blue-500 rounded text-white disabled:opacity-50 hover:bg-blue-600"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1 || isLoading}
          >
            Previous
          </button>

          <p>
            Page {Math.min(currentPage, serverTotalPages)} of {serverTotalPages}
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

export default ViewMonthendAttendance;
