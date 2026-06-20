import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Job_Img from "../../../assets/img-job.png";
import { FaUser } from "react-icons/fa";

const OpenJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Hook for navigation
    const API_URL = process.env.REACT_APP_FRONTEND_URL;

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const response = await fetch(`${API_URL}/v1/hris/jobpost/get-completed-jobposts`);
                const result = await response.json();

                if (result.success) {
                    setJobs(result.data);
                } else {
                    setError("Failed to fetch job posts");
                }
            } catch (err) {
                setError("An error occurred while fetching jobs");
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    return (
        <div className='mx-5 mt-10 font-montserrat'>
            {/* Breadcrumb */}
            <div className="flex items-center space-x-3 text-gray-600">
                <span className="text-lg font-normal">Employee Recruitment Settings </span>
                <span>/</span>
                <span className="text-lg font-normal text-gray-800"> CVs Shortlisting </span>
                <span>/</span>
                <span className="text-lg font-semibold text-gray-800"> Open Jobs </span>
            </div>

            <div className='mt-6'>
                <p className='text-[18px] font-semibold '>
                    Active job vacancies - {jobs.length}
                </p>

                {/* Loading State */}
                {loading && <p className="mt-4 text-gray-600">Loading jobs...</p>}

                {/* Error Handling */}
                {error && <p className="mt-4 text-red-500">{error}</p>}

                {/* Job Cards Grid */}
                <div className='mt-5 grid grid-flow-row grid-cols-4 gap-4'>
                    {!loading && !error && jobs.length === 0 && (
                        <p className="col-span-3 text-gray-600">No active job postings.</p>
                    )}

                    {jobs.map(job => (
                        <div key={job.id} className="bg-white shadow-lg rounded-2xl p-6 w-96">
                            {/* Job Image */}
                            <div className="flex justify-center">
                                <img
                                    src={Job_Img}
                                    alt="Job Illustration"
                                    className="w-full h-40 object-cover rounded-lg"
                                />
                            </div>

                            {/* Job Title & Department */}
                            <div className="mt-4">
                                <h2 className="text-lg font-semibold text-gray-800 capitalize">
                                    {job.title}
                                </h2>
                                <p className="text-gray-500 text-sm capitalize">
                                    {job.departmentId ? `Department - ${job.location}` : "Department - N/A"}
                                </p>
                            </div>

                            {/* Status Tags */}
                            <div className="flex gap-2 mt-3">
                                <span className="bg-blue-100 text-blue-600 text-xs px-3 py-1 rounded-lg">
                                    New Role
                                </span>
                                <span className="bg-purple-100 text-purple-600 text-xs px-3 py-1 rounded-lg">
                                    {job.jobtype ? job.jobtype.charAt(0).toUpperCase() + job.jobtype.slice(1) : "N/A"}
                                </span>
                                <span className={`text-xs px-3 py-1 rounded-lg 
                                *:${job.isActive === 1 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                                    {job.isActive === 1 ? "Active" : "closed"}
                                </span>
                            </div>


                            {/* Candidates Applied (Dummy for now) */}
                            <div className="flex items-center mt-4 space-x-3">
                                <div className='bg-blue-100 p-2 rounded-lg'>
                                    <FaUser className="text-blue-500 text-lg" />
                                </div>
                                <div>
                                    <p className="text-gray-700 font-medium text-lg">120</p>
                                    <span className="text-gray-500 text-sm">Candidates who applied</span>
                                </div>
                            </div>

                            {/* View Button */}
                            <div className="mt-4">
                                {/* View Button */}
                                <div className="mt-4">
                                    <button
                                        onClick={() => {
                                            console.log("Navigating with:", job.id, job.title, job.isActive, job.jobtype, job.location);
                                            navigate('/view-open-jobs', {
                                                state: {
                                                    jobId: job.id,
                                                    title: job.title,
                                                    isActive: job.isActive,
                                                    jobtype: job.jobtype,
                                                    location: job.location
                                                }
                                            });
                                        }}
                                        className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition"
                                    >
                                        View
                                    </button>


                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OpenJobs;
