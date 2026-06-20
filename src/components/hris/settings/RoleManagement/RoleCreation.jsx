/** @format */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TbEditCircle } from "react-icons/tb";
import {  FaTrashAlt, FaUsers, FaPlus } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import usePermissions from "../../../permissions/permission";

function RoleCreation() {
  const { hasPermission } = usePermissions();
  const [roleActive, setRoleActive] = useState(Boolean);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [roles, setRoles] = useState([]);
  const [editIndex, setEditIndex] = useState(null);

  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [isEditing, setIsEditing] = useState(false);
  const [editRoleId, setEditRoleId] = useState(null);

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);

  const [loading, setLoading] = useState(false);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const token = Cookies.get("accessToken");

  const loadFeeds = async (pageNo = 1) => {
    setLoading(true);
    try {
      //   const res = await fetchAllUserRoles(pageNo, ITEMS_PER_PAGE);
      //   if (res.success) {
      //     setRoles(res.data || []);
      //     setTotalPages(res.pagination.totalPages || 1);
      //     setTotalCount(res.pagination.total || 0);
      //   }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeeds(currentPage);
  }, [currentPage]);

  const handleRoleNameChange = (e) => {
    const input = e.target.value;

    if (/[^a-z]/.test(input)) {
      toast.error("You can only input lowercase letters (a-z) without spaces");
      return;
    }

    setRoleName(input);
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${API_URL}/v1/hris/user/roles`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setRoles(data);

      const totalItems = data.length;
      const calculatedTotalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

      setTotalCount(totalItems);
      setTotalPages(calculatedTotalPages);
    } catch (error) {
      console.error("Error fetching user roles:", error);
    }
  };

  const HandleDelete = async () => {
    try {
      const response = await fetch(
        `${API_URL}/v1/hris/user/deleteUserRole/${roleToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to delete role");
      }
      setRoles(roles.filter((role) => role.id !== roleToDelete));
      setShowConfirmDelete(false);
      setRoleToDelete(null);
      toast.success("Role deleted successfully!");
    } catch (error) {
      console.error("Error deleting role:", error);
      toast.error("Failed to delete role");
    }
  };

  const confirmDelete = (user_role) => {
    setRoleToDelete(user_role);
    setShowConfirmDelete(true);
  };

  const handleRoleDescriptionChange = (e) => {
    setRoleDescription(e.target.value);
  };

  const handleSaveOrUpdateRole = async () => {
    if (roleName.trim() === "") {
      toast.error("Role Name cannot be empty");
      return;
    }

    const formData = {
      role_name: roleName,
      role_description: roleDescription,
    };

    try {
      if (isEditing) {
        const response = await fetch(
          `${API_URL}/v1/hris/user/update-user-role/${editRoleId}`,
          {
            method: "PUT",

            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },

            body: JSON.stringify(formData),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update role");
        }

        toast.success("Role updated successfully!");
        fetchRoles();
      } else {
        const response = await fetch(`${API_URL}/v1/hris/user/addUserRole`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error("Failed to create role");
        }

        toast.success("Role created successfully!");
        fetchRoles();
      }

      setRoleName("");
      setRoleDescription("");
      setIsEditing(false);
      setEditRoleId(null);
    } catch (error) {
      console.error("Error in save/update role:", error);
      toast.error(isEditing ? "Update failed" : "Role creation failed");
    }
  };

  const handleCancel = () => {
    setRoleName("");
    setRoleDescription("");
    setIsEditing(false);
    setEditRoleId(null);
  };

  const handleToggleActive = async (role) => {
    const updatedStatus = role.active_status ? 0 : 1;

    const updatedRoles = roles.map((r) =>
      r.id === role.id ? { ...r, active_status: updatedStatus } : r
    );
    setRoles(updatedRoles);

    const formData = {
      active_status: updatedStatus,
    };

    try {
      //   await updateUserActiveStatusRoles(role.id, formData);
      toast.success("Role active status updated successfully");
    } catch (error) {
      const revertedRoles = roles.map((r) =>
        r.id === role.id ? { ...r, active_status: role.active_status } : r
      );
      setRoles(revertedRoles);
      toast.error("Failed to update active status");
    }
  };

  const handleDeleteRole = (index) => {
    const newRoles = [...roles];
    newRoles.splice(index, 1);
    setRoles(newRoles);
  };

  const handleEdit = (role) => {
    console.log("Editing role at index:", role.id);

    setRoleName(role.role_name);
    setRoleDescription(role.role_description);
    setIsEditing(true);
    setEditRoleId(role.id);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleUpdate = (index, newName) => {
    if (newName.trim() === "") {
      toast.error("Role Name cannot be empty");
      return;
    }
    const newRoles = [...roles];
    newRoles[index].role_name = newName;
    setRoles(newRoles);
    setEditIndex(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className=" mx-auto"
      >
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <FaUsers className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Role Management
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Manage user roles and permissions
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Role List - Takes 2 columns on large screens */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaUsers className="text-lg" />
                Role List
              </h2>
              
            </div>
{/* test */}
            <div className="p-6">
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                      >
                        Role Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[250px]"
                      >
                        Role Description
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {roles
                      .slice(
                        (currentPage - 1) * ITEMS_PER_PAGE,
                        currentPage * ITEMS_PER_PAGE
                      )
                      .map((role, index) => (
                        <motion.tr
                          key={role.id || index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="hover:bg-blue-50 transition-colors duration-200"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            {editIndex ===
                              index + (currentPage - 1) * ITEMS_PER_PAGE ? (
                              <input
                                type="text"
                                defaultValue={role.role_name}
                                onBlur={(e) =>
                                  handleUpdate(
                                    index + (currentPage - 1) * ITEMS_PER_PAGE,
                                    e.target.value
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleUpdate(
                                      index +
                                      (currentPage - 1) * ITEMS_PER_PAGE,
                                      e.target.value
                                    );
                                  }
                                }}
                                className="px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            ) : (
                              <span className="text-sm font-semibold text-gray-800 bg-blue-50 px-3 py-1.5 rounded-lg inline-block">
                                {role.role_name}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 min-w-[250px]">
                            {editIndex ===
                              index + (currentPage - 1) * ITEMS_PER_PAGE ? (
                              <input
                                type="text"
                                defaultValue={role.role_description}
                                onBlur={(e) =>
                                  handleUpdate(
                                    index + (currentPage - 1) * ITEMS_PER_PAGE,
                                    e.target.value
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleUpdate(
                                      index +
                                      (currentPage - 1) * ITEMS_PER_PAGE,
                                      e.target.value
                                    );
                                  }
                                }}
                                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            ) : (
                              <span className="text-sm text-gray-600 break-words">
                                {role.role_description}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {hasPermission(10037) && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="p-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                                  onClick={() => handleEdit(role)}
                                >
                                  <TbEditCircle size={18} />
                                </motion.button>
                              )}
                              {hasPermission(10038) && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="p-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                                  onClick={() => confirmDelete(role.id)}
                                >
                                  <FaTrashAlt size={16} />
                                </motion.button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                <span className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                  Showing{" "}
                  <span className="font-semibold text-gray-800">
                    {Math.min(
                      (currentPage - 1) * ITEMS_PER_PAGE + 1,
                      totalCount
                    )}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-gray-800">
                    {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-800">
                    {totalCount}
                  </span>{" "}
                  entries
                </span>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-gray-700 transition-all duration-200 shadow-sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </motion.button>
                  {totalPages > 0 &&
                    [...Array(totalPages)].map((_, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm ${currentPage === i + 1
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                            : "bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-blue-300"
                          }`}
                        onClick={() => handlePageChange(i + 1)}
                      >
                        {i + 1}
                      </motion.button>
                    ))}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-gray-700 transition-all duration-200 shadow-sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Add/Update Role Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden h-fit sticky top-6"
          >
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaPlus className="text-lg" />
                {isEditing ? "Update Role" : "Add New Role"}
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {isEditing
                  ? "Modify existing role details"
                  : "Create a new user role"}
              </p>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label
                  htmlFor="roleName"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Role Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="roleName"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-800 placeholder-gray-400"
                  placeholder="e.g., admin, manager, user"
                  value={roleName}
                  onChange={handleRoleNameChange}
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Only lowercase letters (a-z), no spaces
                </p>
              </div>

              <div>
                <label
                  htmlFor="roleDescription"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Role Description
                </label>
                <textarea
                  id="roleDescription"
                  rows="4"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-800 placeholder-gray-400 resize-none"
                  placeholder="Enter a brief description of this role"
                  value={roleDescription}
                  onChange={handleRoleDescriptionChange}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-200 border-2 border-gray-200"
                  type="button"
                  onClick={handleCancel}
                >
                  Cancel
                </motion.button>
                {hasPermission(10036) && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                    type="button"
                    onClick={handleSaveOrUpdateRole}
                  >
                    {isEditing ? "Update Role" : "Save Role"}
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="text-black px-6 py-4">
              <h3 className="text-xl font-bold ">Confirm Deletion</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 text-base mb-6">
                Are you sure you want to delete this role? This action cannot be
                undone.
              </p>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-200"
                  onClick={() => setShowConfirmDelete(false)}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg"
                  onClick={HandleDelete}
                >
                  Delete
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}

export default RoleCreation;