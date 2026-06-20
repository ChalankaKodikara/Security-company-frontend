/** @format */
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DatePicker, Input, Select, message } from "antd";
import dayjs from "dayjs";
import { TbEditCircle } from "react-icons/tb";
import { MdSave, MdCancel } from "react-icons/md";
import { motion } from "framer-motion";
import { apiFetch } from "../../../utils/apiClient";
import Cookies from "js-cookie";
const { RangePicker } = DatePicker;
const { Option } = Select;

const STATUS_OPTIONS = [
    { value: "Normal day", label: "Normal day" },
    { value: "Late in / Normal day", label: "Late in/Normal day" },
    { value: "Short in / Normal day", label: "Short in/Normal day" },
    { value: "Half in / Normal day", label: "Half in/Normal day" },
    { value: "Half day", label: "Half day" },
    { value: "Short leave", label: "Short leave" },
    { value: "Leave", label: "Leave" },

];

const AttendanceAdjustmentEachEmployee = () => {
    const API_URL = process.env.REACT_APP_FRONTEND_URL;
    const { employee_no } = useParams();

    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [editingRow, setEditingRow] = useState(null);
    const [editValues, setEditValues] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const [dateRange, setDateRange] = useState([]);

    // 🔹 Utility styles
    const getStatusStyle = (status) => {
        if (!status) return "bg-gray-200 text-gray-800";
        const lower = status.toLowerCase();
        if (lower.includes("half day")) return "bg-yellow-100 text-yellow-800";
        if (lower.includes("leave")) return "bg-purple-100 text-purple-800";
        if (lower.includes("normal day")) return "bg-blue-100 text-blue-800";
        return "bg-gray-200 text-gray-800";
    };

    const getCheckinTypeStyle = (checkinType) => {
        if (!checkinType) return "bg-gray-200 text-gray-800";
        switch (checkinType.toLowerCase()) {
            case "normal check-in":
                return "bg-green-100 text-green-800";
            case "short-in":
                return "bg-red-100 text-red-800";
            case "late-in":
                return "bg-orange-100 text-orange-800";
            case "half-in":
                return "bg-indigo-100 text-indigo-800";
            default:
                return "bg-gray-200 text-gray-800";
        }
    };

    const getCheckoutTypeStyle = (checkoutType) => {
        if (!checkoutType) return "bg-gray-200 text-gray-800";
        switch (checkoutType.toLowerCase()) {
            case "normal check-out":
                return "bg-green-100 text-green-800";
            case "early-out":
                return "bg-orange-100 text-orange-800";
            case "short-out":
                return "bg-red-100 text-red-800";
            case "half-out":
                return "bg-indigo-100 text-indigo-800";
            default:
                return "bg-gray-200 text-gray-800";
        }
    };




    // 🔹 Fetch attendance
    const fetchAttendance = async (page = 1) => {
        if (!dateRange.length) return;
        setLoading(true);
        setError("");
        try {
            const from = dayjs(dateRange[0]).format("YYYY-MM-DD");
            const to = dayjs(dateRange[1]).format("YYYY-MM-DD");

            const res = await apiFetch(
                `${API_URL}/v1/hris/new-attendence/by-date-range?from=${from}&to=${to}&page=${page}&limit=${rowsPerPage}&employee_no=${employee_no}`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data?.message || "Failed to fetch attendance");
            }

            setAttendanceData(data.data || []);
            setTotalRecords(data.total || 0);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            setError(err.message);
            setAttendanceData([]);
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Save PUT
    const handleSave = async (row) => {
        try {
            // Get username from cookies (adjust key if your backend stores differently)
            const editedBy = Cookies.get("username") || "UnknownUser";

            const payload = {
                employee_id: row.employee_no,
                work_date_local: row.date,
                checkIN_time: editValues.check_in_time,
                checkIN_type: editValues.check_in_type,
                checkOUT_time: editValues.check_out_time,
                checkOUT_type: editValues.check_out_type,
                remark: editValues.remark || row.remark || "",
                grace_time: "",
                latitude: "",
                longitude: "",
                address: { city: "Colombo", place: "Head Office" },
                checkIN_address: editValues.check_in_address,
                checkOUT_address: editValues.check_out_address,
                edited_by: editedBy,
                status: editValues.status || row.status || "",

            };

            const res = await apiFetch(`${API_URL}/v1/hris/attendence/attendanceedit`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message);

            message.success("Attendance updated successfully!");
            setEditingRow(null);
            fetchAttendance(currentPage);
        } catch (err) {
            message.error("Failed to update attendance");
        }
    };

    const handleChange = (field, value) => {
        setEditValues({ ...editValues, [field]: value });
    };

    useEffect(() => {
        if (dateRange.length) fetchAttendance(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange, currentPage]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
        >
            <div className="font-montserrat">
                <p className="text-[25px] my-5">Adjustment For Employee {employee_no}</p>

                {/* Date Range Picker */}
                <div className="mb-4">
                    <RangePicker
                        value={dateRange}
                        onChange={(val) => {
                            setDateRange(val || []);
                            setCurrentPage(1);
                        }}
                        format="YYYY-MM-DD"
                    />

                    <p className="text-red-400 text-sm mt-2">*Pick date for get data</p>
                </div>

                <div className="overflow-x-auto bg-white shadow p-2 rounded-xl">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white text-gray-600 border-b border-t">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Check-in Time</th>
                                <th className="px-6 py-4">Check-in Type</th>
                                <th className="px-6 py-4">Check-out Time</th>
                                <th className="px-6 py-4">Check-out Type</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">OT</th>
                                <th className="px-6 py-4">Remark</th>

                                <th className="px-6 py-4">Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-200 border-t border-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="12" className="text-center py-4 text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="12" className="text-center py-4 text-red-500">
                                        Error: {error}
                                    </td>
                                </tr>
                            ) : attendanceData.length > 0 ? (
                                attendanceData.map((row, idx) => {
                                    const rowKey = `${row.employee_no}-${row.date}-${idx}`;
                                    const isEditing = editingRow === rowKey;

                                    return (
                                        <tr key={rowKey} className="hover:bg-gray-50">

                                            {/* Date */}
                                            <td className="p-3">{row.date}</td>

                                            {/* Check-in Time */}
                                            <td className="p-3">
                                                {isEditing ? (
                                                    <Input
                                                        value={editValues.check_in_time}
                                                        onChange={(e) =>
                                                            handleChange("check_in_time", e.target.value)
                                                        }
                                                    />
                                                ) : (
                                                    row.check_in_time || "N/A"
                                                )}
                                            </td>

                                            {/* Check-in Type */}
                                            <td className="p-3 text-center">
                                                {isEditing ? (
                                                    <Select
                                                        value={editValues.check_in_type}
                                                        onChange={(val) =>
                                                            handleChange("check_in_type", val)
                                                        }
                                                        style={{ width: "100%" }}
                                                    >
                                                        <Option value="Normal check-in">Normal check-in</Option>
                                                        <Option value="Late-in">Late-in</Option>
                                                        <Option value="Short-in">Short-in</Option>
                                                        <Option value="Half-in">Half-in</Option>
                                                    </Select>
                                                ) : (
                                                    <span
                                                        className={`p-1 rounded-md capitalize ${getCheckinTypeStyle(
                                                            row.check_in_type
                                                        )}`}
                                                    >
                                                        {row.check_in_type || "N/A"}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Check-out Time */}
                                            <td className="p-3">
                                                {isEditing ? (
                                                    <Input
                                                        value={editValues.check_out_time}
                                                        onChange={(e) =>
                                                            handleChange("check_out_time", e.target.value)
                                                        }
                                                    />
                                                ) : (
                                                    row.check_out_time || "N/A"
                                                )}
                                            </td>

                                            {/* Check-out Type */}
                                            <td className="p-3 text-center">
                                                {isEditing ? (
                                                    <Select
                                                        value={editValues.check_out_type}
                                                        onChange={(val) =>
                                                            handleChange("check_out_type", val)
                                                        }
                                                        style={{ width: "100%" }}
                                                    >
                                                        <Option value="Normal check-out">
                                                            Normal check-out
                                                        </Option>
                                                        <Option value="Early-out">Early-out</Option>
                                                        <Option value="Short-out">Short-out</Option>
                                                        <Option value="Half-out">Half-out</Option>
                                                    </Select>
                                                ) : (
                                                    <span
                                                        className={`p-1 rounded-md capitalize ${getCheckoutTypeStyle(
                                                            row.check_out_type
                                                        )}`}
                                                    >
                                                        {row.check_out_type || "N/A"}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Status */}
                                            {/* Status */}
                                            <td className="p-3 text-center">
                                                {isEditing ? (
                                                    <Select
                                                        value={editValues.status || row.status}
                                                        onChange={async (val) => {
                                                            handleChange("status", val);

                                                            // Immediately trigger PUT when status changes
                                                            try {
                                                                const editedBy = Cookies.get("username") || "AdminUser";
                                                                const payload = {
                                                                    employee_id: row.employee_no,
                                                                    work_date_local: row.date,
                                                                    checkIN_time: editValues.check_in_time || row.check_in_time || "",
                                                                    checkIN_type: editValues.check_in_type || row.check_in_type || "",
                                                                    checkOUT_time: editValues.check_out_time || row.check_out_time || "",
                                                                    checkOUT_type: editValues.check_out_type || row.check_out_type || "",
                                                                    remark: editValues.remark || row.remark || "",
                                                                    grace_time: "",
                                                                    latitude: "",
                                                                    longitude: "",
                                                                    address: { city: "Colombo", place: "Head Office" },
                                                                    checkIN_address:
                                                                        editValues.check_in_address || row.check_in_address || "",
                                                                    checkOUT_address:
                                                                        editValues.check_out_address || row.check_out_address || "",
                                                                    edited_by: editedBy,
                                                                    status: val,
                                                                };

                                                                const authToken = Cookies.get("accessToken");
                                                                const res = await fetch(`${API_URL}/v1/hris/attendence/attendanceedit`, {
                                                                    method: "PUT",
                                                                    headers: {
                                                                        "Content-Type": "application/json",
                                                                        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                                                                    },
                                                                    credentials: "include",
                                                                    body: JSON.stringify(payload),
                                                                });

                                                                const data = await res.json();
                                                                if (!res.ok || !data.success) throw new Error(data.message);

                                                                message.success(`Status updated to "${val}"`);
                                                                fetchAttendance(currentPage);
                                                            } catch (err) {
                                                                console.error(err);
                                                                message.error("Failed to update status");
                                                            }
                                                        }}
                                                        style={{ width: "100%" }}
                                                    >
                                                        {STATUS_OPTIONS.map((opt) => (
                                                            <Option key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </Option>
                                                        ))}
                                                    </Select>
                                                ) : (
                                                    <span
                                                        className={`p-1 rounded-md capitalize ${getStatusStyle(row.status)}`}
                                                    >
                                                        {row.status || "N/A"}
                                                    </span>
                                                )}
                                            </td>


                                            {/* OT */}
                                            <td className="p-3">{row.OT || "N/A"}</td>

                                            {/* Remark */}
                                            <td className="p-3">
                                                {isEditing ? (
                                                    <Input
                                                        value={editValues.remark}
                                                        onChange={(e) =>
                                                            handleChange("remark", e.target.value)
                                                        }
                                                    />
                                                ) : (
                                                    row.remark || "N/A"
                                                )}
                                            </td>

                                            {/* Check-in Address */}


                                            {/* Actions */}
                                            <td className="p-3 flex gap-2">
                                                {isEditing ? (
                                                    <>
                                                        <MdSave
                                                            className="w-5 h-5 text-green-600 cursor-pointer"
                                                            onClick={() => handleSave(row)}
                                                        />
                                                        <MdCancel
                                                            className="w-5 h-5 text-red-600 cursor-pointer"
                                                            onClick={() => setEditingRow(null)}
                                                        />
                                                    </>
                                                ) : (
                                                    <TbEditCircle
                                                        className="w-5 h-5 text-yellow-500 cursor-pointer"
                                                        onClick={() => {
                                                            setEditingRow(rowKey);
                                                            setEditValues({ ...row });
                                                        }}
                                                    />
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="12" className="text-center py-4 text-gray-500">
                                        No data found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {/* 🔹 Pagination Controls */}
                    {attendanceData.length > 0 && (
                        <div className="flex flex-col md:flex-row justify-between items-center mt-4 text-sm">
                            {/* Left side: info */}
                            <div className="text-gray-600 mb-2 md:mb-0">
                                Showing{" "}
                                {Math.min((currentPage - 1) * rowsPerPage + 1, totalRecords)}–{Math.min(
                                    currentPage * rowsPerPage,
                                    totalRecords
                                )}{" "}
                                of {totalRecords} records
                            </div>

                            {/* Right side: page controls */}
                            <div className="flex items-center space-x-2">
                                {/* Previous button */}
                                <button
                                    className="px-3 py-1 border rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    Prev
                                </button>

                                {/* Page numbers */}
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-3 py-1 border rounded-md ${currentPage === page
                                            ? "bg-blue-500 text-white border-blue-500"
                                            : "bg-white text-gray-700 hover:bg-gray-100"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                {/* Next button */}
                                <button
                                    className="px-3 py-1 border rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                    onClick={() =>
                                        setCurrentPage((p) => (p < totalPages ? p + 1 : totalPages))
                                    }
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>\
        </motion.div>
    );
};

export default AttendanceAdjustmentEachEmployee;
