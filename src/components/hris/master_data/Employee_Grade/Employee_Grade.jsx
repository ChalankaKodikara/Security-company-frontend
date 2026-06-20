/** @format */

import React, { useState, useEffect } from "react";
import { RiDeleteBin6Line } from "react-icons/ri";
import { TbEditCircle } from "react-icons/tb";
import { motion } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import Cookies from "js-cookie";
import usePermissions from "../../../permissions/permission";

function Employee_Grade() {
  const { hasPermission } = usePermissions();
  const [employeeGradeName, setEmployeeGradeName] = useState("");
  const [morningOtStart, setMorningOtStart] = useState("");
  const [morningOtEnd, setMorningOtEnd] = useState("");
  const [eveningOtStart, setEveningOtStart] = useState("");
  const [eveningOtEnd, setEveningOtEnd] = useState("");
  const [employeeGrades, setEmployeeGrades] = useState([]);
  const [editingEmployeeGradeId, setEditingEmployeeGradeId] = useState(null);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  // Client-side filters
  const [employeeGradeNameFilter, setEmployeeGradeNameFilter] = useState("");

  // Client-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [employeeGradeToDelete, setEmployeeGradeToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const handleEditEmployeeGrade = (id) => {
    const d = employeeGrades.find((x) => x.id === id);
    if (!d) {
      toast.error("Employee grade not found.");
      return;
    }
    setEmployeeGradeName(d.grade_name);
    setMorningOtStart(d.morning_ot_start);
    setMorningOtEnd(d.morning_ot_end);
    setEveningOtStart(d.evening_ot_start);
    setEveningOtEnd(d.evening_ot_end);
    setEditingEmployeeGradeId(id);
  };

  const handleCancelEdit = () => {
    setEmployeeGradeName("");
    setMorningOtStart("");
    setMorningOtEnd("");
    setEveningOtStart("");
    setEveningOtEnd("");
    setEditingEmployeeGradeId(null);
  };

  const showDeleteConfirmation = (id) => {
    setEmployeeGradeToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setEmployeeGradeToDelete(null);
  };

  const handleDeleteEmployeeGrade = async () => {
    if (!employeeGradeToDelete) return;
    const token = Cookies.get("accessToken");

    try {
      setIsSubmitting(true);

      const url =
        `${API_URL}/v1/hris/grade/employee-grades/${employeeGradeToDelete}`.replace(
          /([^:]\/)\/+/g,
          "$1"
        );

      await jsonFetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Employee grade deleted successfully!");

      // Refresh from server if loader exists
      if (typeof loadEmployeeGrades === "function") {
        await loadEmployeeGrades();
      } else {
        // fallback local delete
        setEmployeeGrades((prev) =>
          prev.filter((b) => b.id !== employeeGradeToDelete)
        );
      }
    } catch (err) {
      console.error("[DELETE] error:", err);
      toast.error(err.message || "Failed to delete employee grade.");
    } finally {
      setIsSubmitting(false);
      closeDeleteModal();
    }
  };

  // --- client-side filtering ---
  const filteredEmployeeGrades = employeeGrades.filter((d) => {
    const nameOk = employeeGradeNameFilter
      ? String(d.grade_name || "")
          .toLowerCase()
          .includes(employeeGradeNameFilter.toLowerCase())
      : true;
    return nameOk;
  });

  // --- client-side pagination ---
  const totalItems = filteredEmployeeGrades.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const clampedPage = Math.min(currentPage, totalPages);
  if (clampedPage !== currentPage) {
    // keep UI stable if filters reduce pages
    setCurrentPage(clampedPage);
  }
  const startIndex = (clampedPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const paginatedEmployeeGrades = filteredEmployeeGrades.slice(
    startIndex,
    endIndex
  );

  const goToPreviousPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const goToNextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  const loadEmployeeGrades = async () => {
    const token = Cookies.get("accessToken");
    try {
      setIsLoading(true);
      setLoadError(null);

      const res = await jsonFetch(`${API_URL}/v1/hris/grade/employee-grades/`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res?.success || !Array.isArray(res?.data)) {
        throw new Error("Unexpected response shape from server.");
      }

      setEmployeeGrades(res.data);
    } catch (err) {
      console.error("[GET] loadEmployeeGrades error:", err);
      setLoadError(err.message || "Failed to load employee grades.");
      toast.error(err.message || "Failed to load employee grades.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployeeGrades();
  }, []);

  const jsonFetch = async (url, options = {}) => {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });

    let data = null;
    try {
      if (res.status !== 204) {
        data = await res.json();
      }
    } catch {
      data = null;
    }

    if (!res.ok) {
      const msg =
        (data && (data.message || data.error || data.detail)) ||
        `Request failed (${res.status})`;
      const err = new Error(msg);
      err.status = res.status;
      err.body = data;
      throw err;
    }
    return data ?? {};
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddEmployeeGrade = async () => {
    if (
      !employeeGradeName ||
      !morningOtStart ||
      !morningOtEnd ||
      !eveningOtStart ||
      !eveningOtEnd
    ) {
      toast.warn("Please enter all fields.");
      return;
    }

    const payload = {
      grade_name: employeeGradeName.trim(),
      morning_ot_start: morningOtStart.trim(),
      morning_ot_end: morningOtEnd.trim(),
      evening_ot_start: eveningOtStart.trim(),
      evening_ot_end: eveningOtEnd.trim(),
    };

    const token = Cookies.get("accessToken");

    // EDIT mode: PUT to API
    if (editingEmployeeGradeId) {
      try {
        setIsSubmitting(true);

        const url =
          `${API_URL}/v1/hris/grade/employee-grades/${editingEmployeeGradeId}`.replace(
            /([^:]\/)\/+/g,
            "$1"
          );

        const updated = await jsonFetch(url, {
          method: "PUT",
          body: JSON.stringify(payload),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        toast.success("Employee grade updated successfully!");

        if (typeof loadEmployeeGrades === "function") {
          await loadEmployeeGrades();
        } else {
          // fallback: update locally
          setEmployeeGrades((prev) =>
            prev.map((d) =>
              d.id === editingEmployeeGradeId
                ? { ...d, ...payload, ...updated }
                : d
            )
          );
        }

        setEditingEmployeeGradeId(null);
        setEmployeeGradeName("");
        setMorningOtStart("");
        setMorningOtEnd("");
        setEveningOtStart("");
        setEveningOtEnd("");
      } catch (err) {
        console.error("[UPDATE] error:", err);
        const more = err?.body ? ` (${JSON.stringify(err.body)})` : "";
        toast.error(
          `${err.message || "Failed to update employee grade."}${more}`
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ADD mode: POST to API
    try {
      setIsSubmitting(true);

      const url = `${API_URL}/v1/hris/grade/add-employee-grades/`.replace(
        /([^:]\/)\/+/g,
        "$1"
      );

      const created = await jsonFetch(url, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const newRecord = {
        id: created?.id ?? crypto.randomUUID(),
        name: created?.name ?? payload.name,
        description: created?.description ?? payload.description,
      };

      toast.success("Employee grade added successfully!");

      if (typeof loadEmployeeGrades === "function") {
        await loadEmployeeGrades();
      } else {
        setEmployeeGrades((prev) => [...prev, newRecord]);
      }

      setEmployeeGradeName("");
      setMorningOtStart("");
      setMorningOtEnd("");
      setEveningOtStart("");
      setEveningOtEnd("");
    } catch (err) {
      console.error("[ADD] error:", err);
      const more = err?.body ? ` (${JSON.stringify(err.body)})` : "";
      toast.error(`${err.message || "Failed to add employee grade."}${more}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        {/* Form */}
        <div className="bg-white p-4 rounded-md mt-5 shadow font-montserrat">
          <h1 className="text-xl text-gray-700 mb-4">Employee Grade</h1>

          <div className="flex flex-wrap gap-4 items-end mb-4">
            <div>
              <label
                htmlFor="employeeGradeName"
                className="block text-sm font-normal text-gray-700 mb-1"
              >
                Employee Grade Name
              </label>
              <input
                type="text"
                id="employeeGradeName"
                className="border border-gray-300 rounded-md p-2 w-80"
                value={employeeGradeName}
                onChange={(e) => setEmployeeGradeName(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="morningOtStart"
                className="block text-sm font-normal text-gray-700 mb-1"
              >
                Morning OT Start
              </label>
              <input
                type="time"
                id="morningOtStart"
                className="border border-gray-300 rounded-md p-2 w-80"
                value={morningOtStart}
                onChange={(e) => setMorningOtStart(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="morningOtEnd"
                className="block text-sm font-normal text-gray-700 mb-1"
              >
                Morning OT End
              </label>
              <input
                type="time"
                id="morningOtEnd"
                className="border border-gray-300 rounded-md p-2 w-80"
                value={morningOtEnd}
                onChange={(e) => setMorningOtEnd(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="eveningOtStart"
                className="block text-sm font-normal text-gray-700 mb-1"
              >
                Evening OT Start
              </label>
              <input
                type="time"
                id="eveningOtStart"
                className="border border-gray-300 rounded-md p-2 w-80"
                value={eveningOtStart}
                onChange={(e) => setEveningOtStart(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="eveningOtEnd"
                className="block text-sm font-normal text-gray-700 mb-1"
              >
                Evening OT End
              </label>
              <input
                type="time"
                id="eveningOtEnd"
                className="border border-gray-300 rounded-md p-2 w-80"
                value={eveningOtEnd}
                onChange={(e) => setEveningOtEnd(e.target.value)}
              />
            </div>

            
              <button
                disabled={isSubmitting}
                className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-60 ${
                  editingEmployeeGradeId
                    ? "bg-blue-400"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
                onClick={handleAddEmployeeGrade}
              >
                {editingEmployeeGradeId
                  ? isSubmitting
                    ? "Updating…"
                    : "Update"
                  : isSubmitting
                  ? "Adding…"
                  : "Add"}
              </button>
           

            {editingEmployeeGradeId && (
              <button
                className="px-4 py-2 border rounded-md ml-2"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Table + Filters */}
        <div className="bg-white pt-6 rounded-md mt-5 shadow max-w-5xl">
          <div className="flex flex-wrap gap-4 items-end mb-4 mx-2 ml-4">
            <div>
              <input
                type="text"
                id="employeeGradeNameSearch"
                placeholder="Employee Grade Name"
                className="border border-gray-300 rounded-md p-2 w-80"
                value={employeeGradeNameFilter}
                onChange={(e) => {
                  setEmployeeGradeNameFilter(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EMPLOYEE GRADE NAME
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MORNING OT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EVENING OT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-6 text-center text-sm text-gray-500"
                  >
                    Loading…
                  </td>
                </tr>
              )}

              {!isLoading && loadError && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-6 text-center text-sm text-red-500"
                  >
                    {loadError}
                  </td>
                </tr>
              )}

              {!isLoading &&
                !loadError &&
                paginatedEmployeeGrades.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.grade_name}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.morning_ot_start} - {item.morning_ot_end}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.evening_ot_start} - {item.evening_ot_end}
                    </td>
                    <td className="p-3 py-3 flex gap-3 text-gray-600">
                      
                        <span className="bg-gray-100 p-2 rounded-md text-gray-500 border border-gray-400">
                          <TbEditCircle
                            className="cursor-pointer hover:text-gray-500"
                            size={15}
                            onClick={() => handleEditEmployeeGrade(item.id)}
                          />
                        </span>
                   
                      
                        <span className="bg-red-100 p-2 rounded-md text-red-500 border border-red-500">
                          <RiDeleteBin6Line
                            className="cursor-pointer hover:text-red-700"
                            size={15}
                            onClick={() => showDeleteConfirmation(item.id)}
                          />
                        </span>
                     
                    </td>
                  </tr>
                ))}

              {!isLoading &&
                !loadError &&
                paginatedEmployeeGrades.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-6 text-center text-sm text-gray-500"
                    >
                      No records found.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4">
            <div className="text-sm text-gray-500">
              {totalItems > 0 ? (
                <>
                  Showing {startIndex + 1} to {endIndex} of {totalItems} entries
                </>
              ) : (
                <>No entries</>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-gray-200 rounded text-gray-600 disabled:opacity-50 hover:bg-gray-300"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm rounded ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm bg-gray-200 rounded text-gray-600 disabled:opacity-50 hover:bg-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteEmployeeGrade}
        itemName="Employee Grade"
      />
    </motion.div>
  );
}

export default Employee_Grade;
