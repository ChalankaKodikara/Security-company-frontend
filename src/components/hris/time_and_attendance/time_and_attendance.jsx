/** @format */

import React, { useState, useEffect } from "react";
import moment from "moment";
import Time_And_Attendance_Table from "./time_and_attendance_table.jsx";
import usePermissions from "../../permissions/permission.jsx";
import { FaUserLarge } from "react-icons/fa6";
import { GrUserExpert } from "react-icons/gr";
import { FiUserX } from "react-icons/fi";
import { TbUserExclamation } from "react-icons/tb";
import { LiaUserAltSlashSolid } from "react-icons/lia";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import { apiFetch } from "../../../utils/apiClient.js";

const Time_And_Attendance = () => {
  const [data, setData] = useState({
    totalWorkforce: 0,
    presentWorkforce: 0,
    absentWorkforce: 0,
    lateArrivals: 0,
    inLeave: 0,
  });

  const [organizationOptions, setOrganizationOptions] = useState([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");

  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const { hasPermission } = usePermissions();

  //  Fetch organization options
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const res = await apiFetch(
          `${API_URL}/v1/hris/organizations/organization`,
          {
            method: "GET",
          },
        );

        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setOrganizationOptions(
            json.data.map((org) => ({
              value: org.id,
              label: org.organization_name,
            })),
          );
        }
      } catch (err) {
        console.error("Failed to fetch organizations", err);
      }
    };

    fetchOrganizations();
  }, [API_URL]);

  //  Fetch summary stats for cards (filtered by organization)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = moment().format("YYYY-MM-DD");

        // 🔹 Build the base URL with date
        let url = `${API_URL}/v1/hris/new-attendence/all-attendance-counts?date=${today}`;

        // 🔹 Add organization param only if selected
        if (selectedOrganizationId) {
          url += `&organization=${selectedOrganizationId}`;
        }

        const res = await apiFetch(url, { method: "GET" });

        const result = await res.json();

        if (result.success && result.summary) {
          const summary = result.summary;
          setData({
            totalWorkforce: summary.totalActiveEmployees || 0,
            presentWorkforce: summary.presentWorkforce || 0,
            absentWorkforce: summary.absentWorkforce || 0,
            lateArrivals: summary.lateArrivalsCount || 0,
            inLeave: summary.leaveCount || 0,
          });
        } else {
          console.warn("Unexpected API structure:", result);
          setData({
            totalWorkforce: 0,
            presentWorkforce: 0,
            absentWorkforce: 0,
            lateArrivals: 0,
            inLeave: 0,
          });
        }
      } catch (err) {
        console.error("Error fetching attendance counts:", err);
        setData({
          totalWorkforce: 0,
          presentWorkforce: 0,
          absentWorkforce: 0,
          lateArrivals: 0,
          inLeave: 0,
        });
      }
    };

    fetchData();
  }, [API_URL, selectedOrganizationId]);

  // test

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.3, ease: "easeOut" },
    }),
  };

  const cards = [
    {
      icon: <FaUserLarge />,
      value: data.totalWorkforce,
      label: "Total Workforce",
      gradient: "from-purple-600 to-indigo-600",
      tooltip: "Total number of employees in the organization",
    },
    {
      icon: <GrUserExpert />,
      value: data.presentWorkforce,
      label: "Present Workforce",
      gradient: "from-green-500 to-teal-500",
      tooltip: "Employees present today",
    },
    {
      icon: <FiUserX />,
      value: data.absentWorkforce,
      label: "Absent Workforce",
      gradient: "from-red-500 to-pink-500",
      tooltip: "Employees absent today",
    },
    {
      icon: <TbUserExclamation />,
      value: data.lateArrivals,
      label: "Late Arrivals",
      gradient: "from-blue-500 to-cyan-500",
      tooltip: "Employees who arrived late today",
    },
    {
      icon: <LiaUserAltSlashSolid />,
      value: data.inLeave,
      label: "In Leave",
      gradient: "from-orange-500 to-amber-500",
      tooltip: "Employees on leave today",
    },
  ];

  return (
    <div className="mx-auto">
      {hasPermission(100) && (
        <div className="font-montserrat mt-5">
          {/* Header */}
          <div className="flex justify-between items-center mt-6 mb-4">
            {/*  Organization Dropdown (same as table) */}
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/*  Organization Dropdown with Label */}
              <div className="flex flex-col w-full sm:w-[320px]">
                <label
                  htmlFor="organization-select"
                  className="text-gray-700 text-sm font-medium mb-1"
                >
                  View Attendance Count for Organization
                </label>
                <Select
                  inputId="organization-select"
                  options={organizationOptions}
                  placeholder="Select Organization"
                  value={
                    organizationOptions.find(
                      (opt) => opt.value === Number(selectedOrganizationId),
                    ) || null
                  }
                  onChange={(opt) =>
                    setSelectedOrganizationId(opt ? opt.value : "")
                  }
                  isClearable
                  classNamePrefix="select"
                />
              </div>
            </div>
          </div>

          {/* Card Layer */}
          <div className="bg-white/80 backdrop-blur-md transition-all duration-300 rounded-xl ">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              <AnimatePresence>
                {cards.map((card, index) => (
                  <motion.div
                    key={card.label}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    className={`relative flex gap-4 items-center p-5 rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 group cursor-pointer`}
                    whileHover={{ y: -5 }}
                  >
                    <div className="text-3xl p-3 bg-white/20 rounded-full backdrop-blur-sm">
                      {card.icon}
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{card.value}</div>
                      <div className="text-sm font-medium">{card.label}</div>
                    </div>
                    <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-800 text-white text-xs rounded-md py-2 px-3 -top-10 left-1/2 transform -translate-x-1/2 z-10">
                      {card.tooltip}
                      <div className="absolute w-2 h-2 bg-gray-800 rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Table Layer */}
          <div className="mt-8 shadow-xl rounded-2xl bg-white/80 backdrop-blur-md">
            <Time_And_Attendance_Table
              selectedDate={moment().format("YYYY-MM-DD")}
              organization_id={selectedOrganizationId} //  passes org filter down to table
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Time_And_Attendance;
