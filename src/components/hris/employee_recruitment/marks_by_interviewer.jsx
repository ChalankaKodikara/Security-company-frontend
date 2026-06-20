import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { IoIosArrowRoundForward, IoIosCloseCircleOutline, IoIosArrowForward, IoIosArrowBack } from "react-icons/io";

const MarksByInterviewer = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const jobId = queryParams.get("jobId");

    const [candidates, setCandidates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [criteria, setCriteria] = useState([]);
    const [note, setNote] = useState("");
    const [employeeNo, setEmployeeNo] = useState("");
    const [submittedCandidates, setSubmittedCandidates] = useState(new Set());
    const [responseMessage, setResponseMessage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCandidates = candidates.slice(indexOfFirstItem, indexOfLastItem);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const API_URL = process.env.REACT_APP_FRONTEND_URL;


    useEffect(() => {
        if (jobId) {
            fetchCandidatesData();
        }
        // Retrieve employee_no from cookies
        const cookies = document.cookie.split("; ");
        const employeeCookie = cookies.find(row => row.startsWith("employee_no="));
        if (employeeCookie) {
            setEmployeeNo(employeeCookie.split("=")[1]);
        }
    }, [jobId]);

    const fetchCandidatesData = async () => {
        setIsLoading(true);
        setError(null);
        const today = new Date().toISOString().split('T')[0];

        try {
            const response = await fetch(
                `${API_URL}/v1/hris/interviewprocess/interview-candidates-by-jobid-date?jobId=${jobId}&date=${today}`
            );

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setCandidates(result.interviewStages.flatMap(stage =>
                        stage.candidates.map(candidate => ({
                            ...candidate,
                            stageId: stage.stageId,
                            stageName: stage.stageName
                        }))
                    ));
                } else {
                    setError("Failed to fetch interview candidates.");
                }
            } else {
                setError("Error: Unable to fetch interview candidates.");
            }
        } catch (error) {
            setError("Network error. Please try again later.");
            console.error("Error fetching candidates:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCriteriaData = async (candidateId, stageId) => {
        try {
            const response = await fetch(
                `${API_URL}/v1/hris/interviewprocess/criteria-candidates-by-stageid-candidateid?interviewStageId=${stageId}&candidateId=${candidateId}`
            );

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setCriteria(result.criteria.map(c => ({ ...c, score: c.score || 0 })));
                }
            }
        } catch (error) {
            console.error("Error fetching criteria:", error);
        }
    };

    const openModal = (candidate) => {
        setSelectedCandidate(candidate);
        setCriteria([]);
        setNote("");
        fetchCriteriaData(candidate.candidateId, candidate.stageId);
        setShowModal(true);
    };

    const submitScores = async () => {
        if (!selectedCandidate || !employeeNo) {
            alert("Error: Missing candidate data or interviewer ID.");
            return;
        }

        const payload = {
            candidateId: selectedCandidate.candidateId,
            interviewStageId: selectedCandidate.stageId,
            interviewerId: employeeNo,
            scores: criteria.map(({ criteriaId, score }) => ({ criteriaId, score }))
        };

        try {
            const response = await fetch(`${API_URL}/v1/hris/interviewprocess/add-score`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok) {
                setShowModal(false);
                setSubmittedCandidates(prev => new Set([...prev, selectedCandidate.candidateId]));
                setResponseMessage(result.message);
            } else {
                setResponseMessage("Error submitting scores. Please try again.");
            }
        } catch (error) {
            console.error("Error submitting scores:", error);
            setResponseMessage("Network error. Please try again later.");
        }
    };

    const submitFinalResults = async () => {
        try {
            const response = await fetch(`${API_URL}/submit-results`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ jobId })
            });

            const result = await response.json();

            if (result.success) {
                setResponseMessage("Final results submitted successfully.");
            } else {
                setResponseMessage("Error submitting final results. Please try again.");
            }
        } catch (error) {
            console.error("Error submitting final results:", error);
            setResponseMessage("Network error. Please try again later.");
        }
    };

    const markStageComplete = async () => {
        if (!candidates.length) {
            setResponseMessage("No candidates available for submission.");
            return;
        }

        const interviewStageId = candidates[0].stageId; // Get the stageId from the first candidate

        // Retrieve employee_no from cookies
        const cookies = document.cookie.split("; ");
        const employeeCookie = cookies.find(row => row.startsWith("employee_no="));
        const employeeId = employeeCookie ? employeeCookie.split("=")[1] : null;

        if (!employeeId) {
            setResponseMessage("Error: Employee ID not found.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/v1/hris/interviewprocess/complete-stage`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ interviewStageId, employeeId })
            });

            const result = await response.json();

            if (response.ok) {
                setResponseMessage("Interview stage marked as complete.");
            } else {
                setResponseMessage(result.message || "Error completing the interview stage.");
            }
        } catch (error) {
            console.error("Error marking stage as complete:", error);
            setResponseMessage("Network error. Please try again later.");
        }
    };


    return (
        <div className="mx-10 mt-5">
            <p className="text-[22px]">
                Employee Recruitment Settings / Interview Process / <span>Interview</span>
            </p>

            {isLoading ? (
                <p className="text-gray-600 mt-4">Loading candidates...</p>
            ) : error ? (
                <p className="text-red-500 mt-4">{error}</p>
            ) : candidates.length === 0 ? (
                <p className="text-gray-600 mt-4">No candidates available.</p>
            ) : (
                <div className='shadow-lg rounded-md p-2 mt-5'>
                    <table className="w-full border-collapse text-sm mt-4">
                        <thead className="bg-gray-100 text-gray-700">
                            <tr>
                                <th className="py-2 px-4 text-left">NAME</th>
                                <th className="py-2 px-4 text-left">Confirmed Date & Time</th>
                                <th className="py-2 px-4 text-left">Status</th>
                                <th className="py-2 px-4 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentCandidates.map((candidate) => (
                                <tr key={candidate.candidateId} className="border-t">
                                    <td className="py-2 px-4">{candidate.firstName} {candidate.lastName}</td>
                                    <td className="py-2 px-4">{candidate.interviewDate} - {candidate.interviewTime || "Not Scheduled"}</td>
                                    <td className="py-2 px-4">

                                        <span className={`p-2 rounded-lg ${candidate.attendance === "Yes" ? "bg-green-100 text-green-500" : "bg-red-100 text-red-500"
                                            }`}>
                                            {candidate.attendance === "Yes" ? "Arrived" : "Absent"}
                                        </span>
                                    </td>
                                    <td className="py-2 px-4">
                                        <button
                                            className={`text-white py-2 px-4 rounded-lg font-semibold ${submittedCandidates.has(candidate.candidateId) ? "bg-green-500" : "bg-black"
                                                }`}
                                            onClick={() => openModal(candidate)}
                                        >
                                            {submittedCandidates.has(candidate.candidateId) ? "View Marks" : "Give Marks"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>

                    </table>

                    <div className='flex justify-end mt-4'>
                        <button
                            className="bg-blue-500 text-white p-2 rounded-md"
                            onClick={() => {
                                setShowSubmitModal(false);
                                markStageComplete();
                            }}


                        >
                            <div className='flex items-center gap-2'>
                                Submit
                                <IoIosArrowRoundForward />
                            </div>
                        </button>


                    </div>


                    <div className="flex justify-end mt-4">
                        <button
                            className="bg-gray-300 px-3 py-1 mx-1 rounded-md"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                        >
                            Previous
                        </button>
                        <span className="px-3 py-1 bg-gray-200 rounded-md">Page {currentPage}</span>
                        <button
                            className="bg-gray-300 px-3 py-1 mx-1 rounded-md"
                            disabled={indexOfLastItem >= candidates.length}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>

            )}

            {showModal && selectedCandidate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-[800px] text-center relative">
                        <button className="absolute top-3 right-3 text-gray-500" onClick={() => setShowModal(false)}>
                            <IoIosCloseCircleOutline className='w-6 h-6' />
                        </button>

                        <h2 className="text-xl font-semibold text-blue-600">Candidate Evaluation</h2>

                        <div className="mt-4 p-4 border rounded-md text-left">
                            <p>Stage Name: <span className="font-semibold">{selectedCandidate.stageName}</span></p>
                            <p>Date & Time: {selectedCandidate.interviewDate} - {selectedCandidate.interviewTime}</p>
                            <p>Candidate: <span className="text-blue-500">{selectedCandidate.firstName} {selectedCandidate.lastName}</span></p>
                        </div>

                        <div className="mt-4">
                            <h3 className="font-semibold">Marking Scheme</h3>
                            {criteria.map((criterion) => (
                                <div key={criterion.criteriaId} className="flex justify-between mt-3">
                                    <p className="mb-2">{criterion.criteria}</p>
                                    <div className="flex items-center space-x-3">
                                        <button className="p-2 border rounded-full" onClick={() => setCriteria(prev => prev.map(c => c.criteriaId === criterion.criteriaId ? { ...c, score: Math.max(0, c.score - 1) } : c))}>
                                            <IoIosArrowBack />
                                        </button>
                                        <p className="text-lg font-semibold">{criterion.score} /10</p>
                                        <button className="p-2 border rounded-full" onClick={() => setCriteria(prev => prev.map(c => c.criteriaId === criterion.criteriaId ? { ...c, score: Math.min(10, c.score + 1) } : c))}>
                                            <IoIosArrowForward />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className='flex justify-end'>

                            <button onClick={submitScores} className="bg-blue-500 text-white p-2  rounded-md mt-4 w-fit">
                                <div className='flex items-center gap-4'>
                                    <div>Submit </div>
                                    <div><IoIosArrowRoundForward /></div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {responseMessage && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] text-center relative">
                        <button className="absolute top-3 right-3 text-gray-500" onClick={() => setResponseMessage(null)}>
                            <IoIosCloseCircleOutline className='w-6 h-6' />
                        </button>
                        <h2 className="text-xl font-semibold text-blue-600">Submission Status</h2>
                        <p className="mt-4 text-gray-700">{responseMessage}</p>
                        <button className="bg-blue-500 text-white px-4 py-2 rounded-md mt-4" onClick={() => setResponseMessage(null)}>
                            OK
                        </button>
                    </div>
                </div>
            )}

            {showSubmitModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-[500px] text-center relative">
                        <button
                            className="absolute top-3 right-3 text-gray-500"
                            onClick={() => setShowSubmitModal(false)}
                        >
                            <IoIosCloseCircleOutline className='w-6 h-6' />
                        </button>

                        <h2 className="text-xl font-semibold text-green-600">Submit?</h2>
                        <p className="mt-4 text-gray-700">
                            You have completed interviewing all candidates. Are you sure
                            you want to submit the final results? Once submitted,
                            changes may not be possible.
                        </p>

                        <div className="flex justify-center gap-4 mt-6">
                            <button
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md"
                                onClick={() => setShowSubmitModal(false)}
                            >
                                No
                            </button>
                            <button
                                className="bg-blue-500 text-white px-4 py-2 rounded-md"
                                onClick={() => {
                                    setShowSubmitModal(false);
                                    submitFinalResults();
                                }}
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

export default MarksByInterviewer;
