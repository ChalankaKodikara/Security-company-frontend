import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Users,
  Clock,
  CalendarDays,
  UserCheck,
  Briefcase,
  CheckCircle2,
  User,
  FileText,
  MessageSquare,
} from "lucide-react";
import { apiFetch } from "../../../utils/apiClient";

const ViewOtAssignments = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const overtimeAssignmentGroupId = params.get("overtime_assignment_group_id");
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [group, setGroup] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeNos, setSelectedEmployeeNos] = useState([]);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const openStatusPopup = (emp) => {
    setSelectedEmployee(emp);
    setIsPopupOpen(true);
  };
  const toggleEmployeeSelection = (employeeNo) => {
    setSelectedEmployeeNos((prev) =>
      prev.includes(employeeNo)
        ? prev.filter((no) => no !== employeeNo)
        : [...prev, employeeNo],
    );
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setSelectedEmployee(null);
  };

  useEffect(() => {
    const fetchDetails = async () => {
      if (!overtimeAssignmentGroupId) return;

      try {
        setLoading(true);

        const res = await apiFetch(
          `${API_URL}/v1/hris/overtime/assignment/group/${overtimeAssignmentGroupId}/details`,
        );

        const result = await res.json();

        if (result.success) {
          setGroup(result.data.group);
          setEmployees(result.data.employees || []);
        }
      } catch (err) {
        console.error("Fetch OT assignment details error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [overtimeAssignmentGroupId, API_URL]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "authorized":
        return "bg-gradient-to-r from-green-500 to-emerald-500 text-white";
      case "pending":
        return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
      case "rejected":
        return "bg-gradient-to-r from-teal-500 to-blue-500 text-white";
      default:
        return "bg-gradient-to-r from-blue-500 to-green-500 text-white";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">
            Loading assignment details...
          </p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 flex items-center justify-center">
        <div className="text-center bg-white/70 backdrop-blur-lg rounded-2xl p-8 shadow-xl">
          <p className="text-gray-600 text-lg">No assignment details found</p>
        </div>
      </div>
    );
  }

  const handleConfirmAuthorization = async () => {
    try {
      setSubmitting(true);

      const payload = {
        employee_nos: selectedEmployeeNos,
        assigned_by_employee_no: group.assigned_by_employee_no,
        ot_date: group.ot_date,
        name_of_work: group.name_of_work,
        planned_start_time: group.planned_start_time,
        planned_end_time: group.planned_end_time,
      };

      const res = await apiFetch(
        `${API_URL}/v1/hris/overtime/assignments/${overtimeAssignmentGroupId}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        },
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Authorization failed");
      }

      //  Success
      setShowConfirmPopup(false);
      setSelectedEmployeeNos([]);

      alert("Overtime authorized successfully");

      // optional: refresh data
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50 p-4 md:p-8">
      <div className=" mx-auto">
        {/* TASK CARD */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 md:p-8 mb-8 hover:shadow-3xl transition-all duration-500 hover:scale-[1.01]">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-green-600 rounded-2xl shadow-lg">
              <Briefcase size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Assignment Details
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            {/* OT Date */}
            <div className="group p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-blue-100/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <CalendarDays size={20} className="text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-600">OT Date</p>
              </div>
              <p className="text-lg font-bold text-gray-800 ml-1">
                {group.ot_date}
              </p>
            </div>

            {/* Time */}
            <div className="group p-4 bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-cyan-100/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-cyan-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Clock size={20} className="text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-600">
                  Planned Time
                </p>
              </div>
              <p className="text-lg font-bold text-gray-800 ml-1">
                {group.planned_start_time} – {group.planned_end_time}
              </p>
            </div>

            {/* Status */}
            <div className="group p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-green-100/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <UserCheck size={20} className="text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-600">Status</p>
              </div>
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-md ${getStatusColor(group.authorization_status)}`}
              >
                <CheckCircle2 size={16} />
                {group.authorization_status}
              </span>
            </div>

            {/* Work */}
            <div className="group p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-teal-100/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-teal-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <FileText size={20} className="text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-600">Work</p>
              </div>
              <p className="text-lg font-bold text-gray-800 ml-1">
                {group.name_of_work}
              </p>
            </div>

            {/* Reason */}
            <div className="group p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-blue-100/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare size={20} className="text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-600">Reason</p>
              </div>
              <p className="text-lg font-bold text-gray-800 ml-1">
                {group.reason}
              </p>
            </div>

            {/* Assigned By */}
            <div className="group p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-cyan-100/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-cyan-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <User size={20} className="text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-600">
                  Assigned By
                </p>
              </div>
              <p className="text-lg font-bold text-gray-800 ml-1">
                {group.assigned_by_name}
              </p>
            </div>
          </div>
        </div>

        {/* EMPLOYEE CARDS */}
        {/* EMPLOYEE CARDS */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-green-600 rounded-2xl shadow-lg">
              <Users size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Assigned Employees
            </h2>

            <span className="ml-auto px-4 py-2 bg-white/70 backdrop-blur-lg rounded-full text-sm font-bold text-blue-600 shadow-md">
              {employees.length}{" "}
              {employees.length === 1 ? "Employee" : "Employees"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 relative">
            {employees.map((emp) => {
              const isSelected = selectedEmployeeNos.includes(emp.employee_no);

              return (
                <div
                  key={emp.overtime_assignment_id}
                  onClick={() => toggleEmployeeSelection(emp.employee_no)}
                  className={`relative cursor-pointer bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border p-6
            transition-all duration-300 hover:-translate-y-2 hover:scale-105
            ${
              isSelected
                ? "border-blue-500 ring-2 ring-blue-400"
                : "border-white/20"
            }`}
                >
                  {/* Checkbox */}
                  <div className="absolute top-3 right-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleEmployeeSelection(emp.employee_no)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 accent-blue-600"
                    />
                  </div>

                  {/* Employee No */}
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase">
                      Employee No
                    </p>
                    <p className="text-lg font-bold text-gray-800">
                      {emp.employee_no}
                    </p>
                  </div>

                  {/* Employee Name */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase">
                      Employee Name
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {emp.employee_name}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="pt-4 border-t border-gray-200">
                    <span
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-lg ${getStatusColor(
                        emp.authorization_status,
                      )}`}
                    >
                      <CheckCircle2 size={16} />
                      {emp.authorization_status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ACTION BUTTON */}
          {selectedEmployeeNos.length > 0 && (
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowConfirmPopup(true)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600
          text-white font-bold shadow-lg hover:scale-105 transition"
              >
                Confirm Authorization ({selectedEmployeeNos.length})
              </button>
            </div>
          )}
        </div>
      </div>
      {showConfirmPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              Confirm Overtime Authorization
            </h3>

            <p className="text-gray-600 mb-4">
              Are you sure you want to authorize overtime
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmPopup(false)}
                className="px-4 py-2 rounded-xl border font-semibold"
              >
                No
              </button>

              <button
                disabled={submitting}
                onClick={handleConfirmAuthorization}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600
            text-white font-bold shadow hover:scale-105 transition"
              >
                {submitting ? "Processing..." : "Yes, Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewOtAssignments;
