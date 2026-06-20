/** @format */

import React, { useState, useEffect } from "react";
import moment from "moment";
import { saveAs } from "file-saver";
import Cookies from "js-cookie";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Search,
  Download,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import { apiFetch } from "../../../utils/apiClient";

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
  const [showFilters, setShowFilters] = useState(true);

  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [startDate, setStartDate] = useState(
    selectedDate || moment().format("YYYY-MM-DD"),
  );
  const [endDate, setEndDate] = useState(moment().format("YYYY-MM-DD"));
  const [search, setSearch] = useState("");
  const [checkInType, setCheckInType] = useState("");
  const [checkOutType, setCheckOutType] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [organizationOptions, setOrganizationOptions] = useState([]);
  const [selectedOrganizationFilter, setSelectedOrganizationFilter] =
    useState("");

  const rowsPerPage = 10;
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const res = await apiFetch(
          `${API_URL}/v1/hris/organizations/organization`,
          { method: "GET" },
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

        if (search) params.append("search", search);
        if (checkInType) params.append("check_in_type", checkInType);
        if (checkOutType) params.append("check_out_type", checkOutType);
        if (statusFilter) params.append("status", statusFilter);
        if (selectedOrganizationFilter)
          params.append("organization_id", selectedOrganizationFilter);

        const response = await apiFetch(
          `${API_URL}/v1/hris/new-attendence/by-date-range?${params.toString()}`,
          { method: "GET" },
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

  const avatarBgClass = (seed = "") => {
    const palette = [
      "from-blue-500 to-blue-600",
      "from-purple-500 to-purple-600",
      "from-green-500 to-green-600",
      "from-pink-500 to-pink-600",
      "from-yellow-500 to-yellow-600",
      "from-teal-500 to-teal-600",
      "from-indigo-500 to-indigo-600",
      "from-red-500 to-red-600",
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
    if (!status) return "bg-gray-100 text-gray-700 border border-gray-300";
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes("half day"))
      return "bg-yellow-100 text-yellow-700 border border-yellow-300";
    if (lowerStatus.includes("leave"))
      return "bg-purple-100 text-purple-700 border border-purple-300";
    if (lowerStatus.includes("normal day"))
      return "bg-blue-100 text-blue-700 border border-blue-300";
    return "bg-gray-100 text-gray-700 border border-gray-300";
  };

  const getCheckoutTypeStyle = (checkoutType) => {
    if (!checkoutType)
      return "bg-gray-100 text-gray-700 border border-gray-300";
    switch (checkoutType.toLowerCase()) {
      case "normal check-out":
        return "bg-green-100 text-green-700 border border-green-300";
      case "early-out":
        return "bg-orange-100 text-orange-700 border border-orange-300";
      case "short-out":
        return "bg-red-100 text-red-700 border border-red-300";
      case "half-out":
        return "bg-indigo-100 text-indigo-700 border border-indigo-300";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-300";
    }
  };

  const getCheckinTypeStyle = (checkinType) => {
    if (!checkinType) return "bg-gray-100 text-gray-700 border border-gray-300";
    switch (checkinType.toLowerCase()) {
      case "normal check-in":
        return "bg-green-100 text-green-700 border border-green-300";
      case "short-in":
        return "bg-red-100 text-red-700 border border-red-300";
      case "late-in":
        return "bg-orange-100 text-orange-700 border border-orange-300";
      case "half-in":
        return "bg-indigo-100 text-indigo-700 border border-indigo-300";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-300";
    }
  };

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

      const response = await apiFetch(
        `${API_URL}/v1/hris/new-attendence/by-date-range?${params.toString()}`,
        { method: "GET" },
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

  const customSelectStyles = {
    control: (base) => ({
      ...base,
      borderRadius: "12px",
      border: "2px solid #e5e7eb",
      boxShadow: "none",
      padding: "4px",
      "&:hover": {
        border: "2px solid #3b82f6",
      },
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "12px",
      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Attendance Report
                </h1>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <Clock size={16} />
                  {totalRecords} attendance records
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl shadow-lg border-2 border-gray-200 hover:border-blue-500 transition-all"
              >
                <Filter size={20} className="text-blue-600" />
                <span className="font-semibold text-gray-700">
                  {showFilters ? "Hide" : "Show"} Filters
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportToCSV}
                disabled={isExporting || totalRecords === 0}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={20} />
                <span className="font-semibold">
                  {isExporting ? "Exporting..." : "Export CSV"}
                </span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <Filter size={20} />
                  Filter Options
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Date From */}
                  <div>
                    <label className=" text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar size={16} />
                      From Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>

                  {/* Date To */}
                  <div>
                    <label className=" text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar size={16} />
                      To Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>

                  {/* Search */}
                  <div>
                    <label className=" text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Search size={16} />
                      Search
                    </label>
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        type="text"
                        placeholder="Employee No / Name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                  {/* test */}
                  {/* Organization */}
                  <div className="z-10">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Organization
                    </label>

                    <Select
                      options={organizationOptions}
                      placeholder="Select Organization"
                      value={
                        organizationOptions.find(
                          (opt) =>
                            opt.value === Number(selectedOrganizationFilter),
                        ) || null
                      }
                      onChange={(opt) => {
                        setSelectedOrganizationFilter(opt ? opt.value : "");
                        setCurrentPage(1);
                      }}
                      isClearable
                      styles={{
                        ...customSelectStyles,
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                        menu: (base) => ({ ...base, zIndex: 9999 }),
                      }}
                      menuPortalTarget={document.body}
                    />
                  </div>

                  {/* Check-in Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Check-in Type
                    </label>
                    <select
                      value={checkInType}
                      onChange={(e) => setCheckInType(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="">All Types</option>
                      {checkInTypeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Check-out Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Check-out Type
                    </label>
                    <select
                      value={checkOutType}
                      onChange={(e) => setCheckOutType(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="">All Types</option>
                      {checkOutTypeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="">All Statuses</option>
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Reset Button */}
                  <div className="flex items-end">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSearch("");
                        setCheckInType("");
                        setCheckOutType("");
                        setStatusFilter("");
                        setSelectedOrganizationFilter("");
                        setCurrentPage(1);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:from-red-600 hover:to-pink-600 transition-all"
                    >
                      <RefreshCw size={18} />
                      Reset
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Employee Name
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Check-in Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[180px]">
                    Check-in Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Check-out Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[230px]">
                    Check-out Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[230px]">
                    Status
                  </th>

                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Check-in Address
                  </th>
                  <th className="px-3 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Check-out Address
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="12" className="text-center py-12">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"
                      />
                      <p className="text-gray-500 mt-4 font-medium">
                        Loading attendance data...
                      </p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="12" className="text-center py-12">
                      <div className="p-4 bg-red-50 rounded-xl inline-block">
                        <p className="text-red-600 font-semibold">
                          Error: {error}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : attendanceData.length > 0 ? (
                  attendanceData.map((row, index) => (
                    <motion.tr
                      key={`${row.employee_id}-${row.date}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.01, backgroundColor: "#f9fafb" }}
                      className="border-b border-gray-100"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="relative"
                          >
                            {/* Blue ring around avatar */}
                            <div className="absolute inset-0 rounded-full ring-2 ring-blue-500 ring-offset-2" />
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg bg-gradient-to-br ${avatarBgClass(
                                row.employee_fullname || row.employee_no,
                              )}`}
                            >
                              {getInitials(
                                row.employee_fullname || row.employee_no,
                              )}
                            </div>
                          </motion.div>
                          <div>
                            <div className="font-semibold text-gray-800">
                              {row.employee_fullname}
                            </div>
                            <div className="text-xs text-gray-500">
                              {row.employee_no}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {row.date || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-gray-700">
                          <Clock size={14} />
                          {row.check_in_time || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 min-w-[180px]">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getCheckinTypeStyle(row.check_in_type)}`}
                        >
                          {row.check_in_type || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-gray-700">
                          <Clock size={14} />
                          {row.check_out_time || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 min-w-[230px]">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getCheckoutTypeStyle(row.check_out_type)}`}
                        >
                          {row.check_out_type || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 min-w-[230px]">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(row.status)}`}
                        >
                          {row.status || "N/A"}
                        </span>
                      </td>

                      <td className="px-3 py-4">
                        <span className="flex items-start gap-1 text-gray-600 text-xs max-w-xs">
                          <MapPin size={14} className="flex-shrink-0 mt-0.5" />
                          {row.check_in_address || "N/A"}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <span className="flex items-start gap-1 text-gray-600 text-xs max-w-xs">
                          <MapPin size={14} className="flex-shrink-0 mt-0.5" />
                          {row.check_out_address || "N/A"}
                        </span>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="12" className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <Users className="text-gray-400 mb-4" size={64} />
                        <p className="text-gray-600 font-semibold text-lg">
                          No attendance records found
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                          Try adjusting your filters or date range
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && attendanceData.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-bold text-gray-800">
                    {totalRecords > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-gray-800">
                    {Math.min(currentPage * rowsPerPage, totalRecords)}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-gray-800">
                    {totalRecords}
                  </span>{" "}
                  results
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-gray-700"
                  >
                    <ChevronLeft size={18} />
                    Previous
                  </motion.button>

                  <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg">
                    Page {currentPage} of {totalPages > 0 ? totalPages : 1}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={
                      currentPage === totalPages || totalPages === 0 || loading
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-gray-700"
                  >
                    Next
                    <ChevronRight size={18} />
                  </motion.button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CheckinCheckoutReportTable;
