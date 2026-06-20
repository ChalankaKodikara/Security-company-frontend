/** @format */

import React from "react";
import { FaCheckCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaRupeeSign } from "react-icons/fa6";
import { motion } from "framer-motion";

const SpectaclesAllowance = () => {
  const navigate = useNavigate();

  /* ===================== STATIC APPROVAL CARDS ===================== */
  const approvalCards = [
    {
      id: 1,
      label: "Approval Level 1",
      level: 1,
      pendingCount: 0,
    },
    {
      id: 2,
      label: "Approval Level 2",
      level: 2,
      pendingCount: 0,
    },
  ];

  /* ===================== COLOR GRADIENTS ===================== */
  const gradients = [
    { bg: "from-blue-500 to-blue-600" },
    { bg: "from-purple-500 to-purple-600" },
  ];

  /* ===================== NAVIGATION ===================== */
  const handleViewClick = (level) => {
    if (level === 1) {
      navigate("/spectacle-allowance-app-one", {
        state: { approval_level: 1 },
      });
    } else if (level === 2) {
      navigate("/spectacle-allowance-app-two", {
        state: { approval_level: 2 },
      });
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
    >
      <div className="min-h-screen font-montserrat">
        <ToastContainer
          position="top-right"
          autoClose={3000}
          theme="colored"
        />

        {/* ===================== HEADER ===================== */}
        <div className="mb-10">
          <h1 className="text-[25px] mb-3 flex items-center gap-3">
            Spectacle Allowance
          </h1>
          <p className="text-gray-600 text-lg">
            Manage employee spectacle allowance by approval level
          </p>
        </div>

        {/* ===================== CARD GRID ===================== */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {approvalCards.map((card, index) => {
            const colorScheme = gradients[index % gradients.length];

            return (
              <div
                key={card.id}
                className="group relative overflow-hidden rounded-3xl bg-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-500 cursor-pointer"
                onClick={() => handleViewClick(card.level)}
              >
                {/* Gradient Background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${colorScheme.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                ></div>

                {/* Animated Background Circles */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-200 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-700"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-200 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-700"></div>

                {/* Content */}
                <div className="relative p-6 z-10">
                  {/* Icon */}
                  <div className="mb-6 flex items-center justify-between">
                    <div className="relative">
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${colorScheme.bg} rounded-2xl blur-xl opacity-50`}
                      ></div>
                      <div
                        className={`relative bg-gradient-to-br ${colorScheme.bg} p-4 rounded-2xl shadow-lg`}
                      >
                        <FaRupeeSign className="text-white text-3xl" />
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-white transition-colors duration-300 mb-4">
                    {card.label}
                  </h3>

                 

                  {/* Status */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200 group-hover:bg-white/20 group-hover:text-white transition-all">
                    <FaCheckCircle className="w-3.5 h-3.5" />
                    Active
                  </span>

                  {/* Button */}
                  <button
                    className="mt-6 w-full bg-gradient-to-r from-blue-500 to-blue-600 group-hover:from-white group-hover:to-white text-white group-hover:text-blue-600 font-bold rounded-xl px-6 py-3 transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewClick(card.level);
                    }}
                  >
                    <span>View Details</span>
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
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default SpectaclesAllowance;
