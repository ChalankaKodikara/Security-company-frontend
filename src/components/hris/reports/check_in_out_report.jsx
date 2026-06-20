/** @format */

import React, { useState, useEffect } from "react";
import moment from "moment";
import { saveAs } from "file-saver";
import { MdOutlineFileDownload } from "react-icons/md";
import Cookies from "js-cookie"; // Import Cookies to get the auth token
import Select from "react-select"; // Import react-select
const statusOptions = [
  "Leave",
  "Half day",
  "Short leave",
  "Normal day",
  "LateIn/Normal day",
  "Short in / Normal day",
  "Halfin/normal day",
];

const checkInTypeOptions = [
  "Normal check-in",
  "short-in",
  "Late-in",
  "Half-in",
];

const checkOutTypeOptions = [
  "Normal check-out",
  "early-out",
  "short-out",
  "half-out",
];

const CheckinCheckoutReportTable = ({ selectedDate }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);

  const [startDate, setStartDate] = useState(
    selectedDate || moment().format("YYYY-MM-DD"),
  );
  const [endDate, setEndDate] = useState(moment().format("YYYY-MM-DD"));

  // 🔹 unified search (replaces employee_no)
  const [search, setSearch] = useState("");

  const [checkInType, setCheckInType] = useState("");
  const [checkOutType, setCheckOutType] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [isExporting, setIsExporting] = useState(false); //exprt
  const [organizationOptions, setOrganizationOptions] = useState([]); // New state for organization options
  const [selectedOrganizationFilter, setSelectedOrganizationFilter] =
    useState(""); // New state for selected organization
  const rowsPerPage = 10;
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  // Fetch organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const authToken = Cookies.get("accessToken");
        const res = await fetch(
          `${API_URL}/v1/hris/organizations/organization`,
          {
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
            credentials: "include",
          },
        );

        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setOrganizationOptions(
            json.data.map((org) => ({
              value: org.id,
              label: org.organization_name,
            })),
          );
        }
      } catch (err) {
        console.error("Failed to fetch organizations", err);
      }
    };

    fetchOrganizations();
  }, [API_URL]);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          from: moment(startDate).format("YYYY-MM-DD"),
          to: moment(endDate).format("YYYY-MM-DD"),
          page: currentPage,
          limit: rowsPerPage,
        });

        if (search) params.append("search", search); //  unified search
        if (checkInType) params.append("check_in_type", checkInType);
        if (checkOutType) params.append("check_out_type", checkOutType);
        if (statusFilter) params.append("status", statusFilter);
        if (selectedOrganizationFilter)
          params.append("organization", selectedOrganizationFilter);
        const response = await fetch(
          `${API_URL}/v1/hris/new-attendence/by-date-range?${params.toString()}`,
        );

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();
        setAttendanceData(result.data || []);
        setTotalPages(result.totalPages || 0);
        setTotalRecords(result.total || 0);
      } catch (err) {
        setError(err.message);
        setAttendanceData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [
    startDate,
    endDate,
    currentPage,
    search,
    checkInType,
    checkOutType,
    statusFilter,
    selectedOrganizationFilter,
  ]);

  // ====== Styling helpers ======
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

  const getStatusStyle = (status) => {
    if (!status) return "bg-gray-200 text-gray-800";
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes("half day"))
      return "bg-yellow-100 text-yellow-800";
    if (lowerStatus.includes("leave")) return "bg-purple-100 text-purple-800";
    if (lowerStatus.includes("normal day")) return "bg-blue-100 text-blue-800";
    return "bg-gray-200 text-gray-800";
  };

  const getCheckoutTypeStyle = (checkoutType) => {
    if (!checkoutType) return "bg-gray-200 text-gray-800";
    switch (checkoutType.toLowerCase()) {
      case "normal check-out":
        return "bg-green-100 text-green-800";
      case "early-out":
        return "bg-orange-100 text-orange-800";
      case "short-out":
        return "bg-red-100 text-red-800";
      case "half-out":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  const getCheckinTypeStyle = (checkinType) => {
    if (!checkinType) return "bg-gray-200 text-gray-800";
    switch (checkinType.toLowerCase()) {
      case "normal check-in":
        return "bg-green-100 text-green-800";
      case "short-in":
        return "bg-red-100 text-red-800";
      case "late-in":
        return "bg-orange-100 text-orange-800";
      case "half-in":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  // ===== CSV Export =====
  const exportToCSV = async () => {
    if (totalRecords === 0) {
      alert("No data to export.");
      return;
    }

    setIsExporting(true);

    try {
      const params = new URLSearchParams({
        from: moment(startDate).format("YYYY-MM-DD"),
        to: moment(endDate).format("YYYY-MM-DD"),
      });
      if (search) params.append("search", search);
      if (checkInType) params.append("check_in_type", checkInType);
      if (checkOutType) params.append("check_out_type", checkOutType);
      if (statusFilter) params.append("status", statusFilter);

      const response = await fetch(
        `${API_URL}/v1/hris/new-attendence/by-date-range?${params.toString()}`,
      );
      if (!response.ok)
        throw new Error("Failed to fetch full data for export.");

      const result = await response.json();
      const allData = result.data || [];

      if (allData.length === 0) {
        alert("No data found for the selected filters.");
        return;
      }

      const headers = [
        "Employee No",
        "Employee Name",
        "Active Status",
        "Date",
        "Check-in Time",
        "Check-in Type",
        "Check-out Time",
        "Check-out Type",
        "Status",
        "OT",
        "Address",
      ];
      const csvRows = [headers.join(",")];

      for (const row of allData) {
        const values = [
          row.employee_no,
          row.employee_fullname,
          row.employee_active_status,
          row.date,
          row.check_in_time,
          row.check_in_type,
          row.check_out_time,
          row.check_out_type,
          row.status,
          row.OT,
          row.address,
        ].map((value) => `"${String(value || "N/A").replace(/"/g, '""')}"`);
        csvRows.push(values.join(","));
      }

      const csvString = csvRows.join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, `attendance_report_${moment().format("YYYY-MM-DD")}.csv`);
    } catch (err) {
      console.error("CSV Export Error:", err);
      alert("An error occurred while exporting the data.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-5 rounded-xl">
      {/* 🔹 Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div>
          <label className="text-sm font-medium text-gray-700">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="self-end">
          <input
            type="text"
            placeholder="Search by Employee No / Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="self-end">
          <select
            value={checkInType}
            onChange={(e) => setCheckInType(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Check-in Types</option>
            {checkInTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="self-end">
          <select
            value={checkOutType}
            onChange={(e) => setCheckOutType(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Check-out Types</option>
            {checkOutTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="self-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full">
          <Select
            options={organizationOptions}
            placeholder="Select Organization"
            value={
              organizationOptions.find(
                (opt) => opt.value === Number(selectedOrganizationFilter),
              ) || null
            }
            onChange={(opt) => {
              setSelectedOrganizationFilter(opt ? opt.value : "");
              setCurrentPage(1); // Reset page on organization change
            }}
            isClearable
            className="basic-single"
            classNamePrefix="select"
          />
        </div>
      </div>

      {/* Export */}
      <div className="flex justify-start mb-4">
        <button
          onClick={exportToCSV}
          disabled={isExporting}
          className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <MdOutlineFileDownload size={20} />
          <span>{isExporting ? "Exporting..." : "Export CSV"}</span>
        </button>
      </div>

      {/* ===== Table ===== */}
      <div className="overflow-x-auto bg-white shadow p-2 rounded-xl">
        <div className="table-container">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-gray-600 border-b border-t">
              <tr>
                <th className="px-6 py-4">Employee No</th>
                <th className="px-6 py-4">Employee Name</th>
                <th className="px-6 py-4">Active Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Check-in Time</th>
                <th className="px-6 py-4">Check-in Type</th>
                <th className="px-6 py-4">Check-out Time</th>
                <th className="px-6 py-4">Check-out Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">OT</th>
                <th className="px-6 py-4">Check-in Address</th>
                <th className="px-6 py-4">Check-out Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 border-t border-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="12" className="text-center py-4 text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="12" className="text-center py-4 text-red-500">
                    Error: {error}
                  </td>
                </tr>
              ) : attendanceData.length > 0 ? (
                attendanceData.map((row, index) => (
                  <tr
                    key={`${row.employee_id}-${row.date}-${index}`}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-3 text-blue-600">{row.employee_no}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0 ${avatarBgClass(
                            row.employee_fullname || row.employee_no,
                          )}`}
                          title={row.employee_fullname}
                        >
                          {getInitials(
                            row.employee_fullname || row.employee_no,
                          )}
                        </div>
                        <div>
                          <div className="font-semibold leading-5">
                            {row.employee_fullname}
                          </div>
                          <div className="text-xs text-gray-500">
                            EMP ID: {row.employee_no}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      {row.employee_active_status || "N/A"}
                    </td>
                    <td className="p-3">{row.date || "N/A"}</td>
                    <td className="p-3">{row.check_in_time || "N/A"}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`p-2 rounded-md capitalize ${getCheckinTypeStyle(
                          row.check_in_type,
                        )}`}
                      >
                        {row.check_in_type || "N/A"}
                      </span>
                    </td>
                    <td className="p-3">{row.check_out_time || "N/A"}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`p-2 rounded-md capitalize ${getCheckoutTypeStyle(
                          row.check_out_type,
                        )}`}
                      >
                        {row.check_out_type || "N/A"}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`p-2 rounded-md capitalize ${getStatusStyle(
                          row.status,
                        )}`}
                      >
                        {row.status || "N/A"}
                      </span>
                    </td>
                    <td className="p-3">{row.OT || "N/A"}</td>
                    <td className="p-3">{row.check_in_address || "N/A"}</td>
                    <td className="p-3">{row.check_out_address || "N/A"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="12" className="text-center py-4 text-gray-500">
                    No data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <div>
          <span className="text-sm text-gray-700">
            Showing {totalRecords > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}{" "}
            to {Math.min(currentPage * rowsPerPage, totalRecords)} of{" "}
            {totalRecords} results
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages > 0 ? totalPages : 1}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0 || loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckinCheckoutReportTable;
