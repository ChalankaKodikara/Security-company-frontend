import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import Select from "react-select";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";
import { apiFetch } from "../../../utils/apiClient";
const AllowanceComponent = () => {
  const [employeeData, setEmployeeData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Number of rows per page
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("error"); // "error" or "success"
  const [showPopupMessage, setShowPopupMessage] = useState(false);
  const [currency, setCurrency] = useState(Cookies.get("currency") || "USD");
  const [symbol, setSymbol] = useState(Cookies.get("symbol") || "$");
  const [searchFilter, setSearchFilter] = useState("");
  const [organizationOptions, setOrganizationOptions] = useState([]);
  const [selectedOrganizationFilter, setSelectedOrganizationFilter] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [showAdvancePopup, setShowAdvancePopup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [advanceToEdit, setAdvanceToEdit] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For loading indicator
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const location = useLocation();
  const columnName = location.state?.actual_column_name || "Component Name A";
  const suggestedName = location.state?.suggested_name || "Unknown Component";
  const type = location.state?.type || "Amount";


  // Avatar helpers
  const avatarBgClass = (seed = "") => {
    const palette = [
      "from-blue-500 to-blue-600",
      "from-purple-500 to-purple-600",
      "from-green-500 to-green-600",
      "from-pink-500 to-pink-600",
      "from-yellow-500 to-yellow-600",
      "from-teal-500 to-teal-600",
      "from-indigo-500 to-indigo-600",
    ];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return palette[hash % palette.length];
  };

  const getInitials = (fullName = "") => {
    const tokens = String(fullName).trim().split(" ");
    if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
    return (tokens[0][0] + tokens[tokens.length - 1][0]).toUpperCase();
  };

  useEffect(() => {
    setCurrency(Cookies.get("currency") || "USD");
    setSymbol(Cookies.get("symbol") || "$");
  }, []);

  const fetchEmployeeData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
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
        `${API_URL}/v1/hris/payroll/getAllEmployeesWithSalaryAdvanceStatus?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch employee data");
      }
      const data = await response.json();
      if (data.success) {
        const employees = data.data.map((emp, index) => ({
          id: emp.id || `emp-${index + 1}`, // Ensure unique key
          employee_no: emp.employee_no,
          employee_fullname: emp.employee_fullname,
          employee_email: emp.employee_email,
          status: emp.status,
          total_advance_amount: emp.total_advance_amount,
          salary_advances: emp.salary_advances || [],
        }));
        setEmployeeData(employees);
        setTotalRecords(data.totalRecords || employees.length);
        setTotalPages(data.totalPages || 1);
      } else {
        setEmployeeData([]);
        setTotalRecords(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching employee data:", error);
      setEmployeeData([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch organizations for the dropdown
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const token = Cookies.get("accessToken");
        const res = await apiFetch(`${API_URL}/v1/hris/organizations/organization`);

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


  useEffect(() => {
    fetchEmployeeData();
  }, [currentPage, searchFilter, selectedOrganizationFilter]);

  const openAdvanceEditPopup = (advance, employee) => {
    setAdvanceToEdit({ ...advance, employee_no: employee.employee_no });
    setEditAmount(String(advance.advance_amount ?? ""));
    setShowAdvancePopup(true);
  };

  const closeAdvancePopup = () => {
    setShowAdvancePopup(false);
    setAdvanceToEdit(null);
    setEditAmount("");
  };

  const handleAdvanceUpdate = async () => {
    if (!advanceToEdit) return;

    if (!editAmount.trim() || isNaN(parseFloat(editAmount))) {
      setPopupMessage("Please enter a valid advance amount.");
      setPopupType("error");
      setShowPopupMessage(true);
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        advance_amount: parseFloat(editAmount.trim()),
      };

      const response = await apiFetch(
        `${API_URL}/v1/hris/payroll/salary-advance/${advanceToEdit.id}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update salary advance.");
      }

      setPopupMessage("Salary advance updated successfully.");
      setPopupType("success");
      setShowPopupMessage(true);
      await fetchEmployeeData();
      closeAdvancePopup();
    } catch (error) {
      console.error("Error updating salary advance:", error);
      setPopupMessage(error.message || "Failed to update salary advance.");
      setPopupType("error");
      setShowPopupMessage(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Handler for search button click (or implicit search on filter change)
  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to first page on new search/filter
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleRowClick = async (employee) => {
    if (employee.status === "APPLICABLE") {
      // Open the popup with empty fields for applicable employees
      setSelectedEmployee({
        employee_no: employee.employee_no,
        employee_fullname: employee.employee_fullname,
        employee_email: employee.employee_email,
        salaryAdvance: {
          request_date: "",
          advance_amount: "",
          reason: "",
          status: "APPLICABLE",
        },
      });
      setAmount(""); // Reset amount for new entries
      setShowPopup(true);
    } else {
      // Fetch data for non-applicable employees
      try {
        setIsLoading(true); // Indicate loading state

        const response = await apiFetch(
          `${API_URL}/v1/hris/payroll/salary-advance/${employee.employee_no}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch salary advance details");
        }

        const data = await response.json();

        // Check if salary advance details exist in the fetched data
        const salaryAdvanceDetails = data.data[0] || {
          request_date: "",
          advance_amount: "",
          reason: "",
          status: "NOT APPLICABLE",
        };

        // Set the selected employee data and update the amount
        setSelectedEmployee({
          employee_no: employee.employee_no,
          employee_fullname: employee.employee_fullname,
          employee_email: employee.employee_email,
          salaryAdvance: salaryAdvanceDetails,
        });

        // Initialize the amount with the fetched advance_amount
        setAmount(salaryAdvanceDetails.advance_amount || "");
        setShowPopup(true); // Open the popup
      } catch (error) {
        console.error("Error fetching salary advance details:", error);
        setPopupMessage("Failed to fetch salary advance details.");
        setPopupType("error");
        setShowPopupMessage(true);
      } finally {
        setIsLoading(false); // Remove loading state
      }
    }
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

      // Validate the amount field
      if (!amount.trim() || isNaN(parseFloat(amount))) {
        setPopupMessage("Please provide a valid advance amount.");
        setPopupType("error");
        setShowPopupMessage(true);
        setIsSaving(false);
        return;
      }

      // Construct the payload for saving
      const payload = {
        employee_number: selectedEmployee.employee_no,
        request_date: selectedEmployee.salaryAdvance?.request_date || "",
        advance_amount: parseFloat(amount.trim()),
        reason: selectedEmployee.salaryAdvance?.reason || "No reason provided",
      };

      console.log("Payload for save:", payload);

      // Send the POST request
      const response = await apiFetch(
        `${API_URL}/v1/hris/payroll/salary-advance`,
        {
          method: "POST",
         
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to save salary advance.");
      }

      // Show success message
      setPopupMessage("Salary advance added successfully!");
      setPopupType("success");
      setShowPopupMessage(true);

      // Refresh employee data and close the popup
      await fetchEmployeeData();
      closePopup();
    } catch (error) {
      console.error("Error saving salary advance:", error);
      setPopupMessage(error.message || "Failed to save salary advance.");
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

      // Validate required fields
      if (!selectedEmployee.salaryAdvance.id) {
        setPopupMessage("Unable to update: Missing salary advance ID.");
        setPopupType("error");
        setShowPopupMessage(true);
        setIsSaving(false);
        return;
      }

      // Fallback to existing data if fields are not updated
      const formattedDate = selectedEmployee.salaryAdvance.request_date
        ? new Date(selectedEmployee.salaryAdvance.request_date)
          .toISOString()
          .split("T")[0]
        : "";

      const payload = {
        request_date: formattedDate, // Use formatted date from state or existing data
        advance_amount:
          amount.trim() !== ""
            ? parseFloat(amount)
            : parseFloat(selectedEmployee.salaryAdvance.advance_amount),
        reason:
          selectedEmployee.salaryAdvance.reason.trim() !== ""
            ? selectedEmployee.salaryAdvance.reason
            : "No reason provided", // Default reason if empty
        status: selectedEmployee.salaryAdvance.status || "PENDING", // Ensure status is sent correctly
      };
      console.log("sentdata", payload);
      const response = await apiFetch(
        `${API_URL}/v1/hris/payroll/salary-advance/${selectedEmployee.salaryAdvance.id}`,
        {
          method: "PUT",
         
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update salary advance.");
      }

      setPopupMessage("Salary advance updated successfully!");
      setPopupType("success");
      setShowPopupMessage(true);

      await fetchEmployeeData(); // Refresh the data to show updated status
      closePopup();
    } catch (error) {
      console.error("Error updating salary advance:", error);
      setPopupMessage(error.message || "Failed to update salary advance.");
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
      const payload = {
        employee_no: selectedEmployee.employee_no,
        actual_column_name: columnName, // This seems tied to a generic allowance, not specific salary advance
        amount: 0.0,
      };

      const response = await apiFetch(
        `${API_URL}/v1/hris/payroll/updateallowancetoemployee`,
        {
          method: "PUT",
         
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setPopupMessage("Salary advance (amount set to 0) successfully!");
      setPopupType("success");
      setShowPopupMessage(true);

      await fetchEmployeeData(); // Refresh data
      closePopup();
    } catch (error) {
      console.error("Error deleting allowance:", error);
      setPopupMessage(error.message || "Failed to delete salary advance.");
      setPopupType("error");
      setShowPopupMessage(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-5 mt-5 font-montserrat">
      <p className="text-[24px] mb-5">
        Payroll Navigation / Payroll Allowance / Salary Advance
      </p>
      <div className="  bg-white ">
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

        <motion.div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  {["Employee No", "Employee", "Availability", "Action"].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-bold text-gray-700"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>


              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="3" className="py-10 text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"
                      />
                    </td>
                  </tr>
                ) : employeeData.length > 0 ? (
                  employeeData.map((employee, index) => (
                    <motion.tr
                      key={employee.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.01 }}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      {/* Employee No */}
                      <td className="px-6 py-4 font-bold text-blue-600">
                        {employee.employee_no}
                      </td>

                      {/* Employee Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <motion.div whileHover={{ scale: 1.1, rotate: 5 }}>
                            <div className="relative">
                              <div className="absolute inset-0 rounded-full ring-2 ring-blue-500 ring-offset-2" />
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg bg-gradient-to-br ${avatarBgClass(
                                  employee.employee_fullname || employee.employee_no
                                )}`}
                              >
                                {getInitials(
                                  employee.employee_fullname || employee.employee_no
                                )}
                              </div>
                            </div>
                          </motion.div>

                          <div>
                            <div className="font-semibold text-gray-800">
                              {employee.employee_fullname}
                            </div>
                            <div className="text-xs text-gray-500">
                              {employee.employee_email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-2 py-2">
                        <div className="flex flex-wrap gap-1 items-start">
                          {employee.salary_advances && employee.salary_advances.length > 0 ? (
                            employee.salary_advances.map((advance, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openAdvanceEditPopup(advance, employee);
                                }}
                                className="inline-flex flex-col items-start bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-[10px] font-semibold hover:bg-blue-200 focus:outline-none"
                                title="Edit advance amount"
                              >
                                <span className="leading-tight">{advance.reason}</span>
                                <span className="leading-tight font-bold">
                                  {symbol}
                                  {parseFloat(advance.advance_amount).toFixed(2)}
                                </span>
                              </button>
                            ))
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-200 text-gray-700">
                              No Advances
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); 
                            handleRowClick(employee);
                          }}
                          className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                          title="Open Salary Advance"
                        >
                          <FaArrowRight />
                        </button>
                      </td>

                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="py-10 text-center text-gray-500">
                      No employees found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && employeeData.length > 0 && (
            <div className="p-4 bg-gray-50 flex items-center justify-between">
              <div className="text-sm">
                Showing{" "}
                <strong>
                  {(currentPage - 1) * itemsPerPage + 1} –{" "}
                  {Math.min(currentPage * itemsPerPage, totalRecords)}
                </strong>{" "}
                of <strong>{totalRecords}</strong>
              </div>

              <div className="flex gap-3">
                <button
                  disabled={currentPage === 1}
                  onClick={handlePrevPage}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:border-blue-500 disabled:opacity-50"
                >
                  Prev
                </button>

                <div className="px-4 py-2 rounded-xl bg-blue-600 text-white">
                  Page {currentPage} / {totalPages}
                </div>

                <button
                  disabled={currentPage === totalPages}
                  onClick={handleNextPage}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:border-blue-500 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </motion.div>


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
              <h2 className="text-xl font-bold">
                {selectedEmployee.salaryAdvance?.id
                  ? "Update Salary Advance"
                  : "Add Salary Advance"}
              </h2>
            </div>

            {/* Employee Info */}
            <div className="flex items-center mb-2">
              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-300 flex items-center justify-center text-white font-bold">
                {selectedEmployee.employee_fullname
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-900">
                  {selectedEmployee.employee_fullname}
                </div>
                {selectedEmployee.employee_email && (
                  <div className="text-sm text-gray-500">
                    {selectedEmployee.employee_email}
                  </div>
                )}
              </div>
            </div>

            {/* Existing Salary Advance */}
            <p className="mb-2 flex items-center">
              Existing Advance: &nbsp;
              {selectedEmployee.salaryAdvance?.status ? (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                  {selectedEmployee.salaryAdvance.status}
                </span>
              ) : (
                <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm">
                  No Advance Available
                </span>
              )}
            </p>

            {/* Requested Date */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requested Date
                </label>
                <input
                  type="date"
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                  value={
                    selectedEmployee.salaryAdvance?.request_date
                      ? new Date(selectedEmployee.salaryAdvance.request_date)
                        .toISOString()
                        .split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    setSelectedEmployee((prev) => ({
                      ...prev,
                      salaryAdvance: {
                        ...prev.salaryAdvance,
                        request_date: e.target.value,
                      },
                    }))
                  }
                />
              </div>
            </div>

            {/* Advance Amount */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Advance Amount
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    className="border border-gray-300 rounded-l px-3 py-2 w-full"
                    placeholder="0.00"
                    value={amount || ""} // Use amount state
                    onChange={(e) => {
                      const value = e.target.value;
                      setAmount(value); // Update the amount state
                      setSelectedEmployee((prev) => ({
                        ...prev,
                        salaryAdvance: {
                          ...prev.salaryAdvance,
                          advance_amount: value, // Keep advance_amount synchronized
                        },
                      }));
                    }}
                  />
                  <span className="border border-gray-300 rounded-r px-3 py-2 bg-gray-50">
                    {symbol}
                  </span>
                </div>
              </div>
            </div>

            {/* Reason */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <input
                  type="text"
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                  placeholder="Enter reason"
                  value={selectedEmployee.salaryAdvance?.reason || ""}
                  onChange={(e) =>
                    setSelectedEmployee((prev) => ({
                      ...prev,
                      salaryAdvance: {
                        ...prev.salaryAdvance,
                        reason: e.target.value,
                      },
                    }))
                  }
                />
              </div>
            </div>

            <p className="text-gray-500 text-sm mb-4">
              After you add or update a salary advance, the data will be saved
              to the system.
            </p>

            {/* Buttons */}
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                onClick={closePopup}
                disabled={isSaving}
              >
                Cancel
              </button>
              {selectedEmployee.salaryAdvance?.id ? (
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={handleUpdate}
                  disabled={isSaving}
                >
                  {isSaving ? "Updating..." : "Update"}
                </button>
              ) : (
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showAdvancePopup && advanceToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96 relative">
            <button
              onClick={closeAdvancePopup}
              className="absolute top-2 right-2 text-gray-500 text-xl"
              disabled={isSaving}
            >
              &times;
            </button>

            <div className="flex justify-center mb-4">
              <h2 className="text-xl font-bold">Edit Salary Advance</h2>
            </div>

            <div className="mb-4 text-sm text-gray-700">
              <div className="font-medium">Reason</div>
              <div className="mt-1 text-gray-600">{advanceToEdit.reason}</div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Advance Amount
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="border border-gray-300 rounded-l px-3 py-2 w-full"
                  placeholder="0.00"
                />
                <span className="border border-gray-300 rounded-r px-3 py-2 bg-gray-50">
                  {symbol}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                onClick={closeAdvancePopup}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={handleAdvanceUpdate}
                disabled={isSaving}
              >
                {isSaving ? "Updating..." : "Update"}
              </button>
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

            {/* Header */}
            <h2
              className={`text-center text-xl font-bold mb-4 ${popupType === "error" ? "text-red-500" : "text-green-500"
                }`}
            >
              {popupType === "error" ? "Error" : "Success"}
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

export default AllowanceComponent;