import React, { useState, useEffect } from "react";
import { FaRegEye } from "react-icons/fa";
import ReactQuill from "react-quill"; // Import Quill Editor
import "react-quill/dist/quill.snow.css"; // Import Quill Styles
import { IoArrowForward } from "react-icons/io5";

const Collect_Job_Details = ({ jobId, title, onClose }) => {
    const [step, setStep] = useState(1); // Step 1: Job Vacancy Details, Step 2: Next Form
    const [showSuccessPopup, setShowSuccessPopup] = useState(false); // State for success popup
    const API_URL = process.env.REACT_APP_FRONTEND_URL;

    const [jobDetails, setJobDetails] = useState({
        title: "",
        departmentName: "",
        employmentTypeName: "",
        location: "",
        city: "",
        country: "",
        supervisorOne: "",
        supervisorTwo: "",
        jobType: "",
        description: "", // User will fill this
        qualifications: "", // User will fill this
        whyJoinUs: "", // User will fill this
        responsibilities: "", // User will fill this
        startDate: "", // User will fill this
        endDate: "", // User will fill this
    });

    useEffect(() => {
        if (jobId) {
            fetchJobDetails(jobId);
        }
    }, [jobId]);

    const fetchJobDetails = async (jobId) => {
        try {
            const response = await fetch(`${API_URL}/v1/hris/jobpost/job-by-id/${jobId}`);
            const data = await response.json();

            if (data.success) {
                const job = data.data;
                // Only populate non-editable fields
                setJobDetails((prev) => ({
                    ...prev,
                    title: job.title || "N/A",
                    departmentName: job.departmentId ? `Department ${job.departmentId}` : "N/A",
                    employmentTypeName: job.employmentTypeId ? `Employment Type ${job.employmentTypeId}` : "N/A",
                    location: job.location || "N/A",
                    city: job.city || "N/A",
                    country: job.country || "N/A",
                    supervisorOne: job.supervisorOne || "Not Assigned",
                    supervisorTwo: job.supervisorTwo || "Not Assigned",
                    jobType: job.jobtype || "N/A",
                }));
            } else {
                console.error("Failed to fetch job details.");
            }
        } catch (error) {
            console.error("Error fetching job details:", error);
        }
    };

    const handleQuillChange = (name, value) => {
        setJobDetails((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setJobDetails((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleNextStep = () => {
        setStep(step + 1);
    };

    const handlePrevStep = () => {
        setStep(step - 1);
    };

    const handlePublish = async () => {
        const payload = {
            qualifications: [{ type: "text", content: jobDetails.qualifications }],
            experienceRequired: [{ type: "text", content: "" }], // You can add experienceRequired if needed
            startDate: jobDetails.startDate,
            endDate: jobDetails.endDate,
            keyResponsibilities: [{ type: "text", content: jobDetails.responsibilities }],
            requirements: [{ type: "bullet", content: jobDetails.responsibilities.split("\n") }],
            whyJoinUs: [{ type: "text", content: jobDetails.whyJoinUs }],
            description_two: jobDetails.description,
        };

        try {
            const response = await fetch(`${API_URL}/v1/hris/jobpost/update-jobpost/${jobId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                console.log("Job post updated successfully!");
                setShowSuccessPopup(true); // Show success popup
                setTimeout(() => {
                    setShowSuccessPopup(false); // Hide popup after 3 seconds
                    if (typeof onClose === "function") {
                        onClose(); // Close the modal or navigate away
                    }
                }, 3000);
            } else {
                console.error("Failed to update job post.");
            }
        } catch (error) {
            console.error("Error updating job post:", error);
        }
    };

    const quillModules = {
        toolbar: [
            [{ bold: true }, { italic: true }, { underline: true }, { list: "ordered" }, { list: "bullet" }],
        ],
    };

    return (
        <div>
            {/* Fixed Section */}
            <p className='text-lg font-semibold'>Collect Job Details</p>
            <hr />

            <div className='bg-blue-100 p-4 rounded-lg'>
                <div className='flex items-center space-x-20'>
                    <p className='text-[18px]'>{title}</p>
                </div>
                <p className='text-sm'>IT Department - Nawala</p>
                <div className='flex items-center space-x-2'>
                    <div>
                        <button className='bg-blue-300 text-blue-600 p-2 rounded-lg'>New Role</button>
                    </div>
                    <div>
                        <button className='bg-purple-100 text-purple-500 p-2 rounded-lg'>Remote</button>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg max-w-7xl w-full relative">
                {step === 1 ? (
                    // Step 1: Job Vacancy Details
                    <>
                        <h2 className="text-xl font-semibold mb-4">Job Vacancy Details</h2>

                        {/* Description */}
                        <div className="mb-4">
                            <label className="block text-gray-600 mb-1">Description</label>
                            <ReactQuill
                                value={jobDetails.description}
                                onChange={(value) => handleQuillChange("description", value)}
                                modules={quillModules}
                                className="bg-white h-[250px]"
                            />
                        </div>

                        {/* Required Qualifications and Experience */}
                        <div className="mb-4">
                            <label className="block text-gray-600 mb-1 mt-[70px]">Required Qualifications and Experience</label>
                            <ReactQuill
                                value={jobDetails.qualifications}
                                onChange={(value) => handleQuillChange("qualifications", value)}
                                modules={quillModules}
                                className="bg-white h-[250px]"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-600 mb-1 mt-[70px]">Why Join Us</label>
                            <ReactQuill
                                value={jobDetails.whyJoinUs}
                                onChange={(value) => handleQuillChange("whyJoinUs", value)}
                                modules={quillModules}
                                className="bg-white h-[250px]"
                            />
                        </div>

                        {/* Responsibilities */}
                        <div className="mb-4">
                            <label className="block text-gray-600 mb-1 mt-[70px]">Responsibilities</label>
                            <ReactQuill
                                value={jobDetails.responsibilities}
                                onChange={(value) => handleQuillChange("responsibilities", value)}
                                modules={quillModules}
                                className="bg-white h-[250px]"
                            />
                        </div>

                        {/* Start Date and End Date */}
                        <div className="flex items-center gap-3 mb-5 mt-[70px]">
                            <div>
                                <label className="block text-gray-600">Start Date</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={jobDetails.startDate}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 p-2 rounded"
                                />
                            </div>

                            <span className="text-gray-600">To</span>

                            <div>
                                <label className="block text-gray-600">End Date</label>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={jobDetails.endDate}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 p-2 rounded"
                                />
                            </div>
                        </div>

                        {/* Next Button */}
                        <div className='justify-end flex space-x-2 items-center'>
                            <button onClick={handleNextStep} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center">
                                Next
                                <IoArrowForward />
                            </button>
                        </div>
                    </>
                ) : (
                    // Step 2: Review and Publish
                    <>
                        <h2 className="text-xl font-semibold mb-4">Job Vacancy Details</h2>

                        <div className="grid grid-cols-3 gap-6 space-y-9">
                            <div className="mt-[30px]">
                                <label className="block text-gray-600">Job Vacancy Title</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 p-2 rounded"
                                    value={jobDetails.title}
                                    readOnly
                                />
                            </div>

                            <div>
                                <label className="block text-gray-600">Department Name</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 p-2 rounded"
                                    value={jobDetails.departmentName}
                                    readOnly
                                />
                            </div>

                            <div>
                                <label className="block text-gray-600">Employment Type Name</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 p-2 rounded"
                                    value={jobDetails.employmentTypeName}
                                    readOnly
                                />
                            </div>

                            <div>
                                <label className="block text-gray-600">Location</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 p-2 rounded"
                                    value={jobDetails.location}
                                    readOnly
                                />
                            </div>

                            <div>
                                <label className="block text-gray-600">City</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 p-2 rounded"
                                    value={jobDetails.city}
                                    readOnly
                                />
                            </div>

                            <div>
                                <label className="block text-gray-600">Country</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 p-2 rounded"
                                    value={jobDetails.country}
                                    readOnly
                                />
                            </div>

                            <div>
                                <label className="block text-gray-600">Supervisors</label>
                                <select className="w-full border border-gray-300 p-2 rounded" disabled>
                                    <option>{jobDetails.supervisorOne} & {jobDetails.supervisorTwo}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-600">Job Type</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 p-2 rounded"
                                    value={jobDetails.jobType}
                                    readOnly
                                />
                            </div>
                        </div>

                        <div className="flex justify-between mt-6">
                            <button onClick={handlePrevStep} className="bg-gray-300 text-gray-600 px-4 py-2 rounded-lg">
                                ← Previous
                            </button>
                            <button onClick={handlePublish} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                                Publish →
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Success Popup */}
            {showSuccessPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">Success!</h2>
                        <p className="text-gray-600">Job details have been successfully published.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

Collect_Job_Details.defaultProps = {
    onClose: () => {
        console.log("onClose function not provided");
    },
};

export default Collect_Job_Details;