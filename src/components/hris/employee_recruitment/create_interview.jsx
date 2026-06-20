/** @format */

import React, { useState, useRef, useEffect } from "react";
import Job_Img from "../../../assets/img-job.png";
import { SlLayers } from "react-icons/sl";
import { IoClose, IoChevronBackSharp } from "react-icons/io5";
import { FiSettings } from "react-icons/fi";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

const Create_Interview = () => {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [stages, setStages] = useState([
    {
      id: 1,
      name: "",
      interviewers: [],
      markingScheme: [{ id: 1, criteria: "" }],
      availableSlots: [{ id: 1, date: "", time1: "", time2: "" }],
    },
  ]);
  const [interviewProcessName, setInterviewProcessName] = useState("");
  const [employees, setEmployees] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const settingsRef = useRef(null);
  const handleOpenPopup = () => setShowPopup(true);
  const handleClosePopup = () => setShowPopup(false);
  const handleToggleSettings = () => setShowSettings(!showSettings);
  const [interviewProcesses, setInterviewProcesses] = useState([]);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const token = Cookies.get("accessToken");

  // Fetch employees when popup is opened
  useEffect(() => {
    if (showPopup) {
      fetchEmployees();
    }
  }, [showPopup]);

  // Close settings box when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch employees from API
  const fetchEmployees = async () => {
    setIsLoadingEmployees(true);
    try {
      const response = await fetch(`${API_URL}/v1/hris/jobpost/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setEmployees(result.data);
        } else {
          console.error("Invalid employee data format:", result);
        }
      } else {
        console.error("Failed to fetch employees");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  // Add a new stage
  const handleAddStage = () => {
    const newStage = {
      id: Date.now(),
      name: "",
      interviewers: [],
      markingScheme: [{ id: 1, criteria: "" }],
      availableSlots: [{ id: 1, date: "", time1: "", time2: "" }],
    };
    setStages([...stages, newStage]);
  };

  // Update stage name
  const handleStageNameChange = (id, value) => {
    const updatedStages = stages.map((stage) =>
      stage.id === id ? { ...stage, name: value } : stage
    );
    setStages(updatedStages);
  };

  // Add a new date field to a stage
  const handleAddDate = (stageId) => {
    const updatedStages = stages.map((stage) =>
      stage.id === stageId
        ? {
            ...stage,
            availableSlots: [
              ...stage.availableSlots,
              { id: Date.now(), date: "", time1: "", time2: "" },
            ],
          }
        : stage
    );
    setStages(updatedStages);
  };

  // Remove a date field from a stage
  const handleRemoveDate = (stageId, dateId) => {
    const updatedStages = stages.map((stage) =>
      stage.id === stageId
        ? {
            ...stage,
            availableSlots: stage.availableSlots.filter(
              (slot) => slot.id !== dateId
            ),
          }
        : stage
    );
    setStages(updatedStages);
  };

  // Add a new criteria field to a stage
  const handleAddCriteria = (stageId) => {
    const updatedStages = stages.map((stage) =>
      stage.id === stageId
        ? {
            ...stage,
            markingScheme: [
              ...stage.markingScheme,
              { id: Date.now(), criteria: "" },
            ],
          }
        : stage
    );
    setStages(updatedStages);
  };

  // Remove a criteria field from a stage
  const handleRemoveCriteria = (stageId, criteriaId) => {
    const updatedStages = stages.map((stage) =>
      stage.id === stageId
        ? {
            ...stage,
            markingScheme: stage.markingScheme.filter(
              (criteria) => criteria.id !== criteriaId
            ),
          }
        : stage
    );
    setStages(updatedStages);
  };

  const handleSubmit = async () => {
    const createdBy = getEmployeeNoFromCookies();

    if (!createdBy) {
      alert("Error: Employee number not found in cookies.");
      return;
    }

    const payload = {
      name: interviewProcessName,
      createdBy,
      stages: stages.map((stage) => ({
        name: stage.name,
        interviewers: stage.interviewers.map((i) => i.value),
        markingScheme: stage.markingScheme.map((criteria) => ({
          criteria: criteria.criteria,
        })),
        availableSlots: stage.availableSlots.map((slot) => ({
          date: slot.date,
          time: slot.time1,
        })),
      })),
    };

    try {
      const response = await fetch(
        `${API_URL}/v1/hris/interviewprocess/interview-process`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        alert("Interview process created successfully!");
        handleClosePopup();

        // 🔁 Immediately fetch the updated list after POST
        fetchInterviewProcesses();
      } else {
        alert("Failed to create interview process.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while creating the interview process.");
    }
  };

  const getEmployeeNoFromCookies = () => {
    const cookies = document.cookie.split("; "); // Split cookies into an array
    const empCookie = cookies.find((cookie) =>
      cookie.startsWith("employee_no=")
    ); // Find the employee_no cookie
    return empCookie ? empCookie.split("=")[1] : null; // Extract value or return null
  };

  // Function to handle interviewers selection
  const handleInterviewersChange = (id, selectedOptions) => {
    setStages((prevStages) =>
      prevStages.map((stage) =>
        stage.id === id
          ? {
              ...stage,
              interviewers: selectedOptions, // Store full objects instead of just IDs
            }
          : stage
      )
    );
  };

  useEffect(() => {
    fetchInterviewProcesses();
  }, []);

  const fetchInterviewProcesses = async () => {
    try {
      const response = await fetch(
        `${API_URL}/v1/hris/interviewprocess/interview-process`
      );
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setInterviewProcesses(result.data);
        } else {
          console.error("Invalid interview process data format:", result);
        }
      } else {
        console.error("Failed to fetch interview processes");
      }
    } catch (error) {
      console.error("Error fetching interview processes:", error);
    }
  };

  return (
    <div className="mx-10 mt-5">
      <p className="text-[22px]">
        Employee Recruitment Settings / Interview Process /
        <span className="font-semibold"> Create interview</span>
      </p>

      <div className="flex items-center justify-between mt-8">
        <p className="text-[18px] font-semibold">Created Interview Process</p>
        <button
          onClick={handleOpenPopup}
          className="border border-black p-2 rounded-md"
        >
          Create New Interview Process
        </button>
      </div>

      <div className="grid grid-flow-row grid-cols-4 gap-7 mt-6">
        {interviewProcesses.map((process) => (
          <div
            key={process.id}
            className="bg-white shadow-lg rounded-2xl p-6 w-96"
          >
            <div className="flex justify-center">
              <img
                src={Job_Img}
                alt="Job Illustration"
                className="w-full h-40 object-cover rounded-lg"
              />
            </div>

            <div className="mt-4">
              <h2 className="text-lg font-semibold text-gray-800 capitalize">
                {process.name}
              </h2>
            </div>

            <div className="flex gap-2 mt-3">
              <span className="bg-blue-100 text-blue-600 text-xs px-3 py-1 rounded-lg">
                {process.status}
              </span>
            </div>

            <div className="flex items-center space-x-3 mt-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <SlLayers className="text-blue-500 text-lg" />
              </div>
              <div>
                <p className="text-gray-700 font-medium text-lg">
                  {process.stagesCount}
                </p>
                <span className="text-gray-500 text-sm">
                  Interview Selection Stages
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4 justify-between">
              {/* Show Remove button only if the process is "Not Assigned" */}
              {process.status === "Not Assigned" && (
                <button className="w-full border border-blue-400 text-blue-400 py-3 rounded-lg font-semibold">
                  Remove
                </button>
              )}

              {/* View button always visible */}
              <button
                className="w-full text-white bg-blue-500 py-3 rounded-lg font-semibold"
                onClick={() =>
                  navigate("/view-created-interviews", {
                    state: { id: process.id, name: process.name },
                  })
                }
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>
      {showPopup && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-[700px] h-[80vh] p-6 relative overflow-y-auto overflow-x-hidden">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-gray-600">
                <IoChevronBackSharp
                  className="text-xl cursor-pointer"
                  onClick={handleClosePopup}
                />
                <span className="text-lg font-semibold">
                  Creating an Interview Process
                </span>
              </div>
              <button
                onClick={handleClosePopup}
                className="text-gray-500 hover:text-gray-700"
              >
                <IoClose className="text-2xl" />
              </button>
            </div>

            <div className="mt-4">
              <label className="block text-gray-600">
                Interview Process Name
              </label>
              <input
                type="text"
                className="w-full border p-2 rounded-md mt-1"
                value={interviewProcessName}
                onChange={(e) => setInterviewProcessName(e.target.value)}
              />

              {/* Render each stage */}
              {stages.map((stage, index) => (
                <div key={stage.id} className="mt-5 p-4 border rounded-lg">
                  <div className="flex justify-between">
                    <label className="font-semibold text-gray-700">
                      Stage {index + 1} Name
                    </label>
                    <IoClose
                      className="text-gray-500 cursor-pointer"
                      onClick={() => {
                        if (stages.length > 1) {
                          setStages(stages.filter((s) => s.id !== stage.id));
                        }
                      }}
                    />
                  </div>
                  <input
                    type="text"
                    className="w-full border p-2 rounded-md mt-1"
                    value={stage.name}
                    onChange={(e) =>
                      handleStageNameChange(stage.id, e.target.value)
                    }
                  />

                  {/* Dynamic Date Fields */}
                  {stage.availableSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="grid grid-cols-3 gap-4 mt-3 items-center"
                    >
                      <div>
                        <label className="text-gray-600">Available Date</label>
                        <input
                          type="date"
                          className="w-full border p-2 rounded-md"
                          value={slot.date}
                          onChange={(e) => {
                            const updatedStages = stages.map((s) =>
                              s.id === stage.id
                                ? {
                                    ...s,
                                    availableSlots: s.availableSlots.map((a) =>
                                      a.id === slot.id
                                        ? { ...a, date: e.target.value }
                                        : a
                                    ),
                                  }
                                : s
                            );
                            setStages(updatedStages);
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-gray-600">
                          Available Time 1
                        </label>
                        <input
                          type="time"
                          className="w-full border p-2 rounded-md"
                          value={slot.time1}
                          onChange={(e) => {
                            const updatedStages = stages.map((s) =>
                              s.id === stage.id
                                ? {
                                    ...s,
                                    availableSlots: s.availableSlots.map((a) =>
                                      a.id === slot.id
                                        ? { ...a, time1: e.target.value }
                                        : a
                                    ),
                                  }
                                : s
                            );
                            setStages(updatedStages);
                          }}
                        />
                      </div>
                      <div className="flex items-center">
                        <div className="w-full">
                          <label className="text-gray-600">
                            Available Time 2
                          </label>
                          <input
                            type="time"
                            className="w-full border p-2 rounded-md"
                            value={slot.time2}
                            onChange={(e) => {
                              const updatedStages = stages.map((s) =>
                                s.id === stage.id
                                  ? {
                                      ...s,
                                      availableSlots: s.availableSlots.map(
                                        (a) =>
                                          a.id === slot.id
                                            ? { ...a, time2: e.target.value }
                                            : a
                                      ),
                                    }
                                  : s
                              );
                              setStages(updatedStages);
                            }}
                          />
                        </div>
                        {stage.availableSlots.length > 1 && (
                          <button
                            onClick={() => handleRemoveDate(stage.id, slot.id)}
                            className="text-red-500 ml-2 mt-6"
                          >
                            ❌
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="mt-3">
                    <label className="block text-gray-600 mb-1">
                      Interviewers
                    </label>
                    <Select
                      isMulti
                      options={employees.map((employee) => ({
                        value: employee.employee_no,
                        label: `${employee.employee_calling_name} (${employee.employee_no})`,
                      }))}
                      value={stage.interviewers}
                      onChange={(selectedOptions) =>
                        handleInterviewersChange(stage.id, selectedOptions)
                      }
                      className="w-full"
                    />

                    {stage.interviewers.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          Selected Interviewers:
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {stage.interviewers.map((interviewer) => (
                            <div
                              key={interviewer.value}
                              className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center"
                            >
                              {interviewer.label}
                              <button
                                className="ml-2 text-blue-800"
                                onClick={() => {
                                  handleInterviewersChange(
                                    stage.id,
                                    stage.interviewers.filter(
                                      (i) => i.value !== interviewer.value
                                    )
                                  );
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dynamic Criteria Fields */}
                  <div className="mt-3">
                    <label className="text-gray-600">Marking Scheme</label>
                    {stage.markingScheme.map((criteria) => (
                      <div key={criteria.id} className="flex items-center mt-2">
                        <input
                          type="text"
                          className="w-full border p-2 rounded-md"
                          placeholder="Criteria Name"
                          value={criteria.criteria}
                          onChange={(e) => {
                            const updatedStages = stages.map((s) =>
                              s.id === stage.id
                                ? {
                                    ...s,
                                    markingScheme: s.markingScheme.map((m) =>
                                      m.id === criteria.id
                                        ? { ...m, criteria: e.target.value }
                                        : m
                                    ),
                                  }
                                : s
                            );
                            setStages(updatedStages);
                          }}
                        />
                        {stage.markingScheme.length > 1 && (
                          <button
                            onClick={() =>
                              handleRemoveCriteria(stage.id, criteria.id)
                            }
                            className="text-red-500 ml-2"
                          >
                            ❌
                          </button>
                        )}
                      </div>
                    ))}
                    <textarea
                      className="w-full border p-2 rounded-md mt-2"
                      placeholder="Special note"
                    ></textarea>
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center mt-5 relative">
                <button
                  onClick={handleAddStage}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md"
                >
                  Add Stage
                </button>
                <div className="flex items-center gap-3 relative">
                  <button
                    onClick={handleSubmit}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center gap-2"
                  >
                    Create →
                  </button>
                  <button
                    onClick={handleToggleSettings}
                    className="bg-gray-200 p-2 rounded-full shadow-md hover:bg-gray-300"
                  >
                    <FiSettings className="text-gray-600 text-xl" />
                  </button>

                  {showSettings && (
                    <div
                      ref={settingsRef}
                      className="absolute bottom-[50px] right-0 bg-white shadow-lg rounded-lg p-4 w-48 border z-50"
                    >
                      <p className="text-gray-700 font-semibold mb-2">
                        Settings
                      </p>
                      <button
                        onClick={() =>
                          handleAddDate(stages[stages.length - 1].id)
                        }
                        className="w-full text-left text-gray-600 py-1 hover:bg-gray-100 px-2 rounded"
                      >
                        Add Date
                      </button>
                      <button
                        onClick={() =>
                          handleAddCriteria(stages[stages.length - 1].id)
                        }
                        className="w-full text-left text-gray-600 py-1 hover:bg-gray-100 px-2 rounded"
                      >
                        Add Criteria
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Create_Interview;
