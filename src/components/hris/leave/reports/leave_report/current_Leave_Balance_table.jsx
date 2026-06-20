/** @format */

import React, { useState, useEffect } from "react";
import { MdKeyboardArrowDown } from "react-icons/md";
import { RiDownloadCloud2Line } from "react-icons/ri";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Current_leave_balance_popup from "../leave_report/current_leave_balance_popup";
import usePermissions from "../../../../permissions/permission";
import Cookies from "js-cookie";

const Current_Leave_Balance_table = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [employeeData, setEmployeeData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState({
    employeeNo: null,
    employeeName: null,
    departmentName: null,
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const { hasPermission } = usePermissions();
  const rowsPerPage = 20;
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  useEffect(() => {
    fetchEmployeeData(); // Fetch employee data when the component mounts
  }, []);

  const fetchEmployeeData = async () => {
    const token = Cookies.get("accessToken");
    try {
      const response = await fetch(
        `${API_URL}/v1/hris/leave/GetLeaveCountstoallemployee`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();

      const mappedData = result.map((employee) => ({
        id: employee.employee_no,
        emp_name: employee.employee_fullname,
        department_name: employee.department,
        remaining_leave: employee.remaining_leave,
      }));

      setEmployeeData(mappedData);
      setFilteredData(mappedData);

      const uniqueDepartments = [
        "All Departments",
        ...new Set(mappedData.map((employee) => employee.department_name)),
      ];
      setDepartments(uniqueDepartments);
    } catch (error) {
      console.error("Error fetching employee data:", error);
    }
  };

  const handleDepartmentSelect = (department) => {
    setSelectedDepartment(department);
    filterByDepartment(department);
    setIsDropdownOpen(false);
  };

  const filterByDepartment = (department) => {
    if (department === "All Departments") {
      setFilteredData(employeeData);
    } else {
      const filtered = employeeData.filter(
        (employee) => employee.department_name === department
      );
      setFilteredData(filtered);
    }
    setCurrentPage(1); // Reset to the first page after filtering
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const togglePopup = (
    employeeNo = null,
    employeeName = null,
    departmentName = null
  ) => {
    setSelectedEmployee({ employeeNo, employeeName, departmentName });
    setIsFormOpen(!isFormOpen);
  };

  const exportToCSV = () => {
    const csvData = filteredData.map((employee) => ({
      ID: employee.id,
      FullName: employee.emp_name,
      Department: employee.department_name,
      remaining_leave: employee.remaining_leave,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "employee_data.csv");
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="p-4">
      <div>
        <div className="flex justify-between items-center mt-10">
          <div>
            <button
              className="p-3 border border-black rounded-[12px]"
              onClick={toggleDropdown}
            >
              <div className="flex gap-3 items-center">
                <div>{selectedDepartment}</div>
                <MdKeyboardArrowDown />
              </div>
            </button>
            {isDropdownOpen && (
              <div className="absolute mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg">
                <ul>
                  {departments.map((department, index) => (
                    <li
                      key={index}
                      className="p-2 hover:bg-gray-200 cursor-pointer"
                      onClick={() => handleDepartmentSelect(department)}
                    >
                      {department}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button
            className="p-3 border border-black rounded-[12px]"
            onClick={exportToCSV}
          >
            <div className="flex gap-3 items-center">
              <div>Export CSV</div>
              <RiDownloadCloud2Line />
            </div>
          </button>

          {/* Date Range Picker */}
          {/* <div className="flex gap-2 items-center">
            <div>
              <label className="block text-gray-700">Start Date</label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                className="border border-black rounded-xl p-2"
              />
            </div>
            <div>
              <label className="block text-gray-700">End Date</label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                className="border border-black rounded-xl p-2"
              />
            </div>
          </div> */}
        </div>
      </div>

      <table className="min-w-full divide-y divide-gray-200 mt-6">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
              Employee ID
            </th>
            <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
              Employee Name
            </th>
            <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
              Department
            </th>
            <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
              Remaining Leaves
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {currentData.map((employee) => (
            <tr key={employee.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-md">
                {employee.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-md">
                {employee.emp_name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-md">
                {employee.department_name}
              </td>

              <td className="flex items-center px-6 py-4 whitespace-nowrap text-sm font-medium ap-10 text-md">
                <button
                  className="text-black border-none"
                  onClick={() =>
                    togglePopup(
                      employee.id,
                      employee.emp_name,
                      employee.department_name
                    )
                  }
                >
                  Click Here
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-between items-center py-3">
        <div>
          Showing{" "}
          {currentData.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to{" "}
          {currentPage * rowsPerPage > filteredData.length
            ? filteredData.length
            : currentPage * rowsPerPage}{" "}
          of {filteredData.length} employees
        </div>
        <div className="flex space-x-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-800 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <Current_leave_balance_popup
              togglePopup={togglePopup}
              employeeNo={selectedEmployee.employeeNo}
              employeeName={selectedEmployee.employeeName}
              departmentName={selectedEmployee.departmentName}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Current_Leave_Balance_table;
