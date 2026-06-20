/** @format */
import React, { useEffect, useState } from "react";
import axios from "axios";
import { MdBusiness, MdOutlineMail, MdOutlineCall } from "react-icons/md";
import { HiLocationMarker } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const OrganizationCards = () => {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const getToken = () =>
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("accessToken="))
      ?.split("=")[1];

  useEffect(() => {
    const fetchOrganizations = async () => {
      const token = getToken();

      if (!token) {
        console.warn("No user token found in cookies.");
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(
          `${API_URL}/v1/hris/organizations/organization`,
          {
            headers: {
              Authorization: `Bearer ${token}`, //  add token to header
            },
          },
        );
        if (res.data.success) {
          setOrganizations(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching organizations:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrganizations();
  }, [API_URL]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-600"></div>
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-montserrat">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[25px] my-2">Organizations</h1>
          <p className="text-gray-600">
            View and manage all registered organizations
          </p>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 cursor-pointer"
              onClick={() =>
                navigate(`/onboard-v2/${org.id}`, {
                  state: { id: org.id, code: org.code },
                })
              }
            >
              {/* Hover Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Content */}
              <div className="relative p-6">
                {/* Header Row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-xl shadow-lg group-hover:bg-white/30 transition-all duration-300">
                    <MdBusiness className="text-white text-3xl group-hover:scale-110 transition-transform duration-300" />
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

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-800 group-hover:text-white transition-colors duration-300 mb-2">
                  {org.organization_name}
                </h3>

                {/* Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 group-hover:text-white/90">
                    <MdOutlineMail />
                    <span>{org.email || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 group-hover:text-white/90">
                    <MdOutlineCall />
                    <span>{org.contact_no || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 group-hover:text-white/90">
                    <HiLocationMarker />
                    <span>{org.address || "N/A"}</span>
                  </div>
                </div>

                {/* Status Tag */}
                <div className="mt-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      org.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {org.status.toUpperCase()}
                  </span>
                </div>

                {/* Action Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // prevent triggering parent click
                    navigate(`/onboard-v2/${org.id}`, {
                      state: { id: org.id, code: org.code },
                    });
                  }}
                  className="mt-5 w-full bg-gradient-to-r from-blue-500 to-indigo-600 group-hover:from-white group-hover:to-white text-white group-hover:text-blue-600 font-semibold rounded-xl px-6 py-3 transition-all duration-300 shadow-md group-hover:shadow-xl"
                >
                  <span className="flex items-center justify-center gap-2">
                    Go To Onboard
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

              {/* Decorative Circle */}
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default OrganizationCards;
