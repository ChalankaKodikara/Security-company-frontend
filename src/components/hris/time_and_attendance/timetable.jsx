/** @format */

import React, { useState, useEffect } from "react";
import TimetablePopup from "./timetablepopup";
import usePermissions from "../../permissions/permission";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { apiFetch } from "../../../utils/apiClient";

function TimetableManagement() {
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [timetableData, setTimetableData] = useState([]);
  const [employeeData, setEmployeeData] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
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
    workingDays: "",
    type: "Roster",
    employees: [],
  });
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [editTimetableId, setEditTimetableId] = useState(null);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const { hasPermission } = usePermissions();

  const fetchTimetables = () => {
    apiFetch(`${API_URL}/v1/hris/timetable/gettimetable`, {})
      .then((response) => response.json())
      .then((data) => {
        setTimetableData(Array.isArray(data) ? data : []);
      })
      .catch((error) => console.error("Error fetching timetable data:", error));
  };
  useEffect(() => {
    fetchTimetables();
  }, []);
  const filteredEmployeeData = employeeData.filter(
    (emp) =>
      (emp.employee_calling_name ?? "")
        .toLowerCase()
        .includes(employeeSearchQuery.toLowerCase()) ||
      (emp.employee_no ?? "")
        .toLowerCase()
        .includes(employeeSearchQuery.toLowerCase()),
  );

  useEffect(() => {
    apiFetch(`${API_URL}/v1/hris/employees/getemployeebasicdetails-timetable`)
      .then((response) => response.json())
      .then((data) => {
        setEmployeeData(Array.isArray(data) ? data : []);
      })
      .catch((error) => console.error("Error fetching employee data:", error));
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const filteredTimetableData = timetableData.filter((item) =>
    (item.TimetableName || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  const currentItems = filteredTimetableData.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSend = () => {
    setShowSuccessPopup(true);
  };

  const handleEdit = (id) => {
    setEditTimetableId(id);
    setShowEditPopup(true);
  };

  const handleCloseSuccessPopup = () => {
    setShowSuccessPopup(false);
  };

  const handleCloseErrorPopup = () => {
    setShowErrorPopup(false);
  };

  const handleCloseEditPopup = () => {
    setShowEditPopup(false);
    setEditTimetableId(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      // Clear saturday time if not 5.5
      if (name === "workingDays" && value !== "5.5") {
        return {
          ...prev,
          workingDays: value,
          saturdayCheckOutTime: "",
        };
      }

      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 🔹 Build payload here
    const payload = {
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
      workingDays: formData.workingDays,
      type: formData.type.toLowerCase(),
      employees: selectedEmployees.map((emp) => emp.employee_no),
    };

    //  Conditionally add Saturday checkout
    if (formData.workingDays === "5.5") {
      payload.saturdayCheckOutTime = formData.saturdayCheckOutTime;
    }

    // 🔹 API call
    apiFetch(`${API_URL}/v1/hris/timetable/addtimetable`, {
      method: "POST",

      body: JSON.stringify(payload),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          toast.success(` ${data.message}`);

          setShowSuccessPopup(false);
          setSelectedEmployees([]);

          setTimeout(() => {
            window.location.reload();
          }, 1200);
        } else {
          throw new Error(data.message || "Failed to create timetable");
        }
      })

      .catch((error) => {
        console.error("Error:", error);
        toast.error(`❌ ${error.message || "Failed to create timetable"}`);
      });
  };

  const handleSelectEmployee = (employee, checked) => {
    if (checked) {
      setSelectedEmployees((prev) => {
        if (!prev.some((e) => e.employee_no === employee.employee_no)) {
          return [...prev, employee];
        }
        return prev;
      });
    } else {
      setSelectedEmployees((prev) =>
        prev.filter((e) => e.employee_no !== employee.employee_no),
      );
    }
  };

  const handleDelete = (id) => {
    setShowDeletePopup(true);
    setDeleteItemId(id);
  };

  const confirmDelete = () => {
    apiFetch(
      `${API_URL}/v1/hris/timetable/deletetimetable?timetableID=${deleteItemId}`,
      {
        method: "DELETE",
      },
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setTimetableData(
          timetableData.filter((item) => item.TimetableID !== deleteItemId),
        );
        setShowDeletePopup(false);
        toast.success("Timetable deleted successfully");
      })
      .catch((error) => {
        console.error("Error:", error);
        setShowDeletePopup(false);
        toast.error("Failed to delete timetable");
      });
  };

  const closeDeletePopup = () => {
    setShowDeletePopup(false);
    setDeleteItemId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6 font-montserrat">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-[25px] text-black">Timetable Management</h1>
                <p className="text-gray-600 mt-1">
                  {filteredTimetableData.length} timetables configured
                </p>
              </div>
            </div>

            {hasPermission(10001) && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all font-semibold"
              >
                <Plus size={20} />
                Create Timetable
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <div className="relative w-full max-w-md">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by Timetable Name..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-6"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Timetable Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Check-In Start
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Check-In End
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Check-Out Start
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Check-Out End
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12">
                      <Clock className="mx-auto text-gray-400 mb-4" size={64} />
                      <p className="text-gray-600 font-semibold text-lg">
                        No timetables found
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        Create your first timetable to get started
                      </p>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((item, idx) => (
                    <motion.tr
                      key={item.TimetableID}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-gray-100 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-gray-800">
                        {item.TimetableName}
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2 text-gray-700">
                          <Clock size={16} className="text-green-500" />
                          {item.StartCheckInTime}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2 text-gray-700">
                          <Clock size={16} className="text-green-500" />
                          {item.EndCheckInTime}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2 text-gray-700">
                          <Clock size={16} className="text-red-500" />
                          {item.StartCheckOutTime}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2 text-gray-700">
                          <Clock size={16} className="text-red-500" />
                          {item.EndCheckOutTime}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {hasPermission(10002) && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEdit(item.TimetableID)}
                              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
                            >
                              <Edit size={18} />
                            </motion.button>
                          )}
                          {hasPermission(1070) && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDelete(item.TimetableID)}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                            >
                              <Trash2 size={18} />
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredTimetableData.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex justify-center items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={20} />
                </motion.button>

                {[
                  ...Array(
                    Math.ceil(filteredTimetableData.length / itemsPerPage),
                  ),
                ].map((_, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => paginate(index + 1)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      currentPage === index + 1
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                        : "bg-white border-2 border-gray-200 hover:border-blue-500"
                    }`}
                  >
                    {index + 1}
                  </motion.button>
                ))}

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => paginate(currentPage + 1)}
                  disabled={
                    currentPage ===
                    Math.ceil(filteredTimetableData.length / itemsPerPage)
                  }
                  className="p-2 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={20} />
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Edit Popup */}
        <AnimatePresence>
          {showEditPopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
              >
                <TimetablePopup
                  timetableId={editTimetableId}
                  onClose={handleCloseEditPopup}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Timetable Popup */}
        <AnimatePresence>
          {showSuccessPopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
                className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-6 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Clock className="text-white" size={28} />
                    <h2 className="text-2xl font-bold text-white">
                      Create Timetable
                    </h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCloseSuccessPopup}
                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
                  >
                    <X className="text-white" size={24} />
                  </motion.button>
                </div>

                {/* Form Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-8">
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

                    {/* Time Fields Grid */}
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
                          <option value="6">
                            Weekdays + Saturday Full Day (6)
                          </option>
                          <option value="7">Total Week (7)</option>
                        </select>
                      </div>
                      {/* Saturday Half Day Checkout */}
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

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Type *
                        </label>
                        <select
                          name="type"
                          value={formData.type}
                          onChange={handleFormChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        >
                          <option value="Roster">Roster</option>
                          <option value="Fixed">Fixed</option>
                        </select>
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
                              value={employeeSearchQuery}
                              onChange={(e) =>
                                setEmployeeSearchQuery(e.target.value)
                              }
                              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl"
                            />
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
                                            checked={selectedEmployees.some(
                                              (e) =>
                                                e.employee_no ===
                                                employee.employee_no,
                                            )}
                                            onChange={(e) =>
                                              handleSelectEmployee(
                                                employee,
                                                e.target.checked,
                                              )
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
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={handleCloseSuccessPopup}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-semibold shadow-lg flex items-center gap-2"
                      >
                        <Check size={20} />
                        Create Timetable
                      </motion.button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation */}
        <AnimatePresence>
          {showDeletePopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="text-red-600" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Confirm Deletion
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete this timetable? This action
                    cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={closeDeletePopup}
                      className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={confirmDelete}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 transition-all font-semibold shadow-lg"
                    >
                      Delete
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Popup */}
        <AnimatePresence>
          {showErrorPopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="text-red-600" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Error
                  </h3>
                  <p className="text-gray-600 mb-6">
                    There was an error processing your request. Please try again
                    later.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCloseErrorPopup}
                    className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                  >
                    Close
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default TimetableManagement;
