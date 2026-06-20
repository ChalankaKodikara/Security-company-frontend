import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { MdOutlineClose } from "react-icons/md";
import { FaEye } from "react-icons/fa";

const InterviewsWithStages = () => {
    const location = useLocation();
    const { id: interviewProcessId, name: jobTitle } = location.state || {};
    const [stages, setStages] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [timeSlots, setTimeSlots] = useState([]);
    const [availableDates, setAvailableDates] = useState([]);
    const [selectedDate, setSelectedDate] = useState("");
    const [availableTimes, setAvailableTimes] = useState([]);
    const [selectedTime, setSelectedTime] = useState("");
    const [selectedStageId, setSelectedStageId] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [popupType, setPopupType] = useState(""); // "success" or "error"
    const API_URL = process.env.REACT_APP_FRONTEND_URL;

    useEffect(() => {
        if (interviewProcessId) {
            fetch(`${API_URL}/v1/hris/interviewprocess/filtered-candidates?interviewProcessId=${interviewProcessId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        setCandidates(data.data || []); // Set candidates properly
                    }
                })
                .catch(error => console.error("Error fetching candidates:", error));

            fetch(`${API_URL}/v1/hris/interviewprocess/time-slots-by-process?interviewProcessId=${interviewProcessId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        setTimeSlots(data.data || []);
                        setTimeSlots(data.data || []);
                        const uniqueDates = [...new Set(data.data.flatMap(stage => stage.timeSlots.map(slot => slot.date)))];
                        const today = new Date().toISOString().split('T')[0]; // Get today's date
                        const upcomingDates = uniqueDates.filter(date => date >= today); // Filter out past dates
                        setAvailableDates(upcomingDates);
                    }
                })
                .catch(error => console.error("Error fetching time slots:", error));
        }
    }, [interviewProcessId]);

    const handleScheduleClick = (candidate) => {
        setSelectedCandidate(candidate);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedCandidate(null);
        setSelectedDate("");
        setSelectedTime("");
    };

    const handleDateChange = (event) => {
        const selectedDateValue = event.target.value;
        setSelectedDate(selectedDateValue);

        // Get all times & capture the stage ID
        const filteredTimes = [];
        let selectedStageId = null;

        timeSlots.forEach(stage => {
            const stageTimes = stage.timeSlots.filter(slot => slot.date === selectedDateValue);
            if (stageTimes.length > 0) {
                selectedStageId = stage.interviewStageId; // Store related interviewStageId
                filteredTimes.push(...stageTimes);
            }
        });

        setAvailableTimes(filteredTimes);
        setSelectedStageId(selectedStageId); // Store the stage ID
    };


    const handleConfirmSchedule = async () => {
        if (!selectedCandidate || !selectedDate || !selectedTime || !selectedStageId) {
            setPopupMessage("Please select a date and time slot.");
            setPopupType("error");
            setShowPopup(true);
            return;
        }

        const selectedTimeSlot = availableTimes.find(slot => slot.time === selectedTime);
        if (!selectedTimeSlot) {
            setPopupMessage("Invalid time slot selected.");
            setPopupType("error");
            setShowPopup(true);
            return;
        }

        const payload = {
            candidateId: selectedCandidate.id, //  Corrected to send selected candidate ID
            interviewStageId: selectedStageId,
            timeSlotId: selectedTimeSlot.timeSlotId
        };

        try {
            const response = await fetch(`${API_URL}/v1/hris/interviewprocess/allocate-candidate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setPopupMessage("Candidate successfully scheduled!");
                setPopupType("success");
                setShowPopup(true);
                handleCloseModal();
            } else {
                setPopupMessage(result.error || "Failed to schedule candidate.");
                setPopupType("error");
                setShowPopup(true);
            }
        } catch (error) {
            console.error("Error scheduling candidate:", error);
            setPopupMessage("Network error. Please try again.");
            setPopupType("error");
            setShowPopup(true);
        }
    };



    return (
        <div className="mx-10 mt-5">
            <p className="text-[22px] font-semibold">
                Employee Recruitment Settings / Interview Process / Interview /
                <span className="text-blue-500"> {jobTitle}</span>
            </p>
            <div className="shadow-lg rounded-lg bg-white mt-5 p-6">
                <table className="w-full border-collapse text-sm">
                    <thead className="bg-gray-100 text-gray-700">
                        <tr>
                            <th className="py-2 px-4 text-left">NAME</th>
                            <th className="py-2 px-4 text-left">EMAIL</th>
                            <th className="py-2 px-4 text-left">PHONE NUMBER</th>
                            <th className="py-2 px-4 text-left">RATE</th>
                            <th className="py-2 px-4 text-left">VIEW CV</th>
                            <th className="py-2 px-4 text-left">AVG</th>
                            <th className="py-2 px-4 text-left">SCHEDULE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {candidates.length > 0 ? (
                            candidates.map((candidate) => (
                                <tr key={candidate.id} className="border-t">
                                    <td className="py-2 px-4">{candidate.firstName} {candidate.lastName}</td>
                                    <td className="py-2 px-4">{candidate.email}</td>
                                    <td className="py-2 px-4">{candidate.phoneNumber}</td>
                                    <td className="py-2 px-4">{candidate.rate || "N/A"}</td>
                                    <td className="py-2 px-4">
                                        {candidate.filepath ? (
                                            <a href={candidate.filepath} target="_blank" rel="noopener noreferrer" className="bg-blue-500 text-white p-2 rounded-md flex items-center justify-center">
                                                <FaEye />
                                            </a>
                                        ) : (
                                            <span className="text-gray-400">No CV</span>
                                        )}
                                    </td>
                                    <td className="py-2 px-4">{candidate.totalScore || "0"}%</td>
                                    <td className="py-2 px-4">
                                        {candidate.status === "Scheduled" ? (
                                            <span className="bg-gray-300 p-2 text-gray-600 rounded-xl font-semibold cursor-not-allowed">
                                                Scheduled
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleScheduleClick(candidate)}
                                                className="bg-green-100 p-2 text-green-500 rounded-xl font-semibold"
                                            >
                                                Schedule Interview
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="text-center py-4 text-gray-500">No candidates available</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-[500px]">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-green-500 flex justify-center">Schedule? vvvv</h2>
                            <button onClick={handleCloseModal} className="text-gray-600 hover:text-gray-800">
                                <MdOutlineClose size={20} />
                            </button>
                        </div>
                        <p className="text-gray-700 text-sm mb-2">
                            Do you want to reschedule this candidate’s interview? Please select a new date and time.
                        </p>
                        <p className="font-semibold text-gray-900 mt-6">
                            Candidate Name: <span className="text-blue-500">{selectedCandidate?.firstName} {selectedCandidate?.lastName}</span>
                        </p>

                        <div className="flex justify-between space-x-3 mt-4">
                            <div className="mt-4 w-1/2">
                                <label className="text-gray-600 text-sm">Select Available Date</label>
                                <select
                                    className="border border-gray-300 rounded px-4 py-2 w-full"
                                    value={selectedDate || ""}
                                    onChange={handleDateChange}
                                >
                                    <option value="" disabled>Select date</option>
                                    {availableDates.map((date, index) => (
                                        <option key={index} value={date}>{date}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mt-4 w-1/2">
                                <label className="text-gray-600 text-sm">Select Available Time</label>
                                <select
                                    className="border border-gray-300 rounded px-4 py-2 w-full"
                                    value={selectedTime || ""}
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                    disabled={!selectedDate}
                                >
                                    <option value="" disabled>Select time</option>
                                    {availableTimes.length > 0 ? (
                                        availableTimes.map((slot) => (
                                            <option key={slot.timeSlotId} value={slot.time}>{slot.time}</option>
                                        ))
                                    ) : (
                                        <option disabled>No time slots available</option>
                                    )}
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-center space-x-2">
                            <button onClick={handleCloseModal} className="px-4 py-2 bg-gray-300 text-gray-700 rounded">
                                No
                            </button>
                            <button onClick={handleConfirmSchedule} className="px-4 py-2 bg-blue-500 text-white rounded">
                                Yes
                            </button>

                        </div>
                    </div>
                </div>
            )}{showPopup && (
                <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
                    <div className={`bg-white p-6 rounded-lg shadow-lg w-[450px] text-center ${popupType === "error" ? "border-red-500" : "border-green-500"}`}>
                        <h2 className={`text-xl font-semibold ${popupType === "error" ? "text-red-600" : "text-green-600"}`}>
                            {popupType === "error" ? "Error" : "Success"}
                        </h2>
                        <p className="mt-2 text-gray-700">{popupMessage}</p>

                        <div className="mt-4 flex justify-center gap-3">
                            <button
                                onClick={() => setShowPopup(false)}
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default InterviewsWithStages;
