import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BsFiletypePdf } from "react-icons/bs";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiFetch } from "../../../utils/apiClient";


// helper: get filename from a URL
const fileName = (url) => {
    if (!url) return "—";
    try {
        const u = new URL(url);
        return decodeURIComponent(u.pathname.split("/").pop() || "");
    } catch {
        return url.split("/").pop() || url;
    }
};

export default function ViewSpectaclesAllowance() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const empId = searchParams.get("empId") || "";
    const claimId = searchParams.get("claimId") || ""; // 👈 which row was clicked
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [record, setRecord] = useState(null);
    const [showApprove, setShowApprove] = useState(false);
    const [claimDate, setClaimDate] = useState("");
    const [showReject, setShowReject] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const statusTextClass = useMemo(() => {
        const s = String(record?.status || "").toLowerCase();
        if (s === "approved") return "text-emerald-600 font-bold";
        if (s === "rejected") return "text-rose-600 font-bold";
        if (s === "pending") return "text-amber-600 font-bold";
        return "text-gray-700";
    }, [record]);

    const isPending = useMemo(
        () => String(record?.status || "").toLowerCase() === "pending",
        [record]
    );

    const API_URL = process.env.REACT_APP_FRONTEND_URL;

    const fetchForEmployee = async (empIdVal) => {
        setIsLoading(true);
        setLoadError("");
        setRecord(null);
        try {
            if (!empIdVal) throw new Error("Missing empId");

            // Employee-specific endpoint returns an array of claims
            const url = `${API_URL}/v1/hris/employee-spectacle-medical/employee/${encodeURIComponent(empIdVal)}`;
            const res = await apiFetch(url, {
                credentials: "include",
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const json = await res.json();
            const rows = Array.isArray(json?.data) ? json.data : [];

            // Pick the one user clicked, else fallback to latest
            let rec = null;
            if (claimId) rec = rows.find((r) => String(r.id) === String(claimId)) || null;
            if (!rec) {
                rows.sort(
                    (a, b) =>
                        new Date(b.createdAt || 0).getTime() -
                        new Date(a.createdAt || 0).getTime()
                );
                rec = rows[0] || null;
            }

            setRecord(rec);
            if (!rec) setLoadError("No records for this employee.");
        } catch (e) {
            setLoadError("Failed to load details.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchForEmployee(empId);
    }, [empId, claimId]);

    const handleApprove = async () => {
        if (!record || !isPending || !claimDate) return;
        try {
            const form = new FormData();
            form.append("empId", record.empId);
            form.append("typeId", String(record.typeId));
            form.append("note", "");
            form.append("claimRecivedDate", claimDate);

            const res = await apiFetch(
                `${API_URL}/v1/hris/employee-spectacle-medical/${record.id}/approve`,
                { method: "PUT", credentials: "include", body: form }
            );
            let json = {};
            try { json = await res.json(); } catch { }
            const ok = json?.success || res.ok;
            const msg = json?.message || (ok ? "Approved successfully" : "Approve failed");
            if (ok) {
                toast.success(msg);
                setShowApprove(false);
                setClaimDate("");
                fetchForEmployee(empId); // refresh record
            } else {
                toast.error(msg);
            }
        } catch (err) {
            toast.error("Approve failed. Please try again.");
        }
    };

    const handleReject = async () => {
        if (!record || !isPending) return;
        try {
            const res = await apiFetch(
                `${API_URL}/v1/hris/employee-spectacle-medical/${record.id}/reject`,
                {
                    method: "PUT",
                    credentials: "include",
                   
                    body: JSON.stringify({ rejectReason }),
                }
            );
            let json = {};
            try { json = await res.json(); } catch { }
            const ok = json?.success || res.ok;
            const msg = json?.message || (ok ? "Rejected successfully" : "Reject failed");
            if (ok) {
                toast.success(msg);
                setShowReject(false);
                setRejectReason("");
                fetchForEmployee(empId); // refresh record
            } else {
                toast.error(msg);
            }
        } catch {
            toast.error("Reject failed. Please try again.");
        }
    };

    return (
        <div className="p-6 font-montserrat">
            <div className="text-sm text-gray-500 mb-6">
                <span className="text-gray-400">Payroll Navigation</span> /{" "}
                <span className="text-gray-400">Spectacle Allowances</span> /{" "}
                <span className="text-gray-900 font-medium">View Application</span>
            </div>

            <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-6 border-b">
                    <h2 className="text-lg font-semibold">Application Form</h2>
                </div>

                <div className="p-6 space-y-6">
                    {isLoading ? (
                        <div>Loading…</div>
                    ) : loadError ? (
                        <div className="text-rose-600">{loadError}</div>
                    ) : !record ? (
                        <div>No data.</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm text-gray-600">Employee ID</label>
                                    <input
                                        className="w-full border rounded-md p-2 bg-gray-50"
                                        value={record?.employee?.employee_no || record.empId || "—"}
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600">Employee Name</label>
                                    <input
                                        className="w-full border rounded-md p-2 bg-gray-50"
                                        value={record?.employee?.employee_fullname || "—"}
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600">Status</label>
                                    <input
                                        className={`w-full border rounded-md p-2 bg-gray-50 ${statusTextClass}`}
                                        value={record?.status || "—"}
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm text-gray-600">Claim type</label>
                                    <input
                                        className="w-full border rounded-md p-2 bg-gray-50"
                                        value={record?.spectacleMedicalType?.spectacle_type || "—"}
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600">Claim Amount (Rs.)</label>
                                    <input
                                        className="w-full border rounded-md p-2 bg-gray-50"
                                        value={
                                            record?.claim_Amount
                                                ? Number(record.claim_Amount).toLocaleString()
                                                : "—"
                                        }
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600">Requested Date</label>
                                    <input
                                        className="w-full border rounded-md p-2 bg-gray-50"
                                        value={
                                            record?.createdAt
                                                ? new Date(record.createdAt).toLocaleString()
                                                : "—"
                                        }
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FileCard label="Invoice" url={record?.Invoice} />
                                <FileCard label="Prescription" url={record?.Prescription} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-gray-600">Additional Comment</label>
                                <textarea
                                    rows={4}
                                    className="w-full border rounded-md p-3 bg-gray-50"
                                    readOnly
                                    value={record?.note || ""}
                                />
                            </div>

                            <div className="text-sm text-gray-600">
                                Approved/Rejected by : <span className="text-gray-900 font-medium">—</span>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <button
                                    className="px-4 py-2 rounded-md border text-gray-600 bg-gray-100"
                                    onClick={() => navigate(-1)}
                                >
                                    Back
                                </button>

                                {isPending && (
                                    <div className="flex gap-3">
                                        <button
                                            className="px-4 py-2 rounded-md bg-rose-500 hover:bg-rose-600 text-white"
                                            onClick={() => setShowReject(true)}
                                        >
                                            Reject
                                        </button>
                                        <button
                                            className="px-4 py-2 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white"
                                            onClick={() => setShowApprove(true)}
                                        >
                                            Approve
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Approve Modal */}
            {showApprove && record && isPending && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-lg relative">
                        <button
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            onClick={() => { setShowApprove(false); setClaimDate(""); }}
                            aria-label="Close"
                        >
                            ✕
                        </button>
                        <div className="p-6">
                            <h3 className="text-2xl text-center font-semibold mb-2">Approve?</h3>
                            <p className="text-center text-gray-600 mb-4">
                                Are you sure you want to Approve this Spectacle Allowance?
                            </p>
                            <p className="text-center font-semibold mb-6">
                                {record?.employee?.employee_fullname || record?.empId}
                            </p>

                            <div className="mb-6">
                                <label className="block text-sm text-gray-600 mb-1">Claim Received Date</label>
                                <input
                                    type="date"
                                    value={claimDate}
                                    onChange={(e) => setClaimDate(e.target.value)}
                                    className="w-full border border-gray-300 p-2 rounded-md"
                                    placeholder="Select date"
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 cursor-not-allowed" disabled>
                                    No
                                </button>
                                <button
                                    className={`px-5 py-2 rounded-md text-white ${claimDate ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"}`}
                                    disabled={!claimDate}
                                    onClick={handleApprove}
                                >
                                    Yes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showReject && record && isPending && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-lg relative">
                        <button
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            onClick={() => { setShowReject(false); setRejectReason(""); }}
                            aria-label="Close"
                        >
                            ✕
                        </button>
                        <div className="p-6">
                            <h3 className="text-2xl text-center font-semibold mb-2">Reject?</h3>
                            <p className="text-center text-gray-600 mb-4">
                                Are you sure you want to reject this Spectacle Allowance?
                            </p>
                            <p className="text-center font-semibold mb-6">
                                {record?.employee?.employee_fullname || record?.empId}
                            </p>

                            <div className="mb-6">
                                <label className="block text-sm text-gray-600 mb-1">Reason (Optional)</label>
                                <textarea
                                    rows={4}
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    className="w-full border border-gray-300 p-2 rounded-md resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 cursor-not-allowed" disabled>
                                    No
                                </button>
                                <button className="px-5 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700" onClick={handleReject}>
                                    Yes
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

function FileCard({ label, url }) {
    return (
        <div className="flex flex-col gap-2 w-full">
            <label className="text-sm text-gray-600">{label}</label>
            <div className="flex items-center gap-3 border rounded-md p-3 bg-gray-50">
                <div className="shrink-0">
                    <span className="inline-flex items-center gap-1 text-white text-xs bg-red-500 px-2 py-1 rounded">
                        <BsFiletypePdf className="text-white" />
                        PDF
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{url ? fileName(url) : "—"}</div>
                    <div className="text-xs text-gray-500">Open to view</div>
                </div>
                {url ? (
                    <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm shrink-0">
                        View
                    </a>
                ) : (
                    <span className="text-gray-400 text-sm shrink-0">—</span>
                )}
            </div>
        </div>
    );
}
