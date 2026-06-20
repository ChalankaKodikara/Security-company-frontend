import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Job_Img from "../../../assets/img-job.png";
import { FaUser } from "react-icons/fa";

const Cv_Shortlist_One = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const API_URL = process.env.REACT_APP_FRONTEND_URL;

    useEffect(() => {
        // Get employee number from browser cookies
        const getCookie = (name) => {
            const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
            return match ? match[2] : null;
        };

        const employeeNo = getCookie('employee_no');
        if (!employeeNo) {
            console.error("Employee number not found in cookies");
            setLoading(false);
            return;
        }

        // Fetch jobs assigned to the supervisor
        fetch(`${API_URL}/v1/hris/jobpost/jobs_assigned_to_supervisor01/${employeeNo}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    setJobs(data.jobs);
                }
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching jobs:", error);
                setLoading(false);
            });
    }, []);

    const handleViewClick = (title, id) => {
        // Get employee number from cookies
        const getCookie = (name) => {
            const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
            return match ? match[2] : null;
        };

        const employeeNo = getCookie('employee_no');

        navigate(`/shortlisted-supervisor1`, { state: { title, id, employeeNo } });
    };


    return (
        <div className='mx-10 mt-5'>
            {/* Breadcrumb */}
            <div className="flex items-center space-x-3 text-gray-600">
                <span className="text-lg font-normal">Employee Recruitment Settings</span>
                <span>/</span>
                <span className="text-lg font-normal text-gray-800">CVs Shortlisting</span>
                <span>/</span>
                <span className="text-lg font-semibold text-gray-800">CV Shortlist 01</span>
            </div>

            <div className='mt-6'>
                <p className='text-[18px] font-semibold'>
                    Pending Shortlist - 01
                </p>

                {loading ? (
                    <p className="mt-5 text-gray-500">Loading jobs...</p>
                ) : jobs.length === 0 ? (
                    <p className="mt-5 text-gray-500">No jobs assigned to you.</p>
                ) : (
                    <div className='grid grid-flow-row grid-cols-4 gap-4 mt-5'>
                        {jobs.map((job) => (
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
                                        {job.departmentId} - {job.city}
                                    </p>
                                </div>

                                {/* Status Tags */}
                                <div className="flex gap-2 mt-3">
                                    <span className="bg-blue-100 text-blue-600 text-xs px-3 py-1 rounded-lg">
                                        New Role
                                    </span>

                                    <span className="bg-purple-100 text-purple-600 text-xs px-3 py-1 rounded-lg">
                                        {job.jobtype}
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
                                    <button
                                        onClick={() => handleViewClick(job.title, job.id)}
                                        className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition"
                                    >
                                        View
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cv_Shortlist_One;