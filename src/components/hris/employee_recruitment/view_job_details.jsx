import React, { useState, useEffect } from "react";
import { FaRegEye } from "react-icons/fa";
import ReactQuill from "react-quill"; // Import Quill Editor
import "react-quill/dist/quill.snow.css"; // Import Quill Styles
import { IoArrowForward } from "react-icons/io5";

const View_Job_Details = ({ jobId, onClose }) => {
    const [step, setStep] = useState(1); // Step 1: Job Vacancy Details, Step 2: Next Form
    const API_URL = process.env.REACT_APP_FRONTEND_URL;

    const [jobDetails, setJobDetails] = useState({
        description: "",
        qualifications: "",
        responsibilities: "",
        budgetStart: "",
        budgetEnd: "",
        title: "",
        department: "",
        employmentType: "",
        location: "",
        city: "",
        country: "",
        jobType: "",
        whyJoinUs: "",
        requirements: "",
    });

    // Fetch job details when jobId changes
    useEffect(() => {
        if (jobId) {
            fetch(`${API_URL}/v1/hris/jobpost/job-by-id/${jobId}`)
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        const jobData = data.data;
                        setJobDetails({
                            description: jobData.description || "",
                            qualifications: jobData.additional_details?.qualifications?.[0]?.content || "",
                            responsibilities: jobData.additional_details?.keyResponsibilities?.[0]?.content || "",
                            budgetStart: jobData.salaryRange?.split("-")[0] || "",
                            budgetEnd: jobData.salaryRange?.split("-")[1] || "",
                            title: jobData.title || "",
                            department: jobData.departmentId || "",
                            employmentType: jobData.employmentTypeId || "",
                            location: jobData.location || "",
                            city: jobData.city || "",
                            country: jobData.country || "",
                            jobType: jobData.jobtype || "",
                            whyJoinUs: jobData.additional_details?.whyJoinUs?.[0]?.content || "",
                            requirements: jobData.additional_details?.requirements?.[0]?.content || "",
                        });
                    }
                })
                .catch((error) => {
                    console.error("Error fetching job details:", error);
                });
        }
    }, [jobId]);

    // Function to handle changes in Quill editors
    const handleQuillChange = (name, value) => {
        setJobDetails((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Function to handle input changes for budget
    const handleChange = (e) => {
        const { name, value } = e.target;
        setJobDetails((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Move to the next step
    const handleNextStep = () => {
        setStep(step + 1);
    };

    // Move to the previous step
    const handlePrevStep = () => {
        setStep(step - 1);
    };

    // Quill Toolbar Options
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
                    <p className='text-[18px] '>{jobDetails.title}</p>
                    <p>{jobDetails.description}</p>
                </div>
                <p className='text-sm'>{jobDetails.department}</p>
                <div className='flex items-center space-x-2'>
                    <div>
                        <button className='bg-blue-300 text-blue-600 p-2 rounded-lg'>New Role</button>
                    </div>
                    <div>
                        <button className='bg-purple-100 text-purple-500 p-2 rounded-lg'>{jobDetails.jobType}</button>
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

                        {/* Budget/Salary Range */}
                        <div className="flex items-center gap-3 mb-5 mt-[70px]">
                            <div>
                                <label className="block text-gray-600">Budget/Salary Range</label>
                                <input
                                    type="text"
                                    name="budgetStart"
                                    value={jobDetails.budgetStart}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 p-2 rounded"
                                />
                            </div>

                            <span className="text-gray-600">To</span>

                            <div>
                                <label className="block text-gray-600">End Budget</label>
                                <input
                                    type="text"
                                    name="budgetEnd"
                                    value={jobDetails.budgetEnd}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 p-2 rounded"
                                />
                            </div>

                            <button className="bg-blue-500 text-white px-3 py-2 rounded">
                                <FaRegEye />
                            </button>
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
                    // Step 2: Additional Job Details
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
                                    value={jobDetails.department}
                                    readOnly
                                />
                            </div>

                            <div>
                                <label className="block text-gray-600">Employment Type Name</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 p-2 rounded"
                                    value={jobDetails.employmentType}
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
                                <select className="w-full border border-gray-300 p-2 rounded">
                                    <option>Select Supervisors</option>
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

                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default View_Job_Details;