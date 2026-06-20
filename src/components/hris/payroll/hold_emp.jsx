import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Cookies from "js-cookie";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Users, MapPin } from "lucide-react";
import { MdDeleteOutline } from "react-icons/md";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiFetch } from "../../../utils/apiClient";

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


const HoldEmp = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const API_URL = process.env.REACT_APP_FRONTEND_URL;
    const token = Cookies.get("accessToken");
    const [empSearch, setEmpSearch] = useState("");
    const [empResults, setEmpResults] = useState([]);
    const [empLoading, setEmpLoading] = useState(false);
    const [showEmpDropdown, setShowEmpDropdown] = useState(false);
    /* URL PARAMS */
    const organizationId = searchParams.get("org_id");
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const search = searchParams.get("search") || "";
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 7;

    /* STATE */
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const [showHoldDrawer, setShowHoldDrawer] = useState(false);
    const [holdForm, setHoldForm] = useState({
        employee_no: "",
        month: "",
        year: "",
        reason: "",
    });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const months = [
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

    useEffect(() => {
        if (!empSearch || empSearch.length < 2) {
            setEmpResults([]);
            return;
        }

        const controller = new AbortController();

        const fetchEmployees = async () => {
            setEmpLoading(true);
            try {
                const params = new URLSearchParams({
                    search: empSearch,
                    organization_id: organizationId, // keep this
                });

                const res = await apiFetch(
                    `${API_URL}/v1/hris/employees/employee/all-details?${params.toString()}`,
                    {
                        
                        signal: controller.signal,
                    }
                );

                const result = await res.json();
                setEmpResults(result?.data || []);
            } catch (err) {
                if (err.name !== "AbortError") console.error(err);
            } finally {
                setEmpLoading(false);
            }
        };

        fetchEmployees();

        return () => controller.abort();
    }, [empSearch, API_URL, token, organizationId]);


    const submitHold = async () => {
        if (!holdForm.employee_no || !holdForm.month || !holdForm.year || !holdForm.reason) {
            alert("All fields are required");
            return;
        }

        setSubmitting(true);

            try {
                const res = await apiFetch(`${API_URL}/v1/hris/payroll/hold`, {
                method: "POST",
                
                body: JSON.stringify({
                    organization_id: Number(organizationId),
                    employee_no: holdForm.employee_no,
                    month: Number(holdForm.month),
                    year: Number(holdForm.year),
                    reason: holdForm.reason,
                    payroll_group: "Ho",
                }),
            });

            const result = await res.json();

            if (result?.success) {
                setShowHoldDrawer(false);
                setHoldForm({ employee_no: "", month: "", year: "", reason: "" });
                window.location.reload();
            } else {
                alert(result?.message || "Failed to hold employee");
            }
        } catch (err) {
            console.error(err);
            alert("Server error");
        } finally {
            setSubmitting(false);
        }
    };
    const confirmDeleteHold = async () => {
        if (!deleteId) return;

        setDeleting(true);
            try {
            const res = await apiFetch(
                `${API_URL}/v1/hris/payroll/hold/${deleteId}?payroll_group=Ho`,
                {
                    method: "DELETE",
                    
                }
            );

            const result = await res.json();

            if (result?.success) {
                toast.success("Hold record deleted successfully");
                setAttendanceData((prev) =>
                    prev.filter((item) => item.id !== deleteId)
                );
                setShowDeleteModal(false);
            } else {
                toast.error(result?.message || "Delete failed");
            }
        } catch (err) {
            console.error(err);
            toast.error("Server error while deleting");
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    const [submitting, setSubmitting] = useState(false);
    /* FETCH DATA */
    useEffect(() => {
        if (!organizationId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    organization_id: organizationId,
                    year,
                    month,
                    page,
                    limit,
                    search,
                    payroll_group: "Ho",
                });

                const response = await apiFetch(
                    `${API_URL}/v1/hris/payroll/hold?${params.toString()}`,
                   
                );

                const result = await response.json();

                if (result?.success) {
                    setAttendanceData(result.data || []);
                    setTotalRecords(result.pagination?.total || 0);
                    setTotalPages(result.pagination?.totalPages || 1);
                } else {
                    setAttendanceData([]);
                }
            } catch (err) {
                console.error(err);
                setAttendanceData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [organizationId, year, month, page, limit, search, API_URL, token]);

    /* SEARCH HANDLER */
    const onSearchChange = (e) => {
        const value = e.target.value;
        const params = new URLSearchParams(searchParams);
        params.set("search", value);
        params.set("page", 1);
        setSearchParams(params);
    };

    /* PAGINATION */
    const goToPage = (p) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", p);
        setSearchParams(params);
    };

    useEffect(() => {
        if (showHoldDrawer) {
            setHoldForm((prev) => ({
                ...prev,
                year: year ? Number(year) : "",
                month: month ? Number(month) : "",
            }));
        }
    }, [showHoldDrawer, year, month]);

    return (
        <>
            {/* SEARCH BAR */}
            <div className="mb-4 flex justify-between items-center">
                <div>
                    <input
                        value={search}
                        onChange={onSearchChange}
                        placeholder="Search employee, reason, email..."
                        className="w-72 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <button
                        onClick={() => setShowHoldDrawer(true)}
                        className="bg-blue-600 text-white px-5 py-3 rounded-xl shadow hover:bg-blue-700"
                    >
                        Hold Employees
                    </button>

                </div>
            </div>

            {/* TABLE */}
            <motion.div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                {[
                                    "Employee No",
                                    "Employee Name",
                                    "Active Status",
                                    "Month / Year",
                                    "Hold Reason",
                                    "Status",
                                    "Action"
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
                                    <td colSpan="6" className="text-center py-10">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 1 }}
                                            className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"
                                        />
                                    </td>
                                </tr>
                            ) : attendanceData.length > 0 ? (
                                attendanceData.map((row, index) => (
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
                                                <motion.div whileHover={{ scale: 1.1 }} className="relative">
                                                    <div className="absolute inset-0 rounded-full ring-2 ring-blue-500 ring-offset-2" />
                                                    <div
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg bg-gradient-to-br ${avatarBgClass(
                                                            row.employee_fullname || row.employee_no
                                                        )}`}
                                                    >
                                                        {getInitials(row.employee_fullname || row.employee_no)}
                                                    </div>
                                                </motion.div>
                                                <div>
                                                    <div className="font-semibold text-gray-800">
                                                        {row.employee_fullname}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {row.employee_email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-3">{row.employee_active_status}</td>
                                        <td className="px-6 py-3">
                                            {row.month}/{row.year}
                                        </td>
                                        <td className="px-6 py-3 text-gray-600">{row.reason}</td>

                                        <td className="px-6 py-3">
                                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                                ON HOLD
                                            </span>
                                        </td>

                                        <td className="flex items-center gap-5 px-6 py-3">
                                            <MdDeleteOutline
                                                size={20}
                                                className="text-red-600 cursor-pointer hover:scale-110 transition"
                                                onClick={() => {
                                                    setDeleteId(row.id); // IMPORTANT: ID from payroll/hold list
                                                    setShowDeleteModal(true);
                                                }}
                                            />

                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-10">
                                        <Users size={50} className="mx-auto text-gray-400" />
                                        <p className="text-gray-600 mt-3">No records found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                {!loading && attendanceData.length > 0 && (
                    <div className="p-4 bg-gray-50 flex items-center justify-between">
                        <div>
                            Showing{" "}
                            <strong>
                                {(page - 1) * limit + 1} –{" "}
                                {Math.min(page * limit, totalRecords)}
                            </strong>{" "}
                            of <strong>{totalRecords}</strong>
                        </div>

                        <div className="flex gap-3">
                            <button
                                disabled={page === 1}
                                onClick={() => goToPage(page - 1)}
                                className="px-4 py-2 rounded-xl border bg-white hover:border-blue-500 disabled:opacity-50"
                            >
                                <ChevronLeft className="inline" /> Prev
                            </button>

                            <div className="px-4 py-2 rounded-xl bg-blue-600 text-white">
                                Page {page} / {totalPages}
                            </div>

                            <button
                                disabled={page === totalPages}
                                onClick={() => goToPage(page + 1)}
                                className="px-4 py-2 rounded-xl border bg-white hover:border-blue-500 disabled:opacity-50"
                            >
                                Next <ChevronRight className="inline" />
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>


            {showHoldDrawer && (
                <>
                    {/* BLUR BACKDROP */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowHoldDrawer(false)}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                    />

                    {/* DRAWER */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                        className="fixed top-0 right-0 w-[420px] h-full bg-white z-50 shadow-2xl p-6 overflow-y-auto"
                    >
                        <h2 className="text-xl font-bold mb-6">Hold Employee Payroll</h2>

                        {/* EMPLOYEE SEARCH */}
                        <div className="mb-4 relative">
                            <label className="text-sm font-semibold">Employee</label>

                            <input
                                value={empSearch}
                                onChange={(e) => {
                                    setEmpSearch(e.target.value);
                                    setShowEmpDropdown(true);
                                }}
                                onFocus={() => setShowEmpDropdown(true)}
                                placeholder="Search employee (Emp No / Name)"
                                className="w-full mt-1 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                            />

                            {/* DROPDOWN */}
                            {showEmpDropdown && (
                                <div className="absolute z-50 w-full bg-white border rounded-xl shadow-lg mt-1 max-h-56 overflow-y-auto">
                                    {empLoading ? (
                                        <div className="p-3 text-center text-sm text-gray-500">
                                            Searching...
                                        </div>
                                    ) : empResults.length > 0 ? (
                                        empResults.map((emp) => (
                                            <div
                                                key={emp.employee_no}
                                                onClick={() => {
                                                    setHoldForm({
                                                        ...holdForm,
                                                        employee_no: emp.employee_no,
                                                    });
                                                    setEmpSearch(
                                                        `${emp.employee_no} - ${emp.employee_fullname}`
                                                    );
                                                    setShowEmpDropdown(false);
                                                }}
                                                className="px-4 py-3 cursor-pointer hover:bg-blue-50"
                                            >
                                                <div className="font-semibold text-sm">
                                                    {emp.employee_no}
                                                </div>
                                                <div className="text-xs text-gray-600">
                                                    {emp.employee_fullname}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-3 text-sm text-gray-500 text-center">
                                            No employees found
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-gray-400 mt-1">
                            Month & year are fixed based on selected payroll period
                        </p>

                        {/* Month */}
                        <div className="mb-4">
                            <label className="text-sm font-semibold">Month</label>
                            <select
                                value={holdForm.month}
                                disabled
                                className="w-full mt-1 px-4 py-2 border rounded-xl bg-gray-100 cursor-not-allowed"
                            >
                                {months.map((m) => (
                                    <option key={m.value} value={m.value}>
                                        {m.label}
                                    </option>
                                ))}
                            </select>

                        </div>

                        {/* Year */}
                        <div className="mb-4">
                            <label className="text-sm font-semibold">Year</label>
                            <select
                                value={holdForm.year}
                                disabled
                                className="w-full mt-1 px-4 py-2 border rounded-xl bg-gray-100 cursor-not-allowed"
                            >
                                {years.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>

                        </div>

                        {/* Reason */}
                        <div className="mb-6">
                            <label className="text-sm font-semibold">Reason</label>
                            <textarea
                                rows="4"
                                value={holdForm.reason}
                                onChange={(e) => setHoldForm({ ...holdForm, reason: e.target.value })}
                                className="w-full mt-1 px-4 py-2 border rounded-xl"
                                placeholder="Under investigation"
                            />
                        </div>

                        {/* ACTIONS */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowHoldDrawer(false)}
                                className="flex-1 py-3 rounded-xl border"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={submitting}
                                onClick={submitHold}
                                className="flex-1 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                            >
                                {submitting ? "Submitting..." : "Hold Payroll"}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}

            {showDeleteModal && (
                <>
                    {/* BACKDROP */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                        onClick={() => setShowDeleteModal(false)}
                    />

                    {showDeleteModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center"
                        >
                            {/* BACKDROP */}
                            <div
                                onClick={() => setShowDeleteModal(false)}
                                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            />

                            {/* MODAL */}
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                className="relative bg-white rounded-2xl shadow-2xl w-[380px] p-6"
                            >
                                <h3 className="text-lg font-bold mb-2 text-red-600">
                                    Delete Hold Record
                                </h3>

                                <p className="text-sm text-gray-600 mb-6">
                                    Are you sure you want to remove this employee from payroll hold?
                                    <br />
                                    <span className="text-red-500 font-semibold">
                                        This action cannot be undone.
                                    </span>
                                </p>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowDeleteModal(false)}
                                        className="flex-1 py-2 rounded-xl border hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        disabled={deleting}
                                        onClick={confirmDeleteHold}
                                        className="flex-1 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700"
                                    >
                                        {deleting ? "Deleting..." : "Yes, Delete"}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                </>
            )}
            <ToastContainer position="top-right" autoClose={3000} />

        </>
    );
};

export default HoldEmp;
