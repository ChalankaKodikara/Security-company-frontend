/** @format */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Search,
  Download,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  Briefcase,
  Building2,
  Tag,
} from "lucide-react";
import Select from "react-select";
import usePermissions from "../../../permissions/permission";
import { apiFetch } from "../../../../utils/apiClient";

const Leave_approve_table = () => {
  const [leaveData, setLeaveData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [requestedDateFrom, setRequestedDateFrom] = useState("");
  const [requestedDateTo, setRequestedDateTo] = useState("");
  const [requestingDateFrom, setRequestingDateFrom] = useState("");
  const [requestingDateTo, setRequestingDateTo] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [department, setDepartment] = useState("");
  const [approvedStatus, setApprovedStatus] = useState("");
  const [organization, setOrganization] = useState("");

  const [leaveCategories, setLeaveCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [organizations, setOrganizations] = useState([]);

  const [showFilters, setShowFilters] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const { hasPermission } = usePermissions();
  const rowsPerPage = 10;

  const organizationOptions = useMemo(
    () =>
      organizations.map((org) => ({
        value: org.id,
        label: org.organization_name?.trim() || "Unnamed Organization",
      })),
    [organizations],
  );

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
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return palette[hash % palette.length];
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

  const getLeaveTypeStyle = (type) => {
    switch (type) {
      case "no_pay":
        return "bg-red-100 text-red-700";
      case "normal":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatLeaveType = (type) => {
    if (type === "no_pay") return "No Pay";
    if (type === "normal") return "Normal";
    return type || "N/A";
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "NOT APPROVED":
        return "bg-yellow-100 text-yellow-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (value) => {
    if (!value) return "N/A";

    const m = moment(
      value,
      ["YYYY-MM-DD", "YYYY-MM-DD HH:mm:ss", "DD/MM/YYYY", moment.ISO_8601],
      true,
    );

    return m.isValid() ? m.format("YYYY-MM-DD") : value;
  };

  const getSelectedOrganizationName = () => {
    const selected = organizations.find(
      (org) => String(org.id) === String(organization),
    );
    return selected?.organization_name?.trim() || "";
  };

  const buildParams = useCallback(
    (page = 1, keyword = search.trim(), exportAll = false) => {
      const params = new URLSearchParams();

      if (exportAll) {
        params.append("limit", "all");
      } else {
        params.append("page", page);
        params.append("limit", rowsPerPage);
      }

      if (keyword) params.append("search", keyword);
      if (requestedDateFrom) {
        params.append("requested_date_from", requestedDateFrom);
      }
      if (requestedDateTo) {
        params.append("requested_date_to", requestedDateTo);
      }
      if (requestingDateFrom) {
        params.append("requesting_date_from", requestingDateFrom);
      }
      if (requestingDateTo) {
        params.append("requesting_date_to", requestingDateTo);
      }
      if (categoryName) params.append("category_name", categoryName);
      if (department) params.append("department", department);
      if (approvedStatus) {
        params.append("approved_status_1", approvedStatus);
      }
      if (organization) {
        params.append("organization", organization);
      }

      return params;
    },
    [
      search,
      requestedDateFrom,
      requestedDateTo,
      requestingDateFrom,
      requestingDateTo,
      categoryName,
      department,
      approvedStatus,
      organization,
    ],
  );

  const fetchData = useCallback(
    async (page = 1, keyword = search.trim()) => {
      setLoading(true);
      try {
        const params = buildParams(page, keyword, false);

        const response = await apiFetch(
          `${API_URL}/v1/hris/leave/getleave?${params.toString()}`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error(
            `Error ${response.status}: Failed to fetch leave data`,
          );
        }

        const result = await response.json();
        const totalItems = Number(result?.totalItems || 0);

        setLeaveData(Array.isArray(result?.data) ? result.data : []);
        setTotalRecords(totalItems);
        setTotalPages(Math.ceil(totalItems / rowsPerPage) || 0);
        setCurrentPage(Number(result?.currentPage || page || 1));
      } catch (error) {
        console.error("Leave fetch error:", error);
        setLeaveData([]);
        setTotalRecords(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    },
    [API_URL, rowsPerPage, search, buildParams],
  );

  useEffect(() => {
    const fetchDropdowns = async () => {
      if (!API_URL) return;

      try {
        const organizationPromise = apiFetch(
          `${API_URL}/v1/hris/organizations/organization`,
          {
            method: "GET",
            credentials: "include",
          },
        )
          .then(async (res) => {
            const json = await res.json().catch(() => ({}));
            if (res.ok && Array.isArray(json?.data)) {
              setOrganizations(json.data);
            } else {
              setOrganizations([]);
            }
          })
          .catch((error) => {
            console.error("Organization fetch error:", error);
            setOrganizations([]);
          });

        const categoryPromise = apiFetch(
          `${API_URL}/v1/hris/leave/getLeaveCategory`,
          {
            method: "GET",
            credentials: "include",
          },
        )
          .then(async (res) => {
            const json = await res.json().catch(() => ({}));
            if (res.ok && Array.isArray(json?.data)) {
              setLeaveCategories(json.data);
            } else {
              setLeaveCategories([]);
            }
          })
          .catch((error) => {
            console.error("Category fetch error:", error);
            setLeaveCategories([]);
          });

        const departmentPromise = apiFetch(`${API_URL}/v1/hris/department`, {
          method: "GET",
          credentials: "include",
        })
          .then(async (res) => {
            const json = await res.json().catch(() => ({}));
            if (res.ok && Array.isArray(json?.data)) {
              setDepartments(json.data);
            } else {
              setDepartments([]);
            }
          })
          .catch((error) => {
            console.error("Department fetch error:", error);
            setDepartments([]);
          });

        await Promise.all([
          organizationPromise,
          categoryPromise,
          departmentPromise,
        ]);
      } catch (error) {
        console.error("Dropdown fetch error:", error);
      }
    };

    fetchDropdowns();
  }, [API_URL]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchData(1, search);
    }, 500);

    return () => clearTimeout(timeout);
  }, [search, fetchData]);

  useEffect(() => {
    fetchData(currentPage);
  }, [
    currentPage,
    requestedDateFrom,
    requestedDateTo,
    requestingDateFrom,
    requestingDateTo,
    categoryName,
    department,
    approvedStatus,
    organization,
    fetchData,
  ]);

  const resetFilters = () => {
    setSearch("");
    setRequestedDateFrom("");
    setRequestedDateTo("");
    setRequestingDateFrom("");
    setRequestingDateTo("");
    setCategoryName("");
    setDepartment("");
    setApprovedStatus("");
    setOrganization("");
    setCurrentPage(1);
  };

  const exportToExcel = async () => {
    setIsExporting(true);

    try {
      const params = buildParams(1, search, true);

      const response = await apiFetch(
        `${API_URL}/v1/hris/leave/getleave?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error(
          `Error ${response.status}: Failed to export leave data`,
        );
      }

      const result = await response.json();
      const allData = Array.isArray(result?.data) ? result.data : [];

      if (!allData.length) {
        alert("No data to export.");
        return;
      }

      const selectedOrgName = getSelectedOrganizationName();

      const exportRows = allData.map((leave, index) => ({
        "No.": index + 1,
        "Employee No": leave.employee_no || "",
        "Employee Name": leave.employee_fullname || "",
        Organization:
          selectedOrgName ||
          leave.organization_name ||
          leave.organization ||
          "",
        Department: leave.department || "",
        Designation: leave.designation || "",
        "Applied Date": formatDate(leave.requesting_date),
        "Requested Date": formatDate(leave.requested_date),
        Category: leave.category_name || "",
        "Leave Type": formatLeaveType(leave.leave_type),
        Reason: leave.reason || "",
        Status: leave.approved_status_1 || "",
        Remarks: leave.remarks || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportRows);

      worksheet["!cols"] = [
        { wch: 8 },
        { wch: 16 },
        { wch: 28 },
        { wch: 24 },
        { wch: 22 },
        { wch: 22 },
        { wch: 16 },
        { wch: 16 },
        { wch: 18 },
        { wch: 14 },
        { wch: 40 },
        { wch: 18 },
        { wch: 30 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Leave Report");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(
        blob,
        `leave_approval_report_${moment().format("YYYYMMDD_HHmmss")}.xlsx`,
      );
    } catch (error) {
      console.error("Excel export error:", error);
      alert("Failed to export Excel file.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-[1800px] mx-auto font-montserrat">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Leave Approval Report
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Clock size={16} />
                {totalRecords} leave records
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters((prev) => !prev)}
                className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl shadow-lg border-2 border-gray-200 hover:border-blue-500"
              >
                <Filter size={20} className="text-blue-600" />
                <span className="font-semibold">
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </span>
              </motion.button>

              {hasPermission(3410) && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isExporting}
                  onClick={exportToExcel}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl shadow-lg disabled:opacity-60"
                >
                  <Download size={20} />
                  {isExporting ? "Exporting..." : "Export Excel"}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <Filter size={20} />
                  Filter Options
                </h3>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div>
                  <label className="font-semibold text-gray-700 flex items-center gap-2">
                    <Search size={16} /> Search
                  </label>
                  <input
                    type="text"
                    placeholder="Name / ID / Email..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full mt-2 border-2 border-gray-200 rounded-xl px-4 py-2"
                  />
                </div>

                <div>
                  <label className="font-semibold flex items-center gap-2 text-gray-700 mb-2">
                    <Building2 size={16} /> Organization
                  </label>
                  <Select
                    options={organizationOptions}
                    placeholder="All Organizations"
                    value={
                      organizationOptions.find(
                        (opt) => String(opt.value) === String(organization),
                      ) || null
                    }
                    onChange={(opt) => {
                      setOrganization(opt ? String(opt.value) : "");
                      setCurrentPage(1);
                    }}
                    isClearable
                  />
                </div>

                <div>
                  <label className="font-semibold flex items-center gap-2 text-gray-700">
                    <Calendar size={16} /> Leave Date From
                  </label>
                  <input
                    type="date"
                    value={requestedDateFrom}
                    onChange={(e) => {
                      setRequestedDateFrom(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full mt-2 border-2 border-gray-200 rounded-xl px-4 py-2"
                  />
                </div>

                <div>
                  <label className="font-semibold flex items-center gap-2 text-gray-700">
                    <Calendar size={16} /> Leave Date To
                  </label>
                  <input
                    type="date"
                    value={requestedDateTo}
                    onChange={(e) => {
                      setRequestedDateTo(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full mt-2 border-2 border-gray-200 rounded-xl px-4 py-2"
                  />
                </div>

                <div>
                  <label className="font-semibold flex items-center gap-2 text-gray-700">
                    <Clock size={16} /> Applied Date From
                  </label>
                  <input
                    type="date"
                    value={requestingDateFrom}
                    onChange={(e) => {
                      setRequestingDateFrom(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full mt-2 border-2 border-gray-200 rounded-xl px-4 py-2"
                  />
                </div>

                <div>
                  <label className="font-semibold flex items-center gap-2 text-gray-700">
                    <Clock size={16} /> Applied Date To
                  </label>
                  <input
                    type="date"
                    value={requestingDateTo}
                    onChange={(e) => {
                      setRequestingDateTo(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full mt-2 border-2 border-gray-200 rounded-xl px-4 py-2"
                  />
                </div>

                <div>
                  <label className="font-semibold flex items-center gap-2 text-gray-700">
                    <Tag size={16} /> Leave Category
                  </label>
                  <select
                    value={categoryName}
                    onChange={(e) => {
                      setCategoryName(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full mt-2 border-2 border-gray-200 rounded-xl px-4 py-2 bg-white"
                  >
                    <option value="">All Categories</option>
                    {leaveCategories.map((category) => (
                      <option
                        key={category.id || category.category_name}
                        value={category.category_name}
                      >
                        {category.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold flex items-center gap-2 text-gray-700">
                    <Briefcase size={16} /> Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => {
                      setDepartment(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full mt-2 border-2 border-gray-200 rounded-xl px-4 py-2 bg-white"
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id || dept.name} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold flex items-center gap-2 text-gray-700">
                    <Briefcase size={16} /> Status
                  </label>
                  <select
                    value={approvedStatus}
                    onChange={(e) => {
                      setApprovedStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full mt-2 border-2 border-gray-200 rounded-xl px-4 py-2 bg-white"
                  >
                    <option value="">All Status</option>
                    <option value="APPROVED">Approved</option>
                    <option value="NOT APPROVED">Not Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetFilters}
                    className="w-full flex items-center justify-center gap-2 bg-red-500 text-white px-6 py-3 rounded-xl"
                  >
                    <RefreshCw size={18} />
                    Reset
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  {[
                    "Employee No",
                    "Employee",
                    "Department",
                    "Applied Date",
                    "Category",
                    "Leave Type",
                    "Requested Date",
                    "Reason",
                    "Status",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-6 py-3 text-left text-xs font-bold"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"
                      />
                    </td>
                  </tr>
                ) : leaveData.length > 0 ? (
                  leaveData.map((leave) => (
                    <motion.tr
                      key={leave.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-3 text-blue-600 font-bold">
                        {leave.employee_no}
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
                                leave.employee_fullname || leave.employee_no,
                              )}`}
                              title={leave.employee_fullname}
                            >
                              {getInitials(
                                leave.employee_fullname || leave.employee_no,
                              )}
                            </div>
                          </motion.div>

                          <div>
                            <div className="font-semibold text-gray-800">
                              {leave.employee_fullname || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {leave.employee_no
                                ? `EMP ID: ${leave.employee_no}`
                                : ""}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-3">{leave.department || "N/A"}</td>

                      <td className="px-6 py-3">
                        {leave.requesting_date
                          ? formatDate(leave.requesting_date)
                          : "N/A"}
                      </td>

                      <td className="px-6 py-3">
                        {leave.category_name || "N/A"}
                      </td>

                      <td className="px-6 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getLeaveTypeStyle(
                            leave.leave_type,
                          )}`}
                        >
                          {formatLeaveType(leave.leave_type)}
                        </span>
                      </td>

                      <td className="px-6 py-3">
                        {leave.requested_date
                          ? formatDate(leave.requested_date)
                          : "N/A"}
                      </td>

                      <td className="px-6 py-3 max-w-xs text-xs text-gray-600">
                        {leave.reason || "N/A"}
                      </td>

                      <td className="px-6 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                            leave.approved_status_1,
                          )}`}
                        >
                          {leave.approved_status_1 || "PENDING"}
                        </span>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-10">
                      <Users size={50} className="mx-auto text-gray-400" />
                      <p className="text-gray-600 mt-3">
                        No leave records found
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!loading && leaveData.length > 0 && (
            <div className="p-4 bg-gray-50 flex flex-col md:flex-row gap-3 md:gap-0 items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing{" "}
                <strong>
                  {totalRecords === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}{" "}
                  – {Math.min(currentPage * rowsPerPage, totalRecords) || 0}
                </strong>{" "}
                of <strong>{totalRecords}</strong>
              </div>

              <div className="flex gap-3 items-center">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:border-blue-500 disabled:opacity-50"
                >
                  <ChevronLeft className="inline-block" /> Prev
                </button>

                <div className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm">
                  Page {currentPage} / {totalPages || 1}
                </div>

                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:border-blue-500 disabled:opacity-50"
                >
                  Next <ChevronRight className="inline-block" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Leave_approve_table;
