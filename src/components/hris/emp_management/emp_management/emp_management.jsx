/** @format */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUsers } from "react-icons/fa";
import { TbListDetails } from "react-icons/tb";
import { LiaUserEditSolid } from "react-icons/lia";
import { RiUserMinusLine } from "react-icons/ri";
import usePermissions from "../../../permissions/permission";
import { FaMobile } from "react-icons/fa6";
import { motion } from "framer-motion";
import Cookies from "js-cookie";

const Emp_Management = () => {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const { hasPermission } = usePermissions();
  const [data, setData] = useState({
    totalWorkforce: 0,
    absentWorkforce: 0,
    allowanceCount: 0,
    deductionCount: 0,
  });
  const token = Cookies.get("accessToken");

  const [orgInfo, setOrgInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrgStructure = async () => {
      try {
        const token = Cookies.get("accessToken");
        if (!token) {
          console.warn("⚠️ No user_token found in cookies");
          return;
        }

        const res = await fetch(
          `${API_URL}/v1/hris/organizations/organizational-structure`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const json = await res.json();

        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setOrgInfo(json.data[0]);
          console.log("🏢 Organization info:", json.data[0]);
        } else {
          console.warn("⚠️ No organization data found or request failed");
        }
      } catch (err) {
        console.error("❌ Error fetching organization structure:", err);
      }
    };

    fetchOrgStructure();
  }, [API_URL]);

  // 🔹 Function to handle Employee Onboarding click
  const handleOnboardClick = () => {
    if (orgInfo?.organizational_structure === true) {
      navigate(`/onboard-v2/${orgInfo.id}`, {
        state: { id: orgInfo.id, code: orgInfo.code },
      });
    } else {
      navigate("/organization-landing");
    }
  };

  // 🔹 Cards
  const allCards = [
    {
      title: "Employee Onboarding",
      count: data.totalWorkforce,
      label: "Total Employees",
      bgColor: "from-blue-500 to-blue-600",
      iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
      icon: <FaUsers className="text-white text-3xl" />,
      onClick: handleOnboardClick,
      description: "Add new team members",
      permission: 1000,
    },
    {
      title: "View Employee Details",
      count: data.totalWorkforce,
      label: "Total Employees",
      bgColor: "from-purple-500 to-purple-600",
      iconBg: "bg-gradient-to-br from-purple-500 to-purple-600",
      icon: <TbListDetails className="text-white text-3xl" />,
      onClick: () => navigate("/registered-members"),
      description: "Browse employee records",
      permission: 1001,
    },
    {
      title: "Employee Edit Details",
      count: data.allowanceCount,
      label: "Edit Details",
      bgColor: "from-teal-500 to-teal-600",
      iconBg: "bg-gradient-to-br from-teal-500 to-teal-600",
      icon: <LiaUserEditSolid className="text-white text-3xl" />,
      onClick: () => navigate("/history-logged"),
      description: "Update employee information",
      permission: 1025,
    },
    {
      title: "Employement Management",
      count: data.allowanceCount,
      label: "Edit Details",
      bgColor: "from-slate-500 to-slate-600",
      iconBg: "bg-gradient-to-br from-slate-500 to-slate-600",
      icon: <RiUserMinusLine className="text-white text-3xl" />,
      onClick: () => navigate("/employee-termination"),
      description: "Manage exits and offboarding",
      permission: 1026,
    },
    {
      title: "Access Control",
      count: data.allowanceCount,
      label: "Employee session management",
      bgColor: "from-red-500 to-red-600",
      iconBg: "bg-gradient-to-br from-red-500 to-red-600",
      icon: <FaMobile className="text-white text-3xl" />,
      onClick: () => navigate("/access-control"),
      description: "Employee session management",
      permission: 1027,
    },
    {
      title: "Quick Onboarding",
      count: data.allowanceCount,
      label: "Employee session management",
      bgColor: "from-red-500 to-red-600",
      iconBg: "bg-gradient-to-br from-red-500 to-red-600",
      icon: <FaMobile className="text-white text-3xl" />,
      onClick: () => navigate("/quick-onboarding"),
      description: "Quick employee onboarding process",
      permission: 1027,
    },
  ];

  // Filter cards based on permissions
  const cards = allCards.filter((card) => hasPermission(card.permission));

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 font-montserrat">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-[25px] mb-2">Employee Management</h1>
          <p className="text-gray-600">
            Manage your workforce efficiently and effectively
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 cursor-pointer"
              onClick={card.onClick}
            >
              {/* Gradient Background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${card.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              ></div>

              {/* Content Container */}
              <div className="relative p-6">
                {/* Icon Section */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`${card.iconBg} p-4 rounded-xl shadow-lg group-hover:bg-white/30 transition-all duration-300`}
                  >
                    <div className="group-hover:scale-110 transition-transform duration-300">
                      {card.icon}
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg
                      className="w-6 h-6 text-white"
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

                {/* Title and Description */}
                <h3 className="text-xl font-bold text-gray-800 group-hover:text-white transition-colors duration-300 mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-600 group-hover:text-white/90 transition-colors duration-300 mb-4">
                  {card.description}
                </p>

                {/* Action Button */}
                <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 group-hover:from-white group-hover:to-white text-white group-hover:text-blue-600 font-semibold rounded-xl px-6 py-3 transition-all duration-300 shadow-md group-hover:shadow-xl">
                  <span className="flex items-center justify-center gap-2">
                    View Details
                    <svg
                      className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </button>
              </div>

              {/* Decorative Element */}
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Emp_Management;
