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

function WorkingOffice() {
  const { hasPermission } = usePermissions();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [offices, setOffices] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  // Filters
  const [nameFilter, setNameFilter] = useState("");
  const [descFilter, setDescFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [officeToDelete, setOfficeToDelete] = useState(null);

  // Load state
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = Cookies.get("accessToken");

  // Generic fetch wrapper
  const jsonFetch = async (url, options = {}) => {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });

    let data = null;
    try {
      if (res.status !== 204) data = await res.json();
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

  // Load all offices
  const loadOffices = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const res = await jsonFetch(
        `${API_URL}/v1/hris/workingOffice/`.replace(/([^:]\/)\/+/g, "$1"),
        { method: "GET", headers: { Authorization: `Bearer ${token}` } },
      );

      if (!res?.success || !Array.isArray(res?.data)) {
        throw new Error("Unexpected response shape from server.");
      }

      setOffices(res.data);
    } catch (err) {
      console.error("[GET] loadOffices error:", err);
      setLoadError(err.message || "Failed to load offices.");
      toast.error(err.message || "Failed to load offices.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOffices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Edit helpers
  const handleEdit = (id) => {
    const o = offices.find((x) => x.id === id);
    if (!o) {
      toast.error("Office not found.");
      return;
    }
    setName(o.name ?? "");
    setDescription(o.description ?? "");
    setEditingId(id);
  };

  const handleCancelEdit = () => {
    setName("");
    setDescription("");
    setEditingId(null);
  };

  const showDeleteConfirmation = (id) => {
    setOfficeToDelete(id);
    setIsDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setOfficeToDelete(null);
  };

  // Create or update
  // Create or Update Working Office
  const handleAddOrUpdate = async () => {
    if (!name?.trim()) {
      toast.warn("Please enter a name.");
      return;
    }

    const payload = {
      name: name.trim(),
      description: (description ?? "").trim(),
    };

    try {
      setIsSubmitting(true);

      // Decide endpoint + method
      const url = editingId
        ? `${API_URL}/v1/hris/workingOffice/${editingId}`.replace(
            /([^:]\/)\/+/g,
            "$1",
          )
        : `${API_URL}/v1/hris/workingOffice`.replace(/([^:]\/)\/+/g, "$1");

      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      // Parse backend response
      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok || !data?.success) {
        const backendMsg =
          data?.message || data?.error || res.statusText || "Unknown error";
        console.error(`[${method}] workingOffice failed:`, backendMsg, data);
        toast.error(`❌ ${backendMsg}`);
        return;
      }

      toast.success(
        editingId
          ? " Office updated successfully!"
          : " Office added successfully!",
      );

      // Reload table data
      await loadOffices();

      // Reset form if added/updated
      setName("");
      setDescription("");
      setEditingId(null);
    } catch (err) {
      console.error(
        `[${editingId ? "UPDATE" : "ADD"}] workingOffice error:`,
        err,
      );
      toast.error(err.message || "❌ Request failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!officeToDelete) return;

    try {
      setIsSubmitting(true);

      const url = `${API_URL}/v1/hris/workingOffice/${officeToDelete}/`.replace(
        /([^:]\/)\/+/g,
        "$1",
      );

      const res = await jsonFetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res?.success) {
        toast.success(res.message || "Working office deleted successfully.");
      } else {
        toast.warn("Delete request completed but no success flag.");
      }

      await loadOffices();
    } catch (err) {
      console.error("[DELETE] workingOffice error:", err);
      toast.error(err.message || "Failed to delete office.");
    } finally {
      setIsSubmitting(false);
      closeDeleteModal();
    }
  };

  // --- client-side filtering ---
  const filtered = offices.filter((o) => {
    const nameOk = nameFilter
      ? String(o.name || "")
          .toLowerCase()
          .includes(nameFilter.toLowerCase())
      : true;
    const descOk = descFilter
      ? String(o.description || "")
          .toLowerCase()
          .includes(descFilter.toLowerCase())
      : true;
    return nameOk && descOk;
  });

  // --- pagination ---
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const clampedPage = Math.min(currentPage, totalPages);
  if (clampedPage !== currentPage) setCurrentPage(clampedPage);
  const startIndex = (clampedPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const pageRows = filtered.slice(startIndex, endIndex);

  const goToPreviousPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const goToNextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

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
          <h1 className="text-xl text-gray-700 mb-4">Working Office</h1>

          <div className="flex flex-wrap gap-4 items-end mb-4">
            <div>
              <label
                htmlFor="officeName"
                className="block text-sm font-normal text-gray-700 mb-1"
              >
                Name
              </label>
              <input
                type="text"
                id="officeName"
                className="border border-gray-300 rounded-md p-2 w-80"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="officeDesc"
                className="block text-sm font-normal text-gray-700 mb-1"
              >
                Description
              </label>
              <input
                type="text"
                id="officeDesc"
                className="border border-gray-300 rounded-md p-2 w-80"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {hasPermission(10020) && (
              <button
                disabled={isSubmitting}
                className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-60 ${
                  editingId ? "bg-blue-400" : "bg-blue-500 hover:bg-blue-600"
                }`}
                onClick={handleAddOrUpdate}
              >
                {editingId
                  ? isSubmitting
                    ? "Updating…"
                    : "Update"
                  : isSubmitting
                    ? "Adding…"
                    : "Add"}
              </button>
            )}

            {editingId && (
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
                placeholder="Name"
                className="border border-gray-300 rounded-md p-2 w-80"
                value={nameFilter}
                onChange={(e) => {
                  setNameFilter(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Description"
                className="border border-gray-300 rounded-md p-2 w-80"
                value={descFilter}
                onChange={(e) => {
                  setDescFilter(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NAME
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
                pageRows.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">
                      {item.name}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                      {item.description}
                    </td>
                    <td className="p-3 py-3 flex gap-3 text-gray-600">
                      {hasPermission(10021) && (
                        <span className="bg-gray-100 p-2 rounded-md text-gray-500 border border-gray-400">
                          <TbEditCircle
                            className="cursor-pointer hover:text-gray-500"
                            size={15}
                            onClick={() => handleEdit(item.id)}
                          />
                        </span>
                      )}
                      {hasPermission(10022) && (
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

              {!isLoading && !loadError && pageRows.length === 0 && (
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
                ),
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
        onConfirm={handleDelete}
        itemName="Working Office"
      />
    </motion.div>
  );
}

export default WorkingOffice;
