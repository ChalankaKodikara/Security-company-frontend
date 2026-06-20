import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import Cookies from "js-cookie";
import { FaArrowRight } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { X } from "lucide-react";
import { apiFetch } from "../../../../utils/apiClient";
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
    for (let i = 0; i < seed.length; i++) {
        hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return palette[hash % palette.length];
};

const getInitials = (fullName = "") => {
    const tokens = String(fullName).trim().split(" ");
    if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
    return (tokens[0][0] + tokens[tokens.length - 1][0]).toUpperCase();
};


const LoanApplicationsWithOrgFilter = () => {
    const API_URL = process.env.REACT_APP_FRONTEND_URL;
    const token = Cookies.get("accessToken");

    // Create auth headers
    const authHeaders = useMemo(() => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${token || ""}`,
    }), [token]);

    const [organizations, setOrganizations] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState("");
    const [showActionModal, setShowActionModal] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [remarks, setRemarks] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [loanData, setLoanData] = useState([]);
    const [loading, setLoading] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    /* ================= LOAD ORGANIZATIONS ================= */
    useEffect(() => {
        const loadOrganizations = async () => {
            try {
                const res = await apiFetch(
                    `${API_URL}/v1/hris/organizations/organization`,
                    {
                        credentials: "include",
                    }
                );
                const json = await res.json();
                if (json.success) {
                    setOrganizations(json.data);
                } else {
                    console.error("Failed to load organizations:", json.message);
                }
            } catch (err) {
                console.error("Failed to load organizations", err);
            }
        };

        if (token) {
            loadOrganizations();
        }
    }, [API_URL, authHeaders, token]);

    /* ================= LOAD LOANS ================= */
    useEffect(() => {
        if (!selectedOrg || !token) return;

        const loadLoans = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    organization_id: selectedOrg,
                    approval_status_1: "PENDING",
                    page: currentPage,
                    limit: rowsPerPage,
                });

                const res = await apiFetch(
                    `${API_URL}/v1/hris/loans/loanapplications?${params.toString()}`,
                    {
                        credentials: "include",
                    }
                );

                const json = await res.json();

                if (res.ok && json.data) {
                    // Map the API response to match component expectations
                    const mappedData = json.data.map(item => ({
                        id: item.id,
                        employee_no: item.employee?.employee_no || item.employee_no,
                        employee_fullname: item.employee?.employee_fullname || "N/A",
                        loan_type_name: item.loanType?.name || "N/A",
                        applied_amount: item.applied_amount,
                        duration_months: item.duration_months,
                        interest_rate: item.interest_rate,
                        approval_status_1: item.approval_status_1,
                        created_at: item.created_at || item.applied_date,
                        // Keep original data for reference
                        raw: item
                    }));

                    setLoanData(mappedData);
                    setTotalRecords(json.totalRecords || json.data.length);
                    setTotalPages(json.totalPages || 1);
                } else {
                    console.error("Failed to load loans:", json.message);
                    setLoanData([]);
                }
            } catch (err) {
                console.error("Failed to load loan applications", err);
            } finally {
                setLoading(false);
            }
        };

        loadLoans();
    }, [API_URL, selectedOrg, currentPage, authHeaders, token]);

    // Check if user is authenticated
    if (!token) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Not Authenticated</h2>
                    <p className="text-gray-600">Please log in to view loan applications.</p>
                </div>
            </div>
        );
    }

    const handleReject = async () => {
        if (!remarks.trim()) {
            toast.error("Remarks are required");
            return;
        }

        setActionLoading(true);
        try {
            const res = await apiFetch(
                `${API_URL}/v1/hris/loans/reject-level-1`,
                {
                    method: "POST",
                  
                    body: JSON.stringify({
                        loan_application_id: selectedLoan.id,
                        remarks,
                    }),
                }
            );

            const json = await res.json();
            toast.info(json.message || "Rejected");

            if (res.ok) {
                setShowActionModal(false);
                setLoanData((prev) =>
                    prev.filter((l) => l.id !== selectedLoan.id)
                );
            }
        } catch (err) {
            toast.error("Reject failed");
        } finally {
            setActionLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!remarks.trim()) {
            toast.error("Remarks are required");
            return;
        }

        setActionLoading(true);
        try {
            const res = await apiFetch(
                `${API_URL}/v1/hris/loans/approve-level-1`,
                {
                    method: "POST",
                   
                    body: JSON.stringify({
                        loan_application_id: selectedLoan.id,
                        remarks,
                    }),
                }
            );

            const json = await res.json();
            toast.success(json.message || "Approved");

            if (res.ok) {
                setShowActionModal(false);
                setLoanData((prev) =>
                    prev.filter((l) => l.id !== selectedLoan.id)
                );
            }
        } catch (err) {
            toast.error("Approve failed");
        } finally {
            setActionLoading(false);
        }
    };
    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <h1 className="text-3xl font-bold mb-6">Pending Loan Applications</h1>

            {/* ================= ORGANIZATION FILTER ================= */}
            <div className="mb-6 w-80">
                <label className="block text-sm font-semibold mb-2">
                    Organization
                </label>
                <select
                    value={selectedOrg}
                    onChange={(e) => {
                        setSelectedOrg(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Select Organization</option>
                    {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                            {org.organization_name} ({org.code})
                        </option>
                    ))}
                </select>
            </div>

            {/* ================= TABLE ================= */}
            <motion.div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                {[
                                    "Employee Name",
                                    "Loan Type",
                                    "Amount",
                                    "Duration (Months)",
                                    "Interest %",
                                    "Approval Status",
                                    "Applied Date",
                                    "Action"
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
                                    <td colSpan="8" className="text-center py-10">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 1 }}
                                            className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"
                                        />
                                    </td>
                                </tr>
                            ) : loanData.length > 0 ? (
                                loanData.map((row, index) => (
                                    <motion.tr
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="hover:bg-gray-50"
                                    >


                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="absolute inset-0 rounded-full ring-2 ring-blue-500 ring-offset-2" />
                                                    <div
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg bg-gradient-to-br ${avatarBgClass(
                                                            row.employee_fullname || row.employee_no
                                                        )}`}
                                                    >
                                                        {getInitials(
                                                            row.employee_fullname || row.employee_no
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="font-semibold">
                                                        {row.employee_fullname}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {row.employee_no}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-3">{row.loan_type_name}</td>
                                        <td className="px-6 py-3">{row.applied_amount}</td>
                                        <td className="px-6 py-3">{row.duration_months}</td>
                                        <td className="px-6 py-3">{row.interest_rate}%</td>

                                        <td className="px-6 py-3">
                                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                                {row.approval_status_1}
                                            </span>
                                        </td>

                                        <td className="px-6 py-3">
                                            {row.created_at?.split("T")[0]}
                                        </td>

                                        <td
                                            className="px-6 py-3 text-blue-500 cursor-pointer"
                                            onClick={() => {
                                                setSelectedLoan(row);
                                                setRemarks("");
                                                setShowActionModal(true);
                                            }}
                                        >
                                            <FaArrowRight />
                                        </td>

                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center py-10">
                                        <Users size={48} className="mx-auto text-gray-400" />
                                        <p className="text-gray-600 mt-3">
                                            {selectedOrg
                                                ? "No pending loan applications"
                                                : "Please select an organization"}
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ================= PAGINATION ================= */}
                {!loading && loanData.length > 0 && (
                    <div className="p-4 bg-gray-50 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
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
                                className="px-4 py-2 rounded-xl border bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                            >
                                <ChevronLeft className="inline w-4 h-4" /> Prev
                            </button>

                            <div className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium">
                                Page {currentPage} / {totalPages}
                            </div>

                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(currentPage + 1)}
                                className="px-4 py-2 rounded-xl border bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                            >
                                Next <ChevronRight className="inline w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>

            {showActionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
                    >
                        {/* Close */}
                        <button
                            onClick={() => setShowActionModal(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                        >
                            <X />
                        </button>

                        <h2 className="text-xl font-bold mb-4">
                            Loan Action
                        </h2>

                        <p className="text-sm text-gray-600 mb-2">
                            {selectedLoan?.employee_fullname} – {selectedLoan?.loan_type_name}
                        </p>

                        <textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Enter remarks"
                            className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500"
                            rows={4}
                        />

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={handleReject}
                                disabled={actionLoading}
                                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                            >
                                Reject
                            </button>

                            <button
                                onClick={handleApprove}
                                disabled={actionLoading}
                                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                            >
                                Approve
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
            <ToastContainer position="top-right" autoClose={3000} />

        </div>
    );
};

export default LoanApplicationsWithOrgFilter;