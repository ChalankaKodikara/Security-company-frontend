import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiFetch } from "../../../utils/apiClient";
const ViewOvertimeInOut = () => {
    const [searchParams] = useSearchParams();
    const empId = searchParams.get("empId") || "";
    const year = searchParams.get("year") || "";
    const month = searchParams.get("month") || "";
    const API_URL = process.env.REACT_APP_FRONTEND_URL;
    const [rows, setRows] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(50);
    const [totalPages, setTotalPages] = useState(1);
    const [count, setCount] = useState(0);
    const [selected, setSelected] = useState(new Set());
    const [showConfirm, setShowConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [resultInfo, setResultInfo] = useState({
        ok: false,
        message: "",
        dates: [],
    });
    const [resultAmount, setResultAmount] = useState("");
    const [amountErr, setAmountErr] = useState("");
    const [isPuttingAmount, setIsPuttingAmount] = useState(false);
    const [amountBanner, setAmountBanner] = useState({ type: "", text: "" }); // success | error
    const fmt = (t) => (t && t !== "00:00:00" ? t : "—");
    const rowKey = (idx) => `${rows[idx]?.work_date_local ?? "n/a"}#${idx}`;

    // Select/unselect one row
    const toggleRow = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    
    const isAllSelected = rows.length > 0 && selected.size === rows.length;
    const toggleAll = () => {
        if (isAllSelected) {
            setSelected(new Set());
        } else {
            setSelected(new Set(rows.map((_, idx) => rowKey(idx))));
        }
    };

    useEffect(() => {
        setSelected(new Set());
    }, [rows]);

 
    useEffect(() => {
        if (!empId || !year || !month) return;

        const controller = new AbortController();

        (async () => {
            setIsLoading(true);
            setFetchError("");
            try {
                const params = new URLSearchParams({
                    employee_id: empId,
                    year: String(year),
                    month: String(Number(month)),
                    page: String(page),
                    limit: String(limit),
                });

                const res = await apiFetch(
                    `${API_URL}/v1/hris/new-attendence/attendance?${params.toString()}`,
                    {
                        credentials: "include",
                        signal: controller.signal,
                    }
                );
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();

                const data = Array.isArray(json?.data) ? json.data : [];
                setRows(data);

   
                const srvCount = Number(json?.count ?? json?.total ?? data.length ?? 0);
                setCount(Number.isFinite(srvCount) ? srvCount : 0);

                const srvTotalPages = Number(json?.totalPages || 1);
                setTotalPages(Number.isFinite(srvTotalPages) ? srvTotalPages : 1);

                const srvPage = Number(json?.page);
                if (Number.isFinite(srvPage) && srvPage !== page) setPage(srvPage);

                const srvLimit = Number(json?.limit);
                if (Number.isFinite(srvLimit) && srvLimit !== limit) setLimit(srvLimit);

                if (srvTotalPages > 0 && page > srvTotalPages) setPage(1);
            } catch (e) {
                if (e.name !== "AbortError") {
                    setFetchError("Failed to load attendance.");
                    setRows([]);
                    setCount(0);
                    setTotalPages(1);
                }
            } finally {
                setIsLoading(false);
            }
        })();

        return () => controller.abort();
    }, [empId, year, month, page, limit, API_URL]);

    const selectedDates = () =>
        Array.from(selected)
            .map((id) => {
                const idx = Number(id.split("#")[1]);
                return rows[idx]?.work_date_local;
            })
            .filter(Boolean)
            .sort();

    const openConfirm = () => {
        if (selected.size === 0) return;
        setShowConfirm(true);
    };
    const closeConfirm = () => setShowConfirm(false);

    const submitApprovedDates = async () => {
        const dates = selectedDates();
        if (!dates.length) return;

        setIsSubmitting(true);
        try {
            const payload = {
                employee_no: empId,
                month: Number(month),
                year: Number(year),
                dates,
            };

            const res = await apiFetch(`${API_URL}/v1/hris/payroll/overtime-calculate`, {
                method: "POST",
                credentials: "include",
                body: JSON.stringify(payload),
            });

            let json = {};
            try {
                json = await res.json();
            } catch { }

            if (res.ok) {
                setResultInfo({
                    ok: true,
                    message: json?.message || "Overtime approved dates submitted.",
                    dates,
                });
                setSelected(new Set());
                setShowConfirm(false);
                setShowResult(true);
                setResultAmount("");
                setAmountErr("");
                setAmountBanner({ type: "", text: "" });
            } else {
                setResultInfo({
                    ok: false,
                    message: json?.message || "Submission failed.",
                    dates: [],
                });
                setShowConfirm(false);
                setShowResult(true);
            }
        } catch {
            setResultInfo({
                ok: false,
                message: "Submission failed. Please try again.",
                dates: [],
            });
            setShowConfirm(false);
            setShowResult(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const onAmountChange = (e) => {
        const val = e.target.value;
        setResultAmount(val);
        setAmountBanner({ type: "", text: "" });
        if (val.trim() === "") {
            setAmountErr("");
            return;
        }
        const n = Number(val);
        if (!Number.isFinite(n) || n < 0) {
            setAmountErr("Enter a valid non-negative number.");
        } else {
            setAmountErr("");
        }
    };

    const putMonthlyAmount = async () => {
        if (resultAmount.trim() === "") {
            setAmountErr("Amount is required.");
            return;
        }
        if (amountErr) return;

        const n = Number(resultAmount);
        if (!Number.isFinite(n) || n < 0) {
            setAmountErr("Enter a valid non-negative number.");
            return;
        }

        setIsPuttingAmount(true);
        setAmountBanner({ type: "", text: "" });

        try {
            const payload = {
                employee_no: empId,
                month: Number(month),
                year: Number(year),
                amount: n,
            };

            const res = await apiFetch(`${API_URL}/v1/hris/payroll/monthly/amount`, {
                method: "PUT",
                credentials: "include",
                body: JSON.stringify(payload),
            });

            let json = {};
            try {
                json = await res.json();
            } catch { }

            if (res.ok) {
                setAmountBanner({
                    type: "success",
                    text: json?.message || "Monthly amount updated successfully.",
                });
            } else {
                setAmountBanner({
                    type: "error",
                    text: json?.message || "Failed to update monthly amount.",
                });
            }
        } catch {
            setAmountBanner({
                type: "error",
                text: "Failed to update monthly amount. Please try again.",
            });
        } finally {
            setIsPuttingAmount(false);
        }
    };

    return (
        <div className="mx-5 mt-5 font-montserrat">
            <div className="flex items-center justify-between mb-5">
                <p className="text-[24px]">
                    Overtime CheckIn / Out Report for · {empId} · {year}-
                    {String(month).padStart(2, "0")}
                </p>
            </div>

            <div className="shadow-lg p-5 rounded-lg bg-white">
                {/* Actions */}
                <div className="flex justify-between items-center mb-3">
                    <div className="text-sm text-gray-600">
                        Selected: <span className="font-semibold">{selected.size}</span>
                    </div>
                    <button
                        className={`px-4 py-2 rounded text-white ${selected.size === 0
                                ? "bg-blue-300 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                            }`}
                        disabled={selected.size === 0}
                        onClick={openConfirm}
                    >
                        Submit Approved Dates
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4"
                                        checked={isAllSelected}
                                        onChange={toggleAll}
                                        aria-label="Select all"
                                    />
                                </th>
                                <th className="px-6 py-3 font-medium text-gray-900">Date</th>
                                <th className="px-6 py-3 font-medium text-gray-900">Check-in</th>
                                <th className="px-6 py-3 font-medium text-gray-900">IN Type</th>
                                <th className="px-6 py-3 font-medium text-gray-900">Check-out</th>
                                <th className="px-6 py-3 font-medium text-gray-900">OUT Type</th>
                                <th className="px-6 py-3 font-medium text-gray-900">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center">
                                        Loading...
                                    </td>
                                </tr>
                            ) : fetchError ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-red-600">
                                        {fetchError}
                                    </td>
                                </tr>
                            ) : rows.length ? (
                                rows.map((r, idx) => {
                                    const id = rowKey(idx);
                                    const checked = selected.has(id);
                                    return (
                                        <tr key={id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4"
                                                    checked={checked}
                                                    onChange={() => toggleRow(id)}
                                                    aria-label={`Select ${r.work_date_local}`}
                                                />
                                            </td>
                                            <td className="px-6 py-4">{r.work_date_local}</td>
                                            <td className="px-6 py-4">{fmt(r.checkIN_time)}</td>
                                            <td className="px-6 py-4">{r.checkIN_type || "—"}</td>
                                            <td className="px-6 py-4">{fmt(r.checkOUT_time)}</td>
                                            <td className="px-6 py-4">{r.checkOUT_type || "—"}</td>
                                            <td className="px-6 py-4">{r.status || "—"}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center">
                                        No data
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pager */}
                <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                    <div>
                        Page {Math.min(page, totalPages)} of {totalPages} ({count} records)
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="px-3 py-1 border rounded disabled:opacity-50"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                        >
                            Prev
                        </button>
                        <button
                            className="px-3 py-1 border rounded disabled:opacity-50"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirm Modal (Are you sure for dates) */}
            {showConfirm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl p-5 shadow-xl w-full max-w-lg">
                        <div className="mb-3">
                            <h3 className="text-lg font-semibold text-center">Are you sure?</h3>
                            <p className="text-center text-gray-600 mt-1">
                                Submit <span className="font-semibold">{selected.size}</span> selected
                                date(s) for {empId} in {year}-{String(month).padStart(2, "0")}?
                            </p>
                            <div className="mt-3 max-h-40 overflow-auto border rounded p-2 bg-gray-50 text-xs">
                                {selectedDates().map((d) => (
                                    <span
                                        key={d}
                                        className="inline-block mr-2 mb-2 px-2 py-1 bg-blue-100 text-blue-700 rounded"
                                    >
                                        {d}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
                                onClick={closeConfirm}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                className={`px-4 py-2 rounded text-white ${isSubmitting ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"
                                    }`}
                                onClick={submitApprovedDates}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Submitting..." : "Yes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Result Popup (after POST). Includes Amount + PUT on Yes */}
            {showResult && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl p-5 shadow-xl w-full max-w-lg relative">
                        <button
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowResult(false)}
                            aria-label="Close"
                        >
                            ✕
                        </button>

                        <div className="mb-4">
                            <h3
                                className={`text-xl font-semibold text-center ${resultInfo.ok ? "text-green-600" : "text-red-600"
                                    }`}
                            >
                                {resultInfo.ok ? "Success" : "Error"}
                            </h3>
                            <p className="text-center text-gray-700 mt-2">{resultInfo.message}</p>

                            {resultInfo.ok && (
                                <>
                                    <p className="text-center text-gray-600 mt-3">
                                        {empId} · {year}-{String(month).padStart(2, "0")}
                                    </p>

                                    {/* Selected dates preview */}
                                    <div className="mt-3 max-h-40 overflow-auto p-2 text-xs">
                                        <label className="block text-gray-600 mb-1">Selected dates:</label>
                                        {resultInfo.dates.map((d) => (
                                            <span
                                                key={d}
                                                className="inline-block mr-2 mb-2 px-2 py-1 bg-gray-100 text-gray-700 rounded"
                                            >
                                                {d}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Amount input */}
                                    <div className="mt-4">
                                        <label className="block text-sm text-gray-700 mb-1">
                                            Amount (required)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={resultAmount}
                                            onChange={onAmountChange}
                                            className={`border rounded-md p-2 w-full ${amountErr ? "border-red-400" : "border-gray-300"
                                                }`}
                                            placeholder="e.g. 18500.00"
                                        />
                                        {amountErr && (
                                            <div className="text-xs text-red-600 mt-1">{amountErr}</div>
                                        )}
                                    </div>

                                    {/* Amount result banner */}
                                    {amountBanner.text && (
                                        <div
                                            className={`mt-3 px-3 py-2 rounded text-sm ${amountBanner.type === "success"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-700"
                                                }`}
                                        >
                                            {amountBanner.text}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="flex justify-end gap-2">
                            {resultInfo.ok ? (
                                <>
                                    <button
                                        className={`px-4 py-2 rounded text-white ${isPuttingAmount || !resultAmount || !!amountErr
                                                ? "bg-blue-300 cursor-not-allowed"
                                                : "bg-blue-600 hover:bg-blue-700"
                                            }`}
                                        onClick={putMonthlyAmount}
                                        disabled={isPuttingAmount || !resultAmount || !!amountErr}
                                    >
                                        {isPuttingAmount ? "Saving..." : "Yes"}
                                    </button>
                                    <button
                                        className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                                        onClick={() => setShowResult(false)}
                                    >
                                        Close
                                    </button>
                                </>
                            ) : (
                                <button
                                    className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-800"
                                    onClick={() => setShowResult(false)}
                                >
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewOvertimeInOut;
