/** @format */

import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiEdit3, FiX, FiPlus, FiTrash2, FiCheck, FiSearch, FiCalendar, FiClock, FiUsers } from "react-icons/fi";
import usePermissions from "../../permissions/permission";
import Cookies from "js-cookie";

const AssignRooster = () => {
  const [showModal, setShowModal] = useState(false);
  const [showAssignRosterModal, setShowAssignRosterModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    date: "",
    name_of_work: "",
    reason: "",
    start_time: "",
    end_time: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [employeeData, setEmployeeData] = useState([]);
  const [filteredEmployeeData, setFilteredEmployeeData] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [assignRosterForms, setAssignRosterForms] = useState([
    { startDate: "", endDate: "", timetableID: "" },
  ]);
  const [timetables, setTimetables] = useState([]);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Roster schedules assigned successfully");
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const token = Cookies.get("accessToken");

  useEffect(() => {
    const fetchTimetableData = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/v1/hris/timetable/gettimetable`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setTimetables(response.data);
      } catch (error) {
        console.error("Error fetching timetable data:", error);
      }
    };
    const fetchEmployeeData = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/v1/hris/employees/getemployeebasicdetails`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setEmployeeData(response.data);
        setFilteredEmployeeData(response.data);
      } catch (error) {
        console.error("Error fetching employee data:", error);
      }
    };

    fetchTimetableData();
    fetchEmployeeData();
  }, []);

  const openModal = () => setShowModal(true);
  const { hasPermission } = usePermissions();

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      date: "",
      name_of_work: "",
      reason: "",
      start_time: "",
      end_time: "",
    });
    setSelectedEmployees([]);
  };

  const openAssignRosterModal = (employee) => {
    setSelectedEmployee(employee);
    setShowAssignRosterModal(true);
  };

  const closeAssignRosterModal = () => {
    setShowAssignRosterModal(false);
    setAssignRosterForms([{ startDate: "", endDate: "", timetableID: "" }]);
    setSelectedEmployee(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSelectEmployee = (employee) => {
    setSelectedEmployees((prevSelected) => {
      const isSelected = prevSelected.some(
        (e) => e.employee_no === employee.employee_no
      );
      return isSelected
        ? prevSelected.filter((e) => e.employee_no !== employee.employee_no)
        : [...prevSelected, employee];
    });
  };

  const handleSubmit = () => {
    console.log("Form submitted", formData, selectedEmployees);
    closeModal();
  };

  const [rosterData, setRosterData] = useState([]);

  useEffect(() => {
    const fetchEmployeeRosterData = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/v1/hris/timetable/getemployeeswithroster`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("Employee roster data:", response.data);
        if (response.data && response.data.employeesWithRosters) {
          const employees = Array.isArray(response.data.employeesWithRosters)
            ? response.data.employeesWithRosters
            : [response.data.employeesWithRosters];

          setEmployeeData(employees);
          setFilteredEmployeeData(employees);
        } else {
          console.error("Unexpected response structure:", response.data);
        }
      } catch (error) {
        console.error("Error fetching employee roster data:", error);
      }
    };

    fetchEmployeeRosterData();
  }, []);

  const handleAddRosterForm = () => {
    setAssignRosterForms([
      ...assignRosterForms,
      { startDate: "", endDate: "", timetableID: "" },
    ]);
  };

  const handleRemoveRosterForm = (index) => {
    const updatedForms = assignRosterForms.filter((_, i) => i !== index);
    setAssignRosterForms(updatedForms);
  };

  const handleRosterFormChange = (index, field, value) => {
    const updatedForms = assignRosterForms.map((form, i) =>
      i === index ? { ...form, [field]: value } : form
    );
    setAssignRosterForms(updatedForms);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredEmployeeData.length / itemsPerPage);

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSearch = (query, type) => {
    setSearchQuery(query);
    if (query) {
      const filteredData = employeeData.filter((employee) =>
        type === "name"
          ? employee.employee_name_initial
              .toLowerCase()
              .includes(query.toLowerCase())
          : employee.employee_no.toString().includes(query)
      );
      setFilteredEmployeeData(filteredData);
    } else {
      setFilteredEmployeeData(employeeData);
    }
  };

  const [nameSearchQuery, setNameSearchQuery] = useState("");
  const [idSearchQuery, setIdSearchQuery] = useState("");

  const handleNameSearch = (query) => {
    setNameSearchQuery(query);
    setIdSearchQuery("");
    if (query) {
      const filteredData = employeeData.filter((employee) =>
        employee.employee_name_initial
          .toLowerCase()
          .includes(query.toLowerCase())
      );
      setFilteredEmployeeData(filteredData);
    } else {
      setFilteredEmployeeData(employeeData);
    }
  };

  const handleIdSearch = (query) => {
    setIdSearchQuery(query);
    setNameSearchQuery("");
    if (query) {
      const filteredData = employeeData.filter((employee) =>
        employee.employee_no.toString().includes(query)
      );
      setFilteredEmployeeData(filteredData);
    } else {
      setFilteredEmployeeData(employeeData);
    }
  };

  const [showViewRosterModal, setShowViewRosterModal] = useState(false);
  const [rosterDetails, setRosterDetails] = useState([]);

  const openViewRosterModal = async (employee) => {
    setSelectedEmployee(employee);
    setShowViewRosterModal(true);
    try {
      const response = await axios.get(
        `${API_URL}/v1/hris/timetable/getemployeerosterdetails`,
        {
          params: { employee_no: employee.employee_no },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Roster details response:", response.data);
      setRosterDetails(response.data.data || []);
    } catch (error) {
      console.error("Error fetching roster details:", error);
      setRosterDetails([]);
    }
  };

  const closeViewRosterModal = () => {
    setShowViewRosterModal(false);
    setRosterDetails([]);
  };

  const handleDeleteRoster = async (scheduleID) => {
    try {
      const response = await axios.delete(
        `${API_URL}/v1/hris/timetable/deleteEmployeeRosterDetails`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { schedule_id: scheduleID },
        }
      );
      if (response.status === 200) {
        setRosterDetails((prevDetails) =>
          prevDetails.filter((roster) => roster.ScheduleID !== scheduleID)
        );
      }
    } catch (error) {
      console.error("Error deleting roster:", error);
    }
  };

  const handleAssignRosterSubmit = async () => {
    try {
      const employeesData = selectedEmployees.map((employee) => ({
        employee_no: employee.employee_no,
        schedules: assignRosterForms.map((form) => ({
          timetable_id: parseInt(form.timetableID, 10),
          week_start_date: form.startDate,
          week_end_date: form.endDate,
        })),
      }));

      const postData = { employees: employeesData };

      const response = await axios.post(
        `${API_URL}/v1/hris/timetable/addrostertimetable`,
        postData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200 && response.data.success) {
        setSuccessMessage(response.data.message || "Roster schedules assigned successfully");
        console.log("Roster assigned successfully:", response.data.message);
        setShowSuccessPopup(true);
      }

      closeAssignRosterModal();
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error assigning roster";
      console.error("Error assigning roster:", errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Roster Management</h1>
              <p className="text-gray-600 flex items-center gap-2">
                <FiUsers className="w-4 h-4" />
                Assign and manage employee work schedules
              </p>
            </div>
            {hasPermission(10052) && (
              <button
                onClick={openModal}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5"
              >
                <FiPlus className="w-5 h-5" />
                Assign Roster
              </button>
            )}
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Search by employee name..."
                value={nameSearchQuery}
                onChange={(e) => handleNameSearch(e.target.value)}
              />
            </div>
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Search by employee ID..."
                value={idSearchQuery}
                onChange={(e) => handleIdSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Employee No
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Employee Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Assigned Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEmployeeData
                  .slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage
                  )
                  .map((employee, index) => (
                    <tr key={index} className="hover:bg-blue-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {employee.employee_no}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {employee.employee_name_initial}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <FiCalendar className="w-4 h-4 text-gray-400" />
                          {new Date(employee.AssignedDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {hasPermission(10053) && (
                          <button
                            className="inline-flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg transition-all duration-200 font-medium"
                            onClick={() => openViewRosterModal(employee)}
                          >
                            <FiEdit3 className="w-4 h-4" />
                            Manage
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 py-6 border-t border-gray-100">
              <button
                onClick={() => handlePageClick(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
                const pageNum = index + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageClick(pageNum)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      pageNum === currentPage
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                        : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageClick(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Popup for Assigning Roster */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Employee Assignment</h2>
              <button
                onClick={closeModal}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto flex-1 p-8">
              {/* Search Section */}
              <div className="mb-6">
                <div className="relative">
                  <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search employee by name"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Available Employees Table */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Employees</h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="overflow-y-auto max-h-64">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Employee ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Employee Name
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                            Select
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredEmployeeData.map((employee) => (
                          <tr
                            key={employee.employee_no}
                            className="hover:bg-blue-50/50 transition-colors"
                          >
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {employee.employee_no}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {employee.employee_name_initial}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <input
                                type="checkbox"
                                onChange={() => handleSelectEmployee(employee)}
                                checked={selectedEmployees.some(
                                  (e) => e.employee_no === employee.employee_no
                                )}
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Selected Employees Section */}
              {selectedEmployees.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FiCheck className="w-5 h-5 text-green-600" />
                    Selected Employees ({selectedEmployees.length})
                  </h3>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="overflow-y-auto max-h-64">
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                              Employee ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                              Employee Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedEmployees.map((employee) => (
                            <tr
                              key={employee.employee_no}
                              className="hover:bg-blue-50/50 transition-colors"
                            >
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                {employee.employee_no}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">
                                {employee.employee_name_initial}
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-sm"
                                  onClick={() => openAssignRosterModal(employee)}
                                >
                                  <FiPlus className="w-4 h-4" />
                                  Assign Roster
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-8 py-6 flex justify-end gap-3 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all font-medium shadow-lg shadow-blue-500/30"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Roster Modal */}
      {showAssignRosterModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">Assign Roster Schedule</h2>
              <button
                onClick={closeAssignRosterModal}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8">
              {/* Employee Info */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-1 block">
                      Employee Name
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedEmployee.employee_name_initial}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-1 block">
                      Employee ID
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedEmployee.employee_no}
                    </p>
                  </div>
                </div>
              </div>

              {/* Roster Forms */}
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
                {assignRosterForms.map((form, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-xl p-6 bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                        <FiCalendar className="w-4 h-4 text-blue-600" />
                        Schedule {index + 1}
                      </h4>
                      {assignRosterForms.length > 1 && (
                        <button
                          onClick={() => handleRemoveRosterForm(index)}
                          className="text-red-600 hover:bg-red-50 rounded-lg p-2 transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          value={form.startDate}
                          onChange={(e) =>
                            handleRosterFormChange(index, "startDate", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          value={form.endDate}
                          onChange={(e) =>
                            handleRosterFormChange(index, "endDate", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FiClock className="w-4 h-4" />
                        Timetable
                      </label>
                      <select
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                        value={form.timetableID}
                        onChange={(e) =>
                          handleRosterFormChange(index, "timetableID", e.target.value)
                        }
                      >
                        <option value="" disabled>
                          Select a timetable
                        </option>
                        {timetables.map((timetable) => (
                          <option
                            key={timetable.TimetableID}
                            value={timetable.TimetableID}
                          >
                            {timetable.TimetableName} ({timetable.StartCheckInTime} -{" "}
                            {timetable.EndCheckOutTime})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Another Roster Button */}
              <button
                onClick={handleAddRosterForm}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-xl transition-all font-medium mb-6"
              >
                <FiPlus className="w-5 h-5" />
                Add Another Roster Period
              </button>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeAssignRosterModal}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignRosterSubmit}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all font-medium shadow-lg shadow-blue-500/30"
                >
                  Assign Roster
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheck className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
            <p className="text-gray-600 mb-6">
              {successMessage}
            </p>
            <button
              onClick={() => setShowSuccessPopup(false)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl transition-all font-medium shadow-lg shadow-blue-500/30"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* View Roster Modal */}
      {showViewRosterModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">Roster Details</h2>
              <button
                onClick={closeViewRosterModal}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8">
              {/* Employee Info */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-1 block">
                      Employee Name
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedEmployee.employee_name_initial}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-1 block">
                      Employee ID
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedEmployee.employee_no}
                    </p>
                  </div>
                </div>
              </div>

              {/* Roster Details */}
              {rosterDetails.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {rosterDetails.map((roster) => (
                    <div
                      key={roster.ScheduleID}
                      className="border border-gray-200 rounded-xl p-6 bg-white hover:shadow-md transition-shadow"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <FiCalendar className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-600">Start Date:</span>
                          <span className="text-sm text-gray-900 font-semibold">
                            {new Date(roster.week_start_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiCalendar className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-600">End Date:</span>
                          <span className="text-sm text-gray-900 font-semibold">
                            {new Date(roster.week_end_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiClock className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-600">Timetable:</span>
                          <span className="text-sm text-gray-900 font-semibold">
                            {roster.TimetableName}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => handleDeleteRoster(roster.ScheduleID)}
                          className="inline-flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg transition-all font-medium"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiCalendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No roster details available</p>
                </div>
              )}

              {/* Close Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeViewRosterModal}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignRooster;