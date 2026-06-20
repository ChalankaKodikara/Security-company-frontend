import React, { useState,useEffect } from "react";
import Navbar from "./../../../navbar/navbar";
import moment from "moment";
import { MdKeyboardArrowDown } from "react-icons/md";
import Hr_report_approve_table from "./hr_report_table";
// import Leave_Details from "../leave_details";
import { FaBagShopping } from "react-icons/fa6";

import { CiSearch } from "react-icons/ci";
import { RiMenu5Fill } from "react-icons/ri";

const HR_Reports = () => {

  const currentDate = moment().format("MMMM Do YYYY");
  const [currentTime, setCurrentTime] = useState(moment().format("h:mm:ss a"));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment().format("h:mm:ss a"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const toggleForm = () => {
    setIsFormOpen(!isFormOpen);
  };
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="mx-10 mt-5 overflow-y-auto ">
      <Navbar />

      <div className="flex justify-between mt-6">
        <p className="text-[30px] font-semibold">HR Report</p>
        <div className="flex gap-6 items-center">
          <div>
            <div className="text-[#3D0B5E] text-[20px] font-bold">{currentDate}</div>
          </div>
          <div className="text-[20px] font-bold">{currentTime}</div>
        </div>
      </div>

      {/* third layer */}
      <div className="mt-5">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center mt-5">
            <div className="relative">
              <input
                className="border border-black rounded-xl p-2 pl-10 w-[325px]"
                placeholder="Search by ID or Department"
              />
              <CiSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-500" />
            </div>
            <div>
              <button className="p-2 border border-black rounded-[12px]">
                <div className="flex gap-3 items-center">
                  Filter <RiMenu5Fill />
                </div>
              </button>
            </div>
          </div>

<div className="flex gap-3">
          <div className="relative">
            <button
              className="p-3 border border-black rounded-[12px]"
              onClick={toggleDropdown}
            >
              <div className="flex  items-center">
                <div>All Department</div>
                <MdKeyboardArrowDown />
              </div>
            </button>
            {isDropdownOpen && (
              <div className="absolute mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg">
                <ul>
                  <li className="p-2 hover:bg-gray-200 cursor-pointer">
                    Department 1
                  </li>
                  <li className="p-2 hover:bg-gray-200 cursor-pointer">
                    Department 2
                  </li>
                  <li className="p-2 hover:bg-gray-200 cursor-pointer">
                    Department 3
                  </li>
                </ul>
              </div>
            )}
          </div>
          <div>
            <input
              type="date"
              className="border border-black rounded-xl p-2 "
            />
          </div>
          </div>
        </div>
      </div>

      <div className="mt-5"></div>

      {/* table */}
      <div>
        <Hr_report_approve_table />
      </div>
    </div>
  );
};

export default HR_Reports;
