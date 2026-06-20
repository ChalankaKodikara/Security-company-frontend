/** @format */

// Designations.jsx
import React, { useState, useEffect, useMemo } from "react";
import { RiDeleteBin6Line } from "react-icons/ri";
import { TbEditCircle } from "react-icons/tb";
import { motion } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import Cookies from "js-cookie";
import { he } from "date-fns/locale";
import usePermissions from "../../../permissions/permission";

function Designations() {
  const { hasPermission } = usePermissions();
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  // Form fields
  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  // Data
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Editing
  const [editingId, setEditingId] = useState(null);

  // Filters
  const [titleFilter, setTitleFilter] = useState("");
  const [deptNameFilter, setDeptNameFilter] = useState("");
  const [deptDescFilter, setDeptDescFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Delete designation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [designationToDelete, setDesignationToDelete] = useState(null);

  // Delete department modal (NEW)
  const [isDeptDeleteModalOpen, setIsDeptDeleteModalOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);

  // Load / submit states
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = Cookies.get("accessToken");

  // --- fetch helper ---
  const jsonFetch = async (url, options = {}) => {
    //  get token once here
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, //  send token for every call
        ...options.headers,
      },
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

  // --- loaders ---
  const loadDepartments = async () => {
    const token = Cookies.get("accessToken");
    try {
      const url = `${API_URL}/v1/hris/department/`.replace(
        /([^:]\/)\/+/g,
        "$1",
      );
      const res = await jsonFetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res?.success || !Array.isArray(res?.data))
        throw new Error("Unexpected department response.");
      setDepartments(res.data); // [{id, name, description}]
    } catch (err) {
      console.error("[GET] departments error:", err);
      toast.error(err.message || "Failed to load departments.");
    }
  };

  const loadDesignations = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const url = `${API_URL}/v1/hris/designation`.replace(
        /([^:]\/)\/+/g,
        "$1",
      );

      const res = await jsonFetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res?.success || !Array.isArray(res?.data))
        throw new Error("Unexpected designation response.");
      setDesignations(res.data);
    } catch (err) {
      console.error("[GET] designations error:", err);
      setLoadError(err.message || "Failed to load designations.");
      toast.error(err.message || "Failed to load designations.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
    loadDesignations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const departmentOptions = useMemo(() => departments, [departments]);

  // --- edit helpers ---
  const handleEdit = (id) => {
    const row = designations.find((x) => x.id === id);
    if (!row) return toast.error("Designation not found.");
    setTitle(row.title ?? "");
    setDepartmentId(String(row.departmentId ?? ""));
    setEditingId(id);
  };

  const handleCancelEdit = () => {
    setTitle("");
    setDepartmentId("");
    setEditingId(null);
  };

  // --- delete designation flow ---
  const showDeleteConfirmation = (id) => {
    setDesignationToDelete(id);
    setIsDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDesignationToDelete(null);
  };

  const handleDelete = async () => {
    if (!designationToDelete) return;
    try {
      setIsSubmitting(true);
      const url =
        `${API_URL}/v1/hris/designation/${designationToDelete}`.replace(
          /([^:]\/)\/+/g,
          "$1",
        );
      const res = await jsonFetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res?.success)
        toast.success(res.message || "Designation deleted successfully.");
      await loadDesignations();
    } catch (err) {
      console.error("[DELETE] designation error:", err);
      toast.error(err.message || "Failed to delete designation.");
    } finally {
      setIsSubmitting(false);
      closeDeleteModal();
    }
  };

  // --- delete department flow (NEW) ---
  const showDeptDeleteConfirmation = () => {
    if (!departmentId) return toast.warn("Select a department first.");
    setDepartmentToDelete(Number(departmentId));
    setIsDeptDeleteModalOpen(true);
  };
  const closeDeptDeleteModal = () => {
    setIsDeptDeleteModalOpen(false);
    setDepartmentToDelete(null);
  };

  const handleDepartmentDelete = async () => {
    if (!departmentToDelete) return;
    const token = Cookies.get("accessToken");
    try {
      setIsSubmitting(true);
      const url = `${API_URL}/v1/hris/department/${departmentToDelete}`.replace(
        /([^:]\/)\/+/g,
        "$1",
      );
      const res = await jsonFetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res?.success) {
        toast.success(res.message || "Department deleted successfully.");
      } else {
        toast.warn("Delete request completed but no success flag.");
      }
      // refresh deps + table; clear selection if deleted one was selected
      await loadDepartments();
      await loadDesignations();
      if (String(departmentToDelete) === String(departmentId)) {
        setDepartmentId("");
      }
    } catch (err) {
      console.error("[DELETE] department error:", err);
      toast.error(err.message || "Failed to delete department.");
    } finally {
      setIsSubmitting(false);
      closeDeptDeleteModal();
    }
  };

  // --- create/update designation ---
  const handleAddOrUpdate = async () => {
    if (!title?.trim()) return toast.warn("Please enter a title.");
    if (!departmentId) return toast.warn("Please select a department.");

    const payload = {
      title: title.trim(),
      departmentId: Number(departmentId),
    };

    try {
      setIsSubmitting(true);

      const url = editingId
        ? `${API_URL}/v1/hris/designation/${editingId}`.replace(
            /([^:]\/)\/+/g,
            "$1",
          )
        : `${API_URL}/v1/hris/designation`.replace(/([^:]\/)\/+/g, "$1");

      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        const msg = data?.message || data?.error || res.statusText;
        console.error(`[${method}] designation failed:`, msg, data);
        toast.error(`❌ ${msg}`);
        return;
      }

      toast.success(
        editingId
          ? " Designation updated successfully!"
          : " Designation added successfully!",
      );
      await loadDesignations();
      setTitle("");
      setDepartmentId("");
      setEditingId(null);
    } catch (err) {
      console.error(
        `[${editingId ? "UPDATE" : "ADD"}] designation error:`,
        err,
      );
      toast.error(err.message || "❌ Request failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- filters + pagination ---
  const filtered = designations.filter((o) => {
    const depName = o?.Department?.name || "";
    const depDesc = o?.Department?.description || "";
    const a = titleFilter
      ? String(o.title || "")
          .toLowerCase()
          .includes(titleFilter.toLowerCase())
      : true;
    const b = deptNameFilter
      ? depName.toLowerCase().includes(deptNameFilter.toLowerCase())
      : true;
    const c = deptDescFilter
      ? depDesc.toLowerCase().includes(deptDescFilter.toLowerCase())
      : true;
    return a && b && c;
  });

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const clampedPage = Math.min(currentPage, totalPages);
  if (clampedPage !== currentPage) setCurrentPage(clampedPage);
  const startIndex = (clampedPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const pageRows = filtered.slice(startIndex, endIndex);

  const goToPreviousPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const goToNextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  // --- render ---
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
          <h1 className="text-xl text-gray-700 mb-4">Designations</h1>

          <div className="flex flex-wrap gap-4 items-end mb-4">
            <div>
              <label
                htmlFor="desigTitle"
                className="block text-sm font-normal text-gray-700 mb-1"
              >
                Title
              </label>
              <input
                type="text"
                id="desigTitle"
                className="border border-gray-300 rounded-md p-2 w-80"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <div>
                <label
                  htmlFor="desigDept"
                  className="block text-sm font-normal text-gray-700 mb-1"
                >
                  Department
                </label>
                <select
                  id="desigDept"
                  className="border border-gray-300 rounded-md p-2 w-80 bg-white"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                >
                  <option value="">— Select Department —</option>
                  {departmentOptions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                      {d.description ? ` — ${d.description}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Delete Department (NEW) */}
            </div>

            {hasPermission(10026) && (
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
            <input
              type="text"
              placeholder="Title"
              className="border border-gray-300 rounded-md p-2 w-80"
              value={titleFilter}
              onChange={(e) => {
                setTitleFilter(e.target.value);
                setCurrentPage(1);
              }}
            />
            <input
              type="text"
              placeholder="Department Name"
              className="border border-gray-300 rounded-md p-2 w-80"
              value={deptNameFilter}
              onChange={(e) => {
                setDeptNameFilter(e.target.value);
                setCurrentPage(1);
              }}
            />
            <input
              type="text"
              placeholder="Department Description"
              className="border border-gray-300 rounded-md p-2 w-80"
              value={deptDescFilter}
              onChange={(e) => {
                setDeptDescFilter(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TITLE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DEPARTMENT NAME
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DEPARTMENT DESCRIPTION
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
                pageRows.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">
                      {item.title}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">
                      {item?.Department?.name ?? "-"}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                      {item?.Department?.description ?? "-"}
                    </td>
                    <td className="p-3 py-3 flex gap-3 text-gray-600">
                      {hasPermission(10027) && (
                        <span className="bg-gray-100 p-2 rounded-md text-gray-500 border border-gray-400">
                          <TbEditCircle
                            className="cursor-pointer hover:text-gray-500"
                            size={15}
                            onClick={() => handleEdit(item.id)}
                          />
                        </span>
                      )}
                      {hasPermission(10028) && (
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

      {/* Delete designation modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        itemName="Designation"
      />

      {/* Delete department modal (NEW) */}
      <DeleteConfirmationModal
        isOpen={isDeptDeleteModalOpen}
        onClose={closeDeptDeleteModal}
        onConfirm={handleDepartmentDelete}
        itemName="Department"
      />
    </motion.div>
  );
}

export default Designations;
