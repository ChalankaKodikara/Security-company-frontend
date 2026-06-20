import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import Select from "react-select"; // Import react-select
import { apiFetch } from "../../../utils/apiClient";

const Deduction_Component = () => {
  // State variables for employee data and pagination
  const [employeeData, setEmployeeData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Number of rows per page
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success"); // "success" or "error"
  const [showPopupMessage, setShowPopupMessage] = useState(false);

  // Filter states
  const [searchFilter, setSearchFilter] = useState(""); // Combined search for employee_no, employee_fullname
  const [organizationOptions, setOrganizationOptions] = useState([]); // Options for organization dropdown
  const [selectedOrganizationFilter, setSelectedOrganizationFilter] = useState(""); // Selected organization ID

  // Pagination states from API
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // State variables for popup and forms
  const [showPopup, setShowPopup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For loading indicator
  const [currency, setCurrency] = useState(Cookies.get("currency") || "USD");
  const [symbol, setSymbol] = useState(Cookies.get("symbol") || "$");
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const location = useLocation();
  const columnName = location.state?.actual_column_name || "Component Name A";
  const suggestedName = location.state?.suggested_name || "Unknown Component";
  const type = location.state?.type || "Amount";
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const MAX_CSV_SIZE = 5 * 1024 * 1024; // 5MB

  useEffect(() => {
    setCurrency(Cookies.get("currency") || "USD");
    setSymbol(Cookies.get("symbol") || "$");
  }, []);

  // Function to fetch organizations for the dropdown
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const authToken = Cookies.get("accessToken"); // Get auth token
        const res = await apiFetch(`${API_URL}/v1/hris/organizations/organization`, {
          credentials: "include",
        });

        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setOrganizationOptions(
            json.data.map((org) => ({
              value: org.id,
              label: org.organization_name,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch organizations", err);
      }
    };

    fetchOrganizations();
  }, [API_URL]);


  const fetchEmployeeData = async () => {
    if (!columnName) return;

    setIsLoading(true);
    try {
      const authToken = Cookies.get("accessToken"); // Get auth token

      const params = new URLSearchParams({
        actual_column_name: columnName,
        page: currentPage,
        limit: itemsPerPage,
      });

      if (searchFilter.trim()) {
        params.append("search", searchFilter.trim());
      }
      if (selectedOrganizationFilter) {
        params.append("organization", selectedOrganizationFilter);
      }

      const response = await apiFetch(
        `${API_URL}/v1/hris/payroll/deduction-status?${params.toString()}`,
      
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Assuming API response structure is { employees: [...], totalRecords: N, totalPages: M }
      if (data.employees) {
        const employees = data.employees.map((emp, index) => ({
          id: emp.employee_id || `emp-${index + 1}`, // Ensure a unique ID
          employee_no: emp.employee_no,
          name: emp.employee_fullname, // Changed from employee_fullname to name
          email: emp.employee_email,
          availability: emp.availability === "Yes" ? "Available" : "Unavailable",
        }));

        setEmployeeData(employees);
        setTotalRecords(data.totalRecords || employees.length); // Update totalRecords from API
        setTotalPages(data.totalPages || 1); // Update totalPages from API
      } else {
        setEmployeeData([]);
        setTotalRecords(0);
        setTotalPages(1);
      }
      setPopupMessage(""); // Clear popup on successful fetch
      setPopupType("");
      setShowPopupMessage(false);
    } catch (error) {
      console.error("Error fetching employee data:", error);

      setEmployeeData([]);
      setTotalRecords(0);
      setTotalPages(1);
      setPopupMessage("Failed to fetch employee data. Please try again.");
      setPopupType("error");
      setShowPopupMessage(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount and when filters or page change
  useEffect(() => {
    fetchEmployeeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnName, currentPage, searchFilter, selectedOrganizationFilter, API_URL]);

  // Handler for applying filters (resets page and triggers fetch)
  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to first page on new search/filter
    // The useEffect above will trigger fetchEmployeeData due to filter state change
  };


  // Pagination logic
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Close popup and reset states
  const closePopup = () => {
    setShowPopup(false);
    setSelectedEmployee(null);
    setAmount("");
    setRate("");
    setShowDeleteConfirm(false);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const authToken = Cookies.get("accessToken");

      const value = parseFloat(amount);
      if (type === "Amount" && isNaN(value)) {
        setPopupMessage("Invalid amount value.");
        setPopupType("error");
        setShowPopupMessage(true);
        setIsSaving(false);
        return;
      }

      const payloadValue = type === "Rate" ? parseFloat(rate) : value;
      if (type === "Rate" && isNaN(payloadValue)) {
        setPopupMessage("Invalid rate value.");
        setPopupType("error");
        setShowPopupMessage(true);
        setIsSaving(false);
        return;
      }

      const payload = {
        employee_no: selectedEmployee.employee_no,
        actual_column_name: columnName,
        value: payloadValue,
      };

      const response = await apiFetch(
        `${API_URL}/v1/hris/payroll/adddeductiontoemployee`,
        {
          method: "POST",
         
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchEmployeeData(); // Refresh data

      // Show success popup
      setPopupMessage("Deduction assigned successfully!");
      setPopupType("success");
      setShowPopupMessage(true);
      closePopup();
    } catch (error) {
      console.error("Error saving deduction:", error);

      // Show error popup
      setPopupMessage("Failed to save deduction. Please try again.");
      setPopupType("error");
      setShowPopupMessage(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Update
  const handleUpdate = async () => {
    try {
      setIsSaving(true);
      const authToken = Cookies.get("accessToken");

      const value = parseFloat(amount);
      if (isNaN(value)) {
        setIsSaving(false);
        return;
      }

      const payload = {
        employee_no: selectedEmployee.employee_no,
        actual_column_name: columnName,
        amount: value,
      };

      const response = await apiFetch(
        `${API_URL}/v1/hris/payroll/updatedeductiontoemployee`,
        {
          method: "PUT",
        
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setPopupMessage("Deduction updated successfully!");
      setPopupType("success");
      setShowPopupMessage(true);

      await fetchEmployeeData(); // Refresh data
      closePopup();
    } catch (error) {
      console.error("Error updating allowance:", error);
      setPopupMessage("Failed to update deduction. Please try again.");
      setPopupType("error");
      setShowPopupMessage(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Show the delete confirmation popup
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  // Confirm deletion: make a PUT request with amount: 0.00
  const handleConfirmDelete = async () => {
    try {
      setIsSaving(true);
      const authToken = Cookies.get("accessToken");

      const payload = {
        employee_no: selectedEmployee.employee_no,
        actual_column_name: columnName,
        amount: 0.0,
      };

      const response = await apiFetch(
        `${API_URL}/v1/hris/payroll/updatedeductiontoemployee`,
        {
          method: "PUT",
         
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setPopupMessage("Deduction removed successfully!");
      setPopupType("success");
      setShowPopupMessage(true);

      await fetchEmployeeData(); // Refresh data
      closePopup();
    } catch (error) {
      console.error("Error deleting allowance:", error);
      setPopupMessage("Failed to remove deduction. Please try again.");
      setPopupType("error");
      setShowPopupMessage(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRowClick = async (employee) => {
    try {
      setIsLoading(true); // Indicate loading state
      const authToken = Cookies.get("accessToken");

      // If availability is "Yes", fetch the value
      let fetchedValue = 0.0;
      if (employee.availability === "Available") {
        const params = new URLSearchParams({
          employee_no: employee.employee_no,
          actual_column_name: columnName,
          type: "deduction", // Pass "allowance" or "deduction"
        });

        const response = await apiFetch(
          `${API_URL}/v1/hris/payroll/value?${params.toString()}`,
         
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch value: ${response.statusText}`);
        }

        const data = await response.json();
        fetchedValue = data.value || 0.0; // Default to 0.0 if value is null
      }

      // Set the selected employee and populate the fields
      setSelectedEmployee(employee);
      setAmount(type === "Amount" ? fetchedValue : ""); // Show value in Amount field
      setRate(type === "Rate" ? fetchedValue : ""); // Show value in Rate field
      setShowPopup(true);
    } catch (error) {
      console.error("Error fetching value:", error);
      setPopupMessage("Failed to fetch value. Please try again.");
      setPopupType("error");
      setShowPopupMessage(true);
    } finally {
      setIsLoading(false); // Remove loading state
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= MAX_CSV_SIZE) {
      setUploadFile(file);
    } else if (file) {
      setPopupMessage(`File too large (${formatBytes(file.size)}). Max allowed is ${formatBytes(MAX_CSV_SIZE)}.`);
      setPopupType("error");
      setShowPopupMessage(true);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.size <= MAX_CSV_SIZE) {
      setUploadFile(file);
    } else if (file) {
      setPopupMessage(`File too large (${formatBytes(file.size)}). Max allowed is ${formatBytes(MAX_CSV_SIZE)}.`);
      setPopupType("error");
      setShowPopupMessage(true);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const clearFile = () => setUploadFile(null);

  const handleUpload = async () => {
    if (!uploadFile) return;
    setIsUploading(true);
    try {
      const authToken = Cookies.get("accessToken");

      const formData = new FormData();
      formData.append("actual_column_name", columnName);
      formData.append("file", uploadFile);

      const response = await apiFetch(
        `${API_URL}/v1/hris/payroll/deductions/bulk-upload`,
        {
          method: "POST",
          
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      console.log("Upload success:", result);

      // Show success popup
      setPopupMessage(`Uploaded: ${uploadFile.name}. ${result.message || ""}`);
      setPopupType("success");
      setShowPopupMessage(true);

      fetchEmployeeData(); // refresh employee table
      clearFile(); // Clear file after successful upload
    } catch (error) {
      console.error("Error uploading CSV:", error);
      setPopupMessage(error.message || "Failed to upload CSV");
      setPopupType("error");
      setShowPopupMessage(true);
    } finally {
      setIsUploading(false);
    }
  };

  // Function to generate and download sample CSV dynamically
  const handleDownloadSample = () => {
    const csvHeader = "employee_no,amount\n";
    const csvRows = [
      "EMP001,5000",
      "EMP002,3000",
      "EMP003,2500",
    ];
    const csvContent = csvHeader + csvRows.join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${suggestedName.replace(/\s+/g, "_")}_sample_deduction.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };


  return (
    <div className="mx-5 mt-5 font-montserrat">
      <p className="text-[24px] mb-5">
        Payroll Navigation / Payroll Deduction / {suggestedName}
      </p>
      <div className="flex">
        <div className="shadow-lg p-5 rounded-lg  bg-white w-[65%]">
          <p className="text-[24px] mb-4">Search Employee to Assign Value</p>

          {/* Search Fields */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Employee
              </label>
              <input
                type="text"
                className="border border-gray-300 rounded px-3 py-2 w-64"
                placeholder="e.g. EMP001, John Doe"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization
              </label>
              <Select
                options={organizationOptions}
                placeholder="Select Organization"
                value={
                  organizationOptions.find(
                    (opt) => opt.value === selectedOrganizationFilter
                  ) || null
                }
                onChange={(opt) =>
                  setSelectedOrganizationFilter(opt ? opt.value : "")
                }
                isClearable
                className="w-64"
                classNamePrefix="select"
              />
            </div>
            <div className="flex items-end">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={handleApplyFilters}
                disabled={isLoading}
              >
                Search
              </button>
            </div>
          </div>
          <div>
            {/* Table */}
            <div className="mt-5">
              <div className="table-container">
                <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 font-medium text-gray-900">
                        Employee ID
                      </th>
                      <th className="px-6 py-3 font-medium text-gray-900">
                        Employee
                      </th>
                      <th className="px-6 py-3 font-medium text-gray-900">
                        Availability
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {isLoading ? (
                      <tr>
                        <td className="px-6 py-4 text-center" colSpan={3}>
                          Loading...
                        </td>
                      </tr>
                    ) : employeeData.length === 0 ? (
                      <tr>
                        <td className="px-6 py-4 text-center" colSpan={3}>
                          No records found.
                        </td>
                      </tr>
                    ) : (
                      employeeData.map((employee) => (
                        <tr
                          key={employee.id}
                          className="hover:bg-blue-50 cursor-pointer"
                          onClick={() => handleRowClick(employee)}
                        >
                          <td className="px-6 py-4">{employee.employee_no}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-8 w-8 flex-shrink-0 rounded-full bg-blue-300 flex items-center justify-center text-white font-bold">
                                {employee.name // Safely access employee.name
                                  ? employee.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                  : "N/A"}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {employee.name || "Unknown"} {/* Safely display name */}
                                </div>
                                {employee.email && (
                                  <div className="text-sm text-gray-500">
                                    {employee.email}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {employee.availability === "Available" ? (
                              <span className="bg-red-100 text-green-700 px-3 py-1 rounded-full text-sm">
                                {suggestedName}
                              </span>
                            ) : (
                              <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm">
                                No Available Component
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>{" "}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4">
            <button
              className="px-4 py-2 bg-blue-500 rounded text-white hover:bg-gray-300"
              onClick={handlePrevPage}
              disabled={currentPage === 1 || isLoading}
            >
              Previous
            </button>
            <p>
              Page {currentPage} of {totalPages}
            </p>
            <button
              className="px-4 py-2 bg-blue-500 rounded text-white hover:bg-blue-600"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || isLoading}
            >
              Next
            </button>
          </div>
        </div>
        <div className="mt-6 ml-10">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={[
              "relative flex-1 rounded-2xl border-2 border-dashed p-6 transition-colors",
              "bg-white shadow-sm",
              isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300",
            ].join(" ")}
          >
            {/* Icon */}
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 shadow">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-6 w-6 text-gray-600"
              >
                <path
                  d="M12 16V7m0 0l-3.5 3.5M12 7l3.5 3.5M5 16a4 4 0 014-4h6a4 4 0 014 4v2H5v-2z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            {/* Sample CSV row */}
            <div className="mt-5 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-xs text-gray-600">
                Need a template?{" "}
                <span className="font-medium">Download sample CSV</span>
              </span>
              <button
                onClick={handleDownloadSample}
                className="mx-1 inline-block cursor-pointer text-blue-600 hover:underline"
              >
                Download
              </button>

            </div>

            {/* Instruction */}
            <p className="text-center text-sm text-gray-700">
              <span className="font-semibold">Drag & drop</span> your CSV here,
              or{" "}
              <label className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">
                browse
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </p>
            <p className="mt-1 text-center text-xs text-gray-500">
              Accepted: <span className="font-medium">.csv</span> · Max{" "}
              {formatBytes(MAX_CSV_SIZE)}
            </p>

            {/* File preview */}
            {uploadFile ? (
              <div className="mt-4 flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-gray-200">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-gray-900">
                    {uploadFile.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatBytes(uploadFile.size)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  className="ml-3 rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
                  title="Remove file"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="mt-4 text-center text-xs text-gray-500">
                Sample Columns:{" "}
                <code className="font-mono">employee_no, value</code>
              </div>
            )}

            {/* Upload button */}
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleUpload}
                disabled={!uploadFile || isUploading}
                className={[
                  "inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white",
                  "bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50",
                  "shadow-sm",
                ].join(" ")}
              >
                {isUploading ? "Uploading…" : "Upload CSV"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Popup */}
      {showPopup && selectedEmployee && !showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-1/3 relative">
            {/* Close Button */}
            <button
              onClick={closePopup}
              className="absolute top-2 right-2 text-gray-500 text-xl"
              disabled={isSaving}
            >
              &times;
            </button>

            {/* Header */}
            <div className="flex justify-center mb-4">
              {selectedEmployee.availability === "Unavailable" ? (
                <h2 className="text-xl font-bold">Assign Component</h2>
              ) : (
                <h2 className="text-xl font-bold">Change & Delete Component</h2>
              )}
            </div>

            {/* Employee Info */}
            <div className="flex items-center mb-2">
              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-300 flex items-center justify-center text-white font-bold">
                {selectedEmployee.name // Safely access selectedEmployee.name
                  ? selectedEmployee.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                  : "N/A"}
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-900">
                  {selectedEmployee.name || "Unknown"} {/* Safely display name */}
                </div>
                {selectedEmployee.email && (
                  <div className="text-sm text-gray-500">
                    {selectedEmployee.email}
                  </div>
                )}
              </div>
            </div>

            {/* Existing Components */}
            <p className="mb-2 flex items-center">
              Existing Components:&nbsp;
              {selectedEmployee.availability === "Unavailable" ? (
                <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm">
                  No Available Component
                </span>
              ) : (
                <span className="bg-red-100 text-green-700 px-3 py-1 rounded-full text-sm">
                  {suggestedName}
                </span>
              )}
            </p>

            {/* Component Name (Read-Only Field) */}
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Component Name
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={suggestedName}
                readOnly
              />
            </div>

            {/* Amount and Rate Fields */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    className="border border-gray-300 rounded-l px-3 py-2 w-full"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={type === "Rate"}
                  />
                  <span className="border border-gray-300 rounded-r px-3 py-2 bg-gray-50">
                    {symbol}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rate
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    className="border border-gray-300 rounded-l px-3 py-2 w-full"
                    placeholder="0.00"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    disabled={type === "Amount"}
                  />
                  <span className="border border-gray-300 rounded-r px-3 py-2 bg-gray-50">
                    %
                  </span>
                </div>
              </div>
            </div>

            <p className="text-gray-500 text-sm mb-4">
              After you assign, a salary component value will be added to the
              employee.
            </p>

            {/* Buttons */}
            <div className="flex justify-end gap-2">
              {selectedEmployee.availability === "Unavailable" ? (
                <>
                  {/* Assign scenario */}
                  <button
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    onClick={closePopup}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </>
              ) : (
                <>
                  {/* Change & Delete scenario */}
                  <button
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    onClick={closePopup}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-100"
                    onClick={handleDeleteClick}
                    disabled={isSaving}
                  >
                    Delete
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={handleUpdate}
                    disabled={isSaving}
                  >
                    {isSaving ? "Updating..." : "Update"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {showPopupMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-1/3 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowPopupMessage(false)}
              className="absolute top-2 right-2 text-gray-500 text-xl"
            >
              &times;
            </button>

            {/* Popup Header */}
            <h2
              className={`text-center text-xl font-bold mb-4 ${popupType === "success" ? "text-green-500" : "text-red-500"
                }`}
            >
              {popupType === "success" ? "Success" : "Error"}
            </h2>

            {/* Message */}
            <p className="text-center mb-4">{popupMessage}</p>

            {/* Close Button */}
            <div className="flex justify-center">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => setShowPopupMessage(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {showPopup && showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-1/3 relative">
            {/* Close Button */}
            <button
              onClick={closePopup}
              className="absolute top-2 right-2 text-gray-500 text-xl"
              disabled={isSaving}
            >
              &times;
            </button>

            <h2 className="text-center text-xl font-bold mb-4">Delete?</h2>
            <p className="text-center mb-4">
              Do you want to delete the component:{" "}
              <span className="text-blue-500">{suggestedName}</span>
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                onClick={closePopup}
                disabled={isSaving}
              >
                No
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={handleConfirmDelete}
                disabled={isSaving}
              >
                {isSaving ? "Deleting..." : "Yes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Deduction_Component;