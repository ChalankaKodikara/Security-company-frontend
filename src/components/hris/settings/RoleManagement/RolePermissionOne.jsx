/** @format */

// src/components/PermissionSection1.jsx
import React, { useState } from "react";
import { IoPersonOutline } from "react-icons/io5";
import { LiaUsersCogSolid } from "react-icons/lia";
import { RxLapTimer } from "react-icons/rx";
import { IoCheckmarkCircle } from "react-icons/io5";

function RolePermissionOne({ rolePermissionIds, onTogglePermission }) {
  const [hoveredCard, setHoveredCard] = useState(null);

  const permissionSections = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: IoPersonOutline,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      permissions: [
        { id: "1", label: "Dashboard Overview", subPermissions: [] }
      ]
    },
    {
      id: "employee",
      title: "Employee Management",
      icon: LiaUsersCogSolid,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      permissions: [
        { id: "2", label: "Employee Management Overview", subPermissions: [] },
        { id: "1000", label: "Employee Onboarding", subPermissions: [] },
        {
          id: "1001",
          label: "View Employee Details",
          subPermissions: [{ id: "1002", label: "Edit" }]
        },

        //newly added permissions
        {
          id: "1025",
          label: "Employee Edit Details",
          subPermissions: []
        },
        {
          id: "1026",
          label: "Employement Management",
          subPermissions: []
        },
        {
          id: "1027",
          label: "Access Control",
          subPermissions: []
        }
      ]
    },
    {
      id: "attendance",
      title: "Time & Attendance",
      icon: RxLapTimer,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      permissions: [
        { id: "3", label: "Time & Attendance Overview", subPermissions: [] },
        { id: "100", label: "Live Dashboard", subPermissions: [] },
        {
          id: "101",
          label: "Time Management",
          subPermissions: [
            { id: "10001", label: "Create Timetable" },
            { id: "10002", label: "Action" }
          ]
        },
        { id: "102", label: "Absence Report", subPermissions: [] },
        { id: "103", label: "Attendance Adjustment", subPermissions: [] },
        { id: "104", label: "Checkin-checkout Report", subPermissions: [] },

        {
          id: "183",
          label: "Over Time Management",
          subPermissions: [
            { id: "1028", label: "OT Assignment" },
            { id: "1029", label: "OT Authorization" },
            { id: "1030", label: "OT Verification" }

          ]
        },
      ]
    }
  ];

  const isChecked = (id) => rolePermissionIds.includes(id);

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className=" mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Role Permissions
          </h1>
          <p className="text-gray-600">
            Configure access permissions for different roles
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {permissionSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${hoveredCard === index ? "ring-2 ring-offset-2 ring-gray-300" : ""
                  }`}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Header */}
                <div
                  className={`bg-gradient-to-r ${section.color} rounded-t-2xl p-6 text-white`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                      <Icon className="text-3xl" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{section.title}</h2>
                      <p className="text-sm text-white text-opacity-80">
                        {section.permissions.length} permission
                        {section.permissions.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Permissions List */}
                <div className="p-6 space-y-4">
                  {section.permissions.map((permission) => (
                    <div key={permission.id} className="space-y-2">
                      {/* Main Permission */}
                      <label
                        className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-gray-50 ${isChecked(permission.id) ? section.bgColor : ""
                          }`}
                      >
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={isChecked(permission.id)}
                            onChange={() => onTogglePermission(permission.id)}
                          />
                          <div
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${isChecked(permission.id)
                              ? `bg-gradient-to-r ${section.color} border-transparent`
                              : "border-gray-300 bg-white"
                              }`}
                          >
                            {isChecked(permission.id) && (
                              <IoCheckmarkCircle className="text-white text-lg" />
                            )}
                          </div>
                        </div>
                        <span
                          className={`ml-3 text-sm font-medium transition-colors ${isChecked(permission.id)
                            ? "text-gray-800"
                            : "text-gray-600"
                            }`}
                        >
                          {permission.label}
                        </span>
                      </label>

                      {/* Sub Permissions */}
                      {permission.subPermissions.length > 0 && (
                        <div className="ml-8 space-y-2 border-l-2 border-gray-200 pl-4">
                          {permission.subPermissions.map((subPermission) => (
                            <label
                              key={subPermission.id}
                              className={`flex items-center p-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 ${isChecked(subPermission.id)
                                ? "bg-gray-50"
                                : ""
                                }`}
                            >
                              <div className="relative flex items-center">
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={isChecked(subPermission.id)}
                                  onChange={() =>
                                    onTogglePermission(subPermission.id)
                                  }
                                />
                                <div
                                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${isChecked(subPermission.id)
                                    ? "bg-gray-700 border-transparent"
                                    : "border-gray-300 bg-white"
                                    }`}
                                >
                                  {isChecked(subPermission.id) && (
                                    <svg
                                      className="w-3 h-3 text-white"
                                      fill="none"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="3"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path d="M5 13l4 4L19 7"></path>
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <span
                                className={`ml-2 text-sm transition-colors ${isChecked(subPermission.id)
                                  ? "text-gray-700 font-medium"
                                  : "text-gray-500"
                                  }`}
                              >
                                {subPermission.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Footer Stats */}
                <div className="px-6 pb-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Active Permissions</span>
                      <span className="font-bold text-gray-800">
                        {
                          section.permissions.filter((p) =>
                            [
                              p.id,
                              ...p.subPermissions.map((sp) => sp.id)
                            ].some((id) => isChecked(id))
                          ).length
                        }
                        /{section.permissions.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default RolePermissionOne;