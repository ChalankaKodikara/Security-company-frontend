/** @format */
import React, { useEffect, useState, useCallback } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import { apiFetch } from "../../../../utils/apiClient";
const API_URL = process.env.REACT_APP_FRONTEND_URL;

// 🔹 Avatar helpers
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

const AssignEmployeeLeave = () => {
  const token = Cookies.get("user_token");

  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showPopup, setShowPopup] = useState(false);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [leaveCategories, setLeaveCategories] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [currentLeaveCount, setCurrentLeaveCount] = useState("");
  const [actualLeaveCount, setActualLeaveCount] = useState("");
  const [selectedLeaveCategory, setSelectedLeaveCategory] = useState("");
  const [leaveCount, setLeaveCount] = useState("");
  const [selectedCategoryDetails, setSelectedCategoryDetails] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // 🔹 Fetch all leave categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiFetch(`${API_URL}/v1/hris/leave/getLeaveCategory`, {
          
        });
        const json = await res.json();
        if (!res.ok)
          throw new Error(json?.message || "Failed to fetch categories");
        setLeaveCategories(json.data || []);
      } catch (err) {
        toast.error(err.message);
      }
    };
    fetchCategories();
  }, [token]);

  const fetchEmployees = useCallback(
    async (keyword = "", page = 1) => {
      setLoading(true);
      setLoadError("");
      try {
        const params = new URLSearchParams({
          page,
          limit: pageSize,
        });
        if (keyword) params.append("search", keyword);

        const res = await apiFetch(
          `${API_URL}/v1/hris/leave/employee-category?${params}`,
          
        );
        const json = await res.json();

        if (!res.ok || !json.success)
          throw new Error(json?.message || "Failed to fetch employees");

        const employeesData = json.data || [];

        // ✅ Dynamically compute total pages if not returned by API
        const totalCount =
          json.total || json.totalCount || json.count || employeesData.length;
        const totalPages =
          json.totalPages || Math.max(1, Math.ceil(totalCount / pageSize));
        const currentPageFromApi = json.page || page;

        setEmployees(employeesData);
        setTotal(totalCount);
        setTotalPages(totalPages);
        setCurrentPage(currentPageFromApi);
      } catch (err) {
        setLoadError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    },
    [token, pageSize]
  );

  // 🔹 Initial fetch
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // 🔹 Debounce search input (auto fetch after 600 ms)
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchEmployees(search.trim(), 1);
    }, 600);
    return () => clearTimeout(timeout);
  }, [search, fetchEmployees]);

  // 🔹 Keep edit fields populated once the balance is loaded
  useEffect(() => {
    if (!leaveBalance) return;
    setCurrentLeaveCount(leaveBalance.current_leave_count ?? "");
    setActualLeaveCount(leaveBalance.actual_leave_count ?? "");
  }, [leaveBalance]);

  // 🔹 Popup open & close
  const closePopup = () => {
    setShowPopup(false);
    setSelectedCategory(null);
    setLeaveBalance(null);
    setIsEditMode(false);
    setCurrentLeaveCount("");
    setActualLeaveCount("");
  };
  const closeAddPopup = () => {
    setShowAddPopup(false);
    setSelectedEmployee(null);
    setSelectedLeaveCategory("");
    setLeaveCount("");
  };

  // 🔹 Handle leave category click (view / edit)
  const handleCategoryClick = async (category, emp) => {
    setSelectedCategory({ ...category, employee_no: emp.employee_no });
    setShowPopup(true);
    setIsEditMode(false);
    try {
      const res = await apiFetch(
        `${API_URL}/v1/hris/leave/employee-category-count?employee_no=${emp.employee_no}&leave_category_id=${category.category_id}`,
      );
      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.message || "Failed to fetch leave balance");

      const balance = json.data || null;
      setLeaveBalance(balance);
      setCurrentLeaveCount(balance?.current_leave_count ?? "");
      setActualLeaveCount(balance?.actual_leave_count ?? "");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSaveAddLeave = async () => {
    if (!selectedEmployee || !selectedLeaveCategory || !leaveCount) {
      toast.error("Please fill all fields before saving");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        employee_no: selectedEmployee.employee_no,
        leave_category_id: selectedLeaveCategory,
        leave_count: Number(leaveCount),
      };

      const res = await apiFetch(
        `${API_URL}/v1/hris/leave/addEmployeeLeaveCount`,
        {
          method: "POST",
          
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.message || "Failed to assign leave category");
      }

      toast.success("Leave category assigned successfully");
      closeAddPopup();
      // Optional: Refresh employee list
      fetchEmployees(search, currentPage);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };
  // 🔹 Add new leave category (fetch organization-specific categories)
  const handleAddLeaveClick = async (emp) => {
    console.log("Selected employee →", emp); // ✅ Add this

    setSelectedEmployee(emp);
    setSelectedLeaveCategory("");
    setLeaveCount("");
    setSelectedCategoryDetails(null);
    setShowAddPopup(true);

    try {
      // 🧩 Fetch leave categories for this employee's organization
      const res = await apiFetch(
        `${API_URL}/v1/hris/leave/getLeaveCategory?employee_no=${emp.employee_no}`,
      );
      const json = await res.json();

      if (!res.ok || !json.success)
        throw new Error(json?.message || "Failed to fetch leave categories");

      // ✅ Set only organization-matched categories
      setLeaveCategories(json.data || []);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // 🔹 Update leave counts
  const handleSave = async () => {
    if (!selectedCategory) return;
    setIsSaving(true);

    try {
      const payload = {
        actual_leave_counts: [
          {
            leave_category_id: selectedCategory.category_id,
            leave_count: Number(actualLeaveCount),
          },
        ],
        current_leave_counts: [
          {
            leave_category_id: selectedCategory.category_id,
            leave_count: Number(currentLeaveCount),
          },
        ],
      };

      const res = await apiFetch(
        `${API_URL}/v1/hris/leave/update-leave-count?employee_no=${selectedCategory.employee_no}`,
        {
          method: "PUT",
          
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.message || "Failed to update leave counts");

      toast.success("Leave counts updated successfully");
      closePopup();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    if (!window.confirm(`Remove "${selectedCategory.category_name}" from this employee?`)) return;

    setIsSaving(true);
    try {
      const res = await apiFetch(`${API_URL}/v1/hris/leave/delete-leave-category-from-employee`, {
        method: "DELETE",
      
        body: JSON.stringify({
          employee_no: selectedCategory.employee_no,
          leave_category_id: selectedCategory.category_id,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.message || "Failed to delete category");

      toast.success("Leave category removed successfully");
      closePopup();
      fetchEmployees(search, currentPage);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <div className="font-montserrat mt-5">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Assign Employee to Leaves

        </h1>
        <p className="text-gray-600">Assign and manage employee leaves</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-lg p-6 mb-6 backdrop-blur-lg border border-gray-100"
      >
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by Employee No or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-none px-3 py-2 w-80"
          />
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
      >
        {/* 🧑‍💼 Employee Table */}
        <div className="overflow-x-auto bg-white shadow-md rounded-md">
          <table className="w-full border-collapse text-left text-sm text-gray-600">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3">Employee No</th>
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Assigned Leave Categories</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="12" className="text-center py-10">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"
                    />
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan="4" className="py-4 text-center text-red-600">
                    {loadError}
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-4 text-center text-gray-400">
                    No employees found.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.employee_no} className="hover:bg-gray-50">

                    <td className="px-6 py-3">{emp.employee_no}</td>
                    <td className="px-6 py-3 flex items-center gap-3">
                      <div
                        className={`w-10 h-10 flex items-center justify-center rounded-full text-white font-semibold ${avatarBgClass(
                          emp.employee_name
                        )}`}
                      >
                        {getInitials(emp.employee_name)}
                      </div>
                      <div>
                        <div className="font-medium">{emp.employee_name}</div>
                        <div className="text-xs text-gray-500">
                          {emp.employee_email || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      {emp.assigned_leave_categories?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {emp.assigned_leave_categories.map((cat) => (
                            <span
                              key={cat.category_id}
                              className="px-2 py-1 rounded bg-green-100 text-green-600 text-xs cursor-pointer hover:bg-green-200"
                              onClick={() => handleCategoryClick(cat, emp)}
                            >
                              {cat.category_name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">
                          No categories
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => handleAddLeaveClick(emp)}
                        className="text-blue-600 hover:text-blue-400"
                      >
                        + Add
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
      <div className="flex justify-between items-center mt-4 text-sm text-gray-700">
        <div>
          Showing {(currentPage - 1) * pageSize + 1}–
          {Math.min(currentPage * pageSize, total)} of {total} results
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage <= 1 || loading}
            onClick={() => fetchEmployees(search, currentPage - 1)}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Page {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages || loading}
            onClick={() => fetchEmployees(search, currentPage + 1)}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {showPopup && selectedCategory && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-[420px] rounded-2xl shadow-xl overflow-hidden border border-gray-100">

            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <CalendarDays size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{selectedCategory.category_name}</p>
                  <p className="text-xs text-gray-400">Leave category details</p>
                </div>
              </div>
              <button onClick={closePopup} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 text-sm">✕</button>
            </div>

            {!isEditMode ? (
              <>
                {/* View Mode */}
                <div className="p-5">
                  {leaveBalance && (
                    <>
                      {/* Stat cards */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {[
                          { label: "Current", value: leaveBalance.current_leave_count, sub: "days left", danger: false },
                          { label: "Actual", value: leaveBalance.actual_leave_count, sub: "entitled", danger: false },
                          { label: "No-pay", value: leaveBalance.nopay, sub: "deducted", danger: true },
                        ].map(({ label, value, sub, danger }) => (
                          <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                            <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">{label}</p>
                            <p className={`text-xl font-medium ${danger ? "text-red-500" : "text-gray-900"}`}>{value}</p>
                            <p className="text-[10px] text-gray-300 mt-0.5">{sub}</p>
                          </div>
                        ))}
                      </div>

                    </>
                  )}
                </div>

                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                  <button
                    onClick={handleDeleteCategory}
                    disabled={isSaving}
                    className="px-4 py-1.5 text-sm border border-red-200 rounded-lg bg-white hover:bg-red-50 text-red-500 disabled:opacity-50"
                  >
                    {isSaving ? "Removing..." : "Remove category"}
                  </button>
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-700"
                  >
                    Edit counts
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Edit Mode */}
                <div className="p-5 space-y-3">
                  <p className="text-xs text-gray-400 mb-4">Update leave balance. Changes apply immediately.</p>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1.5">Current leave count</label>
                    <input type="number" value={currentLeaveCount} onChange={(e) => setCurrentLeaveCount(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1.5">Actual leave count</label>
                    <input type="number" value={actualLeaveCount} onChange={(e) => setActualLeaveCount(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 flex gap-2 text-xs text-amber-600">
                    <span>⚠</span>
                    <span>Editing will override current balance. Ensure values are correct before saving.</span>
                  </div>
                </div>

                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setIsEditMode(false);
                      setCurrentLeaveCount(leaveBalance?.current_leave_count ?? "");
                      setActualLeaveCount(leaveBalance?.actual_leave_count ?? "");
                    }}
                    className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg bg-transparent hover:bg-gray-100 text-gray-500"
                  >
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={isSaving} className="px-4 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 font-medium disabled:opacity-50">
                    {isSaving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/*  Add Category Popup */}
      {
        showAddPopup && selectedEmployee && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white w-[420px] rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <CalendarDays size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Add Leave Category</p>
                    <p className="text-xs text-gray-400">Assign leave count to employee</p>
                  </div>
                </div>
                <button
                  onClick={closeAddPopup}
                  className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="p-5">
                <p className="text-sm text-gray-700 mb-4 font-medium">
                  Employee: {selectedEmployee.employee_name} ({selectedEmployee.employee_no})
                </p>

                <select
                  value={selectedLeaveCategory || ""}
                  onChange={(e) => {
                    const categoryId = Number(e.target.value);
                    setSelectedLeaveCategory(categoryId);
                    const details = leaveCategories.find(
                      (c) => c.id === categoryId
                    );
                    setSelectedCategoryDetails(details || null);
                    if (details) setLeaveCount(details.no_of_days);
                  }}
                  className="w-full border border-gray-200 rounded-lg p-2 mb-3"
                >
                  <option value="">-- Select Leave Category --</option>
                  {leaveCategories.map((cat) => {
                    const alreadyAssigned =
                      selectedEmployee.assigned_leave_categories?.some(
                        (a) => a.category_id === cat.id
                      );
                    return (
                      <option
                        key={cat.id}
                        value={cat.id}
                        disabled={alreadyAssigned}
                      >
                        {cat.category_name}
                        {alreadyAssigned ? " (Assigned)" : ""}
                      </option>
                    );
                  })}
                </select>

                {selectedCategoryDetails && (
                  <div className="bg-gray-50 p-3 rounded mb-3 text-sm">
                    <p>Eligible Days: {selectedCategoryDetails.no_of_days}</p>
                    <p>
                      Recurring: {selectedCategoryDetails.annual_recurring ? "Yes" : "No"}
                    </p>
                    <p>Gender: {selectedCategoryDetails.eligible_gender}</p>
                  </div>
                )}

                <input
                  type="number"
                  placeholder="Leave Count"
                  className="w-full border border-gray-200 rounded-lg p-2 mb-3"
                  value={leaveCount}
                  onChange={(e) => setLeaveCount(e.target.value)}
                />

                <div className="flex justify-end gap-2">
                  <button
                    onClick={closeAddPopup}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAddLeave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
      <ToastContainer position="top-right" autoClose={3000} />
    </div >
  );
};

export default AssignEmployeeLeave;
