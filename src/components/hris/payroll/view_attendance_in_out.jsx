/** @format */

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BsWrenchAdjustable } from "react-icons/bs";
import { ToastContainer, toast } from "react-toastify";
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  ShieldCheck,
  User,
  RefreshCw,
} from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";

const API_URL = process.env.REACT_APP_FRONTEND_URL || "http://localhost:5000";

const ViewAttendanceInOut = () => {
  const [searchParams] = useSearchParams();

  const empId = searchParams.get("employeeId") || "";
  const year = searchParams.get("year") || "";
  const month = searchParams.get("month") || "";

  const token = Cookies.get("user_token");

  const [rows, setRows] = useState([]);
  const [employeeMeta, setEmployeeMeta] = useState(null);
  const [cycle, setCycle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const mode = searchParams.get("mode") || "edit";
  const isViewMode = mode === "view";
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(32);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);

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

  const initials = (s = "") =>
    s
      .trim()
      .split(/\s+/)
      .map((w) => w[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "NA";

  const isSecurity = employeeMeta?.payroll_group === "SECURITY";

  const rowKey = (row, idx) =>
    `${row?.Date || "date"}-${row?.checkpoint_shift_attendance?.id || idx}`;

  const summary = useMemo(() => {
    const totalDays = rows.length;
    const completedDays = rows.filter(
      (r) => String(r.complete || "").toLowerCase() === "yes",
    ).length;

    const dayShifts = rows.reduce(
      (sum, r) => sum + Number(r.day_shift || 0),
      0,
    );
    const nightShifts = rows.reduce(
      (sum, r) => sum + Number(r.night_shift || 0),
      0,
    );
    const overtime = rows.reduce(
      (sum, r) => sum + Number(r.overtime_hours || 0),
      0,
    );
    const completedShift = rows.reduce(
      (sum, r) => sum + Number(r.completed_shift || 0),
      0,
    );
    const overtimeShift = rows.reduce(
      (sum, r) => sum + Number(r.overtime_shift || 0),
      0,
    );
    const payableShift = rows.reduce(
      (sum, r) => sum + Number(r.payable_shift || 0),
      0,
    );

    return {
      totalDays,
      completedDays,
      incompleteDays: totalDays - completedDays,
      dayShifts,
      nightShifts,
      overtime,
      completedShift,
      overtimeShift,
      payableShift,
    };
  }, [rows]);
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
      setCycle(json?.cycle || "");

      const data = Array.isArray(json?.data) ? json.data : [];
      setRows(data);

      const pag = json?.pagination || {};
      setCount(Number(pag.total || data.length));
      setTotalPages(Number(pag.totalPages || 1));

      if (pag.page && Number(pag.page) !== page) setPage(Number(pag.page));
      if (pag.limit && Number(pag.limit) !== limit) setLimit(Number(pag.limit));
    } catch (error) {
      if (error.name !== "AbortError") {
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

      setLeaveCounts({
        categories: json?.data?.categories ?? [],
        noPay: json?.data?.no_pay ?? null,
      });
    } catch (error) {
      if (error.name !== "AbortError") {
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
  }, [empId, year, month, page, limit]);

  useEffect(() => {
    if (!showAction) return;

    const controller = new AbortController();
    fetchLeaveCounts(controller.signal);

    return () => controller.abort();
  }, [showAction, empId, year]);

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

  const statusBadge = (status) => {
    if (!status) {
      return (
        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
          —
        </span>
      );
    }

    const text = String(status);
    const normalized = text.toLowerCase();

    let cls = "bg-slate-100 text-slate-700";

    if (normalized.includes("normal")) cls = "bg-green-100 text-green-700";
    if (normalized.includes("leave")) cls = "bg-red-100 text-red-700";
    if (normalized.includes("short")) cls = "bg-yellow-100 text-yellow-700";
    if (normalized.includes("half")) cls = "bg-orange-100 text-orange-700";
    if (normalized.includes("no pay")) cls = "bg-red-100 text-red-700";

    return (
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${cls}`}
      >
        {text}
      </span>
    );
  };

  const completeBadge = (complete) => {
    const yes = String(complete || "").toLowerCase() === "yes";

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
          yes ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}
      >
        {yes ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
        {yes ? "Complete" : "Incomplete"}
      </span>
    );
  };

  const leaveBadge = (leaves) => {
    if (!Array.isArray(leaves) || leaves.length === 0) return "—";

    const leave = leaves[0];
    const category = leave.category || "—";
    const status = String(leave.status || "").toUpperCase();

    let cls = "bg-slate-100 text-slate-700";

    if (status === "APPROVED") cls = "bg-green-100 text-green-700";
    if (status === "REJECTED") cls = "bg-red-100 text-red-700";
    if (status === "PENDING") cls = "bg-yellow-100 text-yellow-700";

    return (
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${cls}`}
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
    } catch (error) {
      const msg = error?.message || "Failed to save.";
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

      if (!res.ok) {
        toast.error(json?.message || "Failed to submit attendance.");
        return;
      }

      toast.success(json?.message || "Attendance submitted.");
      setShowConfirm(false);
      await fetchAttendance();
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-montserrat">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-slate-500">
            Attendance / Check In-Out Review
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Attendance Report
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Employee {empId} · {year}-{String(month).padStart(2, "0")} · {cycle}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => fetchAttendance()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          {!isViewMode && (
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-all duration-200"
              onClick={() => setShowConfirm(true)}
            >
              <CheckCircle2 size={16} />
              Submit Attendance
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
              <User size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Employee</p>
              <p className="font-semibold text-slate-900">
                {employeeMeta?.name || empId}
              </p>
              <p className="text-xs text-slate-500">
                {employeeMeta?.payroll_group || "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-100 p-3 text-green-700">
              <CalendarDays size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Completed Days</p>
              <p className="text-xl font-bold text-slate-900">
                {summary.completedDays}/{summary.totalDays}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Day Shifts</p>
              <p className="text-xl font-bold text-slate-900">
                {summary.dayShifts}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Night Shifts</p>
              <p className="text-xl font-bold text-slate-900">
                {summary.nightShifts}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-100 p-3 text-purple-700">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Overtime Hours</p>
              <p className="text-xl font-bold text-slate-900">
                {summary.overtime}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Payable Shifts</p>
              <p className="text-xl font-bold text-slate-900">
                {summary.payableShift?.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Attendance Details
          </h2>
          <p className="text-sm text-slate-500">
            Showing all response data from attendance API.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1350px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Complete</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Check In</th>
                <th className="px-4 py-3">In Type</th>
                <th className="px-4 py-3">Check Out</th>
                <th className="px-4 py-3">Out Type</th>
                <th className="px-4 py-3">Leave</th>

                {isSecurity && (
                  <>
                    <th className="px-4 py-3">Day Shift</th>
                    <th className="px-4 py-3">Night Shift</th>
                    <th className="px-4 py-3">OT Hours</th>
                  </>
                )}

                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={isSecurity ? 12 : 9}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Loading attendance...
                  </td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td
                    colSpan={isSecurity ? 12 : 9}
                    className="px-4 py-10 text-center text-red-600"
                  >
                    {fetchError}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={isSecurity ? 12 : 9}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No attendance data found.
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => {
                  const isCompleteYes =
                    String(r?.complete ?? "").toLowerCase() === "yes";

                  const hasApprovedLeave = Array.isArray(r.Leaves)
                    ? r.Leaves.some(
                        (l) =>
                          String(l.status || "").toUpperCase() === "APPROVED",
                      )
                    : false;

                  const isEditedStatus =
                    String(r?.Status ?? "").toLowerCase() === "edited";

                  const isDisabled =
                    isCompleteYes || hasApprovedLeave || isEditedStatus;

                  return (
                    <tr key={rowKey(r, idx)} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {r.Date}
                      </td>
                      <td className="px-4 py-3">{completeBadge(r.complete)}</td>
                      <td className="px-4 py-3">{statusBadge(r.Status)}</td>
                      <td className="px-4 py-3">{fmt(r["Checkin-time"])}</td>
                      <td className="px-4 py-3">{r["Checkin-type"] || "—"}</td>
                      <td className="px-4 py-3">{fmt(r["Checkout-time"])}</td>
                      <td className="px-4 py-3">{r["Checkout-type"] || "—"}</td>
                      <td className="px-4 py-3">{leaveBadge(r.Leaves)}</td>

                      {isSecurity && (
                        <>
                          <td className="px-4 py-3">{r.day_shift ?? 0}</td>
                          <td className="px-4 py-3">{r.night_shift ?? 0}</td>
                          <td className="px-4 py-3">{r.overtime_hours ?? 0}</td>
                        </>
                      )}

                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => !isDisabled && handleActionClick(r)}
                          className={`rounded-lg p-2 ${
                            isDisabled
                              ? "cursor-not-allowed text-slate-300"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <BsWrenchAdjustable />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t px-5 py-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <div>
            Page {Math.min(page, totalPages)} of {totalPages} · {count} records
          </div>

          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => {
                setPage(1);
                setLimit(Number(e.target.value));
              }}
              className="rounded-lg border px-3 py-2"
            >
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
              <option value={32}>32 rows</option>
              <option value={50}>50 rows</option>
            </select>

            <button
              className="rounded-lg border px-4 py-2 disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
            >
              Previous
            </button>

            <button
              className="rounded-lg border px-4 py-2 disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {showAction && actionRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
              <div>
                <h2 className="text-xl font-semibold">Assign Leave</h2>
                <p className="text-sm text-blue-100">
                  Review the selected day and choose how this leave should be
                  applied.
                </p>
              </div>

              <button
                onClick={closeAction}
                className="rounded-full px-3 py-1 text-2xl hover:bg-white/20"
                disabled={isPosting}
              >
                ×
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="flex items-center gap-4 rounded-xl border bg-slate-50 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {initials(employeeMeta?.name || empId)}
                </div>

                <div>
                  <div className="text-sm text-slate-500">Employee</div>
                  <div className="font-medium text-slate-900">
                    {employeeMeta?.name || empId}
                  </div>
                  <div className="text-sm text-slate-500">
                    {employeeMeta?.email || empId}
                  </div>
                </div>

                <div className="ml-auto text-right">
                  <div className="text-sm text-slate-500">Selected Day</div>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                    {actionRow.Date}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Leave Duration
                </label>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="font-medium text-slate-900">
                          {opt.label}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {opt.value === "short_leave"
                            ? "Deducts short leave count"
                            : opt.value === "full day"
                              ? "Applies full day leave"
                              : "Applies half day leave"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Deduct From
                </label>

                {leaveCountsLoading ? (
                  <div className="rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    Loading leave balances...
                  </div>
                ) : leaveCountsError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {leaveCountsError}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setSelectedLeaveCat(null)}
                      disabled={isPosting || formType === "short_leave"}
                      className={`rounded-xl border p-4 text-left transition ${
                        selectedLeaveCat === null
                          ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      } ${
                        formType === "short_leave"
                          ? "cursor-not-allowed opacity-50"
                          : ""
                      }`}
                    >
                      <div className="font-medium text-slate-900">No Pay</div>
                      <div className="mt-1 text-sm text-slate-500">
                        Creates unpaid leave entry.
                      </div>
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
                                  : "border-slate-200 bg-white hover:bg-slate-50"
                              } ${
                                formType === "short_leave"
                                  ? "cursor-not-allowed opacity-50"
                                  : ""
                              }`}
                            >
                              <div className="flex justify-between">
                                <div className="font-medium text-slate-900">
                                  {c.category_name}
                                </div>
                                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                                  {c.leave_count} left
                                </span>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-500">
                          No leave categories available.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                <strong>Summary:</strong> {summaryText}
                <div className="mt-1">
                  Type: <strong>{normalizedTypeLabel}</strong>
                  {formType !== "short_leave" && (
                    <>
                      {" · "}Mode:{" "}
                      <strong>
                        {deductionType === "no_pay"
                          ? "No Pay"
                          : "Leave Balance"}
                      </strong>
                    </>
                  )}
                </div>
              </div>

              {postBanner.text && (
                <div
                  className={`rounded-xl px-4 py-3 text-sm ${
                    postBanner.type === "success"
                      ? "border border-green-200 bg-green-100 text-green-800"
                      : "border border-red-200 bg-red-100 text-red-700"
                  }`}
                >
                  {postBanner.text}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  className="rounded-xl border px-4 py-2 text-slate-700 hover:bg-slate-50"
                  onClick={closeAction}
                  disabled={isPosting}
                >
                  Cancel
                </button>

                <button
                  className={`rounded-xl px-5 py-2 font-medium text-white ${
                    isPosting ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
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
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <h4 className="text-center text-lg font-semibold text-slate-800">
              Action Locked
            </h4>
            <p className="mt-2 text-center text-slate-600">
              You don’t have access to perform this.
            </p>
            <div className="mt-4 flex justify-center">
              <button
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
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
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="mb-2 text-center text-xl font-semibold">
              Submit Attendance?
            </h3>
            <p className="text-center text-slate-600">
              {empId} · {year}-{String(month).padStart(2, "0")}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded border px-4 py-2 hover:bg-slate-50"
                onClick={() => setShowConfirm(false)}
              >
                No
              </button>
              <button
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                onClick={submitAttendance}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </div>
  );
};

export default ViewAttendanceInOut;
