import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { apiFetch } from "../../../utils/apiClient";
import { Plus, X, Save } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
const ShiftEmployeeSummary = () => {
    const location = useLocation();
    const API_URL = process.env.REACT_APP_FRONTEND_URL;
    const params = new URLSearchParams(location.search);
    const orgId = params.get("organization_id");
    const employeeNo = params.get("employee_no");
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);

    const [showAddForm, setShowAddForm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [formData, setFormData] = useState({
        month: "",
        year: "",
        completed_shifts: "",
        location_type: "COLOMBO",
    });

    const fetchData = async () => {
        if (!orgId || !employeeNo) return;
        setLoading(true);

        try {
            const query = new URLSearchParams({
                organization_id: orgId,
                employee_no: employeeNo,
            });

            const res = await apiFetch(
                `${API_URL}/v1/hris/payroll/shift-summary/status-2?${query.toString()}`,
                {
                    credentials: "include",
                }
            );

            const json = await res.json();
            setRows(Array.isArray(json?.data) ? json.data : []);
        } catch (err) {
            console.error("Employee summary fetch error:", err);
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteShift = async () => {
        if (!deleteTarget?.id) return;

        try {
            const res = await apiFetch(
                `${API_URL}/v1/hris/payroll/shift-summary/${deleteTarget.id}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json?.message || "Delete failed");
            }

            setDeleteTarget(null);
            toast.success("Shift record deleted successfully.");
            await fetchData();
        } catch (err) {
            console.error("Delete error:", err);
            toast.error(err.message || "Failed to delete shift record.");
        }
    };

    const handleAddShiftRecord = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                organization_id: Number(orgId),
                employee_no: employeeNo,
                month: Number(formData.month),
                year: Number(formData.year),
                completed_shifts: Number(formData.completed_shifts),
                location_type: formData.location_type,
            };

            const res = await apiFetch(
                `${API_URL}/v1/hris/payroll/shift-summary`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );

            if (!res.ok) {
                throw new Error("Failed to add shift record");
            }

            setShowAddForm(false);
            setFormData({
                month: "",
                year: "",
                completed_shifts: "",
                location_type: "COLOMBO",
            });

            await fetchData();
        } catch (err) {
            console.error("Add shift record error:", err);
        }
    };
    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orgId, employeeNo, API_URL]);

    const getInitials = (fullName = "") => {
        const tokens = String(fullName).trim().split(/\s+/);

        if (!tokens[0]) return "NA";
        if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();

        return (tokens[0][0] + tokens[tokens.length - 1][0]).toUpperCase();
    };

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

        const index =
            String(seed)
                .split("")
                .reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length;

        return palette[index];
    };
    return (
        <div className="mx-5 mt-5 font-montserrat">


            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-[24px] mb-5">Shift Employee Summary</h1>

                </div>
                <div>
                    <button
                        type="button"
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        <Plus size={16} />
                        Add Shift Record
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">



                <div className="flex items-center justify-between mb-5">
                    <p className="text-[20px] font-medium">Employee Shift Summary</p>


                </div>
                {showAddForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                        <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
                            <div className="flex items-center justify-between border-b px-6 py-4">
                                <div>
                                    <p className="text-lg font-semibold text-gray-900">
                                        Add Shift Record
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Employee No: {employeeNo} | Organization ID: {orgId}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleAddShiftRecord} className="px-6 py-5">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Month
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="12"
                                            value={formData.month}
                                            onChange={(e) =>
                                                setFormData({ ...formData, month: e.target.value })
                                            }
                                            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                                            placeholder="Example: 5"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Year
                                        </label>
                                        <input
                                            type="number"
                                            min="2020"
                                            value={formData.year}
                                            onChange={(e) =>
                                                setFormData({ ...formData, year: e.target.value })
                                            }
                                            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                                            placeholder="Example: 2026"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Completed Shifts
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.completed_shifts}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    completed_shifts: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                                            placeholder="Example: 26"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Location Type
                                        </label>
                                        <select
                                            value={formData.location_type}
                                            onChange={(e) =>
                                                setFormData({ ...formData, location_type: e.target.value })
                                            }
                                            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                                            required
                                        >
                                            <option value="COLOMBO">Colombo</option>
                                            <option value="OUTSTATION">Outstation</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddForm(false)}
                                        className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
                                    >
                                        <Save size={16} />
                                        Save Record
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Employee Details</th>
                    <th className="px-6 py-3">Completed Shifts</th>
                    <th className="px-6 py-3">Payroll Location</th>
                    <th className="px-6 py-3">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-6 text-center">
                                    Loading...
                                </td>
                            </tr>
                        ) : rows.length > 0 ? (
                            rows.map((row) => (
                                <tr key={row.employee_no} className="border-t">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarBgClass(
                                                    row.employee_no
                                                )} text-sm font-semibold text-white shadow-sm`}
                                            >
                                                <div className="absolute inset-0 rounded-full ring-2 ring-blue-500 ring-offset-2" />
                                                {getInitials(row.employee_fullname)}
                                            </div>

                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {row.employee_fullname || "N/A"}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {row.employee_email || "No email"}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{row.completed_shifts}</td>
                                    <td className="px-6 py-4">{row.payroll_location_type}</td>
                                    <td className="px-6 py-4">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setDeleteTarget({
                                                    id: row.shift_summary_id || row.id,
                                                    name: row.employee_fullname || row.employee_no,
                                                })
                                            }
                                            className="rounded-xl border border-red-300 bg-red-50 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-100"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="px-6 py-6 text-center">
                                    No records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Confirm Delete</h3>
                        <p className="text-sm text-gray-600">
                            Are you sure you want to delete the shift record for <strong>{deleteTarget.name}</strong>?
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteShift}
                                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShiftEmployeeSummary;