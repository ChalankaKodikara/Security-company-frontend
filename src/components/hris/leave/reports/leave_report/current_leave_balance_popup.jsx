/** @format */

import React, { useState, useEffect } from "react";
import { PiSealWarningLight } from "react-icons/pi";
import { TbBeach } from "react-icons/tb";
import { CiClock2 } from "react-icons/ci";
import Cookies from "js-cookie";

const Current_leave_balance_popup = ({
  togglePopup,
  employeeNo,
  employeeName,
  departmentName,
}) => {
  const [leaveCounts, setLeaveCounts] = useState(null);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  useEffect(() => {
    const fetchLeaveCounts = async () => {
      const token = Cookies.get("accessToken");
      try {
        const response = await fetch(
          `${API_URL}/v1/hris/leave/GetLeaveCountstoallemployee?employee_no=${employeeNo}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        console.log("Fetched Leave Counts:", data); // Log to check the fetched data
        setLeaveCounts(data);
      } catch (error) {
        console.error("Error fetching leave counts:", error);
      }
    };

    if (employeeNo) {
      fetchLeaveCounts();
    }
  }, [employeeNo]);

  const currentLeave = leaveCounts?.current_leave_counts || {};
  const actualLeave = leaveCounts?.actual_leave_counts || {};

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-gray-800 bg-opacity-50 z-50">
      <div className="bg-white p-8 rounded-lg w-[80%]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">
            Leaves Taken: Category Wise
          </h2>
          <button
            onClick={togglePopup}
            className="text-gray-500 hover:text-gray-700 transition duration-300"
          >
            Close
          </button>
        </div>
        <form>
          <div className="flex gap-6 items-center justify-center">
            <div className="flex gap-20 items-center">
              <label className="block text-sm font-medium text-gray-700">
                Employee ID:
              </label>
              <input
                type="text"
                value={employeeNo || ""}
                readOnly
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-purple-500"
              />
            </div>
            <div className="flex gap-20 items-center">
              <label className="block text-sm font-medium text-gray-700">
                Employee Name:
              </label>
              <input
                type="text"
                value={employeeName || ""}
                readOnly
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-purple-500"
              />
            </div>
            <div className="flex gap-20 items-center">
              <label className="block text-sm font-medium text-gray-700">
                Department:
              </label>
              <input
                type="text"
                value={departmentName || ""}
                readOnly
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Leave Counts */}
          <div className="mt-10 flex justify-center">
            <div className="grid grid-cols-5 grid-flow-rows gap-[80px] ml-[75px]">
              {/* Annual Leave Count */}
              <div className="border border-black p-2 rounded-xl w-[200px]">
                <div className="flex justify-between items-center mt-5">
                  <div>
                    <PiSealWarningLight className="w-5 h-5" />
                  </div>
                  <div className="">
                    <p className="font-semibold text-green-400">
                      Remaining Count
                    </p>
                  </div>
                </div>
                <p className="mt-5 font-semibold">Annual Leave Count</p>
                <div className="flex">
                  <p className="text-[30px] font-semibold text-red-600">
                    {currentLeave.anualleavecount || 0}
                  </p>
                  <p className="text-[30px] font-semibold">
                    /{actualLeave.anualleavecount || 0}
                  </p>
                </div>
              </div>

              {/* Casual Leave Count */}
              <div className="border border-black p-2 rounded-xl w-[200px]">
                <div className="flex justify-between items-center mt-5">
                  <div>
                    <TbBeach className="w-5 h-5" />
                  </div>
                  <div className="">
                    <p className="font-semibold text-green-400">
                      Remaining Count
                    </p>
                  </div>
                </div>
                <p className="mt-5 font-semibold">Casual Leave Count</p>
                <div className="flex">
                  <p className="text-[30px] font-semibold text-red-600">
                    {currentLeave.casualleavecount || 0}
                  </p>
                  <p className="text-[30px] font-semibold">
                    /{actualLeave.casualleavecount || 0}
                  </p>
                </div>
              </div>

              {/* Medical Leave Count */}
              <div className="border border-black p-2 rounded-xl w-[200px]">
                <div className="flex justify-between items-center mt-5">
                  <div>
                    <CiClock2 className="w-5 h-5" />
                  </div>
                  <div className="">
                    <p className="font-semibold text-green-400">
                      Remaining Count
                    </p>
                  </div>
                </div>
                <p className="mt-5 font-semibold">Medical Leave Count</p>
                <div className="flex">
                  <p className="text-[30px] font-semibold text-red-600">
                    {currentLeave.medicalleavecount || 0}
                  </p>
                  <p className="text-[30px] font-semibold">
                    /{actualLeave.medicalleavecount || 0}
                  </p>
                </div>
              </div>

              {/* Special Leave Count */}
              <div className="border border-black p-2 rounded-xl w-[200px]">
                <div className="flex justify-between items-center mt-5">
                  <div>
                    <CiClock2 className="w-5 h-5" />
                  </div>
                  <div className="">
                    <p className="font-semibold text-green-400">
                      Remaining Count
                    </p>
                  </div>
                </div>
                <p className="mt-5 font-semibold">Special Leave Count</p>
                <div className="flex">
                  <p className="text-[30px] font-semibold text-red-600">
                    {currentLeave.specialleavecount || 0}
                  </p>
                  <p className="text-[30px] font-semibold">
                    /{actualLeave.specialleavecount || 0}
                  </p>
                </div>
              </div>

              {/* No Pay Leave Count */}
              <div className="border border-black p-2 rounded-xl w-[200px]">
                <div className="flex justify-between items-center mt-5">
                  <div>
                    <CiClock2 className="w-5 h-5" />
                  </div>
                  <div className="">
                    <p className="font-semibold text-green-400">
                      Remaining Count
                    </p>
                  </div>
                </div>
                <p className="mt-5 font-semibold">No Pay Leave Count</p>
                <div className="flex">
                  <p className="text-[30px] font-semibold text-red-600">
                    {currentLeave.nopayleavecount || 0}
                  </p>
                  <p className="text-[30px] font-semibold">
                    /{actualLeave.nopayleavecount || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Current_leave_balance_popup;
