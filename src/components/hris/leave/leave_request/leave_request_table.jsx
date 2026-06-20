/** @format */
import moment from "moment";
import React, { useState, useEffect } from "react";
import { FaArrowRight } from "react-icons/fa";
import { MdKeyboardArrowDown } from "react-icons/md";
import Papa from "papaparse";
import "react-datepicker/dist/react-datepicker.css";
import Leave_Request_Popup from "./leave_request_popup";
import Cookies from "js-cookie";
import usePermissions from "../../../permissions/permission";
import { API_URL } from "../../../../utils/apiClient";
const Leave_request_table = () => {
  const { hasPermission } = usePermissions();

  const [leaveData, setLeaveData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(""); // 🔹 Universal search
  const [requestedDate, setRequestedDate] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [department, setDepartment] = useState("");

  const [leaveCategories, setLeaveCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Popup
  const [isRqstOpen, setIsRqstOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);

  const rowsPerPage = 5;
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const token = Cookies.get("accessToken");
  // 🔹 Fetch leave data (only NOT APPROVED)
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: rowsPerPage,
        approved_status_1: "NOT APPROVED", //  Only fetch NOT APPROVED
      });

      if (search) params.append("search", search);
      if (requestedDate && requestedDate !== "") {
        params.append("requested_date", requestedDate);
      }
      if (categoryName) params.append("category_name", categoryName);
      if (department) params.append("department", department);

      const res = await apiFetch(`${API_URL}/v1/hris/leave/getleave?${params}`);

      const result = await res.json();

      if (result && result.data) {
        setLeaveData(result.data);
        setTotalRecords(result.totalItems || result.data.length);
        setTotalPages(
          Math.ceil((result.totalItems || result.data.length) / rowsPerPage),
        );
      } else {
        setLeaveData([]);
        setTotalRecords(0);
        setTotalPages(0);
      }
    } catch (err) {
      console.error("Error fetching leave data:", err);
      setLeaveData([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchData();
    }, 600); // fetch after 600ms
    return () => clearTimeout(timeout);
  }, [search, currentPage, requestedDate, categoryName, department]);

  // 🔹 Fetch leave categories
  useEffect(() => {
    const fetchLeaveCategories = async () => {
      try {
        const res = await apiFetch(`${API_URL}/v1/hris/leave/getLeaveCategory`);
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          setLeaveCategories(result.data.map((c) => c.category_name));
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchLeaveCategories();
  }, []);

  // 🔹 Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await apiFetch(`${API_URL}/v1/hris/department`);
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          const deptNames = result.data.map((dep) => dep.name);
          setDepartments(["All Departments", ...deptNames]);
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };
    fetchDepartments();
  }, []);

  // 🔹 Handle department select
  const handleDepartmentSelect = (selectedDept) => {
    setDepartment(selectedDept === "All Departments" ? "" : selectedDept);
    setIsDropdownOpen(false);
  };

  // 🔹 Toggle popup
  const toggleRqstPopup = (leaveId) => {
    setSelectedLeaveId(leaveId);
    setIsRqstOpen(!isRqstOpen);
  };

  // 🔹 Export CSV
  const exportToCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (requestedDate) params.append("requested_date", requestedDate);
      if (categoryName) params.append("category_name", categoryName);
      if (department) params.append("department", department);

      const res = await apiFetch(`${API_URL}/v1/hris/leave/getleave?${params}`);

      const result = await res.json();
      const allData = result.data || [];

      if (allData.length === 0) return alert("No data to export.");

      const csvData = allData.map((leave) => ({
        "Employee ID": leave.employee_no,
        "Employee Name": leave.employee_fullname,
        Department: leave.department,
        "Applied Date": moment(leave.requesting_date).format("YYYY-MM-DD"),
        "Leave Category": leave.category_name,
        "Requested Date": moment(leave.requested_date).format("YYYY-MM-DD"),
        Reason: leave.reason,
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "leave_requests.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting CSV:", error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-[22px] font-semibold mb-4">
        Employee Leave Requests
      </h2>

      {/* 🔹 Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 border rounded-lg shadow-sm">
        <input
          type="text"
          className="border border-gray-300 rounded-lg p-2"
          placeholder="Search by Name, ID, or Email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="date"
          className="border border-gray-300 rounded-lg p-2"
          value={requestedDate || ""}
          onChange={(e) => setRequestedDate(e.target.value || null)}
        />

        <select
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          className="border border-gray-300 rounded-lg p-2"
        >
          <option value="">All Categories</option>
          {leaveCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <div className="relative">
          <button
            className="w-full bg-white border border-gray-300 rounded-lg p-2 flex justify-between items-center"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span>{department || "All Departments"}</span>
            <MdKeyboardArrowDown />
          </button>
          {isDropdownOpen && (
            <ul className="absolute mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10">
              {departments.map((dept, idx) => (
                <li
                  key={idx}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleDepartmentSelect(dept)}
                >
                  {dept}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 🔹 Export Button */}
      <div className="flex justify-end mb-4">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          onClick={exportToCSV}
        >
          Export CSV
        </button>
      </div>

      {/* 🔹 Table */}
      <table className="min-w-full divide-y divide-gray-200 shadow-lg rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            {[
              "ID",
              "Employee Name",
              "Department",
              "Applied Date",
              "half day /full day",
              "Requested Date",
              "Reason",
              "Action",
            ].map((header) => (
              <th
                key={header}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            <tr>
              <td colSpan="8" className="text-center py-4">
                Loading...
              </td>
            </tr>
          ) : leaveData.length > 0 ? (
            leaveData.map((leave) => (
              <tr key={leave.id}>
                <td className="px-6 py-4">{leave.employee_no}</td>
                <td className="px-6 py-4">
                  {leave.employee_fullname || "N/A"}
                </td>
                <td className="px-6 py-4">{leave.department || "N/A"}</td>
                <td className="px-6 py-4">
                  {moment(leave.requesting_date).format("YYYY-MM-DD")}
                </td>
                <td className="px-6 py-4">
                  {leave.category_name
                    ? `${leave.category_name.trim()} ${
                        leave.is_half_day === 1
                          ? "(Half Day Leave)"
                          : "(Full Day Leave)"
                      }`
                    : "N/A"}
                </td>

                <td className="px-6 py-4">
                  {moment(leave.requested_date).format("YYYY-MM-DD")}
                </td>
                <td className="px-6 py-4">{leave.reason || "N/A"}</td>
                <td className="px-6 py-4">
                  {hasPermission(10004) && (
                    <button
                      className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      onClick={() => toggleRqstPopup(leave.id)}
                    >
                      <FaArrowRight />
                    </button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="text-center py-4 text-gray-500">
                No leave requests found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 🔹 Pagination */}
      <div className="flex justify-between items-center py-3 text-sm">
        <div>
          Showing{" "}
          {loading || leaveData.length === 0
            ? 0
            : (currentPage - 1) * rowsPerPage + 1}{" "}
          to {Math.min(currentPage * rowsPerPage, totalRecords)} of{" "}
          {totalRecords} results
        </div>
        <div className="flex space-x-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 border rounded-md ${
                currentPage === page ? "bg-blue-500 text-white" : "bg-white"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      </div>

      {isRqstOpen && selectedLeaveId && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-800 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 relative">
            <button
              className="absolute top-2 right-2 text-gray-500"
              onClick={() => setIsRqstOpen(false)}
            >
              Close
            </button>
            <Leave_Request_Popup
              leaveId={selectedLeaveId}
              onClose={() => {
                setIsRqstOpen(false);
                fetchData(); // refresh after closing popup
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Leave_request_table;
