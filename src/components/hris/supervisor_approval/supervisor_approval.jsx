import React, { useState, useEffect } from "react";
import { AiOutlineClose } from "react-icons/ai";
import Empty_Img from "../../../assets/empty.png";

const Supervisor_Approval = () => {
    const [pendingJobs, setPendingJobs] = useState([]);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [rejectMessage, setRejectMessage] = useState("");
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

    useEffect(() => {
        fetchPendingJobs();
    }, []);

    const fetchPendingJobs = async () => {
        const employeeNumber = getCookie("employee_no");
        if (!employeeNumber) {
            console.error("Employee number is missing. Cannot fetch jobs.");
            return;
        }
        try {
            const response = await fetch(
                `${API_URL}/v1/hris/jobpost/pending_jobs/${employeeNumber}`
            );
            const data = await response.json();
            if (data.success) {
                setPendingJobs(data.data);
            } else {
                console.error("Failed to fetch pending jobs.");
            }
        } catch (error) {
            console.error("Error fetching pending job posts:", error);
        }
    };

    const handleApproveClick = (job) => {
        setSelectedJob(job);
        setIsConfirmOpen(true);
    };

    const handleRejectClick = (job) => {
        setSelectedJob(job);
        setIsRejectOpen(true);
    };

    const approveJob = async (jobId) => {
        const employeeNumber = getCookie("employee_no");
        if (!employeeNumber) {
            console.error("Employee number is missing. Please log in again.");
            return;
        }
        try {
            const response = await fetch(
                `${API_URL}/v1/hris/jobpost/update_approval_status`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ jobId, employeeNumber }),
                }
            );
            const data = await response.json();
            if (data.success) {
                setIsConfirmOpen(false);
                fetchPendingJobs(); // Refresh the pending jobs list
            } else {
                console.error("Error approving job");
            }
        } catch (error) {
            console.error("Error approving job:", error);
        }
    };

    const rejectJob = async (jobId, message) => {
        const employeeNumber = getCookie("employee_no");
        if (!employeeNumber) {
            alert("Employee number is missing. Please log in again.");
            return;
        }
        try {
            const response = await fetch(
                `${API_URL}/v1/hris/jobpost/reject_job`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ jobId, employeeNumber, rejectReason: message }),
                }
            );
            const data = await response.json();
            if (data.success) {
                setIsRejectOpen(false);
                fetchPendingJobs(); // Refresh the pending jobs list
            } else {
                alert("Error rejecting job");
            }
        } catch (error) {
            console.error("Error rejecting job:", error);
            alert("Error rejecting job");
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

    return (
        <div className="mx-10 mt-5 font-montserrat">
            <h2 className="text-lg font-semibold text-gray-800">Pending Job Vacancies for Approval</h2>
            <div className="grid grid-cols-3 gap-4 mt-5">
                {pendingJobs.length > 0 ? (
                    pendingJobs.map((job) => (
                        <div key={job.id} className="shadow-lg p-4 rounded-md">
                            <p className="text-lg font-semibold">{job.title}</p>
                            <p className="text-sm">{job.location}</p>
                            <p className="mt-3 text-sm mb-5">{job.description || "No description provided."}</p>
                            <p>LKR {job.salaryRange || "(Not specified)"}</p>
                            <hr />
                            <div className="flex items-center space-x-2 mt-3">
                                <div className="bg-orange-400 w-3 h-3 rounded-full mb-5"></div>
                                <p className="text-gray-700">Pending</p>
                            </div>
                            <div className="flex space-x-3 items-center mt-3">
                                <button
                                    className="bg-red-100 p-2 rounded-lg text-red-500 w-full"
                                    onClick={() => handleRejectClick(job)}
                                >
                                    Reject
                                </button>
                                <button
                                    className="bg-green-100 p-2 rounded-lg text-green-500 w-full"
                                    onClick={() => handleApproveClick(job)}
                                >
                                    Approve
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center w-full h-80 col-span-3 mt-4">
                        <img src={Empty_Img} alt="No jobs available" className="w-80 h-80 mx-auto mt-9" />
                        <p className="text-gray-500 mt-3 text-lg">No pending job posts available.</p>
                    </div>
                )}
            </div>

            {/* Approve Confirmation Popup */}
            {isConfirmOpen && selectedJob && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
                        <h2 className="text-lg font-semibold text-green-600 text-center">Approve?</h2>
                        <p className="text-gray-600 text-center mt-2">
                            Are you sure you want to approve this job vacancy?
                        </p>
                        <p className="text-center font-semibold">{selectedJob.title}</p>
                        <div className="flex justify-center items-center font-semibold mt-4">
                            <button
                                onClick={() => setIsConfirmOpen(false)}
                                className="bg-gray-300 text-gray-600 px-4 py-2 rounded-lg mr-2"
                            >
                                No
                            </button>
                            <button
                                onClick={() => approveJob(selectedJob.id)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Confirmation Popup */}
            {isRejectOpen && selectedJob && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-[450px] w-full">
                        <h2 className="text-lg font-semibold text-red-600 text-center">Reject?</h2>
                        <p className="text-gray-600 text-center mt-2">
                            Are you sure you want to reject this job vacancy?
                        </p>
                        <p className="text-center font-semibold">{selectedJob.title}</p>

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
        </div>
    );
};

export default Supervisor_Approval;