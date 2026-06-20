/** @format */

import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { BsWrenchAdjustable } from "react-icons/bs";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";

const ViewAttendanceInOut = () => {
  const [searchParams] = useSearchParams();
  const empId = searchParams.get("employeeId") || "";
  const year = searchParams.get("year") || "";
  const month = searchParams.get("month") || "";
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const token = Cookies.get("user_token");
  const [rows, setRows] = useState([]);
  const [employeeMeta, setEmployeeMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [limit, setLimit] = useState(32);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAction, setShowAction] = useState(false);
  const [actionRow, setActionRow] = useState(null);
  const [noAccessOpen, setNoAccessOpen] = useState(false);
  const [selectedLeaveCat, setSelectedLeaveCat] = useState(null);
  const [formType, setFormType] = useState("full day");
  const [isPosting, setIsPosting] = useState(false);
  const [postBanner, setPostBanner] = useState({ type: "", text: "" });
  const [leaveCounts, setLeaveCounts] = useState({
    categories: [],
    noPay: null,
  });
  const [leaveCountsLoading, setLeaveCountsLoading] = useState(false);
  const [leaveCountsError, setLeaveCountsError] = useState("");
  const fmt = (t) => (t && t !== "00:00:00" ? t : "—");
  const rowKey = (idx) => `${rows[idx]?.["Date"] ?? "n/a"}#${idx}`;
  const initials = (s = "") =>
    s
      .trim()
      .split(/\s+/)
      .map((w) => w[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "NA";

  const reasonForCategory = (name) => {
    const s = String(name || "").toUpperCase();
    if (s.includes("ANNUAL") || s.includes("ANUAL")) return "Annual leave";
    if (s.includes("HALF")) return "Half day";
    return name || "Leave";
  };
  const deductionType = selectedLeaveCat ? "leave_balance" : "no_pay";
  const normalizedTypeLabel =
    formType === "short_leave"
      ? "Short Leave"
      : formType === "half day"
        ? "Half Day"
        : "Full Day";
  const reasonText =
    formType === "short_leave"
      ? "Short leave added by HR"
      : selectedLeaveCat
        ? `${reasonForCategory(selectedLeaveCat.name)} added by HR`
        : "No-pay leave added by HR";
  const summaryText =
    formType === "short_leave"
      ? "This will deduct 1 short leave and mark attendance as Short Leave."
      : selectedLeaveCat
        ? `This will deduct from ${selectedLeaveCat.name} balance and mark attendance as Leave.`
        : "This will create a no-pay leave entry and mark attendance as Leave.";

  const canSubmitAttendance = useMemo(() => {
    if (isLoading || fetchError) return false;
    if (!Array.isArray(rows) || rows.length === 0) return false;

    return rows.every(
      (r) =>
        String(r?.complete ?? "")
          .trim()
          .toLowerCase() === "yes",
    );
  }, [rows, isLoading, fetchError]);

  useEffect(() => {
    if (selectedLeaveCat?.name && /half/i.test(selectedLeaveCat.name)) {
      setFormType("half day");
    }
  }, [selectedLeaveCat]);

  useEffect(() => {
    if (formType === "short_leave") {
      setSelectedLeaveCat(null);
    }
  }, [formType]);

  const openAction = (row) => {
    setActionRow(row);
    setFormType("full day");
    setSelectedLeaveCat(null);
    setPostBanner({ type: "", text: "" });
    setShowAction(true);
  };

  const closeAction = () => {
    setShowAction(false);
    setActionRow(null);
    setPostBanner({ type: "", text: "" });
    setSelectedLeaveCat(null);
    setFormType("full day");
  };

  const handleActionClick = (row) => {
    const isCompleteYes = String(row?.complete ?? "").toLowerCase() === "yes";
    if (isCompleteYes) {
      setNoAccessOpen(true);
    } else {
      openAction(row);
    }
  };

  const fetchAttendance = async (signal = undefined) => {
    setIsLoading(true);
    setFetchError("");

    try {
      const params = new URLSearchParams({
        employeeId: empId,
        year: String(year),
        month: String(Number(month)),
        page: String(page),
        limit: String(limit),
        payroll_group: "Ho",
      });

      const res = await fetch(
        `${API_URL}/v1/hris/leave-check/real-leaves?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          signal,
        },
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      setEmployeeMeta(json?.employee ?? null);

      const data = Array.isArray(json?.data) ? json.data : [];
      setRows(data);

      const pag = json?.pagination || {};
      const total = Number(pag.total);
      const totalPagesFromServer = Number(pag.totalPages);
      const srvPage = Number(pag.page);
      const srvLimit = Number(pag.limit);

      setCount(Number.isFinite(total) ? total : data.length);
      setTotalPages(
        Number.isFinite(totalPagesFromServer) ? totalPagesFromServer : 1,
      );

      if (Number.isFinite(srvPage) && srvPage !== page) setPage(srvPage);
      if (Number.isFinite(srvLimit) && srvLimit !== limit) setLimit(srvLimit);

      if (
        Number.isFinite(totalPagesFromServer) &&
        totalPagesFromServer > 0 &&
        page > totalPagesFromServer
      ) {
        setPage(1);
      }
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
  };

  const fetchLeaveCounts = async (signal = undefined) => {
    if (!empId || !year) return;

    setLeaveCountsLoading(true);
    setLeaveCountsError("");

    try {
      const params = new URLSearchParams({
        employee_no: empId,
        year: String(year),
      });

      const res = await fetch(
        `${API_URL}/v1/hris/leave-check/employee-leave-counts?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          signal,
        },
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const cats = json?.data?.categories ?? [];
      const noPay = json?.data?.no_pay ?? null;

      setLeaveCounts({ categories: cats, noPay });
    } catch (e) {
      if (e.name !== "AbortError") {
        setLeaveCounts({ categories: [], noPay: null });
        setLeaveCountsError("Failed to load leave counts.");
      }
    } finally {
      setLeaveCountsLoading(false);
    }
  };

  useEffect(() => {
    if (!empId || !year || !month) return;
    const controller = new AbortController();
    fetchAttendance(controller.signal);
    return () => controller.abort();
  }, [empId, year, month, page, limit, API_URL]);

  useEffect(() => {
    if (!showAction) return;
    const controller = new AbortController();
    fetchLeaveCounts(controller.signal);
    return () => controller.abort();
  }, [showAction, empId, year, API_URL]);

  const statusBadge = (status) => {
    if (status == null) return "—";

    const text = typeof status === "string" ? status : String(status);
    const normalized = text.toLowerCase();

    let cls = "bg-gray-200 text-gray-700";
    if (normalized.includes("leave")) {
      cls = "bg-red-100 text-red-700";
    } else if (
      normalized.includes("short") ||
      normalized.includes("normal day")
    ) {
      cls = "bg-yellow-100 text-yellow-700";
    } else if (normalized.includes("half")) {
      cls = "bg-orange-100 text-orange-700";
    } else if (normalized === "normal day") {
      cls = "bg-gray-300 text-gray-800";
    }

    return (
      <span
        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${cls}`}
      >
        {text}
      </span>
    );
  };

  const leaveBadge = (leaves) => {
    if (!Array.isArray(leaves) || leaves.length === 0) return "—";

    const leave = leaves[0];
    const category = leave.category || "—";
    const status = (leave.status || "").toUpperCase();

    let cls = "bg-gray-200 text-gray-700";
    if (status === "APPROVED") cls = "bg-green-100 text-green-700";
    else if (status === "REJECTED") cls = "bg-red-100 text-red-700";
    else if (status === "PENDING") cls = "bg-yellow-100 text-yellow-700";

    return (
      <span
        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${cls}`}
      >
        {`${category.trim()} (${status || "—"})`}
      </span>
    );
  };

  const submitLeave = async () => {
    const requestDay = actionRow?.["Date"];
    if (!requestDay) {
      toast.error("Date missing for this row.");
      return;
    }

    const normalizedType =
      formType === "short_leave"
        ? "short_leave"
        : String(formType || "")
              .toLowerCase()
              .includes("half")
          ? "half day"
          : "full day";

    const payload = {
      employee_no: empId,
      reason: reasonText,
      deduction_type: deductionType,
      leave_category_id: selectedLeaveCat?.id ?? null,
      requested_dates: [{ request_day: requestDay, type: normalizedType }],
    };

    setIsPosting(true);
    setPostBanner({ type: "", text: "" });

    try {
      const res = await fetch(
        `${API_URL}/v1/hris/leave-check/add-leave-by-hr`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || json?.message || `HTTP ${res.status}`);
      }

      toast.success(json?.message || "Saved successfully.");

      await fetchAttendance();
      await fetchLeaveCounts();

      closeAction();
    } catch (err) {
      const msg = err?.message || "Failed to save.";
      setPostBanner({ type: "error", text: msg });
      toast.error(msg);
    } finally {
      setIsPosting(false);
    }
  };

  const submitAttendance = async () => {
    try {
      const res = await fetch(
        `${API_URL}/v1/hris/payroll/attendance-status/update`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            employee_id: empId,
            month: Number(month),
            year: Number(year),
          }),
        },
      );

      const json = await res.json().catch(() => ({}));

      if (res.ok) {
        toast.success(json?.message || "Attendance submitted.");
        setShowConfirm(false);

        const controller = new AbortController();
        await fetchAttendance(controller.signal);
      } else {
        toast.error(json?.message || "Failed to submit attendance.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  return (
    <div className="mx-5 mt-5 font-montserrat">
      <div className="flex items-center justify-between mb-5">
        <p className="text-[24px]">
          Attendance CheckIn / Out Report for · {empId} · {year}-
          {String(month).padStart(2, "0")}
        </p>
      </div>

      <div className="shadow-lg p-5 rounded-lg bg-white">
        <div className="flex justify-between items-center mb-3">
          <button
            className={`px-4 py-2 rounded text-white ${
              canSubmitAttendance
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-300 cursor-not-allowed"
            }`}
            disabled={!canSubmitAttendance}
            onClick={() => setShowConfirm(true)}
            title={
              canSubmitAttendance
                ? "Submit Attendance"
                : "All days must be complete to submit"
            }
          >
            Submit Attendance
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-900">Date</th>
                <th className="px-6 py-3 font-medium text-gray-900">
                  Check-in
                </th>
                <th className="px-6 py-3 font-medium text-gray-900">IN Type</th>
                <th className="px-6 py-3 font-medium text-gray-900">
                  Check-out
                </th>
                <th className="px-6 py-3 font-medium text-gray-900">
                  OUT Type
                </th>
                <th className="px-6 py-3 font-medium text-gray-900">Status</th>
                <th className="px-6 py-3 font-medium text-gray-900">Leave</th>
                <th className="px-6 py-3 font-medium text-gray-900">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    Loading...
                  </td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-4 text-center text-red-600"
                  >
                    {fetchError}
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((r, idx) => {
                  const id = rowKey(idx);

                  return (
                    <tr key={id} className="hover:bg-gray-50">
                      <td className="px-6 py-2">{r["Date"]}</td>
                      <td className="px-6 py-2">{fmt(r["Checkin-time"])}</td>
                      <td className="px-6 py-2">{r["Checkin-type"] || "—"}</td>
                      <td className="px-6 py-2">{fmt(r["Checkout-time"])}</td>
                      <td className="px-6 py-2">{r["Checkout-type"] || "—"}</td>
                      <td className="px-6 py-2">{statusBadge(r["Status"])}</td>
                      <td className="px-6 py-2">{leaveBadge(r["Leaves"])}</td>
                      <td className="px-6 py-2">
                        {(() => {
                          const isCompleteYes =
                            String(r?.complete ?? "").toLowerCase() === "yes";

                          const hasApprovedLeave = Array.isArray(r.Leaves)
                            ? r.Leaves.some(
                                (l) =>
                                  String(l.status || "").toUpperCase() ===
                                  "APPROVED",
                              )
                            : false;

                          const isEditedStatus =
                            String(r?.Status ?? "").toLowerCase() === "edited";

                          const isDisabled =
                            isCompleteYes || hasApprovedLeave || isEditedStatus;

                          return (
                            <button
                              type="button"
                              onClick={() =>
                                !isDisabled && handleActionClick(r)
                              }
                              className={`p-2 rounded ${
                                isDisabled
                                  ? "text-gray-300 cursor-not-allowed"
                                  : "hover:bg-gray-100 text-gray-600"
                              }`}
                              aria-disabled={isDisabled}
                              title={
                                hasApprovedLeave
                                  ? "Leave already approved"
                                  : isCompleteYes
                                    ? "No access"
                                    : isEditedStatus
                                      ? "Already edited"
                                      : "Adjust"
                              }
                            >
                              <BsWrenchAdjustable />
                            </button>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    No data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <div>
            Page {Math.min(page, totalPages)} of {totalPages} ({count} records)
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

      {showAction && actionRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl borderoverflow-hidden">
            <div className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all font-semibold">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Assign Leave
                </h2>
                <p className="text-sm text-white-500">
                  Review the selected day and choose how this leave should be
                  applied.
                </p>
              </div>

              <button
                onClick={closeAction}
                className="h-10 w-10 rounded-full text-gray-500 hover:bg-white hover:text-gray-700 transition"
                disabled={isPosting}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="h-12 w-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {initials(employeeMeta?.name || empId)}
                </div>

                <div className="min-w-0">
                  <div className="text-sm text-gray-500">Employee</div>
                  <div className="font-medium text-gray-900 truncate">
                    {employeeMeta?.name || empId}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {employeeMeta?.email || empId}
                  </div>
                </div>

                <div className="ml-auto text-right">
                  <div className="text-sm text-gray-500">Selected Day</div>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                    {actionRow["Date"]}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leave Duration
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: "short_leave", label: "Short Leave" },
                    { value: "full day", label: "Full Day" },
                    { value: "half day", label: "Half Day" },
                  ].map((opt) => {
                    const active = formType === opt.value;

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormType(opt.value)}
                        disabled={isPosting}
                        className={`rounded-xl border px-4 py-3 text-left transition ${
                          active
                            ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="font-medium text-gray-900">
                          {opt.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {opt.value === "short_leave"
                            ? "Deducts from short leave count"
                            : opt.value === "full day"
                              ? "Applies a full day leave"
                              : "Applies a half day leave"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Deduct From
                  </label>

                  {formType === "short_leave" && (
                    <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                      Short leave uses short leave balance
                    </span>
                  )}
                </div>

                {leaveCountsLoading ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                    Loading leave balances...
                  </div>
                ) : leaveCountsError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {leaveCountsError}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedLeaveCat(null)}
                      disabled={isPosting || formType === "short_leave"}
                      className={`rounded-xl border p-4 text-left transition ${
                        selectedLeaveCat === null
                          ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      } ${
                        formType === "short_leave"
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-900">No Pay</div>
                        <span className="text-xs rounded-full px-2 py-1 bg-red-50 text-red-700 border border-red-200">
                          Unpaid
                        </span>
                      </div>

                      <div className="text-sm text-gray-500 mt-1">
                        Creates a no-pay leave entry for this day.
                      </div>

                      {leaveCounts.noPay && (
                        <div className="mt-3 text-xs text-gray-600">
                          Existing no-pay:{" "}
                          <span className="font-semibold">
                            {leaveCounts.noPay.days} day(s)
                          </span>
                        </div>
                      )}
                    </button>

                    <div className="space-y-3">
                      {leaveCounts.categories.length > 0 ? (
                        leaveCounts.categories.map((c) => {
                          const isSel =
                            selectedLeaveCat?.id ===
                            Number(c.leave_category_id);

                          return (
                            <button
                              key={c.leave_category_id}
                              type="button"
                              onClick={() =>
                                setSelectedLeaveCat({
                                  id: Number(c.leave_category_id),
                                  name: c.category_name,
                                })
                              }
                              disabled={isPosting || formType === "short_leave"}
                              className={`w-full rounded-xl border p-4 text-left transition ${
                                isSel
                                  ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                              } ${
                                formType === "short_leave"
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                              title={`${c.category_name}: ${c.leave_count}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="font-medium text-gray-900">
                                  {c.category_name}
                                </div>
                                <span className="text-xs rounded-full px-2 py-1 bg-gray-100 text-gray-700 border border-gray-200">
                                  {c.leave_count} left
                                </span>
                              </div>

                              <div className="text-sm text-gray-500 mt-1">
                                Deduct this leave from employee balance.
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                          No leave categories available.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee No
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 bg-gray-50 text-gray-700"
                    value={empId}
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 bg-gray-50 text-gray-700"
                    value={reasonText}
                    readOnly
                  />
                </div>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                    i
                  </div>

                  <div>
                    <div className="font-medium text-blue-900">Summary</div>
                    <div className="text-sm text-blue-800 mt-1">
                      {summaryText}
                    </div>
                    <div className="mt-2 text-xs text-blue-700">
                      Type:{" "}
                      <span className="font-semibold">
                        {normalizedTypeLabel}
                      </span>
                      {formType !== "short_leave" && (
                        <>
                          {" · "}Mode:{" "}
                          <span className="font-semibold">
                            {deductionType === "no_pay"
                              ? "No Pay"
                              : "Leave Balance"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {postBanner.text && (
                <div
                  className={`rounded-xl px-4 py-3 text-sm ${
                    postBanner.type === "success"
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : "bg-red-100 text-red-700 border border-red-200"
                  }`}
                >
                  {postBanner.text}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={closeAction}
                  disabled={isPosting}
                >
                  Cancel
                </button>
                <button
                  className={`px-5 py-2 rounded-xl text-white font-medium shadow-sm ${
                    isPosting
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                  onClick={submitLeave}
                  disabled={isPosting}
                >
                  {isPosting ? "Saving..." : "Save Leave"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {noAccessOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-5 shadow-xl w-full max-w-sm">
            <h4 className="text-lg font-semibold text-center text-gray-800">
              Action Locked
            </h4>
            <p className="text-center text-gray-700 mt-2">
              You don’t have access to perform this.
            </p>
            <div className="mt-4 flex justify-center">
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => setNoAccessOpen(false)}
              >
                OK
              </button> 
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-5 shadow-xl w-full max-w-md">
            <h3 className="text-xl font-semibold text-center mb-2">
              Submit Attendance?
            </h3>
            <p className="text-center text-gray-600">
              {empId} · {year}-{String(month).padStart(2, "0")}
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
                onClick={() => setShowConfirm(false)}
              >
                No
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={submitAttendance}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
};

export default ViewAttendanceInOut;
