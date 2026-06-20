/** @format */

import React, { useState, useEffect, useRef } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiFetch } from "../../../utils/apiClient";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import { useParams } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Cookies from "js-cookie";

const ReimbursementApplication = () => {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  // Form fields
  const [employeeNo, setEmployeeNo] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [loanType, setLoanType] = useState("");
  const [description, setDescription] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanDuration, setLoanDuration] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [loanTypes, setLoanTypes] = useState([]); // Will store objects: { value: 'type', label: 'Type' }
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const { id } = useParams(); // Will be undefined for create mode
  const location = useLocation();
  const viewOnly = location.state?.viewOnly || false;
  const [installments, setInstallments] = useState([
    { year: "", month: "", amount: "" },
  ]);
  const token = Cookies.get("accessToken");

  const handleAddRow = () => {
    setInstallments([...installments, { year: "", month: "", amount: "" }]);
  };

  const handleRemoveRow = (index) => {
    setInstallments(installments.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const updated = [...installments];
    updated[index][field] = value;
    setInstallments(updated);
  };

  const monthOptions = [...Array(12)].map((_, i) => ({
    value: i + 1,
    label: new Date(0, i).toLocaleString("default", { month: "long" }),
  }));

  const yearOptions = Array.from({ length: 30 }, (_, i) => {
    const year = new Date().getFullYear() - 10 + i;
    return { value: year, label: year.toString() };
  });

  const handleFinalSave = async () => {
    try {
      const res = await apiFetch(
        `${API_URL}/v1/hris/reimbursement-master/active`,
        { method: "GET", headers: { Authorization: `Bearer ${token}` } }
      );
      const resJson = await res.json();
      const reimbursementMasterId = resJson?.data?.id;

      if (!reimbursementMasterId) {
        toast.error("Active reimbursement master not found.");
        return;
      }

      const payload = {
        employee_no: employeeNo,
        employee_name: employeeName,
        loan_type: loanType,
        description: description,
        loan_amount: parseFloat(loanAmount),
        loan_duration_months: parseInt(loanDuration),
        interest_rate: parseFloat(interestRate),
        reimbursement_master_id: reimbursementMasterId,
        installments: installments.map((item) => ({
          year: parseInt(item.year),
          month: parseInt(item.month),
          interest_amount: parseFloat(item.amount),
        })),
      };

      const response = await apiFetch(
        `${API_URL}/v1/hris/reimbursement-application/submit`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const responseJson = await response.json();

      if (responseJson?.success) {
        toast.success(
          "Application and installments submitted with calculated reimbursements."
        );
        resetForm(); //  Reset form here
      } else {
        toast.error("Unexpected response.");
      }
    } catch (error) {
      console.error("Submission Error:", error);
        toast.error(error?.response?.data?.message || "Failed to submit application.");
    }
  };

  useEffect(() => {
    const fetchLoanTypes = async () => {
      const authToken = Cookies.get("accessToken");
      try {
        const res = await apiFetch(`${API_URL}/v1/hris/organizations/loan-types`, {
          method: "GET",
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        const json = await res.json();
        const items = json?.data ?? json ?? [];
        const options = (Array.isArray(items) ? items : []).map((item) => ({ value: item.name, label: item.name }));
        setLoanTypes([{ value: "", label: "All" }, ...options]);
      } catch (error) {
        console.error("Error fetching loan types:", error);
        toast.error("Failed to load loan types");
        setLoanTypes([{ value: "", label: "All" }]);
      }
    };

    fetchLoanTypes();
  }, [API_URL, token]); // Added token to dependencies

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await apiFetch(`${API_URL}/v1/hris/employees/search?page=1&pageSize=200`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        const options = json?.data?.map((emp) => ({
          value: emp.employee_no,
          label: `${emp.employee_no} - ${emp.employee_fullname}`,
          fullName: emp.employee_fullname,
        })) || [];
        setEmployeeOptions(options);
      } catch (error) {
        console.error("Error fetching employees:", error);
        toast.error("Failed to load employee list.");
      }
    };

    fetchEmployees();
  }, [API_URL, token]); // Added token to dependencies

  const loadEmployeeOptions = async (inputValue) => {
    if (!inputValue) return [];

    try {
      const res = await apiFetch(
        `${API_URL}/v1/hris/employees/search?keyword=${encodeURIComponent(
          inputValue
        )}`,
        { method: "GET", headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();

      return (
        json?.data?.map((emp) => ({
          value: emp.employee_no,
          label: `${emp.employee_no} - ${emp.employee_fullname}`,
          fullName: emp.employee_fullname,
        })) || []
      );
    } catch (error) {
      console.error("Error loading employee options:", error);
      return [];
    }
  };

  const resetForm = () => {
    setEmployeeNo("");
    setEmployeeName("");
    setLoanType("");
    setDescription("");
    setLoanAmount("");
    setLoanDuration("");
    setInterestRate("");
    setInstallments([{ year: "", month: "", amount: "" }]);
  };

  useEffect(() => {
    const fetchApplication = async () => {
      if (!id) return;

      try {
        const response = await apiFetch(
          `${API_URL}/v1/hris/reimbursement-application/applications/${id}/total-amount`,
          { method: "GET", headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await response.json();
        const data = json?.data;

        if (!data) return;

        setEmployeeNo(data.employee_no);
        setEmployeeName(data.employee_name);
        setLoanType(data.loan_type);
        setDescription(data.description || "");
        setLoanAmount(data.loan_amount);
        setLoanDuration(data.loan_duration_months);
        setInterestRate(data.interest_rate);

        setInstallments(
          data.installments.length > 0
            ? data.installments.map((inst) => ({
                year: inst.year,
                month: inst.month,
                amount: inst.reimbursement_amount,
              }))
            : [{ year: "", month: "", amount: "" }]
        );
      } catch (error) {
        console.error("Error loading application:", error);
        toast.error("Failed to load application.");
      }
    };

    fetchApplication();
  }, [id, API_URL, token]); // Added API_URL and token to dependencies

  return (
    <div className="mx-5 mt-5 font-montserrat">
      <ToastContainer position="top-right" autoClose={3000} />

      <p className="text-[22px] mb-8">
        <span className="text-gray-400">Allowance</span> / Reimbursement
        Application Form
      </p>

      {/* Application Form */}
      <div className="bg-white rounded-md shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Application Form</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">
              Employee Number
            </label>
            <AsyncSelect
              cacheOptions
              loadOptions={loadEmployeeOptions}
              defaultOptions // This prop should be fine, it uses the first `employeeOptions` on mount
              value={
                employeeNo && employeeName
                  ? {
                      value: employeeNo,
                      label: `${employeeNo} - ${employeeName}`,
                    }
                  : null
              }
              onChange={(selected) => {
                setEmployeeNo(selected?.value || "");
                setEmployeeName(selected?.fullName || "");
              }}
              placeholder="Search employee..."
              isDisabled={viewOnly} // Disable if in viewOnly mode
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Employee Name</label>
            <input
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              className="border border-gray-300 p-2 rounded-md"
              readOnly={viewOnly} // Make readOnly if in viewOnly mode
            />
          </div>
        </div>

        <div className="mb-4 w-1/2">
          <label className="text-sm text-gray-600 mb-1 block">Loan Type</label>
          <Select
            options={loanTypes}
            value={loanTypes.find((typeOption) => typeOption.value === loanType)} // Correctly find based on object structure
            onChange={(selected) => setLoanType(selected ? selected.value : "")}
            isClearable
            isDisabled={viewOnly} // Disable if in viewOnly mode
          />
        </div>

        <div className="mb-6">
          <label className="text-sm text-gray-600 mb-1 block">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="border border-gray-300 p-2 rounded-md w-full"
            readOnly={viewOnly} // Make readOnly if in viewOnly mode
          />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Loan Amount</label>
            <div className="flex items-center border border-gray-300 rounded-md">
              <span className="px-3 text-gray-500 bg-gray-100 border-r border-gray-300">
                Rs.
              </span>
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                className="flex-1 p-2 rounded-r-md focus:outline-none"
                readOnly={viewOnly} // Make readOnly if in viewOnly mode
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">
              Loan Duration (in months)
            </label>
            <input
              value={loanDuration}
              onChange={(e) => setLoanDuration(e.target.value)}
              className="border border-gray-300 p-2 rounded-md"
              readOnly={viewOnly} // Make readOnly if in viewOnly mode
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">
              Interest Rate (%)
            </label>
            <input
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              className="border border-gray-300 p-2 rounded-md"
              readOnly={viewOnly} // Make readOnly if in viewOnly mode
            />
          </div>
        </div>
      </div>

      {/* Monthly Installments */}
      <div className="bg-white rounded-md shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          Monthly Installment upload section
        </h2>

        {installments.map((item, index) => (
          <div className="grid grid-cols-4 gap-4 mb-4 items-end" key={index}>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Year</label>
              <Select
                options={yearOptions}
                value={yearOptions.find((y) => y.value === parseInt(item.year))}
                onChange={(selected) =>
                  handleChange(index, "year", selected ? selected.value : "")
                }
                isClearable
                isDisabled={viewOnly} // Disable if in viewOnly mode
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Month</label>
              <Select
                options={monthOptions}
                value={monthOptions.find(
                  (m) => m.value === parseInt(item.month)
                )}
                onChange={(selected) =>
                  handleChange(index, "month", selected ? selected.value : "")
                }
                isClearable
                isDisabled={viewOnly} // Disable if in viewOnly mode
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">
                Monthly interest amount (LKR)
              </label>
              <input
                type="number"
                className="border border-gray-300 p-2 rounded-md"
                value={item.amount}
                onChange={(e) => handleChange(index, "amount", e.target.value)}
                readOnly={viewOnly} // Make readOnly if in viewOnly mode
              />
            </div>

            <div className="flex justify-start pt-2">
              {index === installments.length - 1 && !viewOnly ? (
                <button
                  className="bg-[#2495FE] hover:bg-blue-600 text-white px-3 py-2 rounded-md"
                  onClick={handleAddRow}
                  title="Add row"
                >
                  <FaPlus />
                </button>
              ) : (
                !viewOnly && (
                  <button
                    className="bg-red-100 hover:bg-red-300 text-red-600 px-3 py-2 rounded-md"
                    onClick={() => handleRemoveRow(index)}
                    title="Remove row"
                  >
                    <FaTrash />
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Final Save Button */}
      {!viewOnly && ( // Hide save button in viewOnly mode
        <div className="flex justify-end mt-6">
          <button
            onClick={handleFinalSave}
            className="bg-[#2495FE] text-white px-8 py-3 rounded-md hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
};

export default ReimbursementApplication;