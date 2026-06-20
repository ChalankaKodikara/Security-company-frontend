/** @format */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegUser } from "react-icons/fa6";
import { IoIosArrowRoundForward } from "react-icons/io";
import { BsBox } from "react-icons/bs";
import Cookies from "js-cookie";
import Select from "react-select";
import { CiCirclePlus } from "react-icons/ci";
import CreatableSelect from "react-select/creatable";

const Performance_Evaluation_Nav = () => {
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  const [counts, setCounts] = useState({
    monthly_count: 0,
    yearly_april_count: 0,
    yearly_december_count: 0,
  });
  useEffect(() => {
    const fetchPerformanceTypes = async () => {
      const employeeNo = Cookies.get("employee_no");
      if (!employeeNo) return;

      try {
        const response = await fetch(
          `${API_URL}/v1/hris/performance/performance-by-supervisor?employee_no=${employeeNo}`
        );
        const result = await response.json();
        if (result.success && result.data) {
          const options = [
            {
              label: result.data.performance_type_name,
              value: result.data.performance_type_name,
            },
          ];
          setPerformanceTypes(options);
        }
      } catch (error) {
        console.error("Error fetching performance types:", error);
      }
    };

    fetchPerformanceTypes();
  }, []);

  const cards = [
    {
      title: "Monthly Performance",
      count: counts.monthly_count,
      label: "Assigned Employees",
      bgColor: "bg-blue-50",
      iconBg: "border-blue-400",
      icon: <FaRegUser className="text-blue-500 text-2xl" />,
      route: "/view-performance",
      type: "monthly",
    },
    {
      title: "Yearly 1st Performance",
      count: counts.yearly_april_count,
      label: "Assigned Employees",
      bgColor: "bg-blue-50",
      iconBg: "border-blue-400",
      icon: <FaRegUser className="text-blue-500 text-2xl" />,
      route: "/view-performance",
      type: "year_april",
    },
    {
      title: "Yearly 2nd Performance",
      count: counts.yearly_december_count,
      label: "Salary Components",
      bgColor: "bg-blue-50",
      iconBg: "border-blue-400",
      icon: <FaRegUser className="text-blue-500 text-2xl" />,
      route: "/view-performance",
      type: "year_december",
    },
    {
      title: "End Of FTC",
      count: counts.ftc_count,
      label: "Salary Components",
      bgColor: "bg-blue-50",
      iconBg: "border-blue-400",
      icon: <FaRegUser className="text-blue-500 text-2xl" />,
      route: "/view-performance",
      type: "ftc",
    },
    {
      title: "End of Probation",
      count: counts.probation_count,
      label: "Salary Components",
      bgColor: "bg-blue-50",
      iconBg: "border-blue-400",
      icon: <FaRegUser className="text-blue-500 text-2xl" />,
      route: "/view-performance",
      type: "probation",
    },
  ];

  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisor1, setSelectedSupervisor1] = useState(null);
  const [selectedSupervisor2, setSelectedSupervisor2] = useState(null);
  const [supervisorCount, setSupervisorCount] = useState("1");
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [performanceTypes, setPerformanceTypes] = useState([]);
  const [showModalStep1, setShowModalStep1] = useState(false);
  const [showModalStep2, setShowModalStep2] = useState(false);
  const [showModalStep3, setShowModalStep3] = useState(false);
  const [customFields, setCustomFields] = useState([]);
  const [newFieldName, setNewFieldName] = useState("");
  const [showAddFieldInput, setShowAddFieldInput] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    workflow: "",
    startFrom: "",
  });
  const [feedback, setFeedback] = useState({
    open: false,
    type: "",
    message: "",
  });
  const token = Cookies.get("accessToken");

  // Handles input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    const fetchDepartmentsAndDesignations = async () => {
      try {
        const response = await fetch(
          `${API_URL}/v1/hris/designations/getdesignation`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const result = await response.json();

        if (Array.isArray(result)) {
          const options = result.map((item) => ({
            value: item.id,
            label: `${item.department} - ${item.designation}`,
          }));
          setDepartmentOptions(options);
        }
      } catch (error) {
        console.error("Failed to fetch designations:", error);
      }
    };

    fetchDepartmentsAndDesignations();
  }, []);

  useEffect(() => {
    const fetchEmployeeTypes = async () => {
      try {
        const response = await fetch(`${API_URL}/v1/hris/employmentType/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const result = await response.json();

        if (result.success) {
          const options = result.data.map((item) => ({
            value: item.id,
            label: item.type_name,
          }));
          setEmployeeTypes(options);
        }
      } catch (error) {
        console.error("Failed to fetch employee types:", error);
      }
    };

    fetchEmployeeTypes();
  }, []);

  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        const response = await fetch(
          `${API_URL}/v1/hris/employees/getemployeebasicdetails`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const result = await response.json();
        if (Array.isArray(result)) {
          const options = result.map((emp) => ({
            label: emp.employee_fullname,
            value: emp.employee_no,
            full: emp,
          }));
          setSupervisors(options);
        }
      } catch (error) {
        console.error("Failed to fetch supervisors:", error);
      }
    };

    fetchSupervisors();
  }, []);

  const handleSubmit = async () => {
    const payload = {
      name: formData.name,
      evaluation_type: formData.type,
      start_from: formData.startFrom,
      //  Correct supervisor_id values from selectedSupervisor.value
      supervisors: [
        ...(selectedSupervisor1 ? [selectedSupervisor1.value] : []),
        ...(selectedSupervisor2 ? [selectedSupervisor2.value] : []),
      ],

      employee_types: formData.employeeTypes?.map((type) => type.value) || [],
      department_designations:
        selectedDepartments?.map((d) => ({ id: d.value })) || [],
      criteria: customFields,
    };

    try {
      const response = await fetch(
        `${API_URL}/v1/hris/performance/performance-type`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (result.success) {
        setFeedback({
          open: true,
          type: "success",
          message:
            result.message || "Performance evaluation created successfully!",
        });
        setShowModalStep3(false);
      } else {
        setFeedback({
          open: true,
          type: "error",
          message: result.message || "Something went wrong.",
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
      setFeedback({
        open: true,
        type: "error",
        message: "An unexpected error occurred.",
      });
    }
  };

  useEffect(() => {
    const fetchPerformanceCounts = async () => {
      const employeeNo = Cookies.get("employee_no");
      if (!employeeNo) return;

      try {
        const response = await fetch(
          `${API_URL}/v1/hris/performance/performance-by-supervisor-counts?employee_no=${employeeNo}`
        );
        const result = await response.json();

        if (result.success && result.data) {
          setCounts(result.data);
        }
      } catch (error) {
        console.error("Error fetching performance counts:", error);
      }
    };

    fetchPerformanceCounts();
  }, []);

  return (
    <div className="mx-5 mt-5 font-montserrat">
      <div className="flex items-center justify-between">
        <p className="text-[24px] font-semibold mb-5">
          Performance / Performance Evaluation
        </p>
        <button
          className="border border-black font-semibold rounded-lg p-2 text-black"
          onClick={() => setShowModalStep1(true)}
        >
          Create Performance
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-5 shadow-lg p-4 rounded-md">
        {cards.map((card, index) => (
          <div
            key={index}
            className="rounded-lg border shadow-md p-6 flex flex-col cursor-pointer"
          >
            <div className={`${card.bgColor} p-5 rounded-lg`}>
              <div
                className={`flex items-center justify-center border-dashed border-2 rounded-full h-16 w-16 mx-auto mb-4 ${card.iconBg}`}
              >
                {card.icon}
              </div>
            </div>
            <h3 className="text-center font-semibold text-lg mb-2">
              {card.title}
            </h3>
            <div className="text-center text-gray-500 mb-4 flex gap-4 items-center">
              <div className="bg-blue-100 text-blue-500 p-2 rounded-md ">
                <BsBox className="w-5 h-5" />
              </div>
              <div className="text-left mt-4">
                <span className="block font-bold">{card.count}</span>
                <p className="text-orange-400">Performance</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`${card.route}?type=${card.type}`)}
              className="mt-auto bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600"
            >
              View
            </button>
          </div>
        ))}
      </div>

      {/* STEP 1 - Modal */}
      {showModalStep1 && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[750px] relative">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setShowModalStep1(false)}
            >
              ✕
            </button>

            {/* Header */}
            <div className="border-b pb-3">
              <h2 className="text-blue-500 text-xl font-bold">
                Create Performance
              </h2>
            </div>

            {/* Form Fields */}
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-600">Name</label>
                  <CreatableSelect
                    options={performanceTypes}
                    value={
                      performanceTypes.find(
                        (opt) => opt.value === formData.name
                      ) ||
                      (formData.name && {
                        label: formData.name,
                        value: formData.name,
                      })
                    }
                    onChange={(selected) =>
                      setFormData({
                        ...formData,
                        name: selected ? selected.value : "",
                      })
                    }
                    className="mt-1"
                    classNamePrefix="react-select"
                    placeholder="Select or type performance name"
                  />
                </div>
                <div>
                  <label className="text-gray-600">Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-lg p-2 w-full mt-1"
                  >
                    <option value="">Select type</option>
                    <option value="Monthly Performance">
                      Monthly Performance
                    </option>
                    <option value="Yearly | April">
                      Yearly 1st | Annual Appraisal
                    </option>
                    <option value="Yearly | December">
                      Yearly 2nd | Bi-Annual
                    </option>
                    <option value="End of Probation">End of Probation</option>
                    <option value="End Of FTC">End Of FTC</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-600">Start From</label>
                <select
                  name="startFrom"
                  value={formData.startFrom}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-lg p-2 w-full mt-1"
                >
                  <option value="">Select type</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
            </div>

            {/* Footer - Navigation */}
            <div className="flex justify-end mt-6">
              <button
                className="bg-blue-500 text-white p-2 rounded-lg flex items-center gap-2"
                onClick={() => {
                  setShowModalStep1(false);
                  setShowModalStep2(true);
                }}
              >
                Next <IoIosArrowRoundForward />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 - Modal */}
      {showModalStep2 && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[750px] relative">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setShowModalStep2(false)}
            >
              ✕
            </button>

            {/* Header */}
            <div className="border-b pb-3">
              <h2 className="text-blue-500 text-xl font-bold">
                Create Performance
              </h2>
            </div>

            {/* Form Fields */}
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-600">Employee Type</label>
                  <Select
                    isMulti
                    options={employeeTypes}
                    value={formData.employeeTypes}
                    onChange={(selectedOptions) =>
                      setFormData({
                        ...formData,
                        employeeTypes: selectedOptions,
                      })
                    }
                    className="mt-1"
                    classNamePrefix="react-select"
                    placeholder="Select employee types"
                  />
                </div>

                <div>
                  <label className="text-gray-600">Supervisors Count</label>
                  <select
                    className="border border-gray-300 rounded-lg p-2 w-full mt-1"
                    value={supervisorCount}
                    onChange={(e) => setSupervisorCount(e.target.value)}
                  >
                    <option value="1">Supervisor 1</option>
                    <option value="2">Supervisor 2</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-600">
                    Department & Designation
                  </label>
                  <Select
                    isMulti
                    options={departmentOptions}
                    value={selectedDepartments}
                    onChange={(selected) => setSelectedDepartments(selected)}
                    className="mt-1"
                    classNamePrefix="react-select"
                    placeholder="Select departments and designations"
                  />
                </div>

                {supervisorCount >= "1" && (
                  <div>
                    <label className="text-gray-600">Supervisor 01</label>
                    <Select
                      options={supervisors}
                      value={selectedSupervisor1}
                      onChange={(selected) => setSelectedSupervisor1(selected)}
                      className="mt-1"
                      classNamePrefix="react-select"
                      placeholder="Select supervisor 01"
                    />
                  </div>
                )}

                {supervisorCount >= "2" && (
                  <div>
                    <label className="text-gray-600">Supervisor 02</label>
                    <Select
                      options={supervisors}
                      value={selectedSupervisor2}
                      onChange={(selected) => setSelectedSupervisor2(selected)}
                      className="mt-1"
                      classNamePrefix="react-select"
                      placeholder="Select supervisor 02"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer - Navigation */}
            <div className="flex justify-end mt-6">
              <button
                className="bg-gray-300 text-black p-2 rounded-lg mr-2"
                onClick={() => {
                  setShowModalStep2(false);
                  setShowModalStep1(true);
                }}
              >
                Previous
              </button>

              <button
                className="bg-blue-500 text-white p-2 rounded-lg flex items-center gap-2"
                onClick={() => {
                  setShowModalStep2(false);
                  setShowModalStep3(true);
                }}
              >
                Next <IoIosArrowRoundForward />
              </button>
            </div>
          </div>
        </div>
      )}

      {showModalStep3 && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[750px] relative">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setShowModalStep3(false)}
            >
              ✕
            </button>

            {/* Header */}
            <div className="border-b pb-3">
              <h2 className="text-blue-500 text-xl font-bold">
                Create Performance
              </h2>
            </div>

            <div className="flex justify-end">
              {!showAddFieldInput ? (
                <button
                  onClick={() => setShowAddFieldInput(true)}
                  className="flex items-center gap-2 shadow-md rounded-md p-3 mt-3 border"
                >
                  <CiCirclePlus />
                  Add Field
                </button>
              ) : (
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="text"
                    className="border p-2 rounded-md"
                    placeholder="Enter label name"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                  />
                  <button
                    className="bg-blue-500 text-white px-3 py-2 rounded-md"
                    onClick={() => {
                      if (newFieldName.trim() !== "") {
                        setCustomFields([...customFields, newFieldName]);
                        setNewFieldName("");
                        setShowAddFieldInput(false);
                      }
                    }}
                  >
                    Save
                  </button>
                  <button
                    className="text-red-500 px-2 py-2 rounded-md"
                    onClick={() => {
                      setNewFieldName("");
                      setShowAddFieldInput(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {customFields.length > 0 && (
              <div className="mt-4 space-y-4">
                {customFields.map((field, index) => (
                  <div key={index}>
                    <label className="text-gray-600">{field}</label>
                    <input className="border border-gray-300 rounded-lg p-2 w-full mt-1" />
                  </div>
                ))}
              </div>
            )}

            {/* Footer - Navigation */}
            <div className="flex justify-end mt-6">
              <button
                className="bg-gray-300 text-black p-2 rounded-lg mr-2"
                onClick={() => {
                  setShowModalStep3(false);
                  setShowModalStep2(true);
                }}
              >
                Previous
              </button>

              <button
                className="bg-blue-500 text-white p-2 rounded-lg flex items-center gap-2"
                onClick={handleSubmit}
              >
                Submit <IoIosArrowRoundForward />
              </button>
            </div>
          </div>
        </div>
      )}

      {feedback.open && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
          <div
            className="bg-white rounded-xl shadow-2xl px-6 py-5 w-[400px] max-w-[90%] text-center border-t-4"
            style={{
              borderColor: feedback.type === "success" ? "#22c55e" : "#ef4444",
            }}
          >
            <h2
              className={`text-lg font-semibold mb-2 ${
                feedback.type === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {feedback.type === "success" ? "Success" : "Error"}
            </h2>
            <p className="text-gray-700 mb-4">{feedback.message}</p>
            <button
              onClick={() => setFeedback({ ...feedback, open: false })}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Performance_Evaluation_Nav;
