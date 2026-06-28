/** @format */

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import {
  Search,
  Users,
  CalendarDays,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { apiFetch } from "../../../utils/apiClient";

const ViewIncentiveAttendance = ({ pageSize = 8, onRowClick }) => {
  const [searchFilter, setSearchFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const [serverCount, setServerCount] = useState(0);

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

  const displayYear = currentApiYear;
  const displayMonth = String(currentApiMonth).padStart(2, "0");

  const fetchEmployees = async (signal = undefined) => {
    if (!orgId) return;

    setIsLoading(true);
    setFetchError("");

    try {
      const query = new URLSearchParams({
        organization: String(orgId),
        year: String(displayYear),
        month: String(Number(displayMonth)),
        page: String(currentPage),
        limit: String(pageSize),
        payroll_group: "SECURITY",
      });

      if (searchFilter.trim()) {
        query.set("search", searchFilter.trim());
      }

      const res = await apiFetch(
        `${API_URL}/v1/hris/employees/employees/active?${query.toString()}`,
        {
          credentials: "include",
          signal,
        },
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
        })),
      );

      const totalPages = Number(json?.totalPages) || 1;
      const count = Number(json?.count) || data.length || 0;

      setServerTotalPages(totalPages);
      setServerCount(count);

      if (totalPages > 0 && currentPage > totalPages) {
        setCurrentPage(1);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Fetch error:", error);
        setFetchError("Failed to load incentive attendance data.");
        setRows([]);
        setServerTotalPages(1);
        setServerCount(0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchEmployees(controller.signal);
    return () => controller.abort();
  }, [
    orgId,
    currentApiYear,
    currentApiMonth,
    currentPage,
    pageSize,
    API_URL,
    token,
  ]);

  useEffect(() => {
    const delay = setTimeout(() => {
      setCurrentPage(1);
      fetchEmployees();
    }, 400);

    return () => clearTimeout(delay);
  }, [searchFilter]);

  const initials = (name) =>
    (name || "")
      .trim()
      .split(/\s+/)
      .map((n) => n[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "NA";

  const completedCount = useMemo(
    () =>
      rows.filter(
        (r) => String(r.attendance || "").toLowerCase() === "complete",
      ).length,
    [rows],
  );

  const incompleteCount = rows.length - completedCount;

  const goToAttendance = (employee) => {
    const isComplete =
      String(employee.attendance || "").toLowerCase() === "complete";

    navigate(
      `/view-attendance-in-out?employeeId=${employee.employee_no}&year=${displayYear}&month=${displayMonth}&org_id=${orgId}&mode=${
        isComplete ? "view" : "edit"
      }`,
    );
  };

  const attendanceBadge = (status) => {
    const isComplete = String(status || "").toLowerCase() === "complete";

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
          isComplete
            ? "bg-green-100 text-green-700"
            : "bg-amber-100 text-amber-700"
        }`}
      >
        {isComplete ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
        {isComplete ? "Complete" : "Incomplete"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-montserrat">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-slate-500">
            Payroll Navigation / Incentive Attendance
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Security Incentive Attendance
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Showing security attendance for {displayYear}-{displayMonth}
          </p>
        </div>

        <button
          onClick={() => fetchEmployees()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-50"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
              <Users size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Security Staff</p>
              <p className="text-2xl font-bold text-slate-900">{serverCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-100 p-3 text-green-700">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Completed</p>
              <p className="text-2xl font-bold text-slate-900">
                {completedCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Need Review</p>
              <p className="text-2xl font-bold text-slate-900">
                {incompleteCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Security Employee Attendance Status
            </h2>
            <p className="text-sm text-slate-500">
              Click incomplete employees to review security shift attendance.
            </p>
          </div>

          <div className="relative w-full lg:w-96">
            <Search
              size={18}
              className="absolute left-3 top-3 text-slate-400"
            />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search employee no, name, or email..."
              className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-5 py-4">Employee No</th>
                <th className="px-5 py-4">Security Employee</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Attendance</th>
                <th className="px-5 py-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    Loading security employees...
                  </td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-red-600"
                  >
                    {fetchError}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    No security attendance records found.
                  </td>
                </tr>
              ) : (
                rows.map((employee) => {
                  const isComplete =
                    String(employee.attendance || "").toLowerCase() ===
                    "complete";

                  return (
                    <tr
                      key={employee.key}
                      onClick={() => goToAttendance(employee)}
                      className={`transition ${
                        isComplete
                          ? "cursor-default bg-white"
                          : "cursor-pointer hover:bg-blue-50"
                      }`}
                    >
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {employee.employee_no}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                            {initials(employee.employee_fullname)}
                          </div>

                          <div>
                            <p className="font-medium text-slate-900">
                              {employee.employee_fullname || "Unknown"}
                            </p>
                            <p className="text-xs text-slate-500">
                              Security Staff
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {employee.employee_email || "—"}
                      </td>

                      <td className="px-5 py-4">
                        {attendanceBadge(employee.attendance)}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            goToAttendance(employee);
                          }}
                          className={`rounded-lg px-4 py-2 text-sm font-medium ${
                            isComplete
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        >
                          {isComplete ? "View" : "Review"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t p-5 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <p>
            Page {Math.min(currentPage, serverTotalPages)} of {serverTotalPages}{" "}
            · {serverCount} records
          </p>

          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-1 rounded-lg border px-4 py-2 disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isLoading}
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <button
              className="inline-flex items-center gap-1 rounded-lg border px-4 py-2 disabled:opacity-50"
              onClick={() =>
                setCurrentPage((p) => Math.min(serverTotalPages, p + 1))
              }
              disabled={currentPage >= serverTotalPages || isLoading}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewIncentiveAttendance;
