/** @format */
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch } from "react-icons/fa";
import { MdKeyboardArrowDown } from "react-icons/md";
import { FaRegEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import { apiFetch } from "../../../../utils/apiClient";

const LeaveHistoryForEmployees = () => {
    const API_URL = process.env.REACT_APP_FRONTEND_URL;
    const token = Cookies.get("accessToken");
    const [employees, setEmployees] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [organizationId, setOrganizationId] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const rowsPerPage = 10;

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


    /* ---------------- FETCH ORGANIZATIONS ---------------- */
    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
                const res = await apiFetch(
                    `${API_URL}/v1/hris/organizations/organization`,
                    {
                        credentials: "include",
                    }
                );
                const json = await res.json();
                if (json.success) {
                    setOrganizations(json.data || []);
                }
            } catch (err) {
                console.error("Org fetch failed", err);
            }
        };
        fetchOrganizations();
    }, [API_URL, token]);

    /* ---------------- FETCH EMPLOYEES ---------------- */
    useEffect(() => {
        const fetchEmployees = async () => {
            setLoading(true);
            setError("");

            try {
                const params = new URLSearchParams({
                    page: currentPage,
                    limit: rowsPerPage,
                });

                if (search) params.append("search", search);
                if (organizationId) params.append("organization", organizationId);
                if (status) params.append("employee_active_status", status);

                const res = await apiFetch(
                    `${API_URL}/v1/hris/employees/employee/all-details?${params.toString()}`,
                    {
                        credentials: "include",
                    }
                );

                const json = await res.json();
                if (!res.ok) throw new Error(json.message || "Fetch failed");

                setEmployees(json.data || []);
                setTotalPages(json.totalPages || 1);
            } catch (err) {
                setError(err.message);
                setEmployees([]);
            } finally {
                setLoading(false);
            }
        };

        fetchEmployees();
    }, [API_URL, token, search, organizationId, status, currentPage]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6"
        >
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Employees
            </h2>

            {/* ================= FILTERS ================= */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border">
                <div className="relative mb-4">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or employee no"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full pl-12 pr-4 py-3 border-2 rounded-xl"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Organization */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Organization
                        </label>
                        <div className="relative">
                            <select
                                value={organizationId}
                                onChange={(e) => {
                                    setOrganizationId(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-4 py-3 border-2 rounded-xl bg-white"
                            >
                                <option value="">All Organizations</option>
                                {organizations.map((org) => (
                                    <option key={org.id} value={org.id}>
                                        {org.organization_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full px-4 py-3 border-2 rounded-xl bg-white"
                        >
                            <option value="">All</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ================= TABLE ================= */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="px-6 py-4 text-left">Employee</th>
                            <th className="px-6 py-4 text-left">EPF</th>
                            <th className="px-6 py-4 text-left">Designation</th>
                            <th className="px-6 py-4 text-left">Department</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-center">Action</th>

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
                        ) : employees.length > 0 ? (
                            employees.map((emp, index) => (
                                <motion.tr
                                    key={emp.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    {/* Employee */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <motion.div
                                                whileHover={{ scale: 1.1, rotate: 5 }}
                                                className="relative"
                                            >
                                                <div className="absolute inset-0 rounded-full ring-2 ring-blue-500 ring-offset-2" />
                                                <div
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg bg-gradient-to-br ${avatarBgClass(
                                                        emp.employee_fullname || emp.employee_no
                                                    )}`}
                                                >
                                                    {getInitials(emp.employee_fullname || emp.employee_no)}
                                                </div>
                                            </motion.div>

                                            <div>
                                                <div className="font-semibold text-gray-800">
                                                    {emp.employee_fullname}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    ID: {emp.employee_no}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* EPF */}
                                    <td className="px-6 py-3">{emp.epf_no || "—"}</td>

                                    {/* Designation */}
                                    <td className="px-6 py-3">{emp.designation_name || "—"}</td>

                                    {/* Department */}
                                    <td className="px-6 py-3">{emp.department_name || "—"}</td>

                                    {/* Status */}
                                    <td className="px-6 py-3">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${emp.employee_active_status === "Active"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                                }`}
                                        >
                                            {emp.employee_active_status}
                                        </span>
                                    </td>

                                    {/* Action */}
                                    <td className="px-6 py-3 text-center">
                                        <button
                                            onClick={() =>
                                                navigate(
                                                    `/leave-counts-each-employee?employee_no=${emp.employee_no}`
                                                )
                                            }
                                            className="text-blue-600 hover:text-blue-800 transition"
                                            title="View Leave Counts"
                                        >
                                            <FaRegEye size={18} />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="text-center py-10">
                                    <Users size={50} className="mx-auto text-gray-400" />
                                    <p className="text-gray-600 mt-3">No employees found</p>
                                </td>
                            </tr>
                        )}
                    </tbody>

                </table>
            </div>

            <div className="p-4 bg-gray-50 flex items-center justify-between">
                <div>
                    Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                </div>

                <div className="flex gap-3">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                        className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:border-blue-500 disabled:opacity-50"
                    >
                        Prev
                    </button>

                    <div className="px-4 py-2 rounded-xl bg-blue-600 text-white">
                        {currentPage}
                    </div>

                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:border-blue-500 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>

        </motion.div>
    );
};

export default LeaveHistoryForEmployees;
