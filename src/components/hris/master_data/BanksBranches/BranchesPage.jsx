/** @format */

import React, { useEffect, useMemo, useState } from "react";
import { RiDeleteBin6Line } from "react-icons/ri";
import { TbEditCircle } from "react-icons/tb";
import { motion } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import Select from "react-select";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import usePermissions from "../../../permissions/permission";

const API_URL = process.env.REACT_APP_FRONTEND_URL;
const token = Cookies.get("accessToken");
const CREATE_ENDPOINT = `${API_URL}/v1/hris/bank-branch/create-bank-branch`;

const GET_ALL_BRANCHES_ENDPOINT = `${API_URL}/v1/hris/bank-branch/get-all-branches`;
const UPDATE_ENDPOINT = (id) =>
  `${API_URL}/v1/hris/bank-branch/update-bank-branch/${id}`;
const GET_ALL_BANKS_ENDPOINT = `${API_URL}/v1/hris/bank`;

function BranchesPage() {
  const { hasPermission } = usePermissions();
  // ---------- Remote data ----------
  const [apiBranches, setApiBranches] = useState([]); // rows from GET /get-all-branches
  const [bankOptions, setBankOptions] = useState([]); // from response.Bank
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  // ---------- Form state ----------
  const [selectedBankId, setSelectedBankId] = useState(null);
  const [bankCode, setBankCode] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState(null); // branch dropdown (dependent)
  const [branchName, setBranchName] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [branchContactNumber, setBranchContactNumber] = useState("");
  const [branchAddress, setBranchAddress] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [editingRowId, setEditingRowId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ---------- Filters & pagination (client-side) ----------
  const [filterBankName, setFilterBankName] = useState("");
  const [filterBankCode, setFilterBankCode] = useState("");
  const [filterBranchName, setFilterBranchName] = useState("");
  const [filterBranchCode, setFilterBranchCode] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ---------- Delete modal ----------
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);

  // ---------- District options (static) ----------
  const districts = [
    { id: 1, name: "Ampara" },
    { id: 2, name: "Anuradhapura" },
    { id: 3, name: "Badulla" },
    { id: 4, name: "Batticaloa" },
    { id: 5, name: "Colombo" },
    { id: 6, name: "Galle" },
    { id: 7, name: "Gampaha" },
    { id: 8, name: "Hambantota" },
    { id: 9, name: "Jaffna" },
    { id: 10, name: "Kalutara" },
    { id: 11, name: "Kandy" },
    { id: 12, name: "Kegalle" },
    { id: 13, name: "Kilinochchi" },
    { id: 14, name: "Kurunegala" },
    { id: 15, name: "Mannar" },
    { id: 16, name: "Matale" },
    { id: 17, name: "Matara" },
    { id: 18, name: "Monaragala" },
    { id: 19, name: "Mullaitivu" },
    { id: 20, name: "Nuwara Eliya" },
    { id: 21, name: "Polonnaruwa" },
    { id: 22, name: "Puttalam" },
    { id: 23, name: "Ratnapura" },
    { id: 24, name: "Trincomalee" },
    { id: 25, name: "Vavuniya" },
  ];

  // Load banks list
  useEffect(() => {
    const loadBanks = async () => {
      try {
        setLoading(true);
        setLoadError("");
        const res = await fetch(GET_ALL_BANKS_ENDPOINT, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`Failed to load banks (${res.status})`);
        const json = await res.json();
        const list = Array.isArray(json?.data) ? json.data : [];

        const options = list.map((bank) => ({
          value: bank.id,
          label: bank.bank_name,
          bank_code: bank.bank_code,
        }));

        setBankOptions(options);
      } catch (e) {
        setLoadError(e.message || "Failed to load banks.");
      } finally {
        setLoading(false);
      }
    };
    loadBanks();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setLoadError("");
        const res = await fetch(GET_ALL_BRANCHES_ENDPOINT, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`Failed to load branches (${res.status})`);
        const json = await res.json();
        const list = Array.isArray(json?.data) ? json.data : [];
        setApiBranches(list);
      } catch (e) {
        setLoadError(e.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
  // ---------- Helpers ----------
  const findBankById = (id) =>
    bankOptions.find((b) => Number(b.value) === Number(id)) || null;

  // Dependent branch dropdown (from API) filtered by selected bank
  const branchOptions = useMemo(() => {
    if (!selectedBankId) return [];
    return apiBranches
      .filter((b) => Number(b.bankId) === Number(selectedBankId))
      .map((b) => ({
        value: b.id,
        label: b.branch_code
          ? `${b.branch_name} (${b.branch_code})`
          : b.branch_name,
        raw: b,
      }));
  }, [apiBranches, selectedBankId]);

  // ---------- Clear form ----------
  const clearForm = () => {
    setSelectedBankId(null);
    setBankCode("");
    setSelectedBranchId(null);
    setBranchName("");
    setBranchCode("");
    setBranchContactNumber("");
    setBranchAddress("");
    setSelectedDistrict("");
    setEditingRowId(null);
  };

  // ---------- API: POST ----------
  const createBranch = async (payload) => {
    try {
      setSubmitting(true);
      const res = await fetch(CREATE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Create failed with status ${res.status}`);
      }
      const json = await res.json();
      const created = json?.data || payload;

      setApiBranches((prev) => [...prev, created]);
      toast.success("Branch created successfully.");
      clearForm();
    } catch (e) {
      toast.error(e.message || "Failed to create branch.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- API: PUT ----------
  const updateBranch = async (id, payload) => {
    try {
      setSubmitting(true);

      // ensure bankId is included in the body
      const body = {
        bankId: Number(selectedBankId),
        branch_name: payload.branch_name,
        branch_code: payload.branch_code,
        branch_contact_number: payload.branch_contact_number,
        branch_address: payload.branch_address,
        branch_district: payload.branch_district,
      };

      const res = await fetch(
        `${API_URL}/v1/hris/bank-branch/update-bank-branch/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        throw new Error(`Update failed with status ${res.status}`);
      }

      const json = await res.json();

      // update local state
      setApiBranches((prev) =>
        prev.map((row) =>
          row.id === id
            ? {
                ...row,
                ...payload, // use the request body to keep all updated fields
                ...json.data, // backend response (id, bankId, etc.)
                Bank: findBankById(payload.bankId), // ensure Bank object is up to date
              }
            : row,
        ),
      );

      toast.success("Branch updated successfully.");
      clearForm();
    } catch (e) {
      toast.error(e.message || "Failed to update branch.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Main handler ----------
  const handleAddBranch = () => {
    const payload = {
      bankId: Number(selectedBankId),
      branch_name: branchName,
      branch_code: branchCode,
      branch_contact_number: branchContactNumber,
      branch_address: branchAddress,
      branch_district: selectedDistrict,
    };

    if (editingRowId) {
      updateBranch(editingRowId, payload); // PUT
    } else {
      createBranch(payload); // POST
    }
  };

  // ---------- Edit row ----------
  const handleEditRow = (row) => {
    setEditingRowId(row.id);
    setSelectedBankId(row.bankId);
    const bank = findBankById(row.bankId);
    setBankCode(bank?.bank_code || "");
    setSelectedBranchId(row.id);
    setBranchName(row.branch_name || "");
    setBranchCode(row.branch_code || "");
    setBranchContactNumber(row.branch_contact_number || "");
    setBranchAddress(row.branch_address || "");
    setSelectedDistrict(row.branch_district || "");
  };

  // ---------- Delete ----------
  const showDeleteConfirmation = (id) => {
    setBranchToDelete(id);
    setIsDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setBranchToDelete(null);
  };
  const deleteBranch = async (id) => {
    try {
      const res = await fetch(
        `${API_URL}/v1/hris/bank-branch/delete-bank-branch/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Delete failed with status ${res.status}`);
      }

      await res.json();

      // Update UI state
      setApiBranches((prev) => prev.filter((row) => row.id !== id));

      toast.success("Branch deleted successfully.");
      closeDeleteModal();
    } catch (e) {
      toast.error(e.message || "Failed to delete branch.");
    }
  };

  const handleDelete = () => {
    if (!branchToDelete) return;
    deleteBranch(branchToDelete);
  };

  // ---------- Filtering & paging on apiBranches ----------
  const filteredRows = useMemo(() => {
    return apiBranches.filter((r) => {
      const bank = r.Bank;
      const bankName = (bank?.bank_name || "").toLowerCase();
      const bankCodeStr = (bank?.bank_code || "").toLowerCase();
      const matchesBankName = bankName.includes(filterBankName.toLowerCase());
      const matchesBankCode = bankCodeStr.includes(
        filterBankCode.toLowerCase(),
      );
      const matchesBranchName = (r.branch_name || "")
        .toLowerCase()
        .includes(filterBranchName.toLowerCase());
      const matchesBranchCode = (r.branch_code || "")
        .toLowerCase()
        .includes(filterBranchCode.toLowerCase());
      return (
        matchesBankName &&
        matchesBankCode &&
        matchesBranchName &&
        matchesBranchCode
      );
    });
  }, [
    apiBranches,
    filterBankName,
    filterBankCode,
    filterBranchName,
    filterBranchCode,
  ]);

  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = (currentPage - 1) * pageSize;
  const pagedBranches = filteredRows.slice(start, start + pageSize);
  const startIndex = start;
  const endIndex = start + pagedBranches.length;

  const getPaginationLinks = () => {
    const links = [];
    const maxButtons = 5;
    links.push(1);
    if (currentPage > 3) links.push("...");
    let s = Math.max(currentPage - 1, 2);
    let e = Math.min(currentPage + 1, totalPages - 1);
    if (totalPages <= maxButtons) {
      s = 2;
      e = totalPages - 1;
    } else if (e - s < maxButtons - 3) {
      if (currentPage < totalPages / 2)
        e = Math.min(s + maxButtons - 3, totalPages - 1);
      else s = Math.max(e - maxButtons + 3, 2);
    }
    for (let i = s; i <= e; i++) links.push(i);
    if (currentPage < totalPages - 2 && totalPages > maxButtons)
      links.push("...");
    if (totalPages > 1) links.push(totalPages);
    return links;
  };
  const paginationLinks = getPaginationLinks();
  const goPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));
  const handlePageSizeChange = (e) => {
    setPageSize(parseInt(e.target.value, 10));
    setCurrentPage(1);
  };
  const handleFilterChange = (e) => {
    const { id, value } = e.target;
    setCurrentPage(1);
    if (id === "bankName") setFilterBankName(value);
    if (id === "bankCode") setFilterBankCode(value);
    if (id === "branchName") setFilterBranchName(value);
    if (id === "branchCode") setFilterBranchCode(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
    >
      <div className="bg-white p-4 rounded-md mt-5 shadow">
        <h1 className="text-xl text-gray-700 mb-4">Branch Setup</h1>

        {/* --- Form --- */}
        <div className="mb-4">
          {/* Row 1 */}
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Name of the Bank
              </label>
              <Select
                options={bankOptions}
                value={
                  bankOptions.find(
                    (o) => Number(o.value) === Number(selectedBankId),
                  ) || null
                }
                onChange={(opt) => {
                  const id = opt ? opt.value : null;
                  setSelectedBankId(id);
                  setBankCode(opt ? opt.bank_code : ""); //  auto set bank_code
                  setSelectedBranchId(null);
                }}
                placeholder={loading ? "Loading..." : "Select Bank"}
                isClearable
                isDisabled={loading}
                styles={{ control: (p) => ({ ...p, width: "20rem" }) }}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Bank Code
              </label>
              <input
                className="border bg-gray-200 rounded-md p-2 w-80"
                value={bankCode}
                disabled
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Branch Name
              </label>
              <input
                className="border rounded-md p-2 w-80"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Branch Code
              </label>
              <input
                className="border rounded-md p-2 w-80"
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value)}
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="flex flex-wrap gap-4 items-end mt-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Branch Contact number
              </label>
              <input
                className="border rounded-md p-2 w-80"
                value={branchContactNumber}
                onChange={(e) => setBranchContactNumber(e.target.value)}
                placeholder="e.g. 0112345678"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                District
              </label>
              <select
                className="border rounded-md p-2 w-80"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
              >
                <option value="">Select</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Branch Address
              </label>
              <input
                className="border rounded-md p-2 w-96"
                value={branchAddress}
                onChange={(e) => setBranchAddress(e.target.value)}
              />
            </div>

            {hasPermission(10016) && (
              <button
                className={`px-4 py-2 text-white rounded-md focus:outline-none ${
                  editingRowId
                    ? "bg-blue-400 hover:bg-blue-500"
                    : "bg-blue-600 hover:bg-blue-700"
                } ${submitting ? "opacity-70 cursor-not-allowed" : ""}`}
                onClick={handleAddBranch}
                disabled={submitting}
              >
                {submitting
                  ? editingRowId
                    ? "Updating..."
                    : "Adding..."
                  : editingRowId
                    ? "Update"
                    : "Add"}
              </button>
            )}

            {editingRowId && (
              <button
                className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-100"
                onClick={clearForm}
                disabled={submitting}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- Filters for table --- */}
      <div className="bg-white pt-6 rounded-md mt-5 shadow max-w-8xl">
        <div className="flex flex-wrap gap-4 items-end mb-4 mx-2">
          <input
            id="bankName"
            placeholder="Bank Name"
            className="border rounded-md p-2 w-60"
            value={filterBankName}
            onChange={handleFilterChange}
          />
        </div>

        <div className="flex flex-wrap gap-4 items-end mb-4 mx-2">
          <input
            id="bankCode"
            placeholder="Bank Code"
            className="border rounded-md p-2 w-60"
            value={filterBankCode}
            onChange={handleFilterChange}
          />
          <input
            id="branchName"
            placeholder="Branch Name"
            className="border rounded-md p-2 w-60"
            value={filterBranchName}
            onChange={handleFilterChange}
          />
          <input
            id="branchCode"
            placeholder="Branch Code"
            className="border rounded-md p-2 w-60"
            value={filterBranchCode}
            onChange={handleFilterChange}
          />
          <select
            className="border rounded-md p-2 w-40"
            value={pageSize}
            onChange={handlePageSizeChange}
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        </div>

        {/* --- TABLE (driven by GET response) --- */}
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
                BRANCH NAME
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                BRANCH CODE
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                DISTRICT
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                BRANCH ADDRESS
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {loadError ? (
              <tr>
                <td
                  colSpan="7"
                  className="px-6 py-4 text-center text-sm text-red-600"
                >
                  {loadError}
                </td>
              </tr>
            ) : loading ? (
              <tr>
                <td
                  colSpan="7"
                  className="px-6 py-6 text-center text-sm text-gray-500"
                >
                  Loading…
                </td>
              </tr>
            ) : pagedBranches.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No branches found.
                </td>
              </tr>
            ) : (
              pagedBranches.map((branch) => {
                const bank = branch.Bank; // from API
                return (
                  <tr key={branch.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bank?.bank_name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bank?.bank_code || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {branch.branch_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {branch.branch_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {branch.branch_district || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {branch.branch_address || "—"}
                    </td>
                    <td className="p-3 py-5 flex gap-3 text-gray-600">
                      {hasPermission(10017) && (
                        <span className="bg-gray-100 p-2 rounded-md text-gray-500 border border-gray-400">
                          <TbEditCircle
                            className="cursor-pointer hover:text-gray-500"
                            size={15}
                            onClick={() => handleEditRow(branch)}
                          />
                        </span>
                      )}
                      {hasPermission(10018) && (
                        <span className="bg-red-100 p-2 rounded-md text-red-500 border border-red-500">
                          <RiDeleteBin6Line
                            className="cursor-pointer hover:text-blue-500"
                            size={15}
                            onClick={() => showDeleteConfirmation(branch.id)}
                          />
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pager */}
        <div className="flex items-center justify-between px-6 py-4 text-sm text-gray-600">
          <div>
            Showing {totalItems === 0 ? 0 : startIndex + 1} to{" "}
            {Math.min(endIndex, totalItems)} of {totalItems} entries
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={goPrev}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Previous
            </button>
            {getPaginationLinks().map((p, idx) => (
              <React.Fragment key={idx}>
                {p === "..." ? (
                  <span className="px-3 py-1">...</span>
                ) : (
                  <button
                    onClick={() => setCurrentPage(p)}
                    className={`px-3 py-1 rounded ${
                      currentPage === p
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    {p}
                  </button>
                )}
              </React.Fragment>
            ))}
            <button
              onClick={goNext}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        itemName="Branch"
      />

      <ToastContainer position="top-right" autoClose={3000} />
    </motion.div>
  );
}

export default BranchesPage;
