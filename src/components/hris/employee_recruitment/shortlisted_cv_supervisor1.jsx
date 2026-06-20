import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaEye, FaDownload, FaFilePdf } from "react-icons/fa";

const Shortlisted_Cv_Supervisor1 = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Extract parameters from navigation state
    const { id: jobId, employeeNo } = location.state || {};
    const [showModal, setShowModal] = useState(false);
    const [candidates, setCandidates] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.min(5, Math.ceil(candidates.length / itemsPerPage));
    const paginatedCandidates = candidates.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    const API_URL = process.env.REACT_APP_FRONTEND_URL;

    useEffect(() => {
        if (!employeeNo || !jobId) return;

        const fetchCandidates = async () => {
            try {
                const response = await fetch(
                    `${API_URL}/v1/hris/jobpost/getCVsBySupervisorAndJob/${employeeNo}/${jobId}`
                );
                const result = await response.json();
                if (result.success) {
                    setCandidates(
                        result.cv_data.map(candidate => ({
                            ...candidate,
                            selectedStatus: candidate.supervisor01 === "Yes" // Convert to boolean
                        }))
                    );
                }
            } catch (error) {
                console.error("Error fetching candidates:", error);
            }
        };

        fetchCandidates();
    }, [employeeNo, jobId]);

    // Function to toggle the selection status
    const toggleSelectionStatus = (index) => {
        setCandidates(prevCandidates =>
            prevCandidates.map((candidate, i) =>
                i === index ? { ...candidate, selectedStatus: !candidate.selectedStatus } : candidate
            )
        );
    };

    // Check if at least one toggle is turned "Yes"
    const isAnySelected = candidates.some(candidate => candidate.selectedStatus);
    const confirmSend = async () => {
        setShowModal(false); // Close modal

        // Get IDs of selected candidates (toggle switched to Yes)
        const selectedCandidates = candidates
            .filter(candidate => candidate.selectedStatus)
            .map(candidate => candidate.id);

        if (selectedCandidates.length === 0) {
            alert("No candidates selected.");
            return;
        }

        console.log("🔹 Sending IDs to API:", JSON.stringify({ ids: selectedCandidates }));

        try {
            const response = await fetch(
                `${API_URL}/v1/hris/jobpost/update_supervisor01_status`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ ids: selectedCandidates }),
                }
            );

            const result = await response.json();
            console.log(" API Response:", result);

            if (response.ok && result.success) {
                alert("Successfully updated supervisor 01 status!");
            } else {
                alert("Failed to update. Please try again.");
            }
        } catch (error) {
            console.error("❌ Error updating status:", error);
            alert("An error occurred. Please try again.");
        }
    };


    return (
        <div className='px-10 py-5'>
            {/* Breadcrumb Navigation */}
            <div className="flex items-center space-x-2 text-gray-500 text-lg">
                <span>Employee Recruitment Settings</span>
                <span>/</span>
                <span className="text-gray-700">CVs Shortlisting</span>
                <span>/</span>
                <span className="text-gray-900 font-semibold">CV Shortlist 01</span>
            </div>

            <div className="flex justify-between items-center mt-4">
                <p className='text-[14px] font-semibold'>Supervisor 01 - {employeeNo}</p>

                {/* Show button only if at least one toggle switch is "Yes" */}
                {isAnySelected && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                        Send to Supervisor
                    </button>
                )}

            </div>

            {/* Candidates Table */}
            <div className='overflow-x-auto mt-4 p-4 shadow-lg rounded-lg'>
                <table className='w-full border-collapse text-sm'>
                    <thead className='bg-gray-100 text-gray-700'>
                        <tr>
                            <th className='py-2 px-4 text-left'>NAME</th>
                            <th className='py-2 px-4 text-left'>EMAIL</th>
                            <th className='py-2 px-4 text-left'>PHONE NUMBER</th>
                            <th className='py-2 px-4 text-left'>RATE</th>
                            <th className='py-2 px-4 text-left'>SELECTION STATUS</th>
                            <th className='py-2 px-4 text-left'>RESUME / CV</th>
                            <th className='py-2 px-4 text-left'>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {candidates.length > 0 ? (
                            paginatedCandidates.map((candidate, index) => (

                                <tr key={candidate.id} className='border-t'>
                                    <td className='py-2 px-4'>{candidate.firstName} {candidate.lastName}</td>
                                    <td className='py-2 px-4'>{candidate.email}</td>
                                    <td className='py-2 px-4'>{candidate.phoneNumber}</td>
                                    <td className='py-2 px-4'>{candidate.rate}</td>

                                    {/* Selection Status Toggle */}
                                    <td className='py-2 px-4 flex items-center gap-2'>
                                        <span className="text-gray-600">No</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={candidate.selectedStatus}
                                                onChange={() => toggleSelectionStatus(index)}
                                            />
                                            <div className="w-10 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 
                                                peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full 
                                                peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white 
                                                after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white 
                                                after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 
                                                after:transition-all peer-checked:bg-green-500">
                                            </div>
                                        </label>
                                        <span className="text-gray-600">Yes</span>
                                    </td>

                                    {/* Resume / CV */}
                                    <td className='py-2 px-4'>
                                        <FaFilePdf className="text-red-600 text-xl" />
                                        <a
                                            href={`${API_URL}/${candidate.filepath}`}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className="text-blue-600 hover:underline"
                                        >
                                            {candidate.filepath.split('/').pop()}
                                        </a>
                                    </td>

                                    {/* Actions (View & Download) */}
                                    <td className='py-2 px-4 space-x-4'>
                                        <button className='bg-blue-400 text-white p-1 rounded-md'>
                                            <FaEye />
                                        </button>
                                        <button className='bg-blue-700 text-white p-1 rounded-md'>
                                            <FaDownload />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="text-center py-4 text-gray-500">No candidates found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className='flex gap-2 justify-end mt-4'>
                <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className='bg-gray-200 px-3 py-1 rounded-lg disabled:opacity-50'
                >
                    Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-lg ${currentPage === page ? "bg-blue-500 text-white" : "bg-gray-200"
                            }`}
                    >
                        {page}
                    </button>
                ))}

                <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className='bg-gray-200 px-3 py-1 rounded-lg disabled:opacity-50'
                >
                    Next
                </button>
            </div>


            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                        <h2 className="text-xl font-semibold text-blue-600">Verification</h2>
                        <p className="text-gray-700 mt-2">
                            Are you sure you want to share the selected CV(s) with Supervisor 2 for review?
                            Once shared, modifications may not be possible.
                        </p>
                        <div className="mt-4 flex justify-center space-x-4">
                            <button
                                onClick={() => setShowModal(false)}
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
                            >
                                No
                            </button>
                            <button
                                onClick={confirmSend}
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
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

export default Shortlisted_Cv_Supervisor1;
