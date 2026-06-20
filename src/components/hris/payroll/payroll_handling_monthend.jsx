import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../../utils/apiClient";
const PayrollHandlingMonthend = () => {
    const [searchParams] = useSearchParams();
    const API_URL = process.env.REACT_APP_FRONTEND_URL;
    const organization_id = searchParams.get("org_id");
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const handleView = (row) => {
        const orgId = organization_id || row.organization_id;

        console.log("Navigating with org_id:", orgId);
        console.log("Row data:", row);

        if (!orgId) {
            console.error("Organization ID missing");
            return;
        }

        navigate(
            `/view-payroll-handling-monthend?org_id=${orgId}&year=${row.year}&month=${row.month}`
        );
    };


    useEffect(() => {
        if (!organization_id) return;

        const fetchPayrollTotal = async () => {
            setLoading(true);
            setError("");

            try {
                const res = await apiFetch(
                    `${API_URL}/v1/hris/payroll/payroll-total?organization_id=${organization_id}`,
                    {
                       
                        credentials: "include",
                    }
                );

                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const json = await res.json();
                setRows(Array.isArray(json.data) ? json.data : []);
            } catch (err) {
                console.error(err);
                setError("Failed to load payroll data.");
                setRows([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPayrollTotal();
    }, [API_URL, organization_id]);


    return (
        <div className="p-6 font-montserrat">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-[22px] font-semibold">
                    Month-End Payroll Summary
                </h2>

            </div>

            {/* Table Card */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                {["Month", "Year", "Generated At", "Action"].map((h) => (
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
                                    <td colSpan="4" className="text-center py-10">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 1 }}
                                            className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"
                                        />
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-10 text-red-600">
                                        {error}
                                    </td>
                                </tr>
                            ) : rows.length > 0 ? (
                                rows.map((row, index) => (
                                    <motion.tr
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-3 font-medium">
                                            {row.month}
                                        </td>
                                        <td className="px-6 py-3">{row.year}</td>
                                        <td className="px-6 py-3 text-gray-600">
                                            {new Date(row.generated_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-3">
                                            <button
                                                onClick={() => handleView(row)}
                                                className="text-blue-500 hover:text-blue-700 transition-colors"
                                                title="View Payroll"
                                            >
                                                <FaArrowRight />
                                            </button>

                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="text-center py-10 text-gray-500">
                                        No payroll records found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
};

export default PayrollHandlingMonthend;
