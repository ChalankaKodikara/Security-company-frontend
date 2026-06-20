import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Plus,
  X,
  Clock,
} from "lucide-react";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AsyncSelect from "react-select/async";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../../utils/apiClient";

const OvertimeAssignment = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const organizationId = params.get("org_id") || "";
  const search = params.get("search") || "";
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  // State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [viewForm, setViewForm] = useState({
    employee_nos: [],
    assigned_by_employee_no: "",
    ot_date: "",
    name_of_work: "",
    planned_start_time: "",
    planned_end_time: "",
  });
  const [updating, setUpdating] = useState(false);
  const [viewGroupId, setViewGroupId] = useState(null);

  // Organizations list
  const [organizations, setOrganizations] = useState([]);
  const EMPTY_FORM = {
    organization_id: "",
    employee_nos: [],
    assigned_by_employee_no: "",
    ot_date: "",
    name_of_work: "",
    reason: "",
    planned_start_time: "",
    planned_end_time: "",
  };
  useEffect(() => {
    const username = Cookies.get("username");

    if (username) {
      setFormData((prev) => ({
        ...prev,
        assigned_by_employee_no: username,
      }));
    }
  }, []);


  const handleViewClick = async (groupId) => {
    try {
      setViewLoading(true);
      setShowViewModal(true);
      setViewGroupId(groupId);


      const res = await apiFetch(
        `${API_URL}/v1/hris/overtime/assignment/group/${groupId}/details`,
       
      );

      const result = await res.json();

      if (res.ok && result.success) {
        setViewData(result.data);

        setViewForm({
          employee_nos: result.data.employees.map((e) => e.employee_no),
          assigned_by_employee_no: result.data.group.assigned_by,
          ot_date: result.data.group.ot_date,
          name_of_work: result.data.group.name_of_work,
          planned_start_time: result.data.group.planned_start_time,
          planned_end_time: result.data.group.planned_end_time,
        });
      } else {
        toast.error("Failed to load OT details");
        setShowViewModal(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
      setShowViewModal(false);
    } finally {
      setViewLoading(false);
    }
  };

  const handleUpdateGroup = async () => {
    try {
      setUpdating(true);
      const token = Cookies.get("accessToken");

      const payload = {
        employee_nos: viewForm.employee_nos,
        assigned_by_employee_no: viewForm.assigned_by_employee_no,
        ot_date: viewForm.ot_date,
        name_of_work: viewForm.name_of_work,
        planned_start_time: viewForm.planned_start_time,
        planned_end_time: viewForm.planned_end_time,
      };

      const res = await apiFetch(
        `${API_URL}/v1/hris/overtime/assignments/${viewGroupId}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      const result = await res.json();

      if (res.ok && result.success) {
        toast.success(result.message || "OT assignment updated successfully");
        setShowViewModal(false);
        fetchAssignments();
      } else {
        toast.error(result.message || "Update failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while updating");
    } finally {
      setUpdating(false);
    }
  };

  const loadEmployeeOptions = async (inputValue) => {
    if (!inputValue || inputValue.length < 2) return [];

    try {

      const res = await apiFetch(
        `${API_URL}/v1/hris/employees/employee/all-details?search=${inputValue}`,
       
      );

      const result = await res.json();

      if (res.ok && result.success && Array.isArray(result.data)) {
        return result.data.map((emp) => ({
          value: emp.employee_no,
          label: `${emp.employee_no} - ${emp.employee_fullname?.trim()}`,
        }));
      }

      return [];
    } catch (error) {
      console.error("Employee search error:", error);
      return [];
    }
  };

  // Form data
  const [formData, setFormData] = useState({
    organization_id: "",
    employee_nos: [],
    assigned_by_employee_no: "",
    ot_date: "",
    name_of_work: "",
    reason: "",
    planned_start_time: "",
    planned_end_time: "",
  });

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleEditClick = async (id) => {
    try {

      const res = await apiFetch(`${API_URL}/v1/hris/overtime/assignments/${id}`, {
       
      });

      const result = await res.json();

      if (res.ok && result.success) {
        const d = result.data;
        setFormData({
          organization_id: d.organization_id,
          employee_nos: d.employee_no ? [d.employee_no] : [],
          assigned_by_employee_no: d.assigned_by,
          ot_date: d.ot_date,
          name_of_work: d.name_of_work,
          reason: d.reason,
          planned_start_time: d.planned_start_time,
          planned_end_time: d.planned_end_time,
        });

        setEditId(id);
        setIsEditMode(true);
        setShowModal(true);
      } else {
        toast.error("Failed to load OT assignment");
      }
    } catch (err) {
      console.error("Edit fetch error:", err);
      toast.error("Something went wrong");
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await apiFetch(
        `${API_URL}/v1/hris/overtime/assignments/${deleteId}`,
        {
          method: "DELETE",
         
        }
      );

      const result = await res.json();

      if (res.ok && result.success) {
        toast.success(result.message || "OT assignment deleted");
        setShowDeleteConfirm(false);
        setDeleteId(null);
        fetchAssignments(); // refresh table
      } else {
        toast.error(result.message || "Failed to delete OT assignment");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Something went wrong while deleting");
    }
  };

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const res = await apiFetch(
          `${API_URL}/v1/hris/organizations/organization`,
          
        );

        const result = await res.json();

        if (result.success && Array.isArray(result.data)) {
          // Convert to react-select format
          const options = result.data.map((org) => ({
            value: org.id,
            label: org.organization_name,
          }));

          setOrganizations(options);

          // ⭐ AUTO-SELECT if only ONE organization
          if (options.length === 1) {
            setFormData((prev) => ({
              ...prev,
              organization_id: options[0].value,
            }));
          }
        }
      } catch (err) {
        console.error("Error fetching organizations:", err);
      }
    };

    fetchOrganizations();
  }, [API_URL]);

  // Fetch OT Assignments
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("accessToken");

      const query = new URLSearchParams({
        page: currentPage,
        limit: rowsPerPage,
        authorization_status: "PENDING", // ⭐ ALWAYS PENDING
      });

      if (organizationId) query.append("organization_id", organizationId);
      if (search) query.append("search", search);

      const res = await apiFetch(
        `${API_URL}/v1/hris/overtime/assignments-by-status?${query.toString()}`,
       
      );

      const result = await res.json();

      if (result.success) {
        const records = result.data || [];
        const total = result.pagination?.total ?? records.length;

        setData(records);
        setTotalRecords(total);
        setTotalPages(Math.max(1, Math.ceil(total / rowsPerPage)));
      }
    } catch (err) {
      console.error("OT fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [organizationId, search, currentPage]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const username = Cookies.get("username");
      const token = Cookies.get("accessToken");

      const payload = {
        organization_id: parseInt(formData.organization_id),
        employee_nos: formData.employee_nos,
        assigned_by_employee_no: username || formData.assigned_by_employee_no,
        ot_date: formData.ot_date,
        name_of_work: formData.name_of_work,
        reason: formData.reason,
        planned_start_time: formData.planned_start_time,
        planned_end_time: formData.planned_end_time,
      };

      const url = isEditMode
        ? `${API_URL}/v1/hris/overtime/assignments/${editId}`
        : `${API_URL}/v1/hris/overtime/assignments`;

      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        toast.success(
          isEditMode
            ? "OT assignment updated successfully"
            : "OT assignment created successfully"
        );

        setShowModal(false);
        setIsEditMode(false);
        setEditId(null);

        setFormData({
          organization_id: formData.organization_id,
          employee_nos: [],
          assigned_by_employee_no: username || "",
          ot_date: "",
          name_of_work: "",
          reason: "",
          planned_start_time: "",
          planned_end_time: "",
        });

        fetchAssignments();
      } else {
        toast.error(result.message || "Operation failed");
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };
  const closeModal = () => {
    const username = Cookies.get("username");

    setShowModal(false);
    setIsEditMode(false);
    setEditId(null);

    setFormData({
      ...EMPTY_FORM,
      assigned_by_employee_no: username || "",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8 font-montserrat">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            OT Assignment
          </h1>
          <p className="text-gray-600 text-lg">Manage overtime assignments</p>
        </div>

        {/* Assign OT Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const username = Cookies.get("username");

            setIsEditMode(false);
            setEditId(null);
            setFormData({
              ...EMPTY_FORM,
              assigned_by_employee_no: username || "",
            });
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          Assign OT
        </motion.button>
      </motion.div>

      {/* TABLE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <tr>
                {[
                  "OT Date",
                  "Work",
                  "Start Time",
                  "End Time",
                  "Status",
                  "Assigned By",
                  "Action",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-left text-sm font-semibold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center py-10">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1,
                        ease: "linear",
                      }}
                      className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"
                    />
                  </td>
                </tr>
              ) : data.length > 0 ? (
                data.map((row, index) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-blue-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-600">{row.ot_date}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {row.name_of_work}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {row.planned_start_time}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {row.planned_end_time}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${row.authorization_status === "AUTHORIZED"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                          }`}
                      >
                        {row.authorization_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {row.assigned_by}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() =>
                          handleViewClick(row.overtime_assignment_group_id)
                        }
                        className="text-blue-600 hover:text-blue-800"
                        title="View OT Assignment"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center py-12">
                    <Users size={50} className="mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 text-lg">
                      No OT assignments found
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {!loading && totalRecords > 0 && (
          <div className="p-6 bg-gray-50 flex items-center justify-between border-t">
            <div className="text-sm text-gray-600 font-medium">
              Showing{" "}
              <strong className="text-gray-800">
                {(currentPage - 1) * rowsPerPage + 1} –{" "}
                {Math.min(currentPage * rowsPerPage, totalRecords)}
              </strong>{" "}
              of <strong className="text-gray-800">{totalRecords}</strong>
            </div>

            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-4 py-2 rounded-xl border-2 border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all font-semibold flex items-center gap-2"
              >
                <ChevronLeft size={18} /> Prev
              </motion.button>

              <div className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg">
                Page {currentPage} / {totalPages}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-4 py-2 rounded-xl border-2 border-gray-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all font-semibold flex items-center gap-2"
              >
                Next <ChevronRight size={18} />
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>

      {/* ASSIGN OT MODAL */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-3xl flex justify-between items-center z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Assign Overtime</h2>
                    <p className="text-blue-100 text-sm">
                      Create new OT assignment
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeModal}
                  className="text-white hover:bg-white/20 p-2 rounded-xl transition-all"
                >
                  <X size={24} />
                </motion.button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Organization */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Organization <span className="text-red-500">*</span>
                    </label>
                    <Select
                      options={organizations}
                      placeholder="Select Organization"
                      value={
                        organizations.find(
                          (opt) => opt.value === formData.organization_id
                        ) || null
                      }
                      onChange={(selected) => {
                        setFormData((prev) => ({
                          ...prev,
                          organization_id: selected ? selected.value : "",
                        }));
                      }}
                      isClearable
                      classNamePrefix="react-select"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Employee No(s) <span className="text-red-500">*</span>
                    </label>

                    <AsyncSelect
                      isMulti
                      cacheOptions
                      defaultOptions={false}
                      loadOptions={loadEmployeeOptions}
                      placeholder="Search employee no or name..."
                      value={formData.employee_nos.map((no) => ({
                        value: no,
                        label: no,
                      }))}
                      onChange={(selected) => {
                        setFormData((prev) => ({
                          ...prev,
                          employee_nos: selected
                            ? selected.map((opt) => opt.value)
                            : [],
                        }));
                      }}
                      classNamePrefix="react-select"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Assigned By (Employee No) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="assigned_by_employee_no"
                      value={formData.assigned_by_employee_no}
                      disabled
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 cursor-not-allowed text-gray-700"
                    />
                  </div>


                  {/* OT Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      OT Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="ot_date"
                      value={formData.ot_date}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    />
                  </div>

                  {/* Name of Work */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Name of Work <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name_of_work"
                      value={formData.name_of_work}
                      onChange={handleInputChange}
                      placeholder="e.g., Emergency patient handling"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    />
                  </div>

                  {/* Reason */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      placeholder="e.g., High patient load"
                      required
                      rows="3"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none resize-none"
                    />
                  </div>

                  {/* Start Time */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Planned Start Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      name="planned_start_time"
                      value={formData.planned_start_time}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    />
                  </div>

                  {/* End Time */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Planned End Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      name="planned_end_time"
                      value={formData.planned_end_time}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end gap-4 mt-8">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {submitting ? "Assigning..." : "Assign OT"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showViewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowViewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-3xl flex justify-between items-center">
                <h2 className="text-2xl font-bold">Update OT Assignment</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 rounded-xl hover:bg-white/20"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6">
                {viewLoading ? (
                  <div className="text-center py-10">Loading...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Employees */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Employee No(s)
                      </label>
                      <AsyncSelect
                        isMulti
                        cacheOptions
                        loadOptions={loadEmployeeOptions}
                        value={viewForm.employee_nos.map((no) => ({
                          value: no,
                          label: no,
                        }))}
                        onChange={(selected) =>
                          setViewForm((prev) => ({
                            ...prev,
                            employee_nos: selected
                              ? selected.map((s) => s.value)
                              : [],
                          }))
                        }
                      />
                    </div>

                    {/* Assigned By */}
                    {/* <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Assigned By
                      </label>
                      <input
                        type="text"
                        value={viewForm.assigned_by_employee_no}
                        onChange={(e) =>
                          setViewForm((prev) => ({
                            ...prev,
                            assigned_by_employee_no: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 border-2 rounded-xl"
                      />
                    </div> */}

                    {/* OT Date */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        OT Date
                      </label>
                      <input
                        type="date"
                        value={viewForm.ot_date}
                        onChange={(e) =>
                          setViewForm((prev) => ({
                            ...prev,
                            ot_date: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 border-2 rounded-xl"
                      />
                    </div>

                    {/* Name of Work */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Name of Work
                      </label>
                      <input
                        type="text"
                        value={viewForm.name_of_work}
                        onChange={(e) =>
                          setViewForm((prev) => ({
                            ...prev,
                            name_of_work: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 border-2 rounded-xl"
                      />
                    </div>

                    {/* Start Time */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Planned Start Time
                      </label>
                      <input
                        type="time"
                        value={viewForm.planned_start_time}
                        onChange={(e) =>
                          setViewForm((prev) => ({
                            ...prev,
                            planned_start_time: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 border-2 rounded-xl"
                      />
                    </div>

                    {/* End Time */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Planned End Time
                      </label>
                      <input
                        type="time"
                        value={viewForm.planned_end_time}
                        onChange={(e) =>
                          setViewForm((prev) => ({
                            ...prev,
                            planned_end_time: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 border-2 rounded-xl"
                      />
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-end gap-4 mt-8">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-6 py-3 border-2 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateGroup}
                    disabled={updating}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold"
                  >
                    {updating ? "Updating..." : "Update OT"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Confirm Delete
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this overtime assignment?
              </p>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-5 py-2 border rounded-xl font-semibold hover:bg-gray-50"
                >
                  No
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-5 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default OvertimeAssignment;
