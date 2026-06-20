import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Interview_Img from "../../../assets/interview-image.png";
import { SlLayers } from "react-icons/sl";
import { FiUsers } from "react-icons/fi";

const Interview_Screen = () => {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  useEffect(() => {
    fetchJobData();
  }, []);

  const fetchJobData = async () => {
    setIsLoading(true);
    setError(null);

    const today = new Date().toISOString().split('T')[0]; // Get system date

    try {
      const response = await fetch(
        `${API_URL}/v1/hris/interviewprocess/jobs-by-interview-date?date=${today}`
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setJobs(result.data || []);
        } else {
          setError("Failed to fetch job data.");
        }
      } else {
        setError("Error: Unable to fetch job data.");
      }
    } catch (error) {
      setError("Network error. Please try again later.");
      console.error("Error fetching job data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartClick = (jobId) => {
    navigate(`/marks-by-interviewer?jobId=${jobId}`); 
  };

  return (
    <div className='mx-10 mt-5'>
      <p className='text-[22px]'>Employee Recruitment Settings / Interview Process /
        <span className='font-semibold'> Interview</span>
      </p>

      {isLoading ? (
        <p className="text-gray-600 mt-4">Loading job data...</p>
      ) : error ? (
        <p className="text-red-500 mt-4">{error}</p>
      ) : jobs.length === 0 ? (
        <p className="text-gray-600 mt-4">No interviews available.</p>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6'>
          {jobs.map((job) => (
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
                  <p className="text-gray-700 font-medium text-lg">{job.stagesCount || 0}</p>
                  <span className="text-gray-500 text-sm">Interview Stages</span>
                </div>
              </div>

              <div className='mt-4 justify-center'>
                <button
                  className="w-full text-white bg-blue-500 py-3 rounded-lg font-semibold"
                  onClick={() => handleStartClick(job.jobId)} 
                >
                  Start
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Interview_Screen;
