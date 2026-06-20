import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MdRemoveRedEye } from "react-icons/md";
import { LuUserX } from "react-icons/lu";
import { FaPersonWalking } from "react-icons/fa6";

const InterviewsWithStages = () => {
    const location = useLocation();
    const { id: jobId, title: jobTitle } = location.state || {};
    const [stages, setStages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [showModal, setShowModal] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [attendanceStatus, setAttendanceStatus] = useState("");
    const API_URL = process.env.REACT_APP_FRONTEND_URL;

    useEffect(() => {
        if (jobId) {
            fetchInterviewStages(jobId);
        }
    }, [jobId]);

    const fetchInterviewStages = async (id) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `${API_URL}/v1/hris/interviewprocess/scheduled-candidates?jobId=${id}`
            );
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setStages(result.interviewStages || []);
                } else {
                    setError("Failed to fetch interview stages.");
                }
            } else {
                setError("Error: Unable to fetch interview stages.");
            }
        } catch (error) {
            setError("Network error. Please try again later.");
            console.error("Error fetching interview stages:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmAttendance = async () => {
        if (!selectedCandidate) return;

        try {
            const response = await fetch(
                `${API_URL}/v1/hris/interviewprocess/update-attendance`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        candidateId: selectedCandidate.candidateId,
                        attendanceStatus,
                    }),
                }
            );

            const result = await response.json();

            if (response.ok && result.success) {
                setStages((prevStages) =>
                    prevStages.map((stage) => ({
                        ...stage,
                        candidates: stage.candidates.map((candidate) =>
                            candidate.candidateId === selectedCandidate.candidateId
                                ? { ...candidate, attendance: attendanceStatus }
                                : candidate
                        ),
                    }))
                );
            } else {
                console.error("Failed to update attendance:", result.message);
            }
        } catch (error) {
            console.error("Error updating attendance:", error);
        }

        setShowModal(false);
    };

    const handleAttendanceClick = (candidate, status) => {
        setSelectedCandidate(candidate);
        setAttendanceStatus(status);
        setShowModal(true);
    };

    const allCandidates = stages.flatMap(stage => stage.candidates);
    const totalPages = Math.ceil(allCandidates.length / itemsPerPage);
    const currentCandidates = allCandidates.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className='mx-10 mt-5'>
            <p className='text-[22px]'>Employee Recruitment Settings / Interview Process / Interview
                <span className='font-semibold'> {jobTitle}</span>
            </p>

            {isLoading ? (
                <p className="text-gray-600 mt-4">Loading interview stages...</p>
            ) : error ? (
                <p className="text-red-500 mt-4">{error}</p>
            ) : stages.length === 0 ? (
                <p className="text-gray-600 mt-4">No interview stages available.</p>
            ) : (
                <div className="mt-5">
                    <table className="shadow-lg w-full border-collapse text-sm">
                        <thead className="bg-gray-100 text-gray-700">
                            <tr>
                                <th className="py-2 px-4 text-left">NAME</th>
                                <th className="py-2 px-4 text-left">Confirmed Date & Time</th>
                                <th className="py-2 px-4 text-left">View CV</th>
                                <th className="py-2 px-4 text-left">Status</th>
                                <th className="py-2 px-4 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentCandidates.map((candidate) => (
                                <tr key={candidate.candidateId} className="border-t">
                                    <td className="py-2 px-4">{candidate.firstName} {candidate.lastName}</td>
                                    <td className="py-2 px-4">{candidate.interviewDate} - {candidate.interviewTime}</td>
                                    <td className="py-2 px-4">
                                        {candidate.resumePath ? (
                                            <a href={candidate.resumePath} target="_blank" rel="noopener noreferrer" className='text-blue-500'>
                                                <MdRemoveRedEye />
                                            </a>
                                        ) : (
                                            <span className="text-gray-400">No CV</span>
                                        )}
                                    </td>
                                    <td className="py-2 px-4">
                                        <td className="py-2 px-4">
                                            <span className={`p-2 rounded-lg 
        ${candidate.attendance === "No" ? "bg-red-100 text-red-500" :
                                                    candidate.attendance === "Yes" ? "bg-green-100 text-green-500" :
                                                        "bg-yellow-100 text-yellow-500"}`}>
                                                {candidate.attendance === "Yes" ? "Arrived" :
                                                    candidate.attendance === "No" ? "Absent" : "Pending"}
                                            </span>
                                        </td>

                                    </td>
                                    <td className="py-2 px-4">
                                        <div className='flex space-x-3 items-center'>
                                            <span
                                                className='cursor-pointer bg-red-100 text-red-500 p-2 rounded'
                                                onClick={() => handleAttendanceClick(candidate, "No")}
                                            >
                                                <LuUserX size={16} />
                                            </span>

                                            <span
                                                className='cursor-pointer bg-green-100 text-green-500 p-2 rounded'
                                                onClick={() => handleAttendanceClick(candidate, "Yes")}
                                            >
                                                <FaPersonWalking size={16} />
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex justify-between items-center mt-4">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {showModal && selectedCandidate && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] text-center">
                        <h2 className="text-lg font-semibold">
                            {attendanceStatus === "Yes" ? "Confirm Arrival?" : "Mark as Absent?"}
                        </h2>
                        <p className="text-gray-600 mt-2">{selectedCandidate.firstName} {selectedCandidate.lastName}</p>
                        <div className="mt-4 flex justify-center space-x-4">
                            <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className={`px-4 py-2 text-white ${attendanceStatus === "Yes" ? "bg-green-500" : "bg-red-500"}`} onClick={handleConfirmAttendance}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default InterviewsWithStages;
