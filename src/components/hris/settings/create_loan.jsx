/** @format */

import React, { useEffect, useState } from "react";
import { FaEdit } from "react-icons/fa";
import { MdOutlineFileDownload } from "react-icons/md";
import usePermissions from "../../permissions/permission";
import Cookies from "js-cookie";

const Create_Loan = () => {
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [typeName, setTypeName] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editType, setEditType] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const [timePeriod, setTimePeriod] = useState("");
  const [loanInterest, setLoanInterest] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const { hasPermission } = usePermissions();

  const safeTypes = Array.isArray(employeeTypes) ? employeeTypes : [];
  const itemsPerPage = 5;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEmployeeTypes = safeTypes.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const totalPages = Math.max(1, Math.ceil(safeTypes.length / itemsPerPage));
  const token = Cookies.get("accessToken");

  // Reusable fetch function
  const fetchEmployeeTypes = async () => {
    try {
      const res = await fetch(`${API_URL}/v1/hris/loan/loan-types`);
      const data = await res.json();
      console.log("API Response:", data);

      // normalize to an array
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.rows)
        ? data.rows
        : [];

      setEmployeeTypes(list);
    } catch (err) {
      console.error("Error fetching loan types:", err);
      setEmployeeTypes([]); // keep UI safe
    }
  };

  // Call fetchEmployeeTypes initially
  useEffect(() => {
    fetchEmployeeTypes();
  }, []);

  const handleSaveEmployeeType = async () => {
    if (!typeName || !timePeriod || !loanInterest || !loanAmount) {
      alert("Please fill in all fields.");
      return;
    }

    const payload = {
      name: typeName.trim(),
      timePeriod: Number(timePeriod),
      loanInterest: Number(loanInterest),
      loanAmount: parseFloat(loanAmount),
    };

    try {
      if (editType) {
        // Update Logic
        const response = await fetch(
          `${API_URL}/v1/hris/loan/loan-types?id=${editType.id}`, // Pass the ID as a query parameter
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        const result = await response.json();

        if (response.ok && result.success) {
          setSuccessMessage("Loan type updated successfully!");
          setShowSuccessPopup(true);
          setTimeout(() => setShowSuccessPopup(false), 3000); // Hide after 3 seconds
          fetchEmployeeTypes(); // Refresh the list
          clearForm(); // Reset the form after update
        } else {
          alert(
            `Failed to update loan type. Error: ${
              result.message || "Unknown error"
            }`
          );
        }
      } else {
        // Create Logic
        const response = await fetch(`${API_URL}/v1/hris/loan/loan-types`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setSuccessMessage("Loan type created successfully!");
          setShowSuccessPopup(true);
          setTimeout(() => setShowSuccessPopup(false), 3000); // Hide after 3 seconds
          fetchEmployeeTypes(); // Refresh the list
          clearForm(); // Reset the form after creation
        } else {
          alert(
            `Failed to create loan type. Error: ${
              result.message || "Unknown error"
            }`
          );
        }
      }
    } catch (error) {
      alert("An error occurred while saving the loan type.");
    }
  };

  const clearForm = () => {
    setTypeName("");
    setTimePeriod("");
    setLoanInterest("");
    setLoanAmount("");
    setEditType(null); // Clear editType to switch back to create mode
  };

  const handleUpdateEmployeeType = async () => {
    if (!editType || !editType.id || !editType.name) {
      alert("Please select a valid leave category and enter a name");
      return;
    }

    const payload = {
      name: editType.name.trim(), // The updated category name
    };

    try {
      const response = await fetch(
        `${API_URL}/v1/hris/leave/update-leave-category-name?id=${editType.id}`, // Pass ID as a query parameter
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload), // Send name in the body
        }
      );

      const result = await response.json();

      console.log("Response status:", response.status);
      console.log("Response body:", result);

      if (response.ok && result.success) {
        alert("Leave category updated successfully!");
        setIsEditModalOpen(false); // Close the edit modal
        fetchEmployeeTypes(); // Refresh the list to reflect changes
      } else {
        console.error(
          "Failed to update leave category:",
          result.message || result.error
        );
        alert(
          `Failed to update leave category. Error: ${
            result.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Error updating leave category:", error);
      alert("An error occurred while updating the leave category.");
    }
  };

  const handleExportCSV = () => {
    const header =
      "Loan Title,Time Period (months),Loan Interest (%),Loan Amount\n";
    const rows = safeTypes
      .map((t) =>
        [
          t.name ?? "",
          t.timePeriod ?? "",
          t.loanInterest ?? "",
          t.loanAmount ?? "",
        ].join(",")
      )
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "loan_types.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNextPage = () => {
    if (currentPage < Math.ceil(employeeTypes.length / itemsPerPage)) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleDeleteClick = (type) => {
    setTypeToDelete(type); // Store the leave category to delete
    setIsDeleteModalOpen(true); // Open the delete modal
  };

  const handleEditClick = (type) => {
    setTypeName(type.name);
    setTimePeriod(type.timePeriod);
    setLoanInterest(type.loanInterest);
    setLoanAmount(type.loanAmount);
    setEditType(type); // Store the full type data for updating
  };

  return (
    <div className="mx-10 mt-5 font-montserrat">
      <p className="text-[25px]">Loan Setup</p>
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-3 w-full shadow-lg p-3 rounded-lg">
          <div>
            <button
              className="px-4 py-2 text-white bg-[#2495FE] bg-opacity-55 rounded hover:bg-blue-600 flex justify-center mb-2 w-[150px] mt-5"
              onClick={handleExportCSV}
            >
              <div className="flex items-center gap-3 justify-end">
                <MdOutlineFileDownload />
                <div>Export</div>
              </div>
            </button>
          </div>
          <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
            <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 font-medium text-gray-900">
                    Loan Title
                  </th>
                  <th className="px-6 py-4 font-medium text-gray-900">
                    Time Period
                  </th>
                  <th className="px-6 py-4 font-medium text-gray-900">
                    Loan Interest
                  </th>
                  <th className="px-6 py-4 font-medium text-gray-900">
                    Loan Amount
                  </th>
                  <th className="px-6 py-4 font-medium text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 border-t border-gray-200">
                {currentEmployeeTypes.length > 0 ? (
                  currentEmployeeTypes.map((type) => (
                    <tr key={type.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{type.name}</td>
                      <td className="px-6 py-4">{type.timePeriod} months</td>
                      <td className="px-6 py-4">{type.loanInterest}%</td>
                      <td className="px-6 py-4">
                        ${Number(type.loanAmount ?? 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {hasPermission(10055) && (
                          <div className="flex items-center gap-6">
                            <div
                              className="rounded-lg bg-orange-300 p-2 text-orange-600 cursor-pointer"
                              onClick={() => handleEditClick(type)}
                            >
                              <FaEdit />
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </table>

          <div className="flex justify-between items-center mt-4">
            <button onClick={handlePreviousPage} disabled={currentPage === 1}>
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
        {hasPermission(10054) && (
          <div className="col-span-1 w-full shadow-lg p-3 rounded-lg h-[570px]">
            <div className="flex justify-center">
              <p className="text-[20px] font-mono">Create Loan </p>
            </div>
            <div className="mt-8">
              <label>
                <p>Loan Title</p>
              </label>
              <input
                className="border border-gray-200 rounded-lg w-full p-2 mt-3"
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
              />
            </div>
            <div className="flex justify-between items-center gap-5 mt-5">
              <div className="mt-2">
                <label>
                  <p>Time Period</p>
                </label>
                <input
                  type="number"
                  className="border border-gray-200 rounded-lg w-full p-2 mt-3"
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(e.target.value)}
                />
              </div>

              <div className="mt-2">
                <label>
                  <p>Loan Interest</p>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="border border-gray-200 rounded-lg w-full p-2 mt-3"
                  value={loanInterest}
                  onChange={(e) => setLoanInterest(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-8">
              <label>
                <p>Loan Amount</p>
              </label>
              <input
                type="number"
                step="0.01"
                className="border border-gray-200 rounded-lg w-full p-2 mt-3"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4 mt-3 justify-center">
              <div>
                <button
                  className="bg-gray-400 text-white rounded-lg p-2"
                  onClick={clearForm}
                >
                  Cancel
                </button>
              </div>
              <div>
                <button
                  className="bg-blue-600 text-white rounded-lg p-2"
                  onClick={handleSaveEmployeeType}
                >
                  {editType ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {isEditModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[400px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Edit Type</h2>
              <button
                className="text-gray-400"
                onClick={() => setIsEditModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Category Name:
              </label>
              <input
                className="border border-gray-300 rounded-lg w-full p-2 mt-1"
                value={editType?.name || ""}
                onChange={(e) =>
                  setEditType({ ...editType, name: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-300 text-gray-700 rounded-lg px-4 py-2"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 text-white rounded-lg px-4 py-2"
                onClick={handleUpdateEmployeeType}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[300px] text-center">
            <h2 className="text-lg font-semibold text-green-600">Success!</h2>
            <p className="text-gray-700 mt-2">{successMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Create_Loan;
