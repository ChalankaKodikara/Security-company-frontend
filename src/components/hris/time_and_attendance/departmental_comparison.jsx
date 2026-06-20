/** @format */

import React, { useEffect, useState } from "react";
import moment from "moment";
import DepartmentalComparisonChart from "./departmental_comparison_chart";
import { FiSearch, FiCalendar, FiDownload } from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import usePermissions from "../../permissions/permission";

const Departmental_Comparison = () => {
  const currentDate = moment().format("MMMM Do YYYY");
  const [currentTime, setCurrentTime] = useState(moment().format("h:mm:ss a"));
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [departmentData, setDepartmentData] = useState([]);
  const [departments, setDepartments] = useState([]); // State for department list
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments"); // New state for selected department
  const { hasPermission } = usePermissions();
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment().format("h:mm:ss a"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDepartmentData = async () => {
    if (startDate && endDate) {
      try {
        const response = await fetch(
          `${API_URL}/v1/hris/attendence/getDepartmentalComparisonReport?startDate=${moment(
            startDate
          ).format("YYYY-MM-DD")}&endDate=${moment(endDate).format(
            "YYYY-MM-DD"
          )}`
        );
        const result = await response.json();
        setDepartmentData(result.data || []);
        setDepartments([
          ...new Set(result.data.map((item) => item.department)),
        ]); // Extract unique department names
      } catch (error) {
        console.error("Error fetching department data:", error);
      }
    }
  };

  useEffect(() => {
    fetchDepartmentData();
  }, [startDate, endDate]);

  const handleExportCSV = () => {
    const csv = Papa.unparse(
      departmentData.map((department) => ({
        Department: department.department || "Unknown",
        "Total Employees": department.total_employees,
        "Attendance Rate": department.attendance_rate,
        "Total Overtime": department.total_overtime,
        "Absenteeism Rate": department.absenteeism_rate,
      }))
    );

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "departmental_comparison.csv");
  };

  // Filter department data based on the selected department
  const filteredDepartmentData =
    selectedDepartment === "All Departments"
      ? departmentData
      : departmentData.filter((data) => data.department === selectedDepartment);

  return (
    <div className="mx-10 mt-5">
      {/* second layer */}
      <div className="flex justify-between items-center mt-6">
        <div>
          <p className="text-[30px] font-semibold">
            Departmental Comparison Report
          </p>
        </div>
      </div>
      <div style={{ height: "450px", width: "100%" }} className="mb-8 ml-8">
        <DepartmentalComparisonChart data={filteredDepartmentData} />
      </div>

      <div>
        <div className="max-w-full mx-auto p-6 bg-white">
          <div className="flex justify-between items-center mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by ID, Name, Department..."
                className="pl-10 pr-4 py-2 border rounded-lg w-64"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <div className="flex items-center space-x-4">
              <select
                className="text-black rounded-md shadow-custom px-4 py-2"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)} // Update selected department
              >
                <option>All Departments</option>
                {departments.map((dept, index) => (
                  <option key={index} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <div className="flex items-center space-x-2 border border-black rounded-lg px-4 py-2">
                <FiCalendar className="mr-2" />
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  dateFormat="d MMM, yyyy"
                  placeholderText="Start Date"
                  className="text-sm text-gray-600 focus:outline-none"
                />
                <span className="text-gray-400">-</span>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  dateFormat="d MMM, yyyy"
                  placeholderText="End Date"
                  className="text-sm text-gray-600 focus:outline-none"
                />
              </div>

              <button
                className="text-black flex items-center px-4 py-2 rounded-md shadow-custom"
                onClick={handleExportCSV}
              >
                <FiDownload className="mr-2" />
                Export CSV
              </button>
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Department</th>
                <th className="px-4 py-2 text-left">Total Employees</th>
                <th className="px-4 py-2 text-left">Attendance Rate</th>
                <th className="px-4 py-2 text-left">Absenteeism</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartmentData.map((department, index) => (
                <tr key={index} className="border-b">
                  <td className="px-4 py-2">
                    {department.department || "Unknown"}
                  </td>
                  <td className="px-4 py-2">{department.total_employees}</td>
                  <td className="px-4 py-2">{department.attendance_rate}</td>
                  <td className="px-4 py-2">{department.absenteeism_rate}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between items-center mt-6">
            <span>
              Showing {filteredDepartmentData.length > 0 ? 1 : 0} to{" "}
              {filteredDepartmentData.length} of {filteredDepartmentData.length}{" "}
              Departments
            </span>
            <div className="flex space-x-2">
              <button className="px-3 py-1 border rounded">1</button>
              {/* Add more pagination buttons if necessary */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Departmental_Comparison;
