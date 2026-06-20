/** @format */

import React, { useState, useEffect } from "react";
import { MdKeyboardArrowDown } from "react-icons/md";
import moment from "moment";
import { RiMenu5Fill } from "react-icons/ri";
import { SlRefresh } from "react-icons/sl";
import { FaBagShopping } from "react-icons/fa6";
import { PiOfficeChairLight, PiSealWarningLight } from "react-icons/pi";
import { CiAlarmOn } from "react-icons/ci";
import { TbBeach } from "react-icons/tb";
import Navbar from "../../navbar/navbar.jsx";
import Detailsofleaves from "../details_of_leaves.jsx";
import PieChartComponent from "./chart.jsx";
import BarChartComponent from "./bar_chart.jsx";
import Cookies from "js-cookie";

const Leave = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [leaveData, setLeaveData] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const currentDate = moment().format("MMMM Do YYYY");
  const [currentTime, setCurrentTime] = useState(moment().format("h:mm:ss a"));
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const token = Cookies.get("accessToken");
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment().format("h:mm:ss a"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${API_URL}/v1/hris/designations/getdesignation`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();

        // Filter unique departments
        const uniqueDepartments = Array.from(
          new Set(data.map((item) => item.department))
        ).map((dept) => data.find((item) => item.department === dept));

        setLeaveData(uniqueDepartments);
        setSelectedDepartment(uniqueDepartments[0]); // Set data for the first department by default
      } catch (error) {
        console.error("Error fetching leave data:", error);
      }
    };
    fetchData();
  }, []);

  if (!selectedDepartment) {
    return <div>Loading...</div>;
  }

  // Transform the data for the PieChart and BarChart
  const pieChartData = [
    {
      name: "Special Leave",
      value: selectedDepartment.specialLeaveCount,
      fill: "#B0F07A",
    },
    {
      name: "Annual Leave",
      value: selectedDepartment.annualLeaveCount,
      fill: "#A07AF0",
    },
    {
      name: "Medical Leave",
      value: selectedDepartment.medicalLeaveCount,
      fill: "#F2E56F",
    },
    {
      name: "Casual Leave",
      value: selectedDepartment.casualLeaveCount,
      fill: "#FA0BA9",
    },
    {
      name: "No pay Leave",
      value: selectedDepartment.nopayLeaveCount || 0,
      fill: "#FF8A00",
    },
  ];

  // Data format for BarChart
  const barChartData = [
    { name: "Annual Leave", count: selectedDepartment.annualLeaveCount },
    { name: "Casual Leave", count: selectedDepartment.casualLeaveCount },
    { name: "Medical Leave", count: selectedDepartment.medicalLeaveCount },
    { name: "Special Leave", count: selectedDepartment.specialLeaveCount },
    { name: "No pay Leave", count: selectedDepartment.nopayLeaveCount || 0 },
  ];

  return (
    <div className="mx-10 mt-5">
      {/* top layer */}
      <Navbar />

      {/* second layer */}
      <div className="flex justify-between  items-center mt-6">
        <div>
          <p className="text-[30px] font-semibold">Dashboard - Leave</p>
        </div>
        <div className="flex gap-6 items-center">
          <div>
            <div className="text-[#3D0B5E] text-[20px] font-bold">
              {currentDate}
            </div>
          </div>
          <div className="text-[20px] font-bold">{currentTime}</div>
        </div>
      </div>

      {/* button with dropdown */}
      <div className="flex gap-5 items-center mt-8">
        <div className="relative">
          <button
            className="p-3 border border-black rounded-[12px]"
            onClick={toggleDropdown}
          >
            <div className="flex gap-3 items-center">
              <div>{selectedDepartment.department || "Select Department"}</div>
              <MdKeyboardArrowDown />
            </div>
          </button>
          {isDropdownOpen && (
            <div className="absolute mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg">
              <ul>
                {leaveData.map((department) => (
                  <li
                    key={department.id}
                    className="p-2 hover:bg-gray-200 cursor-pointer"
                    onClick={() => {
                      setSelectedDepartment(department);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {department.department}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div>
          <SlRefresh />
        </div>
      </div>

      {/* card layer */}
      <div className="mt-10">
        <div className="grid grid-cols-5 grid-flow-rows gap-5">
          {/* card 1 */}
          <div className="border border-black p-3 rounded-xl">
            <div className="flex justify-between items-center mt-5">
              <div>
                <FaBagShopping className="text-purple-600" />
              </div>

              <div>
                <p className="font-semibold text-green-400">Per Annum</p>
              </div>
            </div>
            <p className="mt-5 font-semibold">Total Annual Leave Count</p>
            <p className="text-[30px] font-semibold">
              {selectedDepartment.annualLeaveCount}
            </p>
          </div>
          {/* card 2 */}
          <div className="border border-black p-3 rounded-xl">
            <div className="flex justify-between items-center mt-5">
              <div>
                <PiOfficeChairLight className="text-purple-600" />
              </div>

              <div>
                <p className="font-semibold text-green-400">Per Annum</p>
              </div>
            </div>
            <p className="mt-5 font-semibold">Total Casual Leave Count</p>
            <p className="text-[30px] font-semibold">
              {selectedDepartment.casualLeaveCount}
            </p>
          </div>
          {/* card 3 */}
          <div className="border border-black p-3 rounded-xl">
            <div className="flex justify-between items-center mt-5">
              <div>
                <PiSealWarningLight className="text-purple-600" />
              </div>

              <div className="">
                <p className="font-semibold text-green-400">Per Annum</p>
              </div>
            </div>
            <p className="mt-5 font-semibold">Total Medical Leave Count</p>
            <p className="text-[30px] font-semibold">
              {selectedDepartment.medicalLeaveCount}
            </p>
          </div>
          {/* card 4 */}
          <div className="border border-black p-3 rounded-xl">
            <div className="flex justify-between items-center mt-5">
              <div>
                <CiAlarmOn className="text-purple-600" />
              </div>

              <div className="">
                <p className="font-semibold text-green-400">Per Annum</p>
              </div>
            </div>
            <p className="mt-5 font-semibold">Total Special Leave Count</p>
            <p className="text-[30px] font-semibold">
              {selectedDepartment.specialLeaveCount}
            </p>
          </div>

          {/* card 5 */}
          <div className="border border-black p-3 rounded-xl">
            <div className="flex justify-between items-center mt-5">
              <div>
                <TbBeach className="text-purple-600" />
              </div>

              <div className="">
                <p className="font-semibold text-green-400">Per Annum</p>
              </div>
            </div>
            <p className="mt-5 font-semibold">Total No pay Leave Count</p>
            <p className="text-[30px] font-semibold">
              {selectedDepartment.nopayLeaveCount}
            </p>
          </div>
        </div>
      </div>

      {/* lower layer */}
      <div className="flex gap-3 items-center w-full">
        {/* section1 */}
        <div className="flex-auto">
          <Detailsofleaves />
        </div>

        {/* section2 */}
        <div className="flex-auto">
          <PieChartComponent data={pieChartData} />
        </div>

        <div className="flex-auto mt-8">
          <BarChartComponent data={barChartData} />
        </div>
      </div>
    </div>
  );
};

export default Leave;
