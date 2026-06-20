/** @format */

import React, { useState, useEffect } from "react";
import { MdDeleteOutline } from "react-icons/md";
import { AiTwotoneEdit } from "react-icons/ai";
import Edit_Timetable from "../time_and_attendance/TimeTable/edit_timetable";
import Cookies from "js-cookie";
import { API_URL } from "../../../utils/apiClient";
const Time_Management_Table = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const token = Cookies.get("accessToken");
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiFetch(
          `${API_URL}/v1/hris/timetable/gettimetable`,
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const result = await response.json();
        setData(result);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const totalPages = Math.ceil(data.length / rowsPerPage);

  const currentData = data.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleDeleteClick = (item) => {
    setEmployeeToDelete(item);
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  const handleConfirmDelete = () => {
    // Perform delete operation here
    console.log("Item deleted:", employeeToDelete);
    handleClosePopup();
  };

  const handleEditClick = (item) => {
    setEmployeeToEdit(item);
    setIsEditPopupOpen(true);
  };

  const handleCloseEditPopup = () => {
    setIsEditPopupOpen(false);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      {/* Table */}
      <div>
        <div className="bg-white shadow p-4 rounded-xl">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  Time Table Name
                </th>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  Start Checkin Time
                </th>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  End Check In Time
                </th>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  Grace Period Start
                </th>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  Grace Period End
                </th>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  Start Short Leave Time
                </th>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  End Short Leave Time
                </th>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  Start Half Day Time
                </th>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  End Half Day Time
                </th>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  Evening Half Day Start Time
                </th>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  Evening Half Day End Time
                </th>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  Evening Short Leave Start Time
                </th>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  Evening Short Leave End Time
                </th>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  Start Check Out Time
                </th>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  End Checkout Time
                </th>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.map((item) => (
                <tr key={item.TimetableID}>
                  <td className="px-6 py-4 whitespace-nowrap text-md">
                    {item.TimetableName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-md">
                    {item.StartCheckInTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-md">
                    {item.EndCheckInTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-md">
                    {item.GracePeriodStart}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-md">
                    {item.GracePeriodEnd}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-md">
                    {item.StartShortLeaveTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-md">
                    {item.EndShortLeaveTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-md">
                    {item.StartHalfDayTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-md">
                    {item.EndHalfDayTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-md">
                    {item.EveningHalfDayStartTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-md">
                    {item.EveningHalfDayEndTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-md">
                    {item.EveningShortLeaveStartTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-md">
                    {item.EveningShortLeaveEndTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-md">
                    {item.StartCheckOutTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-md">
                    {item.EndCheckOutTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-md">
                    <button
                      className="text-blue-500 hover:text-blue-700"
                      onClick={() => handleEditClick(item)}
                    >
                      <AiTwotoneEdit />
                    </button>
                    <button
                      className="text-red-500 hover:text-red-700 ml-2"
                      onClick={() => handleDeleteClick(item)}
                    >
                      <MdDeleteOutline />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 flex gap-10 items-center">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 border border-gray-300 rounded-lg"
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 border border-gray-300 rounded-lg"
          >
            Next
          </button>
        </div>
      </div>

      {/* Delete Confirmation Popup */}
      {isPopupOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 border rounded shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
            <p>Are you sure you want to delete this item?</p>
            <div className="mt-4 flex gap-4">
              <button
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={handleConfirmDelete}
              >
                Confirm
              </button>
              <button
                className="bg-gray-300 px-4 py-2 rounded"
                onClick={handleClosePopup}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Timetable Popup */}
      {isEditPopupOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-500 bg-opacity-75">
          <div className="bg-white p-6 border rounded shadow-lg max-h-[80vh] overflow-y-auto">
            <Edit_Timetable
              item={employeeToEdit}
              onClose={handleCloseEditPopup}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Time_Management_Table;
