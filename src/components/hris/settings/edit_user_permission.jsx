/** @format */

import moment from "moment";
import Navbar from "../navbar/navbar";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
const Create_new_permission = () => {
  const location = useLocation();
  const currentDate = moment().format("MMMM Do YYYY");
  const [currentTime, setCurrentTime] = useState(moment().format("h:mm:ss a"));
  const { selectedRoleId = {} } = location.state || {};
  const [checkedValues, setCheckedValues] = useState({});
  const [roleName, setRoleName] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const [roleDescription, setRoleDescription] = useState("");
  const [grantedPermission, setGrantedPermission] = useState([]);
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment().format("h:mm:ss a"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchRoleids();
  }, [selectedRoleId]);

  const fetchRoleids = async () => {
    console.log("permission :", selectedRoleId);
    console.log("permission id :", selectedRoleId.id);
    if (selectedRoleId) {
      try {
        const response = await fetch(
          `${API_URL}/v1/hris/user/getPermissionsByRoleId?role_id=${selectedRoleId.id}`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const result = await response.json();
        setGrantedPermission(result.data);
        initializeCheckedValues(result.data);
        setRoleName(selectedRoleId.role_name || "");
        setRoleDescription(selectedRoleId.role_description || "");
        // console.log("data: ", result.data);
      } catch (error) {
        console.error("Error fetching user permissions:", error);
      }
    }
  };
  const initializeCheckedValues = (permissions) => {
    const initialCheckedValues = {};
    permissions.forEach(({ id }) => {
      initialCheckedValues[id] = true;
    });
    setCheckedValues(initialCheckedValues);
  };

  const permissionHierarchy = useMemo(
    () => ({
      2: { children: [1000, 1010, 1020] },
      3: { children: [100, 101, 102, 103, 104] },
      101: { children: [1050, 1060, 1070] },
      4: { children: [110, 120, 130, 140] },
      110: { children: [1100, 1120] },
      5: { children: [150, 160] },
      150: { children: [1200, 1210, 1220, 1230, 1240, 1250, 1260, 1270, 1280] },
      160: { children: [1300] },
      6: { children: [200, 210, 220, 230, 240, 250, 260, 270, 280, 290] },
      200: { children: [1350, 1360, 1370, 1380, 1390] },
      8: { children: [300, 310, 320] },
      300: { children: [1400, 1410, 1420] },
      10: { children: [500, 510, 520, 530, 540, 550, 560, 570, 580, 590] },
      500: { children: [2000, 2010, 2020] },
      510: { children: [2030, 2040, 2050] },
      520: { children: [2060, 2070, 2080] },
      530: { children: [2100, 2110, 2120] },
      540: { children: [2150, 2160, 2170] },
      550: { children: [2180, 2190, 2200] },
      560: { children: [2210, 2220] },
      570: { children: [2230, 2240, 2250, 2260, 2270] },
      580: { children: [2280] },
      590: { children: [2300, 2310, 2320] },
    }),
    []
  );

  const handleCheckboxChange = (value, dependentValue) => {
    setCheckedValues((prev) => {
      const newValues = { ...prev, [value]: !prev[value] };

      if (dependentValue && !prev[dependentValue]) {
        newValues[dependentValue] = true;
      }

      if (newValues[value]) {
        Object.keys(permissionHierarchy).forEach((key) => {
          if (permissionHierarchy[key]?.children.includes(value)) {
            newValues[key] = true;
          }
        });
      }

      if (permissionHierarchy[value] && newValues[value]) {
        permissionHierarchy[value].children.forEach((child) => {
          newValues[child] = true;
        });
      }
      return newValues;
    });
  };

  const handleUpdate = async () => {
    if (!roleName || !roleDescription) {
      window.alert("Role Name and Role Description cannot be empty");
      return;
    }

    const permissions = Object.keys(checkedValues)
      .filter((key) => checkedValues[key])
      .map(Number);

    const postData = {
      role_name: roleName,
      role_description: roleDescription,
      permissions,
    };

    console.log("Sent Data:", postData);
    try {
      const response = await fetch(
        `${API_URL}/v1/hris/user/UpdateRoleBasedPermissions?id=${selectedRoleId.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(postData),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Response Data:", data);
        setShowSuccessMessage(true);
        setTimeout(() => {
          setShowSuccessMessage(false);
          navigate("/user-permission");
        }, 2000);
        setRoleDescription("");
        setCheckedValues({});
      } else {
        console.error("Failed to save data");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="mx-10 mt-5">
      <div className="flex justify-between items-center mt-6">
        <div>
          <p className="text-[30px] font-semibold">Edit User Permissions </p>
          <p className="text-[15px] font-semibold text-primary_purple">
            Permission
          </p>
        </div>
        <div className="flex gap-6 items-center">
          <div>
            <div className="text-[#3D0B5E] text-[20px] font-bold">
              {currentDate}
            </div>
          </div>
          <div className="text-[20px] font-bold">{currentTime}</div>
        </div>
      </div>
      <div className="flex gap-6 items-center mt-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 ">
            Role:
          </label>
        </div>
        <div>
          <input
            type="text"
            className="mt-1 block  px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-purple-500"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Role Description:
          </label>
        </div>
        <div>
          <input
            type="text"
            className="mt-1 block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-purple-500"
            value={roleDescription}
            onChange={(e) => setRoleDescription(e.target.value)}
          />
        </div>
      </div>
      {/* //grid section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {/* Dashboard */}
        <div>
          <div className="border bg-gray-50 rounded-md p-4">
            <h2 className="text-lg font-bold">Dashboard</h2>
            <div className="flex flex-col mt-4">
              <label className="flex items-center text-purple-600">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="1"
                  checked={!!checkedValues[1]}
                  onChange={() => handleCheckboxChange(1)}
                />
                Dashboard
              </label>
            </div>
          </div>
        </div>
        {/* Employee Information Management */}
        <div>
          <div className="border bg-gray-50 rounded-md p-4">
            <h2 className="text-lg font-bold">
              Employee Information Management
            </h2>

            <label className="flex items-center text-purple-600 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                value="2"
                checked={!!checkedValues[2]}
                onChange={() => handleCheckboxChange(2)}
              />
              Employee Management
            </label>

            <label className="flex items-center text-purple-600 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                value="1000"
                checked={!!checkedValues[1000]}
                onChange={() => handleCheckboxChange(1000)}
              />
              Employee Onboarding
            </label>

            <label className="flex items-center text-purple-600 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                value="1010"
                checked={!!checkedValues[1010]}
                onChange={() => handleCheckboxChange(1010)}
              />
              View Employee Details
            </label>

            <label className="flex items-center text-purple-600 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                value="1020"
                checked={!!checkedValues[1020]}
                onChange={() => handleCheckboxChange(1020)}
              />
              Employee Edit Details
            </label>
          </div>
        </div>

        {/* Time & Attendance */}
        <div>
          <div className="border bg-gray-50 rounded-md p-4">
            <h2 className="text-lg font-bold">Time & Attendance</h2>
            <label className="flex items-center text-purple-600 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                value="3"
                checked={!!checkedValues[3]}
                onChange={() => handleCheckboxChange(3)}
              />
              Time & Attendance
            </label>
            <div className="flex flex-col mt-4">
              <label className="flex items-center text-purple-600">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="100"
                  checked={!!checkedValues[100]}
                  onChange={() => handleCheckboxChange(100)}
                />
                Live Dashboard
              </label>
            </div>

            <label className="flex items-center text-purple-600 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                value="101"
                checked={!!checkedValues[101]}
                onChange={() => handleCheckboxChange(101)}
              />
              Time Management
            </label>
            <div className="ml-6 grid grid-cols-1 gap-2">
              {[
                { value: 1050, label: "Create Timetable" },
                { value: 1060, label: "Edit Timetable" },
                { value: 1070, label: "Delete Timetable" },
              ].map((item) => (
                <label key={item.value} className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    className="mr-2"
                    value={item.value}
                    checked={!!checkedValues[item.value]}
                    onChange={() => handleCheckboxChange(item.value, 101)}
                  />
                  {item.label}
                </label>
              ))}
            </div>

            <label className="flex items-center text-purple-600 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                value="102"
                checked={!!checkedValues[102]}
                onChange={() => handleCheckboxChange(102)}
              />
              Absence Report
            </label>
            <label className="flex items-center text-purple-600 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                value="103"
                checked={!!checkedValues[103]}
                onChange={() => handleCheckboxChange(103)}
              />
              Summary Report
            </label>
            <label className="flex items-center text-purple-600 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                value="104"
                checked={!!checkedValues[104]}
                onChange={() => handleCheckboxChange(104)}
              />
              Check-In Check-Out Report
            </label>
          </div>
        </div>

        {/* Leave Management */}
        <div>
          <div className="border bg-gray-50 rounded-md p-4">
            <h2 className="text-lg font-bold">Leave Management</h2>
            <label className="flex items-center text-purple-600 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                value="4"
                checked={!!checkedValues[4]}
                onChange={() => handleCheckboxChange(4)}
              />
              Leave Management
            </label>

            <label className="flex items-center text-purple-600 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                value="110"
                checked={!!checkedValues[110]}
                onChange={() => handleCheckboxChange(110)}
              />
              Employee Leave Management
            </label>
            <div className="ml-6 grid grid-cols-1 gap-2">
              <label className="flex items-center mt-2">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="1100"
                  checked={!!checkedValues[1100]}
                  onChange={() => handleCheckboxChange(1100, 110)}
                />
                Employee Leave
              </label>
              <label className="flex items-center mt-2">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="1120"
                  checked={!!checkedValues[1120]}
                  onChange={() => handleCheckboxChange(1120, 110)}
                />
                Assign Leaves
              </label>
            </div>

            <label className="flex items-center text-purple-600 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                value="120"
                checked={!!checkedValues[120]}
                onChange={() => handleCheckboxChange(120)}
              />
              Leave Approval process
            </label>

            <label className="flex items-center text-purple-600 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                value="130"
                checked={!!checkedValues[130]}
                onChange={() => handleCheckboxChange(130)}
              />
              Calender
            </label>

            <label className="flex items-center text-purple-600 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                value="140"
                checked={!!checkedValues[140]}
                onChange={() => handleCheckboxChange(140)}
              />
              Leave Request
            </label>
          </div>
        </div>

        {/* Payroll Management */}
        <div>
          <div className="border bg-gray-50 rounded-md p-4">
            <h2 className="text-lg font-bold">Payroll Management</h2>

            <label className="flex items-center text-purple-600 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                value="5"
                checked={!!checkedValues[5]}
                onChange={() => handleCheckboxChange(5)}
              />
              Payroll Management
            </label>

            <label className="flex items-center text-purple-600 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                value="150"
                checked={!!checkedValues[150]}
                onChange={() => handleCheckboxChange(150)}
              />
              Payroll Navigation
            </label>
            <div className="ml-6 grid grid-cols-1 gap-2">
              <label className="flex items-center mt-2">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="1200"
                  checked={!!checkedValues[1200]}
                  onChange={() => handleCheckboxChange(1200, 150)}
                />
                Month end Payroll
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="1210"
                  checked={!!checkedValues[1210]}
                  onChange={() => handleCheckboxChange(1210, 150)}
                />
                Generated Month end Payroll
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="1220"
                  checked={!!checkedValues[1220]}
                  onChange={() => handleCheckboxChange(1220, 150)}
                />
                Payroll Allowance
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="1230"
                  checked={!!checkedValues[1230]}
                  onChange={() => handleCheckboxChange(1230, 150)}
                />
                Payroll Deduction
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="1240"
                  checked={!!checkedValues[1240]}
                  onChange={() => handleCheckboxChange(1240, 150)}
                />
                Salary Breakdown
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="1250"
                  checked={!!checkedValues[1250]}
                  onChange={() => handleCheckboxChange(1250, 150)}
                />
                Incentive Payroll
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="1260"
                  checked={!!checkedValues[1260]}
                  onChange={() => handleCheckboxChange(1260, 150)}
                />
                Salary Advance
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="1270"
                  checked={!!checkedValues[1270]}
                  onChange={() => handleCheckboxChange(1270, 150)}
                />
                Generated Incentive Payroll
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="1280"
                  checked={!!checkedValues[1280]}
                  onChange={() => handleCheckboxChange(1280, 150)}
                />
                Service Charge Percentage
              </label>
            </div>

            <label className="flex items-center text-purple-600 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                value="160"
                checked={!!checkedValues[160]}
                onChange={() => handleCheckboxChange(160)}
              />
              Loan Management
            </label>
            <div className="ml-6 grid grid-cols-1 gap-2">
              <label className="flex items-center mt-2">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="1300"
                  checked={!!checkedValues[1300]}
                  onChange={() => handleCheckboxChange(1300, 160)}
                />
                Personal Loan
              </label>
            </div>
          </div>
        </div>

        {/* Employee Recruitment */}
        <div>
          <div className="border bg-gray-50 rounded-md p-4">
            <h2 className="text-lg font-bold">Employee Recruitment</h2>

            <label className="flex items-center text-purple-600 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                value="6"
                checked={!!checkedValues[6]}
                onChange={() => handleCheckboxChange(6)}
              />
              Employee Recruitment
            </label>

            <label className="flex items-center text-purple-600 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                value="200"
                checked={!!checkedValues[200]}
                onChange={() => handleCheckboxChange(200)}
              />
              Job Posting & Management
            </label>
            <div className="ml-6 grid grid-cols-1 gap-2">
              <label className="flex items-center mt-2">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="1350"
                  checked={!!checkedValues[1350]}
                  onChange={() => handleCheckboxChange(1350, 200)}
                />
                Pending Job Posting
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="1360"
                  checked={!!checkedValues[1360]}
                  onChange={() => handleCheckboxChange(1360, 200)}
                />
                Approved Job Posting
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="1370"
                  checked={!!checkedValues[1370]}
                  onChange={() => handleCheckboxChange(1370, 200)}
                />
                Rejected Job Posting
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="1380"
                  checked={!!checkedValues[1380]}
                  onChange={() => handleCheckboxChange(1380, 200)}
                />
                Completed Job Posting
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="1390"
                  checked={!!checkedValues[1390]}
                  onChange={() => handleCheckboxChange(1390, 200)}
                />
                Create Job
              </label>
            </div>

            <label className="flex items-center text-purple-600 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                value="210"
                checked={!!checkedValues[210]}
                onChange={() => handleCheckboxChange(210)}
              />
              Post Publishing workflow
            </label>
            <label className="flex items-center text-purple-600 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                value="220"
                checked={!!checkedValues[220]}
                onChange={() => handleCheckboxChange(220)}
              />
              Open Jobs
            </label>
            <label className="flex items-center text-purple-600 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                value="230"
                checked={!!checkedValues[230]}
                onChange={() => handleCheckboxChange(230)}
              />
              Supervisor One
            </label>
            <label className="flex items-center text-purple-600 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                value="240"
                checked={!!checkedValues[240]}
                onChange={() => handleCheckboxChange(240)}
              />
              Supervisor Two
            </label>
            <label className="flex items-center text-purple-600 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                value="250"
                checked={!!checkedValues[250]}
                onChange={() => handleCheckboxChange(250)}
              />
              Fully Shortlisted Candidates
            </label>
            <label className="flex items-center text-purple-600 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                value="260"
                checked={!!checkedValues[260]}
                onChange={() => handleCheckboxChange(260)}
              />
              Create Interviews
            </label>
            <label className="flex items-center text-purple-600 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                value="270"
                checked={!!checkedValues[270]}
                onChange={() => handleCheckboxChange(270)}
              />
              Interviews Recap
            </label>
            <label className="flex items-center text-purple-600 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                value="280"
                checked={!!checkedValues[280]}
                onChange={() => handleCheckboxChange(280)}
              />
              Interviews HR
            </label>
            <label className="flex items-center text-purple-600 mt-4">
              <input
                type="checkbox"
                className="mr-2"
                value="290"
                checked={!!checkedValues[290]}
                onChange={() => handleCheckboxChange(290)}
              />
              Interviews Screen
            </label>
          </div>
        </div>

        {/* Supervisor Approval */}
        <div>
          <div className="border bg-gray-50 rounded-md p-4">
            <h2 className="text-lg font-bold">Supervisor Approval</h2>
            <div className="flex flex-col mt-4">
              <label className="flex items-center text-purple-600">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="7"
                  checked={!!checkedValues[7]}
                  onChange={() => handleCheckboxChange(7)}
                />
                Supervisor Approval
              </label>
            </div>
          </div>
        </div>
        {/* Performance Evaluation */}
        <div>
          <div className="border bg-gray-50 rounded-md p-4">
            <h2 className="text-lg font-bold">Performance Evaluation</h2>
            <div className="flex flex-col mt-4">
              <label className="flex items-center text-purple-600">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="8"
                  checked={!!checkedValues[8]}
                  onChange={() => handleCheckboxChange(8)}
                />
                Performance Evaluation
              </label>

              <label className="flex items-center text-purple-600 mt-4">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="300"
                  checked={!!checkedValues[300]}
                  onChange={() => handleCheckboxChange(300)}
                />
                Performance Evaluation
              </label>
              <div className="ml-6 grid grid-cols-1 gap-2">
                <label className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    className="mr-2"
                    value="1400"
                    checked={!!checkedValues[1400]}
                    onChange={() => handleCheckboxChange(1400, 300)}
                  />
                  Monthly Performance
                </label>
                <label className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    className="mr-2"
                    value="1410"
                    checked={!!checkedValues[1410]}
                    onChange={() => handleCheckboxChange(1410, 300)}
                  />
                  Yearly 1st Performance
                </label>
                <label className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    className="mr-2"
                    value="1420"
                    checked={!!checkedValues[1420]}
                    onChange={() => handleCheckboxChange(1420, 300)}
                  />
                  Yearly 2nd Performance
                </label>
              </div>
              <label className="flex items-center text-purple-600 mt-4">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="310"
                  checked={!!checkedValues[310]}
                  onChange={() => handleCheckboxChange(310)}
                />
                Pending Performance
              </label>
              <label className="flex items-center text-purple-600 mt-4">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="320"
                  checked={!!checkedValues[320]}
                  onChange={() => handleCheckboxChange(320)}
                />
                Perfrmance History
              </label>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div>
          <div className="border bg-gray-50 rounded-md p-4">
            <h2 className="text-lg font-bold">Settings</h2>
            <div className="flex flex-col mt-4">
              <label className="flex items-center text-purple-600">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="10"
                  checked={!!checkedValues[10]}
                  onChange={() => handleCheckboxChange(10)}
                />
                Settings
              </label>
              <label className="flex items-center text-purple-600 mt-4">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="500"
                  checked={!!checkedValues[500]}
                  onChange={() => handleCheckboxChange(500)}
                />
                User Management
              </label>
              <div className="ml-6 grid grid-cols-1 gap-2">
                <label className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    className="mr-2"
                    value="2000"
                    checked={!!checkedValues[2000]}
                    onChange={() => handleCheckboxChange(2000, 500)}
                  />
                  Create User Account
                </label>
                <label className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    className="mr-2"
                    value="2010"
                    checked={!!checkedValues[2010]}
                    onChange={() => handleCheckboxChange(2010, 500)}
                  />
                  Edit User Account
                </label>
                <label className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    className="mr-2"
                    value="2020"
                    checked={!!checkedValues[2020]}
                    onChange={() => handleCheckboxChange(2020, 500)}
                  />
                  Delete User Account
                </label>
              </div>

              <label className="flex items-center text-purple-600 mt-4">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="510"
                  checked={!!checkedValues[510]}
                  onChange={() => handleCheckboxChange(510)}
                />
                Role Management
              </label>
              <div className="ml-6 grid grid-cols-1 gap-2">
                <label className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    className="mr-2"
                    value="2030"
                    checked={!!checkedValues[2030]}
                    onChange={() => handleCheckboxChange(2030, 510)}
                  />
                  Create User Permission
                </label>
                <label className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    className="mr-2"
                    value="2040"
                    checked={!!checkedValues[2040]}
                    onChange={() => handleCheckboxChange(2040, 510)}
                  />
                  Edit User Permission
                </label>
                <label className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    className="mr-2"
                    value="2050"
                    checked={!!checkedValues[2050]}
                    onChange={() => handleCheckboxChange(2050, 510)}
                  />
                  Delete User Permission
                </label>
              </div>

              <label className="flex items-center text-purple-600 mt-4">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="520"
                  checked={!!checkedValues[520]}
                  onChange={() => handleCheckboxChange(520)}
                />
                Supervisor
              </label>
              <div className="ml-6 grid grid-cols-1 gap-2">
                <label className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    className="mr-2"
                    value="2060"
                    checked={!!checkedValues[2060]}
                    onChange={() => handleCheckboxChange(2060, 520)}
                  />
                  Create Supervisor
                </label>
                <label className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    className="mr-2"
                    value="2070"
                    checked={!!checkedValues[2070]}
                    onChange={() => handleCheckboxChange(2070, 520)}
                  />
                  Edit Supervisor
                </label>
                <label className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    className="mr-2"
                    value="2080"
                    checked={!!checkedValues[2080]}
                    onChange={() => handleCheckboxChange(2080, 520)}
                  />
                  Delete Supervisor
                </label>
              </div>
              <label className="flex items-center text-purple-600 mt-4">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="530"
                  checked={!!checkedValues[530]}
                  onChange={() => handleCheckboxChange(530)}
                />
                Designation & Department
              </label>
              <div className="ml-6 grid grid-cols-1 gap-2">
                {[
                  { value: 2100, label: "Create Designation" },
                  { value: 2110, label: "Edit Designation" },
                  { value: 2120, label: "Delete Designation" },
                ].map((item) => (
                  <label key={item.value} className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      className="mr-2"
                      value={item.value}
                      checked={!!checkedValues[item.value]}
                      onChange={() => handleCheckboxChange(item.value, 530)}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
              <label className="flex items-center text-purple-600 mt-4">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="540"
                  checked={!!checkedValues[540]}
                  onChange={() => handleCheckboxChange(540)}
                />
                Add Branch Type
              </label>
              <div className="ml-6 grid grid-cols-1 gap-2">
                {[
                  { value: 2150, label: "Create Branch" },
                  { value: 2160, label: "Edit Branch" },
                  { value: 2170, label: "Delete Branch" },
                ].map((item) => (
                  <label key={item.value} className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      className="mr-2"
                      value={item.value}
                      checked={!!checkedValues[item.value]}
                      onChange={() => handleCheckboxChange(item.value, 540)}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
              <label className="flex items-center text-purple-600 mt-4">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="550"
                  checked={!!checkedValues[550]}
                  onChange={() => handleCheckboxChange(550)}
                />
                Add Employee Type
              </label>
              <div className="ml-6 grid grid-cols-1 gap-2">
                {[
                  { value: 2180, label: "Create Employee Type" },
                  { value: 2190, label: "Edit Employee Type" },
                  { value: 2200, label: "Delete Employee Type" },
                ].map((item) => (
                  <label key={item.value} className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      className="mr-2"
                      value={item.value}
                      checked={!!checkedValues[item.value]}
                      onChange={() => handleCheckboxChange(item.value, 550)}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
              <label className="flex items-center text-purple-600 mt-4">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="560"
                  checked={!!checkedValues[560]}
                  onChange={() => handleCheckboxChange(560)}
                />
                Salaray Component
              </label>
              <div className="ml-6 grid grid-cols-1 gap-2">
                {[
                  { value: 2210, label: "Change Currency" },
                  { value: 2220, label: "Add Salary Component" },
                ].map((item) => (
                  <label key={item.value} className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      className="mr-2"
                      value={item.value}
                      checked={!!checkedValues[item.value]}
                      onChange={() => handleCheckboxChange(item.value, 560)}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
              <label className="flex items-center text-purple-600 mt-4">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="570"
                  checked={!!checkedValues[570]}
                  onChange={() => handleCheckboxChange(570)}
                />
                Leave Types
              </label>
              <div className="ml-6 grid grid-cols-1 gap-2">
                {[
                  { value: 2230, label: "Add Leave Type" },
                  { value: 2240, label: "Edit Leave Type" },
                  { value: 2250, label: "Delete Leave Type" },
                  { value: 2260, label: "Leave Allocation" },
                  { value: 2270, label: "Reset Leave" },
                ].map((item) => (
                  <label key={item.value} className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      className="mr-2"
                      value={item.value}
                      checked={!!checkedValues[item.value]}
                      onChange={() => handleCheckboxChange(item.value, 570)}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
              <label className="flex items-center text-purple-600 mt-4">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="580"
                  checked={!!checkedValues[580]}
                  onChange={() => handleCheckboxChange(580)}
                />
                Assign Rosters
              </label>
              <div className="ml-6 grid grid-cols-1 gap-2">
                {[{ value: 2280, label: "Edit Rosters" }].map((item) => (
                  <label key={item.value} className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      className="mr-2"
                      value={item.value}
                      checked={!!checkedValues[item.value]}
                      onChange={() => handleCheckboxChange(item.value, 580)}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
              <label className="flex items-center text-purple-600 mt-4">
                <input
                  type="checkbox"
                  className="mr-2"
                  value="590"
                  checked={!!checkedValues[590]}
                  onChange={() => handleCheckboxChange(590)}
                />
                Create Loan
              </label>
              <div className="ml-6 grid grid-cols-1 gap-2">
                {[
                  { value: 2300, label: "Add Loan Type" },
                  { value: 2310, label: "Edit Loan Type" },
                  { value: 2320, label: "Delete Loan Type" },
                ].map((item) => (
                  <label key={item.value} className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      className="mr-2"
                      value={item.value}
                      checked={!!checkedValues[item.value]}
                      onChange={() => handleCheckboxChange(item.value, 590)}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showSuccessMessage && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-800 bg-opacity-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <p>Role Update successfully!</p>
          </div>
        </div>
      )}

      {/* // button section */}
      <div className="flex gap-5 mt-10 text-center">
        <button
          className="text-purple-600 bg-white border border-black px-4  py-2 rounded-md shadow-sm "
          onClick={handleCancel}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-[#8764A0] text-white rounded-md shadow-sm hover:bg-purple-600"
          onClick={handleUpdate}
        >
          Update
        </button>
      </div>
    </div>
  );
};
export default Create_new_permission;
