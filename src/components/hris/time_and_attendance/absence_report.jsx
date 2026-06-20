/** @format */

import React, { useState, useEffect } from "react";
import moment from "moment";
import { saveAs } from "file-saver";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserX,
  Search,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Building2,
  MapPin,
  Users,
} from "lucide-react";
import { apiFetch } from "../../../utils/apiClient";
const Absence_Report = ({ selectedDate }) => {
  const [absenteeData, setAbsenteeData] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showFilters, setShowFilters] = useState(true);
  const [filterDate, setFilterDate] = useState(
    selectedDate || moment().format("YYYY-MM-DD")
  );
  const [search, setSearch] = useState("");
  const [departmentDesignationId, setDepartmentDesignationId] = useState("");
  const [workingOffice, setWorkingOffice] = useState("");
  const [organizationOptions, setOrganizationOptions] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedOrganizationFilter, setSelectedOrganizationFilter] = useState("");
  const rowsPerPage = 10;
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const [departments, setDepartments] = useState([]);
  const [workingOffices, setWorkingOffices] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedWorkingOffice, setSelectedWorkingOffice] = useState("");
  const [triggerSearch, setTriggerSearch] = useState(false);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const res = await apiFetch(
          `${API_URL}/v1/hris/organizations/organization`,
        );

        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setOrganizationOptions(
            json.data.map((org) => ({
              value: org.id,
              label: org.organization_name,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch organizations", err);
      }
    };

    fetchOrganizations();
  }, [API_URL]);

  useEffect(() => {
    const fetchDesignations = async () => {
      try {
        const res = await apiFetch(`${API_URL}/v1/hris/designation`, {
        });
        const data = await res.json();
        if (data.success) setDesignations(data.data || []);
      } catch (err) {
        console.error("Error fetching designations:", err);
      }
    };
    fetchDesignations();
  }, [API_URL]);

  useEffect(() => {
    const fetchAbsenteeData = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          date: moment(filterDate).format("YYYY-MM-DD"),
          page: currentPage,
          limit: rowsPerPage,
        });

        if (search) params.append("search", search);
        if (selectedDepartment) params.append("department_designation_id", selectedDepartment);
        if (selectedWorkingOffice) params.append("working_office", selectedWorkingOffice);
        if (selectedOrganizationFilter) params.append("organization", selectedOrganizationFilter);

        const response = await apiFetch(
          `${API_URL}/v1/hris/new-attendence/absentees?${params.toString()}`,
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setAbsenteeData(result.data || []);
        setTotalPages(result.totalPages || 0);
        setTotalRecords(result.total || 0);
      } catch (err) {
        setError(err.message);
        setAbsenteeData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAbsenteeData();
  }, [triggerSearch, currentPage]);

  const avatarBgClass = (seed = "") => {
    const palette = [
      "from-blue-500 to-blue-600",
      "from-purple-500 to-purple-600",
      "from-green-500 to-green-600",
      "from-pink-500 to-pink-600",
      "from-yellow-500 to-yellow-600",
      "from-teal-500 to-teal-600",
      "from-indigo-500 to-indigo-600",
      "from-red-500 to-red-600",
    ];
    let hash = 0;
    for (let i = 0; i < seed.length; i++)
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
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

  const getDesignationTitle = (id) => {
    const des = designations.find((d) => d.id === Number(id));
    if (!des) return id || "N/A";
    return `${des.Department?.name || "N/A"} - ${des.title}`;
  };

  const exportToCSV = async () => {
    if (totalRecords === 0) {
      alert("No data available to export.");
      return;
    }

    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        date: moment(filterDate).format("YYYY-MM-DD"),
      });
      if (search) params.append("search", search);
      if (departmentDesignationId)
        params.append("designation_title", departmentDesignationId);
      if (workingOffice) params.append("working_office", workingOffice);
      if (selectedOrganizationFilter)
        params.append("organization_id", selectedOrganizationFilter);

      const response = await apiFetch(
        `${API_URL}/v1/hris/new-attendence/absentees?${params.toString()}`,
       
      );
      if (!response.ok)
        throw new Error("Failed to fetch full data for export.");

      const result = await response.json();
      const allData = result.data || [];
      if (allData.length === 0) {
        alert("No data found for the selected filters.");
        return;
      }

      const headers = [
        "Employee No",
        "Employee Name",
        "Calling Name",
        "Dept/Designation",
        "Working Office",
        "Branch",
      ];
      const csvRows = [headers.join(",")];

      for (const row of allData) {
        const values = [
          row.employee_no,
          row.employee_fullname,
          row.employee_calling_name,
          getDesignationTitle(row.designation_title),
          row.working_office_name,
          row.branch_name,
        ].map((value) => `"${String(value || "N/A").replace(/"/g, '""')}"`);
        csvRows.push(values.join(","));
      }

      const csvString = csvRows.join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, `absentee_report_${moment().format("YYYY-MM-DD")}.csv`);
    } catch (err) {
      console.error("CSV Export Error:", err);
      alert("An error occurred while exporting the data.");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      if (!selectedOrganizationFilter) {
        setDepartments([]);
        return;
      }
      try {
        const res = await apiFetch(
          `${API_URL}/v1/hris/organizations/departments?organization_id=${selectedOrganizationFilter}`,
        );
        const data = await res.json();
        if (data.success) {
          setDepartments(
            data.data.map((d) => ({
              value: d.id,
              label: d.name,
            }))
          );
        } else {
          setDepartments([]);
        }
      } catch (err) {
        console.error("Failed to fetch departments:", err);
        setDepartments([]);
      }
    };
    fetchDepartments();
  }, [API_URL, selectedOrganizationFilter]);

  useEffect(() => {
    const fetchWorkingOffices = async () => {
      if (!selectedOrganizationFilter) {
        setWorkingOffices([]);
        return;
      }
      try {
        const res = await apiFetch(
          `${API_URL}/v1/hris/organizations/working-offices?organization_id=${selectedOrganizationFilter}`,
        );
        const data = await res.json();
        if (data.success) {
          setWorkingOffices(
            data.data.map((w) => ({
              value: w.id,
              label: w.name,
            }))
          );
        } else {
          setWorkingOffices([]);
        }
      } catch (err) {
        console.error("Failed to fetch working offices:", err);
        setWorkingOffices([]);
      }
    };
    fetchWorkingOffices();
  }, [API_URL,  selectedOrganizationFilter]);

  const customSelectStyles = {
    control: (base) => ({
      ...base,
      borderRadius: "12px",
      border: "2px solid #e5e7eb",
      boxShadow: "none",
      padding: "4px",
      "&:hover": {
        border: "2px solid #3b82f6",
      },
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "12px",
      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
      zIndex: 9999,
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className="p-4 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl shadow-lg"
              >
                <UserX className="text-white" size={32} />
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600">
                  Absence Report
                </h1>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <Users size={16} />
                  {totalRecords} absent employees
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl shadow-lg border-2 border-gray-200 hover:border-blue-500 transition-all"
              >
                <Filter size={20} className="text-blue-600" />
                <span className="font-semibold text-gray-700">
                  {showFilters ? "Hide" : "Show"} Filters
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportToCSV}
                disabled={isExporting || totalRecords === 0}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={20} />
                <span className="font-semibold">
                  {isExporting ? "Exporting..." : "Export CSV"}
                </span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <Filter size={20} />
                  Filter Options
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Date Filter */}
                  <div>
                    <label className=" text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar size={16} />
                      Date
                    </label>
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>

                  {/* Search */}
                  <div>
                    <label className=" text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Search size={16} />
                      Search
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        placeholder="Employee No / Name..."
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Organization */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Organization
                    </label>
                    <Select
                      options={organizationOptions}
                      placeholder="Select Organization"
                      value={
                        organizationOptions.find(
                          (opt) => opt.value === Number(selectedOrganizationFilter)
                        ) || null
                      }
                      onChange={(opt) => {
                        setSelectedOrganizationFilter(opt ? opt.value : "");
                        setCurrentPage(1);
                      }}
                      isClearable
                      styles={customSelectStyles}
                      menuPortalTarget={document.body}
                    />

                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Department
                    </label>
                    <Select
                      options={departments}
                      placeholder="Select Department"
                      value={departments.find((opt) => opt.value === selectedDepartment) || null}
                      onChange={(opt) => {
                        setSelectedDepartment(opt ? opt.value : "");
                        setCurrentPage(1);
                      }}
                      isClearable
                      isDisabled={!selectedOrganizationFilter}
                      styles={customSelectStyles}
                      menuPortalTarget={document.body}
                    />

                  </div>

                  {/* Working Office */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Working Office
                    </label>
                    <Select
                      options={workingOffices}
                      placeholder="Select Working Office"
                      value={
                        workingOffices.find((opt) => opt.value === selectedWorkingOffice) || null
                      }
                      onChange={(opt) => {
                        setSelectedWorkingOffice(opt ? opt.value : "");
                        setCurrentPage(1);
                      }}
                      isClearable
                      isDisabled={!selectedOrganizationFilter}
                      styles={customSelectStyles}
                      menuPortalTarget={document.body}
                    />

                  </div>

                  {/* Search Button */}
                  <div className="flex items-end">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setCurrentPage(1);
                        setTriggerSearch((prev) => !prev);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
                    >
                      <Search size={18} />
                      Search
                    </motion.button>
                  </div>

                  {/* Reset Button */}
                  <div className="flex items-end">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedDepartment("");
                        setSelectedWorkingOffice("");
                        setSelectedOrganizationFilter("");
                        setSearch("");
                        setFilterDate(moment().format("YYYY-MM-DD"));
                        setCurrentPage(1);
                        setTriggerSearch((prev) => !prev);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:from-red-600 hover:to-pink-600 transition-all"
                    >
                      <RefreshCw size={18} />
                      Reset
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Employee Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Calling Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Dept / Designation
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Working Office
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Branch
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"
                      />
                      <p className="text-gray-500 mt-4 font-medium">Loading absent employees...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12">
                      <div className="p-4 bg-red-50 rounded-xl inline-block">
                        <p className="text-red-600 font-semibold">Error: {error}</p>
                      </div>
                    </td>
                  </tr>
                ) : absenteeData.length > 0 ? (
                  absenteeData.map((row, idx) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-gray-100 transition-colors"
                    >
                     
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="relative"
                          >
                            <div className="absolute inset-0 rounded-full ring-2 ring-blue-500 ring-offset-2" />
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg bg-gradient-to-br ${avatarBgClass(
                                row.employee_fullname || row.employee_no
                              )}`}
                            >
                              {getInitials(row.employee_fullname || row.employee_no)}
                            </div>
                          </motion.div>
                          <div>
                            <div className="font-semibold text-gray-800">
                              {row.employee_fullname}
                            </div>
                            <div className="text-xs text-gray-500">
                            {row.employee_no}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {row.employee_calling_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {getDesignationTitle(row.designation_title)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2 text-gray-700">
                          <Building2 size={16} className="text-blue-500" />
                          {row.working_office_name || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2 text-gray-700">
                          <MapPin size={16} className="text-green-500" />
                          {row.branch_name || "N/A"}
                        </span>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <UserX className="text-gray-400 mb-4" size={64} />
                        <p className="text-gray-600 font-semibold text-lg">
                          No absent employees found
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                          Try adjusting your filters or date
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && absenteeData.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-bold text-gray-800">
                    {totalRecords > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-gray-800">
                    {Math.min(currentPage * rowsPerPage, totalRecords)}
                  </span>{" "}
                  of <span className="font-bold text-gray-800">{totalRecords}</span> results
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-gray-700"
                  >
                    <ChevronLeft size={18} />
                    Previous
                  </motion.button>

                  <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg">
                    Page {currentPage} of {totalPages > 0 ? totalPages : 1}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0 || loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-gray-700"
                  >
                    Next
                    <ChevronRight size={18} />
                  </motion.button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Absence_Report;