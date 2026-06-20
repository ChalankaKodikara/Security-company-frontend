/** @format */

import React, { useEffect, useState } from "react";
import { FaEdit } from "react-icons/fa";
import { RiDeleteBin6Line } from "react-icons/ri";
import { MdOutlineFileDownload } from "react-icons/md";
import usePermissions from "../../permissions/permission";

const CreateBranch = () => {
  const [branches, setBranches] = useState([]);
  const [branchName, setBranchName] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editBranch, setEditBranch] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success"); // "success" or "error"
  const [showPopup, setShowPopup] = useState(false);
  const { hasPermission } = usePermissions();
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  const fetchBranches = async () => {
    try {
      const response = await fetch(`${API_URL}/v1/hris/branch/all`);
      const data = await response.json();
      setBranches(data);
    } catch (error) {
      console.error("Error fetching branch data:", error);
      setPopupMessage("Failed to fetch branches. Please try again.");
      setPopupType("error");
      setShowPopup(true);
    }
  };
  useEffect(() => {
    fetchBranches();
  }, []);

  const handleSaveBranch = async () => {
    if (!branchName) {
      setPopupMessage("Please enter a branch name.");
      setPopupType("error");
      setShowPopup(true);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/v1/hris/branch/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ branch: branchName }),
      });

      if (response.ok) {
        setPopupMessage("Branch added successfully!");
        setPopupType("success");
        setShowPopup(true);

        await fetchBranches(); // Refresh branches after adding
        setBranchName(""); // Reset input field
      } else {
        setPopupMessage("Failed to add branch. Please try again.");
        setPopupType("error");
        setShowPopup(true);
      }
    } catch (error) {
      console.error("Error adding branch:", error);
      setPopupMessage("An error occurred while adding the branch.");
      setPopupType("error");
      setShowPopup(true);
    }
  };

  const handleUpdateBranch = async () => {
    if (!editBranch || !editBranch.branch) {
      setPopupMessage("Please enter a branch name.");
      setPopupType("error");
      setShowPopup(true);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/v1/hris/branch/update/${editBranch.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ branch: editBranch.branch }),
        }
      );

      if (response.ok) {
        setPopupMessage("Branch updated successfully!");
        setPopupType("success");
        setShowPopup(true);

        await fetchBranches(); // Refresh branches after updating
        setIsEditModalOpen(false); // Close the modal
      } else {
        setPopupMessage("Failed to update branch. Please try again.");
        setPopupType("error");
        setShowPopup(true);
      }
    } catch (error) {
      console.error("Error updating branch:", error);
      setPopupMessage("An error occurred while updating the branch.");
      setPopupType("error");
      setShowPopup(true);
    }
  };

  const handleDeleteBranch = async () => {
    try {
      const response = await fetch(
        `${API_URL}/v1/hris/branch/delete/${branchToDelete.id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setPopupMessage("Branch deleted successfully!");
        setPopupType("success");
        setShowPopup(true);

        await fetchBranches(); // Refresh branches after deleting
        setIsDeleteModalOpen(false); // Close the modal
      } else {
        setPopupMessage("Failed to delete branch. Please try again.");
        setPopupType("error");
        setShowPopup(true);
      }
    } catch (error) {
      console.error("Error deleting branch:", error);
      setPopupMessage("An error occurred while deleting the branch.");
      setPopupType("error");
      setShowPopup(true);
    }
  };

  const handleEditClick = (branch) => {
    setEditBranch(branch);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (branch) => {
    setBranchToDelete(branch);
    setIsDeleteModalOpen(true);
  };

  const handleExportCSV = () => {
    // Prepare CSV header
    const csvHeader = "Branch\n";

    // Prepare CSV rows
    const csvRows = branches.map((branch) => branch.branch).join("\n");

    // Combine header and rows
    const csvContent = csvHeader + csvRows;

    // Create a Blob and generate a download link
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    // Create an anchor element to download the file
    const a = document.createElement("a");
    a.href = url;
    a.download = "branches.csv"; // File name
    a.click();

    // Cleanup
    URL.revokeObjectURL(url);
  };
  const [currentPage, setCurrentPage] = useState(1);
  const branchesPerPage = 5; // Number of branches per page
  // Calculate the index of the first and last branch for the current page
  const indexOfLastBranch = currentPage * branchesPerPage;
  const indexOfFirstBranch = indexOfLastBranch - branchesPerPage;

  // Get branches for the current page
  const currentBranches = branches.slice(indexOfFirstBranch, indexOfLastBranch);
  const totalPages = Math.ceil(branches.length / branchesPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <div className=" mt-5 font-montserrat">
      <p className="text-[25px]  mb-8">Branch</p>
      <div className="grid grid-cols-4 gap-4">
        {/* Section 1 */}
        <div className="col-span-3 w-full shadow-lg p-3 rounded-lg">
          <div>
            <div>
              <button
                className="px-4 py-2 text-white bg-[#2495FE] bg-opacity-55 rounded hover:bg-blue-600 flex justify-center mb-2 w-[150px] mt-5"
                onClick={handleExportCSV}
              >
                <div className="flex items-center gap-3 justify-end">
                  <MdOutlineFileDownload />
                  <div className="z-1000">Export</div>
                </div>
              </button>
            </div>
          </div>
          <div className="mt-4">
            <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 font-medium text-gray-900">
                    Branch
                  </th>
                  <th className="px-6 py-4 font-medium text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 border-t border-gray-200">
                {currentBranches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{branch.branch}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-6">
                        {hasPermission(10042) && (
                          <div
                            className="rounded-lg bg-orange-300 p-2 text-orange-600 cursor-pointer"
                            onClick={() => handleEditClick(branch)}
                          >
                            <FaEdit />
                          </div>
                        )}
                        {hasPermission(10043) && (
                          <div
                            className="rounded-lg bg-red-300 p-2 text-red-600 cursor-pointer"
                            onClick={() => handleDeleteClick(branch)}
                          >
                            <RiDeleteBin6Line />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

              <div className="flex justify-between items-center mt-4">
                <button
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </table>
          </div>
        </div>

        {/* Section 2 */}
        {hasPermission(10041) && (
          <div className="col-span-1 w-full shadow-lg p-3 rounded-lg h-[350px]">
            <p className="text-[20px] font-mono">Add New Branch</p>
            <div className="mt-5">
              <label>
                <p>Branch name</p>
              </label>
              <input
                className="border border-gray-200 rounded-lg w-full mt-3 p-2"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4 mt-3 justify-center">
              <div>
                <button className="bg-gray-400 text-white rounded-lg p-2">
                  Cancel
                </button>
              </div>
              <div>
                <button
                  className="bg-blue-600 text-white rounded-lg p-2"
                  onClick={handleSaveBranch}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[400px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Edit Branch</h2>
              <button
                className="text-gray-400"
                onClick={() => setIsEditModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Branch Name:
              </label>
              <input
                className="border border-gray-300 rounded-lg w-full p-2 mt-1"
                value={editBranch?.branch || ""}
                onChange={(e) =>
                  setEditBranch({ ...editBranch, branch: e.target.value })
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
                onClick={handleUpdateBranch}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[400px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Delete?</h2>
              <button
                className="text-gray-400"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm">
                Do you want to delete:{" "}
                <span className="text-blue-500 font-semibold">
                  {branchToDelete?.branch}
                </span>
                ?
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-300 text-gray-700 rounded-lg px-4 py-2"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                No
              </button>
              <button
                className="bg-blue-600 text-white rounded-lg px-4 py-2"
                onClick={handleDeleteBranch}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateBranch;
