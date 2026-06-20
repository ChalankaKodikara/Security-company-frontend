/** @format */

import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";

function TimetablePopup({ timetableId, onClose }) {
  const [formData, setFormData] = useState({
    timetableName: "",
    startCheckInTime: "",
    endCheckInTime: "",
    gracePeriodStart: "",
    gracePeriodEnd: "",
    startShortLeaveTime: "",
    endShortLeaveTime: "",
    startHalfDayTime: "",
    endHalfDayTime: "",
    eveningHalfDayStartTime: "",
    eveningHalfDayEndTime: "",
    eveningShortLeaveStartTime: "",
    eveningShortLeaveEndTime: "",
    startCheckOutTime: "",
    endCheckOutTime: "",
    workingdays: "",
    employees: [],
  });

  const [employeeData, setEmployeeData] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const token = Cookies.get("accessToken");

  useEffect(() => {
    if (timetableId) {
      fetch(
        `${API_URL}/v1/hris/timetable/gettimetablebyid?timetableID=${timetableId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
        .then((response) => response.json())
        .then((data) => {
          setFormData({
            timetableName: data.TimetableName,
            startCheckInTime: data.StartCheckInTime,
            endCheckInTime: data.EndCheckInTime,
            gracePeriodStart: data.GracePeriodStart,
            gracePeriodEnd: data.GracePeriodEnd,
            startShortLeaveTime: data.StartShortLeaveTime,
            endShortLeaveTime: data.EndShortLeaveTime,
            startHalfDayTime: data.StartHalfDayTime,
            endHalfDayTime: data.EndHalfDayTime,
            eveningHalfDayStartTime: data.EveningHalfDayStartTime,
            eveningHalfDayEndTime: data.EveningHalfDayEndTime,
            eveningShortLeaveStartTime: data.EveningShortLeaveStartTime,
            eveningShortLeaveEndTime: data.EveningShortLeaveEndTime,
            startCheckOutTime: data.StartCheckOutTime,
            endCheckOutTime: data.EndCheckOutTime,
            workingdays: data.Workingdays,
            employees: data.employees || [],
          });

          // Fetch all employee data
          fetch(
            `${process.env.REACT_APP_API_ENDPOINT}/v1/hris/employees/getemployeebasicdetails`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
            .then((response) => response.json())
            .then((employees) => {
              setEmployeeData(Array.isArray(employees) ? employees : []);

              // Filter and set selected employees based on timetable data
              const selected = employees.filter((emp) =>
                data.employees.some((e) => e.employee_no === emp.employee_no)
              );
              setSelectedEmployees(selected);
            })
            .catch((error) =>
              console.error("Error fetching employee data:", error)
            );
        })
        .catch((error) =>
          console.error("Error fetching timetable data:", error)
        );
    }
  }, [timetableId]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSelectEmployee = (employee) => {
    setSelectedEmployees((prevState) =>
      prevState.some((e) => e.employee_no === employee.employee_no)
        ? prevState.filter((e) => e.employee_no !== employee.employee_no)
        : [...prevState, employee]
    );
  };

  const filteredEmployeeData = employeeData.filter((employee) =>
    employee.employee_name_initial
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedTimetable = {
      timetableName: formData.timetableName,
      startCheckInTime: formData.startCheckInTime,
      endCheckInTime: formData.endCheckInTime,
      gracePeriodStart: formData.gracePeriodStart,
      gracePeriodEnd: formData.gracePeriodEnd,
      startShortLeaveTime: formData.startShortLeaveTime,
      endShortLeaveTime: formData.endShortLeaveTime,
      startHalfDayTime: formData.startHalfDayTime,
      endHalfDayTime: formData.endHalfDayTime,
      eveningHalfDayStartTime: formData.eveningHalfDayStartTime,
      eveningHalfDayEndTime: formData.eveningHalfDayEndTime,
      eveningShortLeaveStartTime: formData.eveningShortLeaveStartTime,
      eveningShortLeaveEndTime: formData.eveningShortLeaveEndTime,
      startCheckOutTime: formData.startCheckOutTime,
      endCheckOutTime: formData.endCheckOutTime,
      workingdays: parseInt(formData.workingdays), // Ensure workingdays is an integer
      employees: selectedEmployees.map((emp) => ({
        employee_no: emp.employee_no,
        employee_name_initial: emp.employee_name_initial,
      })),
    };

    fetch(
      `${API_URL}/v1/hris/timetable/updatetimetable?timetableID=${timetableId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedTimetable),
      }
    )
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);
        onClose();
      })
      .catch((error) => console.error("Error updating timetable:", error));
  };

  return (
    <div className="fixed top-0 left-0 h-full flex items-center justify-center bg-black bg-opacity-50 z-50 w-full">
      <div className="bg-white rounded-[30px] relative w-[75%] h-[90%]">
        <button
          className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 mt-3 mr-3 rounded-[20px]"
          onClick={onClose}
        >
          X
        </button>
        <div className="overflow-y-auto h-[90%] w-[98%] ml-5 mr-5 mt-10">
          <div className="mr-10 mb-10">
            <h2 className="text-2xl font-bold mb-10">
              Edit Timetable {timetableId}
            </h2>
            <div className="ml-10">
              <form onSubmit={handleSubmit}>
                <div>
                  <label className="block text-[#344054] font-bold">
                    Name
                  </label>
                  <input
                    type="text"
                    name="timetableName"
                    value={formData.timetableName}
                    onChange={handleFormChange}
                    className="border rounded-[20px] w-full py-2 px-3"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-[#344054] font-bold">
                      Check-In Start Time*
                    </label>
                    <input
                      type="time"
                      name="startCheckInTime"
                      value={formData.startCheckInTime}
                      onChange={handleFormChange}
                      className="border rounded-[20px] w-full py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-[#344054] font-bold">
                      Check-In End Time*
                    </label>
                    <input
                      type="time"
                      name="endCheckInTime"
                      value={formData.endCheckInTime}
                      onChange={handleFormChange}
                      className="border rounded-[20px] w-full py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-[#344054] font-bold">
                      Check-Out Start Time*
                    </label>
                    <input
                      type="time"
                      name="startCheckOutTime"
                      value={formData.startCheckOutTime}
                      onChange={handleFormChange}
                      className="border rounded-[20px] w-full py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-[#344054] font-bold">
                      Check-Out End Time*
                    </label>
                    <input
                      type="time"
                      name="endCheckOutTime"
                      value={formData.endCheckOutTime}
                      onChange={handleFormChange}
                      className="border rounded-[20px] w-full py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-[#344054] font-bold">
                      Required Working Days*
                    </label>
                    <input
                      type="number"
                      name="workingdays"
                      value={formData.workingdays}
                      onChange={handleFormChange}
                      className="border rounded-[20px] w-full py-2 px-3"
                    />
                  </div>
                </div>
                <hr className="line border-t-1 border-[#344054] rounded-lg w-[100%] mt-10 mb-10"></hr>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-[#344054] font-bold">
                      Grace Period Start Time*
                    </label>
                    <input
                      type="time"
                      name="gracePeriodStart"
                      value={formData.gracePeriodStart}
                      onChange={handleFormChange}
                      className="border rounded-[20px] w-full py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-[#344054] font-bold">
                      Grace Period End Time*
                    </label>
                    <input
                      type="time"
                      name="gracePeriodEnd"
                      value={formData.gracePeriodEnd}
                      onChange={handleFormChange}
                      className="border rounded-[20px] w-full py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-[#344054] font-bold">
                      Short Leave Start Time*
                    </label>
                    <input
                      type="time"
                      name="startShortLeaveTime"
                      value={formData.startShortLeaveTime}
                      onChange={handleFormChange}
                      className="border rounded-[20px] w-full py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-[#344054] font-bold">
                      Short Leave End Time*
                    </label>
                    <input
                      type="time"
                      name="endShortLeaveTime"
                      value={formData.endShortLeaveTime}
                      onChange={handleFormChange}
                      className="border rounded-[20px] w-full py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-[#344054] font-bold">
                      Half Day Start Time*
                    </label>
                    <input
                      type="time"
                      name="startHalfDayTime"
                      value={formData.startHalfDayTime}
                      onChange={handleFormChange}
                      className="border rounded-[20px] w-full py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-[#344054] font-bold">
                      Half Day End Time*
                    </label>
                    <input
                      type="time"
                      name="endHalfDayTime"
                      value={formData.endHalfDayTime}
                      onChange={handleFormChange}
                      className="border rounded-[20px] w-full py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-[#344054] font-bold">
                      Evening Half Day Start Time*
                    </label>
                    <input
                      type="time"
                      name="eveningHalfDayStartTime"
                      value={formData.eveningHalfDayStartTime}
                      onChange={handleFormChange}
                      className="border rounded-[20px] w-full py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-[#344054] font-bold">
                      Evening Half Day End Time*
                    </label>
                    <input
                      type="time"
                      name="eveningHalfDayEndTime"
                      value={formData.eveningHalfDayEndTime}
                      onChange={handleFormChange}
                      className="border rounded-[20px] w-full py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-[#344054] font-bold">
                      Evening Short Leave Start Time*
                    </label>
                    <input
                      type="time"
                      name="eveningShortLeaveStartTime"
                      value={formData.eveningShortLeaveStartTime}
                      onChange={handleFormChange}
                      className="border rounded-[20px] w-full py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-[#344054] font-bold">
                      Evening Short Leave End Time*
                    </label>
                    <input
                      type="time"
                      name="eveningShortLeaveEndTime"
                      value={formData.eveningShortLeaveEndTime}
                      onChange={handleFormChange}
                      className="border rounded-[20px] w-full py-2 px-3"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <h2 className="text-2xl font-bold font-[#071C50]">
                    Assign Employees to Timetable
                  </h2>
                  <div className="">
                    <div className="grid grid-cols-2 gap-4 ">
                      <div className="mt-5">
                        <div className="form relative w-[60%] rounded-xl mb-5">
                          <button className="absolute left-2 -translate-y-1/2 top-1/2 p-1">
                            <svg
                              className="w-5 h-5 text-gray-700"
                              aria-labelledby="search"
                              role="img"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              height="16"
                              width="17"
                            >
                              <path
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                strokeWidth="1.333"
                                stroke="currentColor"
                                d="M7.667 12.667A5.333 5.333 0 107.667 2a5.333 5.333 0 000 10.667zM14.334 14l-2.9-2.9"
                              ></path>
                            </svg>
                          </button>
                          <input
                            type="text"
                            required=""
                            placeholder="Search by Employee"
                            className="input rounded-xl border-none h-10 px-8 py-3  m-2 placeholder-gray-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        <div className="overflow-y-auto max-h-64">
                          <table className="table-auto w-full">
                            <thead>
                              <tr>
                                <th className="px-4 py-2 bg-[#F5F5F5] rounded-l-xl">
                                  Employee ID
                                </th>
                                <th className="px-4 py-2 bg-[#F5F5F5] rounded-r-xl">
                                  First Name
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredEmployeeData.map((employee) => (
                                <tr
                                  key={employee.employee_no}
                                  className="border-b border-black-300"
                                >
                                  <td className="px-4 py-2 flex items-center">
                                    <input
                                      type="checkbox"
                                      className="mr-2"
                                      onChange={() =>
                                        handleSelectEmployee(employee)
                                      }
                                      checked={selectedEmployees.some(
                                        (e) =>
                                          e.employee_no === employee.employee_no
                                      )}
                                    />
                                    {employee.employee_no}
                                  </td>
                                  <td className="px-4 py-2">
                                    {employee.employee_name_initial}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="mt-[10%] h-64 overflow-y-auto">
                        <h3 className="text-xl font-bold text-[#344054] mb-4">
                          Selected Employees
                        </h3>
                        <table className="table-auto w-full">
                          <thead>
                            <tr className="">
                              <th className="px-4 py-2 bg-[#F5F5F5] rounded-l-xl">
                                Employee ID
                              </th>
                              <th className="px-4 py-2 bg-[#F5F5F5] rounded-r-xl">
                                First Name
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedEmployees.map((employee) => (
                              <tr
                                key={employee.employee_no}
                                className="border-b border-black-300"
                              >
                                <td className="px-4 py-2">
                                  {employee.employee_no}
                                </td>
                                <td className="px-4 py-2">
                                  {employee.employee_name_initial}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-4">
                    <div className="flex justify-start mt-10">
                      <button className="bg-gray-500 text-white px-4 py-2 rounded-[22px]">
                        Assign Employees to Timetable
                      </button>
                    </div>
                    <div className="flex justify-end mt-10">
                      <button
                        className="bg-[#797C80] text-white px-4 py-2 rounded-[22px] mr-2"
                        onClick={onClose}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-[#5B6D49] text-white px-4 py-2 rounded-[22px]"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimetablePopup;
