/** @format */

import React, { useState, useEffect } from "react";
import { BsFileEarmarkPdf } from "react-icons/bs";
import Cookies from "js-cookie";

const data = [
  // Add your data here
  {
    id: 1,
    employeeName: "John Doe",
    initials: "J.D.",
    callingName: "John",
    nicNo: "123456789V",
    dob: "1990-01-01",
    gender: "Male",
    maritalStatus: "Single",
    contactNumber: "1234567890",
    permanentAddress: "123 Main St",
    temporaryAddress: "456 Secondary St",
  },
  // Add more rows as needed
];

const Hr_report_table = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [issetData, setData] = useState([]);
  const [isSetFilteredData, setFilteredData] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Department");
  const rowsPerPage = 5;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = data.slice(indexOfFirstRow, indexOfLastRow);

  const handleClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = Cookies.get("accessToken");
    try {
      const response = await fetch(`${API_URL}/v1/hris/leave/getleave`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      setData(result); // Assuming result is the array of employees
      setFilteredData(result);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    handleFilter();
  }, [searchInput, selectedDepartment]);

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleFilter = () => {};

  const renderPagination = () => {
    const totalPages = Math.ceil(data.length / rowsPerPage);
    const pageNumbers = [];

    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }

    const handleFilter = () => {
      const newFilteredData = data.filter((employee) => {
        const matchesID = employee.employee_no.toString().includes(searchInput);
        const matchesDepartment =
          selectedDepartment === "All department" ||
          employee.department === selectedDepartment;
        return matchesID && matchesDepartment;
      });
      setFilteredData(newFilteredData);
      setCurrentPage(1); // Reset to the first page after filtering
    };

    const handleDepartmentSelect = (department) => {
      setSelectedDepartment(department);
      handleFilter();
      setIsDropdownOpen(false);
    };
    return (
      <div className="flex justify-center mt-4">
        {pageNumbers.map((number) => (
          <button
            key={number}
            onClick={() => handleClick(number)}
            className={`mx-1 px-3 py-1 rounded ${
              currentPage === number ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            {number}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-200">
          <tr>
            <th className="px-4 py-2 font-normal text-md">ID</th>
            <th className="px-4 py-2 font-normal text-md">Employee Name</th>
            <th className="px-4 py-2 font-normal text-md">
              Name with Initials
            </th>
            <th className="px-4 py-2 font-normal text-md">Calling Name</th>
            <th className="px-4 py-2 font-normal text-md">NIC No.</th>
            <th className="px-4 py-2 font-normal text-md">DoB</th>
            <th className="px-4 py-2 font-normal text-md">Gender</th>
            <th className="px-4 py-2 font-normal text-md">Marital Status</th>
            <th className="px-4 py-2 font-normal text-md">Contact Number</th>
            <th className="px-4 py-2 font-normal text-md">Permanent Address</th>
            <th className="px-4 py-2 font-normal text-md">Temporary Address</th>
            <th className="px-4 py-2 font-normal text-md"></th>
          </tr>
        </thead>
        <tbody>
          {currentRows.map((row, index) => (
            <tr key={index}>
              <td className="px-4 py-2 font-normal text-md">{row.id}</td>
              <td className="px-4 py-2 font-normal text-md">
                {row.employeeName}
              </td>
              <td className="px-4 py-2 font-normal text-md">{row.initials}</td>
              <td className="px-4 py-2 font-normal text-md">
                {row.callingName}
              </td>
              <td className="px-4 py-2 font-normal text-md">{row.nicNo}</td>
              <td className="px-4 py-2 font-normal text-md">{row.dob}</td>
              <td className="px-4 py-2 font-normal text-md">{row.gender}</td>
              <td className="px-4 py-2 font-normal text-md">
                {row.maritalStatus}
              </td>
              <td className="px-4 py-2 font-normal text-md">
                {row.contactNumber}
              </td>
              <td className="px-4 py-2 font-normal text-md">
                {row.permanentAddress}
              </td>
              <td className="px-4 py-2 font-normal text-md">
                {row.temporaryAddress}
              </td>
              <td className="px-4 py-2 font-normal text-md">
                <button className="border border-black rounded-[60px] text-black px-2 flex gap-2 items-center">
                  <BsFileEarmarkPdf className="text-red-800 font-bold" />
                  <div className="text-red-500 font-bold">Export PDF</div>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {renderPagination()}
    </div>
  );
};

export default Hr_report_table;
