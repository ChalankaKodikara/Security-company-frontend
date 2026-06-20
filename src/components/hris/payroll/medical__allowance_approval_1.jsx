/** @format */
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Users, Check, X, Download } from "lucide-react";
import Cookies from "js-cookie";
import Modal from "react-modal";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiFetch } from "../../../utils/apiClient";
const MedicalAllowanceApproval1 = () => {
    const API_URL = process.env.REACT_APP_FRONTEND_URL;
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [approvalStatus1, setApprovalStatus1] = useState("PENDING");
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [selectedClaimId, setSelectedClaimId] = useState(null);
    const [remarks, setRemarks] = useState("");
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectRemarks, setRejectRemarks] = useState("");
    const [docModalOpen, setDocModalOpen] = useState(false);
    const [selectedDocs, setSelectedDocs] = useState([]);

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

    const handleApproveLevel1 = async () => {
        if (!remarks.trim()) {
            toast.error("Please enter remarks");
            return;
        }

        try {
            const response = await apiFetch(
                `${API_URL}/v1/hris/claims/approve-level-1`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        claim_id: selectedClaimId,
                        remarks: remarks,
                    }),
                }
            );

            const res = await response.json();

            if (!response.ok) {
                throw new Error(res.message || "Approval failed");
            }

            toast.success(res.message || "Approved successfully");

            toast.success(res.data.message || "Approved successfully");

            setApproveModalOpen(false);
            setRemarks("");
            setSelectedClaimId(null);

            fetchClaims(); // refresh table
        } catch (error) {
            const msg =
                error.response?.data?.message || "Something went wrong";
            toast.error(msg);
        }
    };

    const handleRejectLevel1 = async () => {
        if (!rejectRemarks.trim()) {
            toast.error("Please enter rejection remarks");
            return;
        }

        try {
            const response = await apiFetch(
                `${API_URL}/v1/hris/claims/reject-level-1`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        claim_id: selectedClaimId,
                        remarks: rejectRemarks,
                    }),
                }
            );

            const res = await response.json();

            if (!response.ok) {
                throw new Error(res.message || "Rejection failed");
            }

            toast.success(res.message || "Rejected successfully");

            toast.success(res.data.message || "Rejected successfully");

            setRejectModalOpen(false);
            setRejectRemarks("");
            setSelectedClaimId(null);

            fetchClaims(); // refresh table
        } catch (error) {
            const msg =
                error.response?.data?.message || "Something went wrong";
            toast.error(msg);
        }
    };


    // Search fields
    const [employeeNo, setEmployeeNo] = useState("");
    const fetchClaims = async () => {
        try {
            setLoading(true);

            const query = new URLSearchParams({
                claim_type: "MEDICAL",
                approval_status_1: approvalStatus1,
                page: currentPage,
                limit: rowsPerPage,
                ...(employeeNo && { employee_no: employeeNo }),
            }).toString();

            const response = await apiFetch(
                `${API_URL}/v1/hris/claims/?${query}`,
                { method: "GET" }
            );

            if (!response.ok) throw new Error("Failed to fetch claims");

            const res = await response.json();

            setData(res.data || []);
            setTotalPages(res.pagination?.totalPages || 1);
            setTotalRecords(res.pagination?.totalRecords || 0);

            setData(res.data.data || []);
            setTotalPages(res.data.pagination.totalPages);
            setTotalRecords(res.data.pagination.totalRecords);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClaims();
    }, [currentPage]);

    const downloadClaimDocument = async (employeeNo, documentPath) => {
        try {
            const response = await apiFetch(
                `${API_URL}/v1/hris/download/download/claim-document?employee_no=${employeeNo}&document_path=${documentPath}`,
                {
                    method: "GET",
                }
            );

            if (!response.ok) {
                throw new Error("Download failed");
            }

            const blob = await response.blob();

            const fileName = documentPath.split("/").pop() || "claim-document";

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);;
            link.href = url;
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error("Failed to download document");
        }
    };

    const openDocumentsModal = (employeeNo, documents) => {
        if (!documents || documents.length === 0) {
            toast.error("No documents available");
            return;
        }

        setSelectedDocs(
            documents.map(doc => ({
                employee_no: employeeNo,
                document_path: doc.document_path,
            }))
        );

        setDocModalOpen(true);
    };

    return (
        <motion.div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* SEARCH BAR */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-white rounded-2xl shadow-md border border-gray-200 p-5"
            >
                {/* SEARCH BAR */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 bg-white rounded-2xl shadow-md border border-gray-200 p-5"
                >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">

                        {/* Employee No */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Employee No
                            </label>
                            <input
                                type="text"
                                value={employeeNo}
                                onChange={(e) => setEmployeeNo(e.target.value)}
                                placeholder="CBEU8888"
                                className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        {/* Approval Level 1 Status */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Approval Level 1 Status
                            </label>
                            <select
                                value={approvalStatus1}
                                onChange={(e) => setApprovalStatus1(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="PENDING">Pending</option>
                                <option value="APPROVED">Approved</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>

                        {/* Search */}
                        <button
                            onClick={() => {
                                setCurrentPage(1);
                                fetchClaims();
                            }}
                            className="px-6 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
                        >
                            Search
                        </button>

                        {/* Reset */}
                        <button
                            onClick={() => {
                                setEmployeeNo("");
                                setApprovalStatus1("PENDING");
                                setCurrentPage(1);
                                fetchClaims();
                            }}
                            className="px-6 py-2 rounded-xl border border-gray-300 bg-white hover:border-blue-500 font-semibold"
                        >
                            Reset
                        </button>

                    </div>
                </motion.div>

            </motion.div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            {[
                                "Employee",
                                "Claim Type",
                                "Requested Amount",
                                "Requested Date",
                                "Approval 1",
                                "Approval 2",

                                "Documents",
                                "Actions",
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
                                <td colSpan="9" className="text-center py-10">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1 }}
                                        className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"
                                    />
                                </td>
                            </tr>
                        ) : data.length > 0 ? (
                            data.map((row) => (
                                <motion.tr
                                    key={row.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="hover:bg-gray-50"
                                >
                                    {/* Employee */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <motion.div
                                                whileHover={{ scale: 1.1, rotate: 5 }}
                                                className="relative"
                                            >
                                                {/* Outer blue ring */}
                                                <div className="absolute inset-0 rounded-full ring-2 ring-blue-500 ring-offset-2" />

                                                {/* Avatar */}
                                                <div
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center 
        text-white text-sm font-bold shadow-lg bg-gradient-to-br ${avatarBgClass(
                                                        row.Employee?.employee_calling_name || row.employee_no
                                                    )}`}
                                                >
                                                    {getInitials(
                                                        row.Employee?.employee_calling_name || row.employee_no
                                                    )}
                                                </div>
                                            </motion.div>

                                            <div>
                                                <div className="font-semibold text-gray-800">
                                                    {row.Employee?.employee_calling_name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    ID: {row.employee_no}
                                                </div>
                                            </div>
                                        </div>
                                    </td>


                                    {/* Claim Type */}
                                    <td className="px-6 py-3 font-semibold text-blue-600">
                                        {row.ClaimConfiguration?.claim_type}
                                    </td>

                                    {/* Amount */}
                                    <td className="px-6 py-3">
                                        Rs. {row.claim_amount}
                                    </td>

                                    {/* Date */}
                                    <td className="px-6 py-3">
                                        {row.claim_requested_date}
                                    </td>

                                    {/* Approval 1 */}
                                    <td className="px-6 py-3">
                                        <StatusBadge status={row.approval_status_1} />
                                    </td>

                                    {/* Approval 2 */}
                                    <td className="px-6 py-3">
                                        <StatusBadge status={row.approval_status_2} />
                                    </td>



                                    <td className="px-6 py-3">
                                        {row.EmployeeClaimDocuments?.length > 0 ? (
                                            <button
                                                onClick={() =>
                                                    openDocumentsModal(
                                                        row.employee_no,
                                                        row.EmployeeClaimDocuments
                                                    )
                                                }
                                                className="relative flex items-center justify-center 
                       p-2 rounded-lg bg-blue-50 text-blue-600 
                       hover:bg-blue-100"
                                                title="View documents"
                                            >
                                                <Download size={16} />

                                                <span
                                                    className="absolute -top-1 -right-1 
                           bg-blue-600 text-white text-[10px] 
                           px-1.5 py-0.5 rounded-full"
                                                >
                                                    {row.EmployeeClaimDocuments.length}
                                                </span>
                                            </button>
                                        ) : (
                                            <span className="text-xs text-gray-400">—</span>
                                        )}
                                    </td>


                                    {/* Actions */}
                                    <td className="px-6 py-3">
                                        <div className="flex gap-2">

                                            <button
                                                onClick={() => {
                                                    setSelectedClaimId(row.id);
                                                    setApproveModalOpen(true);
                                                }}
                                                className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200"
                                            >
                                                <Check size={16} />
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setSelectedClaimId(row.id);
                                                    setRejectModalOpen(true);
                                                }}
                                                className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
                                            >
                                                <X size={16} />
                                            </button>

                                        </div>
                                    </td>
                                </motion.tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="9" className="text-center py-10">
                                    <Users size={50} className="mx-auto text-gray-400" />
                                    <p className="text-gray-600 mt-3">No claims found</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* PAGINATION */}
            {!loading && data.length > 0 && (
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
                            className="px-4 py-2 rounded-xl border bg-white"
                        >
                            <ChevronLeft /> Prev
                        </button>

                        <div className="px-4 py-2 rounded-xl bg-blue-600 text-white">
                            Page {currentPage} / {totalPages}
                        </div>

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(currentPage + 1)}
                            className="px-4 py-2 rounded-xl border bg-white"
                        >
                            Next <ChevronRight />
                        </button>
                    </div>
                </div>
            )}

            <Modal
                isOpen={approveModalOpen}
                onRequestClose={() => setApproveModalOpen(false)}
                className="bg-white rounded-2xl shadow-xl max-w-md w-full 
                         max-h-[70vh] p-6 outline-none overflow-y-auto"
                overlayClassName="fixed inset-0 bg-black bg-opacity-40 
                                flex items-center justify-center z-50"
            >
                <h2 className="text-lg font-bold mb-4">
                    Approve Claim (Level 1)
                </h2>

                <label className="block text-sm font-semibold text-gray-600 mb-2">
                    Remarks
                </label>

                <textarea
                    rows={4}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter approval remarks"
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={() => setApproveModalOpen(false)}
                        className="px-4 py-2 rounded-xl border border-gray-300 bg-white"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleApproveLevel1}
                        className="px-4 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700"
                    >
                        Approve
                    </button>
                </div>
            </Modal>

            <Modal
                isOpen={rejectModalOpen}
                onRequestClose={() => setRejectModalOpen(false)}
                className="bg-white rounded-2xl shadow-xl max-w-md w-full 
                        max-h-[70vh] p-6 outline-none overflow-y-auto"
                overlayClassName="fixed inset-0 bg-black bg-opacity-40 
                               flex items-center justify-center z-50"
            >
                <h2 className="text-lg font-bold mb-4 text-red-600">
                    Reject Claim (Level 1)
                </h2>

                <label className="block text-sm font-semibold text-gray-600 mb-2">
                    Rejection Remarks
                </label>

                <textarea
                    rows={4}
                    value={rejectRemarks}
                    onChange={(e) => setRejectRemarks(e.target.value)}
                    placeholder="Enter rejection reason"
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={() => setRejectModalOpen(false)}
                        className="px-4 py-2 rounded-xl border border-gray-300 bg-white"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleRejectLevel1}
                        className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700"
                    >
                        Reject
                    </button>
                </div>
            </Modal>
            <Modal
                isOpen={docModalOpen}
                onRequestClose={() => setDocModalOpen(false)}
                className="bg-white rounded-2xl shadow-xl max-w-lg w-full 
               max-h-[70vh] p-6 outline-none overflow-y-auto"
                overlayClassName="fixed inset-0 bg-black bg-opacity-40 
                      flex items-center justify-center z-50"
            >
                <h2 className="text-lg font-bold mb-4">
                    Claim Documents
                </h2>

                <div className="space-y-3">
                    {selectedDocs.map((doc, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between 
                           p-3 border rounded-xl hover:bg-gray-50"
                        >
                            <div className="text-sm font-medium text-gray-700 truncate">
                                {doc.document_path.split("/").pop()}
                            </div>

                            <button
                                onClick={() =>
                                    downloadClaimDocument(
                                        doc.employee_no,
                                        doc.document_path
                                    )
                                }
                                className="px-3 py-1 rounded-lg 
                               bg-blue-600 text-white text-xs 
                               hover:bg-blue-700"
                            >
                                Download
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        onClick={() => setDocModalOpen(false)}
                        className="px-4 py-2 rounded-xl border bg-white"
                    >
                        Close
                    </button>
                </div>
            </Modal>

            <ToastContainer position="top-right" autoClose={3000} />

        </motion.div>


    );
};

export default MedicalAllowanceApproval1;

const StatusBadge = ({ status }) => {
    if (!status) return <span className="text-gray-400">—</span>;

    const styles = {
        PENDING: "bg-yellow-100 text-yellow-700",
        APPROVED: "bg-green-100 text-green-700",
        REJECTED: "bg-red-100 text-red-700",
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
            {status}
        </span>
    );
};
