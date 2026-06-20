import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Interview_Img from "../../../assets/interview-image.png";
import { SlLayers } from "react-icons/sl";
import { FiUsers } from "react-icons/fi";

const Interviews = () => {
    const navigate = useNavigate();
    const [interviewJobs, setInterviewJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const API_URL = process.env.REACT_APP_FRONTEND_URL;

    useEffect(() => {
        fetchInterviewJobs();
    }, []);

    // Function to get the current system date in "YYYY-MM-DD" format
    const getCurrentDate = () => {
        const date = new Date();
        return date.toISOString().split("T")[0]; // Format: YYYY-MM-DD
    };

    // Fetch interview jobs using the system date
    const fetchInterviewJobs = async () => {
        setIsLoading(true);
        setError(null);
        const currentDate = getCurrentDate(); // Get system date

        try {
            const response = await fetch(
                `${API_URL}/v1/hris/interviewprocess/jobs-by-interview-date?date=${currentDate}`
            );
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setInterviewJobs(result.data);
                } else {
                    setError("Failed to fetch interview jobs.");
                }
            } else {
                setError("Error: Unable to fetch interview jobs.");
            }
        } catch (error) {
            setError("Network error. Please try again later.");
            console.error("Error fetching interview jobs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='mx-10 mt-5'>
            <p className='text-[22px]'>Employee Recruitment Settings / Interview Process /
                <span className='font-semibold'> Interview</span>
            </p>

            {/* Loading and Error Handling */}
            {isLoading ? (
                <p className="text-gray-600 mt-4">Loading interviews...</p>
            ) : error ? (
                <p className="text-red-500 mt-4">{error}</p>
            ) : interviewJobs.length === 0 ? (
                <p className="text-gray-600 mt-4">No interviews scheduled for today.</p>
            ) : (
                <div className='grid grid-flow-row grid-cols-4 gap-4 mt-6'>
                    {interviewJobs.map((job) => (
                        <div key={job.jobId} className="bg-white shadow-lg rounded-2xl p-6 w-96">
                            <div className="flex justify-center">
                                <img src={Interview_Img} alt="interview-img" className="w-full h-40 object-cover rounded-lg" />
                            </div>

                            <div className="mt-4">
                                <h2 className="text-lg font-semibold text-gray-800 capitalize">{job.jobTitle}</h2>

                            </div>

                            <div className="flex items-center space-x-3 mt-4">
                                <div className='bg-blue-100 p-2 rounded-lg'>
                                    <FiUsers className="text-blue-500 text-lg" />
                                </div>
                                <div>
                                    <p className="text-gray-700 font-medium text-lg">{job.scheduledCandidatesCount || 0}</p>
                                    <span className="text-gray-500 text-sm">Confirmed Candidates</span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 mt-4">
                                <div className='bg-blue-100 p-2 rounded-lg'>
                                    <SlLayers className="text-blue-500 text-lg" />
                                </div>
                                <div>
                                    <p className="text-gray-700 font-medium text-lg">{job.unassignedEmployees || 0}</p>
                                    <span className="text-gray-500 text-sm">Candidates who applied</span>
                                </div>
                            </div>

                            <div className="mt-4">
                                <button
                                    onClick={() => navigate("/interviews-stages", { state: { id: job.jobId, title: job.title } })}
                                    className="w-full text-white bg-blue-500 py-3 rounded-lg font-semibold"
                                >
                                    View
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Interviews;
