/** @format */
import React, { useState, useEffect } from "react";
import { FaArrowRight } from "react-icons/fa";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import Cookies from "js-cookie";
import { apiFetch } from "../../../utils/apiClient";
const Bank_Details = ({
  data,
  setData,
  handlePrevStep,
  handleNextStep,
}) => {
  const [bankDetails, setBankDetails] = useState(data || {});
  const [banks, setBanks] = useState([]);
  const [branches, setBranches] = useState([]);

  const [isDirty, setIsDirty] = useState(false); // user modified fields
  const [hasSubmitted, setHasSubmitted] = useState(false); // POST done

  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const token = Cookies.get("accessToken");

  // Restore from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("bankDetails");
    const submittedFlag = localStorage.getItem("bankDetailsSubmitted");
    
    if (stored) {
      try {
        setBankDetails(JSON.parse(stored));
      } catch {
        console.error("Invalid bank details in localStorage");
      }
    }
    
    // Restore submission state
    if (submittedFlag === "true") {
      setHasSubmitted(true);
    }
  }, []);

  // Fetch Banks
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await axios.get(`${API_URL}/v1/hris/bank`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setBanks(
            response.data.data.map((bank) => ({
              id: bank.id,
              name: bank.bank_name,
              code: bank.bank_code,
            }))
          );
        }
      } catch (error) {
        console.error("Failed to fetch banks:", error);
        toast.error("Failed to fetch banks.");
      }
    };
    fetchBanks();
  }, []);

  // Fetch Branches when bank_id changes
  useEffect(() => {
    const fetchBranches = async () => {
      if (!bankDetails.bank_id) {
        setBranches([]);
        return;
      }
      try {
        const res = await axios.get(
          `${API_URL}/v1/hris/bank-branch/get-branches-by-bank/${bankDetails.bank_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setBranches(
          (res.data.data || []).map((branch) => ({
            id: branch.id,
            name: branch.branch_name,
            code: branch.branch_code,
          }))
        );
      } catch (error) {
        console.error("Failed to fetch branches:", error);
        toast.error("Failed to fetch branches.");
      }
    };
    fetchBranches();
  }, [bankDetails.bank_id]);

  // Mark changes
  const markDirty = (updateFn) => {
    setBankDetails((prev) => {
      const updated = updateFn(prev);
      localStorage.setItem("bankDetails", JSON.stringify(updated));
      return updated;
    });
    setIsDirty(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    markDirty((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileMeta = {
      name: file.name,
      size: file.size,
      type: file.type,
    };

    const reader = new FileReader();
    reader.onload = () => {
      const base64File = reader.result;
      markDirty((prev) => ({
        ...prev,
        bank_document: { ...fileMeta, base64: base64File },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleBranchChange = (selectedOption) => {
    const branch = branches.find((b) => b.id === selectedOption?.value);
    markDirty((prev) => ({
      ...prev,
      branch_id: branch?.id || "",
      branch_code: branch?.code || "",
    }));
  };

  const handleBankChange = (e) => {
    const selectedBankId = parseInt(e.target.value);
    const selectedBank = banks.find((b) => b.id === selectedBankId);
    markDirty((prev) => ({
      ...prev,
      bank_id: selectedBankId,
      bank_code: selectedBank?.code || "",
      branch_id: "",
      branch_code: "",
    }));
  };

  // Build FormData
  const buildFormData = () => {
  const employee_no = localStorage.getItem("employee_no");
  const formData = new FormData();

  formData.append("employee_no", employee_no || "");
  formData.append("employee_account_no", bankDetails.employee_account_no || "");
  formData.append("employee_account_name", bankDetails.employee_account_name || "");
  formData.append("employee_bank_id", bankDetails.bank_id || "");
  formData.append("employee_bank_branch_id", bankDetails.branch_id || "");

  // 🔥 Append bank_document if available
  if (bankDetails.bank_document?.base64) {
    const base64 = bankDetails.bank_document.base64.split(",")[1];
    const mime = bankDetails.bank_document.type;
    const byteString = atob(base64);

    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([ab], { type: mime });

    formData.append(
      "bank_document",
      blob,
      bankDetails.bank_document.name
    );
  }

  return { formData, employee_no };
};

  // Submit Handler
  const handleSubmit = async () => {
    try {
      // Case 1: Already submitted and no changes → just navigate
      if (hasSubmitted && !isDirty) {
        setData(bankDetails);
        handleNextStep(true);
        return;
      }

      const { formData, employee_no } = buildFormData();
      let res;

      if (!hasSubmitted) {
        // Case 2: First time POST
        res = await axios.post(`${API_URL}/v1/hris/employees/bank-details`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        // If server reports failure but returns 200
        if (res?.data && res.data.success === false) {
          toast.error(res.data.message || "Submission failed.");
          return;
        }

        toast.success(res.data.message || "Bank details submitted successfully");

        // Mark as submitted and save to localStorage
        setHasSubmitted(true);
        localStorage.setItem("bankDetailsSubmitted", "true");
        setIsDirty(false);
      } else {
        // Case 3: Already submitted, user made changes → PUT
        res = await axios.put(
          `${API_URL}/v1/hris/employees/bank-details/${employee_no}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        if (res?.data && res.data.success === false) {
          toast.error(res.data.message || "Update failed.");
          return;
        }

        toast.success(res.data.message || "Bank details updated successfully");
        setIsDirty(false);
      }

      setData(bankDetails);
      handleNextStep(true);
    } catch (error) {
      console.error("Error submitting bank details:", error);
      const msg = error?.response?.data?.message || error.message || "Submission failed. Please try again.";
      toast.error(msg);
    }
  };

  const handlePrev = () => {
    setData(bankDetails);
    handlePrevStep(true);
  };

  // Get button text based on state
  const getButtonText = () => {
    if (!hasSubmitted) {
      return "Save & Next";
    } else if (isDirty) {
      return "Update & Next";
    } else {
      return "Next";
    }
  };

  return (
    <div className="relative">
      <h1 className="text-[24px] font-semibold mt-6">Bank Details</h1>
      <p className="text-gray-500 mb-6">Enter Employee Bank Details.</p>

      <div className="grid grid-cols-3 gap-6">
        {/* Account Number */}
        <div>
          <label className="block text-sm text-gray-700 mb-1">Account Number</label>
          <input
            type="text"
            name="employee_account_no"
            value={bankDetails.employee_account_no || ""}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
          />
        </div>

        {/* Account Name */}
        <div>
          <label className="block text-sm text-gray-700 mb-1">Account Name</label>
          <input
            type="text"
            name="employee_account_name"
            value={bankDetails.employee_account_name || ""}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
          />
        </div>

        {/* Bank */}
        <div>
          <label className="block text-sm text-gray-700 mb-1">Bank Name</label>
          <select
            name="bank_id"
            value={bankDetails.bank_id || ""}
            onChange={handleBankChange}
            className="w-full border border-gray-300 p-2 rounded"
          >
            <option value="">Select Bank</option>
            {banks.map((bank) => (
              <option key={bank.id} value={bank.id}>
                {bank.name}
              </option>
            ))}
          </select>
        </div>

        {/* Branch */}
        <div>
          <label className="block text-sm text-gray-700 mb-1">Branch Name</label>
          <Select
            options={branches.map((branch) => ({
              value: branch.id,
              label: branch.name,
            }))}
            value={
              branches.find((b) => b.id === bankDetails.branch_id)
                ? {
                    value: bankDetails.branch_id,
                    label: branches.find((b) => b.id === bankDetails.branch_id)?.name,
                  }
                : null
            }
            onChange={handleBranchChange}
            isClearable
            placeholder="Select Branch"
          />
        </div>

        {/* Branch Code */}
        {bankDetails.branch_code && (
          <div>
            <label className="block text-sm text-gray-700 mb-1">Branch Code</label>
            <input
              type="text"
              value={bankDetails.branch_code}
              disabled
              className="w-full border border-gray-300 p-2 rounded bg-gray-100"
            />
          </div>
        )}
      </div>

      {/* Document */}
      <div className="mt-6">
        <label className="block text-sm text-gray-700 mb-1">
          Upload Bank Document (PDF Documents only)
        </label>
        <input
          type="file"
          name="bank_document"
          onChange={handleFileChange}
          className="w-full border border-gray-300 p-2 rounded"
        />
        {bankDetails.bank_document?.name && (
          <p className="mt-2 text-sm text-gray-600">
            Uploaded File:{" "}
            <span className="font-semibold">{bankDetails.bank_document.name}</span>
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between mt-8">
        <button
          onClick={handlePrev}
          className="bg-gray-100 px-5 py-2 rounded text-gray-500 flex items-center"
        >
          <FaArrowRight className="rotate-180 mr-2" /> Previous
        </button>

        <button
          onClick={handleSubmit}
          className="bg-blue-500 px-6 py-2 rounded text-white font-semibold flex items-center"
        >
          {getButtonText()}
          <FaArrowRight className="ml-2" />
        </button>
      </div>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </div>
  );
};

export default Bank_Details;