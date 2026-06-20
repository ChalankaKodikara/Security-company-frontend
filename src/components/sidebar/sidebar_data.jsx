/** @format */

import React from "react";
import { FaUser, FaClock } from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { IoSettings } from "react-icons/io5";
import { TfiMoney } from "react-icons/tfi";
import { MdManageAccounts } from "react-icons/md";
import { BsJoystick } from "react-icons/bs";
import { TbReportSearch } from "react-icons/tb";
import { MdOutlineEditNote } from "react-icons/md";

const sidebarData = [
  {
    _id: "1",
    name: "Dashboard",
    icon: <MdDashboard />,
    url: "/emp-dashboard",
    requiredPermissionsformainfeatures: ["1"],
  },

  {
    _id: "2",
    name: "Employee Management",
    icon: <MdManageAccounts />,
    url: "/emp-management",
    requiredPermissionsformainfeatures: ["2"],
  },

  {
    _id: "3",
    name: "Time & Attendance",
    icon: <FaClock />,
    requiredPermissionsformainfeatures: ["3"],

    subModules: [
      {
        _id: "3.1",
        name: "Live Dashboard",
        url: "/time-attendance-dashboard",
        requiredPermissionsforsubfeatures: ["100"],
      },
      {
        _id: "3.2",
        name: "Time Management",
        url: "/time-management",
        requiredPermissionsforsubfeatures: ["101"],
      },

      {
        _id: "3.3",
        name: "Absence Report",
        url: "/absence-report",
        requiredPermissionsforsubfeatures: ["102"],
      },

      {
        _id: "3.4",
        name: "Attendance Adjustment",
        url: "/attendance-adjustment",
        requiredPermissionsforsubfeatures: ["103"],
      },

      {
        _id: "3.5",
        name: "Checkin-checkout Report",
        url: "/checkin-checkout-Report",
        requiredPermissionsforsubfeatures: ["104"],
      },
      {
        _id: "3.6",
        name: "OT Management",
        url: "/ot-management",
        requiredPermissionsforsubfeatures: ["183"],
      },
    ],
  },
  {
    _id: "4",
    name: "Leave Management",
    icon: <FaUser />,
    requiredPermissionsformainfeatures: ["4"],

    subModules: [
      {
        _id: "4.1",
        name: "Employee Leave Management",
        url: "/leave-management",
        requiredPermissionsforsubfeatures: ["110"],
      },
      {

        _id: "4.2",
        name: "Leave Informations",
        url: "/leave-approve",
        requiredPermissionsforsubfeatures: ["120"],

      },
      {
        _id: "4.3",
        name: "Calendar",
        url: "/restricted-date",
        requiredPermissionsforsubfeatures: ["130"],
      },

      {
        _id: "4.4",
        name: "Leave Request",
        url: "/leave-request",
        requiredPermissionsforsubfeatures: ["140"],

      },
    ],
  },

  {
    _id: "5",
    name: "Payroll Management",
    icon: <TfiMoney />,
    requiredPermissionsformainfeatures: ["5"],

    subModules: [
      {
        _id: "5.1",
        name: "Payroll Navigation",
        url: "/payroll-navigation",
        requiredPermissionsforsubfeatures: ["150"],
      },

      {
        _id: "5.4",
        name: "Payroll Handling",
        url: "/payroll-handling-landing",
        requiredPermissionsforsubfeatures: ["188"],
      },
      {
        _id: "5.2",
        name: "Loan Management",
        url: "/loan-management",
        requiredPermissionsforsubfeatures: ["160"],
      },

      {
        _id: "5.3",
        name: "Working Days Setup",
        url: "/Working-days-setup",
        requiredPermissionsforsubfeatures: ["160"],
      },
    ],
  },

  {
    _id: "6",
    name: "Reports Section",
    icon: <TbReportSearch />,
    url: "/reports-section",
    requiredPermissionsformainfeatures: ["6"],
  },

  {
    _id: "7",
    name: "Notice Board",
    icon: <MdOutlineEditNote />,
    url: "/notice-board",
    requiredPermissionsformainfeatures: ["7"],
  },

  {
    _id: "8",
    name: "Master Data",
    icon: <BsJoystick />,
    requiredPermissionsformainfeatures: ["8"],

    subModules: [
      // {
      //   _id: "8.1",
      //   name: "Bank Loan Reimbursement ",
      //   url: "/loan-reimbursement",
      //   requiredPermissionsforsubfeatures: ["170"],
      // },

      // {
      //   _id: "9.2",
      //   name: "Add Working Days ",
      //   url: "/add-working-days",

      // },

      {
        _id: "8.2",
        name: "Bank Branches Setup ",
        url: "/bank-branch-setup",
        requiredPermissionsforsubfeatures: ["171"],
      },

      // {
      //   _id: "8.3",
      //   name: "Working Office Setup ",
      //   url: "/setup-working-office",
      //   requiredPermissionsforsubfeatures: ["172"],
      // },
      // {
      //   _id: "8.4",
      //   name: "Departments ",
      //   url: "/setup-departments",
      //   requiredPermissionsforsubfeatures: ["173"],
      // },

      // {
      //   _id: "8.5",
      //   name: "Designations ",
      //   url: "/setup-designations",
      //   requiredPermissionsforsubfeatures: ["174"],
      // },
      {
        _id: "8.6",
        name: "Employee Grade",
        url: "/setup-employee-grade",
        requiredPermissionsforsubfeatures: ["175"],
        
      },

      // {
      //   _id: "8.7",
      //   name: "Reimbursement",
      //   url: "/setup-reimbursement",
      //   requiredPermissionsforsubfeatures: ["176"],
      // },
    ],
  },
  {
    _id: "9",
    name: "Settings",
    icon: <IoSettings />,
    requiredPermissionsformainfeatures: ["9"],

    subModules: [
      {
        _id: "9.1",
        name: "User Management",
        url: "/create-user-account",
        requiredPermissionsforsubfeatures: ["180"],
      },
      {
        _id: "9.2",
        name: "Role Management",
        url: "/user-permission",
        requiredPermissionsforsubfeatures: ["181"],
      },
      {
        _id: "9.3",
        name: "Supervisor",
        url: "/Supervisor",
        requiredPermissionsforsubfeatures: ["182"],
      },

      // {
      //   _id: "9.4",
      //   name: "Add Branch Type",
      //   url: "/branch",
      //   requiredPermissionsforsubfeatures: ["183"],
      // },
      // {
      //   _id: "9.5",
      //   name: "Add Employee Type",
      //   url: "/add-employee-type",
      //   requiredPermissionsforsubfeatures: ["184"],
      // },
      {
        _id: "9.6",
        name: "salary Component ",
        url: "/salaray-component-management",
        requiredPermissionsforsubfeatures: ["185"],
      },
      // {
      //   _id: "9.7",
      //   name: "Leave Category",
      //   url: "/create-leave-types",
      //   requiredPermissionsforsubfeatures: ["186"],
      // },

      {
        _id: "9.8",
        name: "Assign Roster",
        url: "/assign-roster",
        requiredPermissionsforsubfeatures: ["187"],
      },

      // {
      //   _id: "9.9",
      //   name: "Create Loan",
      //   url: "/create-loan",
      //   requiredPermissionsforsubfeatures: ["188"],
      // },

      {
        _id: "9.10",
        name: "Setup Organizations",
        // url: "/setup-organizations",
        url: "/organization-setup-landing",
        requiredPermissionsforsubfeatures: ["184"],
      },

      //  {
      //   _id: "9.10",
      //   name: "Company Hyrarchy Setup",
      //   url: "/company-hierarchy-setup",
      //   requiredPermissionsforsubfeatures: ["188"],
      // },
    ],
  },
];

export default sidebarData;
