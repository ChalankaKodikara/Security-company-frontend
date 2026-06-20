import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  FaPercent,
  FaCalendarAlt,
  FaBuilding,
  FaCheckCircle,
  FaSpinner,
  FaUser,
  FaEnvelope,
  FaMoneyBillWave,
  FaClock,
  FaTimes,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { MdDeleteOutline, MdModeEdit } from "react-icons/md";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiFetch } from "../../../utils/apiClient";

const PayrollHandlingIncentive = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const org_id = searchParams.get("org_id");
  const from_date = searchParams.get("from_date");
  const to_date = searchParams.get("to_date");
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  //  DETAILS MODAL STATES
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [activeTab, setActiveTab] = useState("overtime");

  useEffect(() => {
    fetchIncentiveData();
  }, [org_id, from_date, to_date]);

  const getIncentiveType = (record) => {
    if (!record?.incentive_source) return null;

    const source = record.incentive_source.toUpperCase();

    if (source === "SERVICE_CHARGE") return "service_charge";
    if (source === "OVERTIME") return "overtime";

    return null;
  };

  const fetchIncentiveData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        organization_id: org_id,
        from_date: from_date,
        to_date: to_date,
        page: 1,
        limit: 100,
      });

      const response = await apiFetch(
        `${API_URL}/v1/hris/payroll/incentive-payroll-total?${params}`,
        {
          method: "GET",
        },
      );

      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      setData(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "") return "N/A";
    const number = Number(value);
    if (Number.isNaN(number)) return value;
    return number.toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const hasValue = (value) => {
    return value !== null && value !== undefined && value !== "";
  };

  const hasOvertimeData = (record) => hasValue(record?.overtime_pay);
  const hasServiceChargeData = (record) =>
    hasValue(record?.service_charge_amount);

  const openDetailsModal = (record) => {
    const type = getIncentiveType(record);

    setSelectedRecord(record);
    setActiveTab(type); // auto select correct tab
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedRecord(null);
    setActiveTab("overtime");
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return "bg-green-100 text-green-700 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "REJECTED":
        return "bg-red-100 text-red-700 border-red-200";
      case "DRAFT":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getMonthFromGeneratedAt = (date) => {
    return (new Date(date).getMonth() + 1).toString().padStart(2, "0");
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);

      const payload = {
        organization_id: Number(org_id),
        month: getMonthFromGeneratedAt(deleteTarget.generated_at),
        year: deleteTarget.year,
      };

      const response = await apiFetch(
        `${API_URL}/v1/hris/payroll/incentive-delete-payroll`,
        {
          method: "DELETE",
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Delete failed");
      }

      toast.success(result.message || "Deleted successfully");
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchIncentiveData();
    } catch (err) {
      toast.error(err.message || "Failed to delete incentive payroll");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApprovePayroll = async () => {
    if (!data.length) {
      toast.error("No payroll data to approve");
      return;
    }

    try {
      setIsApproving(true);

      const payload = {
        organization_id: Number(org_id),
        period_start: from_date,
        period_end: to_date,
        payroll_status: "APPROVED",
      };

      const response = await apiFetch(
        `${API_URL}/v1/hris/payroll/incentive-payroll-status-update`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to approve payroll");
      }

      toast.success(result.message || "Payroll approved successfully");

      fetchIncentiveData();
    } catch (err) {
      toast.error(err.message || "Approval failed");
    } finally {
      setIsApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center font-montserrat">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-blue-400 rounded-full blur-2xl opacity-30 animate-pulse" />
            <FaSpinner className="relative text-6xl text-blue-500 animate-spin mx-auto mb-4" />
          </div>
          <p className="text-gray-600 text-lg font-medium">
            Loading incentive data...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8 font-montserrat"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Incentive Payroll Processing
            </h1>
            <p className="text-gray-600 text-lg">
              View and manage incentive payroll for the selected period
            </p>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-3 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-green-100 to-green-200 p-2 rounded-xl">
              <FaCalendarAlt className="text-green-600 text-2xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">
                From Date
              </p>
              <p className="text-xl font-bold text-gray-800">
                {new Date(from_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-3 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-4 rounded-xl">
              <FaCalendarAlt className="text-purple-600 text-2xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">To Date</p>
              <p className="text-xl font-bold text-gray-800">
                {new Date(to_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="bg-red-100 p-4 rounded-xl">
              <svg
                className="w-7 h-7 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-red-800 mb-1 text-lg">
                Error Loading Data
              </h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Data Table */}
      {!error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
        >
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 flex items-center justify-between">
            <h2 className="text-md font-bold text-white flex items-center gap-3">
              <FaCheckCircle />
              Payroll Records ({data.length})
            </h2>

            {data.length > 0 && data[0]?.payroll_status === "DRAFT" && (
              <button
                onClick={handleApprovePayroll}
                disabled={isApproving}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow"
              >
                {isApproving && <FaSpinner className="animate-spin" />}
                Approve Payroll
              </button>
            )}
          </div>

          {data.length === 0 ? (
            <div className="p-16 text-center">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gray-200 rounded-full blur-xl opacity-50" />
                <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 w-32 h-32 rounded-full flex items-center justify-center">
                  <FaPercent className="text-gray-400 text-5xl" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">
                No Records Found
              </h3>
              <p className="text-gray-500 text-lg">
                There are no incentive payroll records for the selected period.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm text-gray-700 uppercase tracking-wider">
                      Month
                    </th>
                    <th className="px-6 py-4 text-left text-sm text-gray-700 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-4 text-left text-sm text-gray-700 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-6 py-4 text-left text-sm text-gray-700 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-left text-sm text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm text-gray-700 uppercase tracking-wider">
                      Generated At
                    </th>
                    {/* <th className="px-6 py-4 text-left text-sm text-gray-700 uppercase tracking-wider">
                      Action
                    </th> */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((record, index) => (
                    <motion.tr
                      key={record.id || index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => openDetailsModal(record)}
                      className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-300 cursor-pointer"
                    >
                      <td className="px-6 py-5">
                        <span className="text-gray-800 text-base">
                          {record.month}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span className="text-gray-700 font-sm">
                          {record.year}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <FaBuilding className="text-blue-600" />
                          </div>
                          <span className="text-gray-700 font-sm">
                            {record.organization_name || record.organization_id}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {record.employee_fullname || "N/A"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {record.employee_no || "N/A"}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`px-2 py-1 rounded-full text-sm border-2 ${getStatusColor(record.payroll_status)}`}
                        >
                          {record.payroll_status}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3 text-gray-600">
                          <FaCalendarAlt className="text-gray-400 text-lg" />
                          <span className="text-sm font-medium">
                            {formatDate(record.generated_at)}
                          </span>
                        </div>
                      </td>

                      {/* <td
                        className="px-6 py-5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-8">
                          <MdDeleteOutline
                            className="text-red-400 text-lg cursor-pointer hover:text-red-600"
                            onClick={() => {
                              setDeleteTarget(record);
                              setShowDeleteModal(true);
                            }}
                          />

                          <MdModeEdit className="text-blue-400 text-lg cursor-pointer hover:text-blue-600" />
                        </div>
                      </td> */}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* DELETE MODAL */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Confirm Deletion
              </h3>

              <p className="text-gray-600 mb-4">
                Delete incentive payroll for{" "}
                <span className="font-semibold text-gray-800">
                  {deleteTarget?.month} {deleteTarget?.year}
                </span>
                ?
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                  disabled={isDeleting}
                >
                  Cancel
                </button>

                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
                >
                  {isDeleting && <FaSpinner className="animate-spin" />}
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAILS MODAL */}
      <AnimatePresence>
        {showDetailsModal && selectedRecord && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Incentive Payroll Details
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {selectedRecord.month} {selectedRecord.year} -{" "}
                    {selectedRecord.employee_fullname}
                  </p>
                </div>

                <button
                  onClick={closeDetailsModal}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-6 max-h-[85vh] overflow-y-auto">
                {/* Common Employee Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                      <FaUser className="text-blue-600" />
                      <p className="text-sm text-gray-500">Employee Name</p>
                    </div>
                    <p className="font-semibold text-gray-800">
                      {selectedRecord.employee_fullname || "N/A"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Calling Name:{" "}
                      {selectedRecord.employee_calling_name || "N/A"}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                      <FaBuilding className="text-indigo-600" />
                      <p className="text-sm text-gray-500">Employee / EPF</p>
                    </div>
                    <p className="font-semibold text-gray-800">
                      Employee No: {selectedRecord.employee_no || "N/A"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      EPF No: {selectedRecord.epf_no || "N/A"}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                      <FaEnvelope className="text-emerald-600" />
                      <p className="text-sm text-gray-500">Email</p>
                    </div>
                    <p className="font-semibold text-gray-800 break-all text-sm">
                      {selectedRecord.employee_email || "N/A"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1 break-all">
                      Personal: {selectedRecord.personal_email || "N/A"}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                      <FaCalendarAlt className="text-purple-600" />
                      <p className="text-sm text-gray-500">Payroll Period</p>
                    </div>
                    <p className="font-semibold text-gray-800">
                      {formatShortDate(selectedRecord.period_start)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      to {formatShortDate(selectedRecord.period_end)}
                    </p>
                  </div>
                </div>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                    <p className="text-sm text-blue-600 font-medium mb-1">
                      Payroll Status
                    </p>
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-sm border ${getStatusColor(selectedRecord.payroll_status)}`}
                    >
                      {selectedRecord.payroll_status || "N/A"}
                    </span>
                  </div>

                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                    <p className="text-sm text-emerald-600 font-medium mb-1">
                      Final Incentive
                    </p>
                    <p className="text-xl font-bold text-gray-800">
                      {formatCurrency(selectedRecord.final_incentive)}
                    </p>
                  </div>

                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                    <p className="text-sm text-amber-600 font-medium mb-1">
                      Source
                    </p>
                    <p className="text-lg font-semibold text-gray-800">
                      {selectedRecord.incentive_source || "N/A"}
                    </p>
                  </div>

                  <div className="bg-violet-50 rounded-2xl p-4 border border-violet-100">
                    <p className="text-sm text-violet-600 font-medium mb-1">
                      Generated At
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {formatDate(selectedRecord.generated_at)}
                    </p>
                  </div>
                </div>
                {/* Tabs */}
                {(() => {
                  const incentiveType = getIncentiveType(selectedRecord);

                  return (
                    <>
                      <div className="border-b border-gray-200 mb-6">
                        <div className="flex gap-3">
                          {/* OVERTIME TAB */}
                          {incentiveType === "overtime" && (
                            <button
                              className={`px-5 py-3 rounded-t-xl font-semibold transition-all ${
                                activeTab === "overtime"
                                  ? "bg-blue-600 text-white"
                                  : "bg-blue-50 text-blue-700"
                              }`}
                              onClick={() => setActiveTab("overtime")}
                            >
                              Overtime
                            </button>
                          )}

                          {/* SERVICE CHARGE TAB */}
                          {incentiveType === "service_charge" && (
                            <button
                              className={`px-5 py-3 rounded-t-xl font-semibold transition-all ${
                                activeTab === "service_charge"
                                  ? "bg-emerald-600 text-white"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                              onClick={() => setActiveTab("service_charge")}
                            >
                              Service Charge
                            </button>
                          )}
                        </div>
                      </div>

                      {/* OVERTIME CONTENT */}
                      {activeTab === "overtime" &&
                        incentiveType === "overtime" && (
                          <motion.div
                            key="overtime"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                          >
                            <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-3 rounded-xl bg-blue-100">
                                  <FaClock className="text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Verified Minutes
                                  </p>
                                  <p className="text-2xl font-bold text-gray-800">
                                    {selectedRecord.total_verified_minutes ??
                                      "N/A"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-3 rounded-xl bg-indigo-100">
                                  <FaClock className="text-indigo-600" />
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Verified Hours
                                  </p>
                                  <p className="text-2xl font-bold text-gray-800">
                                    {selectedRecord.total_verified_hours ??
                                      "N/A"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm md:col-span-2">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-3 rounded-xl bg-emerald-100">
                                  <FaMoneyBillWave className="text-emerald-600" />
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Overtime Pay
                                  </p>
                                  <p className="text-3xl font-bold text-gray-800">
                                    {formatCurrency(
                                      selectedRecord.overtime_pay,
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}

                      {/* SERVICE CHARGE CONTENT */}
                      {activeTab === "service_charge" &&
                        incentiveType === "service_charge" && (
                          <motion.div
                            key="service_charge"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                          >
                            <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-3 rounded-xl bg-emerald-100">
                                  <FaMoneyBillWave className="text-emerald-600" />
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Service Charge Amount
                                  </p>
                                  <p className="text-2xl font-bold text-gray-800">
                                    {formatCurrency(
                                      selectedRecord.service_charge_amount,
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-3 rounded-xl bg-teal-100">
                                  <FaPercent className="text-teal-600" />
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Final Incentive
                                  </p>
                                  <p className="text-2xl font-bold text-gray-800">
                                    {formatCurrency(
                                      selectedRecord.final_incentive,
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                    </>
                  );
                })()}
                {!hasOvertimeData(selectedRecord) &&
                  !hasServiceChargeData(selectedRecord) && (
                    <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-200">
                      <p className="text-gray-600 font-medium">
                        No overtime or service charge data available for this
                        employee.
                      </p>
                    </div>
                  )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ToastContainer position="top-right" autoClose={3000} />
    </motion.div>
  );
};

export default PayrollHandlingIncentive;
