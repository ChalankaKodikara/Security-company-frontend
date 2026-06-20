/** @format */

import React, { useEffect, useState } from "react";
import moment from "moment";
import usePermissions from "../../permissions/permission";
import { FaEdit, FaTrashAlt, FaUserTie, FaPlus, FaSearch } from "react-icons/fa";
import { MdClose, MdWarning, MdCheckCircle } from "react-icons/md";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";

const Supervisors = () => {
  const [data, setData] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);

  const [employeeNumber, setEmployeeNumber] = useState("");
  const [employeeData, setEmployeeData] = useState({
    employee_fullname: "",
    employee_email: "",
    employee_contact_no: "",
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [supervisorToDelete, setSupervisorToDelete] = useState(null);

  const { hasPermission } = usePermissions();
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const itemsPerPage = 10;
  const token = Cookies.get("accessToken");

  useEffect(() => {
    fetchSupervisors();
  }, [currentPage]);

  const fetchSupervisors = () => {
    fetch(`${API_URL}/v1/hris/supervisors/getSupervisors`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((result) => {
        if (Array.isArray(result)) {
          setData(result);
          setTotalRecords(result.length);
          setTotalPages(Math.ceil(result.length / itemsPerPage));
        } else {
          console.error("Expected an array but got:", result);
          setData([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setData([]);
      });
  };

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      if (employeeNumber.trim().length < 3) {
        setEmployeeData({
          employee_fullname: "",
          employee_email: "",
          employee_contact_no: "",
        });
        return;
      }
      try {
        const response = await fetch(
          `${API_URL}/v1/hris/employees/personal/${employeeNumber}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const result = await response.json();
        if (result.success && result.data) {
          const empData = result.data;
          setEmployeeData({
            employee_fullname: empData.employee_fullname || "",
            employee_email: empData.employee_email || "",
            employee_contact_no: empData.employee_contact_no || "",
          });
        } else {
          setEmployeeData({
            employee_fullname: "Not Found",
            employee_email: "",
            employee_contact_no: "",
          });
        }
      } catch (error) {
        console.error("Error fetching employee details:", error);
      }
    };
    const handler = setTimeout(() => {
      fetchEmployeeDetails();
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [employeeNumber, API_URL]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");
    const payload = {
      supervisor_employee_no: employeeNumber,
      supervisor_fullname: employeeData.employee_fullname,
      supervisor_email: employeeData.employee_email,
      supervisor_contact_no: employeeData.employee_contact_no,
    };
    try {
      const response = await fetch(
        `${API_URL}/v1/hris/supervisors/addSupervisorWithEmployees`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create supervisor.");
      }
      setSuccessMessage("Supervisor created successfully!");
      setTimeout(() => {
        togglePopup();
        fetchSupervisors();
      }, 2000);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (supervisor) => {
    setSupervisorToDelete(supervisor);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!supervisorToDelete) return;
    try {
      const response = await fetch(
        `${API_URL}/v1/hris/supervisors/deleteSupervisor?supervisor_id=${supervisorToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        fetchSupervisors();
        setIsDeleteConfirmOpen(false);
        setSupervisorToDelete(null);
      } else {
        throw new Error("Failed to delete supervisor");
      }
    } catch (error) {
      console.error("Error deleting supervisor:", error);
      alert("An error occurred while deleting the supervisor.");
      setIsDeleteConfirmOpen(false);
    }
  };

  const cancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setSupervisorToDelete(null);
  };

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
    if (!isPopupOpen) {
      setEmployeeNumber("");
      setEmployeeData({
        employee_fullname: "",
        employee_email: "",
        employee_contact_no: "",
      });
      setSuccessMessage("");
      setErrorMessage("");
    }
  };

  const getInitials = (name) => {
    if (!name) return "??";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Paginate data
  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const avatarBgClass = (seed = "") => {
    const palette = [
      "from-blue-500 to-blue-600",
      "from-purple-500 to-purple-600",
      "from-green-500 to-green-600",
      "from-pink-500 to-pink-600",
      "from-yellow-500 to-yellow-600",
      "from-teal-500 to-teal-600",
      "from-indigo-500 to-indigo-600",
    ];
    let hash = 0;
    for (let i = 0; i < seed.length; i++)
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;

    return palette[hash % palette.length];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6"
    >
      <div >
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaUserTie className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Supervisors
                </h1>
                <p className="text-gray-600">Manage supervisor assignments</p>
              </div>
            </div>

            {hasPermission(10039) && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={togglePopup}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <FaPlus size={18} />
                Create Supervisor
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 mb-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Total Supervisors</p>
              <p className="text-4xl font-bold">{data.length}</p>
            </div>
            <div className="text-6xl opacity-20">
              <FaUserTie />
            </div>
          </div>
        </motion.div>

        {/* Table Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-6 py-4 text-left font-semibold">Employee No</th>
                  <th className="px-6 py-4 text-left font-semibold">Full Name</th>
                  <th className="px-6 py-4 text-left font-semibold">Email</th>
                  <th className="px-6 py-4 text-left font-semibold">Contact No</th>
                  {hasPermission(10040) && (
                    <th className="px-6 py-4 text-center font-semibold">Action</th>
                  )}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((item, index) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-gray-100 hover:bg-blue-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-800">
                            {item.supervisor_employee_no}
                          </span>
                        </td>
                        {/* <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md">
                              {getInitials(item.supervisor_fullname)}
                            </div>
                            <span className="font-medium text-gray-800">
                              {item.supervisor_fullname}
                            </span>
                          </div>
                        </td> */}

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <motion.div
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              className="relative"
                            >
                              {/* Blue ring around avatar */}
                              <div className="absolute inset-0 rounded-full ring-2 ring-blue-500 ring-offset-2" />
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg bg-gradient-to-br ${avatarBgClass(
                                  item.supervisor_fullname || item.supervisor_employee_no
                                )}`}
                              >
                                {getInitials(item.supervisor_fullname || "--")}
                              </div>
                            </motion.div>
                            <div>
                              <div className="font-semibold text-gray-800">
                                {item.supervisor_fullname}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {item.supervisor_employee_no}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {item.supervisor_email}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {item.supervisor_contact_no}
                        </td>
                        {hasPermission(10040) && (
                          <td className="px-6 py-4 text-center">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteClick(item)}
                              className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-all shadow-md"
                            >
                              <FaTrashAlt size={16} />
                            </motion.button>
                          </td>
                        )}
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={hasPermission(2070) ? 5 : 4}
                        className="text-center py-12"
                      >
                        <div className="text-gray-400 text-lg">No supervisors found</div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center p-6 border-t border-gray-200">
              <span className="text-gray-600 font-medium">
                Showing{" "}
                {data.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
                {Math.min(currentPage * itemsPerPage, totalRecords)} of{" "}
                {totalRecords} results
              </span>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-white border-2 border-gray-300 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </motion.button>
                <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-md">
                  Page {currentPage} of {totalPages}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-white border-2 border-gray-300 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Create Supervisor Modal */}
      <AnimatePresence>
        {isPopupOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={togglePopup}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center">
                    <FaUserTie size={20} />
                  </div>
                  <h2 className="text-2xl font-bold">Create Supervisor</h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={togglePopup}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
                >
                  <MdClose size={24} />
                </motion.button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit}>
                <div className="p-6">
                  {/* Search Box */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Employee ID
                    </label>
                    <div className="relative">
                      <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                        placeholder="Enter employee ID..."
                        value={employeeNumber}
                        onChange={(e) => setEmployeeNumber(e.target.value)}
                        required
                      />
                    </div>
                    {employeeNumber && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-gray-500 mt-2"
                      >
                        {employeeData.employee_fullname === "Not Found" ? (
                          <span className="text-red-500">Employee not found</span>
                        ) : employeeData.employee_fullname ? (
                          <span className="text-green-600">✓ Employee found</span>
                        ) : (
                          <span>Searching...</span>
                        )}
                      </motion.p>
                    )}
                  </div>

                  {/* Employee Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-600"
                        value={employeeData.employee_fullname}
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-600"
                        value={employeeData.employee_email}
                        readOnly
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Contact No
                      </label>
                      <input
                        type="text"
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-600"
                        value={employeeData.employee_contact_no}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-between items-center p-6 bg-gray-50 border-t rounded-b-2xl">
                  <div>
                    {successMessage && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-green-600"
                      >
                        <MdCheckCircle size={20} />
                        <span className="font-medium">{successMessage}</span>
                      </motion.div>
                    )}
                    {errorMessage && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-red-600"
                      >
                        <MdWarning size={20} />
                        <span className="font-medium">{errorMessage}</span>
                      </motion.div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      className="px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                      onClick={togglePopup}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      disabled={
                        loading ||
                        !employeeData.employee_fullname ||
                        employeeData.employee_fullname === "Not Found"
                      }
                    >
                      {loading ? "Saving..." : "Save"}
                    </motion.button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={cancelDelete}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="bg-gradient-to-r from-red-500 to-orange-600 text-white p-6 rounded-t-2xl flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center">
                  <MdWarning size={24} />
                </div>
                <h3 className="text-xl font-bold">Confirm Deletion</h3>
              </div>

              <div className="p-6">
                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete this supervisor?{" "}
                  <span className="font-semibold">
                    {supervisorToDelete?.supervisor_fullname}
                  </span>
                  ? This action cannot be undone.
                </p>
                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                    onClick={cancelDelete}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                    onClick={confirmDelete}
                  >
                    Yes, Delete
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Supervisors;