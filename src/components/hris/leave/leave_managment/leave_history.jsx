/** @format */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaWalking, FaListAlt } from "react-icons/fa";
import usePermissions from "../../../permissions/permission";
import moment from "moment";
import { MdKeyboardArrowDown } from "react-icons/md";
import Cookies from "js-cookie";
import { apiFetch } from "../../../../utils/apiClient";

const LeaveHistory = () => {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const [leaveData, setLeaveData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [departments, setDepartments] = useState([]);

  const [leaveCategories, setLeaveCategories] = useState([]);

  const [employeeNo, setEmployeeNo] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [department, setDepartment] = useState("");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { hasPermission } = usePermissions();
  const rowsPerPage = 10;

  useEffect(() => {
    const fetchLeaveHistory = async () => {
      const token = Cookies.get("accessToken");
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: currentPage,
          limit: rowsPerPage,
        });

        if (employeeNo) params.append("employee_no", employeeNo);
        if (requestedDate) params.append("requested_date", requestedDate);
        if (categoryName) params.append("category_name", categoryName);
        if (department) params.append("department", department);

        const response = await apiFetch(
          `${API_URL}/v1/hris/leave/getleave-2?${params.toString()}`,
          {
            credentials: "include",
          }
        );
        const result = await response.json();

        setLeaveData(result.data || []);
        setTotalPages(Math.ceil(result.totalItems / rowsPerPage));
      } catch (error) {
        console.error("Error fetching leave history:", error);
        setError(error.message);
        setLeaveData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveHistory();
  }, [
    currentPage,
    employeeNo,
    requestedDate,
    categoryName,
    department,
    API_URL,
  ]);

  useEffect(() => {
    const fetchLeaveCategories = async () => {
      const token = Cookies.get("accessToken");
      try {
        const response = await apiFetch(
          `${API_URL}/v1/hris/leave/getLeaveCategory`,
          {
            credentials: "include",
          }
        );
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          const categoryNames = result.data.map((cat) => cat.category_name);
          setLeaveCategories(categoryNames);
        }
      } catch (error) {
        console.error("Error fetching leave categories:", error);
      }
    };
    fetchLeaveCategories();
  }, [API_URL]);

  useEffect(() => {
    const fetchDepartments = async () => {
      const token = Cookies.get("accessToken");
      try {
        // Corrected URL from /department to /departments
        const response = await apiFetch(`${API_URL}/v1/hris/department`, {
          credentials: "include",
        });
        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          const departmentNames = result.data.map((dep) => dep.name);
          setDepartments(["All Departments", ...departmentNames]);
        } else {
          setDepartments(["All Departments"]);
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
        setDepartments(["All Departments"]);
      }
    };
    fetchDepartments();
  }, [API_URL]);

  const handleDepartmentSelect = (selectedDept) => {
    setDepartment(selectedDept === "All Departments" ? "" : selectedDept);
    setIsDropdownOpen(false);
  };

  const getInitials = (fullName = "", fallback = "??") => {
    if (!fullName) return fallback.slice(0, 2).toUpperCase();
    const tokens = String(fullName).trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return "??";
    if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
    const first = tokens[0][0] || "";
    const last = tokens[tokens.length - 1][0] || "";
    return (first + last).toUpperCase();
  };

  return (
    <div>
      <div className="mt-5">
        <div className="flex space-x-4 mt-5 mb-5">
          {/* {hasPermission(1100) && ( */}
          <Link to="/leave-management">
            <div className="w-48 h-32 flex flex-col items-center justify-center border rounded-lg shadow-sm hover:shadow-md cursor-pointer transition-shadow">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2">
                <FaWalking className="text-gray-500" size={20} />
              </div>
              <p className="text-gray-500 text-sm">Employee Leaves</p>
            </div>
          </Link>
          {/* )} */}
          {hasPermission(1003) && (
            <Link to="/assign-employee-leave">
              <div className="w-48 h-32 flex flex-col items-center justify-center border rounded-lg shadow-xl hover:shadow-md cursor-pointer transition-shadow">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-2">
                  <FaListAlt className="text-white" size={20} />
                </div>
                <p className="text-gray-500 text-sm font-bold">Assign Leaves</p>
              </div>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg shadow-sm bg-gray-50">
          <input
            type="date"
            value={requestedDate}
            onChange={(e) => setRequestedDate(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="text"
            placeholder="Filter by Employee No..."
            value={employeeNo}
            onChange={(e) => setEmployeeNo(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {leaveCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <div className="relative">
            <button
              className="w-full text-left bg-white border border-gray-300 rounded-lg p-2 flex justify-between items-center"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>{department || "All Departments"}</span>
              <MdKeyboardArrowDown />
            </button>
            {isDropdownOpen && (
              <ul className="absolute mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                {departments.map((dept, index) => (
                  <li
                    key={index}
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

        <div className="table-container bg-white shadow p-2 rounded-xl">
          <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-900">
                  Employee ID
                </th>
                <th className="px-6 py-3 font-medium text-gray-900">
                  Employee
                </th>
                <th className="px-6 py-3 font-medium text-gray-900">
                  Leave Category
                </th>
                <th className="px-6 py-3 font-medium text-gray-900">
                  Requested Date
                </th>
                <th className="px-6 py-3 font-medium text-gray-900">
                  Department
                </th>
                <th className="px-6 py-3 font-medium text-gray-900">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-red-500">
                    Error: {error}
                  </td>
                </tr>
              ) : leaveData.length > 0 ? (
                leaveData.map((leave) => (
                  <tr
                    key={leave.id}
                    className="hover:bg-blue-50 cursor-pointer"
                  >
                    <td className="px-6 py-4">{leave.employee_no}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-300 flex items-center justify-center text-white font-bold">
                          {getInitials(
                            leave.employee_fullname,
                            leave.employee_no
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {leave.employee_fullname || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {leave.employee_email || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {leave.category_name || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      {moment(leave.requested_date).format("YYYY-MM-DD")}
                    </td>
                    <td className="px-6 py-4">{leave.department || "N/A"}</td>
                    <td className="px-6 py-4">{leave.reason || "N/A"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No leave history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-center items-center space-x-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Page {currentPage} of {totalPages > 0 ? totalPages : 1}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0 || loading}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveHistory;
