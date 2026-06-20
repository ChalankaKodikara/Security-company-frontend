import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { IoEyeOutline } from "react-icons/io5";
import { GoDownload } from "react-icons/go";

const FullyShortlistedCandidates = () => {
  const location = useLocation();
  const { jobId, title } = location.state || {};
  const [candidates, setCandidates] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState("");
  const [interviewProcesses, setInterviewProcesses] = useState([]);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  // Fetch shortlisted candidates
  useEffect(() => {
    if (jobId) {
      fetch(`${API_URL}/v1/hris/jobpost/approved_cvs?jobId=${jobId}`)
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            setCandidates(data.data);
          }
        })
        .catch(error => console.error("Error fetching candidates:", error));
    }
  }, [jobId]);

  // Fetch interview process options
  useEffect(() => {
    fetch(`${API_URL}/v1/hris/interviewprocess/interview-process`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setInterviewProcesses(data.data); // Store interview process options
        }
      })
      .catch(error => console.error("Error fetching interview processes:", error));
  }, []);

  const handleOpenPopup = () => {
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedInterview(""); // Reset dropdown selection when closing
  };

  const handleSendToInterview = () => {
    if (!selectedInterview) {
      alert("Please select an interview process.");
      return;
    }

    // Get candidate IDs from the fetched candidates
    const candidateIds = candidates.map((candidate) => candidate.id);

    // Send API request to update interview type
    fetch(`${API_URL}/v1/hris/interviewprocess/update-interview-type`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        candidateIds: candidateIds,
        interviewProcessId: selectedInterview,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          alert("Candidates successfully assigned to the interview process!");
          setShowPopup(false);
        } else {
          alert("Failed to update interview process.");
        }
      })
      .catch((error) => {
        console.error("Error updating interview process:", error);
      });
  };

  return (
    <div className='mx-10 mt-5 font-montserrat'>
      <div className="flex items-center space-x-2 text-gray-500 text-lg">
        <span>Employee Recruitment Settings</span>
        <span>/</span>
        <span className="text-gray-700">CVs Shortlisting</span>
        <span>/</span>
        <span className="text-gray-900 font-semibold">Fully Shortlisted Candidates</span>
      </div>

      <div className='mt-5'>
        <p className='text-[18px] font-semibold'>{title || "Job Title Not Available"} - Shortlisted Candidates</p>
      </div>

      <div className='mt-4'>
        <div className='flex items-center justify-between'>
          <div>
            <label className='text-[18px] '>Filter</label>
            <input className='p-2 rounded-md border border-gray-300 ' placeholder='Name' />
          </div>
          <div>
            <button
              className='p-3 font-semibold rounded-lg border border-gray-400 text-black'
              onClick={handleOpenPopup}
            >
              Send to Interview Process
            </button>
          </div>
        </div>

        <div className='shadow-lg p-5 rounded-md'>
          <div className='overflow-x-auto mt-4'>
            <table className='w-full border-collapse text-sm'>
              <thead className='bg-gray-100 text-gray-700'>
                <tr>
                  <th className='py-2 px-4 text-left'>NAME</th>
                  <th className='py-2 px-4 text-left'>EMAIL</th>
                  <th className='py-2 px-4 text-left'>PHONE NUMBER</th>
                  <th className='py-2 px-4 text-left'>RATE</th>
                  <th className='py-2 px-4 text-left'>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {candidates.length > 0 ? (
                  candidates.map((candidate) => (
                    <tr key={candidate.id} className='border-t'>
                      <td className='py-2 px-4'>{candidate.firstName} {candidate.lastName}</td>
                      <td className='py-2 px-4'>{candidate.email}</td>
                      <td className='py-2 px-4'>{candidate.phoneNumber}</td>
                      <td className='py-2 px-4'>{candidate.rate}</td>
                      <td className='py-2 px-4 space-x-4'>
                        <button className='bg-blue-400 text-white p-1 rounded-md'>
                          <IoEyeOutline />
                        </button>
                        <button className='bg-blue-700 text-white p-1 rounded-md'>
                          <GoDownload />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-4 text-center text-gray-500">
                      No shortlisted candidates found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-[600px] shadow-lg">
            <h2 className="text-xl font-semibold text-center text-blue-600">Confirmation</h2>
            <p className="text-center mt-2 text-gray-700 font-medium">
              {title} - Contract
            </p>
            <p className="text-center text-gray-500 mt-1">
              Are you sure you want to share the selected CV(s) for the interview process?
            </p>

            <div className="mt-4">
              <label className="block text-gray-600 font-medium">Select Interview Process</label>
              <select
                className="w-full border rounded-lg p-3 mt-2"
                value={selectedInterview}
                onChange={(e) => setSelectedInterview(e.target.value)}
              >
                <option value="">Select an interview process</option>
                {interviewProcesses.length > 0 ? (
                  interviewProcesses.map((process) => (
                    <option key={process.id} value={process.id}>
                      {process.name}
                    </option>
                  ))
                ) : (
                  <option disabled>Loading...</option>
                )}
              </select>
            </div>

            <div className="flex justify-center items-center gap-3 mt-6">
              <button
                className="bg-gray-300 px-4 py-2 rounded-lg text-gray-700"
                onClick={handleClosePopup}
              >
                No
              </button>
              <button
                className="bg-blue-500 px-4 py-2 rounded-lg text-white"
                onClick={handleSendToInterview}
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

export default FullyShortlistedCandidates;
