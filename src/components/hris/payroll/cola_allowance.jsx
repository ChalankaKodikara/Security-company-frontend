/** @format */

import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import Select from "react-select"; // Import react-select
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import { apiFetch } from "../../../utils/apiClient";

const ColaAllowance = () => {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showPopup, setShowPopup] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [amount, setAmount] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10); // Changed pageSize to a constant
  const [totalPages, setTotalPages] = useState(1);
  const [remark, setRemark] = useState("");

  // New filter states
  const [searchFilter, setSearchFilter] = useState(""); // Combined search for employee ID/Name
  const [organizationOptions, setOrganizationOptions] = useState([]);
  const [selectedOrganizationFilter, setSelectedOrganizationFilter] = useState(null);

  // Dummy placeholders for read-only fields
  const suggestedName = "COLA Component";
  const rate = "5"; // Still not directly used in logic, but present
  const type = "Amount"; // Still not directly used in logic, but present
  const symbol = "Rs";

  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const token = Cookies.get("accessToken"); // Get token from cookies

  const fetchOrganizations = async () => {
    try {
      const response = await apiFetch(`${API_URL}/v1/hris/organizations/organization`, {
       
      });
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setOrganizationOptions(result.data.map(org => ({
          value: org.id,
          label: org.organization_name,
        })));
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [API_URL, token]);


  const fetchColaData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (searchFilter.trim()) {
        params.append("search", searchFilter.trim());
      }
      if (selectedOrganizationFilter) {
        params.append("organization", selectedOrganizationFilter.value);
      }

      const response = await apiFetch(
        `${API_URL}/v1/hris/cola/with-cola-availability?${params.toString()}`,
      
      );
      const result = await response.json();
      if (result.success) {
        setEmployees(result.data);
        setTotalPages(result.pagination.totalPages);
      } else {
        setEmployees([]);
        setTotalPages(1);
        toast.error(result.message || "Failed to fetch COLA data.", { autoClose: 3000 });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setEmployees([]);
      setTotalPages(1);
      toast.error("An error occurred while fetching COLA data.", { autoClose: 3000 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchColaData();
  }, [page, pageSize, searchFilter, selectedOrganizationFilter, API_URL, token]); // Add new filters to dependencies

  const closePopup = () => {
    setShowPopup(false);
    setSelectedEmployee(null);
    setShowDeleteConfirm(false);
    setAmount("");
    setRemark("");
  };

  const handleSave = async () => {
    if (!selectedEmployee) return;

    try {
      setIsSaving(true);
      const priceAmount = parseFloat(amount);
      if (isNaN(priceAmount) || priceAmount <= 0) {
        toast.error("Please enter a valid positive amount.", { autoClose: 3000 });
        setIsSaving(false);
        return;
      }

      if (selectedEmployee.availability === "Yes") {
        const response = await apiFetch(
          `${API_URL}/v1/hris/cola/update/${selectedEmployee.employee_no}`,
          {
            method: "PUT",
           
            body: JSON.stringify({
              remark: remark || "Cola allowance for updated",
              price: priceAmount,
            }),
          }
        );

        const result = await response.json();

        if (response.ok && result.success) {
          toast.success(result.message || "Cola updated successfully", {
            position: "top-right",
            autoClose: 3000,
          });
          closePopup();
          fetchColaData(); // soft refresh
        } else {
          toast.error(result.message || "Failed to update cola allowance.", {
            position: "top-right",
            autoClose: 3000,
          });
          console.error(result);
        }
      } else {
        const response = await apiFetch(`${API_URL}/v1/hris/cola/assign`, {
          method: "POST",
         
          body: JSON.stringify({
            employee_no: selectedEmployee.employee_no,
            remark: remark || "Cola allowance for this month",
            price: priceAmount,
          }),
        });

        const result = await response.json();

        if (response.ok) {
          toast.success(result.message || "Cola assigned successfully", {
            position: "top-right",
            autoClose: 3000,
          });
          closePopup();
          fetchColaData(); // soft refresh
        } else {
          toast.error(result.message || "Failed to assign cola allowance.", {
            position: "top-right",
            autoClose: 3000,
          });
          console.error(result);
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("An error occurred while saving.", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;

    try {
      setIsSaving(true);
      const response = await apiFetch(
        `${API_URL}/v1/hris/cola/delete/${selectedEmployee.employee_no}`,
        {
          method: "DELETE",
          
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(result.message || "Cola deleted successfully", {
          position: "top-right",
          autoClose: 3000,
        });
        setShowDeleteConfirm(false);
        closePopup();
        fetchColaData(); // refresh table
      } else {
        toast.error(result.message || "Failed to delete cola allowance.", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("An error occurred while deleting.", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-5 mt-5 font-montserrat">
      <p className="text-[24px] mb-8">
        Payroll Navigation / Payroll Allowance / Cola Allowance
      </p>

      {/* Search Fields */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Employee
          </label>
          <input
            type="text"
            className="border border-gray-300 rounded px-3 py-2 w-64"
            placeholder="e.g. EMP001, John"
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
            value={selectedOrganizationFilter}
            onChange={(opt) => setSelectedOrganizationFilter(opt)}
            isClearable
            className="w-64"
            classNamePrefix="select"
          />
        </div>
        <div className="flex items-end">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => {
              setPage(1); // Reset to first page when applying search/filters
              fetchColaData(); // Will be triggered by useEffect due to state change
            }}
          >
            Search
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-5">
        <div className="table-container shadow-md rounded-lg overflow-hidden max-w-6xl">
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
                  <td colSpan={3} className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-4">
                    No records found.
                  </td>
                </tr>
              ) : (
                employees.map((employee, index) => (
                  <tr
                    key={employee.employee_no || index} // Use employee_no as key if available
                    className="hover:bg-blue-50 cursor-pointer"
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setAmount(
                        employee.availability === "Yes"
                          ? employee.price?.toString() || ""
                          : ""
                      );
                      setRemark(
                        employee.availability === "Yes"
                          ? employee.remark || ""
                          : ""
                      );
                      setShowPopup(true);
                    }}
                  >
                    <td className="px-6 py-4">{employee.employee_no}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 flex-shrink-0 rounded-full bg-blue-300 flex items-center justify-center text-white font-bold">
                          {employee.employee_calling_name
                            ?.split(" ") // Safely access split
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase() || "??"}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.employee_calling_name || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {employee.employee_email || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {employee.availability === "Yes" ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                          Cola Added
                        </span>
                      ) : (
                        <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm">
                          No Cola for this
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="flex justify-between items-center mt-4 p-2">
            <button
              disabled={page <= 1 || isLoading}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* POPUP */}
      {showPopup && selectedEmployee && (
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
              {selectedEmployee.availability === "No" ? (
                <h2 className="text-xl font-bold">Assign Component</h2>
              ) : (
                <h2 className="text-xl font-bold">
                  Change & Delete Component
                </h2>
              )}
            </div>

            {/* Employee Info */}
            <div className="flex items-center mb-2">
              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-300 flex items-center justify-center text-white font-bold">
                {selectedEmployee.employee_calling_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() || "??"}
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-900">
                  {selectedEmployee.employee_calling_name || "N/A"}
                </div>
                <div className="text-sm text-gray-500">
                  {selectedEmployee.employee_email || "N/A"}
                </div>
              </div>
            </div>

            {/* Existing Components */}
            <p className="mb-2 flex items-center">
              Existing Components:&nbsp;
              {selectedEmployee.availability === "No" ? (
                <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm">
                  No Available Component
                </span>
              ) : (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                  {suggestedName}
                </span>
              )}
            </p>

            {/* Component Name (Read-Only) */}
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
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    readOnly={false}
                  />

                  <span className="border border-gray-300 rounded-r px-3 py-2 bg-gray-50">
                    {symbol}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  className="border border-gray-300 rounded-l px-3 py-2 w-full"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                />
              </div>
            </div>

            <p className="text-gray-500 text-sm mb-4">
              After you assign, a salary component value will be added to the
              employee.
            </p>

            {/* Buttons (disabled actions) */}
            <div className="flex justify-end gap-2">
              {/* Cancel button */}
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                onClick={closePopup}
                disabled={isSaving}
              >
                Cancel
              </button>

              {/* Save button (always visible) */}
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>

              {/* Delete button (only if availability === "Yes") */}
              {selectedEmployee.availability === "Yes" && (
                <button
                  className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-100"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSaving}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-[400px]">
            <h2 className="text-lg font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-6 text-sm text-gray-700">
              Are you sure you want to delete the COLA allowance for{" "}
              <strong>{selectedEmployee?.employee_no}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={handleDelete}
                disabled={isSaving}
              >
                {isSaving ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default ColaAllowance;