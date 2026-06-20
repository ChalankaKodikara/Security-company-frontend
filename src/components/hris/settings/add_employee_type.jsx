/** @format */

import React, { useEffect, useState } from "react";
import { FaEdit } from "react-icons/fa";
import { RiDeleteBin6Line } from "react-icons/ri";
import { MdOutlineFileDownload } from "react-icons/md";
import usePermissions from "../../permissions/permission";
import Cookies from "js-cookie";

//  helper to read cookies
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
};

const EmployeeTypeManager = () => {
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [leaveCategories, setLeaveCategories] = useState([]);

  // add form states
  const [typeName, setTypeName] = useState("");
  const [duration, setDuration] = useState("");
  const [autoTransitionTo, setAutoTransitionTo] = useState("");
  const [autoTransitionAfter, setAutoTransitionAfter] = useState("");
  const [ageLimit, setAgeLimit] = useState("");
  const [selectedLeaveCategories, setSelectedLeaveCategories] = useState([]);

  // edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editType, setEditType] = useState(null);

  // delete modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // popup
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");
  const [showPopup, setShowPopup] = useState(false);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  const { hasPermission } = usePermissions();

  // ==================== API Calls ====================
  const fetchEmployeeTypes = async () => {
    const token = Cookies.get("accessToken");
    try {
      const response = await fetch(`${API_URL}/v1/hris/employmentType/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) setEmployeeTypes(data.data);
    } catch (error) {
      console.error("Error fetching employee types:", error);
    }
  };

  const fetchLeaveCategories = async () => {
    const token = Cookies.get("accessToken");
    try {
      const response = await fetch(
        `${API_URL}/v1/hris/leave/getLeaveCategory`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) setLeaveCategories(data.data);
    } catch (error) {
      console.error("Error fetching leave categories:", error);
    }
  };

  useEffect(() => {
    fetchEmployeeTypes();
    fetchLeaveCategories();
  }, []);

  const handleSaveEmployeeType = async () => {
    if (!typeName) {
      setPopupMessage("Please enter an employment type name.");
      setPopupType("error");
      setShowPopup(true);
      return;
    }

    try {
      const token = Cookies.get("accessToken"); //  from browser cookies
      const payload = {
        employment_type_name: typeName, //  only field required now
      };

      const response = await fetch(`${API_URL}/v1/hris/employmentType/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, //  pass token in headers
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPopupMessage("Employment type added successfully!");
        setPopupType("success");
        setShowPopup(true);
        resetAddForm();
        fetchEmployeeTypes(); //  reload list
      } else {
        setPopupMessage(data.message || "Failed to add employment type.");
        setPopupType("error");
        setShowPopup(true);
      }
    } catch (error) {
      console.error("Error adding employment type:", error);
      setPopupMessage("An error occurred while adding employment type.");
      setPopupType("error");
      setShowPopup(true);
    }
  };

  const resetAddForm = () => {
    setTypeName("");
    setDuration("");
    setAutoTransitionTo("");
    setAutoTransitionAfter("");
    setAgeLimit("");
    setSelectedLeaveCategories([]);
  };

  // ==================== Edit Employment Type ====================
  const handleEditClick = (type) => {
    setEditType({
      id: type.id,
      employment_type_name: type.type_name,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateEmployeeType = async () => {
    if (!editType || !editType.employment_type_name) {
      setPopupMessage("Please enter an employment type name.");
      setPopupType("error");
      setShowPopup(true);
      return;
    }

    try {
      const token = Cookies.get("accessToken");
      const payload = {
        employment_type_name: editType.employment_type_name,
      };

      const response = await fetch(
        `${API_URL}/v1/hris/employmentType/update/${editType.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setPopupMessage("Employment type updated successfully!");
        setPopupType("success");
        setShowPopup(true);
        setIsEditModalOpen(false);
        fetchEmployeeTypes();
      } else {
        setPopupMessage(data.message || "Failed to update employment type.");
        setPopupType("error");
        setShowPopup(true);
      }
    } catch (error) {
      console.error("Error updating employment type:", error);
      setPopupMessage("An error occurred while updating employment type.");
      setPopupType("error");
      setShowPopup(true);
    }
  };

  // ==================== Delete Employment Type ====================
  const handleDeleteClick = (type) => {
    setTypeToDelete(type);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteEmployeeType = async () => {
    try {
      const token = Cookies.get("accessToken");
      const response = await fetch(
        `${API_URL}/v1/hris/employmentType/delete/${typeToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setPopupMessage("Employment type deleted successfully!");
        setPopupType("success");
        setShowPopup(true);
        setEmployeeTypes(employeeTypes.filter((t) => t.id !== typeToDelete.id));
        setIsDeleteModalOpen(false);
      } else {
        setPopupMessage("Failed to delete employment type.");
        setPopupType("error");
        setShowPopup(true);
      }
    } catch (error) {
      console.error("Error deleting employment type:", error);
      setPopupMessage("An error occurred while deleting employment type.");
      setPopupType("error");
      setShowPopup(true);
    }
  };

  // ==================== Helpers ====================
  const toggleLeaveCategory = (id, isEdit = false) => {
    if (isEdit) {
      setEditType((prev) => ({
        ...prev,
        eligible_leave_categories: prev.eligible_leave_categories?.includes(id)
          ? prev.eligible_leave_categories.filter((cat) => cat !== id)
          : [...(prev.eligible_leave_categories || []), id],
      }));
    } else {
      setSelectedLeaveCategories((prev) =>
        prev.includes(id) ? prev.filter((cat) => cat !== id) : [...prev, id]
      );
    }
  };

  const handleExportCSV = () => {
    const csvHeader = "Employment Type\n";
    const csvRows = employeeTypes.map((type) => type.type_name).join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employee_types.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const currentEmployeeTypes = employeeTypes.slice(
    indexOfLastItem - itemsPerPage,
    indexOfLastItem
  );
  const totalPages = Math.ceil(employeeTypes.length / itemsPerPage);

  return (
    <div className=" mt-5 font-montserrat">
      <p className="text-[25px] mb-8">Employee Types</p>

      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-3 w-full shadow-lg p-3 rounded-lg">
          <button
            className="px-4 py-2 text-white bg-[#2495FE] bg-opacity-55 rounded hover:bg-blue-600 flex justify-center mb-2 w-[150px]"
            onClick={handleExportCSV}
          >
            <MdOutlineFileDownload className="mr-2" /> Export
          </button>

          <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-900">Type</th>
                <th className="px-6 py-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 border-t border-gray-200">
              {currentEmployeeTypes.map((type) => (
                <tr key={type.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{type.type_name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-6">
                      {hasPermission(10045) && (
                        <div
                          className="rounded-lg bg-orange-300 p-2 text-orange-600 cursor-pointer"
                          onClick={() => handleEditClick(type)}
                        >
                          <FaEdit />
                        </div>
                      )}
                      {hasPermission(10046) && (
                        <div
                          className="rounded-lg bg-red-300 p-2 text-red-600 cursor-pointer"
                          onClick={() => handleDeleteClick(type)}
                        >
                          <RiDeleteBin6Line />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <button
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>

        {/* ==================== Add Form ==================== */}

        {/* ==================== Add Form ==================== */}
        {hasPermission(10044) && (
          <div className="col-span-1 w-full shadow-lg p-3 rounded-lg h-auto">
            <p className="text-[20px] font-montserrat mb-3">Add Employment Type</p>

            <input
              className="border w-full p-2 mt-2 rounded-lg"
              placeholder="Employment Type Name"
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
            />

            <div className="flex gap-4 mt-4 justify-center">
              <button
                className="bg-gray-400 text-white rounded-lg p-2"
                onClick={resetAddForm}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 text-white rounded-lg p-2"
                onClick={handleSaveEmployeeType}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px]">
            <h2 className="text-lg font-semibold mb-4">Edit Employment Type</h2>
            <input
              className="border w-full p-2 mt-2 rounded-lg"
              value={editType.employment_type_name}
              onChange={(e) =>
                setEditType({
                  ...editType,
                  employment_type_name: e.target.value,
                })
              }
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                className="bg-gray-400 px-4 py-2 rounded-lg"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                onClick={handleUpdateEmployeeType}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Delete Modal ==================== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px]">
            <h2 className="text-lg font-semibold mb-4">Delete?</h2>
            <p>
              Are you sure you want to delete{" "}
              <span className="font-bold">{typeToDelete.type_name}</span>?
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <button
                className="bg-gray-400 px-4 py-2 rounded-lg"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                No
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded-lg"
                onClick={handleDeleteEmployeeType}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-[400px] relative">
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-2 right-2 text-gray-500 text-xl"
            >
              &times;
            </button>
            <h2
              className={`text-center text-xl font-bold mb-4 ${
                popupType === "success" ? "text-green-500" : "text-red-500"
              }`}
            >
              {popupMessage}
            </h2>
            <div className="flex justify-center">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded"
                onClick={() => setShowPopup(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeTypeManager;
