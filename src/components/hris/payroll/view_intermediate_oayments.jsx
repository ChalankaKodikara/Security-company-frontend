import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaFileInvoiceDollar,
  FaArrowRight,
  FaSearch,
  FaFilter,
  FaChevronLeft,
} from "react-icons/fa";
import Select from "react-select";
import Cookies from "js-cookie";
import { LuRefreshCw } from "react-icons/lu";
import { FaRegCalendarAlt } from "react-icons/fa";
import { FaUsers } from "react-icons/fa";
import { FaChevronRight } from "react-icons/fa6";
import { useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiFetch } from "../../../utils/apiClient";
const ViewIntermediatePayments = () => {
  const [payrollHoldData, setPayrollHoldData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(null);
  const [year, setYear] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const urlMonth = Number(query.get("month"));
  const urlYear = Number(query.get("year"));
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const token = Cookies.get("accessToken");
  const rowsPerPage = 10;
  const [employees, setEmployees] = useState([]);
  const [showRunModal, setShowRunModal] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [runningPayroll, setRunningPayroll] = useState(false);
  const urlOrgId = Number(query.get("org_id"));

  const MONTH_OPTIONS = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => {
    const y = new Date().getFullYear() - 5 + i;
    return { value: y, label: y.toString() };
  });
  const employeeOptions = payrollHoldData.map((emp) => ({
    value: emp.employee_no,
    label: `${emp.employee_no} - ${emp.employee_fullname}`,
  }));

  useEffect(() => {
    if (!selectedOrganization) return;

    const fetchEmployees = async () => {
      try {
        const res = await apiFetch(
          `${API_URL}/v1/hris/employees?organization_id=${selectedOrganization.value}`,
        );
        const result = await res.json();

        if (result?.success) {
          setEmployees(
            result.data.map((e) => ({
              value: e.employee_no,
              label: `${e.employee_no} - ${e.employee_fullname}`,
            })),
          );
        }
      } catch (err) {
        console.error("Failed to load employees", err);
      }
    };

    fetchEmployees();
  }, [selectedOrganization]);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await apiFetch(
          `${API_URL}/v1/hris/organizations/organization`,
        );

        const result = await response.json();

        if (result?.success && result?.data) {
          const orgOptions = result.data.map((org) => ({
            value: org.id,
            label: org.organization_name,
          }));

          // 🔑 Find org that matches URL org_id
          const matchedOrg = orgOptions.find((org) => org.value === urlOrgId);

          if (matchedOrg) {
            // Only show the matched organization
            setOrganizations([matchedOrg]);
            setSelectedOrganization(matchedOrg);
          } else {
            // fallback (optional)
            setOrganizations(orgOptions);
            setSelectedOrganization(orgOptions[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching organizations:", error);
      }
    };

    fetchOrganizations();
  }, [API_URL, token, urlOrgId]);

  // Fetch Payroll Hold Data
  useEffect(() => {
    if (!selectedOrganization) return;

    const fetchPayrollHold = async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams({
          organization_id: selectedOrganization.value,
          page: currentPage,
          limit: rowsPerPage,
        });

        if (search) params.append("search", search);
        if (month) params.append("month", month.value);
        if (year) params.append("year", year.value);

        const response = await apiFetch(
          `${API_URL}/v1/hris/payroll/hold?${params.toString()}`,
        );

        const result = await response.json();

        if (result?.success) {
          setPayrollHoldData(result.data || []);
          setTotalRecords(result.pagination?.total || 0);
          setTotalPages(result.pagination?.totalPages || 0);
        }
      } catch (error) {
        console.error("Error fetching payroll hold data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayrollHold();
  }, [API_URL, token, selectedOrganization, currentPage, search, month, year]);

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

  const getMonthName = (monthNum) => {
    return MONTH_OPTIONS.find((m) => m.value === monthNum)?.label || monthNum;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* HEADER BANNER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-2xl shadow-2xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <FaFileInvoiceDollar className="text-white text-2xl" />
                </div>
                <div>
                  <p className="text-white text-lg font-bold">
                    Run Intermediate payroll
                  </p>
                  <p className="text-blue-100 text-sm">
                    Access intermediate salary payments for employees
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowRunModal(true)}
                className="bg-white text-blue-600 rounded-xl px-8 py-3 font-semibold shadow-lg flex items-center gap-2"
              >
                Run Intermediate
                <FaArrowRight />
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
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <FaFilter size={20} />
                  Filter Options
                </h3>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Organization Filter */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Organization
                  </label>
                  <Select
                    value={selectedOrganization}
                    isDisabled={true}
                    onChange={setSelectedOrganization}
                    options={organizations}
                    className="text-sm"
                    placeholder="Select Organization..."
                  />
                </div>

                {/* Month Filter */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Month
                  </label>
                  <Select
                    value={month}
                    onChange={setMonth}
                    options={MONTH_OPTIONS}
                    isClearable
                    placeholder="All Months"
                    className="text-sm"
                  />
                </div>

                {/* Year Filter */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Year
                  </label>
                  <Select
                    value={year}
                    onChange={setYear}
                    options={YEAR_OPTIONS}
                    isClearable
                    placeholder="All Years"
                    className="text-sm"
                  />
                </div>

                {/* Search */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                    <FaSearch size={14} /> Search
                  </label>
                  <input
                    type="text"
                    placeholder="Employee No / Name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Reset Button */}
                <div className="flex items-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSearch("");
                      setMonth(null);
                      setYear(null);
                      setCurrentPage(1);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-all"
                  >
                    <LuRefreshCw size={18} />
                    Reset
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TABLE */}
        <motion.div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-white font-bold text-lg">
                  Payroll Hold Records
                </h3>
                <p className="text-purple-100 text-xs">
                  {totalRecords} {totalRecords === 1 ? "record" : "records"}{" "}
                  found
                </p>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
              >
                <FaFilter size={16} />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  {[
                    "Employee No",
                    "Employee Name",
                    "Email",
                    "Status",
                    "Month/Year",
                    "Reason",
                    "Created At",
                    "Created By",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-bold text-gray-700"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-10">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"
                      />
                    </td>
                  </tr>
                ) : payrollHoldData.length > 0 ? (
                  payrollHoldData.map((row, index) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
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

                      <td className="px-6 py-3 text-gray-600">
                        {row.employee_email}
                      </td>

                      <td className="px-6 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            row.employee_active_status === "Active"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {row.employee_active_status}
                        </span>
                      </td>

                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <FaRegCalendarAlt
                            size={14}
                            className="text-blue-500"
                          />
                          <span className="font-semibold text-gray-800">
                            {getMonthName(row.month)} {row.year}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-3 text-gray-600">
                        {row.reason || "-"}
                      </td>

                      <td className="px-6 py-3 text-xs text-gray-600">
                        {new Date(row.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="px-6 py-3 font-medium text-gray-700">
                        {row.created_by}
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-10">
                      <FaUsers
                        size={50}
                        className="mx-auto text-gray-400 mb-3"
                      />
                      <p className="text-gray-600">
                        No payroll hold records found
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {!loading && payrollHoldData.length > 0 && totalPages > 1 && (
            <div className="p-4 bg-gray-50 flex items-center justify-between border-t">
              <div className="text-sm text-gray-600">
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
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <FaChevronLeft className="inline-block" /> Prev
                </button>

                <div className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold">
                  Page {currentPage} / {totalPages}
                </div>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next <FaChevronRight className="inline-block" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
      <AnimatePresence>
        {showRunModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl w-[480px] p-6 shadow-xl"
            >
              <h2 className="text-lg font-bold mb-4">
                Run Intermediate Payroll
              </h2>

              {/* Month / Year (from filters or URL) */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm text-gray-600">Month</label>
                  <input
                    disabled
                    value={getMonthName(urlMonth)}
                    className="w-full border p-2 rounded bg-gray-100"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Year</label>
                  <input
                    disabled
                    value={urlYear}
                    className="w-full border p-2 rounded bg-gray-100"
                  />
                </div>
              </div>

              {/* Employee Multi Select */}
              <div className="mb-4">
                <label className="text-sm font-semibold text-gray-700">
                  Employees
                </label>
                <Select
                  isMulti
                  options={employeeOptions}
                  value={selectedEmployees}
                  onChange={setSelectedEmployees}
                  placeholder="Select employees..."
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowRunModal(false)}
                  className="px-4 py-2 rounded bg-gray-200"
                >
                  Cancel
                </button>

                <button
                  disabled={runningPayroll || selectedEmployees.length === 0}
                  onClick={async () => {
                    setRunningPayroll(true);
                    try {
                      const payload = {
                        organization_id: selectedOrganization.value,
                        month: urlMonth,
                        year: urlYear,
                        employee_nos: selectedEmployees.map((e) => e.value),
                      };

                      const response = await fetch(
                        `${API_URL}/v1/hris/payroll/calculate-payroll-new`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify(payload),
                        },
                      );

                      const result = await response.json(); //  READ RESPONSE

                      if (!result.success) {
                        toast.error(result.message || "Payroll run failed");
                        return; // ⛔ STOP HERE
                      }

                      toast.success("Payroll run started successfully");
                      setShowRunModal(false);
                      setSelectedEmployees([]);
                    } catch (err) {
                      console.error("Payroll run failed", err);
                      toast.error("Something went wrong while running payroll");
                    } finally {
                      setRunningPayroll(false);
                    }
                  }}
                  className="px-6 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
                >
                  {runningPayroll ? "Running..." : "Run Payroll"}
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

export default ViewIntermediatePayments;
