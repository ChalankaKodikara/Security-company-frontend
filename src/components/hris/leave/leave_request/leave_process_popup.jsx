/** @format */

import React, { useState, useEffect } from "react";
import { FaBagShopping } from "react-icons/fa6";
import { PiSealWarningLight } from "react-icons/pi";
import { TbBeach } from "react-icons/tb";
import { CiClock2 } from "react-icons/ci";
import Cookies from "js-cookie";
import { apiFetch } from "../../../../utils/apiClient"
const Leave_process_popup = ({ togglePopup, employeeNo }) => {
  const [leaveCounts, setLeaveCounts] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(true);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const token = Cookies.get("accessToken");

  useEffect(() => {
    const fetchLeaveCounts = async () => {
      try {
        const response = await apiFetch(
          `${API_URL}/v1/hris/leave/getLeaveCounts?employee_no=${employeeNo}`,
        );
        const data = await response.json();
        setLeaveCounts(data);
      } catch (error) {
        console.error("Error fetching leave counts:", error);
      }
    };

    if (employeeNo) {
      fetchLeaveCounts();
    }
  }, [employeeNo]);

  const currentLeave = leaveCounts?.currentLeave || {};
  const actualLeave = leaveCounts?.actualLeave || {};

  const toggleForm = () => {
    setIsFormOpen(!isFormOpen);
  };

  if (!isFormOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-gray-800 bg-opacity-50 z-50">
      <div className="bg-white p-8 rounded-lg w-[80%]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">
            Leaves Taken : Category Wise
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
                value={employeeNo}
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
                value={actualLeave?.designation || ""}
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
                value={actualLeave?.department || ""}
                readOnly
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="mt-10 flex justify-center">
            <div className="grid grid-cols-5 grid-flow-rows gap-[250px] ml-[75px]">
              <div className="border border-black p-3 rounded-xl w-[300px]">
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
              {/* card 4 */}
              <div className="border border-black p-3 rounded-xl w-[300px]">
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
                <p className="mt-5 font-semibold">Sick Leave Count</p>
                <div className="flex">
                  <p className="text-[30px] font-semibold text-red-600">
                    {currentLeave.medicalleavecount || 0}
                  </p>
                  <p className="text-[30px] font-semibold">
                    /{actualLeave.medicalleavecount || 0}
                  </p>
                </div>
              </div>
              {/* card 5 */}
              <div className="border border-black p-3 rounded-xl w-[300px]">
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
                <p className="mt-5 font-semibold">Total Casual Leave Count</p>
                <div className="flex">
                  <p className="text-[30px] font-semibold text-red-600">
                    {currentLeave.casualleavecount || 0}
                  </p>
                  <p className="text-[30px] font-semibold">
                    /{actualLeave.casualleavecount || 0}
                  </p>
                </div>
              </div>
              <div className="border border-black p-3 rounded-xl w-[300px]">
                <div className="flex justify-between items-center mt-5">
                  <div>
                    <FaBagShopping className="w-5 h-5" />
                  </div>
                  <div className="">
                    <p className="font-semibold text-green-400">
                      Remaining Count
                    </p>
                  </div>
                </div>
                <p className="mt-5 font-semibold">Nopay Leave Count</p>
                <div className="flex">
                  <p className="text-[30px] font-semibold text-red-600">
                    {currentLeave.noPayLeaveCount || 0}
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

export default Leave_process_popup;
