import React, { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { apiFetch } from "../../../../utils/apiClient";
const AccessControl = () => {
  const [employeeData, setEmployeeData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageGroupStart, setPageGroupStart] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchEmployeeNo, setSearchEmployeeNo] = useState("");

  const ITEMS_PER_PAGE = 10;
  const PAGE_GROUP_SIZE = 5;
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  // Safer avatar color
  const avatarBgClass = (seed) => {
    const safeSeed = typeof seed === "string" ? seed : String(seed || "x");
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
    for (let i = 0; i < safeSeed.length; i++) {
      hash = (hash * 31 + safeSeed.charCodeAt(i)) >>> 0;
    }
    return palette[hash % palette.length];
  };

  const getInitials = (name = "") => {
    const clean = String(name).trim();
    if (!clean) return "NA";
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  /* -------------------- Fetch Data -------------------- */
  const fetchData = async (page = 1, employeeNo = "") => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: ITEMS_PER_PAGE,
      });

      if (employeeNo) params.append("employee_no", employeeNo);

      const url = `${API_URL}/v1/hris/user/get-all-user-sessions?${params.toString()}`;
      const response = await apiFetch(url);
      const result = await response.json();

      if (result.success) {
        const rows = Array.isArray(result.data) ? result.data : [];
        const total = Number(result.totalCount) || rows.length || 0;
        setEmployeeData(rows);
        setTotalRecords(total);
        setTotalPages(Math.max(1, Math.ceil(total / ITEMS_PER_PAGE)));
      } else {
        setEmployeeData([]);
        setTotalRecords(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setEmployeeData([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, searchEmployeeNo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  /* -------------------- Pagination: visible pages -------------------- */
  const visiblePageNumbers = (() => {
    const endPage = Math.min(pageGroupStart + PAGE_GROUP_SIZE - 1, totalPages);
    const pages = [];
    for (let i = pageGroupStart; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  })();

  // Keep pageGroupStart in sync when currentPage moves out of range
  useEffect(() => {
    if (currentPage < pageGroupStart) {
      setPageGroupStart(Math.max(1, currentPage - PAGE_GROUP_SIZE + 1));
    } else if (currentPage >= pageGroupStart + PAGE_GROUP_SIZE) {
      setPageGroupStart(currentPage);
    }
  }, [currentPage, pageGroupStart]);

  /* -------------------- Delete Actions -------------------- */
  const openDeleteModal = (item) => {
    setDeleteTarget(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.user_id) {
      console.error("❌ Missing user_id in delete target");
      return;
    }
    try {
      setIsLoading(true);
      const response = await apiFetch(
        `${API_URL}/v1/hris/user/remove-device/${deleteTarget.user_id}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("Failed to revoke access");
      const result = await response.json();
      console.log(" Deleted:", result);
      setShowDeleteModal(false);
      await fetchData(currentPage, searchEmployeeNo);
    } catch (error) {
      console.error("❌ Delete failed:", error);
    } finally {
      setIsLoading(false);
      setDeleteTarget(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  /* -------------------- Render -------------------- */
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="font-montserrat"
    >
      <div className="min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
              Device Access Control
            </h1>
            <p className="text-gray-500 text-sm">
              Monitor and revoke device sessions for employees
            </p>
          </div>
        </div>

        {/* Filter / Search Panel */}
        <div className="p-5 mb-6 bg-white/70 backdrop-blur-xl border border-gray-200 shadow-lg rounded-xl">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[220px]">
              <label className="text-[12px] font-semibold text-gray-600">
                Search by Employee No
              </label>
              <input
                type="text"
                placeholder="EMP001 / EMP03438..."
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                onChange={(e) => setSearchEmployeeNo(e.target.value)}
                value={searchEmployeeNo}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setCurrentPage(1);
                  fetchData(1, searchEmployeeNo);
                }}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg shadow hover:bg-blue-700 transition"
              >
                Search
              </button>
              <button
                onClick={() => {
                  setSearchEmployeeNo("");
                  setCurrentPage(1);
                  fetchData(1, "");
                }}
                className="px-4 py-2 bg-gray-100 border border-gray-300 text-sm rounded-lg hover:bg-gray-200 transition"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white uppercase text-xs">
                <tr>
                  <th className="p-4 font-semibold tracking-wide">Employee</th>
                  <th className="p-4 font-semibold tracking-wide">
                    Employee No
                  </th>
                  <th className="p-4 font-semibold tracking-wide">
                    Device Name
                  </th>
                  <th className="p-4 font-semibold tracking-wide">Device ID</th>
                  <th className="p-4 font-semibold tracking-wide">
                    Last Active
                  </th>
                  <th className="p-4 font-semibold tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">
                      Loading…
                    </td>
                  </tr>
                ) : employeeData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">
                      No records found
                    </td>
                  </tr>
                ) : (
                  employeeData.map((item, idx) => (
                    <motion.tr
                      key={item.id || idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{
                        scale: 1.01,
                        backgroundColor: "#f3f6ff",
                        boxShadow: "0 8px 20px rgba(0, 0, 0, 0.06)",
                        transition: { duration: 0.25 },
                      }}
                      transition={{ duration: 0.3 }}
                      className="transition-all cursor-pointer"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ring-2 ring-offset-2 ring-offset-white ${avatarBgClass(
                              item.employee_no,
                            )}`}
                          >
                            {getInitials(item.employee_no)}
                          </div>
                          <span className="font-medium text-gray-800">
                            {item.employee_no}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-700">{item.employee_no}</td>
                      <td className="p-4 text-gray-700">{item.device_name}</td>
                      <td className="p-4 text-gray-600 font-mono text-xs">
                        {item.device_id}
                      </td>
                      <td className="p-4 text-gray-600 text-xs">
                        {item.updated_at
                          ? new Date(item.updated_at).toLocaleString()
                          : "—"}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => openDeleteModal(item)}
                          disabled={isLoading}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-white hover:bg-red-600 border border-red-600 rounded-md transition-colors disabled:opacity-50"
                        >
                          Revoke Access
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center p-4 border-t border-gray-200 text-sm text-gray-600 bg-gray-50">
            <span>
              Showing{" "}
              {employeeData.length > 0
                ? (currentPage - 1) * ITEMS_PER_PAGE + 1
                : 0}{" "}
              to {Math.min(currentPage * ITEMS_PER_PAGE, totalRecords)} of{" "}
              {totalRecords} entries
            </span>

            <div className="flex gap-1 items-center">
              {/* Prev group */}
              {pageGroupStart > 1 && (
                <button
                  onClick={() => {
                    const newStart = Math.max(
                      pageGroupStart - PAGE_GROUP_SIZE,
                      1,
                    );
                    setPageGroupStart(newStart);
                    setCurrentPage(newStart);
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-100"
                >
                  ← Prev
                </button>
              )}

              {/* Page numbers */}
              {visiblePageNumbers.map((n) => (
                <button
                  key={n}
                  onClick={() => setCurrentPage(n)}
                  className={`px-3 py-1.5 border rounded-md transition-colors ${
                    currentPage === n
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {n}
                </button>
              ))}

              {/* Next group */}
              {pageGroupStart + PAGE_GROUP_SIZE <= totalPages && (
                <button
                  onClick={() => {
                    const newStart = pageGroupStart + PAGE_GROUP_SIZE;
                    setPageGroupStart(newStart);
                    setCurrentPage(newStart);
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-100"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Delete Modal */}
        {showDeleteModal && deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-6 relative"
            >
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                onClick={cancelDelete}
              >
                <X size={18} />
              </button>

              <div className="flex flex-col items-center text-center space-y-3">
                <AlertTriangle className="text-red-500" size={40} />
                <h2 className="text-lg font-semibold text-gray-800">
                  Confirm Revocation
                </h2>
                <p className="text-gray-600 text-sm">
                  Are you sure you want to revoke access for{" "}
                  <span className="font-semibold">
                    {deleteTarget.employee_no}
                  </span>{" "}
                  on device{" "}
                  <span className="font-semibold">
                    {deleteTarget.device_name}
                  </span>
                  ?
                </p>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Yes, Revoke
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AccessControl;
