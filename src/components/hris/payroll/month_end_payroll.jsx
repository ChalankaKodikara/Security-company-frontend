/** @format */
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { LuUsers, LuCalendar, LuBuilding2 } from "react-icons/lu";
import {
  FaFileInvoiceDollar,
  FaChartPie,
  FaRegListAlt,
  FaArrowRight,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { LiaMoneyBillWaveSolid } from "react-icons/lia";
import { apiFetch } from "../../../utils/apiClient";
import { MdFileUpload } from "react-icons/md";

/**
 * MonthEndPayroll Component
 * @param {string} orgIdProp - Optional org_id passed from parent (only used for footer button)
 */
const MonthEndPayroll = ({ orgIdProp }) => {
  const navigate = useNavigate();
  const location = useLocation();

  //  Extract query params (from URL)
  const params = new URLSearchParams(location.search);
  const orgId = params.get("org_id");
  const selectedYear = params.get("year");
  const selectedMonth = params.get("month");

  //  Optional: Currency and symbol from cookies (not used in navigation)
  const [currency, setCurrency] = useState(Cookies.get("currency") || "USD");
  const [symbol, setSymbol] = useState(Cookies.get("symbol") || "$");
  const [organizationName, setOrganizationName] = useState("Loading...");
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const token = Cookies.get("accessToken");

  useEffect(() => {
    setCurrency(Cookies.get("currency") || "USD");
    setSymbol(Cookies.get("symbol") || "$");
  }, []);

  //  Fetch organization name based on org_id
  useEffect(() => {
    const fetchOrganizationName = async () => {
      const currentOrgId = orgId || orgIdProp;

      if (!currentOrgId) {
        setOrganizationName("N/A");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await apiFetch(
          `${API_URL}/v1/hris/organizations/organization`,
          {
            method: "GET",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch organizations");
        }

        const result = await response.json();

        if (result.success && result.data) {
          // Find the organization that matches the current org_id
          const organization = result.data.find(
            (org) => org.id === parseInt(currentOrgId),
          );

          if (organization) {
            setOrganizationName(organization.organization_name);
          } else {
            setOrganizationName("Organization Not Found");
          }
        } else {
          setOrganizationName("N/A");
        }
      } catch (error) {
        console.error("Error fetching organization:", error);
        setOrganizationName("Error Loading");
        toast.error("Failed to fetch organization details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationName();
  }, [orgId, orgIdProp, API_URL, token]);

  //  Centralized URL builder
  const buildMonthEndURL = (path, customOrgId = null) => {
    const org = customOrgId || orgId || params.get("org_id");

    if (!org || !selectedYear || !selectedMonth) {
      toast.error("Missing organization or date info. (org_id/year/month)");
      return null;
    }

    return `${path}?org_id=${encodeURIComponent(org)}&year=${encodeURIComponent(
      selectedYear,
    )}&month=${encodeURIComponent(selectedMonth)}&page=1&limit=7`;
  };

  //  Navigation helper using the builder
  const gotoWithYM = (path, customOrgId = null) => {
    const url = buildMonthEndURL(path, customOrgId);
    if (url) {
      navigate(url, {
        state: {
          orgId: customOrgId || orgId,
          year: selectedYear,
          month: selectedMonth,
        },
      });
    }
  };

  //  All month-end action cards
  const cards = [
    {
      title: "Monthly Allowance",
      description: "View monthly allowances",
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
      iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
      icon: <FaFileInvoiceDollar className="text-white text-2xl" />,
      path: "/view-genarated-month-end-allowance",
    },
    {
      title: "Monthly Deduction",
      description: "View monthly deductions",
      bgColor: "bg-gradient-to-br from-red-50 to-red-100",
      iconBg: "bg-gradient-to-br from-red-500 to-red-600",
      icon: <FaChartPie className="text-white text-2xl" />,
      path: "/view-genarated-month-end-deduction",
    },
    {
      title: "Salary Advance",
      description: "View salary advances",
      bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
      iconBg: "bg-gradient-to-br from-purple-500 to-purple-600",
      icon: <FaRegListAlt className="text-white text-2xl" />,
      path: "/view-genarated-month-end-salary-advance",
    },
    // {
    //   title: "Cola Allowance",
    //   description: "View COLA allowances",
    //   bgColor: "bg-gradient-to-br from-green-50 to-green-100",
    //   iconBg: "bg-gradient-to-br from-green-500 to-green-600",
    //   icon: <LiaMoneyBillWaveSolid className="text-white text-2xl" />,
    //   path: "/view-genarated-month-end-cola",
    // },
    // {
    //   title: "Spectacles Allowance",
    //   description: "View spectacles allowances",
    //   bgColor: "bg-gradient-to-br from-indigo-50 to-indigo-100",
    //   iconBg: "bg-gradient-to-br from-indigo-500 to-indigo-600",
    //   icon: <GiSpectacles className="text-white text-2xl" />,
    //   path: "/view-genarated-month-end-spectacles",
    // },
    // {
    //   title: "Loan Reimbursement",
    //   description: "View loan reimbursements",
    //   bgColor: "bg-gradient-to-br from-amber-50 to-amber-100",
    //   iconBg: "bg-gradient-to-br from-amber-500 to-amber-600",
    //   icon: <FaRupeeSign className="text-white text-2xl" />,
    //   path: "/view-genarated-month-end-loan-reimbursement",
    // },
    // {
    //   title: "Medical Allowances",
    //   description: "View medical allowances",
    //   bgColor: "bg-gradient-to-br from-teal-50 to-teal-100",
    //   iconBg: "bg-gradient-to-br from-teal-500 to-teal-600",
    //   icon: <FaClinicMedical className="text-white text-2xl" />,
    //   path: "/view-genarated-month-end-medical",
    // },
    // {
    //   title: "Bill Reimbursement",
    //   description: "View bill reimbursements",
    //   bgColor: "bg-gradient-to-br from-rose-50 to-rose-100",
    //   iconBg: "bg-gradient-to-br from-rose-500 to-rose-600",
    //   icon: <FaRupeeSign className="text-white text-2xl" />,
    //   path: "/view-genarated-month-end-bill-reimbursement",
    // },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6 font-montserrat">
      <div className=" mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <FaFileInvoiceDollar className="text-white text-3xl" />
            </div>
            <div>
              <p className="text-[25px]">Generate Month End Payroll</p>
              <p className="text-gray-500 text-sm mt-1">
                Manage and view all payroll components for the month
              </p>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <LuBuilding2 className="text-blue-600 text-xl" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium">
                    Organization Name
                  </p>
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <p className="text-sm text-gray-400">Loading...</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-gray-800">
                        {organizationName}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <LuCalendar className="text-purple-600 text-xl" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Year</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {selectedYear || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <LuCalendar className="text-green-600 text-xl" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Month</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {selectedMonth || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Attendance & Overtime Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
            Core Payroll Components
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden cursor-pointer group"
              onClick={() => gotoWithYM("/view-monthend-attendance")}
            >
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                      <LuUsers className="text-white text-3xl" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">Attendance</p>
                      <p className="text-sm text-blue-100 mt-1">
                        View Month End Attendance
                      </p>
                    </div>
                  </div>
                  <FaArrowRight className="text-white text-xl group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-50 to-white">
                <p className="text-xs text-gray-600">
                  Access detailed attendance records and summaries
                </p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden cursor-pointer group"
              onClick={() => gotoWithYM("/hold-employees")}
            >
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                      <LuUsers className="text-white text-3xl" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">
                        Hold Employees{" "}
                      </p>
                      <p className="text-sm text-purple-100 mt-1">
                        View Month End Overtime
                      </p>
                    </div>
                  </div>
                  <FaArrowRight className="text-white text-xl group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-white">
                <p className="text-xs text-gray-600">
                  Review overtime hours and calculations
                </p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden cursor-pointer group"
              onClick={() => gotoWithYM("/upload-employee-shift")}
            >
              <div className="bg-gradient-to-r from-blue-400 to-blue-500 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                      <MdFileUpload className="text-white text-3xl" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">
                        Upload Employee Shift
                      </p>
                      <p className="text-sm text-yellow-100 mt-1">
                        View employee shift upload status
                      </p>
                    </div>
                  </div>
                  <FaArrowRight className="text-white text-xl group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-white">
                <p className="text-xs text-gray-600">
                  Review overtime hours and calculations
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Dynamic Payroll Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cards.map((card, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -8 }}
                whileTap={{ scale: 0.98 }}
                className={`${card.bgColor} rounded-2xl shadow-lg border border-white/50 overflow-hidden cursor-pointer group transition-all duration-300`}
                onClick={() => gotoWithYM(card.path)}
              >
                <div className="p-6">
                  <div
                    className={`${card.iconBg} w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    {card.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    {card.title}
                  </h3>
                  <p className="text-xs text-gray-600">{card.description}</p>
                </div>
                <div className="px-6 pb-4">
                  <div className="flex items-center text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                    View Details
                    <FaArrowRight className="ml-2 text-xs group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer with prop-based orgId */}
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10"
        >
          <div className="mx-auto max-w-full">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-2xl shadow-2xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <FaFileInvoiceDollar className="text-white text-2xl" />
                  </div>
                  <div>
                    <p className="text-white text-lg font-bold">
                      View Month-End Payroll
                    </p>
                    <p className="text-blue-100 text-sm">
                      Access complete payroll summary and reports
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-blue-600 rounded-xl px-8 py-3 font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg flex items-center gap-2"
                  onClick={() =>
                    gotoWithYM("/view-genarated-month-end-payroll", orgIdProp)
                  }
                >
                  View Payroll
                  <FaArrowRight className="text-sm" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.footer>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default MonthEndPayroll;
