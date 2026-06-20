import React, { useState, useEffect } from "react";
import Navbar from "./../../../navbar/navbar";
import { MdKeyboardArrowDown } from "react-icons/md";
import { CiSearch } from "react-icons/ci";
import moment from "moment";
import Current_Leave_Balance_table from "./current_Leave_Balance_table";

const Current_Leave_Balance_report = () => {
  const toggleForm = () => {
    setIsFormOpen(!isFormOpen);
  };
  const [isFormOpen, setIsFormOpen] = useState(false);

  const currentDate = moment().format("MMMM Do YYYY");
  const [currentTime, setCurrentTime] = useState(moment().format("h:mm:ss a"));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment().format("h:mm:ss a"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mx-10 mt-5 overflow-y-auto ">
      <Navbar />

      <div className="mt-6 flex justify-between">
        <div>
          <p className="text-[30px] font-semibold">
            Current Leave Balance Report
          </p>
          <p>
            Leave , Current Leave Balance Report{" "}
            <span className="text-primary_purple">
              Current Leave Balance Report
            </span>
          </p>
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

      {/* <div className="relative mt-8">
        <input
          className="border border-black rounded-xl p-2 pl-10 w-[325px]"
          placeholder="Search by ID or Name"
        />
        <CiSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-500" />
      </div> */}

      {/* <div className="grid grid-cols-3 gap-y-[30px] gap-x-[60px] text-[20px] mt-10">
        <div>
          <label className="block text-gray-700">Employee ID</label>
          <input
            type="text"
            className="w-full border border-gray-300 p-2 rounded mt-2"
            value="<fetched data>"
            readOnly
          />
        </div>
        <div>
          <label className="block text-gray-700">Employee Name</label>
          <input
            type="text"
            className="w-full border border-gray-300 p-2 rounded mt-2"
            value="<fetched data>"
          />
        </div>
        <div>
          <label className="block text-gray-700">Department</label>
          <input
            type="text"
            className="w-full border border-gray-300 p-2 rounded mt-2"
            value="<fetched data>"
          />
        </div>
      </div> */}

      <div className="mt-12 ">
        <div>{<Current_Leave_Balance_table />}</div>
      </div>
    </div>
  );
};

export default Current_Leave_Balance_report;
