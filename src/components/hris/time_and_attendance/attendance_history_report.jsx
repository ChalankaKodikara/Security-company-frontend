import React, { useState } from "react";
import Navbar from "../navbar/navbar";
import moment from "moment";
import { CiSearch } from "react-icons/ci";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Papa from "papaparse";
import { saveAs } from "file-saver";

const Attendance_History_Report = () => {
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Loader state
  const rowsPerPage = 30;
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  
  const handleFetchData = async () => {
    if (startDate && endDate) {
      setIsLoading(true); // Start loading
      const formattedStartDate = moment(startDate).format("YYYY-MM-DD");
      const formattedEndDate = moment(endDate).format("YYYY-MM-DD");

      try {
        const response = await fetch(
          `${API_URL}/v1/hris/attendence/getAttendanceHistroy?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
        );
        const result = await response.json();

        if (Array.isArray(result.data)) {
          setData(result.data); // If the data is within the result.data field
        } else {
          setData([]);
          console.error(
            "Failed to fetch data: ",
            result.message || "Unknown error"
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setData([]);
      } finally {
        setIsLoading(false); // Stop loading
      }
    } else {
      alert("Please select both start and end dates.");
    }
  };

  const filteredData = data.filter((row) => {
    const matchesSearch = row.employee_id
      ? row.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
      : false;
    return matchesSearch;
  });

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const maxVisiblePages = 5;
  const startPage = Math.max(
    Math.min(
      currentPage - Math.floor(maxVisiblePages / 2),
      totalPages - maxVisiblePages + 1
    ),
    1
  );
  const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleExportCSV = () => {
    const csvData = data.map((row) => ({
      EmployeeID: row.employee_id,
      CheckInTime: row.checkIN_time,
      CheckInType: row.checkIN_type,
      CheckOutTime: row.checkOUT_time,
      CheckOutType: row.checkOUT_type,
      Remark: row.remark,
      GraceTime: row.grace_time,
      Status: row.status,
      TimeTableEnd: row.timeTable_end,
      OT: row.OT,
      Latitude: row.latitude,
      Longitude: row.longitude,
      Address: row.address,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "attendance_history_report.csv");
  };

  return (
    <div className="mx-10 mt-5 overflow-y-auto">
      <div className="mr-[30%]">
        <Navbar />
        <div className="flex justify-between mt-6">
          <div>
            <p className="text-[30px] font-semibold">
              Attendance History Report
            </p>
          </div>
          <div className="text-[20px] font-bold">
            {moment().format("MMMM Do YYYY, h:mm:ss a")}
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center mt-5">
            <div className="relative">
              <input
                className="border border-black rounded-xl p-2 pl-10 w-[325px]"
                placeholder="Search by Employee Number"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <CiSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-500" />
            </div>

            <div className="flex items-center space-x-2 bg-white rounded-[20px] px-4 py-2 shadow-sm border border-black">
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                dateFormat="yyyy-MM-dd"
                className="text-sm text-gray-600 focus:outline-none"
                placeholderText="Start Date"
              />
              <span className="text-gray-400">-</span>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                dateFormat="yyyy-MM-dd"
                className="text-sm text-gray-600 focus:outline-none"
                placeholderText="End Date"
              />
            </div>
            <button
              className="p-3 border border-black rounded-lg"
              onClick={handleFetchData}
            >
              Get Data
            </button>
            <button
              className="p-3 border border-black rounded-lg ml-4"
              onClick={handleExportCSV}
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto mr-[40%] overflow-y-auto">
        {isLoading ? (
          <div className="text-center font-bold py-10">Loading please wait...</div>
        ) : (
          <table className="divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  Check-In Time
                </th>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  Check-In Type
                </th>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  Check-Out Time
                </th>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  Check-Out Type
                </th>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  Remark
                </th>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  Grace Time
                </th>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  Time Table End
                </th>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  OT
                </th>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  Latitude
                </th>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  Longitude
                </th>
                <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
                  Address
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.length > 0 ? (
                paginatedData.map((item, index) => {
                  const globalIndex = (currentPage - 1) * rowsPerPage + index;
                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-md">
                        {item.employee_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-md">
                        {item.checkIN_time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-md">
                        {item.checkIN_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-md">
                        {item.checkOUT_time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-md">
                        {item.checkOUT_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-md">
                        {item.remark}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-md">
                        {item.grace_time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-md">
                        {item.status}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-md">
                        {item.timeTable_end}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-md">
                        {item.OT}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-md">
                        {item.latitude}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-md">
                        {item.longitude}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-md">
                        {item.address}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="13"
                    className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500"
                  >
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-start items-center py-3">
        <div>
          Showing{" "}
          {paginatedData.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}{" "}
          to{" "}
          {currentPage * rowsPerPage > filteredData.length
            ? filteredData.length
            : currentPage * rowsPerPage}{" "}
          of {filteredData.length} records
        </div>
        <div className="flex space-x-2">
          {/* Previous Button */}
          {startPage > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className="px-3 py-1 border rounded-md"
              >
                1
              </button>
              {startPage > 2 && <span className="px-3 py-1">...</span>}
            </>
          )}

          {/* Page Numbers */}
          {Array.from(
            { length: endPage - startPage + 1 },
            (_, i) => i + startPage
          ).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 border rounded-md ${
                currentPage === page ? "bg-gray-300" : "bg-white"
              }`}
            >
              {page}
            </button>
          ))}

          {/* Next Button */}
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <span className="px-3 py-1">...</span>
              )}
              <button
                onClick={() => handlePageChange(totalPages)}
                className="px-3 py-1 border rounded-md"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance_History_Report;
