import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MdRemoveRedEye } from "react-icons/md";
import { MdOutlineClose } from "react-icons/md"; // Close icon
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { IoIosArrowForward } from "react-icons/io";
import { IoIosArrowBack } from "react-icons/io";

const InterviewsWithStages = () => {
  const location = useLocation();
  const { interviewProcessId, name } = location.state || {}; // Retrieve the id and name from the route state
  const jobTitle = name; // Use the passed name or a default title
  const [timeSlots, setTimeSlots] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState(""); // "success" or "error"
  const [stages, setStages] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [problemSolving, setProblemSolving] = useState(5);
  const [communication, setCommunication] = useState(7);
  const [specialNote, setSpecialNote] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [allStagesCompleted, setAllStagesCompleted] = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  useEffect(() => {
    if (interviewProcessId) {
      fetch(
        `${API_URL}/v1/hris/interviewprocess/complete-stages-candidates?interviewProcessId=${interviewProcessId}`
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            const fetchedStages = data.stages || [];
            setStages(fetchedStages);

            const allCompleted = fetchedStages.every(
              (stage) => stage.status === "Completed"
            );
            setAllStagesCompleted(allCompleted);

            // Format candidate data properly
            const formattedCandidates = data.lastCompletedStageCandidates.map(
              (candidate) => ({
                id: candidate.candidateId,
                name: `${candidate.firstName} ${candidate.lastName}`,
                email: candidate.email,
                phoneNumber: candidate.phoneNumber,
                avg: candidate.totalScore, // Assuming this is the score
                resume: true, // Default resume value (API does not provide filepath)
                status: "Pending", // Default status
              })
            );

            setCandidates(formattedCandidates);
          }
        })
        .catch((error) =>
          console.error("Error fetching interview stage data:", error)
        );

      fetch(
        `${API_URL}/v1/hris/interviewprocess/time-slots-by-process?interviewProcessId=${interviewProcessId}`
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            setTimeSlots(data.data || []);
            setTimeSlots(data.data || []);
            const uniqueDates = [
              ...new Set(
                data.data.flatMap((stage) =>
                  stage.timeSlots.map((slot) => slot.date)
                )
              ),
            ];
            const today = new Date().toISOString().split("T")[0]; // Get today's date
            const upcomingDates = uniqueDates.filter((date) => date >= today); // Filter out past dates
            setAvailableDates(upcomingDates);
          }
        })
        .catch((error) => console.error("Error fetching time slots:", error));
    }
  }, [interviewProcessId]);

  const handleMarksClick = (candidate) => {
    setSelectedCandidate(candidate);
    setShowMarksModal(true);
  };
  const handleConfirmOnboard = async () => {
    if (!selectedCandidate || !selectedBranch) {
      setPopupMessage("Please select a branch before onboarding.");
      setPopupType("error");
      setShowPopup(true);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/v1/hris/interviewprocess/onboard-candidate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidateId: selectedCandidate.id,
          branch: selectedBranch,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setPopupMessage("Candidate onboarded successfully!");
        setPopupType("success");
      } else {
        setPopupMessage(result.message || "Failed to onboard candidate.");
        setPopupType("error");
      }
    } catch (error) {
      console.error("Onboarding error:", error);
      setPopupMessage("Network error occurred.");
      setPopupType("error");
    }

    setShowPopup(true);
    setShowOnboardModal(false);
  };
  useEffect(() => {
    if (showOnboardModal) {
      fetch(`${API_URL}/v1/hris/branch/all`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setBranches(data);
          }
        })
        .catch((err) => console.error("Error fetching branches:", err));
    }
  }, [showOnboardModal]);

  const handleCloseMarksModal = () => {
    setShowMarksModal(false);
    setSelectedCandidate(null);
    setProblemSolving(5);
    setCommunication(7);
    setSpecialNote("");
  };

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

    timeSlots.forEach((stage) => {
      const stageTimes = stage.timeSlots.filter(
        (slot) => slot.date === selectedDateValue
      );
      if (stageTimes.length > 0) {
        selectedStageId = stage.interviewStageId; // Store related interviewStageId
        filteredTimes.push(...stageTimes);
      }
    });

    setAvailableTimes(filteredTimes);
    setSelectedStageId(selectedStageId); // Store the stage ID
  };

  const handleConfirmSchedule = async () => {
    if (
      !selectedCandidate ||
      !selectedDate ||
      !selectedTime ||
      !selectedStageId
    ) {
      setPopupMessage("Please select a candidate, date, and time slot.");
      setPopupType("error");
      setShowPopup(true);
      return;
    }

    const selectedTimeSlot = availableTimes.find(
      (slot) => slot.time === selectedTime
    );
    if (!selectedTimeSlot) {
      setPopupMessage("Invalid time slot selected.");
      setPopupType("error");
      setShowPopup(true);
      return;
    }

    const payload = {
      candidateId: selectedCandidate.id, // Ensure candidateId is correctly included
      interviewStageId: selectedStageId,
      timeSlotId: selectedTimeSlot.timeSlotId,
    };

    try {
      const response = await fetch(
        `${API_URL}/v1/hris/interviewprocess/allocate-candidate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

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
  const handleOnboardClick = (candidate) => {
    setSelectedCandidate(candidate);
    setShowOnboardModal(true);
  };


  return (
    <div className="mx-10 mt-5">
      <p className="text-[22px] font-semibold">
        Employee Recruitment Settings / Interview Process / Interview /
        <span className="text-blue-500"> {jobTitle}</span>
      </p>
      <div className="flex mt-4 space-x-3">
        {stages.map((stage, index) => {
          const isCompleted = stage.status === "Completed";
          const isCurrent = stage.status === "Not Planned Yet";
          const isFinalStage = index === stages.length - 1; // Last item in the array

          return (
            <button
              key={stage.stageId}
              className={`px-4 py-2 rounded-lg border flex items-center space-x-2
                    ${
                      isCompleted
                        ? "bg-green-100 text-green-500 border-green-400"
                        : ""
                    }
                    ${
                      isCurrent
                        ? "bg-blue-100 text-blue-500 border-blue-400"
                        : ""
                    }
                    ${
                      !isCompleted && !isCurrent
                        ? "bg-gray-100 text-gray-400 border-gray-400"
                        : ""
                    }
                `}
            >
              {isCompleted && (
                <img
                  src="../../../assets/checked.png"
                  alt="Completed"
                  className="w-5 h-5 mr-2"
                />
              )}{" "}
              {/* Green check */}
              {isFinalStage ? "Final Stage" : stage.stageName}
            </button>
          );
        })}
      </div>

      <div className="shadow-lg rounded-lg bg-white mt-5 p-6">
        <p className="text-[18px]">Interview Stages - Technical Interview</p>
        {/* Candidate Table */}
        <div className="mt-5 bg-white rounded-lg">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="py-3 px-4 text-left">NAME</th>
                <th className="py-3 px-4 text-left">VIEW CV</th>
                <th className="py-3 px-4 text-left">STATUS</th>
                <th className="py-3 px-4 text-left"> AVG</th>
                <th className="py-3 px-4 text-left">MARKS</th>
                <th className="py-3 px-4 text-left">CONFIRMED DATE & TIME</th>
                <th className="py-3 px-4 text-left">EMAIL STATUS</th>
              </tr>
            </thead>
            <tbody>
              {candidates.length > 0 ? (
                candidates.map((candidate) => (
                  <tr key={candidate.id} className="border-t">
                    <td className="py-3 px-4">{candidate.name}</td>
                    <td className="py-3 px-4">
                      {candidate.resume ? (
                        <button className="text-blue-500">
                          <MdRemoveRedEye size={18} />
                        </button>
                      ) : (
                        <span className="text-gray-400">No CV</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`p-2 rounded-lg 
                        ${
                          candidate.status === "Interviewed"
                            ? "bg-blue-100 text-blue-500"
                            : "bg-yellow-100 text-yellow-500"
                        }
                    `}
                      >
                        {candidate.status || "Pending"}
                      </span>
                    </td>
                    <td className="py-3 px-4">{candidate.avg || "N/A"}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleMarksClick(candidate)}
                        className="bg-gray-900 text-white p-2 rounded-md"
                      >
                        Marks
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      {allStagesCompleted ? (
                        <button
                          onClick={() => handleOnboardClick(candidate)}
                          className="bg-purple-100 p-2 text-purple-500 rounded-xl font-semibold"
                        >
                          Onboard
                        </button>
                      ) : (
                        <button
                          onClick={() => handleScheduleClick(candidate)}
                          className="bg-green-100 p-2 text-green-500 rounded-xl font-semibold"
                        >
                          Schedule Interview
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="bg-yellow-100 text-yellow-500 p-2 rounded-xl font-semibold flex justify-center w-fit">
                        Pending
                      </p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-gray-500">
                    No candidates available for this stage.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showOnboardModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[500px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-blue-500">
                Onboard Candidate?
              </h2>
              <button
                onClick={() => setShowOnboardModal(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                <MdOutlineClose size={20} />
              </button>
            </div>
            <p className="text-gray-700 mb-4">
              Are you sure you want to onboard{" "}
              <span className="font-semibold text-blue-500">
                {selectedCandidate?.name}
              </span>
              ?
            </p>

            <div className="mt-4">
              <label className="block mb-1 text-sm text-gray-700">
                Select Branch
              </label>
              <select
                className="w-full px-3 py-2 border rounded-lg border-gray-300"
                value={selectedBranch || ""}
                onChange={(e) => setSelectedBranch(Number(e.target.value))}
              >
                <option value="" disabled>
                  Select a branch
                </option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branch}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowOnboardModal(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOnboard}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Yes, Onboard
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[500px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-green-500 flex justify-center">
                Schedule?
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-600 hover:text-gray-800"
              >
                <MdOutlineClose size={20} />
              </button>
            </div>
            <p className="text-gray-700 text-sm mb-2">
              Do you want to reschedule this candidate’s interview? Please
              select a new date and time.
            </p>
            <p className="font-semibold text-gray-900 mt-6">
              Candidate Name:{" "}
              <span className="text-blue-500">
                {selectedCandidate?.firstName} {selectedCandidate?.lastName}
              </span>
            </p>

            <div className="flex justify-between space-x-3 mt-4">
              <div className="mt-4 w-1/2">
                <label className="text-gray-600 text-sm">
                  Select Available Date
                </label>
                <select
                  className="border border-gray-300 rounded px-4 py-2 w-full"
                  value={selectedDate || ""}
                  onChange={handleDateChange}
                >
                  <option value="" disabled>
                    Select date
                  </option>
                  {availableDates.map((date, index) => (
                    <option key={index} value={date}>
                      {date}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 w-1/2">
                <label className="text-gray-600 text-sm">
                  Select Available Time
                </label>
                <select
                  className="border border-gray-300 rounded px-4 py-2 w-full"
                  value={selectedTime || ""}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  disabled={!selectedDate}
                >
                  <option value="" disabled>
                    Select time
                  </option>
                  {availableTimes.length > 0 ? (
                    availableTimes.map((slot) => (
                      <option key={slot.timeSlotId} value={slot.time}>
                        {slot.time}
                      </option>
                    ))
                  ) : (
                    <option disabled>No time slots available</option>
                  )}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-center space-x-2">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
              >
                No
              </button>
              <button
                onClick={handleConfirmSchedule}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
      {showPopup && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div
            className={`bg-white p-6 rounded-lg shadow-lg w-[450px] text-center ${
              popupType === "error" ? "border-red-500" : "border-green-500"
            }`}
          >
            <h2
              className={`text-xl font-semibold ${
                popupType === "error" ? "text-red-600" : "text-green-600"
              }`}
            >
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

      {showMarksModal && selectedCandidate && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[900px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-blue-500">
                Candidate Evaluation Marks
              </h2>
              <button
                onClick={handleCloseMarksModal}
                className="text-gray-600 hover:text-gray-800"
              >
                <MdOutlineClose size={20} />
              </button>
            </div>

            <div className="mb-2">
              <p className="text-gray-700 text-sm">
                <strong>Stage Name:</strong> Technical Interview
              </p>
              <p className="text-gray-700 text-sm">
                <strong>Date & Time:</strong> 2025 January 25 | 2 pm
              </p>
              <p className="text-gray-700 text-sm">
                <strong>Candidate Name:</strong>{" "}
                <span className="text-blue-500">{selectedCandidate.name}</span>
              </p>
            </div>

            <div className="mt-4">
              <div>
                <label className="text-gray-600 text-sm">
                  Select Interviewer
                </label>
              </div>
              <select className="border border-gray-300 rounded px-4 py-2 w-1/3">
                <option value="Jaxson Franci">Jaxson Franci</option>
                <option value="Alex Johnson">Alex Johnson</option>
              </select>
            </div>

            {/* Marking Scheme */}
            <div className="mt-4">
              <p className="text-gray-900 font-semibold">Marking Scheme</p>
              <div className="grid grid-cols-2 grid-rows-1 gap-12 items-center mt-2">
                <div className="flex justify-between items-center">
                  <p className="text-gray-700">Problem-Solving Skills</p>
                  <div className="flex items-center ml-4">
                    <button
                      onClick={() =>
                        setProblemSolving(Math.max(0, problemSolving - 1))
                      }
                      className="bg-gray-200 text-gray-400 p-2 rounded-full"
                    >
                      <IoIosArrowBack />
                    </button>
                    <span className="mx-3">{problemSolving} / 10</span>
                    <button
                      onClick={() =>
                        setProblemSolving(Math.min(10, problemSolving + 1))
                      }
                      className="bg-gray-200 gray-gray-400 p-2 rounded-full"
                    >
                      <IoIosArrowForward />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <p className="text-gray-700">Communication Skills</p>
                  <div className="flex items-center ml-4">
                    <button
                      onClick={() =>
                        setCommunication(Math.max(0, communication - 1))
                      }
                      className="bg-gray-200 p-2 rounded-full"
                    >
                      <IoIosArrowBack />
                    </button>
                    <span className="mx-3">{communication} / 10</span>
                    <button
                      onClick={() =>
                        setCommunication(Math.min(10, communication + 1))
                      }
                      className="bg-gray-200 p-2 rounded-full"
                    >
                      <IoIosArrowForward />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Special Note */}
            <div className="mt-4">
              <label className="text-gray-600 text-sm">Special Note</label>
              <textarea
                className="border border-gray-300 rounded px-4 py-2 w-full"
                rows="3"
                value={specialNote}
                onChange={(e) => setSpecialNote(e.target.value)}
                placeholder="Add any additional notes..."
              />
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-center space-x-2">
              <button
                onClick={handleCloseMarksModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-500 text-white rounded">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewsWithStages;
