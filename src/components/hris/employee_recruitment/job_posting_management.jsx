/** @format */

import React, { useState, useEffect } from "react";
import { AiOutlineClose } from "react-icons/ai"; // Import close icon
import Collect_Job_Details from "./collect_job_details"; // Import Collect_Job_Details component
import View_Job_Details from "./view_job_details";
import Empty_Img from "../../../assets/empty.png";
import usePermissions from "../../permissions/permission";
import Cookies from "js-cookie";

const TruncatedDescription = ({ description }) => {
  const words = description?.split(" ") || [];
  const [showFull, setShowFull] = useState(false);
  const displayText = showFull ? description : words.slice(0, 8).join(" ");

  return (
    <div className="mt-3 text-sm mb-5">
      <span className="text-gray-700">{displayText}</span>
      {words.length > 8 && (
        <button
          onClick={() => setShowFull(!showFull)}
          className="ml-2 inline-block text-xs px-2 py-[2px] border border-blue-400 text-blue-600 rounded-full hover:bg-blue-100 transition duration-200"
        >
          {showFull ? "View Less" : "View More"}
        </button>
      )}
    </div>
  );
};

const JobPostingManagement = () => {
  const [rejectedJobs, setRejectedJobs] = useState([]);
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false);
  const [isApprovalSuccessPopupOpen, setIsApprovalSuccessPopupOpen] =
    useState(false);
  const [selectedJobIdForView, setSelectedJobIdForView] = useState(null);
  const { hasPermission } = usePermissions();
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const token = Cookies.get("accessToken");

  useEffect(() => {
    fetchRejectedJobs();
  }, []);

  const fetchRejectedJobs = async () => {
    const employeeNumber = getCookie("employee_no"); // Retrieve employee_no from cookies

    if (!employeeNumber) {
      console.error("Employee number is missing. Cannot fetch rejected jobs.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/v1/hris/jobpost/get-reject-jobposts`
      );
      const data = await response.json();

      if (data.success) {
        setRejectedJobs(data.data); //  Store rejected jobs
      } else {
        console.error("Failed to fetch rejected jobs.");
      }
    } catch (error) {
      console.error("Error fetching rejected job posts:", error);
    }
  };

  const [pendingJobs, setPendingJobs] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetchPendingJobs();
  }, []);

  const fetchPendingJobs = async () => {
    const employeeNumber = getCookie("employee_no"); // Retrieve from cookies

    if (!employeeNumber) {
      console.error("Employee number is missing. Cannot fetch jobs.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/v1/hris/jobpost/pending_jobs`);
      const data = await response.json();

      if (data.success) {
        setPendingJobs(data.data); //  Store updated pending jobs list
      } else {
        console.error("Failed to fetch pending jobs.");
      }
    } catch (error) {
      console.error("Error fetching pending job posts:", error);
    }
  };

  // Call fetch function in useEffect
  useEffect(() => {
    fetchPendingJobs();
  }, []);

  const [formData, setFormData] = useState({
    jobTitle: "",
    department: "",
    employmentType: "",
    reasonForRequisition: "",
    description: "",
    budgetStart: "",
    budgetEnd: "",
    supervisorOne: "",
    supervisorTwo: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
  const [activeTab, setActiveTab] = useState("Pending"); // Active tab state
  const [isViewJobDetailsOpen, setIsViewJobDetailsOpen] = useState(false);
  const [isCollectJobDetailsOpen, setIsCollectJobDetailsOpen] = useState(false);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState(null);
  const [completedJobs, setCompletedJobs] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value, // This will store the employment type ID
    }));
  };

  const [statusCounts, setStatusCounts] = useState({
    approved: 0,
    reject: 0,
    pending: 0,
  });

  useEffect(() => {
    fetchStatusCounts();
  }, []);

  const fetchStatusCounts = async () => {
    const employeeNumber = getCookie("employee_no"); // Retrieve employee_no from cookies

    if (!employeeNumber) {
      console.error("Employee number is missing. Cannot fetch status counts.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/v1/hris/jobpost/job_statuscounts`
      );
      const data = await response.json();

      if (data.success) {
        setStatusCounts(data.data);
      } else {
        console.error("Failed to fetch status counts.");
      }
    } catch (error) {
      console.error("Error fetching status counts:", error);
    }
  };

  useEffect(() => {
    fetchStatusCounts();
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const [approvedJobs, setApprovedJobs] = useState([]);
  useEffect(() => {
    fetchApprovedJobs();
  }, []);

  const fetchApprovedJobs = async () => {
    const employeeNumber = getCookie("employee_no"); // Retrieve from cookies

    if (!employeeNumber) {
      console.error("Employee number is missing. Cannot fetch jobs.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/v1/hris/jobpost/get-jobpost-approved`
      );
      const data = await response.json();

      if (data.success) {
        setApprovedJobs(data.data); // Store approved jobs
      } else {
        console.error("Failed to fetch approved jobs.");
      }
    } catch (error) {
      console.error("Error fetching approved job posts:", error);
    }
  };

  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch(
          `${API_URL}/v1/hris/designations/getdesignation`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();
        const uniqueDepartments = Array.from(
          new Map(data.map((item) => [item.department, item])).values()
        );
        setDepartments(uniqueDepartments);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch(`${API_URL}/v1/hris/jobpost/employees`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (data.success) {
          setEmployees(data.data);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    const token = Cookies.get("accessToken");
    const fetchEmploymentTypes = async () => {
      try {
        const response = await fetch(`${API_URL}/v1/hris/employmentType/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setEmploymentTypes(data.data);
        }
      } catch (error) {
        console.error("Error fetching employment types:", error);
      }
    };

    fetchEmploymentTypes();
  }, []);

  const handleSubmit = async () => {
    const jobData = {
      title: formData.jobTitle,
      departmentId: formData.department ? parseInt(formData.department) : null,
      employmentTypeId: formData.employmentType
        ? parseInt(formData.employmentType)
        : null,
      location: formData.location ? formData.location : null,
      city: formData.city ? formData.city : null,
      country: formData.country ? formData.country : null,
      description: formData.description,
      salaryRange: `${formData.budgetStart}-${formData.budgetEnd}`,
      approved_one_employee: formData.supervisorOne,
      approved_two_employee: formData.supervisorTwo,
      reason: formData.reasonForRequisition,
      jobtype: formData.jobType,
    };

    try {
      const response = await fetch(`${API_URL}/v1/hris/jobpost/add-jobpost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobData),
      });

      const data = await response.json();

      if (data.success) {
        setIsModalOpen(false);
        setIsSuccessPopupOpen(true);

        fetchPendingJobs();
        fetchStatusCounts();

        setTimeout(() => {
          setIsSuccessPopupOpen(false);
        }, 3000);

        setFormData({
          jobTitle: "",
          department: "",
          employmentType: "",
          reasonForRequisition: "",
          description: "",
          budgetStart: "",
          budgetEnd: "",
          supervisorOne: "",
          supervisorTwo: "",
          location: "",
          city: "",
          country: "",
          jobType: "",
        });
      } else {
        alert("Error creating job post");
      }
    } catch (error) {
      console.error("Error creating job post:", error);
      alert("Error creating job post");
    }
  };

  const approveJob = async (jobId) => {
    const employeeNumber = getCookie("employee_no"); // Retrieve employee_no from cookies

    if (!employeeNumber) {
      console.error("Employee number is missing. Please log in again.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/v1/hris/jobpost/update_approval_status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ jobId, employeeNumber }), // Send job ID & employee number
        }
      );

      const data = await response.json();
      if (data.success) {
        setIsConfirmOpen(false);
        setIsApprovalSuccessPopupOpen(true);

        fetchPendingJobs();

        setTimeout(() => {
          setIsApprovalSuccessPopupOpen(false);
        }, 3000);
      } else {
        console.error("Error approving job");
      }
    } catch (error) {
      console.error("Error approving job:", error);
    }
  };

  const getCookie = (name) => {
    const cookies = document.cookie.split("; ");
    for (let cookie of cookies) {
      const [key, value] = cookie.split("=");
      if (key === name) return value;
    }
    return null;
  };

  const handleRejectClick = (job) => {
    setSelectedJob(job);
    setIsRejectOpen(true);
  };

  const rejectJob = async (jobId, message) => {
    const employeeNumber = getCookie("employee_no"); // Retrieve employee_no from cookies

    if (!employeeNumber) {
      alert("Employee number is missing. Please log in again.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/v1/hris/jobpost/reject_job`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId, employeeNumber, rejectReason: message }), // Send job ID, employee number & reason
      });

      const data = await response.json();
      if (data.success) {
        alert("Job rejected successfully!");
        fetchPendingJobs(); // Refresh pending jobs list
      } else {
        alert("Error rejecting job");
      }
    } catch (error) {
      console.error("Error rejecting job:", error);
      alert("Error rejecting job");
    }
  };

  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectMessage, setRejectMessage] = useState("");

  const renderEmptyState = (message) => (
    <div className="flex flex-col items-center justify-center w-full h-80 col-span-3 mt-4">
      <img
        src={Empty_Img}
        alt="No jobs available"
        className="w-80 h-80 mx-auto mt-9"
      />
      <p className="text-gray-500 mt-3 text-lg">{message}</p>
    </div>
  );

  useEffect(() => {
    fetchCompletedJobs();
  }, []);

  useEffect(() => {
    fetchCompletedJobs();
  }, []);

  const fetchCompletedJobs = async () => {
    try {
      const response = await fetch(
        `${API_URL}/v1/hris/jobpost/get-completed-jobposts`
      );
      const data = await response.json();

      if (data.success) {
        setCompletedJobs(data.data);
      } else {
        console.error("Failed to fetch completed jobs.");
      }
    } catch (error) {
      console.error("Error fetching completed job posts:", error);
    }
  };

  const updateJobStatus = async (jobId, newStatus) => {
    try {
      const response = await fetch(
        `${API_URL}/v1/hris/jobpost/update-jobpost-isActive/${jobId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive: newStatus }), // Send new status (0 or 1)
        }
      );

      const data = await response.json();

      if (data.success) {
        alert(`Job status updated successfully!`);
        fetchCompletedJobs(); // Refresh the list after updating
      } else {
        alert("Failed to update job status.");
      }
    } catch (error) {
      console.error("Error updating job status:", error);
      alert("Error updating job status.");
    }
  };

  const renderCards = () => {
    switch (activeTab) {
      case "Pending":
        return (
          <div>
            {hasPermission(1350) && (
              <div className="grid grid-cols-4 gap-4 mt-5">
                {pendingJobs.length > 0
                  ? pendingJobs.map((job) => (
                      <div
                        key={job.id}
                        className="border border-gray-200 shadow-lg p-4 rounded-md"
                      >
                        <p className="text-lg mt-4 mb-4 font-semibold">
                          Pending Job Vacancy - for Approval
                        </p>
                        <div className="">
                          <p className="text-lg font-medium">{job.title}</p>
                          <p className="text-sm"> {job.location}</p>
                          <div className="flex gap-3 items-center">
                            <button className="bg-blue-100 text-blue-500 px-4 py-1 rounded-lg">
                              New Role
                            </button>
                            <button className="bg-purple-100 text-purple-600 px-4 py-1 rounded-lg">
                              Remote
                            </button>
                          </div>
                          <TruncatedDescription
                            description={
                              job.description || "No description provided."
                            }
                          />

                          <p>LKR {job.salaryRange || "(Not specified)"}</p>
                          <hr />
                          <div className="flex items-center space-x-2 mt-3">
                            <div className="bg-orange-400 w-3 h-3 rounded-full mb-4"></div>
                            <p className="text-gray-700">Pending</p>
                          </div>

                          <div className="flex justify-between gap-4 mt-3 items-center">
                            <div>
                              <p>Supervisor 1</p>
                              <p className="text-sm ">
                                {job.approved_one_employee}
                              </p>
                            </div>

                            <div>
                              <p className="text-gray-400 text-[11px]">
                                <p className="text-gray-400 text-[11px]">
                                  <p className="text-gray-400 text-[11px]">
                                    {new Date(job.updatedAt)
                                      .toISOString()
                                      .slice(2, 10)
                                      .replace(/-/g, "/")}
                                  </p>
                                </p>
                              </p>
                              <p className="text-sm text-yellow-400 font-bold text-[11px]">
                                {job.approve_status_one}
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-between gap-4 mt-3 items-center">
                            <div>
                              <p>Supervisor 2</p>
                              <p className="text-sm ">
                                {job.approved_two_employee}
                              </p>
                            </div>

                            <div>
                              <p className="text-gray-400 text-[11px]">{}</p>
                              <p className="text-sm text-yellow-400 font-bold text-[11px]">
                                {job.approve_status_two}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  : renderEmptyState("No pending job posts available.")}
              </div>
            )}
          </div>
        );

      case "Approved":
        return (
          <div>
            {hasPermission(1360) && (
              <div className="grid grid-cols-4 gap-4 mt-5">
                {approvedJobs.length > 0
                  ? approvedJobs.map((job) => (
                      <div
                        key={job.id}
                        className="border border-gray-200 shadow-lg p-4 rounded-md"
                      >
                        <p className="text-lg mt-4 mb-4 font-semibold">
                          Approved Job Vacancy
                        </p>
                        <div>
                          <p className="text-lg font-medium">{job.title}</p>
                          <p className="text-sm"> {job.location}</p>
                          <div className="flex gap-3 items-center">
                            <button className="bg-blue-100 text-blue-500 px-4 py-1 rounded-lg">
                              New Role
                            </button>
                            <button className="bg-purple-100 text-purple-600 px-4 py-1 rounded-lg">
                              {job.jobtype}
                            </button>
                          </div>
                          <TruncatedDescription
                            description={
                              job.description || "No description provided."
                            }
                          />

                          <p>LKR {job.salaryRange || "(Not specified)"}</p>
                          <hr />
                          <div className="flex items-center space-x-2 mt-3">
                            <div className="bg-green-400 w-3 h-3 rounded-full mb-4"></div>
                            <p className="text-gray-700">Approved</p>
                          </div>

                          <div className="flex justify-between gap-4 mt-3 items-center">
                            <div>
                              <p>{job.approved_one_designation}</p>
                              <p className="text-sm ">
                                {job.approved_one_employee}
                              </p>
                            </div>

                            <div>
                              <p className="text-gray-400 text-[11px]">
                                <p className="text-gray-400 text-[11px]">
                                  <p className="text-gray-400 text-[11px]">
                                    {new Date(job.updatedAt)
                                      .toISOString()
                                      .slice(2, 10)
                                      .replace(/-/g, "/")}
                                  </p>
                                </p>
                              </p>
                              <p className="text-sm text-yellow-400 font-bold text-[11px]">
                                {job.approve_status_one}
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-between gap-4 mt-3 items-center">
                            <div>
                              <p>{job.approved_two_designation}</p>
                              <p className="text-sm ">
                                {job.approved_two_employee}
                              </p>
                            </div>

                            <div>
                              <p className="text-gray-400 text-[11px]">{}</p>
                              <p className="text-sm text-yellow-400 font-bold text-[11px]">
                                {job.approve_status_two}
                              </p>
                            </div>
                          </div>

                          {/* Collect Job Details Button */}
                          <button
                            className="border w-full border-blue-400 font-semibold text-blue-400 px-4 py-1 rounded-lg mt-3"
                            onClick={() => {
                              setSelectedJobForDetails({
                                id: job.id,
                                title: job.title,
                              }); // Pass both ID and title
                              setIsCollectJobDetailsOpen(true);
                            }}
                          >
                            Collect Job Details
                          </button>
                        </div>
                      </div>
                    ))
                  : renderEmptyState("No approved job posts available.")}
              </div>
            )}
          </div>
        );

      case "Rejected":
        return (
          <div>
            {hasPermission(1370) && (
              <div className="grid grid-cols-4 gap-4 mt-5">
                {rejectedJobs.length > 0
                  ? rejectedJobs.map((job) => (
                      <div
                        key={job.id}
                        className="border border-gray-200 shadow-lg p-4 rounded-md"
                      >
                        <p className="text-lg mt-4 mb-4 font-semibold">
                          Rejected Job Vacancy
                        </p>
                        <div>
                          <p className="text-lg font-medium">{job.title}</p>
                          <p className="text-sm"> {job.location}</p>
                          <TruncatedDescription
                            description={
                              job.description || "No description provided."
                            }
                          />

                          <p>LKR {job.salaryRange || "(Not specified)"}</p>
                          <hr />
                          <div className="flex items-center space-x-2 mt-3">
                            <div className="bg-red-400 w-3 h-3 rounded-full mb-4"></div>
                            <p className="text-gray-700">Rejected</p>
                          </div>
                        </div>
                      </div>
                    ))
                  : renderEmptyState("No rejected job posts available.")}
              </div>
            )}
          </div>
        );

      case "Completed":
        return (
          <div>
            {hasPermission(1380) && (
              <div className="grid grid-cols-4 gap-4 mt-5">
                {completedJobs.length > 0
                  ? completedJobs.map((job) => (
                      <div
                        key={job.id}
                        className="border border-gray-200 shadow-lg p-4 rounded-md"
                      >
                        <p className="text-lg mt-4 mb-4 font-semibold">
                          Completed Job Vacancy
                        </p>
                        <div>
                          <p className="text-lg font-medium">{job.title}</p>
                          <p className="text-sm">
                            {job.location}, {job.city}, {job.country}
                          </p>

                          <div className="flex gap-3 items-center">
                            <button className="bg-blue-100 text-blue-500 px-4 py-1 rounded-lg">
                              {job.jobtype || "N/A"}
                            </button>
                            <button className="bg-purple-100 text-purple-500 px-4 py-1 rounded-lg">
                              {job.status}
                            </button>
                          </div>

                          <TruncatedDescription
                            description={
                              job.description || "No description provided."
                            }
                          />

                          <p>LKR {job.salaryRange || "(Not specified)"}</p>
                          <hr />

                          <div className="flex items-center space-x-2 mt-3">
                            <div className="bg-blue-400 w-3 h-3 rounded-full mb-4"></div>
                            <p className="text-gray-700">Completed</p>
                          </div>

                          <button
                            className="border border-blue-400 p-2 rounded-lg w-full text-blue-600"
                            onClick={() => {
                              setSelectedJobIdForView(job.id);
                              setIsViewJobDetailsOpen(true);
                            }}
                          >
                            View Job Details
                          </button>

                          <div className="flex justify-between space-x-2 items-center mt-3 bg-blue-300 p-4 rounded-lg">
                            <div>
                              {job.isActive === 1 ? (
                                <button
                                  className="bg-red-500 text-white p-2 rounded-lg w-[150px]"
                                  onClick={() => updateJobStatus(job.id, 0)} // Close job
                                >
                                  Close
                                </button>
                              ) : (
                                <button
                                  className="bg-green-500 text-white p-2 rounded-lg w-[150px]"
                                  onClick={() => updateJobStatus(job.id, 1)} // Re-open job
                                >
                                  Re-open
                                </button>
                              )}
                            </div>

                            <div>
                              <button className="bg-black text-white p-2 rounded-lg">
                                Remove from site
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  : renderEmptyState("No completed job posts available.")}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mx-10 mt-5 font-montserrat">
      {/* Header Section */}
      <div className="flex items-center space-x-3 text-gray-600">
        <span className="text-lg font-semibold">
          Employee Recruitment Settings
        </span>
        <span>/</span>
        <span className="text-lg font-semibold text-gray-800">
          Job Posting & Management
        </span>
      </div>

      <div className="flex justify-between items-center mt-5">
        {/* Status Badges */}
        <div className="flex space-x-6 items-center">
          <div
            className={`border border-gray-300 flex items-center space-x-2 cursor-pointer p-2 rounded-lg ${
              activeTab === "Pending"
                ? "bg-blue-600 text-white"
                : "text-gray-600"
            }`}
            onClick={() => handleTabClick("Pending")}
          >
            <span className="font-medium">Pending</span>
            <span className="text-sm px-2 py-1 rounded-full bg-orange-500">
              {statusCounts.pending}
            </span>
          </div>

          <div
            className={`border border-gray-300 flex items-center space-x-2 cursor-pointer p-2 rounded-lg ${
              activeTab === "Approved"
                ? "bg-blue-600 text-white"
                : "text-gray-600"
            }`}
            onClick={() => handleTabClick("Approved")}
          >
            <span className="font-medium">Approved</span>
            <span className="text-sm px-2 py-1 rounded-full bg-green-500">
              {statusCounts.approved}
            </span>
          </div>

          <div
            className={`border border-gray-300 rounded-lg flex items-center space-x-2 cursor-pointer p-2  ${
              activeTab === "Rejected"
                ? "bg-blue-600 text-white"
                : "text-gray-600"
            }`}
            onClick={() => handleTabClick("Rejected")}
          >
            <span className="font-medium">Rejected</span>
            <span className="text-sm px-2 py-1 rounded-full bg-red-500">
              {statusCounts.rejected}
            </span>
          </div>

          <div
            className={`rounded-lg border border-gray-300 flex items-center space-x-2 cursor-pointer p-2  ${
              activeTab === "Completed"
                ? "bg-blue-600 text-white"
                : "text-gray-600"
            }`}
            onClick={() => handleTabClick("Completed")}
          >
            <span className="font-medium">Completed</span>
            <span className="text-sm px-2 py-1 rounded-full bg-blue-500">
              {statusCounts.completed}
            </span>
          </div>
        </div>

        {/* Create Job Button - Opens Modal */}
        {hasPermission(1390) && (
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md"
            onClick={() => setIsModalOpen(true)}
          >
            Create Job
          </button>
        )}
      </div>

      {/* Modal for Job Requisition Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-12 rounded-lg shadow-lg max-w-7xl w-full h-[88%]">
            <h2 className="text-2xl font-semibold mb-4">
              Job Requisition Creation
            </h2>
            <div className="grid grid-cols-2 gap-4 space-y-3">
              <div>
                <label className="block text-gray-600 mt-4">Job Title</label>
                <input
                  type="text"
                  name="jobTitle"
                  placeholder="Enter title"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-600">Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {" "}
                      {/* Sends ID */}
                      {dept.department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-600">Employment Type</label>
                <select
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded"
                >
                  <option value="">Select Employment Type</option>
                  {employmentTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {" "}
                      {/* Sends ID */}
                      {type.type_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-600">
                  Reason for Requisition
                </label>
                <input
                  type="text"
                  name="reasonForRequisition"
                  placeholder="Enter reason"
                  value={formData.reasonForRequisition}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-gray-600">Description</label>
                <textarea
                  name="description"
                  placeholder="Enter description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-gray-600">
                    Budget/Salary Range
                  </label>
                  <input
                    type="text"
                    name="budgetStart"
                    placeholder="Enter start amount"
                    value={formData.budgetStart}
                    onChange={handleChange}
                    className="w-full border border-gray-300 p-2 rounded"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-gray-600">To</label>
                  <input
                    type="text"
                    name="budgetEnd"
                    placeholder="Enter end amount"
                    value={formData.budgetEnd}
                    onChange={handleChange}
                    className="w-full border border-gray-300 p-2 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600">Job Type</label>
                <input
                  type="text"
                  name="jobType"
                  placeholder="Enter job type"
                  value={formData.jobType}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>

              <div>
                <label className="block text-gray-600">Supervisor One</label>
                <select
                  name="supervisorOne"
                  value={formData.supervisorOne}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded"
                >
                  <option value="">Select supervisor</option>
                  {employees.map((emp) => (
                    <option key={emp.employee_no} value={emp.employee_no}>
                      {emp.employee_calling_name} - {emp.employee_no}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-600">Supervisor Two</label>
                <select
                  name="supervisorTwo"
                  value={formData.supervisorTwo}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded"
                >
                  <option value="">Select supervisor</option>
                  {employees.map((emp) => (
                    <option key={emp.employee_no} value={emp.employee_no}>
                      {emp.employee_calling_name} - {emp.employee_no}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-600">Location</label>
                <input
                  type="text"
                  name="location"
                  placeholder="Enter location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>

              <div>
                <label className="block text-gray-600">City</label>
                <input
                  type="text"
                  name="city"
                  placeholder="Enter city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>

              <div>
                <label className="block text-gray-600">Country</label>
                <input
                  type="text"
                  name="country"
                  placeholder="Enter country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>
            </div>
            {/* Buttons */}
            <div className="flex justify-start mt-6 space-x-4">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                onClick={handleSubmit}
              >
                Create Requisition
              </button>

              <button
                className="bg-gray-300 text-gray-600 px-4 py-2 rounded-lg"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render Cards based on Active Tab */}
      {renderCards()}

      {isCollectJobDetailsOpen && selectedJobForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="relative bg-white p-6 rounded-lg shadow-lg max-w-7xl w-full overflow-y-auto h-[90%]">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
              onClick={() => setIsCollectJobDetailsOpen(false)}
            >
              <AiOutlineClose size={20} />
            </button>

            {/* Pass Job ID & Title to Collect_Job_Details */}
            <Collect_Job_Details
              jobId={selectedJobForDetails.id}
              title={selectedJobForDetails.title}
            />
          </div>
        </div>
      )}

      {isViewJobDetailsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="relative bg-white p-6 rounded-lg shadow-lg max-w-7xl w-full overflow-y-auto h-[80%]">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
              onClick={() => setIsViewJobDetailsOpen(false)} // Close Popup
            >
              <AiOutlineClose size={20} />
            </button>

            {/* View Job Details Component */}
            <View_Job_Details jobId={selectedJobIdForView} />
          </div>
        </div>
      )}

      {isConfirmOpen && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-semibold text-green-600 text-center">
              Approve?
            </h2>
            <p className="text-gray-600 text-center mt-2">
              Are you sure you want to approve this job vacancy?
            </p>
            <p className="text-center font-semibold">
              {selectedJob.title} - {selectedJob.jobtype}
            </p>
            <div className="flex justify-center items-center font-semibold mt-4">
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="bg-gray-300 text-gray-600 px-4 py-2 rounded-lg mr-2"
              >
                No
              </button>
              <button
                onClick={() => approveJob(selectedJob.id)} //  Calls approve function
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {isRejectOpen && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-[450px] w-full">
            <h2 className="text-lg font-semibold text-red-600 text-center">
              Reject?
            </h2>
            <p className="text-gray-600 text-center mt-2">
              Are you sure you want to reject this job vacancy?
            </p>
            <p className="text-center font-semibold">
              {selectedJob.title} - {selectedJob.jobtype}
            </p>

            {/* Message Input Field */}
            <label className="block mt-4 text-gray-700">Message</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-2 mt-2"
              placeholder="Enter your message here..."
              value={rejectMessage}
              onChange={(e) => setRejectMessage(e.target.value)}
            />

            {/* Buttons */}
            <div className="flex justify-center items-center font-semibold mt-4">
              <button
                onClick={() => setIsRejectOpen(false)}
                className="bg-gray-300 text-gray-600 px-4 py-2 rounded-lg mr-2"
              >
                No
              </button>
              <button
                onClick={() => {
                  rejectJob(selectedJob.id, rejectMessage);
                  setIsRejectOpen(false);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                disabled={!rejectMessage.trim()} // Disable if message is empty
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
      {isSuccessPopupOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-green-600 font-semibold text-lg">Success!</h2>
            <p className="text-gray-700 mt-2">
              Job requisition successfully submitted.
            </p>
          </div>
        </div>
      )}
      {isApprovalSuccessPopupOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-semibold text-green-600 text-center">
              Job Approved!
            </h2>
            <p className="text-gray-600 text-center mt-2">
              The job has been successfully approved.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPostingManagement;
