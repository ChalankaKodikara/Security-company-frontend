import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserX, UserMinus, ChevronLeft, ChevronRight, X } from "lucide-react";
import Cookies from "js-cookie";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";

const EmployeeTermination = () => {
    const API_URL = process.env.REACT_APP_FRONTEND_URL;
    const token = Cookies.get("accessToken");

    const authHeaders = useMemo(
        () => ({
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || ""}`,
        }),
        [token]
    );

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

    // State
    const [showForm, setShowForm] = useState(null);
    const [organizations, setOrganizations] = useState([]);
    const [statusChangeData, setStatusChangeData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Filters
    const [selectedOrg, setSelectedOrg] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // Form data
    const [selectedEmployeeOption, setSelectedEmployeeOption] = useState(null);
    const [employeeNo, setEmployeeNo] = useState("");
    const [terminationDate, setTerminationDate] = useState("");
    const [reason, setReason] = useState("");
    const [remarks, setRemarks] = useState("");
    const [sendMail, setSendMail] = useState(true);
    const [noticeDays, setNoticeDays] = useState("");
    const [document, setDocument] = useState(null);
    const [employeeOptions, setEmployeeOptions] = useState([]);
    const [employeeSearchLoading, setEmployeeSearchLoading] = useState(false);
    const [typeFilter, setTypeFilter] = useState(""); // "" = ALL
    const [source, setSource] = useState("OUTLOOK");
    const [warningLevel, setWarningLevel] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const rowsPerPage = 10;

    // Load organizations
    useEffect(() => {
        if (!token) return;
        const loadOrgs = async () => {
            try {
                const res = await fetch(`${API_URL}/v1/hris/organizations/organization`, {
                    headers: authHeaders,
                });
                const json = await res.json();
                if (json.success) setOrganizations(json.data);
            } catch (err) {
                console.error("Failed to load organizations", err);
            }
        };
        loadOrgs();
    }, [API_URL, authHeaders, token]);

    useEffect(() => {
        if (!selectedOrg || !token) return;

        const loadStatusChanges = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    page: currentPage,
                    limit: rowsPerPage,
                    organization_id: selectedOrg,
                    type: typeFilter,
                    warning_level: "",
                    search: "",
                    fromDate: "",
                    toDate: "",
                });

                const res = await fetch(
                    `${API_URL}/v1/hris/employeeStatusChange/get?${params.toString()}`,
                    { headers: authHeaders }
                );

                const json = await res.json();

                if (res.ok && json.success) {
                    setStatusChangeData(json.data || []);
                    setTotalRecords(json.pagination?.total || 0);
                    setTotalPages(json.pagination?.totalPages || 1);
                } else {
                    setStatusChangeData([]);
                }
            } catch (err) {
                console.error("Failed to load status changes", err);
            } finally {
                setLoading(false);
            }
        };

        loadStatusChanges();
    }, [API_URL, selectedOrg, currentPage, typeFilter, authHeaders, token]);


    // Employee search with debounce
    useEffect(() => {
        if (!token) return;
        if (!searchQuery || searchQuery.trim().length < 2) {
            setEmployeeOptions([]);
            return;
        }

        let ignore = false;
        const controller = new AbortController();

        const load = async () => {
            try {
                setEmployeeSearchLoading(true);
                const res = await fetch(
                    `${API_URL}/v1/hris/employees/employee/all-details?search=${encodeURIComponent(
                        searchQuery.trim()
                    )}`,
                    {
                        headers: authHeaders,
                        signal: controller.signal,
                    }
                );

                const json = await res.json();

                if (!ignore) {
                    const list = (json.data || []).map((emp) => ({
                        value: emp.employee_no,
                        label: `${emp.employee_fullname} (${emp.employee_no})`,
                    }));
                    setEmployeeOptions(list);
                }
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.error("Employee search failed", err);
                }
            } finally {
                if (!ignore) setEmployeeSearchLoading(false);
            }
        };

        const timer = setTimeout(load, 400);

        return () => {
            ignore = true;
            controller.abort();
            clearTimeout(timer);
        };
    }, [searchQuery, API_URL, authHeaders, token]);

    const resetForm = () => {
        setSelectedEmployeeOption(null);
        setEmployeeNo("");
        setTerminationDate("");
        setReason("");
        setRemarks("");
        setSearchQuery("");
        setNoticeDays("");
        setDocument(null);
        setSendMail(true);
        setSource("OUTLOOK");
        setWarningLevel("");
        setShowForm(null);
        setEmployeeOptions([]);
    };


    const handleSubmit = async () => {
        if (!employeeNo || !terminationDate || !reason) {
            toast.error("Please fill all required fields");
            return;
        }

        setSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("employeeId", employeeNo);
            formData.append("effective_date", terminationDate);
            formData.append("notice_days", noticeDays || 0);
            formData.append("reason", reason);
            formData.append("source", source);
            formData.append("warning_level", warningLevel);
            formData.append("send_mail", sendMail ? "true" : "false");

            if (document) {
                formData.append("document", document);
            }


            const endpoint = showForm === "terminate"
                ? `${API_URL}/v1/hris/employeeStatusChange/termination`
                : `${API_URL}/v1/hris/employeeStatusChange/resignation`;

            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const json = await res.json();
            if (!employeeNo || !terminationDate || !reason || !source) {
                toast.error("Please fill all required fields");
                return;
            }

            if (res.ok) {
                toast.success(
                    json.message ||
                    `${showForm === "terminate" ? "Termination" : "Resignation"} processed successfully`
                );
                resetForm();

                const params = new URLSearchParams({
                    page: currentPage,
                    limit: rowsPerPage,
                    organization_id: selectedOrg,
                    type: typeFilter,
                    warning_level: "",
                    search: "",
                    fromDate: "",
                    toDate: "",
                });


                const refreshRes = await fetch(
                    `${API_URL}/v1/hris/employeeStatusChange/get?${params.toString()}`,
                    { headers: authHeaders }
                );
                const refreshJson = await refreshRes.json();
                if (refreshRes.ok && refreshJson.success) {
                    const filtered = (refreshJson.data || []).filter(
                        item => item.type === "TERMINATION" || item.type === "RESIGNATION"
                    );
                    setStatusChangeData(filtered);
                }
            } else {
                toast.error(json.message || "Operation failed");
            }
        } catch (err) {
            console.error("Submit error:", err);
            toast.error("Request failed");
        } finally {
            setSubmitting(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Not Authenticated</h2>
                    <p className="text-gray-600">Please log in to access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                closeOnClick
                pauseOnHover
            />

            <h1 className="text-3xl font-bold mb-6 text-gray-800">Employee Termination & Resignation</h1>

            {/* Organization Filter */}
            <div className="mb-6 w-80">
                <label className="block text-sm font-semibold mb-2">Organization</label>
                <select
                    value={selectedOrg}
                    onChange={(e) => {
                        setSelectedOrg(e.target.value);
                        resetForm();
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

            <div className="mb-6 w-80">
                <label className="block text-sm font-semibold mb-2">
                    Status Change Type
                </label>
                <select
                    value={typeFilter}
                    onChange={(e) => {
                        setTypeFilter(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All</option>
                    <option value="TERMINATION">Termination</option>
                    <option value="RESIGNATION">Resignation</option>
                </select>
            </div>


            <>
                {/* Small Action Cards */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setShowForm("terminate")}
                        className="bg-white rounded-xl shadow-lg border-2 border-gray-200 hover:border-red-400 p-4 cursor-pointer transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                                <UserX className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Terminate Employee</h3>
                                <p className="text-xs text-gray-600">End employment involuntarily</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setShowForm("resign")}
                        className="bg-white rounded-xl shadow-lg border-2 border-gray-200 hover:border-blue-400 p-4 cursor-pointer transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                <UserMinus className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Resign Employee</h3>
                                <p className="text-xs text-gray-600">Process voluntary resignation</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Form Modal */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                            onClick={resetForm}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                            >
                                <div
                                    className={`sticky top-0 ${showForm === "terminate"
                                        ? "bg-gradient-to-r from-red-600 to-red-700"
                                        : "bg-gradient-to-r from-blue-600 to-blue-700"
                                        } text-white px-6 py-4 flex items-center justify-between rounded-t-2xl`}
                                >
                                    <div className="flex items-center gap-3">
                                        {showForm === "terminate" ? <UserX className="w-6 h-6" /> : <UserMinus className="w-6 h-6" />}
                                        <h3 className="text-xl font-bold">
                                            {showForm === "terminate" ? "Terminate Employee" : "Process Resignation"}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={resetForm}
                                        className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Select Employee <span className="text-red-500">*</span>
                                        </label>
                                        <Select
                                            value={selectedEmployeeOption}
                                            onChange={(option) => {
                                                setSelectedEmployeeOption(option);
                                                setEmployeeNo(option?.value || "");
                                            }}
                                            onInputChange={(inputValue) => setSearchQuery(inputValue)}
                                            options={employeeOptions}
                                            isLoading={employeeSearchLoading}
                                            isClearable
                                            placeholder="Type employee name or employee no..."
                                            className="text-sm"
                                            classNamePrefix="react-select"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            {showForm === "terminate" ? "Termination Date" : "Resignation Date"}{" "}
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={terminationDate}
                                            onChange={(e) => setTerminationDate(e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Notice Days
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="Enter notice period in days"
                                            value={noticeDays}
                                            onChange={(e) => setNoticeDays(e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Reason <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Enter reason"
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {showForm === "terminate" && (
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Source <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={source}
                                                onChange={(e) => setSource(e.target.value)}
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="OUTLOOK">OUTLOOK</option>
                                                <option value="GMAIL">GMAIL</option>
                                                <option value="LETTER">LETTER</option>

                                            </select>
                                        </div>
                                    )}


                                    {showForm === "terminate" && (
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Warning Level <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={warningLevel}
                                                onChange={(e) => setWarningLevel(e.target.value)}
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Select Warning Level</option>
                                                <option value="FIRST_WARNING">First Warning</option>
                                                <option value="SECOND_WARNING">Second Warning</option>
                                                <option value="THIRD_WARNING">Third Warning</option>
                                                <option value="TERMINATION">Termination</option>


                                            </select>
                                        </div>
                                    )}


                                    <div>
                                        <label className="block text-sm font-medium mb-2">Upload Document</label>
                                        <input
                                            type="file"
                                            onChange={(e) => setDocument(e.target.files[0])}
                                            className="w-full px-3 py-2 border rounded-lg"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium">Send Email Notification</label>
                                        <button
                                            type="button"
                                            onClick={() => setSendMail(!sendMail)}
                                            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${sendMail ? "bg-green-500" : "bg-gray-300"
                                                }`}
                                        >
                                            <div
                                                className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${sendMail ? "translate-x-6" : ""
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                </div>

                                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t rounded-b-2xl">
                                    <button
                                        onClick={resetForm}
                                        disabled={submitting}
                                        className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className={`px-6 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${showForm === "terminate" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                                            }`}
                                    >
                                        {submitting ? "Processing..." : showForm === "terminate" ? "Terminate Employee" : "Process Resignation"}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
                >
                    <div className="px-6 py-4 bg-gray-50 border-b">
                        <h2 className="text-xl font-bold text-gray-800">Terminated & Resigned Employees</h2>
                        <p className="text-sm text-gray-600 mt-1">{totalRecords} employee{totalRecords !== 1 ? "s" : ""}</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    {["Employee No", "Employee Name", "Type", "Effective Date", "Reason", "Notice Days", "Created At"].map((h) => (
                                        <th key={h} className="px-6 py-3 text-left text-xs font-bold">{h}</th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-10">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, duration: 1 }}
                                                className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"
                                            />
                                        </td>
                                    </tr>
                                ) : statusChangeData.length > 0 ? (
                                    statusChangeData.map((row) => (
                                        <motion.tr key={row.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="hover:bg-gray-50">
                                            <td className="px-6 py-3 text-blue-600 font-bold">{row.employee_no}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="relative">
                                                        <div className="absolute inset-0 rounded-full ring-2 ring-blue-500 ring-offset-2" />
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg bg-gradient-to-br ${avatarBgClass(row.employee_fullname || row.employee_no)}`}>
                                                            {getInitials(row.employee_fullname || row.employee_no)}
                                                        </div>
                                                    </motion.div>
                                                    <div>
                                                        <div className="font-semibold text-gray-800">{row.employee_fullname}</div>
                                                        <div className="text-xs text-gray-500">{row.employee_calling_name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${row.type === "TERMINATION" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                                                    {row.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                {new Date(row.effective_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                                            </td>
                                            <td className="px-6 py-3 max-w-xs truncate">{row.reason}</td>
                                            <td className="px-6 py-3">{row.notice_days || "—"}</td>
                                            <td className="px-6 py-3 text-gray-600">
                                                {new Date(row.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-10">
                                            <Users size={50} className="mx-auto text-gray-400" />
                                            <p className="text-gray-600 mt-3">No records found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!loading && statusChangeData.length > 0 && (
                        <div className="p-4 bg-gray-50 flex items-center justify-between">
                            <div>
                                Showing <strong>{(currentPage - 1) * rowsPerPage + 1} – {Math.min(currentPage * rowsPerPage, totalRecords)}</strong> of <strong>{totalRecords}</strong>
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
            </>

        </div>
    );
};

export default EmployeeTermination;
