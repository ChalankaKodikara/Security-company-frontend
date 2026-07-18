import React, { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Download,
  Search,
  Calendar,
  Filter,
  FileText,
  X,
  Check,
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { apiFetch } from "../../../utils/apiClient";

const getInitials = (fullName = "") => {
  const tokens = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return "??";
  if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
  return (tokens[0][0] + tokens[tokens.length - 1][0]).toUpperCase();
};

const avatarBgClass = (seed = "") => {
  const palette = [
    "from-blue-500 to-blue-600",
    "from-purple-500 to-purple-600",
    "from-emerald-500 to-emerald-600",
    "from-rose-500 to-rose-600",
    "from-amber-500 to-amber-600",
    "from-teal-500 to-teal-600",
  ];

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return palette[hash % palette.length];
};

const FIXED_EXPORT_COLUMNS = [
  { key: "employee_no", label: "Employee No", type: "text" },
  { key: "employee_fullname", label: "Employee Name", type: "text" },
  { key: "employee_category", label: "Category", type: "text" },
  { key: "payroll_type", label: "Payroll Type", type: "text" },
  { key: "completed_shifts", label: "Completed Shifts", type: "number" },
  { key: "payable_basic_salary", label: "Shift Pay", type: "money" },
  { key: "overtime_pay", label: "OT Pay", type: "money" },
  { key: "gross_pay", label: "Gross Pay", type: "money" },
  { key: "epf_base", label: "EPF Base", type: "money" },
  { key: "salary_advance", label: "Salary Advance", type: "money" },
  { key: "payroll_status", label: "Payroll Status", type: "text" },
  { key: "epf_8", label: "EPF 8%", type: "money" },
  { key: "epf_12", label: "EPF 12%", type: "money" },
  { key: "etf_3", label: "ETF 3%", type: "money" },
  { key: "total_earnings", label: "Total Earnings", type: "money" },
  { key: "net_pay", label: "Net Pay", type: "money" },
];

const NON_EXPORTABLE_COLUMNS = new Set([
  "id",
  "organization_id",
  "month",
  "year",
  "employee_table_no",
  "employee_email",
  "employee_calling_name",
  "job_title",
  "organization_name",
  "organization_code",
  "generated_at",
  "net_salary",
]);

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const round2 = (value) => Number(toNumber(value).toFixed(2));

const humanizeColumn = (key) =>
  String(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const hasMeaningfulValue = (value) => {
  if (value == null || value === "") return false;

  const number = Number(value);
  if (Number.isFinite(number)) return number !== 0;

  const normalized = String(value).trim().toLowerCase();
  return normalized !== "" && normalized !== "0" && normalized !== "0.00";
};

const getOptionalExportColumns = (data) => {
  if (!Array.isArray(data) || data.length === 0) return [];

  const fixedKeys = new Set(FIXED_EXPORT_COLUMNS.map((column) => column.key));
  const keys = new Set();

  data.forEach((row) => {
    Object.keys(row || {}).forEach((key) => keys.add(key));
  });

  return Array.from(keys)
    .filter((key) => !fixedKeys.has(key))
    .filter((key) => !NON_EXPORTABLE_COLUMNS.has(key))
    .filter((key) => data.some((row) => hasMeaningfulValue(row?.[key])))
    .map((key) => ({
      key,
      label: humanizeColumn(key),
      type: data
        .filter((row) => hasMeaningfulValue(row?.[key]))
        .every((row) => Number.isFinite(Number(row?.[key])))
        ? "money"
        : "text",
    }));
};

export default function ModernPayrollView() {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  const getInitialYM = () => {
    const params = new URLSearchParams(window.location.search);
    const ymParam = params.get("ym");

    if (ymParam) return ymParam;

    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0",
    )}`;
  };

  const [ym, setYm] = useState(getInitialYM());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [expandedRow, setExpandedRow] = useState(null);

  const [checkpoints, setCheckpoints] = useState([]);
  const [selectedCheckpointIds, setSelectedCheckpointIds] = useState([]);
  const [checkpointSearch, setCheckpointSearch] = useState("");
  const [checkpointDropdownOpen, setCheckpointDropdownOpen] = useState(false);
  const [isLoadingCheckpoints, setIsLoadingCheckpoints] = useState(false);

  const [year, month] = useMemo(() => {
    const [y, m] = ym.split("-");
    return [y, m?.padStart(2, "0")];
  }, [ym]);

  const [symbol, setSymbol] = useState(Cookies.get("symbol") || "Rs.");

  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [monthlyNetSalary, setMonthlyNetSalary] = useState(0);
  const [monthlyEmployeeCount, setMonthlyEmployeeCount] = useState(0);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  useEffect(() => {
    setSymbol(Cookies.get("symbol") || "Rs.");
  }, []);

  useEffect(() => {
    let active = true;

    const fetchCheckpoints = async () => {
      setIsLoadingCheckpoints(true);

      try {
        const response = await apiFetch(
          `${API_URL}/v1/hris/client/checkpoints`,
          { credentials: "include" },
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();
        const list = Array.isArray(json?.checkpoints) ? json.checkpoints : [];

        if (active) {
          setCheckpoints(
            list
              .filter((checkpoint) => Number(checkpoint?.is_active) === 1)
              .sort((a, b) =>
                String(a?.checkpoint_name || "").localeCompare(
                  String(b?.checkpoint_name || ""),
                ),
              ),
          );
        }
      } catch (error) {
        console.error("Failed to load checkpoints:", error);
        if (active) {
          setCheckpoints([]);
          toast.error("Failed to load checkpoints");
        }
      } finally {
        if (active) setIsLoadingCheckpoints(false);
      }
    };

    fetchCheckpoints();

    return () => {
      active = false;
    };
  }, [API_URL]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("ym", ym);
    if (search) params.set("search", search);
    if (selectedCheckpointIds.length > 0) {
      params.set("checkpoint_ids", selectedCheckpointIds.join(","));
    }
    params.set("page", String(page));
    params.set("limit", String(limit));

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  }, [ym, search, page, limit, selectedCheckpointIds]);

  const money = (v) => {
    if (v == null || v === "") return "—";
    const num = Number(v);
    if (!Number.isFinite(num)) return String(v);

    return `${symbol} ${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const fetchAllPayrollRows = async () => {
    const params = new URLSearchParams({
      year,
      month,
      payroll_type: "SECURITY",
      page: "1",
      limit: "100000",
    });

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (selectedCheckpointIds.length > 0) {
      params.set("checkpoint_ids", selectedCheckpointIds.join(","));
    }

    const response = await apiFetch(
      `${API_URL}/v1/hris/payroll/genarated-payroll-by-month-and-year?${params.toString()}`,
      { credentials: "include" },
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();
    return Array.isArray(json?.data) ? json.data : [];
  };

  useEffect(() => {
    if (!year || !month) return;

    let active = true;

    const loadMonthlyTotal = async () => {
      try {
        const allRows = await fetchAllPayrollRows();
        if (!active) return;

        setMonthlyEmployeeCount(allRows.length);
        setMonthlyNetSalary(
          round2(
            allRows.reduce(
              (sum, row) => sum + toNumber(row.net_pay ?? row.net_salary),
              0,
            ),
          ),
        );
      } catch (error) {
        if (!active) return;
        console.error("Failed to calculate monthly salary total:", error);
        setMonthlyEmployeeCount(0);
        setMonthlyNetSalary(0);
      }
    };

    loadMonthlyTotal();

    return () => {
      active = false;
    };
  }, [API_URL, year, month, search, selectedCheckpointIds]);

  useEffect(() => {
    if (!year || !month) return;

    const controller = new AbortController();

    const fetchData = async () => {
      setIsLoading(true);
      setFetchError("");

      try {
        const params = new URLSearchParams({
          year,
          month,
          page,
          limit,
          payroll_type: "SECURITY",
        });

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (selectedCheckpointIds.length > 0) {
          params.set("checkpoint_ids", selectedCheckpointIds.join(","));
        }

        const res = await apiFetch(
          `${API_URL}/v1/hris/payroll/genarated-payroll-by-month-and-year?${params.toString()}`,
          {
            credentials: "include",
            signal: controller.signal,
          },
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const data = Array.isArray(json?.data) ? json.data : [];

        setRows(data);
        setTotalPages(Number(json?.totalPages) || 1);
        setTotalRecords(Number(json?.totalRecords) || data.length || 0);

        if (Number(json?.currentPage) && json.currentPage !== page) {
          setPage(json.currentPage);
        }
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error(e);
          setFetchError("Failed to load payroll data");
          setRows([]);
          toast.error("Failed to load payroll data");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => controller.abort();
  }, [API_URL, year, month, search, page, limit, selectedCheckpointIds]);

  const customColumns = useMemo(() => {
    if (!rows || rows.length === 0) {
      return { allowances: [], deductions: [], other: [] };
    }

    const fixedAndHidden = new Set([
      ...FIXED_EXPORT_COLUMNS.map((column) => column.key),
      ...NON_EXPORTABLE_COLUMNS,
      "basic_salary",
      "extra_shift_pay",
      "cola",
      "total_allowances",
      "total_deductions",
      "calculated_nopay",
      "payroll_scheme",
      "payroll_location_type",
    ]);

    const keys = new Set();
    rows.forEach((row) => {
      Object.keys(row || {}).forEach((key) => keys.add(key));
    });

    const allowances = [];
    const deductions = [];
    const other = [];

    Array.from(keys)
      .filter((key) => !fixedAndHidden.has(key))
      .filter((key) => rows.some((row) => hasMeaningfulValue(row?.[key])))
      .forEach((key) => {
        const label = humanizeColumn(key);

        if (key.startsWith("allowance_")) {
          allowances.push({ key, label: label.replace("Allowance ", "") });
        } else if (key.startsWith("deduction_")) {
          deductions.push({ key, label: label.replace("Deduction ", "") });
        } else {
          other.push({ key, label });
        }
      });

    return { allowances, deductions, other };
  }, [rows]);

  const buildTotalRow = (data, columns) => {
    const totalRow = {};

    columns.forEach((column) => {
      if (column.key === "employee_fullname") {
        totalRow[column.key] = "MONTH TOTAL";
      } else if (column.key === "employee_no") {
        totalRow[column.key] = `${data.length} Employees`;
      } else if (column.key === "payroll_status") {
        totalRow[column.key] = "-";
      } else if (column.type === "money" || column.type === "number") {
        totalRow[column.key] = round2(
          data.reduce((sum, row) => {
            const value =
              column.key === "net_pay"
                ? (row.net_pay ?? row.net_salary)
                : row[column.key];
            return sum + toNumber(value);
          }, 0),
        );
      } else {
        totalRow[column.key] = "";
      }
    });

    return totalRow;
  };

  const formatExportValue = (row, column) => {
    const rawValue =
      column.key === "net_pay"
        ? (row.net_pay ?? row.net_salary)
        : row[column.key];

    if (column.type === "money") {
      return toNumber(rawValue).toFixed(2);
    }

    if (column.type === "number") {
      return round2(rawValue).toString();
    }

    return rawValue == null ? "" : String(rawValue);
  };

  const handleExportCSV = async () => {
    try {
      const allRows = await fetchAllPayrollRows();

      if (!allRows.length) {
        toast.warn("No data available to export");
        return;
      }

      const optionalColumns = getOptionalExportColumns(allRows);
      const columns = [...FIXED_EXPORT_COLUMNS, ...optionalColumns];
      const totalRow = buildTotalRow(allRows, columns);
      const exportRows = [...allRows, totalRow];

      const csvEscape = (value) => {
        const stringValue = value == null ? "" : String(value);
        return /[",\n]/.test(stringValue)
          ? `"${stringValue.replace(/"/g, '""')}"`
          : stringValue;
      };

      const headerLine = columns
        .map((column) => csvEscape(column.label))
        .join(",");

      const lines = exportRows.map((row) =>
        columns
          .map((column) => csvEscape(formatExportValue(row, column)))
          .join(","),
      );

      const csv = `\uFEFF${[headerLine, ...lines].join("\n")}`;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const fileName = `security-payroll-${year}-${month}.csv`;
      const link = document.createElement("a");

      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);

      toast.success(`Exported ${allRows.length} payroll records`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to export CSV");
    }
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);

    try {
      const allRows = await fetchAllPayrollRows();

      if (!allRows.length) {
        toast.warn("No data available to export");
        return;
      }

      const optionalColumns = getOptionalExportColumns(allRows);
      const columns = [...FIXED_EXPORT_COLUMNS, ...optionalColumns];
      const totalRow = buildTotalRow(allRows, columns);
      const tableRows = [...allRows, totalRow].map((row) =>
        columns.map((column) => formatExportValue(row, column)),
      );

      const document = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a3",
      });

      const monthLabel = new Date(
        Number(year),
        Number(month) - 1,
        1,
      ).toLocaleDateString("en-US", { month: "long", year: "numeric" });

      const totalNetPay = round2(
        allRows.reduce(
          (sum, row) => sum + toNumber(row.net_pay ?? row.net_salary),
          0,
        ),
      );

      document.setFont("helvetica", "bold");
      document.setFontSize(16);
      document.text("Security Payroll Report", 14, 15);

      document.setFont("helvetica", "normal");
      document.setFontSize(9);
      document.text(`Payroll Month: ${monthLabel}`, 14, 22);
      document.text(`Employees: ${allRows.length}`, 14, 27);
      document.text(
        `Total Salary for Month: ${symbol} ${totalNetPay.toLocaleString(
          undefined,
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          },
        )}`,
        14,
        32,
      );

      autoTable(document, {
        startY: 38,
        head: [columns.map((column) => column.label)],
        body: tableRows,
        theme: "grid",
        margin: { left: 8, right: 8, bottom: 12 },
        styles: {
          font: "helvetica",
          fontSize: columns.length > 20 ? 4.5 : 5.5,
          cellPadding: 1.1,
          overflow: "linebreak",
          valign: "middle",
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        didParseCell: (data) => {
          const isTotalRow = data.row.index === tableRows.length - 1;

          if (isTotalRow && data.section === "body") {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fillColor = [226, 232, 240];
          }

          const column = columns[data.column.index];
          if (column?.type === "money" || column?.type === "number") {
            data.cell.styles.halign = "right";
          }
        },
        didDrawPage: () => {
          const pageCount = document.getNumberOfPages();
          document.setFontSize(7);
          document.setTextColor(100);
          document.text(
            `Page ${pageCount}`,
            document.internal.pageSize.getWidth() - 20,
            document.internal.pageSize.getHeight() - 6,
          );
        },
      });

      document.save(`security-payroll-${year}-${month}.pdf`);
      toast.success(`PDF exported with ${allRows.length} payroll records`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const filteredCheckpoints = useMemo(() => {
    const keyword = checkpointSearch.trim().toLowerCase();

    if (!keyword) return checkpoints;

    return checkpoints.filter((checkpoint) =>
      [checkpoint?.checkpoint_name, checkpoint?.address, checkpoint?.id].some(
        (value) =>
          String(value || "")
            .toLowerCase()
            .includes(keyword),
      ),
    );
  }, [checkpoints, checkpointSearch]);

  const selectedCheckpoints = useMemo(
    () =>
      checkpoints.filter((checkpoint) =>
        selectedCheckpointIds.includes(Number(checkpoint.id)),
      ),
    [checkpoints, selectedCheckpointIds],
  );

  const toggleCheckpoint = (checkpointId) => {
    const id = Number(checkpointId);

    setSelectedCheckpointIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
    setPage(1);
  };

  const clearCheckpointFilter = () => {
    setSelectedCheckpointIds([]);
    setCheckpointSearch("");
    setPage(1);
  };

  const handleReset = () => {
    const today = new Date();
    const defYM = `${today.getFullYear()}-${String(
      today.getMonth() + 1,
    ).padStart(2, "0")}`;

    setYm(defYM);
    setSearch("");
    setSelectedCheckpointIds([]);
    setCheckpointSearch("");
    setCheckpointDropdownOpen(false);
    setPage(1);
    setLimit(10);
  };

  const securityCardItems = (row) => [
    {
      label: "Completed Shifts",
      value: row.completed_shifts ?? "0",
      className: "text-indigo-600",
    },
    {
      label: "Shift Pay",
      value: money(row.payable_basic_salary || row.basic_salary),
      className: "text-blue-700",
    },
    {
      label: "OT Pay",
      value: money(row.overtime_pay),
      className: "text-emerald-700",
    },
    {
      label: "Net Pay",
      value: money(row.net_pay || row.net_salary),
      className: "text-blue-700 text-lg",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Security Payroll Overview
            </h1>
            <p className="text-gray-600 mt-1">
              {new Date(year, month - 1).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              disabled={isLoading || rows.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isLoading || isExportingPDF || rows.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="w-4 h-4" />
              {isExportingPDF ? "Exporting PDF..." : "Export PDF"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-500">
            Employees This Month
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-800">
            {monthlyEmployeeCount}
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-md p-5 text-white">
          <p className="text-sm font-medium text-blue-100">
            Total Salary for This Month
          </p>
          <p className="mt-2 text-3xl font-bold">{money(monthlyNetSalary)}</p>
          <p className="mt-1 text-xs text-blue-100">
            Total of employee net pay
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-md border border-gray-200 p-5 mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Month & Year
            </label>
            <input
              type="month"
              value={ym}
              onChange={(e) => {
                setYm(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Search Employee
            </label>
            <input
              type="text"
              placeholder="Name, No, or Email"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Checkpoints
            </label>

            <button
              type="button"
              onClick={() => setCheckpointDropdownOpen((current) => !current)}
              className="w-full min-h-[42px] px-3 py-2 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="truncate text-sm text-gray-700">
                {selectedCheckpointIds.length === 0
                  ? "All checkpoints"
                  : `${selectedCheckpointIds.length} checkpoint${
                      selectedCheckpointIds.length === 1 ? "" : "s"
                    } selected`}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
            </button>

            {checkpointDropdownOpen && (
              <div className="absolute z-50 mt-2 w-full min-w-[320px] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                <div className="p-3 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={checkpointSearch}
                      onChange={(event) =>
                        setCheckpointSearch(event.target.value)
                      }
                      placeholder="Search checkpoint or address..."
                      autoFocus
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
                  <span className="text-xs text-gray-500">
                    {selectedCheckpointIds.length} selected
                  </span>
                  {selectedCheckpointIds.length > 0 && (
                    <button
                      type="button"
                      onClick={clearCheckpointFilter}
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto p-2">
                  {isLoadingCheckpoints ? (
                    <div className="py-6 text-center text-sm text-gray-500">
                      Loading checkpoints...
                    </div>
                  ) : filteredCheckpoints.length === 0 ? (
                    <div className="py-6 text-center text-sm text-gray-500">
                      No checkpoints found
                    </div>
                  ) : (
                    filteredCheckpoints.map((checkpoint) => {
                      const checkpointId = Number(checkpoint.id);
                      const isSelected =
                        selectedCheckpointIds.includes(checkpointId);

                      return (
                        <button
                          type="button"
                          key={checkpoint.id}
                          onClick={() => toggleCheckpoint(checkpointId)}
                          className={`w-full px-3 py-2 rounded-lg flex items-start gap-3 text-left transition-colors ${
                            isSelected
                              ? "bg-blue-50 text-blue-800"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <span
                            className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </span>

                          <span className="min-w-0">
                            <span className="block text-sm font-medium truncate">
                              {checkpoint.checkpoint_name ||
                                `Checkpoint ${checkpoint.id}`}
                            </span>
                            <span className="block text-xs text-gray-500 truncate">
                              {checkpoint.address ||
                                `Checkpoint ID: ${checkpoint.id}`}
                            </span>
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="p-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setCheckpointDropdownOpen(false)}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Apply Selection
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Items per page
            </label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleReset}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {selectedCheckpoints.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Selected checkpoints
              </p>
              <button
                type="button"
                onClick={clearCheckpointFilter}
                className="text-xs font-medium text-red-600 hover:text-red-700"
              >
                Clear all
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedCheckpoints.map((checkpoint) => (
                <span
                  key={checkpoint.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-medium"
                >
                  {checkpoint.checkpoint_name || `Checkpoint ${checkpoint.id}`}
                  <button
                    type="button"
                    onClick={() => toggleCheckpoint(checkpoint.id)}
                    className="hover:text-blue-900"
                    aria-label={`Remove ${checkpoint.checkpoint_name}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-3"
      >
        {isLoading ? (
          <div className="bg-white rounded-xl p-10 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"
            />
            <p className="text-gray-600 mt-4">Loading payroll data...</p>
          </div>
        ) : fetchError ? (
          <div className="bg-white rounded-xl p-10 text-center text-red-600">
            {fetchError}
          </div>
        ) : rows.length > 0 ? (
          rows.map((row, index) => (
            <motion.div
              key={row.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div
                onClick={() =>
                  setExpandedRow(expandedRow === row.id ? null : row.id)
                }
                className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg bg-gradient-to-br ${avatarBgClass(
                        row.employee_fullname || row.employee_no,
                      )}`}
                    >
                      {getInitials(row.employee_fullname || row.employee_no)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {row.employee_fullname || "—"}
                        </h3>

                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                          {row.employee_no}
                        </span>

                        {row.employee_category && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                            {row.employee_category}
                          </span>
                        )}

                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded">
                          SECURITY
                        </span>
                      </div>

                      <p className="text-sm text-gray-500">
                        {row.employee_email || "—"}
                      </p>

                      {row.checkpoint_name && (
                        <p className="text-xs text-blue-600 mt-1">
                          {row.checkpoint_name}
                        </p>
                      )}
                    </div>

                    <div className="hidden xl:flex items-center gap-5">
                      {securityCardItems(row).map((item) => (
                        <div key={item.label} className="text-right">
                          <p className="text-xs text-gray-500">{item.label}</p>
                          <p
                            className={`text-sm font-semibold ${item.className}`}
                          >
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="ml-4">
                    {expandedRow === row.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="xl:hidden mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {securityCardItems(row).map((item) => (
                    <div key={item.label}>
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className={`text-sm font-semibold ${item.className}`}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <AnimatePresence>
                {expandedRow === row.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-200 bg-gray-50"
                  >
                    <div className="p-5 space-y-5">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <div className="w-1 h-4 bg-blue-500 rounded"></div>
                          Security Payroll Details
                        </h4>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-white p-3 rounded-lg border border-blue-100">
                            <p className="text-xs text-gray-500 mb-1">
                              Completed Shifts
                            </p>
                            <p className="font-semibold text-blue-700">
                              {row.completed_shifts || 0}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-blue-100">
                            <p className="text-xs text-gray-500 mb-1">
                              Payable Shift Salary
                            </p>
                            <p className="font-semibold text-blue-700">
                              {money(
                                row.payable_basic_salary || row.basic_salary,
                              )}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-blue-100">
                            <p className="text-xs text-gray-500 mb-1">
                              Overtime Pay
                            </p>
                            <p className="font-semibold text-blue-700">
                              {money(row.overtime_pay)}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-blue-100">
                            <p className="text-xs text-gray-500 mb-1">
                              Extra Shift Pay
                            </p>
                            <p className="font-semibold text-blue-700">
                              {money(row.extra_shift_pay)}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-blue-100">
                            <p className="text-xs text-gray-500 mb-1">
                              Gross Pay
                            </p>
                            <p className="font-semibold text-blue-700">
                              {money(row.gross_pay)}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-blue-100">
                            <p className="text-xs text-gray-500 mb-1">
                              Total Earnings
                            </p>
                            <p className="font-semibold text-blue-700">
                              {money(row.total_earnings)}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-blue-100">
                            <p className="text-xs text-gray-500 mb-1">
                              Payroll Status
                            </p>
                            <p className="font-semibold text-blue-700">
                              {row.payroll_status || "DRAFT"}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-blue-100">
                            <p className="text-xs text-gray-500 mb-1">
                              Payroll Type
                            </p>
                            <p className="font-semibold text-blue-700">
                              {row.payroll_type || "SECURITY"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <div className="w-1 h-4 bg-indigo-500 rounded"></div>
                          EPF / ETF
                        </h4>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-white p-3 rounded-lg border border-indigo-100">
                            <p className="text-xs text-gray-500 mb-1">
                              EPF Base
                            </p>
                            <p className="font-semibold text-indigo-700">
                              {money(row.epf_base)}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-indigo-100">
                            <p className="text-xs text-gray-500 mb-1">EPF 8%</p>
                            <p className="font-semibold text-indigo-700">
                              {money(row.epf_8)}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-indigo-100">
                            <p className="text-xs text-gray-500 mb-1">
                              EPF 12%
                            </p>
                            <p className="font-semibold text-indigo-700">
                              {money(row.epf_12)}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-indigo-100">
                            <p className="text-xs text-gray-500 mb-1">ETF 3%</p>
                            <p className="font-semibold text-indigo-700">
                              {money(row.etf_3)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {customColumns.allowances.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <div className="w-1 h-4 bg-emerald-500 rounded"></div>
                            Allowances Breakdown
                          </h4>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {customColumns.allowances.map((col) => (
                              <div
                                key={col.key}
                                className="bg-white p-3 rounded-lg border border-emerald-100"
                              >
                                <p className="text-xs text-gray-500 mb-1">
                                  {col.label}
                                </p>
                                <p className="font-semibold text-emerald-700">
                                  {money(row[col.key])}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {customColumns.deductions.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <div className="w-1 h-4 bg-red-500 rounded"></div>
                            Deductions Breakdown
                          </h4>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {customColumns.deductions.map((col) => (
                              <div
                                key={col.key}
                                className="bg-white p-3 rounded-lg border border-red-100"
                              >
                                <p className="text-xs text-gray-500 mb-1">
                                  {col.label}
                                </p>
                                <p className="font-semibold text-red-700">
                                  {money(row[col.key])}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <div className="w-1 h-4 bg-orange-500 rounded"></div>
                          Other Details
                        </h4>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-white p-3 rounded-lg border border-orange-100">
                            <p className="text-xs text-gray-500 mb-1">
                              Total Allowances
                            </p>
                            <p className="font-semibold text-emerald-700">
                              {money(row.total_allowances)}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-orange-100">
                            <p className="text-xs text-gray-500 mb-1">
                              Total Deductions
                            </p>
                            <p className="font-semibold text-red-700">
                              {money(row.total_deductions)}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-orange-100">
                            <p className="text-xs text-gray-500 mb-1">
                              Salary Advance
                            </p>
                            <p className="font-semibold text-orange-700">
                              {money(row.salary_advance)}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-orange-100">
                            <p className="text-xs text-gray-500 mb-1">No Pay</p>
                            <p className="font-semibold text-orange-700">
                              {money(row.calculated_nopay)}
                            </p>
                          </div>

                          {customColumns.other.map((col) => (
                            <div
                              key={col.key}
                              className="bg-white p-3 rounded-lg border border-orange-100"
                            >
                              <p className="text-xs text-gray-500 mb-1">
                                {col.label}
                              </p>
                              <p className="font-semibold text-orange-700">
                                {money(row[col.key])}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Final Net Pay
                          </span>
                          <span className="text-2xl font-bold">
                            {money(row.net_pay || row.net_salary)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        ) : (
          <div className="bg-white rounded-xl p-10 text-center">
            <div className="text-gray-400 text-4xl mb-3">📋</div>
            <p className="text-gray-600">No payroll records found</p>
            <p className="text-sm text-gray-500 mt-2">
              Try adjusting your filters
            </p>
          </div>
        )}
      </motion.div>

      {!isLoading && rows.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 bg-white rounded-xl shadow-md border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing{" "}
              <strong>
                {(page - 1) * limit + 1}–{Math.min(page * limit, totalRecords)}
              </strong>{" "}
              of <strong>{totalRecords}</strong>
            </div>

            <div className="flex items-center gap-3">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">
                {page} / {totalPages}
              </div>

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
