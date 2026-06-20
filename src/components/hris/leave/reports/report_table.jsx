import React, { useState } from "react";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import Report_popup from "./report_popup";
const Report_table= () => {
  const sampleData = [
    {
      id: 555,
      name: "Shehan",
      department: { name: "Department 01", color: "purple" },
      joiningDate: "15 Aug, 2024",
      annualLeave: 24,
      casualLeave: 12,
      sickLeave: 6,
      shortLeave: 12,
      halfDayLeave: 6,
    },
    {
      id: 510,
      name: "Charith",
      department: { name: "Department 02", color: "blue" },
      joiningDate: "15 Aug, 2024",
      annualLeave: 24,
      casualLeave: 12,
      sickLeave: 6,
      shortLeave: 12,
      halfDayLeave: 6,
    },
    {
      id: 559,
      name: "Karuna",
      department: { name: "Department 04", color: "green" },
      joiningDate: "15 Aug, 2024",
      annualLeave: 24,
      casualLeave: 12,
      sickLeave: 6,
      shortLeave: 12,
      halfDayLeave: 6,
    },
   
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  // Calculate the total number of pages
  const totalPages = Math.ceil(sampleData.length / rowsPerPage);

  // Get the data for the current page
  const currentData = sampleData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Change page
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const [isOpen, setIsOpen] = useState(false);
  const togglePopup = () => {
    setIsOpen(!isOpen);
  }
  

  return (
    <div className="p-4">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
              ID
            </th>
            <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
              Employee Name
            </th>
            <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
              Department
            </th>
            <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
              Date of Leave Applied
            </th>
            <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
              Leave Category
            </th>
            <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
              Leave Requested Date
            </th>
            <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
              Leaves taken under each leave category
            </th>
            <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
              Reason{" "}
            </th>

            <th className="px-6 py-3 text-left text-md font-semibold text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {currentData.map((employee) => (
            <tr key={employee.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {employee.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {employee.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${employee.department.color}-100 text-${employee.department.color}-800`}
                >
                  {employee.department.name}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {employee.joiningDate}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {employee.annualLeave}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold underline cursor-pointer"><button className='text-black border-none' onClick={togglePopup}>Click Here</button></td>

              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {employee.sickLeave}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {employee.shortLeave}
              </td>

              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <FaEdit className="text-blue-500 cursor-pointer inline mr-2" />
                <FaTrashAlt className="text-red-500 cursor-pointer inline" />
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
          {currentPage * rowsPerPage > sampleData.length
            ? sampleData.length
            : currentPage * rowsPerPage}{" "}
          of {sampleData.length} employees
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

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-800 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg ">
            <Report_popup/>
            <button
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
              onClick={togglePopup}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Report_table;
