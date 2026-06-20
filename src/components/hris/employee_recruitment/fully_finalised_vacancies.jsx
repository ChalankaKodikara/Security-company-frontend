import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Job_Img from "../../../assets/img-job.png";
import { FaUser } from "react-icons/fa";

const FullyFinalisedVacancies = () => {
    const navigate = useNavigate();
    const [jobData, setJobData] = useState(null);
    const API_URL = process.env.REACT_APP_FRONTEND_URL;

    useEffect(() => {
        fetch(`${API_URL}/v1/hris/jobpost/selected_cvs_with_jobs`)
            .then(response => response.json())
            .then(data => {
                if (data.success && Array.isArray(data.job_data)) {
                    setJobData(data.job_data); // Store the array of job data
                } else {
                    setJobData([]); // Ensure it's an empty array if the response is incorrect
                }
            })
            .catch(error => console.error("Error fetching job data:", error));
    }, []);

    const handleViewClick = (job) => {
        navigate("/fully-shortlisted-candidates", { state: { jobId: job.id, title: job.title } });
    };


    return (
        <div className='mx-10 mt-5'>
            <div className='grid grid-flow-row grid-cols-4 gap-4'>
                {jobData && jobData.length > 0 && jobData.map((job) => (
                    <div key={job.id} className="bg-white shadow-lg rounded-2xl p-6 w-96">
                        <div className="flex justify-center">
                            <img
                                src={Job_Img}
                                alt="Job Illustration"
                                className="w-full h-40 object-cover rounded-lg"
                            />
                        </div>
                        <div className="mt-4">
                            <h2 className="text-lg font-semibold text-gray-800 capitalize">
                                {job.title}
                            </h2>
                            <p className="text-gray-500 text-sm capitalize">
                                {job.location}
                            </p>
                        </div>
                        <div className="flex gap-2 mt-3">
                            <span className="bg-blue-100 text-blue-600 text-xs px-3 py-1 rounded-lg">
                                {job.status}
                            </span>
                            <span className="bg-purple-100 text-purple-600 text-xs px-3 py-1 rounded-lg">
                                {job.jobtype}
                            </span>
                        </div>
                        <div className="flex items-center mt-4 space-x-3">
                            <div className='bg-blue-100 p-2 rounded-lg'>
                                <FaUser className="text-blue-500 text-lg" />
                            </div>
                            <div>
                                <p className="text-gray-700 font-medium text-lg">120</p>
                                <span className="text-gray-500 text-sm">Candidates who applied</span>
                            </div>
                        </div>
                        <div className="mt-4">
                            <button
                                onClick={() => handleViewClick(job)}
                                className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition"
                            >
                                View
                            </button>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
};

export default FullyFinalisedVacancies;
