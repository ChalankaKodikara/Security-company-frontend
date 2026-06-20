/** @format */

import React from "react";
import { useNavigate } from "react-router-dom";
import { GiMoneyStack } from "react-icons/gi";
import { TbReportMoney } from "react-icons/tb";
import { AiFillBank } from "react-icons/ai";
import usePermissions from "../../permissions/permission";

const reportsData = [
  {
    title: "Genarated Payroll Report",
    subtitle: "View daily and monthly attendance",
    icon: <GiMoneyStack size={28} className="text-blue-600" />,
    bg: "bg-blue-50",
    path: "/Generated-payroll",
    permissionId: 10007,
  },
  {
    title: "E.P.F Report",
    subtitle: "Employee details and summaries",
    icon: <TbReportMoney size={28} className="text-green-600" />,
    bg: "bg-green-50",
    path: "/epf-report",
    permissionId: 10008,
  },
  {
    title: "E.T.F Report",
    subtitle: "Employee details and summaries",
    icon: <TbReportMoney size={28} className="text-yellow-600" />,
    bg: "bg-yellow-50",
    path: "",
    permissionId: 10009,
  },
  {
    title: "Bank Slip Report",
    subtitle: "View daily and monthly attendance",
    icon: <AiFillBank size={28} className="text-blue-600" />,
    bg: "bg-blue-50",
    path: "/bank-slip-report",
    permissionId: 10010,
  },
  // {
  //     title: "Tax Report",
  //     subtitle: "Employee details and summaries",
  //     icon: <TbReceiptTax size={28} className="text-green-600" />,
  //     bg: "bg-green-50",
  //     path: "/absence-report",
  // },
  // {
  //     title: "Basic Salary Report",
  //     subtitle: "Employee details and summaries",
  //     icon: <GiMoneyStack size={28} className="text-orange-600" />,
  //     bg: "bg-orange-50",
  //     path: "/absence-report",
  // },
];

const PayrollNavigation = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  return (
    <div className="w-full mt-5 font-monotserrat">
      <h2 className="text-[25px] mb-6">Payroll Reports</h2>

      {/* If a parent has overflow-hidden/h-screen, this wrapper will still let the cards scroll */}
      <div className="overflow-y-auto max-h-[calc(100vh-12rem)] pr-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportsData.map(
            (item, index) =>
              hasPermission(item.permissionId) && (
                <div
                  key={index}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(item.path)}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") && navigate(item.path)
                  }
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

        {/* some bottom padding so last row isn't flush with viewport bottom */}
        <div className="h-6" />
      </div>
    </div>
  );
};

export default PayrollNavigation;
