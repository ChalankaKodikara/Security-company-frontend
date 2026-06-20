/** @format */
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  ClipboardEdit,
  Search,
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar,
  X,
  Check,
  Clock,
} from "lucide-react";
import { apiFetch } from "../../../utils/apiClient";

const AttendanceAdjustment = () => {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    datetime: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [loadingEmployees, setLoadingEmployees] = useState(false);

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

  const fetchEmployees = async (
    page = 1,
    limit = rowsPerPage,
    keyword = "",
  ) => {
    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams({ page, limit });

      if (keyword.trim() !== "") query.append("search", keyword);
      if (selectedOrgId) query.append("organization", selectedOrgId);

      const res = await apiFetch(
        `${API_URL}/v1/hris/employees/employee/all-details?${query}`,
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data?.message || "Failed to fetch employees");
      }

      setEmployees(data.data || []);
      setTotalRecords(data.totalRecords || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError(err.message);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(1, rowsPerPage, search);
  }, [selectedOrgId]);

  const debounceSearch = useCallback(() => {
    const delay = setTimeout(() => {
      setCurrentPage(1);
      fetchEmployees(1, rowsPerPage, search);
    }, 400);
    return () => clearTimeout(delay);
  }, [search]);

  useEffect(() => {
    debounceSearch();
  }, [search, debounceSearch]);

  useEffect(() => {
    fetchEmployees(currentPage, rowsPerPage, search);
  }, [currentPage]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (value.trim() === "") {
      setCurrentPage(1);
      fetchEmployees(1, rowsPerPage, "");
    }
  };

  const fetchEmployeeOptions = async (query) => {
    if (!query || query.trim().length < 2) {
      setEmployeeOptions([]);
      return;
    }

    try {
      setLoadingEmployees(true);
      const res = await apiFetch(
        `${API_URL}/v1/hris/employees/employee/all-details?search=${encodeURIComponent(query)}`,
      );
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        const options = data.data.map((emp) => ({
          value: emp.employee_no,
          label: `${emp.employee_no} — ${emp.employee_fullname} (${emp.department_name || "N/A"})`,
        }));
        setEmployeeOptions(options);
      } else {
        setEmployeeOptions([]);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
      setEmployeeOptions([]);
    } finally {
      setLoadingEmployees(false);
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

  const fetchOrganizations = async () => {
    try {
      const res = await apiFetch(
        `${API_URL}/v1/hris/organizations/organization`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      const data = await res.json();
      if (data.success) {
        setOrganizations(
          data.data.map((org) => ({
            value: org.id,
            label: org.organization_name,
          })),
        );
      }
    } catch (err) {
      console.error("Error loading organizations:", err);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg"
              >
                <ClipboardEdit className="text-white" size={32} />
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Attendance Adjustment
                </h1>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <Users size={16} />
                  {totalRecords} employees listed
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all font-semibold"
            >
              <Plus size={20} />
              Add Manual Attendance
            </motion.button>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <div className="relative w-full max-w-md">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by Employee No / Name / Email..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm"
              value={search}
              onChange={handleSearchChange}
            />
          </div>

          <div className="w-full max-w-sm mb-4 mt-3">
            <label className="block mb-2 text-gray-700 font-semibold">
              Select Organization
            </label>

            <Select
              options={organizations}
              placeholder="Choose Organization"
              value={
                organizations.find((o) => o.value === selectedOrgId) || null
              }
              onChange={(opt) => {
                setSelectedOrgId(opt ? opt.value : "");
                setCurrentPage(1);
              }}
              isClearable
              styles={customSelectStyles}
            />
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-6"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Employee Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="text-center py-12">
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
                        Loading employees...
                      </p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="3" className="text-center py-12">
                      <div className="p-4 bg-red-50 rounded-xl inline-block">
                        <p className="text-red-600 font-semibold">
                          Error: {error}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : employees.length > 0 ? (
                  employees.map((row, idx) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-gray-100 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="relative"
                          >
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
                      <td className="px-6 py-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            navigate(
                              `/adjustment-each-employee/${row.employee_no}`,
                            )
                          }
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md font-medium"
                        >
                          <Eye size={16} />
                          View Attendance
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center py-12">
                      <Users className="mx-auto text-gray-400 mb-4" size={64} />
                      <p className="text-gray-600 font-semibold text-lg">
                        No employees found
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        Try adjusting your search criteria
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && employees.length > 0 && (
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

        {/* Manual Attendance Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
                className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Clock className="text-white" size={24} />
                    <h2 className="text-2xl font-bold text-white">
                      Add Manual Attendance
                    </h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowModal(false)}
                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
                  >
                    <X className="text-white" size={20} />
                  </motion.button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-5">
                  {/* Employee Select */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Employee *
                    </label>
                    <Select
                      placeholder="Search employee by name or number..."
                      isClearable
                      isLoading={loadingEmployees}
                      options={employeeOptions}
                      onInputChange={(value) => {
                        setEmployeeSearch(value);
                        fetchEmployeeOptions(value);
                      }}
                      onChange={(opt) =>
                        setFormData({
                          ...formData,
                          employeeId: opt ? opt.value : "",
                        })
                      }
                      value={
                        formData.employeeId
                          ? {
                              value: formData.employeeId,
                              label:
                                employeeOptions.find(
                                  (o) => o.value === formData.employeeId,
                                )?.label || formData.employeeId,
                            }
                          : null
                      }
                      styles={customSelectStyles}
                      noOptionsMessage={() =>
                        employeeSearch.length < 2
                          ? "Type 2+ characters to search"
                          : "No employees found"
                      }
                    />
                  </div>

                  {/* DateTime */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2  items-center gap-2">
                      <Calendar size={16} />
                      Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      max={new Date().toISOString().slice(0, 16)}
                      value={formData.datetime}
                      onChange={(e) =>
                        setFormData({ ...formData, datetime: e.target.value })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows="4"
                      placeholder="Enter reason for manual attendance..."
                      value={formData.reason}
                      onChange={(e) =>
                        setFormData({ ...formData, reason: e.target.value })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                      required
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={
                      submitting ||
                      !formData.employeeId ||
                      !formData.datetime ||
                      !formData.reason
                    }
                    onClick={async () => {
                      setSubmitting(true);
                      try {
                        const res = await fetch(
                          `${API_URL}/v1/hris/attendence/manual`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              employeeid: formData.employeeId,
                              datetime:
                                formData.datetime.replace("T", " ") + ":00",
                              reason: formData.reason,
                            }),
                          },
                        );

                        const data = await res.json();
                        if (res.ok && data.success) {
                          toast.success(
                            " Manual attendance added successfully!",
                          );
                          setShowModal(false);
                          setFormData({
                            employeeId: "",
                            datetime: "",
                            reason: "",
                          });
                        } else {
                          toast.error(
                            data.message ||
                              "❌ Failed to add attendance record",
                          );
                        }
                      } catch (error) {
                        console.error(
                          "Error submitting manual attendance:",
                          error,
                        );
                        toast.error("❌ Failed to submit manual attendance.");
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all ${
                      submitting ||
                      !formData.employeeId ||
                      !formData.datetime ||
                      !formData.reason
                        ? "bg-blue-300 cursor-not-allowed text-white"
                        : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                    }`}
                  >
                    <Check size={20} />
                    {submitting ? "Saving..." : "Save Attendance"}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />
    </div>
  );
};

export default AttendanceAdjustment;
