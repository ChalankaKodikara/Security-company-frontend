/** @format */

// src/components/PermissionSection3.jsx
import React, { useState } from "react";
import { SlNote } from "react-icons/sl";
import { GiProcessor } from "react-icons/gi";
import { LuSettings } from "react-icons/lu";
import { IoCheckmarkCircle } from "react-icons/io5";

function PermissionSection3({ rolePermissionIds, onTogglePermission }) {
  const [hoveredCard, setHoveredCard] = useState(null);

  const permissionSections = [
    {
      id: "notice",
      title: "Notice Board",
      icon: SlNote,
      color: "from-teal-500 to-teal-600",
      bgColor: "bg-teal-50",
      permissions: [
        { id: "7", label: "Notice Board Overview", subPermissions: [] },
        {
          id: "1020",
          label: "Add Notice",
          subPermissions: [
            { id: "10011", label: "Edit" },
            { id: "10012", label: "Delete" }
          ]
        }
      ]
    },
    {
      id: "master",
      title: "Master Data",
      icon: GiProcessor,
      color: "from-violet-500 to-violet-600",
      bgColor: "bg-violet-50",
      permissions: [
        { id: "8", label: "Master Data Overview", subPermissions: [] },
        {
          id: "171",
          label: "Bank Branches Setup",
          subPermissions: [
            {
              id: "1021",
              label: "Bank Setup",
              subPermissions: [
                { id: "10013", label: "Add" },
                { id: "10014", label: "Edit" },
                { id: "10015", label: "Delete" }
              ]
            },
            {
              id: "1022",
              label: "Branch Setup",
              subPermissions: [
                { id: "10016", label: "Add" },
                { id: "10017", label: "Edit" },
                { id: "10018", label: "Delete" }
              ]
            }
          ]
        },

        {
          id: "175",
          label: "Employee Grade Setup",
         
        }
      ]
    },
    {
      id: "settings",
      title: "Settings",
      icon: LuSettings,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      permissions: [
        { id: "9", label: "Settings Overview", subPermissions: [] },
        {
          id: "180",
          label: "User Management",
          subPermissions: [
            { id: "10034", label: "Add" },
            { id: "10035", label: "Edit" }
          ]
        },
        {
          id: "181",
          label: "Role Management",
          subPermissions: [
            {
              id: "1023",
              label: "Role Creation",
              subPermissions: [
                { id: "10036", label: "Add" },
                { id: "10037", label: "Edit" },
                { id: "10038", label: "Delete" }
              ]
            },
            { id: "1024", label: "Role Management" }
          ]
        },
        {
          id: "182",
          label: "Supervisor",
          subPermissions: [
            { id: "10039", label: "Add" },
            { id: "10040", label: "Delete" }
          ]
        },
        {
          id: "185",
          label: "Salary Component",
          subPermissions: [
            { id: "10047", label: "Change Currency" },
            { id: "10048", label: "Add Salary Component" }
          ]
        },
        {
          id: "187",
          label: "Assign Roster",
          subPermissions: [
            { id: "10052", label: "Add Roster" },
            { id: "10053", label: "Edit Roster" }
          ]
        },
        {
          id: "184",
          label: "Organization Creation",
          subPermissions: [
            { id: "10044", label: "Add Organization" },
            { id: "10045", label: "View & Edit Organization" },
            { id: "10046", label: "Delete Organization" }

          ]
        }
      ]
    }
  ];

  const isChecked = (id) => rolePermissionIds.includes(id);

  const renderPermission = (permission, section, level = 0) => {
    const hasSubPermissions =
      permission.subPermissions && permission.subPermissions.length > 0;

    return (
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
              className={`${level === 0 ? "w-6 h-6" : level === 1 ? "w-5 h-5" : "w-4 h-4"
                } ${level === 0
                  ? "rounded-lg"
                  : level === 1
                    ? "rounded-md"
                    : "rounded"
                } border-2 flex items-center justify-center transition-all duration-200 ${isChecked(permission.id)
                  ? level === 0
                    ? `bg-gradient-to-r ${section.color} border-transparent`
                    : level === 1
                      ? "bg-gray-700 border-transparent"
                      : "bg-gray-600 border-transparent"
                  : "border-gray-300 bg-white"
                }`}
            >
              {isChecked(permission.id) && (
                <>
                  {level === 0 && (
                    <IoCheckmarkCircle className="text-white text-lg" />
                  )}
                  {level > 0 && (
                    <svg
                      className={`${level === 1 ? "w-3 h-3" : "w-2.5 h-2.5"
                        } text-white`}
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
                </>
              )}
            </div>
          </div>
          <span
            className={`ml-3 ${level === 0 ? "text-sm" : level === 1 ? "text-sm" : "text-xs"
              } font-medium transition-colors ${isChecked(permission.id) ? "text-gray-800" : "text-gray-600"
              }`}
          >
            {permission.label}
          </span>
        </label>

        {/* Sub Permissions */}
        {hasSubPermissions && (
          <div
            className={`${level === 0 ? "ml-8" : "ml-6"
              } space-y-2 border-l-2 border-gray-200 pl-4`}
          >
            {permission.subPermissions.map((subPermission) =>
              renderPermission(subPermission, section, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const countActivePermissions = (permissions) => {
    let count = 0;
    const countRecursive = (perms) => {
      perms.forEach((p) => {
        if (isChecked(p.id)) count++;
        if (p.subPermissions && p.subPermissions.length > 0) {
          countRecursive(p.subPermissions);
        }
      });
    };
    countRecursive(permissions);
    return count;
  };

  const countTotalPermissions = (permissions) => {
    let count = 0;
    const countRecursive = (perms) => {
      perms.forEach((p) => {
        count++;
        if (p.subPermissions && p.subPermissions.length > 0) {
          countRecursive(p.subPermissions);
        }
      });
    };
    countRecursive(permissions);
    return count;
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="m mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {permissionSections.map((section, index) => {
            const Icon = section.icon;
            const activeCount = countActivePermissions(section.permissions);
            const totalCount = countTotalPermissions(section.permissions);

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
                        {section.permissions.length} main permission
                        {section.permissions.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Permissions List */}
                <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {section.permissions.map((permission) =>
                    renderPermission(permission, section, 0)
                  )}
                </div>

                {/* Footer Stats */}
                <div className="px-6 pb-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Active Permissions</span>
                      <span className="font-bold text-gray-800">
                        {activeCount}/{totalCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}

export default PermissionSection3;