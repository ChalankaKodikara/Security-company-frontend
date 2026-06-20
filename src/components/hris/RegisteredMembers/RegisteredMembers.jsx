import React, { useEffect, useMemo, useState } from "react";
import { IoEyeOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";

const ITEMS_PER_PAGE = 8;
const PAGE_GROUP_SIZE = 5;

export default function RegisteredMembers() {
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  // Data + status
  const [employeeData, setEmployeeData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [designationOptions, setDesignationOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [organizationOptions, setOrganizationOptions] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    employee_active_status: "",
    employee_nic: "",
    departmentId: "",
    designationId: "",
    epf_no: "",
    organization_id: "", // Changed to organization_id for consistency
  });

  // Effect to reset department/designation filters when organization changes
  useEffect(() => {
   
    setFilters((prevFilters) => ({
      ...prevFilters,
      departmentId: "", // Reset department selection
      designationId: "", // Reset designation selection
    }));
    setDepartmentOptions([]); 
    setDesignationOptions([]); // Clear designation options
  }, [filters.organization_id]); // Only run when organization_id changes


  // Fetch Designations and Departments (Modified to filter by organization_id)
  useEffect(() => {
    const fetchDesignationsAndDepartments = async () => {
      // Only fetch if an organization is selected
      if (!filters.organization_id) {
        setDesignationOptions([]); // Ensure options are cleared if no organization selected
        setDepartmentOptions([]); // Ensure options are cleared if no organization selected
        return;
      }

      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("accessToken="))
          ?.split("=")[1];

        const params = new URLSearchParams();
        params.set("organization_id", filters.organization_id);

        // Fetch designations from the organization-specific endpoint
        const res = await fetch(`${API_URL}/v1/hris/organizations/designations?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        });

        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          // Populate designation options
          setDesignationOptions(
            json.data.map((d) => ({
              value: d.id,
              label: `${d.title} (${d?.Department?.name || "No Dept"})`,
            }))
          );

          // Populate department options from the same response
          const uniqueDepartments = new Map();
          json.data.forEach((d) => {
            if (d.Department && d.Department.id && d.Department.name) {
              uniqueDepartments.set(d.Department.id, {
                value: d.Department.id,
                label: d.Department.name,
              });
            }
          });
          setDepartmentOptions(Array.from(uniqueDepartments.values()));

        } else {
          setDesignationOptions([]);
          setDepartmentOptions([]);
        }
      } catch (err) {
        console.error("Failed to fetch designations and departments", err);
        setDesignationOptions([]);
        setDepartmentOptions([]);
      }
    };

    fetchDesignationsAndDepartments();
  }, [API_URL, filters.organization_id]); // Add filters.organization_id to dependencies


  // Fetch Organizations (unchanged)
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("accessToken="))
          ?.split("=")[1];

        const res = await fetch(`${API_URL}/v1/hris/organizations/organization`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        });

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


  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageGroupStart, setPageGroupStart] = useState(1);

  const visiblePageNumbers = useMemo(() => {
    const remaining = Math.max(totalPages - pageGroupStart + 1, 0);
    const len = Math.min(PAGE_GROUP_SIZE, remaining);
    return Array.from({ length: len }, (_, i) => pageGroupStart + i);
  }, [pageGroupStart, totalPages]);


  // Fetch Employees
  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      setFetchError("");

      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("accessToken="))
        ?.split("=")[1];

      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(ITEMS_PER_PAGE),
      });

      if (filters.search.trim())
        params.set("search", filters.search.trim());

      if (filters.employee_active_status)
        params.set("employee_active_status", filters.employee_active_status);

      if (filters.employee_nic.trim())
        params.set("employee_nic", filters.employee_nic.trim());

      if (filters.departmentId)
        params.set("departmentId", filters.departmentId);

      if (filters.designationId)
        params.set("designationId", filters.designationId);

      if (filters.epf_no.trim())
        params.set("epf_no", filters.epf_no.trim());

      if (filters.organization_id) // Using organization_id
        params.set("organization", filters.organization_id);


      const res = await fetch(
        `${API_URL}/v1/hris/employees/employee/all-details?${params.toString()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        }
      );
      const json = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);

      const data = Array.isArray(json?.data) ? json.data : [];
      setEmployeeData(data);
      setTotalRecords(Number(json?.totalRecords) || data.length || 0);
      setTotalPages(Number(json?.totalPages) || 1);

      const serverPage = Number(json?.page) || currentPage;
      if (serverPage !== currentPage) setCurrentPage(serverPage);
    } catch (err) {
      setEmployeeData([]);
      setTotalRecords(0);
      setTotalPages(1);
      setFetchError("Failed to fetch employees.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger fetch on filters/page change
  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, currentPage]);

  // Reset pagination group when page changes out of range
  useEffect(() => {
    if (currentPage < pageGroupStart) setPageGroupStart(currentPage);
    if (currentPage >= pageGroupStart + PAGE_GROUP_SIZE)
      setPageGroupStart(currentPage - PAGE_GROUP_SIZE + 1);
  }, [currentPage, pageGroupStart]);

  const goToPreviousPageGroup = () => {
    const newStart = Math.max(1, pageGroupStart - PAGE_GROUP_SIZE);
    setPageGroupStart(newStart);
    setCurrentPage(newStart);
  };

  const goToNextPageGroup = () => {
    const maxStart = Math.max(1, totalPages - PAGE_GROUP_SIZE + 1);
    const newStart = Math.min(pageGroupStart + PAGE_GROUP_SIZE, maxStart);
    setPageGroupStart(newStart);
    setCurrentPage(newStart);
  };

  const avatarBgClass = (seed = "") => {
    const palette = [
      "bg-sky-500", "bg-indigo-500", "bg-emerald-500", "bg-rose-500",
      "bg-amber-500", "bg-teal-500", "bg-fuchsia-500", "bg-cyan-500",
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

  return (

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="font-montserrat"
    >
      {/* PAGE TITLE */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
            Registered Employee List
          </h1>
          <p className="text-gray-500 text-sm">Complete directory of all employees</p>
        </div>
      </div>

      {/* FILTER SECTION */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-5 mb-6 bg-white/70 backdrop-blur-xl border border-gray-200 shadow-md rounded-xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">

          {/* Organization */}
          <div>
            <label className="text-[12px] font-semibold text-gray-600">Organization</label>
            <Select
              options={organizationOptions}
              placeholder="Select Organization"
              value={organizationOptions.find(
                (opt) => opt.value === Number(filters.organization_id)
              ) || null}
              onChange={(opt) =>
                setFilters((f) => ({ ...f, organization_id: opt ? opt.value : "" }))
              }
              isClearable
            />
          </div>

          {/* Search */}
          <div>
            <label className="text-[12px] font-semibold text-gray-600">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Employee No / Name"
                className="border border-gray-300 rounded-lg px-3 py-2 w-full pr-10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={filters.search}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, search: e.target.value }))
                }
              />
              <i className="absolute right-3 top-3 text-gray-400">
                🔍
              </i>
            </div>
          </div>

          {/* EPF */}
          <div>
            <label className="text-[12px] font-semibold text-gray-600">EPF No</label>
            <input
              type="text"
              placeholder="EPF No"
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={filters.epf_no}
              onChange={(e) =>
                setFilters((f) => ({ ...f, epf_no: e.target.value }))
              }
            />
          </div>

          {/* Department */}
          <div>
            <label className="text-[12px] font-semibold text-gray-600">Department</label>
            <Select
              options={departmentOptions}
              placeholder="Select Department"
              value={departmentOptions.find(
                (opt) => opt.value === Number(filters.departmentId)
              ) || null}
              onChange={(opt) =>
                setFilters((f) => ({ ...f, departmentId: opt ? opt.value : "" }))
              }
              isClearable
              isDisabled={!filters.organization_id}
            />
          </div>

          {/* Designation */}
          <div>
            <label className="text-[12px] font-semibold text-gray-600">Designation</label>
            <Select
              options={designationOptions}
              placeholder="Select Designation"
              value={designationOptions.find(
                (opt) => opt.value === Number(filters.designationId)
              ) || null}
              onChange={(opt) =>
                setFilters((f) => ({ ...f, designationId: opt ? opt.value : "" }))
              }
              isClearable
              isDisabled={!filters.organization_id}
            />
          </div>

          {/* NIC */}
          <div>
            <label className="text-[12px] font-semibold text-gray-600">NIC</label>
            <input
              type="text"
              placeholder="NIC"
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={filters.employee_nic}
              onChange={(e) =>
                setFilters((f) => ({ ...f, employee_nic: e.target.value }))
              }
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-[12px] font-semibold text-gray-600">Status</label>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={filters.employee_active_status}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  employee_active_status: e.target.value,
                }))
              }
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Reset Button */}
          <div className="flex items-end">
            <button
              className="w-full bg-red-500 text-white px-3 py-2 rounded-lg shadow hover:bg-red-600 transition-all"
              onClick={() => {
                setFilters({
                  search: "",
                  employee_active_status: "",
                  employee_nic: "",
                  departmentId: "",
                  designationId: "",
                  epf_no: "",
                  organization_id: "",
                });
                setCurrentPage(1);
                setPageGroupStart(1);
              }}
            >
              Reset Filters
            </button>
          </div>

        </div>
      </motion.div>

      {/* TABLE */}
      <div className="bg-white shadow-xl rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <tr>
              {[
                "Employee No",
                "Full Name",
                "Calling Name",
                "Gender",
                "Email",
                "NIC",
                "Contact",
                "Department",
                "Designation",
                "Actions",
              ].map((head, idx) => (
                <th key={idx} className="py-3 px-4 text-left font-semibold tracking-wide">
                  {head}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={10} className="py-10 text-center text-gray-500">Loading...</td>
              </tr>
            ) : employeeData.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-10 text-center text-gray-500">No data available</td>
              </tr>
            ) : (
              employeeData.map((emp) => (
                <motion.tr
                  key={emp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.01, backgroundColor: "#f9fafb" }}
                  className="border-b border-gray-100"
                >
                  <td className="py-3 px-4">{emp.employee_no || "—"}</td>

                  {/* Full Name with Avatar */}
                  <td className="py-3 px-4 font-medium text-gray-800">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-9 h-9 flex items-center justify-center rounded-full text-white text-xs font-semibold ring-2 ring-offset-2 ring-offset-white ${avatarBgClass(
                          emp.employee_fullname || emp.employee_no
                        )}`}
                      >
                        {getInitials(emp.employee_fullname)}
                      </div>
                      {emp.employee_fullname || "—"}
                    </div>
                  </td>

                  <td className="py-3 px-4">{emp.employee_calling_name || "—"}</td>
                  <td className="py-3 px-4">{emp.employee_gender || "—"}</td>
                  <td className="py-3 px-4">{emp.employee_email || "—"}</td>
                  <td className="py-3 px-4">{emp.employee_nic || "—"}</td>
                  <td className="py-3 px-4">{emp.employee_contact_no || "—"}</td>
                  <td className="py-3 px-4">{emp.department_name || "—"}</td>
                  <td className="py-3 px-4">{emp.designation_name || "—"}</td>

                  <td className="py-3 px-4">
                    <button
                      className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow hover:bg-blue-700 transition-all"
                      onClick={() =>
                        navigate(
                          `/view-registered-members?employee_no=${encodeURIComponent(
                            emp.employee_no || ""
                          )}`
                        )
                      }
                    >
                      <IoEyeOutline size={16} /> View
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-3">
          <span className="text-gray-500 text-sm">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} –{" "}
            {(currentPage - 1) * ITEMS_PER_PAGE + employeeData.length} of {totalRecords}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToPreviousPageGroup}
              disabled={pageGroupStart === 1 || currentPage === 1}
              className={`px-4 py-2 rounded-lg border shadow-sm text-sm transition-all ${pageGroupStart === 1 || currentPage === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
            >
              Previous
            </button>

            {visiblePageNumbers.map((n) => (
              <button
                key={n}
                onClick={() => setCurrentPage(n)}
                className={`px-4 py-2 rounded-lg border shadow-sm text-sm transition-all ${currentPage === n
                  ? "bg-blue-600 text-white"
                  : "bg-white hover:bg-gray-100 text-gray-700"
                  }`}
              >
                {n}
              </button>
            ))}

            <button
              type="button"
              onClick={goToNextPageGroup}
              disabled={pageGroupStart + PAGE_GROUP_SIZE > totalPages || currentPage === totalPages}
              className={`px-4 py-2 rounded-lg border shadow-sm text-sm transition-all ${pageGroupStart + PAGE_GROUP_SIZE > totalPages || currentPage === totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </motion.div>
  );

}