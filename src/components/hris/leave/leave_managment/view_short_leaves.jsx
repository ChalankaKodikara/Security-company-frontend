/** @format */
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { apiFetch } from "../../../../utils/apiClient"
const ViewShortLeaves = () => {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const token = Cookies.get("accessToken");

  const [shortLeaves, setShortLeaves] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // 🔹 Filters
  const [filters, setFilters] = useState({
    search: "",
    departmentId: "",
    designationId: "",
  });

  const avatarBgClass = (seed = "") => {
    const palette = [
      "bg-sky-500",
      "bg-indigo-500",
      "bg-emerald-500",
      "bg-rose-500",
      "bg-amber-500",
      "bg-teal-500",
      "bg-fuchsia-500",
      "bg-cyan-500",
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

  // 🔹 Fetch Departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await apiFetch(`${API_URL}/v1/hris/department`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setDepartments(data.data || []);
        }
      } catch (err) {
        console.error("Error fetching departments:", err);
      }
    };
    fetchDepartments();
  }, [API_URL, token]);

  // 🔹 Fetch Designations
  useEffect(() => {
    const fetchDesignations = async () => {
      try {
        const res = await apiFetch(`${API_URL}/v1/hris/designation`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setDesignations(data.data || []);
        }
      } catch (err) {
        console.error("Error fetching designations:", err);
      }
    };
    fetchDesignations();
  }, [API_URL, token]);

  // 🔹 Fetch Short Leaves
  const fetchShortLeaves = async (page = 1, limit = rowsPerPage) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page,
        limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.departmentId && { departmentId: filters.departmentId }),
        ...(filters.designationId && { designationId: filters.designationId }),
      });

      const res = await apiFetch(
        `${API_URL}/v1/hris/leave/short-leave-counts?${params.toString()}`,
        {
          credentials: "include",
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.message || "Failed to fetch short leaves");
      }

      setShortLeaves(data.data || []);
      setTotalRecords(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError(err.message);
      setShortLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShortLeaves(currentPage, rowsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  return (
    <div className="font-montserrat">
      <p className="text-[25px] my-5">Short Leave Counts</p>

      {/* 🔹 Filters */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by Employee No or Name"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="border p-2 rounded"
        />
        <select
          value={filters.departmentId}
          onChange={(e) =>
            setFilters({ ...filters, departmentId: e.target.value })
          }
          className="border p-2 rounded"
        >
          <option value="">All Departments</option>
          {departments.map((dep) => (
            <option key={dep.id} value={dep.id}>
              {dep.name}
            </option>
          ))}
        </select>
        <select
          value={filters.designationId}
          onChange={(e) =>
            setFilters({ ...filters, designationId: e.target.value })
          }
          className="border p-2 rounded"
        >
          <option value="">All Designations</option>
          {designations.map((des) => (
            <option key={des.id} value={des.id}>
              {des.title}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setCurrentPage(1);
            fetchShortLeaves(1, rowsPerPage);
          }}
          className="bg-blue-500 text-white px-4 rounded"
        >
          Apply
        </button>
        <button
          onClick={() => {
            setFilters({ search: "", departmentId: "", designationId: "" });
            setCurrentPage(1);
            fetchShortLeaves(1, rowsPerPage);
          }}
          className="bg-gray-400 text-white px-4 rounded"
        >
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow p-2 rounded-xl">
        <table className="w-full text-sm text-left">
          <thead className="bg-white text-gray-600 border-b border-t">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-900">
                Employee No
              </th>
              <th className="px-6 py-4 font-medium text-gray-900">
                Employee Name
              </th>
              <th className="px-6 py-4 font-medium text-gray-900">Email</th>
              <th className="px-6 py-4 font-medium text-gray-900">
                Short Leave Count
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 border-t border-gray-200">
            {loading ? (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="4" className="text-center py-4 text-red-500">
                  Error: {error}
                </td>
              </tr>
            ) : shortLeaves.length > 0 ? (
              shortLeaves.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50 transition">
                  <td className="p-3 text-blue-600">{row.employee_no}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0 ${avatarBgClass(
                          row.employee_fullname || row.employee_no
                        )}`}
                        title={row.employee_fullname}
                      >
                        {getInitials(row.employee_fullname || row.employee_no)}
                      </div>
                      <div>
                        <div className="font-semibold leading-5">
                          {row.employee_fullname}
                        </div>
                        <div className="text-xs text-gray-500">
                          EMP ID: {row.employee_no}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{row.employee_email}</td>
                  <td className="p-3 text-center font-bold text-gray-700">
                    {row.short_leave_count}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500">
                  No data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <div>
          <span className="text-sm text-gray-700">
            Showing{" "}
            {totalRecords > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to{" "}
            {Math.min(currentPage * rowsPerPage, totalRecords)} of{" "}
            {totalRecords} results
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages > 0 ? totalPages : 1}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0 || loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewShortLeaves;
