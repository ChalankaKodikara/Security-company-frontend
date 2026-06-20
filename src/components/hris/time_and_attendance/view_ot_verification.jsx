import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Clock,
  CalendarDays,
  UserCheck,
  Briefcase,
  CheckCircle2,
  User,
  FileText,
  MessageSquare,
  Timer,
} from "lucide-react";
import { apiFetch } from "../../../utils/apiClient";
import { toast } from "react-toastify";

const ViewOtVerification = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const overtimeAssignmentGroupId = params.get("overtime_assignment_group_id");
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedActual, setSelectedActual] = useState(null);
  const [verifiedMinutes, setVerifiedMinutes] = useState("");
  const [verificationRemarks, setVerificationRemarks] = useState("");
  const [verifyStatus, setVerifyStatus] = useState("VERIFIED");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [group, setGroup] = useState(null);
  const [employees, setEmployees] = useState([]);
  const verifiedByEmployeeNo = Cookies.get("username");

  const handleVerifySubmit = async () => {
    if (!verifiedMinutes || verifiedMinutes <= 0) {
      toast.error("Verified minutes required");
      return;
    }

    try {
      setSubmitting(true);

      const verifiedBy = Cookies.get("username");

      const res = await apiFetch(
        `${API_URL}/v1/hris/overtime/verify/${selectedActual.id}`,
        {
          method: "PUT",

          body: JSON.stringify({
            verified_minutes: Number(verifiedMinutes),
            status: verifyStatus,
            verified_by: verifiedBy,
            remarks: verificationRemarks,
          }),
        },
      );

      const result = await res.json();

      if (res.ok && result.success) {
        toast.success("OT verified successfully ");

        //  close popup
        setShowVerifyModal(false);

        // 🔄 refresh data
        fetchOtDetails();
      } else {
        toast.error(result.message || "Verification failed");
      }
    } catch (err) {
      console.error("Verify OT error:", err);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const formatMinutesToHours = (minutes) => {
    if (!minutes || minutes <= 0) return "0h";

    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h`;
    return `${mins}m`;
  };

  const fetchOtDetails = async () => {
    if (!overtimeAssignmentGroupId) return;
    try {
      setLoading(true);
      const res = await apiFetch(
        `${API_URL}/v1/hris/overtime/assignment/group/${overtimeAssignmentGroupId}/details`,
      );
      const result = await res.json();
      if (result.success) {
        setGroup(result.data.group);
        setEmployees(result.data.employees || []);
      }
    } catch (err) {
      console.error("Fetch OT verification details error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOtDetails();
  }, [overtimeAssignmentGroupId]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "authorized":
      case "verified":
        return "bg-gradient-to-r from-green-500 to-emerald-500 text-white";
      case "pending":
        return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
      case "rejected":
        return "bg-gradient-to-r from-teal-500 to-blue-500 text-white";
      default:
        return "bg-gradient-to-r from-blue-500 to-green-500 text-white";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">
            Loading verification details...
          </p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 flex items-center justify-center">
        <div className="text-center bg-white/70 backdrop-blur-lg rounded-2xl p-8 shadow-xl">
          <p className="text-gray-600 text-lg">No verification details found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 p-4 md:p-8">
      <div className=" mx-auto">
        {/* HEADER */}

        {/* TASK CARD */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 md:p-8 mb-8 hover:shadow-3xl transition-all duration-500 hover:scale-[1.01]">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-green-600 rounded-2xl shadow-lg">
              <Briefcase size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Overtime Verification Details
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* OT Date */}
            <div className="group p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-blue-100/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <CalendarDays size={20} className="text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-600">OT Date</p>
              </div>
              <p className="text-lg font-bold text-gray-800 ml-1">
                {group.ot_date}
              </p>
            </div>

            {/* Time */}
            <div className="group p-4 bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-cyan-100/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-cyan-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Clock size={20} className="text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-600">
                  Planned Time
                </p>
              </div>
              <p className="text-lg font-bold text-gray-800 ml-1">
                {group.planned_start_time} – {group.planned_end_time}
              </p>
            </div>

            {/* Status */}
            <div className="group p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-green-100/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <UserCheck size={20} className="text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-600">Status</p>
              </div>
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-md ${getStatusColor(
                  group.authorization_status,
                )}`}
              >
                <CheckCircle2 size={16} />
                {group.authorization_status}
              </span>
            </div>

            {/* Work */}
            <div className="group p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-teal-100/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-teal-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <FileText size={20} className="text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-600">Work</p>
              </div>
              <p className="text-lg font-bold text-gray-800 ml-1">
                {group.name_of_work}
              </p>
            </div>

            {/* Reason */}
            <div className="group p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-blue-100/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare size={20} className="text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-600">Reason</p>
              </div>
              <p className="text-lg font-bold text-gray-800 ml-1">
                {group.reason}
              </p>
            </div>

            {/* Assigned By */}
            <div className="group p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-cyan-100/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-cyan-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <User size={20} className="text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-600">
                  Assigned By
                </p>
              </div>
              <p className="text-lg font-bold text-gray-800 ml-1">
                {group.assigned_by_name}
              </p>
            </div>

            {/* Authorized By */}
            <div className="group p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-green-100/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <UserCheck size={20} className="text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-600">
                  Authorized By
                </p>
              </div>
              <p className="text-lg font-bold text-gray-800 ml-1">
                {group.authorized_by_name}
              </p>
            </div>

            {/* Authorized At */}
            <div className="group p-4 bg-gradient-to-br from-teal-50 to-green-50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-teal-100/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-teal-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Clock size={20} className="text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-600">
                  Authorized At
                </p>
              </div>
              <p className="text-lg font-bold text-gray-800 ml-1">
                {group.authorized_at
                  ? new Date(group.authorized_at).toLocaleString()
                  : "-"}
              </p>
            </div>
          </div>
        </div>

        {/* EMPLOYEE CARDS */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-green-600 rounded-2xl shadow-lg">
              <Users size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Employee Verification
            </h2>
            <span className="ml-auto px-4 py-2 bg-white/70 backdrop-blur-lg rounded-full text-sm font-bold text-blue-600 shadow-md">
              {employees.length}{" "}
              {employees.length === 1 ? "Employee" : "Employees"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((emp) => {
              const actual = emp.actuals?.[0]?.actual;
              const verification = emp.actuals?.[0]?.verification;

              return (
                <div
                  key={emp.overtime_assignment_id}
                  className="group bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-105"
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <User size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {emp.employee_no}
                      </p>
                      <p className="text-lg font-bold text-gray-800">
                        {emp.employee_name}
                      </p>
                    </div>
                  </div>

                  {emp.authorization_status === "AUTHORIZED" &&
                    actual &&
                    !verification && (
                      <button
                        onClick={() => {
                          setSelectedActual(actual);
                          setVerifiedMinutes(actual.actual_minutes);
                          setVerificationRemarks("");
                          setVerifyStatus("VERIFIED");
                          setShowVerifyModal(true);
                        }}
                        className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700"
                      >
                        Verify OT
                      </button>
                    )}
                  {verification && (
                    <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                      {/* Status */}
                      <div className="flex items-center gap-2 text-emerald-700 font-bold mb-2">
                        <CheckCircle2 size={16} />
                        Verified
                      </div>

                      {/* Verified Hours */}
                      <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                        <Timer size={14} />
                        {formatMinutesToHours(verification.verified_minutes)}
                      </div>

                      {/* Verified By */}
                      <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                        <UserCheck size={14} />
                        {verification.verified_by_name ||
                          verification.verified_by}
                      </div>

                      {/* Verified At */}
                      <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                        <Clock size={14} />
                        {verification.verified_at
                          ? new Date(verification.verified_at).toLocaleString()
                          : "-"}
                      </div>

                      {/* Remarks (optional) */}
                      {verification.remarks && (
                        <div className="mt-2 text-sm text-gray-600 italic">
                          “{verification.remarks}”
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <AnimatePresence>
          {showVerifyModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl p-6 w-full max-w-md"
              >
                <h3 className="text-xl font-bold mb-4">
                  {verifyStatus === "VERIFIED" ? "Verify OT" : "Reject OT"}
                </h3>

                {/* Verified By */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-1">
                    Verified By
                  </label>
                  <input
                    type="text"
                    value={verifiedByEmployeeNo}
                    disabled
                    className="w-full px-4 py-2 border rounded-lg bg-gray-100"
                  />
                </div>

                {/* Verified Minutes */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-1">
                    Verified Minutes <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={verifiedMinutes}
                    onChange={(e) => setVerifiedMinutes(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                {selectedActual && (
                  <div className="mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-100 text-blue-700 text-sm font-semibold">
                    <Timer size={14} />
                    Actual:{" "}
                    {formatMinutesToHours(selectedActual.actual_minutes)}
                  </div>
                )}
                {verifiedMinutes && verifiedMinutes > 0 && (
                  <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-green-100 text-green-700 text-sm font-semibold">
                    <Timer size={14} />
                    Suggested: {formatMinutesToHours(Number(verifiedMinutes))}
                  </div>
                )}

                {/* Status */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-1">
                    Verification Status
                  </label>
                  <select
                    value={verifyStatus}
                    onChange={(e) => setVerifyStatus(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="VERIFIED">Verified</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                {/* Remarks */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-1">
                    Remarks <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows="3"
                    value={verificationRemarks}
                    onChange={(e) => setVerificationRemarks(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowVerifyModal(false)}
                    className="px-4 py-2 border rounded-lg"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleVerifySubmit}
                    disabled={submitting}
                    className={`px-4 py-2 rounded-lg text-white ${
                      verifyStatus === "VERIFIED"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {submitting
                      ? "Submitting..."
                      : verifyStatus === "VERIFIED"
                        ? "Verify"
                        : "Reject"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ViewOtVerification;
