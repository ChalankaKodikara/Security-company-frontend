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

function BankSetup() {
  const { hasPermission } = usePermissions();
  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [banks, setBanks] = useState([]); // local-only source of truth
  const [editingBankId, setEditingBankId] = useState(null);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  // Client-side filters
  const [bankNameFilter, setBankNameFilter] = useState("");
  const [bankCodeFilter, setBankCodeFilter] = useState("");

  // Client-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bankToDelete, setBankToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const token = Cookies.get("accessToken");
  const handleEditBank = (id) => {
    const b = banks.find((x) => x.id === id);
    if (!b) {
      toast.error("Bank not found.");
      return;
    }
    setBankName(b.bank_name);
    setBankCode(b.bank_code);
    setEditingBankId(id);
  };

  const handleCancelEdit = () => {
    setBankName("");
    setBankCode("");
    setEditingBankId(null);
  };

  const showDeleteConfirmation = (id) => {
    setBankToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setBankToDelete(null);
  };

  const handleDeleteBank = async () => {
    if (!bankToDelete) return;

    try {
      setIsSubmitting(true);

      const url = `${API_URL}/v1/hris/bank/${bankToDelete}`.replace(
        /([^:]\/)\/+/g,
        "$1",
      );

      await jsonFetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Bank deleted successfully!");

      // Refresh from server if loader exists
      if (typeof loadBanks === "function") {
        await loadBanks();
      } else {
        // fallback local delete
        setBanks((prev) => prev.filter((b) => b.id !== bankToDelete));
      }
    } catch (err) {
      console.error("[DELETE] error:", err);
      toast.error(err.message || "Failed to delete bank.");
    } finally {
      setIsSubmitting(false);
      closeDeleteModal();
    }
  };

  // --- client-side filtering ---
  const filteredBanks = banks.filter((b) => {
    const nameOk = bankNameFilter
      ? String(b.bank_name || "")
          .toLowerCase()
          .includes(bankNameFilter.toLowerCase())
      : true;
    const codeOk = bankCodeFilter
      ? String(b.bank_code || "")
          .toLowerCase()
          .includes(bankCodeFilter.toLowerCase())
      : true;
    return nameOk && codeOk;
  });

  // --- client-side pagination ---
  const totalItems = filteredBanks.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const clampedPage = Math.min(currentPage, totalPages);
  if (clampedPage !== currentPage) {
    // keep UI stable if filters reduce pages
    setCurrentPage(clampedPage);
  }
  const startIndex = (clampedPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedBanks = filteredBanks.slice(startIndex, endIndex);

  const goToPreviousPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const goToNextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  const loadBanks = async () => {
    const token = Cookies.get("accessToken");
    try {
      setIsLoading(true);
      setLoadError(null);

      const res = await jsonFetch(`${API_URL}/v1/hris/bank`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      // Expecting: { success: true, data: [...] }
      if (!res?.success || !Array.isArray(res?.data)) {
        throw new Error("Unexpected response shape from server.");
      }

      // Keep the server as the source of truth
      setBanks(res.data);
    } catch (err) {
      console.error("[GET] loadBanks error:", err);
      setLoadError(err.message || "Failed to load banks.");
      toast.error(err.message || "Failed to load banks.");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    loadBanks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleAddBank = async () => {
    if (!bankName || !bankCode) {
      toast.warn("Please enter both bank name and bank code.");
      return;
    }

    //  Validate bank_code must be numeric
    if (!/^\d+$/.test(bankCode)) {
      toast.error("Bank code must be numeric.");
      return;
    }

    const payload = {
      bank_name: bankName.trim(),
      bank_code: Number(bankCode), // always number, no quotes
    };

    try {
      setIsSubmitting(true);

      const url = editingBankId
        ? `${API_URL}/v1/hris/bank/${editingBankId}`.replace(
            /([^:]\/)\/+/g,
            "$1",
          )
        : `${API_URL}/v1/hris/bank`.replace(/([^:]\/)\/+/g, "$1");

      const method = editingBankId ? "PUT" : "POST";

      const result = await jsonFetch(url, {
        method,
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success(
        editingBankId
          ? "Bank updated successfully!"
          : "Bank added successfully!",
      );

      if (typeof loadBanks === "function") {
        await loadBanks();
      }

      setBankName("");
      setBankCode("");
      setEditingBankId(null);
    } catch (err) {
      console.error("[BANK SAVE ERROR]:", err);
      toast.error(err.message || "Failed to save bank.");
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
          <h1 className="text-xl text-gray-700 mb-4">Bank</h1>

          <div className="flex flex-wrap gap-4 items-end mb-4">
            <div>
              <label
                htmlFor="bankName"
                className="block text-sm font-normal text-gray-700 mb-1"
              >
                Bank Name
              </label>
              <input
                type="text"
                id="bankName"
                className="border border-gray-300 rounded-md p-2 w-80"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="bankCode"
                className="block text-sm font-normal text-gray-700 mb-1"
              >
                Bank Code
              </label>
              <input
                type="text"
                id="bankCode"
                className="border border-gray-300 rounded-md p-2 w-80"
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
              />
            </div>

            {hasPermission(10013) && (
              <button
                disabled={isSubmitting}
                className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-60 ${
                  editingBankId
                    ? "bg-blue-400"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
                onClick={handleAddBank}
              >
                {editingBankId
                  ? isSubmitting
                    ? "Updating…"
                    : "Update"
                  : isSubmitting
                    ? "Adding…"
                    : "Add"}
              </button>
            )}

            {editingBankId && (
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
                id="bankNameSearch"
                placeholder="Bank Name"
                className="border border-gray-300 rounded-md p-2 w-80"
                value={bankNameFilter}
                onChange={(e) => {
                  setBankNameFilter(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div>
              <input
                type="text"
                id="bankCodeSearch"
                placeholder="Bank Code"
                className="border border-gray-300 rounded-md p-2 w-80"
                value={bankCodeFilter}
                onChange={(e) => {
                  setBankCodeFilter(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BANK NAME
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BANK CODE
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
                paginatedBanks.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.bank_name}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                      {item.bank_code}
                    </td>
                    <td className="p-3 py-3 flex gap-3 text-gray-600">
                      {hasPermission(10014) && (
                        <span className="bg-gray-100 p-2 rounded-md text-gray-500 border border-gray-400">
                          <TbEditCircle
                            className="cursor-pointer hover:text-gray-500"
                            size={15}
                            onClick={() => handleEditBank(item.id)}
                          />
                        </span>
                      )}
                      {hasPermission(10015) && (
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

              {!isLoading && !loadError && paginatedBanks.length === 0 && (
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
        onConfirm={handleDeleteBank}
        itemName="Bank"
      />
    </motion.div>
  );
}

export default BankSetup;
