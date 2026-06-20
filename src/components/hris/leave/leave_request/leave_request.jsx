/** @format */
import moment from "moment";
import React, { useState, useEffect, useCallback } from "react";
import Papa from "papaparse";
import "react-datepicker/dist/react-datepicker.css";
import Leave_Request_Popup from "./leave_request_popup";
import Cookies from "js-cookie";
import usePermissions from "../../../permissions/permission";
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
  Users,
  Tag,
  ArrowRight,
} from "lucide-react";
import { apiFetch } from "../../../../utils/apiClient";

const Leave_request_table = () => {
  const { hasPermission } = usePermissions();

  const [leaveData, setLeaveData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [department, setDepartment] = useState("");

  const [leaveCategories, setLeaveCategories] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Popup
  const [isRqstOpen, setIsRqstOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);

  const [showFilters, setShowFilters] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const rowsPerPage = 5;
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const token = Cookies.get("accessToken");

  // ====== Styling helpers (same style as other pages) ======
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

  const getDayTypeBadgeStyle = (isHalfDay) =>
    isHalfDay
      ? "bg-amber-100 text-amber-700"
      : "bg-emerald-100 text-emerald-700";

  // ====== Data fetching (NOT APPROVED only) ======
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: rowsPerPage,
        approved_status_1: "NOT APPROVED",
      });

      if (search) params.append("search", search);
      if (requestedDate && requestedDate !== "") {
        params.append("requested_date", requestedDate);
      }
      if (categoryName) params.append("category_name", categoryName);
      if (department) params.append("department", department);

      const res = await apiFetch(`${API_URL}/v1/hris/leave/getleave?${params}`);

      const result = await res.json();

      if (result && result.data) {
        const totalItems = result.totalItems || result.data.length || 0;
        setLeaveData(result.data);
        setTotalRecords(totalItems);
        setTotalPages(Math.ceil(totalItems / rowsPerPage) || 0);
      } else {
        setLeaveData([]);
        setTotalRecords(0);
        setTotalPages(0);
      }
    } catch (err) {
      console.error("Error fetching leave data:", err);
      setLeaveData([]);
      setTotalRecords(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [
    API_URL,
    token,
    currentPage,
    rowsPerPage,
    search,
    requestedDate,
    categoryName,
    department,
  ]);

  // Debounced fetch when filters/search change
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchData();
    }, 600);
    return () => clearTimeout(timeout);
  }, [fetchData]);

  // Fetch leave categories
  useEffect(() => {
    const fetchLeaveCategories = async () => {
      try {
        const res = await apiFetch(`${API_URL}/v1/hris/leave/getLeaveCategory`, {
        });
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          setLeaveCategories(result.data.map((c) => c.category_name));
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchLeaveCategories();
  }, [API_URL, token]);

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await apiFetch(`${API_URL}/v1/hris/department`);
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          const deptNames = result.data.map((dep) => dep.name);
          setDepartments(["All Departments", ...deptNames]);
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };
    fetchDepartments();
  }, [API_URL, token]);

  // Toggle popup
  const toggleRqstPopup = (leaveId) => {
    setSelectedLeaveId(leaveId);
    setIsRqstOpen((prev) => !prev);
  };

  // Export CSV (same logic, just styled button)
  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (requestedDate) params.append("requested_date", requestedDate);
      if (categoryName) params.append("category_name", categoryName);
      if (department) params.append("department", department);

      const res = await apiFetch(`${API_URL}/v1/hris/leave/getleave?${params}`);

      const result = await res.json();
      const allData = result.data || [];

      if (allData.length === 0) {
        alert("No data to export.");
        return;
      }

      const csvData = allData.map((leave) => ({
        "Employee ID": leave.employee_no,
        "Employee Name": leave.employee_fullname,
        Department: leave.department,
        "Applied Date": moment(leave.requesting_date).format("YYYY-MM-DD"),
        "Leave Category": leave.category_name,
        "Requested Date": moment(leave.requested_date).format("YYYY-MM-DD"),
        Reason: leave.reason,
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "leave_requests.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting CSV:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // ====== JSX ======
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-[1800px] mx-auto font-montserrat">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
            <div>
              <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Pending Leave Requests
              </h2>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Clock size={16} />
                {totalRecords} pending requests
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              {/* Toggle Filters */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters((prev) => !prev)}
                className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl shadow-lg border-2 border-gray-200 hover:border-blue-500"
              >
                <Filter size={20} className="text-blue-600" />
                <span className="font-semibold">
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </span>
              </motion.button>

              {/* Export Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportToCSV}
                disabled={isExporting}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg disabled:opacity-60"
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
                {/* Search */}
                <div>
                  <label className="font-semibold text-gray-700 flex items-center gap-2">
                    <Search size={16} /> Search
                  </label>
                  <input
                    type="text"
                    className="w-full mt-2 border-2 border-gray-200 rounded-xl px-4 py-2"
                    placeholder="Name / ID / Email..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                {/* Requested Date */}
                <div>
                  <label className="font-semibold flex items-center gap-2 text-gray-700">
                    <Calendar size={16} /> Requested Date
                  </label>
                  <input
                    type="date"
                    className="w-full mt-2 border-2 border-gray-200 rounded-xl px-4 py-2"
                    value={requestedDate || ""}
                    onChange={(e) => {
                      setRequestedDate(e.target.value || "");
                      setCurrentPage(1);
                    }}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="font-semibold flex items-center gap-2 text-gray-700">
                    <Tag size={16} /> Category
                  </label>
                  <select
                    value={categoryName}
                    onChange={(e) => {
                      setCategoryName(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full mt-2 border-2 border-gray-200 rounded-xl px-4 py-2 bg-white"
                  >
                    <option value="">All Categories</option>
                    {leaveCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
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
                      setRequestedDate("");
                      setCategoryName("");
                      setDepartment("");
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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  {[
                    "Employee No",
                    "Employee",
                    "Department",
                    "Applied Date",
                    "Half / Full Day",
                    "Requested Date",
                    "Reason",
                    "Action",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-bold"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"
                      />
                    </td>
                  </tr>
                ) : leaveData.length > 0 ? (
                  leaveData.map((leave) => (
                    <motion.tr
                      key={leave.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="hover:bg-gray-50"
                    >
                      {/* Employee No */}
                      <td className="px-6 py-4 text-blue-600 font-bold">
                        {leave.employee_no}
                      </td>

                      {/* Employee w/ avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="relative"
                          >
                            <div className="absolute inset-0 rounded-full ring-2 ring-blue-500 ring-offset-2" />
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg bg-gradient-to-br ${avatarBgClass(
                                leave.employee_fullname || leave.employee_no
                              )}`}
                            >
                              {getInitials(
                                leave.employee_fullname || leave.employee_no
                              )}
                            </div>
                          </motion.div>
                          <div>
                            <div className="font-semibold text-gray-800">
                              {leave.employee_fullname || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {leave.employee_no
                                ? `EMP ID: ${leave.employee_no}`
                                : ""}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-6 py-4">
                        {leave.department || "N/A"}
                      </td>

                      {/* Applied Date */}
                      <td className="px-6 py-4">
                        {leave.requesting_date
                          ? moment(leave.requesting_date).format("YYYY-MM-DD")
                          : "N/A"}
                      </td>

                      {/* Half / Full Day */}
                      <td className="px-6 py-4">
                        {leave.category_name ? (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-2 ${getDayTypeBadgeStyle(
                              leave.is_half_day === 1
                            )}`}
                          >
                            {leave.category_name.trim()}
                            <span className="text-[11px] opacity-80">
                              {leave.is_half_day === 1
                                ? "(Half Day)"
                                : "(Full Day)"}
                            </span>
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </td>

                      {/* Requested Date */}
                      <td className="px-6 py-4">
                        {leave.requested_date
                          ? moment(leave.requested_date).format("YYYY-MM-DD")
                          : "N/A"}
                      </td>

                      {/* Reason */}
                      <td className="px-6 py-4 max-w-xs text-xs text-gray-600">
                        {leave.reason || "N/A"}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4">
                        {hasPermission(10004) && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600"
                            onClick={() => toggleRqstPopup(leave.id)}
                          >
                            <ArrowRight size={16} />
                          </motion.button>
                        )}
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-10">
                      <Users size={50} className="mx-auto text-gray-400" />
                      <p className="text-gray-600 mt-3">
                        No leave requests found.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {!loading && leaveData.length > 0 && (
            <div className="p-4 bg-gray-50 flex flex-col md:flex-row gap-3 md:gap-0 items-center justify-between text-sm">
              <div className="text-gray-700">
                Showing{" "}
                <strong>
                  {totalRecords === 0
                    ? 0
                    : (currentPage - 1) * rowsPerPage + 1}{" "}
                  –{" "}
                  {Math.min(currentPage * rowsPerPage, totalRecords) || 0}
                </strong>{" "}
                of <strong>{totalRecords}</strong>
              </div>

              <div className="flex gap-3 items-center">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:border-blue-500 disabled:opacity-50"
                >
                  <ChevronLeft className="inline-block" /> Prev
                </button>

                <div className="px-4 py-2 rounded-xl bg-blue-600 text-white">
                  Page {currentPage} / {totalPages || 1}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      totalPages ? Math.min(prev + 1, totalPages) : prev + 1
                    )
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:border-blue-500 disabled:opacity-50"
                >
                  Next <ChevronRight className="inline-block" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* POPUP */}
      {isRqstOpen && selectedLeaveId && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900/60">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white p-6 rounded-2xl shadow-2xl w-[95%] md:w-3/4 relative max-h-[90vh] overflow-auto"
          >
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-sm"
              onClick={() => setIsRqstOpen(false)}
            >
              Close
            </button>
            <Leave_Request_Popup
              leaveId={selectedLeaveId}
              onClose={() => {
                setIsRqstOpen(false);
                fetchData(); // refresh after closing popup
              }}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Leave_request_table;
