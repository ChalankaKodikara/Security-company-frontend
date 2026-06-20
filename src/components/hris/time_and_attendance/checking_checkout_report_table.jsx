/** @format */

import React, { useState, useEffect } from "react";
import moment from "moment";
import { saveAs } from "file-saver";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "../../../utils/apiClient";
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
  const [error, setError] = useState(null)
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [startDate, setStartDate] = useState(
    selectedDate || moment().format("YYYY-MM-DD")
  );
  const [endDate, setEndDate] = useState(moment().format("YYYY-MM-DD"));
  const [search, setSearch] = useState("");
  const [checkInType, setCheckInType] = useState("");
  const [checkOutType, setCheckOutType] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [organizationOptions, setOrganizationOptions] = useState([]);
  const [selectedOrganizationFilter, setSelectedOrganizationFilter] =
    useState("");
  const rowsPerPage = 10;
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  // Fetch Organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const res = await apiFetch(
          `${API_URL}/v1/hris/organizations/organization`
        );


        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setOrganizationOptions(
            json.data.map((org) => ({
              value: org.id,
              label: org.organization_name,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch organizations", err);
      }
    };

    fetchOrganizations();
  }, [API_URL]);

  // Fetch Attendance
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
          params.append("organization", selectedOrganizationFilter);

        const response = await apiFetch(
          `${API_URL}/v1/hris/new-attendence/by-date-range?${params.toString()}`
        );


        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        setAttendanceData(data.data || []);
        setTotalPages(data.totalPages || 0);
        setTotalRecords(data.total || 0);
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

  // Avatar helpers
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
    for (let i = 0; i < seed.length; i++)
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;

    return palette[hash % palette.length];
  };

  const getInitials = (fullName = "") => {
    const tokens = String(fullName)
      .trim()
      .split(" ");
    if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
    return (tokens[0][0] + tokens[tokens.length - 1][0]).toUpperCase();
  };

  // Styled Badge helpers
  const getCheckinTypeStyle = (type) =>
    !type
      ? "bg-gray-100 text-gray-700"
      : type.toLowerCase() === "short-in"
        ? "bg-red-100 text-red-700"
        : type.toLowerCase() === "late-in"
          ? "bg-orange-100 text-orange-700"
          : type.toLowerCase() === "half-in"
            ? "bg-indigo-100 text-indigo-700"
            : "bg-green-100 text-green-700";

  const getCheckoutTypeStyle = (type) =>
    !type
      ? "bg-gray-100 text-gray-700"
      : type.toLowerCase() === "short-out"
        ? "bg-red-100 text-red-700"
        : type.toLowerCase() === "early-out"
          ? "bg-orange-100 text-orange-700"
          : type.toLowerCase() === "half-out"
            ? "bg-indigo-100 text-indigo-700"
            : "bg-green-100 text-green-700";

  const getStatusStyle = (status) =>
    !status
      ? "bg-gray-100 text-gray-700"
      : status.toLowerCase().includes("half")
        ? "bg-yellow-100 text-yellow-700"
        : status.toLowerCase().includes("leave")
          ? "bg-purple-100 text-purple-700"
          : "bg-blue-100 text-blue-700";

  // Export CSV (same logic)
  const exportToCSV = async () => {
    if (totalRecords === 0) {
      alert("No data to export.");
      return;
    }

    setIsExporting(true);

    try {
      const params = new URLSearchParams({
        from: startDate,
        to: endDate,
      });

      const response = await apiFetch(
        `${API_URL}/v1/hris/new-attendence/by-date-range?${params.toString()}`
      );


      const json = await response.json();
      const allData = json.data;

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

      allData.forEach((row) => {
        csvRows.push(
          [
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
          ].join(",")
        );
      });

      const blob = new Blob([csvRows.join("\n")], {
        type: "text/csv;charset=utf-8;",
      });

      saveAs(blob, `attendance_${moment().format("YYYY-MM-DD")}.csv`);
    } catch (e) {
      alert("Error exporting CSV");
    } finally {
      setIsExporting(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-[1800px] mx-auto">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Attendance Report
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Clock size={16} />
                {totalRecords} attendance records
              </p>
            </div>

            <div className="flex gap-3">
              {/* Toggle Filters */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl shadow-lg border-2 border-gray-200 hover:border-blue-500"
              >
                <Filter size={20} className="text-blue-600" />
                <span className=" font-semibold">{showFilters ? "Hide Filters" : "Show Filters"}</span>
              </motion.button>

              {/* Export Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isExporting}
                onClick={exportToCSV}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg"
              >
                <Download size={20} />
                {isExporting ? "Exporting..." : "Export CSV"}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* FILTERS */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <Filter size={20} />
                  Filter Options
                </h3>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Date Filters */}
                <div>
                  <label className="font-semibold flex items-center gap-2 text-gray-700">
                    <Calendar size={16} /> From
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full mt-2 border-2 border-gray-200 rounded-xl px-4 py-2"
                  />
                </div>

                <div>
                  <label className="font-semibold flex items-center gap-2 text-gray-700">
                    <Calendar size={16} /> To
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full mt-2 border-2 border-gray-200 rounded-xl px-4 py-2"
                  />
                </div>

                {/* Search */}
                <div>
                  <label className="font-semibold text-gray-700 flex items-center gap-2">
                    <Search size={16} /> Search
                  </label>
                  <input
                    type="text"
                    placeholder="Employee No / Name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full mt-2 border-2 border-gray-200 rounded-xl px-4 py-2"
                  />
                </div>

                {/* Organization */}
                <div>
                  <label className="text-sm font-semibold">Organization</label>
                  <Select
                    options={organizationOptions}
                    placeholder="Select Organization"
                    value={
                      organizationOptions.find(
                        (opt) => opt.value === selectedOrganizationFilter
                      ) || null
                    }
                    isClearable
                    onChange={(opt) => {
                      setSelectedOrganizationFilter(opt ? opt.value : "");
                      setCurrentPage(1);
                    }}
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      menu: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                  />

                </div>

                {/* Checkin / Checkout / Status */}
                <div>
                  <label className="text-sm font-semibold">Check-in Type</label>
                  <select
                    value={checkInType}
                    onChange={(e) => setCheckInType(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2"
                  >
                    <option value="">All</option>
                    {checkInTypeOptions.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold">Check-out Type</label>
                  <select
                    value={checkOutType}
                    onChange={(e) => setCheckOutType(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2"
                  >
                    <option value="">All</option>
                    {checkOutTypeOptions.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2"
                  >
                    <option value="">All</option>
                    {statusOptions.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Reset */}
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
                    className="w-full flex items-center justify-center gap-2 bg-red-500 text-white px-6 py-3 rounded-xl"
                  >
                    <RefreshCw size={18} />
                    Reset
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TABLE */}
        <motion.div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  {[
                    "Employee No",
                    "Employee Name",
                    "Active Status",
                    "Date",
                    "Check-in",
                    "Check-in Type",
                    "Check-out",
                    "Check-out Type",
                    "Status",
                    "OT",
                    "Check-in Address",
                    "Check-out Address",
                  ].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="12" className="text-center py-10">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"
                      />
                    </td>
                  </tr>
                ) : attendanceData.length > 0 ? (
                  attendanceData.map((row, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-3 text-blue-600 font-bold">
                        {row.employee_no}
                      </td>



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
                                row.employee_fullname || row.employee_no
                              )}`}
                            >
                              {getInitials(row.employee_fullname || row.employee_no)}
                            </div>
                          </motion.div>
                          <div>
                            <div className="font-semibold text-gray-800">
                              {row.employee_fullname}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {row.employee_no}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-3">{row.employee_active_status}</td>
                      <td className="px-6 py-3">{row.date}</td>

                      <td className="px-6 py-3">{row.check_in_time}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getCheckinTypeStyle(
                            row.check_in_type
                          )}`}
                        >
                          {row.check_in_type}
                        </span>
                      </td>

                      <td className="px-6 py-3">{row.check_out_time}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getCheckoutTypeStyle(
                            row.check_out_type
                          )}`}
                        >
                          {row.check_out_type}
                        </span>
                      </td>

                      <td className="px-6 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                            row.status
                          )}`}
                        >
                          {row.status}
                        </span>
                      </td>

                      <td className="px-6 py-3">{row.OT}</td>

                      <td className="px-6 py-3 max-w-xs text-xs text-gray-600">
                        <MapPin size={14} className="inline mr-1" />
                        {row.check_in_address}
                      </td>

                      <td className="px-6 py-3 max-w-xs text-xs text-gray-600">
                        <MapPin size={14} className="inline mr-1" />
                        {row.check_out_address}
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="12" className="text-center py-10">
                      <Users size={50} className="mx-auto text-gray-400" />
                      <p className="text-gray-600 mt-3">No attendance found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* test */}
          {/* PAGINATION */}
          {!loading && attendanceData.length > 0 && (
            <div className="p-4 bg-gray-50 flex items-center justify-between">
              <div>
                Showing{" "}
                <strong>
                  {(currentPage - 1) * rowsPerPage + 1} –{" "}
                  {Math.min(currentPage * rowsPerPage, totalRecords)}
                </strong>{" "}
                of <strong>{totalRecords}</strong>
              </div>

              <div className="flex gap-3">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:border-blue-500"
                >
                  <ChevronLeft className="inline-block" /> Prev
                </button>

                <div className="px-4 py-2 rounded-xl bg-blue-600 text-white">
                  Page {currentPage} / {totalPages}
                </div>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:border-blue-500"
                >
                  Next <ChevronRight className="inline-block" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CheckinCheckoutReportTable;
