/** @format */

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { IoEyeOutline } from "react-icons/io5";
import { FaCheck } from "react-icons/fa";
import { BsDownload } from "react-icons/bs";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import { apiFetch } from "../../../utils/apiClient";

/** Small date util */
const fmtDate = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    // yyyy/MM/dd
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}/${m}/${day}`;
};

function BillReimbursement() {
    /** Filters */
    const [searchFilter, setSearchFilter] = useState(""); // Combined search for employee ID/Name
    const [organizationOptions, setOrganizationOptions] = useState([]);
    const [selectedOrganizationFilter, setSelectedOrganizationFilter] = useState(null);
    const [statusFilter, setStatusFilter] = useState("All");
    const [billTypeFilter, setBillTypeFilter] = useState("All");

    /** Table data & paging */
    const [rows, setRows] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    /** Other UI state (kept from your original component) */
    const [showModal, setShowModal] = useState(false);
    const [selectedReimbursement, setSelectedReimbursement] = useState(null);
    const [actionType, setActionType] = useState(null);
    const [showApprove, setShowApprove] = useState(false);
    const [approveTarget, setApproveTarget] = useState(null);
    const [claimDate, setClaimDate] = useState("");
    const [showReject, setShowReject] = useState(false);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [maxClaimAmount, setMaxClaimAmount] = useState(20000);
    const [showUpdate, setShowUpdate] = useState(false);
    const [updateValue, setUpdateValue] = useState("20,000");

    const API_URL = process.env.REACT_APP_FRONTEND_URL;
    const [billTypes, setBillTypes] = useState([]);
    const token = Cookies.get("accessToken");

    const navigate = useNavigate();

    /* -------------------- Organizations for Select -------------------- */
    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
                const url = `${API_URL}/v1/hris/organizations/organization`;
                const res = await apiFetch(url, {
                    credentials: "include",
                  
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                if (json?.success && Array.isArray(json.data)) {
                    setOrganizationOptions(json.data.map(org => ({
                        value: org.id,
                        label: org.organization_name
                    })));
                }
            } catch (e) {
                console.error("Failed to load organizations:", e);
            }
        };
        fetchOrganizations();
    }, [API_URL, token]);


    // Fetch bill types for the filter dropdown
    useEffect(() => {
        (async () => {
            try {
                const res = await apiFetch(
                    `${API_URL}/v1/hris/bill-type/get-all-bill-types`,
                    {
                        credentials: "include",
                        
                    }
                );
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                setBillTypes(Array.isArray(json?.data) ? json.data : []);
            } catch (e) {
                console.error("Failed to load bill types:", e);
                setBillTypes([]);
            }
        })();
    }, [API_URL, token]);


    /* -------------------- Fetch table rows from API -------------------- */
    const debounceRef = useRef(null);

    const fetchRows = async (signal) => {
        setIsLoading(true);
        setFetchError("");

        const params = new URLSearchParams();

        // Add filters
        if (searchFilter?.trim()) params.set("search", searchFilter.trim()); // Combined search
        if (selectedOrganizationFilter?.value) params.set("organization", selectedOrganizationFilter.value); // Organization filter
        if (statusFilter && statusFilter !== "All") params.set("status", statusFilter.toLowerCase());
        if (billTypeFilter && billTypeFilter !== "All") params.set("bill_type", billTypeFilter);

        params.set("page", String(page));
        params.set("limit", String(pageSize));

        const url = `${API_URL}/v1/hris/bill-reimbursement-allowance/?${params.toString()}`;

        try {
            const res = await apiFetch(url, {
                credentials: "include",
                
                signal,
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();

            const data = Array.isArray(json?.data) ? json.data : [];

            // 👇 map API -> table shape (updated to match new response structure)
            setRows(
                data.map((r) => ({
                    id: r.id,
                    employee_no: r.employee_no ?? "", // Direct access
                    employee_name: r.employee_fullname ?? "-", // Direct access
                    requestedAt: r.billDate ?? r.createdAt ?? null,
                    bill_type: r.bill_type ?? "", // Direct access
                    bill_date: r.billDate ?? null,
                    bill_amount: r.amount ?? null,
                    status: r.status ?? "-",
                    raw: r,
                }))
            );


            // pagination block in this API is under `pagination`
            setTotalPages(Number(json?.pagination?.totalPages ?? 1));
            setTotalRecords(Number(json?.pagination?.totalRecords ?? data.length ?? 0));
            if (Number.isFinite(Number(json?.pagination?.currentPage))) {
                setPage(Number(json.pagination.currentPage));
            }
        } catch (e) {
            if (e.name !== "AbortError") setFetchError("Failed to load data.");
            setRows([]);
            setTotalPages(1);
            setTotalRecords(0);
        } finally {
            setIsLoading(false);
        }
    };

    // Debounce whenever filters/page change
    useEffect(() => {
        const controller = new AbortController();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchRows(controller.signal);
        }, 250);
        return () => {
            controller.abort();
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchFilter, selectedOrganizationFilter, statusFilter, billTypeFilter, page, pageSize, API_URL, token]);


    const openReject = (row) => {
        setRejectTarget(row);
        setRejectReason("");
        setShowReject(true);
    };

    const openApprove = (row) => {
        setApproveTarget(row);
        setClaimDate("");
        setShowApprove(true);
    };


    const statusColorMap = {
        approved: "text-green-600 font-semibold",
        pending: "text-yellow-500 font-semibold",
        rejected: "text-red-600 font-semibold",
    };
    // eligibilityClass is not directly used in this component's table, but kept for context.
    const eligibilityClass = {
        Valid: "text-green-700 ",
        "Not Valid": "text-red-700 ",
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
        for (let i = 0; i < seed.length; i++)
            hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
        return palette[hash % palette.length];
    };


    const handleExport = async () => {
        try {
            const params = new URLSearchParams();
            if (searchFilter?.trim()) params.set("search", searchFilter.trim());
            if (selectedOrganizationFilter?.value) params.set("organization", selectedOrganizationFilter.value);
            if (statusFilter && statusFilter !== "All") params.set("status", statusFilter.toLowerCase());
            if (billTypeFilter && billTypeFilter !== "All") params.set("bill_type", billTypeFilter);

            params.set("page", "1");
            params.set("limit", "10000000000000"); // A very large limit to get all data

            const url = `${API_URL}/v1/hris/bill-reimbursement-allowance/?${params.toString()}`;
            const res = await apiFetch(url, {
                credentials: "include",
              
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const json = await res.json();
            const data = Array.isArray(json?.data) ? json.data : [];
            if (!data.length) {
                toast.info("No data to export.");
                return;
            }

            // flatten rows for CSV (updated to match new response structure)
            const flat = data.map((r) => ({
                ID: r.id ?? "",
                Employee_No: r.employee_no ?? "",
                Employee_Name: r.employee_fullname ?? "-",
                Employee_Email: r.employee_email ?? "",
                Bill_Type: r.bill_type ?? "",
                Bill_Date: fmtDate(r.billDate) ?? "",
                Bill_Amount: r.amount ?? "",
                Status: r.status ?? "",
                Reject_Reason: r.rejectReason ?? "",
                Invoice_No: r.invoiceNo ?? "",
                Note: r.AdditionalComments ?? "", // Assuming AdditionalComments is the note field
                Approved_Rejected_By: r.approvenRejectedBy ?? "",
                Created_At: fmtDate(r.createdAt) ?? "",
                Updated_At: fmtDate(r.updatedAt) ?? "",
            }));


            // CSV (BOM + CRLF for Excel)
            const headers = Object.keys(flat[0]);
            const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
            const lines = flat.map((row) => headers.map((h) => esc(row[h])).join(","));
            const csv = [headers.join(","), ...lines].join("\r\n");

            const filename = `bill_reimbursements_${new Date().toISOString().slice(0, 10)}.csv`;
            const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });

            // IE/Edge legacy
            if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                window.navigator.msSaveOrOpenBlob(blob, filename);
                toast.success("CSV downloaded.");
                return;
            }

            // Safari / iOS fallback: use FileReader + data URL
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            if (isSafari) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const a = document.createElement("a");
                    a.href = reader.result;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    toast.success("CSV downloaded.");
                };
                reader.readAsDataURL(blob);
                return;
            }

            // Standard download via blob URL
            const blobUrl = (window.URL || window.webkitURL).createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename;
            a.style.display = "none";
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                (window.URL || window.webkitURL).revokeObjectURL(blobUrl);
            }, 100);

            toast.success("CSV downloaded.");
        } catch (err) {
            console.error("Export failed:", err);
            toast.error("Export failed. Please try again.");
        }
    };


    const getApproverFromCookies = () => {
        const keys = ["role", "userRole", "USER_ROLE", "Role", "user_role"];
        for (const k of keys) {
            const v = decodeURIComponent(Cookies.get(k) || "").trim();
            if (v) return v;
        }
        return "superadmin"; // fallback if no cookie is set
    };


    const handleRejectYes = async () => {
        if (!rejectTarget) return;

        const approver = getApproverFromCookies();

        try {
            const res = await apiFetch(
                `${API_URL}/v1/hris/bill-reimbursement-allowance/status/${rejectTarget.id}`,
                {
                    method: "PUT",
                    credentials: "include",
                   
                    body: JSON.stringify({
                        status: "rejected",
                        approvenRejectedBy: approver,
                        rejectReason: (rejectReason || "").trim(), // send the reason (can be empty if you keep it optional)
                    }),
                }
            );

            let json = {};
            try { json = await res.json(); } catch { }

            const ok = res.ok && (json?.success ?? true);
            const msg = json?.message || (ok ? "Rejected successfully" : "Reject failed");

            if (ok) {
                toast.success(msg);
                setShowReject(false);
                setRejectTarget(null);
                setRejectReason("");
                fetchRows(new AbortController().signal); // refresh table
            } else {
                toast.error(msg);
            }
        } catch (err) {
            console.error("Reject error:", err);
            toast.error("Reject failed. Please try again.");
        }
    };


    const handleApproveYes = async () => {
        if (!approveTarget) return;

        const approver = getApproverFromCookies();

        try {
            const res = await apiFetch(
                `${API_URL}/v1/hris/bill-reimbursement-allowance/status/${approveTarget.id}`,
                {
                    method: "PUT",
                    credentials: "include",
                  
                    body: JSON.stringify({
                        status: "approved",
                        approvenRejectedBy: approver,
                    }),
                }
            );

            let json = {};
            try { json = await res.json(); } catch { }

            const ok = res.ok && (json?.success ?? true);
            const msg = json?.message || (ok ? "Approved successfully" : "Approve failed");

            if (ok) {
                toast.success(msg);
                setShowApprove(false);
                setApproveTarget(null);
                fetchRows(new AbortController().signal);
            } else {
                toast.error(msg);
            }
        } catch (err) {
            console.error("Approve error:", err);
            toast.error("Approve failed. Please try again.");
        }
    };


    // These functions and states are likely for spectacle/medical allowance and not directly related to bill reimbursement.
    // Keeping them as-is, assuming they might be used elsewhere or should be removed if truly not needed here.
    const handleUpdateConfirm = async () => {
        const cleaned = String(updateValue).replace(/[^\d.]/g, ""); // keep digits & dot
        const amount = Number(cleaned);

        if (!Number.isFinite(amount) || amount <= 0) {
            toast.error("Enter a valid maximum amount.");
            return;
        }

        try {
            const res = await apiFetch(
                `${API_URL}/v1/hris/spectacal-medical-master`,
                {
                    method: "PUT",
                    credentials: "include",
                   
                    body: JSON.stringify({ max_amount: amount }),
                }
            );

            let json = {};
            try { json = await res.json(); } catch { }

            const ok = res.ok && (json?.success ?? true);
            const msg = json?.message || (ok ? "Updated successfully" : "Update failed");

            if (!ok) {
                toast.error(msg);
                return;
            }

            toast.success(msg);

            // Fetch max count (assuming a relevant endpoint exists for Bill Reimbursement or this is a generic master config)
            try {
                const res2 = await apiFetch(
                    `${API_URL}/v1/hris/spectacal-medical-master/spectacle-max-count`,
                    {
                        method: "GET",
                        credentials: "include",
                       
                    }
                );
                const j2 = await res2.json();
                const n = Number(j2?.max_count);
                setMaxClaimAmount(Number.isFinite(n) ? n : amount);
            } catch {
                setMaxClaimAmount(amount);
            }

            setShowUpdate(false);
        } catch (err) {
            console.error("Max amount update error:", err);
            toast.error("Update failed. Please try again.");
        }
    };

    // Assuming this also relates to a generic max claim amount, not specific to bills
    const fetchSpectacleMaxCount = async () => {
        try {
            const res = await apiFetch(
                `${API_URL}/v1/hris/spectacal-medical-master/spectacle-max-count`,
                {
                    method: "GET",
                    credentials: "include",
                    
                }
            );
            const json = await res.json();
            const n = Number(json?.max_count);
            if (!Number.isFinite(n)) throw new Error("Invalid max_count");
            setMaxClaimAmount(n);
        } catch (err) {
            console.error("Failed to fetch spectacle max count:", err);
        }
    };

    useEffect(() => {
        // Only call if maxClaimAmount is relevant to BillReimbursement
        // Removed original openUpdate call from here as it's not defined
        fetchSpectacleMaxCount();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [API_URL, token]);


    return (
        <div className="mx-5 mt-5 font-montserrat">
            <p className="text-[24px] mb-8">
                <span className="text-gray-500">Payroll Navigation </span> / Bill
                Reimbursement
            </p>


            {/* Max claim amount section (might be specific to Spectacle/Medical) */}
            {/* Keeping it as is, but consider if this UI is needed for Bill Reimbursement */}
            <div className="bg-[#2495FE] p-4 rounded-md mb-4 ">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-white text-[16px]">
                            Maximum claimable amount (Rs) :{" "}
                            {maxClaimAmount.toLocaleString("en-US")}
                        </p>
                    </div>
                    <div>
                        <button
                            className="border border-white text-white rounded-md p-2"
                            onClick={() => setShowUpdate(true)} // Directly show update modal
                        >
                            Update
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Filters</h2> {/* Updated title */}

                <div className="flex flex-wrap gap-4 mb-4 items-end w-full">
                    {/* Combined Search */}
                    <div className="flex flex-col w-60">
                        <label className="text-sm text-gray-600 mb-1">Search Employee</label>
                        <input
                            type="text"
                            placeholder="ID or Name"
                            value={searchFilter}
                            onChange={(e) => {
                                setPage(1);
                                setSearchFilter(e.target.value);
                            }}
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

                    {/* Status Filter */}
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
                            <option value="approved">Approved</option>
                            <option value="pending">Pending</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    {/* Bill Type Filter */}
                    <div className="flex flex-col w-60">
                        <label className="text-sm text-gray-600 mb-1">Bill Type</label>
                        <select
                            value={billTypeFilter}
                            onChange={(e) => {
                                setBillTypeFilter(e.target.value);
                                setPage(1);
                            }}
                            className="border border-gray-300 p-2 rounded-md"
                        >
                            <option value="All">All Bill Types</option>
                            {billTypes.map((t) => (
                                <option key={t.id} value={t.bill_type}>
                                    {t.bill_type}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end ml-auto">
                        <button
                            type="button"
                            className="bg-gray-300 text-white p-2 rounded-md flex items-center gap-2"
                            onClick={handleExport}
                        >
                            <BsDownload /> Export
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto bg-white rounded-lg mt-4">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white text-gray-600 border-b border-t">
                            <tr>
                                <th className="p-3">ID</th>
                                <th className="p-3">Employee</th>
                                <th className="p-3">Requested Date</th>
                                <th className="p-3">Bill type</th>
                                <th className="p-3">Bill Date</th>
                                <th className="p-3">Bill Amount</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-6">
                                        Loading...
                                    </td>
                                </tr>
                            ) : fetchError ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-6 text-red-600">
                                        {fetchError}
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-6">
                                        No data found.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((r) => (
                                    <tr key={r.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 text-blue-600">
                                            {r.employee_no ?? r.id} {/* Now uses r.employee_no directly */}
                                        </td>
                                        <td className="p-3 ">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0 ${avatarBgClass(
                                                        r.employee_name || r.employee_no
                                                    )}`}
                                                    title={r.employee_name}
                                                >
                                                    {getInitials(r.employee_name || r.employee_no)}
                                                </div>
                                                <div className="leading-5">
                                                    <div className="font-semibold">
                                                        {r.employee_name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        EMP ID: {r.employee_no}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3">{fmtDate(r.requestedAt)}</td>
                                        <td className="p-3">{r.bill_type || "-"}</td> {/* Now uses r.bill_type directly */}
                                        <td className="p-3">{fmtDate(r.bill_date)}</td>
                                        <td className="p-3">
                                            {r.bill_amount ? `Rs. ${Number(r.bill_amount).toLocaleString()}` : "-"}
                                        </td>
                                        <td className={`p-3 capitalize ${statusColorMap[r.status?.toLowerCase()] || ""}`}>
                                            {r.status || "-"}
                                        </td>


                                        <td className="p-3 flex gap-3 items-center">
                                            {String(r.status).toLowerCase() === "pending" && (
                                                <>
                                                    <button
                                                        className="p-2 bg-green-100 text-green-600 rounded-md hover:bg-green-200"
                                                        onClick={() => openApprove(r)}
                                                        title="Approve"
                                                    >
                                                        <FaCheck />
                                                    </button>

                                                    <button
                                                        className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 ml-2"
                                                        onClick={() => openReject(r)}
                                                        title="Reject"
                                                    >
                                                        ✖
                                                    </button>
                                                </>
                                            )}

                                            <button
                                                className="p-2 bg-gray-200 rounded-md hover:bg-gray-300"
                                                onClick={() =>
                                                    navigate(
                                                        `/view-bill-reimbursement/${encodeURIComponent(r.id)}`
                                                    )
                                                }
                                                title="View Details"
                                            >
                                                <IoEyeOutline />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Simple pager (if your API supports page/pageSize) */}
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

            {/* View/Reject/Approve/Update modals (same behavior as your version) */}
            {/* The `showModal` and `selectedReimbursement` are for a generic modal, not the specific approve/reject ones */}
            {showModal && selectedReimbursement && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                        <div className="p-4 border-b">
                            <h3 className="text-lg font-semibold">
                                {actionType === "view"
                                    ? "Reimbursement Details"
                                    : actionType === "approved"
                                        ? "Approve Reimbursement"
                                        : "Reject Reimbursement"}
                            </h3>
                        </div>
                        <div className="p-4 space-y-2 text-sm">
                            {/* This detail body should be populated based on `selectedReimbursement` */}
                            <div>
                                <p><strong>Employee:</strong> {selectedReimbursement.employee_name}</p>
                                <p><strong>Employee No:</strong> {selectedReimbursement.employee_no}</p>
                                <p><strong>Bill Type:</strong> {selectedReimbursement.bill_type}</p>
                                <p><strong>Bill Amount:</strong> Rs. {Number(selectedReimbursement.bill_amount).toLocaleString()}</p>
                                <p><strong>Status:</strong> {selectedReimbursement.status}</p>
                                {/* Add more details as needed from selectedReimbursement */}
                            </div>
                        </div>
                        <div className="p-4 border-t flex gap-2 justify-end">
                            <button
                                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
                                onClick={() => {
                                    setShowModal(false);
                                    setSelectedReimbursement(null);
                                    setActionType(null);
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showReject && rejectTarget && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-lg relative">
                        <button
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            onClick={() => {
                                setShowReject(false);
                                setRejectTarget(null);
                                setRejectReason("");
                            }}
                            aria-label="Close"
                        >
                            ✕
                        </button>

                        <div className="p-6">
                            <h3 className="text-2xl text-center font-semibold mb-2">
                                Reject?
                            </h3>
                            <p className="text-center text-gray-600 mb-4">
                                Are you sure you want to reject this Bill Reimbursement?
                            </p>
                            <p className="text-center font-semibold mb-6">
                                {rejectTarget.employee_name}
                            </p>

                            <div className="mb-6">
                                <label className="block text-sm text-gray-600 mb-1">
                                    Reason (Optional)
                                </label>
                                <textarea
                                    rows={4}
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    className="w-full border border-gray-300 p-2 rounded-md resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    onClick={() => {
                                        setShowReject(false);
                                        setRejectTarget(null);
                                        setRejectReason("");
                                    }}
                                >
                                    No
                                </button>
                                <button
                                    className="px-5 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                    onClick={handleRejectYes}
                                >
                                    Yes
                                </button>

                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* APPROVE POPUP */}
            {showApprove && approveTarget && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-lg relative">
                        {/* Close (X) */}
                        <button
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            onClick={() => { setShowApprove(false); setApproveTarget(null); }}
                            aria-label="Close"
                        >
                            ✕
                        </button>

                        <div className="p-6">
                            <h3 className="text-2xl text-center font-semibold mb-2">Approve?</h3>
                            <p className="text-center text-gray-600 mb-4">
                                Are you sure you want to approve this Bill Reimbursement?
                            </p>

                            {/* Summary */}
                            <div className="text-center font-semibold mb-6">
                                {approveTarget.employee_name} <span className="text-gray-500 font-normal">
                                    (EMP ID: {approveTarget.employee_no})
                                </span>
                            </div>

                            {/* No specific fields for Bill Reimbursement approval, unlike Spectacle Allowance */}

                            {/* Actions */}
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    onClick={() => { setShowApprove(false); setApproveTarget(null); }}
                                >
                                    No
                                </button>
                                <button
                                    className="px-5 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                    onClick={handleApproveYes}
                                >
                                    Yes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Max Claim Update Modal (likely from Spectacle Allowance, keeping it as is) */}
            {showUpdate && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-lg relative">
                        <button
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowUpdate(false)}
                            aria-label="Close"
                        >
                            ✕
                        </button>

                        <div className="p-6">
                            <h3 className="text-2xl text-center font-semibold mb-2">
                                Update
                            </h3>
                            <p className="text-center text-gray-600 mb-6">
                                Are you sure you want to Update this maximum claimable amount?
                            </p>

                            <div className="mb-6">
                                <label className="block text-sm text-gray-600 mb-1">
                                    Max Claim Amount (Rs.)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={updateValue}
                                    onChange={(e) => setUpdateValue(e.target.value)}
                                    className="w-full border border-gray-300 p-2 rounded-md"
                                    placeholder="0.00"
                                />

                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    onClick={() => setShowUpdate(false)}
                                >
                                    No
                                </button>
                                <button
                                    className="px-5 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                    onClick={handleUpdateConfirm}
                                >
                                    Update
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <ToastContainer position="top-right" autoClose={3000} />

        </div>
    );
}

export default BillReimbursement;