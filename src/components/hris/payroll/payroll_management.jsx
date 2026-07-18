import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaFileInvoiceDollar,
  FaPercent,
  FaChartPie,
  FaRegListAlt,
} from "react-icons/fa";
import moment from "moment";
import { GiMoneyStack } from "react-icons/gi";
import usePermissions from "../../permissions/permission";
import { PiPlantDuotone } from "react-icons/pi";
import { MdOutlineSyncLock } from "react-icons/md";
import Cookies from "js-cookie";
import { motion } from "framer-motion";
import { LiaMoneyBillWaveSolid } from "react-icons/lia";
import { FaClinicMedical } from "react-icons/fa";
import { GiSpectacles } from "react-icons/gi";
import { apiFetch } from "../../../utils/apiClient";
import { TbReportMoney } from "react-icons/tb";

const PayrollManagement = () => {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  const [data, setData] = useState({
    totalWorkforce: 0,
    absentWorkforce: 0,
    allowanceCount: 0,
    deductionCount: 0,
  });

  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const token = Cookies.get("accessToken");

  const cards = [
    {
      title: "Month End Payroll - 30th",
      label: "Assigned Employees",
      gradient: "from-blue-500 to-indigo-600",
      iconBg: "bg-white/20",
      icon: <FaFileInvoiceDollar className="text-white text-3xl" />,
      onClick: () => navigate("/payroll-organization"),
      permissionId: 1004,
      description: "Process monthly payroll",
    },

    {
      title: "Middle of month payroll - 15th",
      label: "Assigned Employees",
      gradient: "from-pink-500 to-pink-600",
      iconBg: "bg-white/20",
      icon: <LiaMoneyBillWaveSolid className="text-white text-3xl" />,
      onClick: () => navigate("/incentive-payroll-organization"),

      permissionId: 1009,
      description: "Manage Mid-Month Payroll",
    },
    {
      title: "Payroll Allowance",
      label: "Salary Components",
      gradient: "from-green-500 to-emerald-600",
      iconBg: "bg-white/20",
      icon: <FaPercent className="text-white text-3xl" />,
      onClick: () =>
        navigate("/payroll-allowance", { state: { type: "allowance" } }),
      permissionId: 1005,
      description: "Manage employee allowances",
    },
    {
      title: "Payroll Deduction",
      label: "Salary Components",
      gradient: "from-red-500 to-rose-600",
      iconBg: "bg-white/20",
      icon: <FaChartPie className="text-white text-3xl" />,
      onClick: () =>
        navigate("/payroll-deduction", { state: { type: "deduction" } }),
      permissionId: 1006,
      description: "Handle salary deductions",
    },
    {
      title: "Salary Breakdown",
      label: "Assigned Employees",
      gradient: "from-purple-500 to-purple-600",
      iconBg: "bg-white/20",
      icon: <FaRegListAlt className="text-white text-3xl" />,
      onClick: () => navigate("/salary-breakdown"),
      permissionId: 1007,
      description: "View detailed breakdowns",
    },
    {
      title: "Salary Advance",
      label: "Assigned Employees",
      gradient: "from-cyan-500 to-cyan-600",
      iconBg: "bg-white/20",
      icon: <GiMoneyStack className="text-white text-3xl" />,
      onClick: () => navigate("/salary-advance"),
      permissionId: 1008,
      description: "Process salary advances",
    },
    {
      title: "Attendance Sheet  & Invoice",
      label: "Attendance Sheet  & Invoice",
      gradient: "from-cyan-500 to-cyan-600",
      iconBg: "bg-white/20",
      icon: <GiMoneyStack className="text-white text-3xl" />,
      onClick: () => navigate("/checkpoint-attendance"),
      permissionId: 1008,
      description: "Process salary advances",
    },
    {
      title: "Client Management",
      label: "Managed Checkpoint Clients",
      gradient: "from-teal-500 to-teal-600",
      iconBg: "bg-white/20",
      icon: <LiaMoneyBillWaveSolid className="text-white text-3xl" />,
      onClick: () => navigate("/client-management"),
      permissionId: 1009,
      description: "Manage client relationships",
    },
    {
      title: "Invoice Summary ",
      label: "Managed Invoice Summary",
      gradient: "from-teal-500 to-teal-600",
      iconBg: "bg-white/20",
      icon: <LiaMoneyBillWaveSolid className="text-white text-3xl" />,
      onClick: () => navigate("/invoice-summary"),
      permissionId: 1009,
      description: "View invoice summaries",
    },
    // {
    //   title: "Spectacles Allowance",
    //   label: "Assigned Employees",
    //   gradient: "from-amber-500 to-orange-600",
    //   iconBg: "bg-white/20",
    //   icon: <GiSpectacles className="text-white text-3xl" />,
    //   onClick: () => navigate("/spectacles-allowance"),
    //   permissionId: 1010,
    //   description: "Vision care benefits",
    // },
    // {
    //   title: "Reimbursement",
    //   label: "Assigned Employees",
    //   gradient: "from-pink-500 to-pink-600",
    //   iconBg: "bg-white/20",
    //   icon: <FaRupeeSign className="text-white text-3xl" />,
    //   onClick: () => navigate("/reimbursement-table"),
    //   permissionId: 1011,
    //   description: "Process reimbursements",
    // },
    // {
    //   title: "Medical Allowances",
    //   label: "Assigned Employees",
    //   gradient: "from-red-500 to-red-600",
    //   iconBg: "bg-white/20",
    //   icon: <FaClinicMedical className="text-white text-3xl" />,
    //   onClick: () => navigate("/medical-allowance"),
    //   permissionId: 1012,
    //   description: "Healthcare benefits",
    // },
    // {
    //   title: "Bill Reimbursement",
    //   label: "Assigned Employees",
    //   gradient: "from-indigo-500 to-indigo-600",
    //   iconBg: "bg-white/20",
    //   icon: <FaRupeeSign className="text-white text-3xl" />,
    //   onClick: () => navigate("/bill-reimbursement"),
    //   permissionId: 1013,
    //   description: "Reimburse employee bills",
    // },
    // {
    //   title: "Budgetary Allowance",
    //   label: "Assigned Employees",
    //   gradient: "from-lime-500 to-lime-600",
    //   iconBg: "bg-white/20",
    //   icon: <PiPlantDuotone className="text-white text-3xl" />,
    //   onClick: () => navigate("/budgetary-allowance"),
    //   permissionId: 1014,
    //   description: "Budget allocations",
    // },
    {
      title: "Salary Arrears",
      label: "Assigned Employees",
      gradient: "from-slate-500 to-slate-600",
      iconBg: "bg-white/20",
      icon: <MdOutlineSyncLock className="text-white text-3xl" />,
      onClick: () => navigate("/salary-arrears"),
      permissionId: 1015,
      description: "Manage salary arrears",
    },
    // {
    //   title: "Intermediate Salary",
    //   label: "Intermediate Payments",
    //   gradient: "from-indigo-500 to-indigo-600",
    //   iconBg: "bg-white/20",
    //   icon: <MdOutlineSyncLock className="text-white text-3xl" />,
    //   onClick: () => navigate("/intermediate-salary"),
    //   permissionId: 1015,
    //   description: "Manage intermediate payments",
    // },

    // {
    //   title: "Service charge",
    //   label: "Intermediate Payments",
    //   gradient: "from-indigo-500 to-indigo-600",
    //   iconBg: "bg-white/20",
    //   icon: <MdOutlineSyncLock className="text-white text-3xl" />,
    //   onClick: () => navigate("/service-charge"),
    //   permissionId: 1019,
    //   description: "Manage service charge",
    // },

    {
      title: "Request PaySlip",
      label: "Employee Payslips",
      gradient: "from-pink-500 to-pink-600",
      iconBg: "bg-white/20",
      icon: <TbReportMoney className="text-white text-3xl" />,
      onClick: () => navigate("/request-payslip"),
      permissionId: 1040,
      description: "Manage employee payslips",
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      console.log("Fetching payroll data...");

      try {
        const today = moment().format("YYYY-MM-DD");

        // Fetch attendance stats
        const response = await apiFetch(
          `${API_URL}/v1/hris/employees/getAttendanceStats`,
        );
        const result = await response.json();

        if (result.success) {
          const { totalWorkforce } = result.data;
          setData((prevData) => ({ ...prevData, totalWorkforce }));
        } else {
          console.error(
            "Error fetching attendance stats:",
            result.error || result,
          );
        }

        // Fetch absent workforce count
        const absentResponse = await apiFetch(
          `${API_URL}/v1/hris/attendence/getNotAttendCount?startDate=${today}&endDate=${today}`,
        );
        const absentResult = await absentResponse.json();

        if (absentResult.not_attended_count !== undefined) {
          setData((prevData) => ({
            ...prevData,
            absentWorkforce: absentResult.not_attended_count,
          }));
        } else {
          console.error(
            "Error fetching absent workforce count:",
            absentResult.error || absentResult,
          );
        }

        // Fetch allowance and deduction counts
        const adResponse = await apiFetch(
          `${API_URL}/v1/hris/payroll/allowances-deductions-count`,
        );
        const adResult = await adResponse.json();

        if (
          adResult.allowance_count !== undefined &&
          adResult.deduction_count !== undefined
        ) {
          setData((prevData) => ({
            ...prevData,
            allowanceCount: adResult.allowance_count,
            deductionCount: adResult.deduction_count,
          }));
        } else {
          console.error(
            "Error fetching allowances/deductions count:",
            adResult.error || adResult,
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [API_URL]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8 font-montserrat">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-[25px]  mb-3">Payroll Navigation</h1>
          <p className="text-gray-600 text-lg">
            Comprehensive payroll and compensation management
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cards
            .filter((card) => hasPermission(card.permissionId))
            .map((card, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-3xl bg-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-500 cursor-pointer"
                onClick={card.onClick}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Gradient Overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                ></div>

                {/* Animated Background Circles */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-200 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-700"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-200 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-700"></div>

                {/* Content */}
                <div className="relative p-6 z-10">
                  {/* Icon Circle */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                      <div
                        className={`relative bg-gradient-to-br ${card.gradient} p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      >
                        {card.icon}
                      </div>
                    </div>

                    {/* Arrow Icon */}
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-2">
                      <svg
                        className="w-6 h-6 text-gray-400 group-hover:text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-white transition-colors duration-300 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-600 group-hover:text-white/90 transition-colors duration-300 mb-4">
                    {card.description}
                  </p>

                  {/* Label */}
                  <div className="mb-4 p-3 bg-gray-50 group-hover:bg-white/20 rounded-xl transition-colors duration-300">
                    <p className="text-xs text-gray-500 group-hover:text-white/80 transition-colors duration-300 font-medium">
                      {card.label}
                    </p>
                  </div>

                  {/* Button */}
                  <button className="w-full bg-blue-500 text-white rounded-xl px-6 py-3 transition-all duration-300 shadow-lg  flex items-center justify-center gap-2">
                    <span>View</span>
                    <svg
                      className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </motion.div>
  );
};

export default PayrollManagement;
