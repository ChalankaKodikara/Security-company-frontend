/** @format */

import React, { useState, useEffect } from "react";
import "react-datepicker/dist/react-datepicker.css";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import Cookies from "js-cookie";
import { apiFetch } from "../../../../utils/apiClient";

const LeaveDataTable = ({ searchInput, setSearchInput, leaveData }) => {
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");
  const [departments, setDepartments] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isCurrentLeavePopupOpen, setIsCurrentLeavePopupOpen] = useState(false);
  const [isActualLeavePopupOpen, setIsActualLeavePopupOpen] = useState(false);
  const [currentLeave, setCurrentLeave] = useState(null);
  const [currentLeaveData, setCurrentLeaveData] = useState(null);
  const [actualLeaveData, setActualLeaveData] = useState(null);
  const rowsPerPage = 5;
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const token = Cookies.get("accessToken");
  useEffect(() => {
    const uniqueDepartments = [
      "All Departments",
      ...new Set(leaveData.map((leave) => leave.department)),
    ];
    setDepartments(uniqueDepartments);
    setFilteredData(leaveData);
  }, [leaveData]);

  useEffect(() => {
    filterData();
  }, [searchInput, selectedDepartment, startDate, endDate]);

  const filterData = () => {
    let data = leaveData;

    if (searchInput) {
      data = data.filter(
        (leave) =>
          leave.employee_no.toLowerCase().includes(searchInput.toLowerCase()) ||
          leave.employee_fullname
            .toLowerCase()
            .includes(searchInput.toLowerCase())
      );
    }

    if (selectedDepartment !== "All Departments") {
      data = data.filter((leave) => leave.department === selectedDepartment);
    }

    if (startDate && endDate) {
      data = data.filter((leave) => {
        const appointmentDate = new Date(leave.date_of_appointment);
        return appointmentDate >= startDate && appointmentDate <= endDate;
      });
    }

    setFilteredData(data);
    setCurrentPage(1); // Reset to the first page after filtering
  };

  const exportToCSV = () => {
    const csvData = filteredData.map((leave) => ({
      EmployeeNo: leave.employee_no,
      Department: leave.department,
      EmployeeName: leave.employee_fullname,
      DateOfAppointment: leave.date_of_appointment,
      AnnualLeave: `${leave.current_leave_counts.anualleavecount} / ${leave.actual_leave_counts.anualleavecount}`,
      CasualLeave: `${leave.current_leave_counts.casualleavecount} / ${leave.actual_leave_counts.casualleavecount}`,
      MedicalLeave: `${leave.current_leave_counts.medicalleavecount} / ${leave.actual_leave_counts.medicalleavecount}`,
      SpecialLeave: `${leave.current_leave_counts.specialleavecount} / ${leave.actual_leave_counts.specialleavecount}`,
      NoPay: `${leave.current_leave_counts.noPayLeaveCount} / ${leave.actual_leave_counts.noPayLeaveCount}`,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "leave_data.csv");
  };

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const currentData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
    setCurrentPage(1);
  };

  const handleCurrentLeaveEditClick = (leave) => {
    setCurrentLeave(leave);
    setCurrentLeaveData({
      anualleavecount: leave.current_leave_counts.anualleavecount,
      casualleavecount: leave.current_leave_counts.casualleavecount,
      medicalleavecount: leave.current_leave_counts.medicalleavecount,
      specialleavecount: leave.current_leave_counts.specialleavecount,
      noPayLeaveCount: leave.current_leave_counts.noPayLeaveCount,
    });
    setIsCurrentLeavePopupOpen(true);
  };

  const handleActualLeaveEditClick = (leave) => {
    setCurrentLeave(leave);
    setActualLeaveData({
      actualAnualLeaveCount: leave.actual_leave_counts.anualleavecount,
      actualCasualLeaveCount: leave.actual_leave_counts.casualleavecount,
      actualMedicalLeaveCount: leave.actual_leave_counts.medicalleavecount,
      actualSpecialLeaveCount: leave.actual_leave_counts.specialleavecount,
    });
    setIsActualLeavePopupOpen(true);
  };

  const handleCurrentLeaveSave = async () => {
    console.log("Saving current leave data:", currentLeaveData);

    try {
      const response = await apiFetch(
        `${API_URL}/v1/hris/leave/updateCurrentLeaveCount?employee_no=${currentLeave.employee_no}`,
        {
          method: "PUT",
         
          body: JSON.stringify(currentLeaveData),
        }
      );

      if (response.ok) {
        const updatedLeave = await response.json();
        setFilteredData((prevData) =>
          prevData.map((leave) =>
            leave.employee_no === updatedLeave.employee_no
              ? { ...leave, current_leave_counts: updatedLeave }
              : leave
          )
        );
        setIsCurrentLeavePopupOpen(false);
      } else {
        console.error("Failed to update current leave data");
      }
    } catch (error) {
      console.error("Error updating current leave data:", error);
    }
  };

  const handleActualLeaveSave = async () => {
    console.log("Saving actual leave data:", actualLeaveData);

    try {
      const response = await apiFetch(
        `${API_URL}/v1/hris/leave/updateActualLeaveCount?employee_no=${currentLeave.employee_no}`,
        {
          method: "PUT",
         
          body: JSON.stringify(actualLeaveData),
        }
      );

      if (response.ok) {
        const updatedLeave = await response.json();
        setFilteredData((prevData) =>
          prevData.map((leave) =>
            leave.employee_no === updatedLeave.employee_no
              ? { ...leave, actual_leave_counts: updatedLeave }
              : leave
          )
        );
        setIsActualLeavePopupOpen(false);
      } else {
        console.error("Failed to update actual leave data");
      }
    } catch (error) {
      console.error("Error updating actual leave data:", error);
    }
  };

  const handleCurrentLeaveInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentLeaveData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleActualLeaveInputChange = (e) => {
    const { name, value } = e.target;
    setActualLeaveData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPageNumbersToShow = 5;
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + maxPageNumbersToShow - 1);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 border rounded-md ${
            currentPage === i ? "bg-gray-300" : "bg-white"
          }`}
        >
          {i}
        </button>
      );
    }

    if (startPage > 1) {
      pageNumbers.unshift(
        <button
          key="prev"
          onClick={() => handlePageChange(startPage - maxPageNumbersToShow)}
          className="px-3 py-1 border rounded-md bg-white"
        >
          &laquo; See Less
        </button>
      );
    }

    if (endPage < totalPages) {
      pageNumbers.push(
        <button
          key="next"
          onClick={() => handlePageChange(endPage + 1)}
          className="px-3 py-1 border rounded-md bg-white"
        >
          See More &raquo;
        </button>
      );
    }

    return pageNumbers;
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mr-[5%]">
        <div className="flex items-center justify-between">
          <div className="">
            <input
              className="border border-black rounded-xl p-2 pl-10 w-[325px]"
              placeholder="Search by Employee No or Name"
              value={searchInput}
              onChange={handleSearchChange}
            />
          </div>
          <div>
            <select
              className="shadow-custom rounded-xl p-2 ml-4 w-[200px]"
              value={selectedDepartment}
              onChange={handleDepartmentChange}
            >
              {departments.map((department, index) => (
                <option key={index} value={department}>
                  {department}
                </option>
              ))}
            </select>
            <button
              onClick={exportToCSV}
              className="shadow-custom rounded-xl p-2 ml-4"
            >
              Export to CSV
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto mt-4 bg-white shadow p-2 rounded-xl">
        <table className="w-full ">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Employee No</th>
              <th className=" p-2">Department</th>
              <th className=" p-2">Employee Name</th>
              <th className=" p-2">Date of Appointment</th>
              <th className=" p-2">Annual Leave</th>
              <th className=" p-2">Casual Leave</th>
              <th className=" p-2">Medical Leave</th>
              <th className=" p-2">Special Leave</th>
              <th className=" p-2">No Pay Leave</th>
              <th className=" p-2 w-[17%]">Action</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((leave) => (
              <tr key={leave.employee_no}>
                <td className=" p-2">{leave.employee_no}</td>
                <td className=" p-2">{leave.department}</td>
                <td className=" p-2">{leave.employee_fullname}</td>
                <td className=" p-2">{leave.date_of_appointment}</td>
                <td className=" p-2">
                  {leave.current_leave_counts.anualleavecount} /{" "}
                  {leave.actual_leave_counts.anualleavecount}
                </td>
                <td className=" p-2">
                  {leave.current_leave_counts.casualleavecount} /{" "}
                  {leave.actual_leave_counts.casualleavecount}
                </td>
                <td className=" p-2">
                  {leave.current_leave_counts.medicalleavecount} /{" "}
                  {leave.actual_leave_counts.medicalleavecount}
                </td>
                <td className=" p-2">
                  {leave.current_leave_counts.specialleavecount} /{" "}
                  {leave.actual_leave_counts.specialleavecount}
                </td>
                <td className=" p-2">
                  {leave.current_leave_counts.noPayLeaveCount}
                </td>
                <td className=" p-2 w-[17%]">
                  <div className="flex items-center gap-2  ">
                    <button
                      onClick={() => handleCurrentLeaveEditClick(leave)}
                      className="bg-[#673a86] text-white rounded p-1 w-[55%]"
                    >
                      Edit Current
                    </button>
                    <button
                      onClick={() => handleActualLeaveEditClick(leave)}
                      className="bg-[#b34df7] text-white rounded p-1 w-[55%]"
                    >
                      Edit Actual
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <div className="flex justify-between">{renderPageNumbers()}</div>
      </div>

      {isCurrentLeavePopupOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75">
          <div className="bg-white p-4 rounded-lg w-96">
            <h2 className="text-xl mb-4">Edit Current Leave</h2>
            <label className="block mb-2">
              Annual Leave:
              <input
                type="number"
                name="anualleavecount"
                value={currentLeaveData?.anualleavecount || ""}
                onChange={handleCurrentLeaveInputChange}
                className="border border-gray-300 rounded p-2 w-full"
              />
            </label>
            <label className="block mb-2">
              Casual Leave:
              <input
                type="number"
                name="casualleavecount"
                value={currentLeaveData?.casualleavecount || ""}
                onChange={handleCurrentLeaveInputChange}
                className="border border-gray-300 rounded p-2 w-full"
              />
            </label>
            <label className="block mb-2">
              Medical Leave:
              <input
                type="number"
                name="medicalleavecount"
                value={currentLeaveData?.medicalleavecount || ""}
                onChange={handleCurrentLeaveInputChange}
                className="border border-gray-300 rounded p-2 w-full"
              />
            </label>
            <label className="block mb-2">
              Special Leave:
              <input
                type="number"
                name="specialleavecount"
                value={currentLeaveData?.specialleavecount || ""}
                onChange={handleCurrentLeaveInputChange}
                className="border border-gray-300 rounded p-2 w-full"
              />
            </label>
            <label className="block mb-2">
              No Pay Leave:
              <input
                type="number"
                name="noPayLeaveCount"
                value={currentLeaveData?.noPayLeaveCount || ""}
                onChange={handleCurrentLeaveInputChange}
                className="border border-gray-300 rounded p-2 w-full"
              />
            </label>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={handleCurrentLeaveSave}
                className="bg-primary_purple text-white rounded px-4 py-2"
              >
                Save
              </button>
              <button
                onClick={() => setIsCurrentLeavePopupOpen(false)}
                className="bg-gray-500 text-white rounded px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isActualLeavePopupOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75">
          <div className="bg-white p-4 rounded-lg w-96">
            <h2 className="text-xl mb-4">Edit Actual Leave</h2>
            <label className="block mb-2">
              Annual Leave:
              <input
                type="number"
                name="actualAnualLeaveCount"
                value={actualLeaveData?.actualAnualLeaveCount || ""}
                onChange={handleActualLeaveInputChange}
                className="border border-gray-300 rounded p-2 w-full"
              />
            </label>
            <label className="block mb-2">
              Casual Leave:
              <input
                type="number"
                name="actualCasualLeaveCount"
                value={actualLeaveData?.actualCasualLeaveCount || ""}
                onChange={handleActualLeaveInputChange}
                className="border border-gray-300 rounded p-2 w-full"
              />
            </label>
            <label className="block mb-2">
              Medical Leave:
              <input
                type="number"
                name="actualMedicalLeaveCount"
                value={actualLeaveData?.actualMedicalLeaveCount || ""}
                onChange={handleActualLeaveInputChange}
                className="border border-gray-300 rounded p-2 w-full"
              />
            </label>
            <label className="block mb-2">
              Special Leave:
              <input
                type="number"
                name="actualSpecialLeaveCount"
                value={actualLeaveData?.actualSpecialLeaveCount || ""}
                onChange={handleActualLeaveInputChange}
                className="border border-gray-300 rounded p-2 w-full"
              />
            </label>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={handleActualLeaveSave}
                className="bg-primary_purple text-white rounded px-4 py-2"
              >
                Save
              </button>
              <button
                onClick={() => setIsActualLeavePopupOpen(false)}
                className="bg-gray-500 text-white rounded px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveDataTable;
