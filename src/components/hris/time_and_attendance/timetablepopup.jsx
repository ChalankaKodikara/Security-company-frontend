/** @format */
 
import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import { X, Clock, Users, Search, Check, Edit } from "lucide-react";
import { apiFetch } from "../../../utils/apiClient";
 
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
    type: "",
    workingDays: "",
    saturdayCheckOutTime: "",
    employees: [],
  });
 
  const [selectAll, setSelectAll] = useState(false);
  const [employeeData, setEmployeeData] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
 
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
 
  useEffect(() => {
    if (!timetableId) return;
 
    setIsLoading(true);
 
    apiFetch(
      `${API_URL}/v1/hris/timetable/gettimetablebyid?timetableID=${timetableId}`,
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            data?.message ||
              data?.error ||
              "Failed to fetch timetable details.",
          );
        }
        return data;
      })
      .then((data) => {
        setFormData({
          timetableName: data.TimetableName ?? "",
          startCheckInTime: data.StartCheckInTime?.slice(0, 5) ?? "",
          endCheckInTime: data.EndCheckInTime?.slice(0, 5) ?? "",
          gracePeriodStart: data.GracePeriodStart?.slice(0, 5) ?? "",
          gracePeriodEnd: data.GracePeriodEnd?.slice(0, 5) ?? "",
          startShortLeaveTime: data.StartShortLeaveTime?.slice(0, 5) ?? "",
          endShortLeaveTime: data.EndShortLeaveTime?.slice(0, 5) ?? "",
          startHalfDayTime: data.StartHalfDayTime?.slice(0, 5) ?? "",
          endHalfDayTime: data.EndHalfDayTime?.slice(0, 5) ?? "",
          eveningHalfDayStartTime:
            data.EveningHalfDayStartTime?.slice(0, 5) ?? "",
          eveningHalfDayEndTime: data.EveningHalfDayEndTime?.slice(0, 5) ?? "",
          eveningShortLeaveStartTime:
            data.EveningShortLeaveStartTime?.slice(0, 5) ?? "",
          eveningShortLeaveEndTime:
            data.EveningShortLeaveEndTime?.slice(0, 5) ?? "",
          startCheckOutTime: data.StartCheckOutTime?.slice(0, 5) ?? "",
          endCheckOutTime: data.EndCheckOutTime?.slice(0, 5) ?? "",
          type: data.Type ?? "",
          saturdayCheckOutTime: data.SaturdayCheckOutTime?.slice(0, 5) ?? "",
          workingDays: data.WorkingDays ?? "",
          employees: data.employees ?? [],
        });
 
        return apiFetch(
          `${API_URL}/v1/hris/employees/getemployeebasicdetails-timetable`,
        ).then(async (response) => {
          const employees = await response.json();
          if (!response.ok) {
            throw new Error("Failed to fetch employee list.");
          }
 
          const employeeList = Array.isArray(employees) ? employees : [];
          const existingSelected = data.employees ?? [];
 
          setEmployeeData(employeeList);
          setSelectedEmployees(existingSelected);
 
          const selectableEmployees = employeeList.filter(
            (employee) =>
              !(
                employee.timetableAssigned === "yes" &&
                !existingSelected.some(
                  (e) => e.employee_no === employee.employee_no,
                )
              ),
          );
 
          setSelectAll(
            selectableEmployees.length > 0 &&
              existingSelected.length === selectableEmployees.length,
          );
        });
      })
      .catch((error) => {
        console.error("Error fetching timetable data:", error);
        toast.error(error.message || "Failed to load timetable details.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [timetableId, API_URL]);
 
  useEffect(() => {
    if (formData.workingDays !== "5.5" && formData.saturdayCheckOutTime) {
      setFormData((prev) => ({
        ...prev,
        saturdayCheckOutTime: "",
      }));
    }
  }, [formData.workingDays]);
 
  const filteredEmployeeData = employeeData.filter(
    (emp) =>
      (emp.employee_calling_name ?? "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (emp.employee_no ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
  );
 
  useEffect(() => {
    const selectableEmployees = filteredEmployeeData.filter(
      (employee) =>
        !(
          employee.timetableAssigned === "yes" &&
          !formData.employees.some(
            (e) => e.employee_no === employee.employee_no,
          )
        ),
    );
 
    const allSelected =
      selectableEmployees.length > 0 &&
      selectableEmployees.every((employee) =>
        selectedEmployees.some((e) => e.employee_no === employee.employee_no),
      );
 
    setSelectAll(allSelected);
  }, [filteredEmployeeData, selectedEmployees, formData.employees]);
 
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };
 
  const handleSelectEmployee = (employee) => {
    setSelectedEmployees((prevState) => {
      const exists = prevState.some(
        (e) => e.employee_no === employee.employee_no,
      );
 
      if (exists) {
        return prevState.filter((e) => e.employee_no !== employee.employee_no);
      }
 
      return [...prevState, employee];
    });
  };
 
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!formData.timetableName?.trim()) {
      toast.error("Timetable name is required.");
      return;
    }
 
    if (formData.workingDays === "5.5" && !formData.saturdayCheckOutTime) {
      toast.error("Saturday Check-Out Time is required for 5.5 working days.");
      return;
    }
 
    const updatedTimetable = {
      timetableName: formData.timetableName.trim(),
      startCheckInTime: formData.startCheckInTime
        ? `${formData.startCheckInTime}:00`
        : null,
      endCheckInTime: formData.endCheckInTime
        ? `${formData.endCheckInTime}:00`
        : null,
      gracePeriodStart: formData.gracePeriodStart
        ? `${formData.gracePeriodStart}:00`
        : null,
      gracePeriodEnd: formData.gracePeriodEnd
        ? `${formData.gracePeriodEnd}:00`
        : null,
      startShortLeaveTime: formData.startShortLeaveTime
        ? `${formData.startShortLeaveTime}:00`
        : null,
      endShortLeaveTime: formData.endShortLeaveTime
        ? `${formData.endShortLeaveTime}:00`
        : null,
      startHalfDayTime: formData.startHalfDayTime
        ? `${formData.startHalfDayTime}:00`
        : null,
      endHalfDayTime: formData.endHalfDayTime
        ? `${formData.endHalfDayTime}:00`
        : null,
      eveningHalfDayStartTime: formData.eveningHalfDayStartTime
        ? `${formData.eveningHalfDayStartTime}:00`
        : null,
      eveningHalfDayEndTime: formData.eveningHalfDayEndTime
        ? `${formData.eveningHalfDayEndTime}:00`
        : null,
      eveningShortLeaveStartTime: formData.eveningShortLeaveStartTime
        ? `${formData.eveningShortLeaveStartTime}:00`
        : null,
      eveningShortLeaveEndTime: formData.eveningShortLeaveEndTime
        ? `${formData.eveningShortLeaveEndTime}:00`
        : null,
      startCheckOutTime: formData.startCheckOutTime
        ? `${formData.startCheckOutTime}:00`
        : null,
      endCheckOutTime: formData.endCheckOutTime
        ? `${formData.endCheckOutTime}:00`
        : null,
      saturdayCheckOutTime:
        formData.workingDays === "5.5" && formData.saturdayCheckOutTime
          ? `${formData.saturdayCheckOutTime}:00`
          : null,
      type: formData.type || null,
      WorkingDays: formData.workingDays,
      employees: selectedEmployees.map((emp) => ({
        employee_no: emp.employee_no,
      })),
    };
 
    console.log("Submitting timetable payload:", updatedTimetable);
 
    setIsSubmitting(true);
 
    apiFetch(
      `${API_URL}/v1/hris/timetable/updatetimetable?timetableID=${timetableId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedTimetable),
      },
    )
      .then(async (response) => {
        const data = await response.json();
 
        if (!response.ok) {
          throw new Error(
            data?.message || data?.error || "Failed to update timetable.",
          );
        }
 
        return data;
      })
      .then((data) => {
        if (data?.success) {
          toast.success("Timetable updated successfully!");
          setTimeout(() => {
            onClose();
          }, 1500);
        } else {
          throw new Error(
            data?.message || data?.error || "Failed to update timetable.",
          );
        }
      })
      .catch((error) => {
        console.error("Error updating timetable:", error);
        toast.error(error.message || "Failed to update timetable.");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };
 
  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Edit className="text-white" size={28} />
          <h2 className="text-2xl font-bold text-white">
            Edit Timetable #{timetableId}
          </h2>
        </div>
        <motion.button
          whileHover={!isSubmitting ? { scale: 1.1, rotate: 90 } : {}}
          whileTap={!isSubmitting ? { scale: 0.9 } : {}}
          onClick={onClose}
          disabled={isSubmitting}
          className={`p-2 rounded-lg transition-all ${
            isSubmitting
              ? "bg-white/10 cursor-not-allowed opacity-60"
              : "bg-white/20 hover:bg-white/30"
          }`}
        >
          <X className="text-white" size={24} />
        </motion.button>
      </div>
 
      {/* Form Content */}
      <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-8">
        {isLoading ? (
          <div className="py-16 text-center text-gray-500 font-medium">
            Loading timetable details...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Timetable Name */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Timetable Name *
              </label>
              <input
                required
                type="text"
                name="timetableName"
                value={formData.timetableName}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Enter timetable name"
              />
            </div>
 
            {/* Main Time Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Check-In Start *
                </label>
                <input
                  required
                  type="time"
                  name="startCheckInTime"
                  value={formData.startCheckInTime}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Check-In End *
                </label>
                <input
                  required
                  type="time"
                  name="endCheckInTime"
                  value={formData.endCheckInTime}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Check-Out Start *
                </label>
                <input
                  required
                  type="time"
                  name="startCheckOutTime"
                  value={formData.startCheckOutTime}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Check-Out End
                </label>
                <input
                  type="time"
                  name="endCheckOutTime"
                  value={formData.endCheckOutTime}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Working Days *
                </label>
                <select
                  required
                  name="workingDays"
                  value={formData.workingDays}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">-- Select Working Days --</option>
                  <option value="5">Weekdays (5)</option>
                  <option value="5.5">
                    Weekdays + Saturday Half Day (5.5)
                  </option>
                  <option value="6">Weekdays + Saturday Full Day (6)</option>
                  <option value="7">Total Week (7)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">-- Select Type --</option>
                  <option value="fixed">Fixed</option>
                  <option value="roster">Roster</option>
                </select>
              </div>
              {formData.workingDays === "5.5" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Saturday Check-Out Time *
                  </label>
                  <input
                    required
                    type="time"
                    name="saturdayCheckOutTime"
                    value={formData.saturdayCheckOutTime}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              )}
            </div>
 
            {/* Divider */}
            <div className="my-8 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
 
            {/* Additional Time Fields */}
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-blue-500" />
              Additional Time Settings
            </h3>
 
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Grace Period Start
                </label>
                <input
                  type="time"
                  name="gracePeriodStart"
                  value={formData.gracePeriodStart}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Grace Period End
                </label>
                <input
                  type="time"
                  name="gracePeriodEnd"
                  value={formData.gracePeriodEnd}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Short Leave Start
                </label>
                <input
                  type="time"
                  name="startShortLeaveTime"
                  value={formData.startShortLeaveTime}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Short Leave End
                </label>
                <input
                  type="time"
                  name="endShortLeaveTime"
                  value={formData.endShortLeaveTime}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Half Day Start
                </label>
                <input
                  type="time"
                  name="startHalfDayTime"
                  value={formData.startHalfDayTime}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Half Day End
                </label>
                <input
                  type="time"
                  name="endHalfDayTime"
                  value={formData.endHalfDayTime}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Evening Half Day Start
                </label>
                <input
                  type="time"
                  name="eveningHalfDayStartTime"
                  value={formData.eveningHalfDayStartTime}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Evening Half Day End
                </label>
                <input
                  type="time"
                  name="eveningHalfDayEndTime"
                  value={formData.eveningHalfDayEndTime}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Evening Short Leave Start
                </label>
                <input
                  type="time"
                  name="eveningShortLeaveStartTime"
                  value={formData.eveningShortLeaveStartTime}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Evening Short Leave End
                </label>
                <input
                  type="time"
                  name="eveningShortLeaveEndTime"
                  value={formData.eveningShortLeaveEndTime}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
 
            {/* Divider */}
            <div className="my-8 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
 
            {/* Employee Assignment Section */}
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Users size={24} className="text-blue-500" />
                Assign Employees to Timetable
              </h3>
 
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Employee Selection */}
                <div>
                  <div className="relative mb-4">
                    <Search
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder="Search by Employee..."
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      disabled={isLoading || isSubmitting}
                    />
                  </div>
 
                  {/* Select All Checkbox */}
                  <div className="mb-3 px-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSelectAll(checked);
 
                          if (checked) {
                            const selectableEmployees =
                              filteredEmployeeData.filter(
                                (employee) =>
                                  !(
                                    employee.timetableAssigned === "yes" &&
                                    !formData.employees.some(
                                      (e) =>
                                        e.employee_no === employee.employee_no,
                                    )
                                  ),
                              );
 
                            setSelectedEmployees(selectableEmployees);
                          } else {
                            setSelectedEmployees([]);
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-semibold text-gray-700">
                        Select All
                      </span>
                    </label>
                  </div>
 
                  <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                      <p className="font-semibold text-gray-700">
                        Available Employees
                      </p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                              Employee ID
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                              Name
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredEmployeeData.map((employee) => (
                            <tr
                              key={employee.employee_no}
                              className="hover:bg-gray-100 transition-colors"
                            >
                              <td className="px-4 py-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    onChange={() =>
                                      handleSelectEmployee(employee)
                                    }
                                    checked={selectedEmployees.some(
                                      (e) =>
                                        e.employee_no === employee.employee_no,
                                    )}
                                    disabled={
                                      isLoading ||
                                      isSubmitting ||
                                      (employee.timetableAssigned === "yes" &&
                                        !formData.employees.some(
                                          (e) =>
                                            e.employee_no ===
                                            employee.employee_no,
                                        ) &&
                                        !selectedEmployees.some(
                                          (e) =>
                                            e.employee_no ===
                                            employee.employee_no,
                                        ))
                                    }
                                  />
                                  <span className="text-sm text-gray-700">
                                    {employee.employee_no}
                                  </span>
                                </label>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {employee.employee_calling_name}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
 
                {/* Selected Employees */}
                <div>
                  <div className="border-2 border-blue-200 rounded-xl overflow-hidden bg-blue-50/50">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 border-b border-blue-300">
                      <p className="font-semibold text-white flex items-center gap-2">
                        <Check size={18} />
                        Selected Employees ({selectedEmployees.length})
                      </p>
                    </div>
                    <div className="max-h-[22rem] overflow-y-auto bg-white">
                      {selectedEmployees.length === 0 ? (
                        <div className="text-center py-12">
                          <Users
                            className="mx-auto text-gray-400 mb-3"
                            size={48}
                          />
                          <p className="text-gray-500 text-sm">
                            No employees selected yet
                          </p>
                        </div>
                      ) : (
                        <table className="w-full">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                                Employee ID
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                                Name
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {selectedEmployees.map((employee) => (
                              <motion.tr
                                key={employee.employee_no}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="hover:bg-blue-50 transition-colors"
                              >
                                <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                                  {employee.employee_no}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">
                                  {employee.employee_calling_name}
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
 
            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <motion.button
                whileHover={!isSubmitting ? { scale: 1.05 } : {}}
                whileTap={!isSubmitting ? { scale: 0.95 } : {}}
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className={`px-6 py-3 rounded-xl transition-all font-semibold ${
                  isSubmitting
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={!isSubmitting ? { scale: 1.05 } : {}}
                whileTap={!isSubmitting ? { scale: 0.95 } : {}}
                type="submit"
                disabled={isSubmitting || isLoading}
                className={`px-6 py-3 text-white rounded-xl transition-all font-semibold shadow-lg flex items-center gap-2 ${
                  isSubmitting || isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                }`}
              >
                <Check size={20} />
                {isSubmitting ? "Updating..." : "Update Timetable"}
              </motion.button>
            </div>
          </form>
        )}
      </div>
 
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
 
export default TimetablePopup;
 
 