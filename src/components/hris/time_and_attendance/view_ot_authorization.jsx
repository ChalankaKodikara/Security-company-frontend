import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Cookies from "js-cookie";
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
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import { apiFetch } from "../../../utils/apiClient";

const ViewOtAuthorization = () => {


    const [modalAction, setModalAction] = useState(null); // AUTHORIZED | REJECTED
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const overtimeAssignmentGroupId =
        params.get("overtime_assignment_group_id");
    const authorizedByEmployeeNo = Cookies.get("username");
    const API_URL = process.env.REACT_APP_FRONTEND_URL;
    const [loading, setLoading] = useState(false);
    const [group, setGroup] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authRemarks, setAuthRemarks] = useState("");
    const [authSubmitting, setAuthSubmitting] = useState(false);
    const [selectedOvertimeAssignmentId, setSelectedOvertimeAssignmentId] = useState(null);


    const openAuthorizeModal = (overtimeAssignmentId) => {
        setSelectedOvertimeAssignmentId(overtimeAssignmentId);
        setAuthRemarks("");
        setModalAction(null);
        setShowAuthModal(true);
    };

    const fetchOtDetails = async () => {
        if (!overtimeAssignmentGroupId) return;

        try {
            setLoading(true);

            const res = await apiFetch(
                `${API_URL}/v1/hris/overtime/assignment/group/${overtimeAssignmentGroupId}/details`
            );

            const result = await res.json();

            if (result.success) {
                setGroup(result.data.group);
                setEmployees(result.data.employees || []);
            }
        } catch (err) {
            console.error("Fetch OT details error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOtDetails();
    }, [overtimeAssignmentGroupId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading OT details...</p>
                </div>
            </div>
        );
    }

    if (!group) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 flex items-center justify-center">
                <div className="text-center bg-white/70 backdrop-blur-lg rounded-2xl p-8 shadow-xl">
                    <p className="text-gray-600 text-lg">No OT details found</p>
                </div>
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved':
            case 'authorized':
                return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
            case 'pending':
                return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
            case 'rejected':
                return 'bg-gradient-to-r from-teal-500 to-blue-500 text-white';
            default:
                return 'bg-gradient-to-r from-blue-500 to-green-500 text-white';
        }
    };

    const handleAuthorizeSubmit = async (status) => {
        if (!authRemarks.trim()) {
            toast.error("Remarks are required");
            return;
        }

        if (!selectedOvertimeAssignmentId) {
            toast.error("Invalid OT assignment");
            return;
        }

        try {
            setAuthSubmitting(true);

            const res = await apiFetch(
                `${API_URL}/v1/hris/overtime/assignments/${selectedOvertimeAssignmentId}/authorize`,
                {
                    method: "PUT",
                    
                    body: JSON.stringify({
                        status, // AUTHORIZED | REJECTED (direct)
                        authorized_by_employee_no: authorizedByEmployeeNo,
                        authorization_remarks: authRemarks,
                    }),

                }
            );

            const result = await res.json();

            if (res.ok && result.success) {
                toast.success(
                    status === "AUTHORIZED"
                        ? "Employee OT Approved"
                        : "Employee OT Rejected"
                );

                setShowAuthModal(false);
                setSelectedOvertimeAssignmentId(null);
                fetchOtDetails(); // refresh GET
            } else {
                toast.error(result.message || "Authorization failed");
            }
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong");
        } finally {
            setAuthSubmitting(false);
        }
    };

    const closeAuthModal = () => {
        setShowAuthModal(false);
        setSelectedOvertimeAssignmentId(null);
        setAuthRemarks("");
        setModalAction(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 p-4 md:p-8">
            <div className=" mx-auto">

                {/* TASK CARD */}
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6  mb-8 hover:shadow-3xl transition-all duration-500 hover:scale-[1.01]">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-green-600 rounded-2xl shadow-lg">
                            <Briefcase size={24} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Overtime Task Details</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-6">
                        {/* OT Date */}
                        <div className="group p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-blue-100/50">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                    <CalendarDays size={20} className="text-white" />
                                </div>
                                <p className="text-sm font-semibold text-gray-600">OT Date</p>
                            </div>
                            <p className="text-lg font-bold text-gray-800 ml-1">{group.ot_date}</p>
                        </div>

                        {/* Time */}
                        <div className="group p-4 bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-cyan-100/50">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-cyan-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                    <Clock size={20} className="text-white" />
                                </div>
                                <p className="text-sm font-semibold text-gray-600">Time</p>
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
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-md ${getStatusColor(group.authorization_status)}`}>
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
                            <p className="text-lg font-bold text-gray-800 ml-1">{group.name_of_work}</p>
                        </div>

                        {/* Reason */}
                        <div className="group p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-blue-100/50">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                    <MessageSquare size={20} className="text-white" />
                                </div>
                                <p className="text-sm font-semibold text-gray-600">Reason</p>
                            </div>
                            <p className="text-lg font-bold text-gray-800 ml-1">{group.reason}</p>
                        </div>



                        {/* Assigned By */}
                        <div className="group p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-cyan-100/50">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-cyan-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                    <User size={20} className="text-white" />
                                </div>
                                <p className="text-sm font-semibold text-gray-600">Assigned By</p>
                            </div>
                            <p className="text-lg font-bold text-gray-800 ml-1">{group.assigned_by_name}</p>
                        </div>

                        {/* Authorized By */}
                        <div className="group p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-green-100/50">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-green-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                    <UserCheck size={20} className="text-white" />
                                </div>
                                <p className="text-sm font-semibold text-gray-600">Authorized By</p>
                            </div>
                            <p className="text-lg font-bold text-gray-800 ml-1">{group.authorized_by_name}</p>
                        </div>

                        {/* Authorized At */}
                        <div className="group p-4 bg-gradient-to-br from-teal-50 to-green-50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-teal-100/50">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-teal-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                    <Clock size={20} className="text-white" />
                                </div>
                                <p className="text-sm font-semibold text-gray-600">Authorized At</p>
                            </div>
                            <p className="text-lg font-bold text-gray-800 ml-1">
                                {new Date(group.authorized_at).toLocaleString()}
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
                        <h2 className="text-2xl font-bold text-gray-800">Assigned Employees</h2>
                        <span className="ml-auto px-4 py-2 bg-white/70 backdrop-blur-lg rounded-full text-sm font-bold text-blue-600 shadow-md">
                            {employees.length} {employees.length === 1 ? 'Employee' : 'Employees'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                        {employees.map((emp, index) => (
                            <div
                                key={emp.overtime_assignment_id}
                                className="group bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-105"
                                style={{
                                    animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                                }}
                            >
                                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                                    <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        <User size={20} className="text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee No</p>
                                        <p className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                            {emp.employee_no}
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Employee Name</p>
                                    <p className="text-xl font-bold text-gray-800">
                                        {emp.employee_name}
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-gray-200">
                                    {emp.authorization_status === "PENDING" ? (
                                        <button
                                            onClick={() => openAuthorizeModal(emp.overtime_assignment_id)}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:scale-105 transition"
                                        >
                                            <CheckCircle2 size={16} />
                                            PENDING – Click to Review
                                        </button>
                                    ) : (
                                        <span
                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-lg ${getStatusColor(emp.authorization_status)}`}
                                        >
                                            <CheckCircle2 size={16} />
                                            {emp.authorization_status}
                                        </span>
                                    )}


                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <AnimatePresence>
                {showAuthModal && (
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
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold">
                                    {modalAction === "AUTHORIZED" ? "Approve OT" : "Review OT"}
                                </h3>

                                <button
                                    onClick={closeAuthModal}
                                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                                    title="Close"
                                >
                                    ✕
                                </button>
                            </div>



                            <div className="mb-4">
                                <label className="block text-sm font-semibold mb-1">
                                    Authorized By
                                </label>
                                <input
                                    type="text"
                                    value={authorizedByEmployeeNo}
                                    disabled
                                    className="w-full px-4 py-2 border rounded-lg bg-gray-100"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-semibold mb-1">
                                    Remarks <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows="3"
                                    value={authRemarks}
                                    onChange={(e) => setAuthRemarks(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg"
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                {/* APPROVE */}
                                <button
                                    onClick={() => {
                                        setModalAction("AUTHORIZED");
                                        handleAuthorizeSubmit("AUTHORIZED");
                                    }}
                                    disabled={authSubmitting}
                                    className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {authSubmitting ? "Submitting..." : "Approve"}
                                </button>

                                {/* REJECT */}
                                <button
                                    onClick={() => {
                                        setModalAction("REJECTED");
                                        handleAuthorizeSubmit("REJECTED");
                                    }}
                                    disabled={authSubmitting}
                                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
                                >
                                    {authSubmitting ? "Submitting..." : "Reject"}
                                </button>


                            </div>


                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default ViewOtAuthorization;