/** @format */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import PermissionSection1 from "./RolePermissionOne";
import PermissionSection2 from "./RolePermissionTwo";
import PermissionSection3 from "./RolePermissionThree";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Cookies from "js-cookie";

function RoleManagement() {
  const [selectedRole, setSelectedRole] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [userRoles, setUserRoles] = useState([]);
  const [rolePermissionIds, setRolePermissionIds] = useState([]);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const navigate = useNavigate();

  const token = Cookies.get("accessToken");

  const loadFeeds = async () => {
    try {
      const res = await axios.get(`${API_URL}/v1/hris/user/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res) {
        setUserRoles(res.data);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Failed to load user roles");
    }
  };

  useEffect(() => {
    loadFeeds();
  }, []);

  const handleRoleChange = async (e) => {
    const selectedRoleId = e.target.value;
    setSelectedRole(selectedRoleId);

    if (!selectedRoleId) {
      setRolePermissionIds([]);
      return;
    }

    try {
      const res = await axios.get(
        `${API_URL}/v1/hris/user/roles/${selectedRoleId}/permissions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        // Extract permission IDs from the permissions array and convert to strings
        const permissionIds = res.data.data.permissions.map((permission) =>
          permission.id.toString()
        );
        console.log("Fetched permission IDs:", permissionIds);
        setRolePermissionIds([...new Set(permissionIds)]);
      } else {
        toast.error("Failed to fetch permissions.");
        setRolePermissionIds([]);
      }
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      toast.error("Something went wrong.");
      setRolePermissionIds([]);
    }
  };

  const handleSaveAndContinue = async () => {
    if (!selectedRole) {
      toast.error("Role Id cannot be empty");
      return;
    }

    if (currentPage < 3) {
      setCurrentPage((prev) => prev + 1);
    } else {
      try {
        // Convert string permission IDs back to numbers for the API
        const permissionNumbers = rolePermissionIds.map((id) => parseInt(id));

        const res = await axios.put(
          `${API_URL}/v1/hris/user/update-user-permissions/${selectedRole}`,
          { permissions: permissionNumbers },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success) {
          toast.success("Role permissions saved successfully!");
          loadFeeds();
          setSelectedRole("");
          setRolePermissionIds([]);
          setCurrentPage(1);
        } else {
          toast.error("Failed to save role permissions.");
        }
      } catch (error) {
        console.error("Error during final submission:", error);
        toast.error("Failed to save role permissions.");
      }
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleDiscard = () => {
    setSelectedRole("");
    setRolePermissionIds([]);
    setCurrentPage(1);
  };

  const handlePermissionToggle = (permissionId) => {
    // Ensure permissionId is a string
    const stringPermissionId = permissionId.toString();

    setRolePermissionIds((prev) => {
      const updated = [...prev];
      const sectionMap = {
        1000: "2",
        1001: "2",
        1002: "2",
        1027: "2",
        1026: "2",
        1025: "2",
        100: "3",
        101: "3",
        183: "3",
        10001: "3",
        10002: "3",
        102: "3",
        103: "3",
        104: "3",
        1028: "3",
        1029: "3",
        1030: "3",
        1031:"4",
        1032:"4",
        1033:"4",
        110: "4",
        1003: "4",
        10003: "4",
        120: "4",
        130: "4",
        140: "4",
        10004: "4",
        150: "5",
        1004: "5",
        1005: "5",
        1006: "5",
        1007: "5",
        1008: "5",
        1009: "5",
        1010: "5",
        1011: "5",
        1012: "5",
        1013: "5",
        1014: "5",
        1015: "5",
        160: "5",
        1016: "6",
        10005: "6",
        10006: "6",
        1017: "6",
        1018: "6",
        10007: "6",
        10008: "6",
        10009: "6",
        10010: "6",
        1020: "7",
        10011: "7",
        10012: "7",
        170: "8",
        171: "8",
        1021: "8",
        10013: "8",
        10014: "8",
        10015: "8",
        1022: "8",
        10016: "8",
        10017: "8",
        10018: "8",
        172: "8",
        10020: "8",
        10021: "8",
        10022: "8",
        173: "8",
        10023: "8",
        10024: "8",
        10025: "8",
        174: "8",
        10026: "8",
        10027: "8",
        10028: "8",
        10029: "8",
        10030: "8",
        10031: "8",
        175:"8",
        176: "8",
        10032: "8",
        10033: "8",
        180: "9",
        10034: "9",
        10035: "9",
        181: "9",
        1023: "9",
        10036: "9",
        10037: "9",
        10038: "9",
        1024: "9",
        182: "9",
        10039: "9",
        10040: "9",
        10041: "9",
        10042: "9",
        10043: "9",
        184: "9",
        10044: "9",
        10045: "9",
        10046: "9",
        185: "9",
        10047: "9",
        10048: "9",
        186: "9",
        10049: "9",
        10050: "9",
        10051: "9",
        187: "9",
        10052: "9",
        10053: "9",
        188: "9",
        10054: "9",
        10055: "9",
        
      };

      const parentId = sectionMap[stringPermissionId];
      const isSelected = updated.includes(stringPermissionId);

      if (isSelected) {
        // Remove the permission
        const filtered = updated.filter((id) => id !== stringPermissionId);

        // Check if parent still has children selected
        const siblingsExist = Object.entries(sectionMap).some(
          ([child, parent]) =>
            parent === parentId &&
            child !== stringPermissionId &&
            filtered.includes(child)
        );

        // If no siblings, remove parent too
        return siblingsExist
          ? filtered
          : filtered.filter((id) => id !== parentId);
      } else {
        // Add child and parent if necessary
        const next = [...updated, stringPermissionId];
        if (parentId && !next.includes(parentId)) next.push(parentId);
        return [...new Set(next)];
      }
    });
  };

  const isChecked = (permissionId) => {
    // Convert permissionId to string and check if it exists in rolePermissionIds
    const stringPermissionId = permissionId.toString();
    const isPresent = rolePermissionIds.includes(stringPermissionId);

    // Debug logging (you can remove this later)
    console.log(
      `Checking permission ${permissionId} (${stringPermissionId}):`,
      isPresent,
      "Available IDs:",
      rolePermissionIds
    );

    return isPresent;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
      className=" mx-auto p-4"
    >
      {/* Role Selection */}
      <div className="mb-4">
        <label htmlFor="roleName" className="block text-gray-700 text-sm mb-2">
          Select User Role:
        </label>
        <select
          id="roleName"
          className="shadow border rounded w-full py-2 px-3 text-gray-700"
          value={selectedRole}
          onChange={handleRoleChange}
        >
          <option value="">Select Role</option>
          {userRoles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.role_name}
            </option>
          ))}
        </select>
      </div>

      {/* Permission Pages */}
      {currentPage === 1 && (
        <PermissionSection1
          rolePermissionIds={rolePermissionIds}
          onTogglePermission={handlePermissionToggle}
        />
      )}
      {currentPage === 2 && (
        <PermissionSection2
          rolePermissionIds={rolePermissionIds}
          onTogglePermission={handlePermissionToggle}
        />
      )}
      {currentPage === 3 && (
        <PermissionSection3
          rolePermissionIds={rolePermissionIds}
          onTogglePermission={handlePermissionToggle}
        />
      )}
      {/* {currentPage === 4 && (
        <PermissionSection4
          rolePermissionIds={rolePermissionIds}
          onTogglePermission={handlePermissionToggle}
        />
      )} */}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        {currentPage > 1 && (
          <button
            onClick={handlePrevious}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
          >
            Previous
          </button>
        )}
        <div>
          <button
            onClick={handleDiscard}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded mr-2"
          >
            Discard
          </button>
          <button
            onClick={handleSaveAndContinue}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            {currentPage === 3 ? "Save" : "Save & Next"}
          </button>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </motion.div>
  );
}

export default RoleManagement;
