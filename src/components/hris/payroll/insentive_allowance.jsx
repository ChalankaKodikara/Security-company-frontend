/** @format */
import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Users, PlayCircle } from "lucide-react";
import Cookies from "js-cookie";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSearchParams } from "react-router-dom";
import { apiFetch } from "../../../utils/apiClient";
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
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return palette[hash % palette.length];
};

const getInitials = (name = "") => {
  const t = String(name).trim().split(" ");
  if (t.length === 1) return t[0].slice(0, 2).toUpperCase();
  return (t[0][0] + t[t.length - 1][0]).toUpperCase();
};

/* ================= COMPONENT ================= */
const IncentiveAllowance = () => {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const token = Cookies.get("accessToken");

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  /* ================= STATE ================= */
  const [organizations, setOrganizations] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [organizationId, setOrganizationId] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [employeeNo, setEmployeeNo] = useState("");
  const [status, setStatus] = useState("");
  const [targetStatus, setTargetStatus] = useState("APPROVED");
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [runMonth, setRunMonth] = useState("");
  const [runYear, setRunYear] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [running, setRunning] = useState(false);
  const [searchParams] = useSearchParams();

  const [incentiveSource, setIncentiveSource] = useState("SERVICE_CHARGE"); // pagination
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalRecords, setTotalRecords] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));

  useEffect(() => {
    const orgIdFromUrl = searchParams.get("org_id");
    const yearFromUrl = searchParams.get("year");
    const monthFromUrl = searchParams.get("month");

    //  Organization should be set (required context)
    if (orgIdFromUrl) {
      setOrganizationId(orgIdFromUrl);
    }

    //  Use URL values ONLY for Run Incentive modal
    if (yearFromUrl) {
      setRunYear(yearFromUrl);
    }

    if (monthFromUrl) {
      const monthNames = [
        "JANUARY",
        "FEBRUARY",
        "MARCH",
        "APRIL",
        "MAY",
        "JUNE",
        "JULY",
        "AUGUST",
        "SEPTEMBER",
        "OCTOBER",
        "NOVEMBER",
        "DECEMBER",
      ];

      const mIndex = Number(monthFromUrl) - 1;
      if (mIndex >= 0 && mIndex < 12) {
        setRunMonth(monthNames[mIndex]);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!token) return;

    const loadOrgs = async () => {
      const res = await apiFetch(
        `${API_URL}/v1/hris/organizations/organization`,
      );
      const json = await res.json();
      if (json.success) setOrganizations(json.data);
    };

    loadOrgs();
  }, [API_URL, headers, token]);

  /* ================= LOAD INCENTIVE PAYROLL ================= */
  const loadData = async () => {
    if (!organizationId || !token) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        organization_id: organizationId,
        payroll_month: month,
        payroll_year: year,
        employee_no: employeeNo,
        payroll_status: status,
        page,
        limit,
      });

      const res = await apiFetch(
        `${API_URL}/v1/hris/payroll/incentive?${params.toString()}`,
      );

      const json = await res.json();

      if (json.success) {
        setData(json.data || []);
        setTotalRecords(json.count || 0);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Failed to load incentive payroll", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Clear selections when filters change
    setSelectedIds([]);
  }, [
    API_URL,
    headers,
    token,
    organizationId,
    month,
    year,
    employeeNo,
    status,
    page,
  ]);

  useEffect(() => {
    if (!runYear || !runMonth) return;

    const monthIndex = new Date(`${runMonth} 1, ${runYear}`).getMonth();
    const start = new Date(runYear, monthIndex, 1);
    const end = new Date(runYear, monthIndex + 1, 0);

    const format = (d) => d.toISOString().split("T")[0];

    setPeriodStart(format(start));
    setPeriodEnd(format(end));
  }, [runMonth, runYear]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(data.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;
  const isSomeSelected =
    selectedIds.length > 0 && selectedIds.length < data.length;

  /* ================= SUBMIT STATUS CHANGE ================= */
  const handleRunStatusChange = async () => {
    if (selectedIds.length === 0) {
      toast.warning("Please select at least one record");
      return;
    }

    if (!organizationId) {
      toast.error("Organization is required");
      return;
    }

    if (!targetStatus) {
      toast.error("Please select a target status");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch(
        `${API_URL}/v1/hris/payroll/status-change-incentive`,
        {
          method: "PUT",
          body: JSON.stringify({
            organization_id: parseInt(organizationId),
            ids: selectedIds,
            payroll_status: targetStatus,
          }),
        },
      );

      const json = await res.json();

      if (res.ok) {
        toast.success(json.message || "Status updated successfully!");
        setSelectedIds([]);
        // Refresh data
        loadData();
      } else {
        toast.error(json.message || "Failed to update status");
      }
    } catch (err) {
      console.error("Status change error:", err);
      toast.error("An error occurred while updating status");
    } finally {
      setSubmitting(false);
    }
  };
  const handleRunIncentive = async () => {
    if (
      !organizationId ||
      !runMonth ||
      !runYear ||
      !periodStart ||
      !periodEnd
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    setRunning(true);
    try {
      const res = await apiFetch(
        `${API_URL}/v1/hris/payroll/incentive/process`,
        {
          method: "POST",
          body: JSON.stringify({
            organization_id: Number(organizationId),
            month: runMonth,
            year: String(runYear),
            period_start: periodStart,
            period_end: periodEnd,
            incentive_source: incentiveSource,
          }),
        },
      );

      const json = await res.json();

      if (res.ok && json.success) {
        toast.success(json.message || "Incentive processed successfully");
        setRunModalOpen(false);
        loadData(); // refresh table
      } else {
        toast.warning(json.message || "No data found for the selected period");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error while running incentive");
    } finally {
      setRunning(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <h1 className="text-3xl font-bold mb-6">Incentive Payroll</h1>
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setRunModalOpen(true)}
          disabled={!organizationId}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold
               hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Run Incentive
        </button>
      </div>

      {/* ================= FILTERS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <select
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={organizationId}
          onChange={(e) => {
            setOrganizationId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Organization</option>
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.organization_name}
            </option>
          ))}
        </select>

        <input
          placeholder="Month (MM)"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          placeholder="Year (YYYY)"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          placeholder="Employee No"
          value={employeeNo}
          onChange={(e) => setEmployeeNo(e.target.value)}
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="DRAFT">DRAFT</option>
          <option value="APPROVED">APPROVED</option>
          <option value="PAID">PAID</option>
        </select>
      </div>

      {/* ================= ACTION BAR ================= */}
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedIds.length} record{selectedIds.length > 1 ? "s" : ""}{" "}
              selected
            </span>
          </div>
          <button
            onClick={handleRunStatusChange}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlayCircle className="w-4 h-4" />
            {submitting ? "Processing..." : "Run Status Change"}
          </button>
        </motion.div>
      )}

      {/* ================= TABLE ================= */}
      <motion.div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = isSomeSelected;
                      }
                    }}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </th>
                {[
                  "Employee",
                  "Month",
                  "Verified Hours",
                  "Final Incentive",
                  "Status",
                  "Generated By",
                  "Generated At",
                ].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"
                    />
                  </td>
                </tr>
              ) : data.length ? (
                data.map((row) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`hover:bg-gray-50 transition-colors ${
                      selectedIds.includes(row.id) ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => handleSelectOne(row.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="relative"
                        >
                          <div className="absolute inset-0 rounded-full ring-2 ring-blue-500 ring-offset-2" />
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg bg-gradient-to-br ${avatarBgClass(
                              row.employee_fullname || row.employee_no,
                            )}`}
                          >
                            {getInitials(
                              row.employee_fullname || row.employee_no,
                            )}
                          </div>
                        </motion.div>

                        <div>
                          <div className="font-semibold text-gray-800">
                            {row.employee_fullname}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {row.employee_no}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-3">
                      {row.payroll_month}/{row.payroll_year}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {row.total_verified_hours}
                    </td>
                    <td className="px-6 py-3 font-bold text-green-600">
                      {parseFloat(row.final_incentive).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          row.payroll_status === "DRAFT"
                            ? "bg-gray-100 text-gray-700"
                            : row.payroll_status === "APPROVED"
                              ? "bg-blue-100 text-blue-700"
                              : row.payroll_status === "PAID"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {row.payroll_status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {row.generated_by || "N/A"}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {row.generated_at
                        ? new Date(row.generated_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )
                        : "N/A"}
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-10 text-center">
                    <Users className="mx-auto text-gray-400" size={40} />
                    <p className="text-gray-600 mt-2">
                      {organizationId
                        ? "No records found"
                        : "Please select an organization"}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ================= PAGINATION ================= */}
        {!loading && totalRecords > 0 && (
          <div className="p-4 bg-gray-50 flex justify-between items-center">
            <span className="text-sm text-gray-700">
              Showing {(page - 1) * limit + 1} –{" "}
              {Math.min(page * limit, totalRecords)} of {totalRecords}
            </span>

            <div className="flex gap-3">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 border rounded-xl bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="inline w-4 h-4" />
              </button>

              <span className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium">
                {page}/{totalPages}
              </span>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 border rounded-xl bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="inline w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {runModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">
              Run Incentive Payroll
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Month */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Month
                </label>
                <select
                  value={runMonth}
                  onChange={(e) => setRunMonth(e.target.value)}
                  className="w-full border rounded-lg p-2"
                >
                  <option value="">Select Month</option>
                  {[
                    "JANUARY",
                    "FEBRUARY",
                    "MARCH",
                    "APRIL",
                    "MAY",
                    "JUNE",
                    "JULY",
                    "AUGUST",
                    "SEPTEMBER",
                    "OCTOBER",
                    "NOVEMBER",
                    "DECEMBER",
                  ].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Year</label>
                <input
                  type="number"
                  value={runYear}
                  onChange={(e) => setRunYear(e.target.value)}
                  placeholder="2026"
                  className="w-full border rounded-lg p-2"
                />
              </div>

              {/* Period Start */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Period Start
                </label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              {/* Period End */}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Period End
                </label>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full border rounded-lg p-2"
                />
              </div>
            </div>
            {/* Incentive Source */}
            <div className="sm:col-span-2">
              <label className="text-sm text-gray-600 mb-1 block">
                Incentive Source
              </label>
              <select
                value={incentiveSource}
                onChange={(e) => setIncentiveSource(e.target.value)}
                className="w-full border rounded-lg p-2"
              >
                <option value="SERVICE_CHARGE">SERVICE CHARGE</option>
                <option value="OVERTIME">OVERTIME</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setRunModalOpen(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleRunIncentive}
                disabled={running}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg
                     hover:bg-blue-700 disabled:opacity-50"
              >
                {running ? "Processing..." : "Run Incentive"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncentiveAllowance;
