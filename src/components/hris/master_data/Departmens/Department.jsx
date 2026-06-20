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

function Department() {
  const { hasPermission } = usePermissions();
  const [departmentName, setDepartmentName] = useState("");
  const [departmentDescription, setDepartmentDescription] = useState("");
  const [departments, setDepartments] = useState([]);
  const [editingDepartmentId, setEditingDepartmentId] = useState(null);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  // Client-side filters
  const [departmentNameFilter, setDepartmentNameFilter] = useState("");
  const [departmentDescriptionFilter, setDepartmentDescriptionFilter] =
    useState("");

  // Client-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const handleEditDepartment = (id) => {
    const d = departments.find((x) => x.id === id);
    if (!d) {
      toast.error("Department not found.");
      return;
    }
    setDepartmentName(d.name);
    setDepartmentDescription(d.description);
    setEditingDepartmentId(id);
  };

  const handleCancelEdit = () => {
    setDepartmentName("");
    setDepartmentDescription("");
    setEditingDepartmentId(null);
  };

  const showDeleteConfirmation = (id) => {
    setDepartmentToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDepartmentToDelete(null);
  };

  const handleDeleteBank = async () => {
    if (!departmentToDelete) return;
    const token = Cookies.get("accessToken");

    try {
      setIsSubmitting(true);

      const url = `${API_URL}/v1/hris/department/${departmentToDelete}`.replace(
        /([^:]\/)\/+/g,
        "$1"
      );

      await jsonFetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Department deleted successfully!");

      // Refresh from server if loader exists
      if (typeof loadDepartments === "function") {
        await loadDepartments();
      } else {
        // fallback local delete
        setDepartments((prev) =>
          prev.filter((b) => b.id !== departmentToDelete)
        );
      }
    } catch (err) {
      console.error("[DELETE] error:", err);
      toast.error(err.message || "Failed to delete department.");
    } finally {
      setIsSubmitting(false);
      closeDeleteModal();
    }
  };

  // --- client-side filtering ---
  const filteredDepartments = departments.filter((d) => {
    const nameOk = departmentNameFilter // Renamed filter state
      ? String(d.name || "")
          .toLowerCase()
          .includes(departmentNameFilter.toLowerCase())
      : true;
    const descriptionOk = departmentDescriptionFilter // Renamed filter state
      ? String(d.description || "")
          .toLowerCase()
          .includes(departmentDescriptionFilter.toLowerCase()) // Access 'description' field
      : true;
    return nameOk && descriptionOk;
  });

  // --- client-side pagination ---
  const totalItems = filteredDepartments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const clampedPage = Math.min(currentPage, totalPages);
  if (clampedPage !== currentPage) {
    // keep UI stable if filters reduce pages
    setCurrentPage(clampedPage);
  }
  const startIndex = (clampedPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedDepartments = filteredDepartments.slice(startIndex, endIndex);

  const goToPreviousPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const goToNextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  const loadDepartments = async () => {
    const token = Cookies.get("accessToken");
    try {
      setIsLoading(true);
      setLoadError(null);

      const res = await jsonFetch(`${API_URL}/v1/hris/department/`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res?.success || !Array.isArray(res?.data)) {
        throw new Error("Unexpected response shape from server.");
      }

      setDepartments(res.data);
    } catch (err) {
      console.error("[GET] loadDepartments error:", err);
      setLoadError(err.message || "Failed to load departments.");
      toast.error(err.message || "Failed to load departments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
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

  const handleAddDepartment = async () => {
    if (!departmentName || !departmentDescription) {
      toast.warn("Please enter both department name and description.");
      return;
    }

    const payload = {
      name: departmentName.trim(),
      description: departmentDescription.trim(),
    };

    const token = Cookies.get("accessToken");

    // EDIT mode: PUT to API
    if (editingDepartmentId) {
      try {
        setIsSubmitting(true);

        const url =
          `${API_URL}/v1/hris/department/${editingDepartmentId}`.replace(
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

        toast.success("Department updated successfully!");

        if (typeof loadDepartments === "function") {
          await loadDepartments();
        } else {
          // fallback: update locally
          setDepartments((prev) =>
            prev.map((d) =>
              d.id === editingDepartmentId
                ? { ...d, ...payload, ...updated }
                : d
            )
          );
        }

        setEditingDepartmentId(null);
        setDepartmentName("");
        setDepartmentDescription("");
      } catch (err) {
        console.error("[UPDATE] error:", err);
        const more = err?.body ? ` (${JSON.stringify(err.body)})` : "";
        toast.error(`${err.message || "Failed to update department."}${more}`);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ADD mode: POST to API
    try {
      setIsSubmitting(true);

      const url = `${API_URL}/v1/hris/department/`.replace(
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

      toast.success("Department added successfully!");

      if (typeof loadDepartments === "function") {
        await loadDepartments();
      } else {
        setDepartments((prev) => [...prev, newRecord]);
      }

      setDepartmentName("");
      setDepartmentDescription("");
    } catch (err) {
      console.error("[ADD] error:", err);
      const more = err?.body ? ` (${JSON.stringify(err.body)})` : "";
      toast.error(`${err.message || "Failed to add department."}${more}`);
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
          <h1 className="text-xl text-gray-700 mb-4">Department</h1>

          <div className="flex flex-wrap gap-4 items-end mb-4">
            <div>
              <label
                htmlFor="departmentName"
                className="block text-sm font-normal text-gray-700 mb-1"
              >
                Department Name
              </label>
              <input
                type="text"
                id="departmentName"
                className="border border-gray-300 rounded-md p-2 w-80"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="departmentDescription"
                className="block text-sm font-normal text-gray-700 mb-1"
              >
                Description
              </label>
              <input
                type="text"
                id="departmentDescription"
                className="border border-gray-300 rounded-md p-2 w-80"
                value={departmentDescription}
                onChange={(e) => setDepartmentDescription(e.target.value)}
              />
            </div>

            {hasPermission(10023) && (
              <button
                disabled={isSubmitting}
                className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-60 ${
                  editingDepartmentId
                    ? "bg-blue-400"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
                onClick={handleAddDepartment}
              >
                {editingDepartmentId
                  ? isSubmitting
                    ? "Updating…"
                    : "Update"
                  : isSubmitting
                  ? "Adding…"
                  : "Add"}
              </button>
            )}

            {editingDepartmentId && (
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
                id="departmentNameSearch"
                placeholder="Department Name"
                className="border border-gray-300 rounded-md p-2 w-80"
                value={departmentNameFilter}
                onChange={(e) => {
                  setDepartmentNameFilter(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div>
              <input
                type="text"
                id="departmentDescriptionSearch"
                placeholder="Description"
                className="border border-gray-300 rounded-md p-2 w-80"
                value={departmentDescriptionFilter}
                onChange={(e) => {
                  setDepartmentDescriptionFilter(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DEPARTMENT NAME
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DESCRIPTION
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
                    colSpan={3}
                    className="px-6 py-6 text-center text-sm text-gray-500"
                  >
                    Loading…
                  </td>
                </tr>
              )}

              {!isLoading && loadError && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-6 text-center text-sm text-red-500"
                  >
                    {loadError}
                  </td>
                </tr>
              )}

              {!isLoading &&
                !loadError &&
                paginatedDepartments.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.name}
                    </td>{" "}
                    {/* Access 'name' field */}
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.description}
                    </td>{" "}
                    {/* Access 'description' field */}
                    <td className="p-3 py-3 flex gap-3 text-gray-600">
                      {hasPermission(10024) && (
                        <span className="bg-gray-100 p-2 rounded-md text-gray-500 border border-gray-400">
                          <TbEditCircle
                            className="cursor-pointer hover:text-gray-500"
                            size={15}
                            onClick={() => handleEditDepartment(item.id)}
                          />
                        </span>
                      )}
                      {hasPermission(10025) && (
                        <span className="bg-red-100 p-2 rounded-md text-red-500 border border-red-500">
                          <RiDeleteBin6Line
                            className="cursor-pointer hover:text-red-700"
                            size={15}
                            onClick={() => showDeleteConfirmation(item.id)}
                          />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

              {!isLoading &&
                !loadError &&
                paginatedDepartments.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
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
        onConfirm={handleDeleteBank}
        itemName="Department"
      />
    </motion.div>
  );
}

export default Department;
