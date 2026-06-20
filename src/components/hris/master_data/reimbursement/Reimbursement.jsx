/** @format */

// Reimbursement.jsx
import React, { useState, useEffect } from "react";
import { RiDeleteBin6Line } from "react-icons/ri";
import { TbEditCircle } from "react-icons/tb";
import { motion } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import usePermissions from "../../../permissions/permission";

function Reimbursement() {
  const { hasPermission } = usePermissions();
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  // Form fields
  const [name, setName] = useState("");
  const [loanLimit, setLoanLimit] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [statusChanged, setStatusChanged] = useState(false);

  // Data
  const [reimbursements, setReimbursements] = useState([]);
  const [activePlanId, setActivePlanId] = useState(null);

  // Editing
  const [editingId, setEditingId] = useState(null);

  // Filters
  const [nameFilter, setNameFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Load states
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- fetch helper ---
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

  // --- loaders ---
  const loadReimbursementsByStatus = async (status = "active") => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const url = `${API_URL}/v1/hris/reimbursement-master/${status}`.replace(
        /([^:]\/)\/+/g,
        "$1"
      );
      const res = await jsonFetch(url, { method: "GET" });

      if (!res?.success || !res?.data)
        throw new Error("Unexpected reimbursement response.");

      // API can return single object → wrap in array
      const arr = Array.isArray(res.data) ? res.data : [res.data];
      setReimbursements(arr);

      if (status === "active" && res?.data?.id) {
        setActivePlanId(res.data.id);
      } else {
        setActivePlanId(null);
      }
    } catch (err) {
      console.error("[GET] reimbursement error:", err);
      setLoadError(err.message || "Failed to load reimbursements.");
      toast.error(err.message || "Failed to load reimbursements.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReimbursementsByStatus(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // --- edit helpers ---
  const handleEdit = (id) => {
    const row = reimbursements.find((x) => x.id === id);
    if (!row) return toast.error("Reimbursement not found.");
    setName(row.name ?? "");
    setLoanLimit(row.considered_loan_limit ?? "");
    setStartDate(row.start_date ?? "");
    setEndDate(row.end_date ?? "");
    setIsActive(row.is_active ?? true);
    setStatusChanged(false);
    setEditingId(id);
  };

  const handleCancelEdit = () => {
    setName("");
    setLoanLimit("");
    setStartDate("");
    setEndDate("");
    setIsActive(true);
    setStatusChanged(false);
    setEditingId(null);
  };

  // --- add / update ---
  const handleAddOrUpdate = async () => {
    if (!name?.trim()) return toast.warn("Please enter a plan name.");
    if (!loanLimit) return toast.warn("Please enter loan limit.");
    if (!startDate) return toast.warn("Please select start date.");
    if (!endDate) return toast.warn("Please select end date.");

    const payload = {
      name: name.trim(),
      considered_loan_limit: Number(loanLimit),
      start_date: startDate,
      end_date: endDate,
    };

    // UPDATE
    if (editingId) {
      try {
        setIsSubmitting(true);
        const url =
          `${API_URL}/v1/hris/reimbursement-master/update/${editingId}`.replace(
            /([^:]\/)\/+/g,
            "$1"
          );

        // 👉 Only include if dropdown was changed
        if (statusChanged) {
          payload.is_active = isActive;
        }

        await jsonFetch(url, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Reimbursement updated successfully!");
        await loadReimbursementsByStatus(statusFilter);
        handleCancelEdit();
      } catch (err) {
        console.error("[PUT] reimbursement error:", err);
        toast.error(err.message || "Failed to update reimbursement.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // CREATE
    try {
      setIsSubmitting(true);
      const url = `${API_URL}/v1/hris/reimbursement-master/add`.replace(
        /([^:]\/)\/+/g,
        "$1"
      );
      await jsonFetch(url, { method: "POST", body: JSON.stringify(payload) });
      toast.success("Reimbursement added successfully!");
      await loadReimbursementsByStatus(statusFilter);
      handleCancelEdit();
    } catch (err) {
      console.error("[POST] reimbursement error:", err);
      toast.error(err.message || "Failed to add reimbursement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- filters + pagination ---
  const filtered = reimbursements.filter((o) => {
    const a = nameFilter
      ? String(o.name || "")
          .toLowerCase()
          .includes(nameFilter.toLowerCase())
      : true;
    const b = dateFilter
      ? String(o.start_date || "").includes(dateFilter) ||
        String(o.end_date || "").includes(dateFilter)
      : true;
    return a && b;
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
      <div className="font-montserrat">
        {/* Form */}
        <div className="bg-white p-4 rounded-md mt-5 shadow">
          <h1 className="text-xl text-gray-700 mb-4">Reimbursement</h1>

          <div className="flex flex-wrap gap-4 items-end mb-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Plan Name
              </label>
              <input
                type="text"
                className="border border-gray-300 rounded-md p-2 w-80"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Loan Limit
              </label>
              <input
                type="number"
                className="border border-gray-300 rounded-md p-2 w-80"
                value={loanLimit}
                onChange={(e) => setLoanLimit(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                className="border border-gray-300 rounded-md p-2 w-80"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                className="border border-gray-300 rounded-md p-2 w-80"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {editingId && (
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="border border-gray-300 rounded-md p-2 w-80 bg-white"
                  value={isActive ? "true" : "false"}
                  onChange={(e) => {
                    setIsActive(e.target.value === "true");
                    setStatusChanged(true);
                  }}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            )}

            {hasPermission(10032) && (
              <button
                disabled={isSubmitting}
                className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 disabled:opacity-60 ${
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

        {/* Filters */}
        <div className="bg-white pt-6 rounded-md mt-5 shadow ">
          <div className="flex flex-wrap gap-4 items-end mb-4 mx-4">
            <select
              className="border border-gray-300 rounded-md p-2 w-60 bg-white"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <input
              type="text"
              placeholder="Plan Name"
              className="border border-gray-300 rounded-md p-2 w-80"
              value={nameFilter}
              onChange={(e) => {
                setNameFilter(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Table */}
          <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  NAME
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  LOAN LIMIT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  START DATE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  END DATE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  CREATED BY
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  STATUS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-6 text-center text-sm text-gray-500"
                  >
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && loadError && (
                <tr>
                  <td
                    colSpan={7}
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
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {item.name}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {item.considered_loan_limit}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {item.start_date}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {item.end_date}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {item.created_by}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {item.is_active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-600 rounded">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-3 flex gap-3 text-gray-600">
                      {hasPermission(10033) && (
                        <span className="bg-gray-100 p-2 rounded-md text-gray-500 border border-gray-400">
                          <TbEditCircle
                            className="cursor-pointer hover:text-gray-500"
                            size={15}
                            onClick={() => handleEdit(item.id)}
                          />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              {!isLoading && !loadError && pageRows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
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
    </motion.div>
  );
}

export default Reimbursement;
