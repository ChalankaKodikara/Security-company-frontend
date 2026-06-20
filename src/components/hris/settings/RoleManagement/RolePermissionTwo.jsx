/** @format */

// src/components/PermissionSection2.jsx
import React, { useState } from "react";
import { PiMedalLight } from "react-icons/pi";
import { GiCash } from "react-icons/gi";
import { TbReceiptTax } from "react-icons/tb";
import { IoCheckmarkCircle } from "react-icons/io5";

function RolePermissionTwo({ rolePermissionIds, onTogglePermission }) {
  const [hoveredCard, setHoveredCard] = useState(null);

  const permissionSections = [
    {
      id: "leave",
      title: "Leave Management",
      icon: PiMedalLight,
      color: "from-amber-500 to-amber-600",
      bgColor: "bg-amber-50",
      permissions: [
        { id: "4", label: "Leave Management Overview", subPermissions: [] },
        {
          id: "110",
          label: "Employee Leave Management",
          subPermissions: [
            {
              id: "1031",
              label: "Employee Leaves",

            },
            {
              id: "1032",
              label: "Leave History",

            },
            {
              id: "1033",
              label: "Leave Encashment",

            }
          ]
        },
        { id: "120", label: "Leave Approval Process", subPermissions: [] },
        { id: "130", label: "Calendar", subPermissions: [] },
        {
          id: "140",
          label: "Leave Request",
          subPermissions: [{ id: "10004", label: "Action" }]
        }
      ]
    },
    {
      id: "payroll",
      title: "Payroll Management",
      icon: GiCash,
      color: "from-rose-500 to-rose-600",
      bgColor: "bg-rose-50",
      permissions: [
        { id: "5", label: "Payroll Management Overview", subPermissions: [] },
        {
          id: "150",
          label: "Payroll Navigation",
          subPermissions: [
            { id: "1004", label: "Month end Payroll -30th" },
            { id: "1005", label: "Payroll Allowance" },
            { id: "1006", label: "Payroll Deduction" },
            { id: "1007", label: "Salary Breakdown" },
            { id: "1008", label: "Salary Advance" },
            // { id: "1009", label: "Cola Allowance" },
            // { id: "1010", label: "Spectacles Allowance" },
            // { id: "1011", label: "Reimbursement" },
            // { id: "1012", label: "Medical Allowance" },
            // { id: "1013", label: "Bill Reimbursement" },
            // { id: "1014", label: "Budgetary Allowance" },
            { id: "1015", label: "Salary Arrears" },
            // { id: "1019", label: "Service Charge" },
            { id: "1040", label: "Request Payslip" }
          ]
        },
        { id: "160", label: "Loan Management", subPermissions: [] },
        { id: "188", label: "Payroll Handling", subPermissions: [] }

      ]
    },
    {
      id: "reports",
      title: "Reports Section",
      icon: TbReceiptTax,
      color: "from-cyan-500 to-cyan-600",
      bgColor: "bg-cyan-50",
      permissions: [
        { id: "6", label: "Reports Section Overview", subPermissions: [] },
        {
          id: "1016",
          label: "Attendance Report",
          subPermissions: [
            { id: "10005", label: "Report of Check In & Check Out" },
            { id: "10006", label: "Report of Absence" }
          ]
        },
        { id: "1017", label: "Employee Report", subPermissions: [] },
        {
          id: "1018",
          label: "Payroll Report",
          subPermissions: [
            { id: "10007", label: "Generated Payroll Report" },
            { id: "10008", label: "E.P.F Report" },
            { id: "10009", label: "E.T.F Report" },
            { id: "10010", label: "Bank Slip Report" }
          ]
        }
      ]
    }
  ];

  const isChecked = (id) => rolePermissionIds.includes(id);

  const renderPermission = (permission, section, level = 0) => {
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
            className={`ml-3 text-sm font-medium transition-colors ${isChecked(permission.id) ? "text-gray-800" : "text-gray-600"
              }`}
          >
            {permission.label}
          </span>
        </label>

        {/* Sub Permissions */}
        {permission.subPermissions && permission.subPermissions.length > 0 && (
          <div className="ml-8 space-y-2 border-l-2 border-gray-200 pl-4">
            {permission.subPermissions.map((subPermission) => (
              <div key={subPermission.id} className="space-y-2">
                <label
                  className={`flex items-center p-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 ${isChecked(subPermission.id) ? "bg-gray-50" : ""
                    }`}
                >
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isChecked(subPermission.id)}
                      onChange={() => onTogglePermission(subPermission.id)}
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

                {/* Nested Sub Permissions (Third Level) */}
                {subPermission.subPermissions &&
                  subPermission.subPermissions.length > 0 && (
                    <div className="ml-6 space-y-2 border-l-2 border-gray-200 pl-4">
                      {subPermission.subPermissions.map((nestedPermission) => (
                        <label
                          key={nestedPermission.id}
                          className={`flex items-center p-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 ${isChecked(nestedPermission.id) ? "bg-gray-50" : ""
                            }`}
                        >
                          <div className="relative flex items-center">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={isChecked(nestedPermission.id)}
                              onChange={() =>
                                onTogglePermission(nestedPermission.id)
                              }
                            />
                            <div
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${isChecked(nestedPermission.id)
                                ? "bg-gray-600 border-transparent"
                                : "border-gray-300 bg-white"
                                }`}
                            >
                              {isChecked(nestedPermission.id) && (
                                <svg
                                  className="w-2.5 h-2.5 text-white"
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
                            className={`ml-2 text-xs transition-colors ${isChecked(nestedPermission.id)
                              ? "text-gray-700 font-medium"
                              : "text-gray-500"
                              }`}
                          >
                            {nestedPermission.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const countActivePermissions = (permissions) => {
    let count = 0;
    permissions.forEach((p) => {
      if (isChecked(p.id)) count++;
      if (p.subPermissions) {
        p.subPermissions.forEach((sp) => {
          if (isChecked(sp.id)) count++;
          if (sp.subPermissions) {
            sp.subPermissions.forEach((nsp) => {
              if (isChecked(nsp.id)) count++;
            });
          }
        });
      }
    });
    return count;
  };

  const countTotalPermissions = (permissions) => {
    let count = 0;
    permissions.forEach((p) => {
      count++;
      if (p.subPermissions) {
        p.subPermissions.forEach((sp) => {
          count++;
          if (sp.subPermissions) {
            count += sp.subPermissions.length;
          }
        });
      }
    });
    return count;
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className=" mx-auto">
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
                <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
                  {section.permissions.map((permission) =>
                    renderPermission(permission, section)
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
    </div>
  );
}

export default RolePermissionTwo;