/** @format */

import React, { useState } from "react";
import Cookies from "js-cookie";
import { apiFetch } from "../../../utils/apiFetch";

const AddLeaveQuotaForm = ({ onSuccess }) => {
  const [employeeId, setEmployeeId] = useState("");
  const [annualLeaveCount, setAnnualLeaveCount] = useState("");
  const [casualLeaveCount, setCasualLeaveCount] = useState("");
  const [medicalLeaveCount, setMedicalLeaveCount] = useState("");
  const [specialLeaveCount, setSpecialLeaveCount] = useState("");
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const handleSubmit = async (e) => {
    e.preventDefault();

    const leaveQuotaData = {
      employee_no: employeeId,
      annualLeaveCount: parseFloat(annualLeaveCount),
      casualLeaveCount: parseFloat(casualLeaveCount),
      medicalLeaveCount: parseFloat(medicalLeaveCount),
      specialLeaveCount: parseFloat(specialLeaveCount),
    };

    try {
      const token = Cookies.get("accessToken"); // Get the token from cookies
      const response = await apiFetch(
        `${API_URL}/v1/hris/leave/addEmployeeLeaveCount`,
        {
          method: "POST",
          
          body: JSON.stringify(leaveQuotaData),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Leave quota added successfully:", data);
        onSuccess(); // Call the onSuccess prop to close the form and refresh the data
      } else {
        console.error(
          "Failed to add leave quota:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error adding leave quota:", error);
    }
  };

  return (
    <div className="flex justify-center items-center  bg-gray-100">
      <div className="bg-white p-8 rounded-lg w-full max-w-3xl">
        <h2 className="text-2xl font-semibold mb-6">Add Leave Quota</h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Employee ID
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Annual Leave Quota
              </label>
              <input
                type="number"
                value={annualLeaveCount}
                onChange={(e) => setAnnualLeaveCount(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Casual Leave Quota
              </label>
              <input
                type="number"
                value={casualLeaveCount}
                onChange={(e) => setCasualLeaveCount(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Medical Leave Quota
              </label>
              <input
                type="number"
                value={medicalLeaveCount}
                onChange={(e) => setMedicalLeaveCount(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Special Leave Quota
              </label>
              <input
                type="number"
                value={specialLeaveCount}
                onChange={(e) => setSpecialLeaveCount(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <button
              type="submit"
              className="px-4 py-2 bg-purple-500 text-white rounded-md shadow-sm hover:bg-purple-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLeaveQuotaForm;
