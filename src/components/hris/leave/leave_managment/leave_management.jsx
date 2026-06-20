/** @format */

import React, { useEffect, useState } from "react";
import { FaWalking, FaListAlt } from "react-icons/fa";
import { saveAs } from "file-saver";
import Cookies from "js-cookie";
import { Link } from "react-router-dom";
import usePermissions from "../../../permissions/permission";
import { motion } from "framer-motion";
import { apiFetch } from "../../../../utils/apiClient";
const LeaveManagement = () => {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const token = Cookies.get("accessToken");
  const { hasPermission } = usePermissions();
  const [organizations, setOrganizations] = useState([]);
  const [organizationId, setOrganizationId] = useState("");
  const [leaveData, setLeaveData] = useState([]);
  const [leaveCategories, setLeaveCategories] = useState([]);
  const [department, setDepartment] = useState("");
  const [search, setSearch] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const rowsPerPage = 10;

  useEffect(() => {
    const fetchLeaveCategories = async () => {
      try {
        const params = new URLSearchParams();
        if (organizationId) params.append("organization", organizationId);

        const response = await apiFetch(
          `${API_URL}/v1/hris/leave/getLeaveCategory?${params.toString()}`,
          
        );

        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          setLeaveCategories(
            result.data.map((cat) => ({
              id: cat.id,
              name: cat.category_name,
            }))
          );
        } else {
          setLeaveCategories([]); // If no data
        }
      } catch (error) {
        console.error("Error fetching leave categories:", error);
        setLeaveCategories([]);
      }
    };

    fetchLeaveCategories();
  }, [API_URL, token, organizationId]);


  useEffect(() => {
    const fetchLeaves = async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: currentPage,
          limit: rowsPerPage,
        });

        if (search) params.append("search", search);
        if (department) params.append("department", department);
        if (organizationId) params.append("organization_id", organizationId);

        const response = await apiFetch(
          `${API_URL}/v1/hris/leave/GetLeaveCountstoallemployee?${params.toString()}`,
        );

        const result = await response.json();

        if (!response.ok)
          throw new Error(result.error || "Failed to fetch data");

        setLeaveData(result.data || []);
        setTotalPages(Math.ceil(result.totalItems / rowsPerPage));
      } catch (error) {
        setError(error.message);
        setLeaveData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, [API_URL, token, search, department, organizationId, currentPage]);

  // ---------- Helpers ----------
  const getInitials = (fullName = "", fallback = "??") => {
    if (!fullName) return fallback.slice(0, 2).toUpperCase();
    const parts = String(fullName).trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // ---------- CSV Export ----------
  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (department) params.append("department", department);
      if (organizationId) params.append("organization_id", organizationId);


      const res = await apiFetch(
        `${API_URL}/v1/hris/leave/GetLeaveCountstoallemployee?${params.toString()}`,
      );
      const result = await res.json();
      const allData = result.data || [];

      if (allData.length === 0) {
        alert("No data available to export.");
        return;
      }

      const headers = ["Employee", ...leaveCategories.map((c) => c.name)];
      const csvRows = [headers.join(",")];

      allData.forEach((emp) => {
        const row = [`"${emp.employee_fullname || "N/A"}"`];
        leaveCategories.forEach((cat) => {
          const current =
            emp.current_leave_counts?.find((x) => x.category_id === cat.id)
              ?.leave_count || 0;
          const actual =
            emp.actual_leave_counts?.find((x) => x.category_id === cat.id)
              ?.leave_count || 0;
          row.push(`"${current}/${actual}"`);
        });
        csvRows.push(row.join(","));
      });

      const blob = new Blob([csvRows.join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
      saveAs(blob, "Leave_Management_Report.csv");
    } catch (err) {
      console.error("CSV Export Error:", err);
      alert("Error exporting CSV");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await apiFetch(`${API_URL}/v1/hris/organizations/organization`);

        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          setOrganizations(
            result.data.map((org) => ({
              id: org.id,
              name: org.organization_name
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching organizations:", error);
      }
    };

    fetchOrganizations();
  }, [API_URL, token]);


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6"
    >
      <div className=" mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Leave Management
          </h1>
          <p className="text-gray-600">Track and manage employee leave details</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {hasPermission(1031) && (
            <Link to="/assign-employee-leave">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 text-white cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FaWalking className="text-white" size={28} />
                    </div>
                    <h3 className="text-2xl font-bold mb-1">Employee Leaves</h3>
                    <p className="text-blue-100 text-sm">View all leave balances</p>
                  </div>
                  {/* <div className="text-6xl font-bold opacity-30">
                {leaveData.length}
              </div> */}
                </div>
              </motion.div>
            </Link>
          )}


          {hasPermission(1032) && (
            <Link to="/leave-history-employees">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 text-white cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FaListAlt className="text-white" size={28} />
                    </div>
                    <h3 className="text-2xl font-bold mb-1">Leave History</h3>
                    <p className="text-indigo-100 text-sm">View employee leave history</p>
                  </div>
                  <div className="text-5xl opacity-30">→</div>
                </div>
              </motion.div>
            </Link>
          )}

          {hasPermission(1033) && (
            <Link to="/leave-encashment">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-gradient-to-br from-indigo-700 to-purple-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 text-white cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FaListAlt className="text-white" size={28} />
                    </div>
                    <h3 className="text-2xl font-bold mb-1">Leave Encashment</h3>
                    <p className="text-indigo-100 text-sm">View employee leave history</p>
                  </div>
                  <div className="text-5xl opacity-30">→</div>
                </div>
              </motion.div>
            </Link>
          )}

        </div>



      </div>
    </motion.div>
  );
};

export default LeaveManagement;