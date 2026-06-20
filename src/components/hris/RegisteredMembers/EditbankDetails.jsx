/** @format */

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import Select from "react-select";
import { apiFetch } from "../../../utils/apiClient";

const EditBankDetails = ({
  bankData,
  memberNo, // <- make sure parent passes this
  onClose,
  onUpdateSuccess,
  accountName,
  accountNumber,
  bankId,
  branchId,
}) => {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const [banks, setBanks] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteFileId, setDeleteFileId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initial form state from props -> bankData -> fallback ""
  const [form, setForm] = useState({
    account_number:
      accountNumber ??
      bankData?.account_number ??
      bankData?.employee_account_no ??
      "",
    account_name:
      accountName ??
      bankData?.account_name ??
      bankData?.employee_account_name ??
      "",
    bank_id: bankId ?? bankData?.bank_id ?? bankData?.employee_bank_id ?? "",
    branch_id:
      branchId ??
      bankData?.branch_id ??
      bankData?.employee_bank_branch_id ??
      "",
    bank_document: null,
  });

  // If the parent data changes while modal is open, sync once
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      account_number:
        accountNumber ??
        bankData?.account_number ??
        bankData?.employee_account_no ??
        prev.account_number,
      account_name:
        accountName ??
        bankData?.account_name ??
        bankData?.employee_account_name ??
        prev.account_name,
      bank_id:
        bankId ??
        bankData?.bank_id ??
        bankData?.employee_bank_id ??
        prev.bank_id,
      branch_id:
        branchId ??
        bankData?.branch_id ??
        bankData?.employee_bank_branch_id ??
        prev.branch_id,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountName, accountNumber, bankId, branchId, bankData]);

  const [filePreviewName, setFilePreviewName] = useState(
    bankData?.bank_files?.[0]?.original_file_name || null,
  );

  // Fetch all banks, then if we have an initial bank, fetch its branches
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(`${API_URL}/v1/hris/bank`, {});
        const data = await res.json();
        if (!data?.data) throw new Error("No banks found");
        setBanks(data.data);

        const initialBank = Number(
          bankId ??
            bankData?.bank_id ??
            bankData?.employee_bank_id ??
            form.bank_id,
        );
        if (initialBank) {
          await fetchBranches(initialBank, /*keepBranch*/ true);
        }
      } catch (err) {
        console.error("Bank fetch error", err);
        toast.error("Failed to load banks.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Abort control to avoid race conditions when rapidly switching banks
  const branchAbortRef = useRef(null);

  const fetchBranches = async (bankId, keepBranch = false) => {
    if (!bankId) {
      setBranches([]);
      if (!keepBranch) setForm((p) => ({ ...p, branch_id: "" }));
      return;
    }

    if (branchAbortRef.current) branchAbortRef.current.abort();
    const controller = new AbortController();
    branchAbortRef.current = controller;

    try {
      setBranchesLoading(true);

      const res = await apiFetch(
        `${API_URL}/v1/hris/bank-branch/get-branches-by-bank/${bankId}`,
        {
          signal: controller.signal,
        },
      );
      if (!res.ok) throw new Error(`Branch fetch failed (${res.status})`);
      const json = await res.json();

      if (!json?.success)
        throw new Error(json?.message || "Failed to load branches");

      const list = Array.isArray(json.data) ? json.data : [];
      setBranches(list);

      // If current branch not in list, clear it unless told to keep
      const currentBranch = Number(
        branchId ??
          bankData?.branch_id ??
          bankData?.employee_bank_branch_id ??
          form.branch_id,
      );
      if (currentBranch && !list.some((b) => b.id === Number(currentBranch))) {
        setForm((p) => ({ ...p, branch_id: "" }));
      } else if (keepBranch && currentBranch) {
        // Ensure form keeps current valid branch on first load
        setForm((p) => ({ ...p, branch_id: currentBranch }));
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Branch fetch error", err);
        setBranches([]);
        toast.error("Failed to load branches for selected bank.");
        if (!keepBranch) setForm((p) => ({ ...p, branch_id: "" }));
      }
    } finally {
      setBranchesLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numeric = ["bank_id", "branch_id"].includes(name)
      ? value
        ? Number(value)
        : ""
      : value;
    setForm((prev) => ({ ...prev, [name]: numeric }));
  };

  const handleBankChange = async (e) => {
    const bId = Number(e.target.value) || "";
    setForm((prev) => ({ ...prev, bank_id: bId, branch_id: "" }));
    await fetchBranches(bId);
  };

  const handleBranchChange = (e) => {
    const brId = Number(e.target.value) || "";
    setForm((prev) => ({ ...prev, branch_id: brId }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((prev) => ({ ...prev, bank_document: file }));
      setFilePreviewName(file.name);
    }
  };

  const handleRemoveFile = (fileId) => {
    if (!fileId) {
      toast.error("Invalid file");
      return;
    }
    setDeleteFileId(fileId);
    setShowDeleteConfirm(true);
  };

  const handleSubmit = async () => {
    if (!form.bank_id) return toast.error("Please select a bank.");
    if (!form.branch_id) return toast.error("Please select a branch.");

    try {
      const formData = new FormData();

      formData.append("employee_account_no", form.account_number || "");
      formData.append("employee_account_name", form.account_name || "");
      formData.append("employee_bank_id", String(form.bank_id));
      formData.append("employee_bank_branch_id", String(form.branch_id));

      if (form.bank_document) {
        formData.append("bank_document", form.bank_document);
      }

      const res = await apiFetch(
        `${API_URL}/v1/hris/employees/bank-details/${memberNo}`,
        {
          method: "PUT",
          body: formData, // 🔥 apiFetch now auto handles FormData
        },
      );

      const result = await res.json();

      if (res.ok && result?.success) {
        toast.success("Bank details updated successfully!");
        onUpdateSuccess?.();
        onClose?.();
      } else {
        toast.error(result?.message || `Update failed (${res.status})`);
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while updating!");
    }
  };

  const handleConfirmDeleteFile = async () => {
    try {
      const res = await apiFetch(
        `${API_URL}/v1/hris/employees/bank-details?employee_no=${memberNo}&file_id=${deleteFileId}`,
        {
          method: "DELETE",
        },
      );

      const result = await res.json();

      if (res.ok && result.success) {
        toast.success(result.message || "Bank document deleted successfully");

        setDeleteFileId(null);
        setShowDeleteConfirm(false);
        setFilePreviewName(null);

        onUpdateSuccess?.();
      } else {
        toast.error(result.message || "Failed to delete bank document");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting bank document");
    }
  };

  const inputStyle = "w-full border border-gray-300 p-2 rounded text-sm";
  const labelStyle = "block text-sm text-gray-600 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-white/10 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="relative bg-white w-full sm:w-[700px] h-full p-6 overflow-y-auto z-10 shadow-xl"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Edit Bank Details & Documents
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-2 gap-4 text-gray-700"
        >
          <div>
            <label className={labelStyle}>Account Number</label>
            <input
              name="account_number"
              value={form.account_number}
              onChange={handleChange}
              className={inputStyle}
              required
            />
          </div>

          <div>
            <label className={labelStyle}>Account Name</label>
            <input
              name="account_name"
              value={form.account_name}
              onChange={handleChange}
              className={inputStyle}
              required
            />
          </div>

          <div>
            <label className={labelStyle}>Bank</label>
            <select
              name="bank_id"
              value={form.bank_id}
              onChange={handleBankChange}
              className={inputStyle}
              required
            >
              <option value="">Select Bank</option>
              {banks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.bank_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelStyle}>Branch</label>
            <Select
              name="branch_id"
              value={
                branches.find((b) => b.id === form.branch_id)
                  ? {
                      value: form.branch_id,
                      label: branches.find((b) => b.id === form.branch_id)
                        .branch_code
                        ? `${branches.find((b) => b.id === form.branch_id).branch_code} — ${
                            branches.find((b) => b.id === form.branch_id)
                              .branch_name
                          }`
                        : branches.find((b) => b.id === form.branch_id)
                            .branch_name,
                    }
                  : null
              }
              onChange={(option) =>
                setForm((prev) => ({ ...prev, branch_id: option?.value || "" }))
              }
              options={branches.map((branch) => ({
                value: branch.id,
                label: branch.branch_code
                  ? `${branch.branch_code} — ${branch.branch_name}`
                  : branch.branch_name,
              }))}
              isLoading={branchesLoading}
              isDisabled={!form.bank_id}
              placeholder={
                branchesLoading ? "Loading..." : "Select or Search Branch"
              }
              className="text-sm"
            />
          </div>

          {/* File Upload */}
          <div className="col-span-2 mt-2">
            <label className={labelStyle}>
              Bank Document Upload (PDF/JPG/PNG)
            </label>
            {filePreviewName ? (
              <div className="border-dashed border-2 border-gray-300 p-4 rounded flex items-center justify-between bg-gray-50">
                <div className="flex items-center space-x-2">
                  <img src="/pdf-icon.svg" alt="file" className="w-6 h-6" />
                  <span className="text-sm">{filePreviewName}</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleRemoveFile(bankData?.bank_files?.[0]?.id)
                  }
                  className="text-red-600 font-bold text-lg"
                >
                  &times;
                </button>
              </div>
            ) : (
              <input
                type="file"
                name="bank_document"
                onChange={handleFileChange}
                accept="application/pdf,image/*"
                className={inputStyle}
              />
            )}
          </div>

          <div className="col-span-2 flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 px-4 py-2 rounded text-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="bg-blue-600 px-4 py-2 text-white rounded"
            >
              Update
            </button>
          </div>
        </form>

        {showConfirm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded shadow-lg w-96">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Confirm Update
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to update this employee’s bank details?
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="bg-gray-200 px-4 py-2 rounded text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    handleSubmit();
                  }}
                  className="bg-blue-600 px-4 py-2 rounded text-white hover:bg-blue-700"
                >
                  Yes, Update
                </button>
              </div>
            </div>
          </div>
        )}

        <ToastContainer position="top-right" autoClose={3000} />
      </motion.div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Confirm File Deletion
            </h3>

            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this bank document?
            </p>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteFileId(null);
                }}
                className="bg-gray-200 px-4 py-2 rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmDeleteFile}
                className="bg-red-600 px-4 py-2 rounded text-white"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditBankDetails;
