/** @format */

import React, { useState, useEffect } from "react";
import moment from "moment";
import { CiCirclePlus } from "react-icons/ci";
import Time_Management_Table from "./time_management_table";
import Create_timetable from "./TimeTable/create_timetable"; // Import the Create_timetable component
import Cookies from "js-cookie";
import { apiFetch } from "../../../utils/apiClient";

const Time_management = () => {
  const currentDate = moment().format("MMMM Do YYYY");
  const [currentTime, setCurrentTime] = useState(moment().format("h:mm:ss a"));
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [timetableData, setTimetableData] = useState([]);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment().format("h:mm:ss a"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  const fetchData = async () => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/hris/timetable/gettimetable`,
       
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const result = await response.json();
      setTimetableData(result);
    } catch (error) {
      console.error("Error fetching timetables:", error);
    }
  };

  useEffect(() => {
    fetchData(); // Fetch timetable data on component mount
  }, []);

  return (
    <div className="mx-10 mt-5 overflow-hidden fixed">
      <div className="mr-[18%]"></div>
      <ContentSection togglePopup={togglePopup} />
      <div className="overflow-x-auto mr-[19%]">
        <Time_Management_Table
          timetableData={timetableData}
          fetchData={fetchData}
        />
      </div>
      {isPopupOpen && (
        <Create_timetable closePopup={togglePopup} fetchData={fetchData} />
      )}
    </div>
  );
};

const Header = ({ currentDate, currentTime }) => (
  <div className="flex justify-between mt-5">
    <p className="text-[30px] font-semibold">Time Management</p>
    <div className="flex gap-6 items-center">
      <div className="text-[#3D0B5E] text-[20px] font-bold">{currentDate}</div>
      <div className="text-[20px] font-bold">{currentTime}</div>
    </div>
  </div>
);

const ContentSection = ({ togglePopup }) => (
  <div className="overflow-y-hidden">
    <div className="mt-5">
      <p className="text-[20px]">
        Time & Attendance{" "}
        <span className="text-primary_purple">Time and Attendance</span>
      </p>
    </div>
    <div className="mt-10">
      <button
        className="text-white bg-[#8764A0] p-2 rounded-lg text-[20px]"
        onClick={togglePopup}
      >
        <div className="flex gap-5 items-center">
          Create Timetable
          <CiCirclePlus />
        </div>
      </button>
    </div>
  </div>
);

export default Time_management;
