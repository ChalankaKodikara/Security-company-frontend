/** @format */

import React from "react";
import { useNavigate } from "react-router-dom";
import { ImCross } from "react-icons/im";
import { BsClock } from "react-icons/bs";
import usePermissions from "../../permissions/permission";

const reportsData = [
  {
    title: "Report Of Check In & Check Out",
    subtitle: "View daily and monthly attendance",
    icon: <BsClock size={28} className="text-blue-600" />,
    bg: "bg-blue-50",
    path: "/check-in-out-report",
    permissionId: 10005,
  },
  {
    title: "Report Of Absence",
    subtitle: "Employee details and summaries",
    icon: <ImCross size={28} className="text-green-600" />,
    bg: "bg-green-50",
    path: "/absence-report",
    permissionId: 10006,
  },
];

const AttendanceNav = () => {
  const navigate = useNavigate(); //  hook to navigate
  const { hasPermission } = usePermissions();

  return (
    <div className="w-full mt-5 min-h-screen font-monotserrat">
      <h2 className="text-[25px] mb-6">Attendance Reports</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportsData.map(
          (item, index) =>
            hasPermission(item.permissionId) && (
              <div
                key={index}
                onClick={() => navigate(item.path)} //  navigate on click
                className={`${item.bg} shadow rounded-lg p-6 flex items-center gap-4 hover:shadow-lg cursor-pointer transition`}
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white shadow">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.subtitle}</p>
                </div>
              </div>
            )
        )}
      </div>
    </div>
  );
};

export default AttendanceNav;
