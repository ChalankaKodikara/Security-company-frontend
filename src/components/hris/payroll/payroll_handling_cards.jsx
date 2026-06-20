import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    FaFileInvoiceDollar,
    FaPercent,
    
} from "react-icons/fa";
import { motion } from "framer-motion";
import usePermissions from "../../permissions/permission";

const PayrollHandlingCards = () => {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [searchParams] = useSearchParams();
    const org_id = searchParams.get("org_id");
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const [showIncentiveModal, setShowIncentiveModal] = useState(false);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const cards = [
        {
            title: "Month-End Payroll",
            label: "Payroll Processing",
            gradient: "from-blue-500 to-indigo-600",
            icon: <FaFileInvoiceDollar className="text-white text-3xl" />,
            onClick: () =>
                navigate(
                    `/payroll-handling-monthend?org_id=${org_id}${year ? `&year=${year}` : ""}${month ? `&month=${month}` : ""}`
                ), permissionId: 1004,
            description: "Process and manage monthly payroll",
        },
        {
            title: "Incentive",
            label: "Incentive Management",
            gradient: "from-green-500 to-emerald-600",
            icon: <FaPercent className="text-white text-3xl" />,
            onClick: () => setShowIncentiveModal(true),
            permissionId: 1005,
            description: "Manage incentive and allowance components",
        },

     
    ];

    const handleIncentiveApply = () => {
        if (!fromDate || !toDate) return;

        navigate(
            `/payroll-handling-incentive?org_id=${org_id}&from_date=${fromDate}&to_date=${toDate}`
        );

        setShowIncentiveModal(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
            className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8 font-montserrat"
        >
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-[25px] mb-2">Payroll Handling</h1>
                <p className="text-gray-600">
                    Comprehensive payroll and compensation management
                </p>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {cards
                    .filter((card) => hasPermission(card.permissionId))
                    .map((card, index) => (
                        <div
                            key={index}
                            onClick={card.onClick}
                            className="group relative overflow-hidden rounded-3xl bg-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-500 cursor-pointer"
                        >
                            {/* Gradient Hover */}
                            <div
                                className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                            />

                            {/* Decorative circles */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-200 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-700" />
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-200 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-700" />

                            {/* Content */}
                            <div className="relative p-6 z-10">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75" />
                                        <div
                                            className={`relative bg-gradient-to-br ${card.gradient} p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}
                                        >
                                            {card.icon}
                                        </div>
                                    </div>

                                    <svg
                                        className="w-6 h-6 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:text-white transition-all duration-300 transform group-hover:translate-x-2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                                        />
                                    </svg>
                                </div>

                                <h3 className="text-xl font-bold text-gray-800 group-hover:text-white mb-2 transition-colors">
                                    {card.title}
                                </h3>

                                <p className="text-sm text-gray-600 group-hover:text-white/90 mb-4 transition-colors">
                                    {card.description}
                                </p>

                                <div className="mb-4 p-3 bg-gray-50 group-hover:bg-white/20 rounded-xl transition-colors">
                                    <p className="text-xs text-gray-500 group-hover:text-white/80 font-medium">
                                        {card.label}
                                    </p>
                                </div>

                                <button className="w-full bg-blue-500 text-white rounded-xl px-6 py-3 shadow-lg flex items-center justify-center gap-2">
                                    View
                                </button>
                            </div>
                        </div>
                    ))}
            </div>

            {showIncentiveModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="bg-white rounded-3xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden"
                    >
                        {/* Header with gradient */}
                        <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 p-8 pb-12">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />

                            <div className="relative flex items-center gap-4">
                                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                                    <FaPercent className="text-white text-2xl" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-1">
                                        Incentive Period
                                    </h3>
                                    <p className="text-white/80 text-sm">
                                        Select the date range for incentive processing
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Form Content */}
                        <div className="p-8 -mt-6">
                            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
                                {/* From Date */}
                                <div className="group">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        From Date
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all duration-300 bg-gray-50 hover:bg-white"
                                        />
                                    </div>
                                </div>

                                {/* Arrow Indicator */}
                                <div className="flex justify-center">
                                    <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-2 rounded-full">
                                        <svg
                                            className="w-5 h-5 text-blue-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                            />
                                        </svg>
                                    </div>
                                </div>

                                {/* To Date */}
                                <div className="group">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        To Date
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all duration-300 bg-gray-50 hover:bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setShowIncentiveModal(false)}
                                    className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 font-semibold text-gray-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleIncentiveApply}
                                    disabled={!fromDate || !toDate}
                                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                                >
                                    <span>Apply Period</span>
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

        </motion.div>
    );
};

export default PayrollHandlingCards;
