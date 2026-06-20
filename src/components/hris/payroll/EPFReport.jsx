// EPFReport.jsx
import React, { useEffect, useMemo, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiFetch } from "../../../utils/apiClient";
const API_URL = process.env.REACT_APP_FRONTEND_URL;

// (same helpers you shared)
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

const currency = (n) =>
    typeof n === "number"
        ? `Rs. ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : "—";

const EPFReport = () => {
    // table data
    const [rows, setRows] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState("");

    // filters
    const [fullName, setFullName] = useState("");
    const [ym, setYm] = useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    });

    // pagination
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(Number(totalRecords || 0) / Number(limit || 10))),
        [totalRecords, limit]
    );

    // fetch
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setIsLoading(true);
            setFetchError("");

            try {
                const params = new URLSearchParams({
                    page: String(page),
                    limit: String(limit),
                });

                if (fullName.trim()) params.set("full_name", fullName.trim());

                if (ym) {
                    const [y, m] = ym.split("-");
                    if (y) params.set("year", y);
                    if (m) params.set("month", m);
                }

                const res = await apiFetch(
                    `${API_URL}/v1/hris/payroll/epf-etf-slip?${params.toString()}`,
                    { credentials: "include" }
                );
                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const json = await res.json();
                const list = Array.isArray(json?.data) ? json.data : [];

                if (!cancelled) {
                    setRows(list);
                    setTotalRecords(Number(json?.total || list.length || 0));
                    toast.success(`Loaded ${list.length} record(s).`, { autoClose: 1200 });
                }
            } catch (err) {
                console.error(err);
                if (!cancelled) {
                    setFetchError("Failed to load EPF/ETF slip data.");
                    setRows([]);
                    setTotalRecords(0);
                    toast.error("Failed to load EPF/ETF slip data. Please try again.");
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [API_URL, fullName, ym, page, limit]);

    const handleReset = () => {
        const today = new Date();
        const defYm = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
        setFullName("");
        setYm(defYm);
        setPage(1);
        setLimit(10);
    };

    return (
        <div className="mt-5 font-montserrat">
            <p className="text-[25px] mb-5">Payroll Navigation / EPF Report</p>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Search & Filter</h2>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-4 items-end">
                    {/* Month & Year (single picker) */}
                    <div className="flex flex-col w-60">
                        <label className="text-sm text-gray-600 mb-1">Contribution Month</label>
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

                    {/* Full Name */}
                    <div className="flex flex-col min-w-[260px]">
                        <label className="text-sm text-gray-600 mb-1">Full Name</label>
                        <input
                            type="text"
                            value={fullName}
                            placeholder="e.g., Jane Doe"
                            onChange={(e) => {
                                setFullName(e.target.value);
                                setPage(1);
                            }}
                            className="border border-gray-300 p-2 rounded-md"
                        />
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

                    {/* Reset */}
                    <div className="flex">
                        <button
                            type="button"
                            className="px-4 py-2 bg-gray-100 border rounded hover:bg-gray-200"
                            onClick={handleReset}
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto bg-white rounded-lg">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white text-gray-600 border-b border-t">
                            <tr>
                                <th className="p-3">NIC</th>
                                <th className="p-3">Surname</th>
                                <th className="p-3">Initials</th>
                                <th className="p-3">Member Number</th>
                                <th className="p-3">Total Contribution</th>
                                <th className="p-3">Employer's Contribution</th>
                                <th className="p-3">Members Contribution</th>
                                <th className="p-3">Total Earnings</th>
                                <th className="p-3">Member Status (E/N/V)</th>
                                <th className="p-3">Zone</th>
                                <th className="p-3">Employer Number</th>
                                <th className="p-3">Contribution Period (YYYYMM)</th>
                                <th className="p-3">Data Submission Numbers</th>
                                <th className="p-3">No. of Days Worked</th>
                                <th className="p-3">Occupation Classification Grade</th>
                            </tr>
                        </thead>

                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="15" className="text-center py-6">
                                        <div className="inline-block h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                                    </td>
                                </tr>
                            ) : fetchError ? (
                                <tr>
                                    <td colSpan="15" className="text-center py-6 text-red-600">{fetchError}</td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan="15" className="text-center py-6">No data found.</td>
                                </tr>
                            ) : (
                                rows.map((r, idx) => (
                                    <tr key={r.member_number ?? r.nic_number ?? idx} className="border-b hover:bg-gray-50">
                                        <td className="p-3">{r.nic_number || "—"}</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0 ${avatarBgClass(
                                                        r.full_name || ""
                                                    )}`}
                                                    title={r.full_name}
                                                >
                                                    {getInitials(r.full_name || "")}
                                                </div>
                                                <div className="leading-5">
                                                    <div className="font-semibold">{r.surname || "—"}</div>
                                                    <div className="text-xs text-gray-500">{r.full_name || "—"}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3">{r.initials || "—"}</td>
                                        <td className="p-3">{r.member_number || "—"}</td>
                                        <td className="p-3">{currency(r.total_contribution)}</td>
                                        <td className="p-3">{currency(r.employers_contribution)}</td>
                                        <td className="p-3">{currency(r.members_contribution)}</td>
                                        <td className="p-3">{currency(r.total_earnings)}</td>
                                        <td className="p-3">{r.member_status || "—"}</td>
                                        <td className="p-3">{r.zone || "—"}</td>
                                        <td className="p-3">{r.employee_number || "—"}</td>
                                        <td className="p-3">{r.contribution_period || "—"}</td>
                                        <td className="p-3">{r.data_submission_number ?? "—"}</td>
                                        <td className="p-3">{r.no_of_days_worked ?? "—"}</td>
                                        <td className="p-3">{r.occupation_classification_grade ?? "—"}</td>
                                    </tr>
                                ))
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

            <ToastContainer />
        </div>
    );
};

export default EPFReport;
