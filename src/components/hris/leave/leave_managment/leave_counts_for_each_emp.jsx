import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useLocation } from "react-router-dom";
import {
    User,
    Briefcase,
    Building2,
    CalendarDays,
    FileText,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Users,
} from "lucide-react";
import { VscDebugReverseContinue } from "react-icons/vsc";
import { motion, AnimatePresence } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiFetch } from "../../../../utils/apiClient";
const LeaveCountsForEachEmp = () => {
    const API_URL = process.env.REACT_APP_FRONTEND_URL;
    const token = Cookies.get("accessToken");
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const employeeNo = params.get("employee_no");
    const [showReclaimModal, setShowReclaimModal] = useState(false);
    const [selectedLeaveId, setSelectedLeaveId] = useState(null);
    const [reclaimLoading, setReclaimLoading] = useState(false);
    const [employee, setEmployee] = useState(null);
    const [leaveCategories, setLeaveCategories] = useState([]);
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [pagination, setPagination] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [error, setError] = useState("");

    // Fetch leave counts
    useEffect(() => {
        if (!employeeNo) return;
        const fetchLeaveCounts = async () => {
            setLoading(true);
            setError("");
            try {
                const res = await apiFetch(
                    `${API_URL}/v1/hris/leave/getleavecounts-by-employee?employee_no=${employeeNo}`,
                  
                );
                const json = await res.json();
                if (!res.ok) throw new Error(json.message || "Failed to fetch");
                setEmployee(json.employee || null);
                setLeaveCategories(json.leave_categories || []);
            } catch (err) {
                setError(err.message);
                setEmployee(null);
                setLeaveCategories([]);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaveCounts();
    }, [API_URL, token, employeeNo]);

    // Fetch leave history
    useEffect(() => {
        if (!employeeNo) return;
        const fetchLeaveHistory = async () => {
            setHistoryLoading(true);
            try {
                const res = await apiFetch(
                    `${API_URL}/v1/hris/leave/getLeaveByEmployeeNo2?employee_no=${employeeNo}&page=${currentPage}&limit=10`,
                   
                );
                const json = await res.json();
                if (json.success) {
                    setLeaveHistory(json.data || []);
                    setPagination(json.pagination || {});
                }
            } catch (err) {
                console.error("Failed to fetch leave history:", err);
            } finally {
                setHistoryLoading(false);
            }
        };
        fetchLeaveHistory();
    }, [API_URL, token, employeeNo, currentPage]);

    const confirmReclaim = async () => {
        if (!selectedLeaveId) return;
        setReclaimLoading(true);
        try {
            const res = await apiFetch(
                `${API_URL}/v1/hris/leave/reclaim?leave_id=${selectedLeaveId}`,
                {
                    method: "PUT",
                   
                }
            );
            const json = await res.json();
            if (!json.success) {
                toast.error(json.message || "Unable to reclaim leave");
                return;
            }
            toast.success("Leave reclaimed successfully");
            setShowReclaimModal(false);
            setSelectedLeaveId(null);
            const refreshRes = await apiFetch(
                `${API_URL}/v1/hris/leave/getLeaveByEmployeeNo2?employee_no=${employeeNo}&page=${currentPage}&limit=10`,
            );
            const refreshJson = await refreshRes.json();
            setLeaveHistory(refreshJson.data || []);
            setPagination(refreshJson.pagination || {});
        } catch (err) {
            toast.error(err.message || "Something went wrong");
        } finally {
            setReclaimLoading(false);
        }
    };

    const onClickReclaim = (leave) => {
        if (leave.approved_status_1?.toLowerCase() !== "approved") {
            toast.warning("Only APPROVED leave can be reclaimed");
            return;
        }
        setSelectedLeaveId(leave.id);
        setShowReclaimModal(true);
    };

    const getStatusBadge = (status) => {
        const s = status?.toLowerCase();
        if (s === "approved") return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-bold bg-green-500 text-white shadow-md"><CheckCircle2 size={14} />Approved</span>;
        if (s === "pending" || s === "not approved") return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-bold bg-blue-500 text-white shadow-md"><AlertCircle size={14} />Pending</span>;
        if (s === "rejected") return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-bold bg-red-500 text-white shadow-md"><XCircle size={14} />Rejected</span>;
        return <span className="px-3 py-1 rounded-lg text-sm font-bold bg-gray-300 text-gray-700">{status}</span>;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 flex items-center justify-center">
                <div className="bg-white/70 backdrop-blur-lg rounded-xl p-6 shadow-xl">
                    <p className="text-red-600 font-semibold">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 p-3">
            <div>
              

                {/* EMPLOYEE INFO - COMPACT */}
                {employee && (
                    <div className="bg-white/70 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 p-3 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-green-600 rounded-lg">
                                <User size={18} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-lg font-bold text-gray-800">{employee.employee_fullname}</h2>
                                <p className="text-xs text-gray-500">No: {employee.employee_no}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 p-2 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-100/50">
                                <Briefcase size={16} className="text-blue-600" />
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold">Designation</p>
                                    <p className="text-sm font-bold text-gray-800">{employee.designation}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100/50">
                                <Building2 size={16} className="text-green-600" />
                                <div>
                                    <p className="text-xs text-gray-500 font-semibold">Department</p>
                                    <p className="text-sm font-bold text-gray-800">{employee.department}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* LEAVE CATEGORIES - COMPACT */}
                {leaveCategories.length > 0 && (
                    <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-green-600 rounded-lg">
                                <CalendarDays size={18} className="text-white" />
                            </div>
                            <h2 className="text-base font-bold text-gray-800">Leave Balance</h2>
                            
                        </div>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                            {leaveCategories.map((leave) => {
                                const used = leave.actual_count - leave.remaining_count;
                                const pct = leave.actual_count > 0 ? (used / leave.actual_count) * 100 : 0;
                                return (
                                    <div key={leave.leave_category_id} className="bg-white/70 backdrop-blur-lg rounded-lg shadow border border-white/20 p-2 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                                        <div className="flex items-center gap-1 mb-2 pb-1 border-b border-gray-200">
                                            <div className="p-1 bg-gradient-to-br from-blue-500 to-cyan-600 rounded">
                                                <CalendarDays size={12} className="text-white" />
                                            </div>
                                            <h3 className="text-xs font-bold text-gray-800 truncate">{leave.category_name}</h3>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center p-1 bg-gradient-to-br from-blue-50 to-cyan-50 rounded border border-blue-100/50">
                                                <span className="text-xs text-gray-600 font-semibold">Total</span>
                                                <span className="text-sm font-bold text-gray-800">{leave.actual_count}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-1 bg-gradient-to-br from-cyan-50 to-teal-50 rounded border border-cyan-100/50">
                                                <span className="text-xs text-gray-600 font-semibold">Used</span>
                                                <span className="text-sm font-bold text-gray-800">{used}</span>
                                            </div>
                                            <div className={`flex justify-between items-center p-1 rounded border ${leave.remaining_count > 0 ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100/50' : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-100/50'}`}>
                                                <span className="text-xs text-gray-600 font-semibold">Left</span>
                                                <span className={`text-sm font-bold ${leave.remaining_count > 0 ? 'text-green-600' : 'text-red-600'}`}>{leave.remaining_count}</span>
                                            </div>
                                        </div>
                                        <div className="mt-1.5">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="text-xs font-semibold text-gray-500">Usage</span>
                                                <span className="text-xs font-bold text-gray-700">{pct.toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden shadow-inner">
                                                <div className={`h-1.5 rounded-full transition-all duration-1000 ${pct >= 90 ? 'bg-gradient-to-r from-red-500 to-pink-500' : pct >= 70 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`} style={{ width: `${pct}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* LEAVE HISTORY TABLE - COMPACT */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-gradient-to-br from-blue-500 to-green-600 rounded-lg">
                            <FileText size={18} className="text-white" />
                        </div>
                        <h2 className="text-base font-bold text-gray-800">Leave History</h2>
                       
                    </div>
                    <div className="bg-white/70 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 overflow-hidden">
                        {historyLoading ? (
                            <div className="p-8 text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                                <p className="mt-3 text-gray-600 text-sm">Loading history...</p>
                            </div>
                        ) : leaveHistory.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-blue-500 text-white">
                                            <tr>
                                                <th className="px-2 py-2 text-left text-xs font-bold">Date</th>
                                                <th className="px-2 py-2 text-left text-xs font-bold">Category</th>
                                                <th className="px-2 py-2 text-left text-xs font-bold">Type</th>
                                                <th className="px-2 py-2 text-left text-xs font-bold">Reason</th>
                                                <th className="px-2 py-2 text-left text-xs font-bold">Status</th>
                                                <th className="px-2 py-2 text-left text-xs font-bold">Requested</th>
                                                <th className="px-2 py-2 text-left text-xs font-bold">Covering</th>
                                                <th className="px-2 py-2 text-center text-xs font-bold">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {leaveHistory.map((leave) => (
                                                <tr key={leave.id} className="hover:bg-blue-50/50 transition-colors">
                                                    <td className="px-2 py-2 text-xs font-semibold text-gray-800 whitespace-nowrap">
                                                        {new Date(leave.requested_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                        {leave.is_half_day === 1 && <span className="ml-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-bold">½</span>}
                                                    </td>
                                                    <td className="px-2 py-2 text-xs text-gray-700 font-medium">{leave.category_name}</td>
                                                    <td className="px-2 py-2 text-xs">
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold uppercase">{leave.leave_type}</span>
                                                    </td>
                                                    <td className="px-2 py-2 text-xs text-gray-600 max-w-[100px] truncate">{leave.reason || "-"}</td>
                                                    <td className="px-2 py-2">{getStatusBadge(leave.approved_status_1)}</td>
                                                    <td className="px-2 py-2 text-xs text-gray-600 whitespace-nowrap">{new Date(leave.requesting_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                                                    <td className="px-2 py-2 text-xs max-w-[120px]">
                                                        {leave.covering_employees?.length > 0 ? (
                                                            <div className="flex items-center gap-1">
                                                                <Users size={12} className="text-blue-500 flex-shrink-0" />
                                                                <span className="text-gray-700 font-medium truncate">{leave.covering_employees[0].covering_employee_name}</span>
                                                            </div>
                                                        ) : <span className="text-gray-400">-</span>}
                                                    </td>
                                                    <td className="px-2 py-2 text-center">
                                                        <button onClick={() => onClickReclaim(leave)} className="text-blue-600 hover:text-blue-800 transition-colors" title="Reclaim">
                                                            <VscDebugReverseContinue size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {pagination.totalPages > 1 && (
                                    <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 bg-white/50">
                                        <div className="text-xs text-gray-600">Page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{pagination.totalPages}</span></div>
                                        <div className="flex gap-1">
                                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg bg-white border border-gray-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                                <ChevronLeft size={16} />
                                            </button>
                                            <button onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))} disabled={currentPage === pagination.totalPages} className="p-1.5 rounded-lg bg-white border border-gray-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="p-8 text-center">
                                <FileText size={40} className="mx-auto text-gray-400 mb-3" />
                                <p className="text-gray-500 text-sm">No leave history</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RECLAIM MODAL */}
            <AnimatePresence>
                {showReclaimModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                            <div className="flex items-center gap-3 mb-4">
                                <AlertCircle size={28} className="text-orange-500" />
                                <h3 className="text-xl font-bold text-gray-800">Confirm Reclaim</h3>
                            </div>
                            <p className="text-base text-gray-600 mb-6">Are you sure you want to reclaim this leave? This action cannot be undone.</p>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setShowReclaimModal(false)} className="px-5 py-2.5 text-base rounded-lg border border-gray-300 hover:bg-gray-100 font-medium transition-colors" disabled={reclaimLoading}>Cancel</button>
                                <button onClick={confirmReclaim} disabled={reclaimLoading} className="px-5 py-2.5 text-base rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium flex items-center gap-2 transition-colors">
                                    {reclaimLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                    Yes, Reclaim
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover />
        </div>
    );
};

export default LeaveCountsForEachEmp;