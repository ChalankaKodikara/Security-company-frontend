/** @format */

import React, { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  WalletCards,
  XCircle,
} from "lucide-react";

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const getCookie = (name) => {
  const cookieValue = `; ${document.cookie}`;
  const parts = cookieValue.split(`; ${name}=`);

  if (parts.length === 2) {
    return decodeURIComponent(parts.pop().split(";").shift());
  }

  return null;
};

const getCurrentMonth = () => String(new Date().getMonth() + 1);
const getCurrentYear = () => String(new Date().getFullYear());

const formatNumber = (value, maximumFractionDigits = 2) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getErrorMessage = async (response) => {
  try {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const result = await response.json();
      return result.message || "Request failed";
    }

    const text = await response.text();
    return text || "Request failed";
  } catch {
    return "Request failed";
  }
};

const getDownloadFileName = (response, fallbackName) => {
  const contentDisposition = response.headers.get("content-disposition");

  if (!contentDisposition) {
    return fallbackName;
  }

  const utfFileName = contentDisposition.match(/filename\*=UTF-8''([^;\n]+)/i);

  if (utfFileName?.[1]) {
    return decodeURIComponent(utfFileName[1].replace(/["']/g, ""));
  }

  const normalFileName = contentDisposition.match(
    /filename\s*=\s*["']?([^;"'\n]+)["']?/i,
  );

  return normalFileName?.[1]?.trim() || fallbackName;
};

const SummaryCard = ({ title, value, subtitle, icon: Icon, iconClassName }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{title}</p>

        <p className="mt-2 truncate text-2xl font-bold text-slate-900">
          {value}
        </p>

        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
      >
        <Icon size={21} />
      </div>
    </div>
  </div>
);

const EmptyState = ({ title, description }) => (
  <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
      <FileText size={30} />
    </div>

    <h3 className="mt-5 text-lg font-semibold text-slate-800">{title}</h3>

    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
      {description}
    </p>
  </div>
);

const CheckpointInvoiceSummary = () => {
  /*
   * Change this environment variable if your project uses a different name.
   *
   * CRA example:
   * REACT_APP_API_URL=https://your-backend-domain.com
   */
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  const [filters, setFilters] = useState({
    client_id: "",
    attendance_month: getCurrentMonth(),
    attendance_year: getCurrentYear(),
    sscl_rate: "2.5",
    vat_rate: "18",
    overtime_shift_hours: "12",
  });

  const [clients, setClients] = useState([]);
  const [isClientsLoading, setIsClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState("");

  const [summaryData, setSummaryData] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [searchText, setSearchText] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [downloadingType, setDownloadingType] = useState("");
  const [error, setError] = useState("");

  const token = getCookie("user_token");

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsClientsLoading(true);
        setClientsError("");

        const response = await fetch(`${API_URL}/v1/hris/client/clients`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(await getErrorMessage(response));
        }

        const result = await response.json();

        if (!result.success || !Array.isArray(result.data)) {
          throw new Error(result.message || "Failed to retrieve clients.");
        }

        setClients(result.data);
      } catch (requestError) {
        console.error("Fetch clients error:", requestError);

        setClients([]);
        setClientsError(
          requestError.message || "An error occurred while loading clients.",
        );
      } finally {
        setIsClientsLoading(false);
      }
    };

    fetchClients();
  }, [API_URL, token]);

  const selectedClient = useMemo(
    () =>
      clients.find((client) => String(client.id) === String(filters.client_id)),
    [clients, filters.client_id],
  );

  const buildQueryString = () => {
    const params = new URLSearchParams();

    params.set("client_id", filters.client_id);
    params.set("attendance_month", filters.attendance_month);
    params.set("attendance_year", filters.attendance_year);
    params.set("sscl_rate", filters.sscl_rate || "2.5");
    params.set("vat_rate", filters.vat_rate || "18");
    params.set("overtime_shift_hours", filters.overtime_shift_hours || "12");

    return params.toString();
  };

  const requestHeaders = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const validateFilters = () => {
    if (!filters.client_id) {
      setError("Please select a client.");
      return false;
    }

    if (!filters.attendance_month) {
      setError("Please select an attendance month.");
      return false;
    }

    if (!filters.attendance_year) {
      setError("Please enter an attendance year.");
      return false;
    }

    if (Number(filters.attendance_year) < 2000) {
      setError("Please enter a valid attendance year.");
      return false;
    }

    if (Number(filters.overtime_shift_hours) <= 0) {
      setError("Overtime shift hours must be greater than zero.");
      return false;
    }

    return true;
  };

  const fetchSummary = async () => {
    if (!validateFilters()) {
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSummaryData(null);
      setSearchText("");

      const queryString = buildQueryString();

      const response = await fetch(
        `${API_URL}/v1/hris/checkpoint-summary/checkpoint-invoice-summary?${queryString}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...requestHeaders,
          },
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message || "Failed to retrieve invoice summary.",
        );
      }

      setSummaryData(result.data);
      setActiveTab("summary");
    } catch (requestError) {
      console.error("Checkpoint invoice summary error:", requestError);

      setError(
        requestError.message ||
          "An error occurred while retrieving the invoice summary.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = async (type) => {
    if (!validateFilters()) {
      return;
    }

    const isExcel = type === "excel";

    const endpoint = isExcel
      ? "/v1/hris/checkpoint-summary/checkpoint-invoice-summary/export-excel"
      : "/v1/hris/checkpoint-summary/checkpoint-invoice-summary/export-pdf";

    const monthLabel =
      MONTHS.find((month) => month.value === filters.attendance_month)?.label ||
      "month";

    const fallbackFileName = isExcel
      ? `checkpoint-invoice-summary-${monthLabel}-${filters.attendance_year}.xlsx`
      : `checkpoint-invoice-summary-${monthLabel}-${filters.attendance_year}.pdf`;

    try {
      setDownloadingType(type);
      setError("");

      const queryString = buildQueryString();

      const response = await fetch(`${API_URL}${endpoint}?${queryString}`, {
        method: "GET",
        headers: {
          Accept: isExcel
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "application/pdf",
          ...requestHeaders,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const blob = await response.blob();

      if (!blob || blob.size === 0) {
        throw new Error("The downloaded file is empty.");
      }

      const fileName = getDownloadFileName(response, fallbackFileName);
      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = downloadUrl;
      anchor.download = fileName;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (downloadError) {
      console.error(`${type} download error:`, downloadError);

      setError(
        downloadError.message ||
          `Failed to download the ${isExcel ? "Excel" : "PDF"} file.`,
      );
    } finally {
      setDownloadingType("");
    }
  };

  const handleReset = () => {
    setFilters({
      client_id: "",
      attendance_month: getCurrentMonth(),
      attendance_year: getCurrentYear(),
      sscl_rate: "2.5",
      vat_rate: "18",
      overtime_shift_hours: "12",
    });

    setSummaryData(null);
    setSearchText("");
    setError("");
    setActiveTab("summary");
    setShowAdvancedFilters(false);
  };

  const filteredSummaryRows = useMemo(() => {
    const rows = summaryData?.rows || [];
    const search = searchText.trim().toLowerCase();

    if (!search) {
      return rows;
    }

    return rows.filter((row) =>
      [
        row.invoice_number,
        row.checkpoint_name,
        row.location,
        row.employee_category,
        row.checkpoint_address,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search)),
    );
  }, [summaryData, searchText]);

  const filteredEmployees = useMemo(() => {
    const employees = summaryData?.employees || [];
    const search = searchText.trim().toLowerCase();

    if (!search) {
      return employees;
    }

    return employees.filter((employee) =>
      [
        employee.invoice_number,
        employee.checkpoint_name,
        employee.employee_no,
        employee.employee_name,
        employee.employee_category,
        employee.payroll_group,
        employee.payroll_scheme,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search)),
    );
  }, [summaryData, searchText]);

  const filteredDailyAttendance = useMemo(() => {
    const attendanceRows = summaryData?.daily_attendance || [];
    const search = searchText.trim().toLowerCase();

    if (!search) {
      return attendanceRows;
    }

    return attendanceRows.filter((attendance) =>
      [
        attendance.invoice_number,
        attendance.checkpoint_name,
        attendance.attendance_date,
        attendance.employee_no,
        attendance.employee_name,
        attendance.employee_category,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search)),
    );
  }, [summaryData, searchText]);

  const currentTableCount =
    activeTab === "summary"
      ? filteredSummaryRows.length
      : activeTab === "employees"
        ? filteredEmployees.length
        : filteredDailyAttendance.length;

  const summaryTotals = summaryData?.totals || {};
  const calculationSettings = summaryData?.calculation_settings || {};

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1800px]">
        {/* Page header */}
        <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 px-6 py-7 text-white shadow-xl sm:px-8">
          <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-emerald-300">
                <ShieldCheck size={18} />
                Security Invoice Management
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Checkpoint Invoice Summary
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                View checkpoint shifts, overtime conversions, tax calculations
                and invoice totals. Download the complete report in Excel or PDF
                format.
              </p>
            </div>

            {summaryData && (
              <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-300">
                  Selected Client
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {summaryData.client?.client_name || "Not available"}
                </p>

                <p className="mt-1 text-sm text-slate-300">
                  {summaryData.filters?.attendance_month}{" "}
                  {summaryData.filters?.attendance_year}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Filter section */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Report Filters
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Select the client and attendance period to generate the
                  report.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAdvancedFilters((previous) => !previous)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
              >
                Calculation settings
                {showAdvancedFilters ? (
                  <ChevronUp size={17} />
                ) : (
                  <ChevronDown size={17} />
                )}
              </button>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
              <div className="xl:col-span-2">
                <label
                  htmlFor="client_id"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Client <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <Building2
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    id="client_id"
                    name="client_id"
                    value={filters.client_id}
                    onChange={handleFilterChange}
                    disabled={isClientsLoading}
                    className="h-11 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-10 pr-10 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="">
                      {isClientsLoading
                        ? "Loading clients..."
                        : "Select a client"}
                    </option>

                    {clients.map((client) => (
                      <option key={client.id} value={String(client.id)}>
                        {client.name}
                      </option>
                    ))}
                  </select>

                  {isClientsLoading ? (
                    <Loader2
                      size={17}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-emerald-600"
                    />
                  ) : (
                    <ChevronDown
                      size={17}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  )}
                </div>

                {selectedClient && (
                  <p className="mt-2 text-xs text-slate-500">
                    Selected client ID:{" "}
                    <span className="font-semibold text-slate-700">
                      {selectedClient.id}
                    </span>
                  </p>
                )}

                {clientsError && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle size={13} />
                    {clientsError}
                  </p>
                )}

                {!isClientsLoading && !clientsError && clients.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600">
                    No clients are available.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="attendance_month"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Month <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <CalendarDays
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    id="attendance_month"
                    name="attendance_month"
                    value={filters.attendance_month}
                    onChange={handleFilterChange}
                    className="h-11 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-10 pr-10 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  >
                    {MONTHS.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={17}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="attendance_year"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Year <span className="text-red-500">*</span>
                </label>

                <input
                  id="attendance_year"
                  name="attendance_year"
                  type="number"
                  min="2000"
                  max="2100"
                  value={filters.attendance_year}
                  onChange={handleFilterChange}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={fetchSummary}
                  disabled={isLoading}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Loading
                    </>
                  ) : (
                    <>
                      <Search size={18} />
                      View Report
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isLoading || Boolean(downloadingType)}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw size={17} />
                  Reset
                </button>
              </div>
            </div>

            {showAdvancedFilters && (
              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label
                      htmlFor="sscl_rate"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      SSCL Rate (%)
                    </label>

                    <input
                      id="sscl_rate"
                      name="sscl_rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={filters.sscl_rate}
                      onChange={handleFilterChange}
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="vat_rate"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      VAT Rate (%)
                    </label>

                    <input
                      id="vat_rate"
                      name="vat_rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={filters.vat_rate}
                      onChange={handleFilterChange}
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="overtime_shift_hours"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Hours Per OT Shift
                    </label>

                    <input
                      id="overtime_shift_hours"
                      name="overtime_shift_hours"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={filters.overtime_shift_hours}
                      onChange={handleFilterChange}
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Overtime calculation: total overtime hours divided by hours
                  per OT shift, then added to claimed shifts.
                </p>
              </div>
            )}

            {error && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                <AlertCircle size={20} className="mt-0.5 shrink-0" />

                <div>
                  <p className="text-sm font-semibold">Unable to continue</p>
                  <p className="mt-0.5 text-sm">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
            <Loader2 size={38} className="animate-spin text-emerald-600" />

            <p className="mt-4 text-base font-semibold text-slate-800">
              Loading invoice summary
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Calculating checkpoint shifts and invoice amounts.
            </p>
          </div>
        )}

        {!isLoading && !summaryData && (
          <EmptyState
            title="No report has been generated"
            description="Select a client, attendance month and year, and then click View Report."
          />
        )}

        {!isLoading && summaryData && (
          <>
            {/* Client information */}
            <div className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_auto]">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Building2 size={23} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-slate-900">
                      {summaryData.client?.client_name}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {summaryData.client?.client_address ||
                        "No client address available"}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                      <p className="text-slate-600">
                        <span className="font-semibold text-slate-800">
                          Client ID:
                        </span>{" "}
                        {summaryData.client?.id}
                      </p>

                      <p className="text-slate-600">
                        <span className="font-semibold text-slate-800">
                          VAT No:
                        </span>{" "}
                        {summaryData.client?.client_vat_no || "N/A"}
                      </p>

                      <p className="text-slate-600">
                        <span className="font-semibold text-slate-800">
                          Phone:
                        </span>{" "}
                        {summaryData.client?.client_phone || "N/A"}
                      </p>

                      <p className="text-slate-600">
                        <span className="font-semibold text-slate-800">
                          Email:
                        </span>{" "}
                        {summaryData.client?.client_email || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
                <button
                  type="button"
                  onClick={() => downloadFile("excel")}
                  disabled={Boolean(downloadingType)}
                  className="inline-flex min-w-[210px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {downloadingType === "excel" ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <FileSpreadsheet size={19} />
                  )}

                  {downloadingType === "excel"
                    ? "Downloading Excel..."
                    : "Download Excel"}
                </button>

                <button
                  type="button"
                  onClick={() => downloadFile("pdf")}
                  disabled={Boolean(downloadingType)}
                  className="inline-flex min-w-[210px] items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {downloadingType === "pdf" ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <FileText size={19} />
                  )}

                  {downloadingType === "pdf"
                    ? "Downloading PDF..."
                    : "Download PDF"}
                </button>
              </div>
            </div>

            {/* Summary cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <SummaryCard
                title="Checkpoints"
                value={formatNumber(summaryTotals.checkpoint_count, 0)}
                subtitle={`${formatNumber(
                  summaryTotals.missing_attendance_count,
                  0,
                )} without attendance`}
                icon={Building2}
                iconClassName="bg-blue-100 text-blue-700"
              />

              <SummaryCard
                title="Employees"
                value={formatNumber(summaryTotals.employee_count, 0)}
                subtitle="Total checkpoint employees"
                icon={Users}
                iconClassName="bg-violet-100 text-violet-700"
              />

              <SummaryCard
                title="Claimed Shifts"
                value={formatNumber(summaryTotals.claimed_shifts)}
                subtitle={`${formatNumber(
                  summaryTotals.overtime_hours,
                )} OT hours`}
                icon={CheckCircle2}
                iconClassName="bg-emerald-100 text-emerald-700"
              />

              <SummaryCard
                title="Total Shifts"
                value={formatNumber(summaryTotals.total_shifts)}
                subtitle={`${formatNumber(
                  summaryTotals.accumulated_ot_shifts,
                )} converted OT shifts`}
                icon={ShieldCheck}
                iconClassName="bg-amber-100 text-amber-700"
              />

              <SummaryCard
                title="Grand Total"
                value={`Rs. ${formatMoney(summaryTotals.grand_total)}`}
                subtitle={`VAT ${calculationSettings.vat_rate || 0}% included`}
                icon={WalletCards}
                iconClassName="bg-rose-100 text-rose-700"
              />
            </div>

            {/* Calculation strip */}
            <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm shadow-sm">
              <div>
                <span className="text-slate-500">OT conversion:</span>{" "}
                <span className="font-semibold text-slate-800">
                  {calculationSettings.overtime_shift_hours} hours = 1 shift
                </span>
              </div>

              <div>
                <span className="text-slate-500">SSCL:</span>{" "}
                <span className="font-semibold text-slate-800">
                  {calculationSettings.sscl_rate}%
                </span>
              </div>

              <div>
                <span className="text-slate-500">VAT:</span>{" "}
                <span className="font-semibold text-slate-800">
                  {calculationSettings.vat_rate}%
                </span>
              </div>

              <div>
                <span className="text-slate-500">Net amount:</span>{" "}
                <span className="font-semibold text-slate-800">
                  Rs. {formatMoney(summaryTotals.net_amount)}
                </span>
              </div>

              <div>
                <span className="text-slate-500">SSCL amount:</span>{" "}
                <span className="font-semibold text-slate-800">
                  Rs. {formatMoney(summaryTotals.sscl_amount)}
                </span>
              </div>

              <div>
                <span className="text-slate-500">VAT amount:</span>{" "}
                <span className="font-semibold text-slate-800">
                  Rs. {formatMoney(summaryTotals.vat_amount)}
                </span>
              </div>
            </div>

            {/* Tables */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-4 pt-4 sm:px-6">
                <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
                  <div className="flex gap-1 overflow-x-auto">
                    {[
                      {
                        key: "summary",
                        label: "Invoice Summary",
                        count: summaryData.rows?.length || 0,
                      },
                      {
                        key: "employees",
                        label: "Employee Breakdown",
                        count: summaryData.employees?.length || 0,
                      },
                      {
                        key: "daily",
                        label: "Daily Attendance",
                        count: summaryData.daily_attendance?.length || 0,
                      },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => {
                          setActiveTab(tab.key);
                          setSearchText("");
                        }}
                        className={`whitespace-nowrap border-b-2 px-4 pb-4 pt-2 text-sm font-semibold transition ${
                          activeTab === tab.key
                            ? "border-emerald-600 text-emerald-700"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {tab.label}

                        <span
                          className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                            activeTab === tab.key
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="relative mb-4 w-full xl:w-80">
                    <Search
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      value={searchText}
                      onChange={(event) => setSearchText(event.target.value)}
                      placeholder="Search current table..."
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500 sm:px-6">
                <span>{currentTableCount} records displayed</span>

                <span className="hidden sm:inline">
                  Scroll horizontally to view all columns
                </span>
              </div>

              {activeTab === "summary" && (
                <div className="overflow-x-auto">
                  <table className="min-w-[1900px] w-full border-collapse">
                    <thead className="bg-slate-900 text-white">
                      <tr>
                        {[
                          "S/N",
                          "Invoice No",
                          "Checkpoint",
                          "Category",
                          "Status",
                          "Employees",
                          "Day Shifts",
                          "Night Shifts",
                          "Claimed Shifts",
                          "OT Hours",
                          "OT Shifts",
                          "Total Shifts",
                          "Approved Rate",
                          "Net Amount",
                          "SSCL",
                          "Total + SSCL",
                          "VAT",
                          "Grand Total",
                        ].map((heading) => (
                          <th
                            key={heading}
                            className="whitespace-nowrap border-r border-slate-700 px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide last:border-r-0"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {filteredSummaryRows.length === 0 ? (
                        <tr>
                          <td colSpan={18} className="px-6 py-16 text-center">
                            <p className="font-medium text-slate-700">
                              No matching invoice records
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Try changing the table search value.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredSummaryRows.map((row) => (
                          <tr
                            key={`${row.invoice_id}-${row.checkpoint_id}`}
                            className={`border-b transition last:border-b-0 ${
                              row.has_attendance
                                ? "border-slate-100 hover:bg-slate-50"
                                : "border-red-100 bg-red-50 hover:bg-red-100/70"
                            }`}
                          >
                            <td className="px-3 py-3 text-sm text-slate-600">
                              {row.serial_no}
                            </td>

                            <td className="px-3 py-3 text-sm font-semibold text-slate-900">
                              {row.invoice_number}
                            </td>

                            <td className="max-w-[280px] px-3 py-3">
                              <p className="text-sm font-semibold text-slate-900">
                                {row.checkpoint_name}
                              </p>

                              {row.checkpoint_address && (
                                <p className="mt-1 truncate text-xs text-slate-500">
                                  {row.checkpoint_address}
                                </p>
                              )}
                            </td>

                            <td className="px-3 py-3 text-sm text-slate-700">
                              {row.employee_category}
                            </td>

                            <td className="px-3 py-3">
                              {row.has_attendance ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                  <CheckCircle2 size={14} />
                                  Available
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                                  <XCircle size={14} />
                                  Missing
                                </span>
                              )}
                            </td>

                            <td className="px-3 py-3 text-right text-sm text-slate-700">
                              {formatNumber(row.employee_count, 0)}
                            </td>

                            <td className="px-3 py-3 text-right text-sm text-slate-700">
                              {formatNumber(row.day_shifts)}
                            </td>

                            <td className="px-3 py-3 text-right text-sm text-slate-700">
                              {formatNumber(row.night_shifts)}
                            </td>

                            <td className="px-3 py-3 text-right text-sm text-slate-700">
                              {formatNumber(row.claimed_shifts)}
                            </td>

                            <td className="px-3 py-3 text-right text-sm text-slate-700">
                              {formatNumber(row.overtime_hours)}
                            </td>

                            <td className="px-3 py-3 text-right text-sm text-slate-700">
                              {formatNumber(row.accumulated_ot_shifts)}
                            </td>

                            <td className="px-3 py-3 text-right text-sm font-semibold text-slate-900">
                              {formatNumber(row.total_shifts)}
                            </td>

                            <td className="px-3 py-3 text-right text-sm text-slate-700">
                              {formatMoney(row.approved_rate)}
                            </td>

                            <td className="px-3 py-3 text-right text-sm text-slate-700">
                              {formatMoney(row.net_amount)}
                            </td>

                            <td className="px-3 py-3 text-right text-sm text-slate-700">
                              {formatMoney(row.sscl_amount)}
                            </td>

                            <td className="px-3 py-3 text-right text-sm text-slate-700">
                              {formatMoney(row.total_with_sscl)}
                            </td>

                            <td className="px-3 py-3 text-right text-sm text-slate-700">
                              {formatMoney(row.vat_amount)}
                            </td>

                            <td className="px-3 py-3 text-right text-sm font-bold text-emerald-700">
                              {formatMoney(row.grand_total)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>

                    {filteredSummaryRows.length > 0 && (
                      <tfoot className="bg-slate-900 text-white">
                        <tr>
                          <td
                            colSpan={6}
                            className="px-3 py-4 text-right text-sm font-bold uppercase"
                          >
                            Grand Total
                          </td>

                          <td className="px-3 py-4 text-right text-sm font-bold">
                            {formatNumber(summaryTotals.day_shifts)}
                          </td>

                          <td className="px-3 py-4 text-right text-sm font-bold">
                            {formatNumber(summaryTotals.night_shifts)}
                          </td>

                          <td className="px-3 py-4 text-right text-sm font-bold">
                            {formatNumber(summaryTotals.claimed_shifts)}
                          </td>

                          <td className="px-3 py-4 text-right text-sm font-bold">
                            {formatNumber(summaryTotals.overtime_hours)}
                          </td>

                          <td className="px-3 py-4 text-right text-sm font-bold">
                            {formatNumber(summaryTotals.accumulated_ot_shifts)}
                          </td>

                          <td className="px-3 py-4 text-right text-sm font-bold">
                            {formatNumber(summaryTotals.total_shifts)}
                          </td>

                          <td className="px-3 py-4" />

                          <td className="px-3 py-4 text-right text-sm font-bold">
                            {formatMoney(summaryTotals.net_amount)}
                          </td>

                          <td className="px-3 py-4 text-right text-sm font-bold">
                            {formatMoney(summaryTotals.sscl_amount)}
                          </td>

                          <td className="px-3 py-4 text-right text-sm font-bold">
                            {formatMoney(summaryTotals.total_with_sscl)}
                          </td>

                          <td className="px-3 py-4 text-right text-sm font-bold">
                            {formatMoney(summaryTotals.vat_amount)}
                          </td>

                          <td className="px-3 py-4 text-right text-base font-bold text-emerald-300">
                            {formatMoney(summaryTotals.grand_total)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}

              {activeTab === "employees" && (
                <div className="overflow-x-auto">
                  <table className="min-w-[1500px] w-full border-collapse">
                    <thead className="bg-slate-900 text-white">
                      <tr>
                        {[
                          "Invoice No",
                          "Checkpoint",
                          "Employee No",
                          "Employee Name",
                          "Category",
                          "Payroll Group",
                          "Payroll Scheme",
                          "Worked Days",
                          "Day Shifts",
                          "Night Shifts",
                          "Claimed Shifts",
                          "OT Hours",
                          "OT Shifts",
                          "Total Shifts",
                        ].map((heading) => (
                          <th
                            key={heading}
                            className="whitespace-nowrap border-r border-slate-700 px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide last:border-r-0"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {filteredEmployees.length === 0 ? (
                        <tr>
                          <td colSpan={14} className="px-6 py-16 text-center">
                            <p className="font-medium text-slate-700">
                              No matching employee records
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Try changing the table search value.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredEmployees.map((employee, index) => (
                          <tr
                            key={`${employee.checkpoint_id}-${employee.employee_no}-${index}`}
                            className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50"
                          >
                            <td className="px-3 py-3 text-sm font-semibold text-slate-900">
                              {employee.invoice_number}
                            </td>

                            <td className="px-3 py-3 text-sm text-slate-700">
                              {employee.checkpoint_name}
                            </td>

                            <td className="px-3 py-3 text-sm font-medium text-slate-800">
                              {employee.employee_no}
                            </td>

                            <td className="px-3 py-3 text-sm text-slate-700">
                              {employee.employee_name}
                            </td>

                            <td className="px-3 py-3">
                              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                {employee.employee_category}
                              </span>
                            </td>

                            <td className="px-3 py-3 text-sm text-slate-700">
                              {employee.payroll_group || "N/A"}
                            </td>

                            <td className="px-3 py-3 text-sm text-slate-700">
                              {employee.payroll_scheme || "N/A"}
                            </td>

                            <td className="px-3 py-3 text-right text-sm text-slate-700">
                              {formatNumber(employee.worked_days, 0)}
                            </td>

                            <td className="px-3 py-3 text-right text-sm text-slate-700">
                              {formatNumber(employee.day_shifts)}
                            </td>

                            <td className="px-3 py-3 text-right text-sm text-slate-700">
                              {formatNumber(employee.night_shifts)}
                            </td>

                            <td className="px-3 py-3 text-right text-sm text-slate-700">
                              {formatNumber(employee.claimed_shifts)}
                            </td>

                            <td className="px-3 py-3 text-right text-sm text-slate-700">
                              {formatNumber(employee.overtime_hours)}
                            </td>

                            <td className="px-3 py-3 text-right text-sm text-slate-700">
                              {formatNumber(employee.accumulated_ot_shifts)}
                            </td>

                            <td className="px-3 py-3 text-right text-sm font-bold text-emerald-700">
                              {formatNumber(employee.total_shifts)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "daily" && (
                <div className="overflow-x-auto">
                  <table className="min-w-[1400px] w-full border-collapse">
                    <thead className="bg-slate-900 text-white">
                      <tr>
                        {[
                          "Invoice No",
                          "Checkpoint",
                          "Attendance Date",
                          "Employee No",
                          "Employee Name",
                          "Category",
                          "Day Shift",
                          "Night Shift",
                          "Claimed Shifts",
                          "OT Hours",
                          "OT Shifts",
                          "Total Shifts",
                        ].map((heading) => (
                          <th
                            key={heading}
                            className="whitespace-nowrap border-r border-slate-700 px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide last:border-r-0"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {filteredDailyAttendance.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="px-6 py-16 text-center">
                            <p className="font-medium text-slate-700">
                              No matching attendance records
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Try changing the table search value.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredDailyAttendance.map((attendance, index) => (
                          <tr
                            key={`${attendance.checkpoint_id}-${attendance.employee_no}-${attendance.attendance_day}-${index}`}
                            className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50"
                          >
                            <td className="px-3 py-3 text-sm font-semibold text-slate-900">
                              {attendance.invoice_number}
                            </td>

                            <td className="px-3 py-3 text-sm text-slate-700">
                              {attendance.checkpoint_name}
                            </td>

                            <td className="px-3 py-3 text-sm font-medium text-slate-800">
                              {attendance.attendance_date}
                            </td>

                            <td className="px-3 py-3 text-sm text-slate-700">
                              {attendance.employee_no}
                            </td>

                            <td className="px-3 py-3 text-sm text-slate-700">
                              {attendance.employee_name}
                            </td>

                            <td className="px-3 py-3">
                              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                {attendance.employee_category}
                              </span>
                            </td>

                            <td className="px-3 py-3 text-right text-sm text-slate-700">
                              {formatNumber(attendance.day_shift)}
                            </td>

                            <td className="px-3 py-3 text-right text-sm text-slate-700">
                              {formatNumber(attendance.night_shift)}
                            </td>

                            <td className="px-3 py-3 text-right text-sm text-slate-700">
                              {formatNumber(attendance.claimed_shifts)}
                            </td>

                            <td className="px-3 py-3 text-right text-sm text-slate-700">
                              {formatNumber(attendance.overtime_hours)}
                            </td>

                            <td className="px-3 py-3 text-right text-sm text-slate-700">
                              {formatNumber(attendance.accumulated_ot_shifts)}
                            </td>

                            <td className="px-3 py-3 text-right text-sm font-bold text-emerald-700">
                              {formatNumber(attendance.total_shifts)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 text-xs text-slate-500">
              <Download size={14} />
              Excel includes invoice summary, employee breakdown and daily
              attendance sheets.
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CheckpointInvoiceSummary;
