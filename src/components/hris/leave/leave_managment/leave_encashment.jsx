import React, { useState, useEffect } from "react";
import moment from "moment";
import { saveAs } from "file-saver";
import Cookies from "js-cookie";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiFetch } from "../../../../utils/apiClient";

const LeaveEncashment = () => {
  const [encashmentData, setEncashmentData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [organizationFilter, setOrganizationFilter] = useState("");
  const [leaveCategoryFilter, setLeaveCategoryFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [organizationOptions, setOrganizationOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  // Action modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [approvedDays, setApprovedDays] = useState("");
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const rowsPerPage = 10;
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  const handleApprove = async () => {
    if (!selectedRow) return;

    try {
      setActionLoading(true);

      const authToken = Cookies.get("accessToken");
      const approvedBy = Cookies.get("username");

      const payload = {
        encash_request_id: selectedRow.id, //  correct mapping
        status: "APPROVED",
        approved_days: Number(approvedDays || selectedRow.requested_days),
        approved_by: approvedBy,
        remarks: remarks || "Approved by HR",
      };

      const res = await apiFetch(
        `${API_URL}/v1/hris/leave-encash/encash/status`,
        {
          method: "PUT",

          credentials: "include",
          body: JSON.stringify(payload),
        },
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Approval failed");
      }

      //  SUCCESS TOAST (USE API MESSAGE)
      toast.success(json.message || "Approved successfully", {
        position: "top-right",
        autoClose: 3000,
      });

      // Close modal & reset
      setShowApproveModal(false);
      setSelectedRow(null);
      setApprovedDays("");
      setRemarks("");

      // Soft refresh
      setCurrentPage(1);
    } catch (err) {
      // ❌ ERROR TOAST
      toast.error(err.message || "Something went wrong", {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const authToken = Cookies.get("accessToken");
        const res = await apiFetch(
          `${API_URL}/v1/hris/organizations/organization`,
          {
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

  // Fetch Leave Categories (use new organization-specific endpoint)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const authToken = Cookies.get("accessToken");

        // organizationFilter must be provided by user selection before we fetch
        if (!organizationFilter) return;

        const url = `${API_URL}/v1/hris/organizations/leave-categories?organization_id=${organizationFilter}`;

        const res = await apiFetch(url, {
          credentials: "include",
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCategoryOptions(
            json.data.map((cat) => ({
              value: cat.id,
              label: cat.category_name,
            })),
          );
        } else {
          // if response not ok or empty, clear options
          setCategoryOptions([]);
        }
      } catch (err) {
        console.error("Failed to fetch categories", err);
        setCategoryOptions([]);
      }
    };
    // clear categories when org changes (including initial blank)
    setCategoryOptions([]);
    fetchCategories();
  }, [API_URL, organizationFilter]);

  // Fetch Encashment Data
  useEffect(() => {
    const fetchEncashmentData = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: currentPage,
          limit: rowsPerPage,
        });

        if (search) params.append("search", search);
        if (statusFilter) params.append("status", statusFilter);
        if (organizationFilter)
          params.append("organization_id", organizationFilter);
        if (leaveCategoryFilter)
          params.append("leave_category_id", leaveCategoryFilter);
        if (fromDate) params.append("from_date", fromDate);
        if (toDate) params.append("to_date", toDate);

        const authToken = Cookies.get("accessToken");
        const response = await apiFetch(
          `${API_URL}/v1/hris/leave-encash/encash?${params.toString()}`,
          {
            credentials: "include",
          },
        );

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        setEncashmentData(data.data || []);
        setTotalPages(data.pagination?.totalPages || 0);
        setTotalRecords(data.pagination?.total || 0);
      } catch (err) {
        setError(err.message);
        setEncashmentData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEncashmentData();
  }, [
    currentPage,
    search,
    statusFilter,
    organizationFilter,
    leaveCategoryFilter,
    fromDate,
    toDate,
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
    const tokens = String(fullName).trim().split(" ");
    if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
    return (tokens[0][0] + tokens[tokens.length - 1][0]).toUpperCase();
  };

  // Status Badge
  const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    if (s === "approved") return "bg-green-100 text-green-700";
    if (s === "pending") return "bg-yellow-100 text-yellow-700";
    if (s === "rejected") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  const getStatusIcon = (status) => {
    const s = status?.toLowerCase();
    if (s === "approved") return <CheckCircle size={14} />;
    if (s === "pending") return <Clock size={14} />;
    if (s === "rejected") return <XCircle size={14} />;
    return null;
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
                Leave Encashment Report
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <DollarSign size={16} />
                {totalRecords} encashment records
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
                <span className="font-semibold">
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </span>
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
                    placeholder="Employee No / Name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full mt-2 border-2 border-gray-200 rounded-xl px-4 py-2"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="text-sm font-semibold">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full mt-2 border-2 border-gray-200 rounded-xl px-4 py-2"
                  >
                    <option value="">All</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PENDING">Pending</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                {/* Organization */}
                <div>
                  <label className="text-sm font-semibold ">Organization</label>
                  <Select
                    options={organizationOptions}
                    placeholder="Select Organization"
                    value={
                      organizationOptions.find(
                        (opt) => opt.value === organizationFilter,
                      ) || null
                    }
                    isClearable
                    onChange={(opt) => {
                      setOrganizationFilter(opt ? opt.value : "");
                      setCurrentPage(1);
                    }}
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      menu: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                  />
                </div>

                {/* Leave Category */}
                <div>
                  <label className="text-sm font-semibold">
                    Leave Category
                  </label>
                  <Select
                    options={categoryOptions}
                    placeholder={
                      organizationFilter
                        ? "Select Category"
                        : "Select organization first"
                    }
                    value={
                      categoryOptions.find(
                        (opt) => opt.value === leaveCategoryFilter,
                      ) || null
                    }
                    isClearable
                    isDisabled={!organizationFilter}
                    onMenuOpen={() => {
                      if (!organizationFilter) {
                        toast.error("Please select organization first");
                      }
                    }}
                    onChange={(opt) => {
                      setLeaveCategoryFilter(opt ? opt.value : "");
                      setCurrentPage(1);
                    }}
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      menu: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                  />
                </div>

                {/* From Date */}
                <div>
                  <label className="font-semibold flex items-center gap-2 text-gray-700">
                    <Calendar size={16} /> From Date
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full mt-2 border-2 border-gray-200 rounded-xl px-4 py-2"
                  />
                </div>

                {/* To Date */}
                <div>
                  <label className="font-semibold flex items-center gap-2 text-gray-700">
                    <Calendar size={16} /> To Date
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full mt-2 border-2 border-gray-200 rounded-xl px-4 py-2"
                  />
                </div>

                {/* Reset */}
                <div className="flex items-end col-span-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("");
                      setOrganizationFilter("");
                      setLeaveCategoryFilter("");
                      setFromDate("");
                      setToDate("");
                      setCurrentPage(1);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-red-500 text-white px-6 py-3 rounded-xl"
                  >
                    <RefreshCw size={18} />
                    Reset Filters
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
                    "EPF No",
                    "Leave Category",
                    "Requested Days",
                    "Approved Days",
                    "Per Day Amount",
                    "Total Amount",
                    "Encash Year",
                    "Status",
                    "Requested At",
                    "Approved By",
                    "Approved At",
                    "Remarks",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-bold"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="14" className="text-center py-10">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"
                      />
                    </td>
                  </tr>
                ) : encashmentData.length > 0 ? (
                  encashmentData.map((row, index) => (
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
                              {row.employee_calling_name}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-3 font-semibold">{row.epf_no}</td>
                      <td className="px-6 py-3 text-indigo-600 font-medium">
                        {row.category_name}
                      </td>
                      <td className="px-6 py-3 text-center font-bold">
                        {row.requested_days}
                      </td>
                      <td className="px-6 py-3 text-center font-bold text-green-600">
                        {row.approved_days}
                      </td>
                      <td className="px-6 py-3 text-right font-semibold">
                        Rs. {parseFloat(row.per_day_amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-green-600">
                        Rs. {parseFloat(row.total_amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-center font-bold">
                        {row.encash_year}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${getStatusStyle(
                            row.status,
                          )}`}
                        >
                          {getStatusIcon(row.status)}
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-600">
                        {moment(row.requested_at).format("DD MMM YYYY, HH:mm")}
                      </td>
                      <td className="px-6 py-3 font-medium">
                        {row.approved_by}
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-600">
                        {row.approved_at
                          ? moment(row.approved_at).format("DD MMM YYYY, HH:mm")
                          : "-"}
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-600 max-w-xs">
                        {row.remarks || "-"}
                      </td>
                      <td className="px-6 py-3">
                        {row.status === "PENDING" ? (
                          <button
                            onClick={() => {
                              setSelectedRow(row); // row.id is available here
                              setApprovedDays(row.requested_days);
                              setRemarks("");
                              setShowApproveModal(true);
                            }}
                            className="px-4 py-2 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700"
                          >
                            Approve
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="14" className="text-center py-10">
                      <Users size={50} className="mx-auto text-gray-400" />
                      <p className="text-gray-600 mt-3">
                        No encashment records found
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {!loading && encashmentData.length > 0 && (
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
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="inline-block" /> Prev
                </button>

                <div className="px-4 py-2 rounded-xl bg-blue-600 text-white">
                  Page {currentPage} / {totalPages}
                </div>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="inline-block" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
      <AnimatePresence>
        {showApproveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <h3 className="text-xl font-bold mb-4">
                Approve Leave Encashment
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold">Approved Days</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedRow?.requested_days}
                    value={approvedDays}
                    onChange={(e) => setApprovedDays(e.target.value)}
                    className="w-full mt-1 border rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Remarks</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full mt-1 border rounded-lg px-4 py-2"
                    placeholder="Approved by HR"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="px-5 py-2 rounded-lg border"
                >
                  Cancel
                </button>

                <button
                  disabled={actionLoading}
                  onClick={handleApprove}
                  className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? "Approving..." : "Yes, Approve"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />
    </div>
  );
};

export default LeaveEncashment;
