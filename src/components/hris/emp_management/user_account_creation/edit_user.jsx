import React, { useState, useEffect } from "react";
import { FaRegUser, FaShieldAlt, FaKey, FaUserEdit, FaCheckCircle } from "react-icons/fa";
import { MdWarning, MdClose } from "react-icons/md";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const EditUser = () => {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get passed data from navigation state
  const { employee_status, user_type, role_name } = location.state || {};
  
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [status, setStatus] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const { employee_no } = useParams();

  useEffect(() => {
    if (employee_no) {
      console.log("Editing employee:", employee_no);
      console.log("Received data:", { employee_status, user_type, role_name });
    }
  }, [employee_no, employee_status, user_type, role_name]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch(`${API_URL}/v1/hris/user/roles`);
        const data = await response.json();

        if (Array.isArray(data)) {
          setRoles(data);
          
          // After roles are loaded, find and set the matching role
          if (role_name) {
            const matchingRole = data.find(
              (role) => role.role_name === role_name
            );
            if (matchingRole) {
              setSelectedRole(matchingRole.id);
            }
          }
        } else {
          toast.error("Failed to load roles");
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
        toast.error("Error fetching roles");
      }
    };

    fetchRoles();
  }, [API_URL, role_name]);

  // Set initial values from passed data
  useEffect(() => {
    if (user_type) {
      // Capitalize first letter to match dropdown options
      const capitalizedType = user_type.charAt(0).toUpperCase() + user_type.slice(1);
      setEmploymentType(capitalizedType);
    }
    
    if (employee_status) {
      setStatus(employee_status);
    }
  }, [user_type, employee_status]);

  const updateCredentials = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.warn("All password fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    const payload = {
      employee_no,
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    };

    try {
      const res = await fetch(`${API_URL}/v1/hris/user/resetPassword`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data?.success) {
        toast.success("Password updated successfully!");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data?.message || "Failed to update password.");
      }
    } catch (err) {
      console.error("Password update error:", err);
      toast.error("Something went wrong while updating password.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6"
    >
      <div>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <motion.button
              whileHover={{ scale: 1.1, x: -5 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
            >
              ←
            </motion.button>
            <div>
              <h1 className="text-4xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Edit User
              </h1>
              <p className="text-gray-600">Settings / User Management / Edit</p>
            </div>
          </div>
        </motion.div>

        <div>
          {/* Right Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Role & Employment Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FaUserEdit className="text-white" size={20} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  Role & Employment Assignment
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* User Role */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    User Role
                  </label>
                  <select
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    <option value="">-- Select Role --</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.role_name}
                      </option>
                    ))}
                  </select>
                  {role_name && (
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {role_name}
                    </p>
                  )}
                </div>

                {/* Employment Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Employment Type
                  </label>
                  <select
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                  >
                    <option value="">-- Select Type --</option>
                    <option value="Superadmin">Super Admin</option>
                    <option value="Admin">Admin</option>
                    <option value="User">User</option>
                  </select>
                  {user_type && (
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {user_type.charAt(0).toUpperCase() + user_type.slice(1)}
                    </p>
                  )}
                </div>

                {/* Employee Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Employee Status
                  </label>
                  <select
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">-- Select Status --</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  {employee_status && (
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {employee_status}
                    </p>
                  )}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                onClick={async (e) => {
                  e.preventDefault();

                  if (!selectedRole || !employmentType || !status) {
                    toast.warn("Please fill all fields before saving.");
                    return;
                  }

                  const payload = {
                    employee_no,
                    user_role: Number(selectedRole),
                    user_type: employmentType.toLowerCase(),
                    employment: status === "Active" ? "Yes" : "No",
                  };

                  try {
                    const res = await fetch(`${API_URL}/v1/hris/user/updateuser-new`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });

                    const data = await res.json();

                    if (res.ok && data?.success) {
                      toast.success("User updated successfully!");
                    } else {
                      toast.error(data?.message || "Failed to update user.");
                    }
                  } catch (err) {
                    console.error("Update error:", err);
                    toast.error("Something went wrong while updating user.");
                  }
                }}
              >
                Save Changes
              </motion.button>
            </div>

            {/* Change Credentials Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FaKey className="text-white" size={20} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  Change Username & Password
                </h3>
              </div>

              {/* Warning Box */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-400 p-4 rounded-xl mb-6"
              >
                <div className="flex items-start gap-3">
                  <MdWarning className="text-orange-500 flex-shrink-0 mt-0.5" size={24} />
                  <div>
                    <p className="font-semibold text-orange-800 mb-1">
                      Password Requirements
                    </p>
                    <p className="text-sm text-orange-700">
                      Minimum 8 characters long, uppercase & symbol
                    </p>
                  </div>
                </div>
              </motion.div>

              <form onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Employee No */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Employee No
                    </label>
                    <input
                      type="text"
                      value={employee_no || ""}
                      readOnly
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-600"
                    />
                  </div>

                  {/* Old Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Old Password
                    </label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                      placeholder="Enter old password"
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                      placeholder="Enter new password"
                    />
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  className="mt-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                  onClick={updateCredentials}
                >
                  Change Credentials
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowResetConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="bg-gradient-to-r from-red-500 to-orange-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center">
                    <MdWarning size={24} />
                  </div>
                  <h2 className="text-xl font-bold">Confirm Reset</h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowResetConfirm(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
                >
                  <MdClose size={24} />
                </motion.button>
              </div>

              <div className="p-6">
                <p className="text-gray-700 mb-6">
                  This will reset the user's role and permissions to the default
                  state. Do you want to proceed?
                </p>
                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                    onClick={() => setShowResetConfirm(false)}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                    onClick={() => {
                      setShowResetConfirm(false);
                      toast.info("User reset clicked (UI only).");
                    }}
                  >
                    Yes, Reset
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
    </motion.div>
  );
};

export default EditUser;