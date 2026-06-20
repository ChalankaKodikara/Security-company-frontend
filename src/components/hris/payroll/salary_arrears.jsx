/** @format */
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import Cookies from "js-cookie";
import { apiFetch } from "../../../utils/apiClient";
const API_URL = process.env.REACT_APP_FRONTEND_URL;
const token = Cookies.get("accessToken");

const fmtDate = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "—";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
    ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
        d.getMinutes()
    ).padStart(2, "0")}`;
};

const statusColorMap = {
    paid: "text-green-600 font-semibold",
    not_paid: "text-rose-600 font-semibold",
    processing: "text-amber-600 font-semibold",
};

const getInitials = (fullName = "") => {
    const tokens = String(fullName)
        .replace(/[^\p{L}\p{N}\s'-]/gu, "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    if (tokens.length === 0) return "??";
    if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
    const first = tokens[0][0] || "";
    const last = tokens[tokens.length - 1][0] || "";
    return (first + last).toUpperCase();
};

const avatarBgClass = (seed = "") => {
    const palette = [
        "bg-sky-500",
        "bg-indigo-500",
        "bg-emerald-500",
        "bg-rose-500",
        "bg-amber-500",
        "bg-teal-500",
        "bg-fuchsia-500",
        "bg-cyan-500",
    ];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    return palette[hash % palette.length];
};

const SalaryArrears = () => {
    // table data
    const [rows, setRows] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState("");

    // filters (server-side)
    const [searchFilter, setSearchFilter] = useState(""); // Combined search for employee_no, name
    const [organizationOptions, setOrganizationOptions] = useState([]);
    const [selectedOrganizationFilter, setSelectedOrganizationFilter] = useState(null);
    const [statusFilter, setStatusFilter] = useState("All"); // status
    const [ym, setYm] = useState(() => {
        // default to current YYYY-MM
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    });

    // pagination (server-side)
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(Number(totalRecords || 0) / Number(limit || 10))),
        [totalRecords, limit]
    );

    // ---------- Modal state for "Apply Salary Arrears" ----------
    const [showPopup, setShowPopup] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        employee_no: "",
        month: "",
        year: "",
        amount: "",
        description: "",
    });
    // Delete confirmation popup
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // ---------- Fetch Organizations ----------
    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
                const res = await apiFetch(`${API_URL}/v1/hris/organizations/organization`, {
                   
                    credentials: "include",
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                if (json?.success && Array.isArray(json.data)) {
                    setOrganizationOptions(
                        json.data.map((org) => ({
                            value: org.id,
                            label: org.organization_name,
                        }))
                    );
                }
            } catch (e) {
                console.error("Failed to load organizations:", e);
                toast.error("Failed to load organizations. Please try again.");
            }
        };
        fetchOrganizations();
    }, []);

    // ---------- Fetch Salary Arrears (list) ----------
    const fetchSalaryArrears = useCallback(async () => {
        setIsLoading(true);
        setFetchError("");

        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(limit),
            });

            if (searchFilter.trim()) params.set("search", searchFilter.trim()); // Use searchFilter
            if (selectedOrganizationFilter)
                params.set("organization", selectedOrganizationFilter.value); // Use selectedOrganizationFilter

            if (ym) {
                const [y, m] = ym.split("-");
                if (y) params.set("year", y);
                if (m) params.set("month", m);
            }

            if (statusFilter !== "All") params.set("status", statusFilter);

            const res = await apiFetch(
                `${API_URL}/v1/hris/salary-arrears/get-salary-arrears?${params.toString()}`,
                {
                   
                    credentials: "include",
                }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const json = await res.json();
            const list = Array.isArray(json?.data) ? json.data : [];

            setRows(list);
            setTotalRecords(Number(json?.total || list.length || 0));
        } catch (err) {
            console.error(err);
            setFetchError("Failed to load salary arrears.");
            setRows([]);
            setTotalRecords(0);
            toast.error("Failed to load salary arrears. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [API_URL, searchFilter, selectedOrganizationFilter, ym, statusFilter, page, limit]);

    useEffect(() => {
        fetchSalaryArrears();
    }, [fetchSalaryArrears]);

    // ---------- Reset Filters ----------
    const handleReset = () => {
        const today = new Date();
        const defYm = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
        setSearchFilter("");
        setSelectedOrganizationFilter(null);
        setStatusFilter("All");
        setYm(defYm);
        setPage(1);
        setLimit(10);
    };

    // ---------- Validate Modal Form ----------
    const validateForm = () => {
        const errors = [];
        if (!formData.employee_no.trim()) errors.push("Employee No is required.");
        const monthNum = Number(formData.month);
        if (!monthNum || monthNum < 1 || monthNum > 12) errors.push("Month must be between 1 and 12.");
        const yearNum = Number(formData.year);
        if (!yearNum || yearNum < 1900) errors.push("Year is invalid.");
        const amountNum = Number(formData.amount);
        if (!amountNum || amountNum <= 0) errors.push("Amount must be greater than 0.");
        if (!formData.description.trim()) errors.push("Description is required.");
        return errors;
    };

    // ---------- Submit Modal Form (POST) ----------
    const handleAddSalaryArrears = async (e) => {
        e.preventDefault();
        const errors = validateForm();
        if (errors.length) {
            errors.forEach((msg) => toast.error(msg));
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                employee_no: formData.employee_no.trim(),
                month: Number(formData.month),
                year: Number(formData.year),
                amount: Number(formData.amount),
                description: formData.description.trim(),
            };

            const res = await apiFetch(`${API_URL}/v1/hris/salary-arrears/add-salary-arrears`, {
                method: "POST",
               
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(json?.message || json?.error || "Failed to add salary arrears");
            }

            toast.success("Salary arrears added successfully!");
            setShowPopup(false);
            setFormData({
                employee_no: "",
                month: "",
                year: "",
                amount: "",
                description: "",
            });
            // refresh the list
            fetchSalaryArrears();
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Failed to add salary arrears.");
        } finally {
            setSubmitting(false);
        }
    };
    // ---------- Open delete popup ----------
    const openDeletePopup = (id) => {
        setDeleteId(id);
        setShowDeletePopup(true);
    };

    // ---------- Delete Salary Arrears ----------
    // ---------- Confirm Delete ----------
    const handleDeleteSalaryArrears = async () => {
        if (!deleteId) return;
        try {
            setDeleting(true);
            const res = await apiFetch(`${API_URL}/v1/hris/salary-arrears/delete-salary-arrears/${deleteId}`, {
                method: "DELETE",
               
                credentials: "include",
            });
            if (!res.ok) throw new Error(`Failed to delete record (HTTP ${res.status})`);
            toast.success("Salary arrears record deleted successfully!");
            setShowDeletePopup(false);
            setDeleteId(null);
            fetchSalaryArrears();
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Failed to delete salary arrears.");
        } finally {
            setDeleting(false);
        }
    };


    return (
        <div className="mt-5 font-montserrat">
            <p className="text-[25px] mb-5">Payroll Navigation / Payroll Allowance / Salary Arrears</p>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Search & Filter</h2>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-4 items-end">
                    {/* Search Employee */}
                    <div className="flex flex-col w-60">
                        <label className="text-sm text-gray-600 mb-1">Search Employee</label>
                        <input
                            type="text"
                            value={searchFilter}
                            onChange={(e) => {
                                setSearchFilter(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Employee ID or Name"
                            className="border border-gray-300 p-2 rounded-md"
                        />
                    </div>

                    {/* Organization Filter */}
                    <div className="flex flex-col w-60">
                        <label className="text-sm text-gray-600 mb-1">Organization</label>
                        <Select
                            options={organizationOptions}
                            value={selectedOrganizationFilter}
                            onChange={(opt) => {
                                setSelectedOrganizationFilter(opt);
                                setPage(1);
                            }}
                            isClearable
                            placeholder="Select Organization"
                            className="text-sm"
                            styles={{ menu: (base) => ({ ...base, zIndex: 50 }) }}
                        />
                    </div>

                    {/* Month & Year (single picker) */}
                    <div className="flex flex-col w-60">
                        <label className="text-sm text-gray-600 mb-1">Month & Year</label>
                        <input
                            type="month"
                            value={ym}
                            onChange={(e) => {
                                setYm(e.target.value);
                                setPage(1);
                            }}
                            className="border border-gray-300 p-2 rounded-md"
                        />
                    </div>

                    {/* Status */}
                    <div className="flex flex-col w-60">
                        <label className="text-sm text-gray-600 mb-1">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                            className="border border-gray-300 p-2 rounded-md"
                        >
                            <option value="All">All Statuses</option>
                            <option value="not_paid">Not Paid</option>
                            <option value="processing">Processing</option>
                            <option value="paid">Paid</option>
                        </select>
                    </div>

                    {/* Page size */}
                    <div className="flex flex-col w-40">
                        <label className="text-sm text-gray-600 mb-1">Page size</label>
                        <select
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value) || 10);
                                setPage(1);
                            }}
                            className="border border-gray-300 p-2 rounded-md"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>

                    {/* Reset + Apply */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            className="px-4 py-2 bg-gray-100 border rounded hover:bg-gray-200"
                            onClick={handleReset}
                        >
                            Reset
                        </button>

                        <button
                            className="bg-blue-500 px-4 py-2 rounded-md text-white hover:bg-blue-600"
                            onClick={() => setShowPopup(true)}
                        >
                            Apply Salary Arrears
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto bg-white rounded-lg mt-4">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white text-gray-600 border-b border-t">
                            <tr>
                                <th className="p-3">Employee</th>
                                <th className="p-3">Requested Date</th>
                                <th className="p-3">Month</th>
                                <th className="p-3">Year</th>
                                <th className="p-3">Amount</th>
                                <th className="p-3">Basic Salary</th>
                                <th className="p-3">Description</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Action</th>

                            </tr>
                        </thead>

                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="9" className="text-center py-6">
                                        <div className="inline-block h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                                    </td>
                                </tr>
                            ) : fetchError ? (
                                <tr>
                                    <td colSpan="9" className="text-center py-6 text-red-600">{fetchError}</td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="text-center py-6">No data found.</td>
                                </tr>
                            ) : (
                                rows.map((r) => {
                                    const emp = r.employee || {};
                                    return (
                                        <tr key={r.id} className="border-b hover:bg-gray-50">
                                            <td className="p-3">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0 ${avatarBgClass(
                                                            r.employee?.name || r.employee?.no || ""
                                                        )}`}
                                                        title={r.employee?.name}
                                                    >
                                                        {getInitials(r.employee?.name || r.employee?.no || "")}
                                                    </div>
                                                    <div className="leading-5">
                                                        <div className="font-semibold">
                                                            {r.employee?.name || "—"}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {r.employee?.no ? `(${r.employee.no})` : "—"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="p-3">{fmtDate(r.created_at)}</td>
                                            <td className="p-3">{r.month ?? "—"}</td>
                                            <td className="p-3">{r.year ?? "—"}</td>
                                            <td className="p-3">
                                                {r.amount
                                                    ? `Rs. ${Number(r.amount).toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}`
                                                    : "—"}
                                            </td>
                                            <td className="p-3">
                                                {emp.employee_basic_salary
                                                    ? `Rs. ${Number(emp.employee_basic_salary).toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}`
                                                    : "—"}
                                            </td>
                                            <td className="p-3">{r.description || "—"}</td>
                                            <td className={`p-3 capitalize ${statusColorMap[r.status] || ""}`}>
                                                {r.status?.replace(/_/g, " ") || "—"}
                                            </td>
                                            <td
                                                className="text-red-500 p-3 font-bold cursor-pointer hover:underline"
                                                onClick={() => openDeletePopup(r.id)}
                                            >
                                                Delete
                                            </td>


                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pager */}
                <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                    <div>
                        Showing page {page} of {totalPages} ({totalRecords} records)
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="px-3 py-1 border rounded disabled:opacity-50"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1 || isLoading}
                        >
                            Prev
                        </button>
                        <button
                            className="px-3 py-1 border rounded disabled:opacity-50"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages || isLoading}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* ----------- Apply Salary Arrears Popup ----------- */}
            {showPopup && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold">Apply Salary Arrears</h3>
                            <button
                                type="button"
                                className="text-gray-500 hover:text-gray-800"
                                onClick={() => setShowPopup(false)}
                                disabled={submitting}
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleAddSalaryArrears} className="space-y-4">
                            <div>
                                <label className="block text-sm mb-1">Employee No</label>
                                <input
                                    type="text"
                                    value={formData.employee_no}
                                    onChange={(e) =>
                                        setFormData((s) => ({ ...s, employee_no: e.target.value }))
                                    }
                                    placeholder="EMP02490"
                                    className="border p-2 rounded w-full"
                                    required
                                />
                            </div>

                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="block text-sm mb-1">Month</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="12"
                                        value={formData.month}
                                        onChange={(e) =>
                                            setFormData((s) => ({ ...s, month: e.target.value }))
                                        }
                                        placeholder="8"
                                        className="border p-2 rounded w-full"
                                        required
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm mb-1">Year</label>
                                    <input
                                        type="number"
                                        min="2000"
                                        value={formData.year}
                                        onChange={(e) =>
                                            setFormData((s) => ({ ...s, year: e.target.value }))
                                        }
                                        placeholder="2025"
                                        className="border p-2 rounded w-full"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Amount</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) =>
                                        setFormData((s) => ({ ...s, amount: e.target.value }))
                                    }
                                    placeholder="12500.00"
                                    className="border p-2 rounded w-full"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1">Description</label>
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData((s) => ({ ...s, description: e.target.value }))
                                    }
                                    placeholder='Backdated increment (Jul-&gt;Aug)'
                                    className="border p-2 rounded w-full"
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                                    onClick={() => setShowPopup(false)}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                    disabled={submitting}
                                >
                                    {submitting ? "Submitting..." : "Submit"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* -------- Delete Confirmation Popup -------- */}
            {showDeletePopup && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                        <h3 className="text-lg font-semibold mb-3 text-red-600">Confirm Deletion</h3>
                        <p className="text-gray-700 mb-6">
                            Are you sure you want to delete this salary arrears record? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
                                onClick={() => {
                                    setShowDeletePopup(false);
                                    setDeleteId(null);
                                }}
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                                onClick={handleDeleteSalaryArrears}
                                disabled={deleting}
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer position="top-right" autoClose={1800} />
        </div>
    );
};

export default SalaryArrears;
