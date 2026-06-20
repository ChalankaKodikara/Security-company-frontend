/** @format */

import React, { useState, useEffect } from "react";

const Granted_permission_popup = ({ togglePopup, user_role }) => {
  const [grantedPermission, setGrantedPermission] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(true);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        const response = await fetch(
          `${API_URL}/v1/hris/user/getPermissionsByRoleId?role_id=${user_role}`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const result = await response.json();
        setGrantedPermission(result.data);
        console.log("data:", result.data);
      } catch (error) {
        console.error("Error fetching user permissions:", error);
      }
    };

    if (user_role) {
      fetchUserPermissions();
    }
  }, [user_role]);

  if (!isFormOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-gray-800 bg-opacity-50 z-50">
      <div className="bg-white p-8 rounded-lg w-[60%] max-h-[60vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[30px] font-bold">Granted User Permission</h2>
          <button
            onClick={togglePopup}
            className="text-gray-500 hover:text-gray-700 transition duration-300"
          >
            Close
          </button>
        </div>
        <div className="max-h-[45vh] overflow-y-auto">
          {grantedPermission && grantedPermission.length > 0 ? (
            grantedPermission.map((permission) => (
              <p
                key={permission.id}
                className="mb-2 text-[20px] font-semibold bg-primary_purple p-2 rounded-md w-[350px] text-white"
              >
                {permission.permission_name}
              </p>
            ))
          ) : (
            <p>No permissions granted.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Granted_permission_popup;
