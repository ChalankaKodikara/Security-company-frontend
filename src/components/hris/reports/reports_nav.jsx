import React from "react";
import { useNavigate } from "react-router-dom";
import { FaUsers, FaCalendarCheck, FaMoneyCheckAlt, FaArrowRight } from "react-icons/fa";
import usePermissions from "../../permissions/permission";
import { motion } from "framer-motion";

const reportsData = [
  {
    title: "Attendance Report",
    subtitle: "View daily and monthly attendance",
    icon: <FaCalendarCheck size={32} />,
    gradient: "from-blue-500 to-blue-600",
    hoverGradient: "from-blue-600 to-blue-700",
    path: "/attendance-nav",
    permissionId: 1016,
  },
  {
    title: "Employee Report",
    subtitle: "Employee details and summaries",
    icon: <FaUsers size={32} />,
    gradient: "from-emerald-500 to-emerald-600",
    hoverGradient: "from-emerald-600 to-emerald-700",
    path: "/employee-report",
    permissionId: 1017,
  },
  {
    title: "Payroll Report",
    subtitle: "Salary and deductions overview",
    icon: <FaMoneyCheckAlt size={32} />,
    gradient: "from-purple-500 to-purple-600",
    hoverGradient: "from-purple-600 to-purple-700",
    path: "/payroll-nav",
    permissionId: 1018,
  },
];

const Reports = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  return (

    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
    >

      <div className="w-full mt-5 min-h-screen font-montserrat">
        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-[25px] text-gray-800 mb-2">Reports Dashboard</h2>
          <p className="text-gray-500">Access comprehensive reports and analytics</p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportsData.map(
            (item, index) =>
              hasPermission(item.permissionId) && (
                <div
                  key={index}
                  onClick={() => navigate(item.path)}
                  className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  {/* Gradient Background on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.hoverGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  {/* Card Content */}
                  <div className="relative p-6 flex flex-col h-full">
                    {/* Icon Container */}
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <div className="text-white">
                        {item.icon}
                      </div>
                    </div>

                    {/* Text Content */}
                    <div className="flex-grow">
                      <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-white transition-colors duration-300">
                        {item.title}
                      </h3>
                      <p className="text-gray-500 text-sm group-hover:text-white/90 transition-colors duration-300">
                        {item.subtitle}
                      </p>
                    </div>

                    {/* Arrow Icon */}
                    <div className="mt-4 flex items-center text-gray-400 group-hover:text-white transition-colors duration-300">
                      <span className="text-sm font-medium mr-2">View Report</span>
                      <FaArrowRight className="group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors duration-300" />
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors duration-300" />
                </div>
              )
          )}
        </div>


      </div>
    </motion.div>

  );
};

export default Reports;