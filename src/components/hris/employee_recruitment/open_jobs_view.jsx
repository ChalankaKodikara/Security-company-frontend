/** @format */

import React, { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { FaUser, FaEye, FaDownload, FaFilePdf } from "react-icons/fa";
import { MdKeyboardArrowRight } from "react-icons/md";
import { MdKeyboardArrowLeft } from "react-icons/md";
import Cookies from "js-cookie";

const OpenJobsView = () => {
  const location = useLocation();
  const { jobId: jobIdFromParams } = useParams();
  const navigate = useNavigate();

  // Get jobId and isActive from state or fallback to params

  const {
    jobId,
    isActive,
    title,
    jobtype,
    location: jobLocation,
  } = location.state || {};
  const [showPopup, setShowPopup] = useState(false);
  const [supervisorOne, setSupervisorOne] = useState("");
  const [supervisorTwo, setSupervisorTwo] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [supervisors, setSupervisors] = useState([]);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const token = Cookies.get("accessToken");

  const itemsPerPage = 10;
  const totalPages = Math.min(5, Math.ceil(candidates.length / itemsPerPage));
  const paginatedCandidates = candidates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const togglePopup = () => {
    setShowPopup(!showPopup);
  };

  useEffect(() => {
    fetch(`${API_URL}/v1/hris/jobpost/employees`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setSupervisors(data.data);
        }
      })
      .catch((error) => console.error("Error fetching supervisors:", error));
  }, []);

  useEffect(() => {
    if (!jobId) return;

    const fetchCandidates = async () => {
      try {
        const response = await fetch(
          `${API_URL}/v1/hris/jobpost/get-cvs-by-job/${jobId}`
        );
        const result = await response.json();
        if (result.success) {
          // Initialize rating for each candidate
          const candidatesWithRating = result.data.map((candidate) => ({
            ...candidate,
            rating: 0, // Default rating
          }));
          setCandidates(candidatesWithRating);
        }
      } catch (error) {
        console.error("Error fetching candidates:", error);
      }
    };

    fetchCandidates();
  }, [jobId]);

  const handleSendToHR = async () => {
    if (!supervisorOne || !supervisorTwo) {
      alert("Please select both Supervisor 1 and Supervisor 2.");
      return;
    }

    // Filter only selected candidates and ensure they have a rating
    const formattedCandidates = candidates
      .filter((candidate) => candidate.selected === "Yes")
      .map((candidate) => ({
        candidateId: candidate.id,
        rate: `${candidate.rating}/10`, // Formatting the rating correctly
      }));

    if (formattedCandidates.length === 0) {
      alert(
        "No candidates have been selected. Please select candidates before sending."
      );
      return;
    }

    // Construct payload with selected Supervisor employee numbers
    const payload = {
      candidates: formattedCandidates,
      supervisor01: supervisorOne, // Send as selected employee number
      supervisor02: supervisorTwo, // Send as selected employee number
    };

    try {
      const response = await fetch(
        `${API_URL}/v1/hris/jobpost/updateMultipleCandidatesRateAndSelection`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      if (result.success) {
        alert("Candidates successfully sent with ratings!");
        togglePopup(); // Close the popup after success
      } else {
        alert(`Failed to send candidates: ${result.message}`);
      }
    } catch (error) {
      console.error("Error sending candidates:", error);
      alert("An error occurred. Please try again.");
    }
  };

  useEffect(() => {
    console.log("Received data:", location.state); // Debugging
  }, [location.state]);

  const downloadFile = async (email, filepath) => {
    try {
      const response = await fetch(
        `${API_URL}/v1/hris/employees/get-file-url/${email}/${filepath}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filepath.split("/").pop();
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const updateRating = (index, change) => {
    setCandidates((prevCandidates) =>
      prevCandidates.map((candidate, i) =>
        i === index
          ? {
              ...candidate,
              rating: Math.max(0, Math.min(10, candidate.rating + change)),
            }
          : candidate
      )
    );
  };

  const handleToggleSelection = async (candidateId, currentSelection) => {
    const newSelection = currentSelection === "Yes" ? "No" : "Yes";

    // Update the UI immediately
    setCandidates((prevCandidates) =>
      prevCandidates.map((candidate) =>
        candidate.id === candidateId
          ? { ...candidate, selected: newSelection }
          : candidate
      )
    );

    // Prepare the correct payload format
    const payload = {
      candidates: [
        {
          candidateId: candidateId,
          rate: "0/10", // Assuming a default rate, update accordingly
        },
      ],
      supervisor01: supervisorOne || "Supervisor 1 Name", // Replace with actual value
      supervisor02: supervisorTwo || "Supervisor 2 Name", // Replace with actual value
    };

    try {
      const response = await fetch(
        `${API_URL}/v1/hris/jobpost/updateMultipleCandidatesRateAndSelection`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      if (!result.success) {
        alert("Failed to update selection status. Please try again.");
      }
    } catch (error) {
      console.error("Error updating selection status:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="px-10 py-5">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-gray-500 text-lg">
        <span>Employee Recruitment Settings</span>
        <span>/</span>
        <span className="text-gray-700">CVs Shortlisting</span>
        <span>/</span>
        <span className="text-gray-700 font-semibold">Open Jobs</span>
        <span>/</span>
        <span className="text-gray-900 font-semibold">
          {title || "Job Title Not Available"}
        </span>{" "}
        {/* Dynamically Inserted Title */}
      </div>

      {/* Job Details Section */}
      <div className="bg-blue-100 p-5 rounded-lg mt-6 flex justify-between items-center">
        <div>
          <p className="text-lg font-semibold">
            {title || "Job Title Not Available"}
          </p>{" "}
          {/* Dynamically Inserted Title */}
        </div>
        <div className="text-gray-700">
          <p>
            {jobLocation
              ? `Location - ${jobLocation}`
              : "Location - Not Available"}
          </p>
          <div className="flex space-x-2 mt-2">
            <button className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm">
              New Role
            </button>
            <button className="bg-purple-500 text-white px-3 py-1 rounded-lg text-sm">
              {jobtype || "N/A"}
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-blue-500 text-white p-3 rounded-full">
            <FaUser />
          </div>
          <div>
            <p className="text-lg font-semibold">{candidates.length}</p>
            <p className="text-gray-500 text-sm">Candidates who applied</p>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="mt-6 items-center border-b pb-2 flex justify-end">
        {isActive === 0 ? (
          <div>
            <button
              className="px-4 py-2 rounded-lg font-semibold bg-blue-500 text-white hover:bg-blue-600 "
              onClick={togglePopup}
            >
              Send to Supervisor 1
            </button>
          </div>
        ) : (
          <p className="bg-red-200 p-2 rounded-md text-red-500 ">
            If you want to be shortlisted, first you need to close the job
            vacancy.
          </p>
        )}
      </div>

      {/* Candidates Table */}
      <div className="overflow-x-auto mt-4 p-4 shadow-lg rounded-lg">
        <table className="w-full border-collapse text-sm ">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="py-2 px-4 text-left">NAME</th>
              <th className="py-2 px-4 text-left">EMAIL</th>
              <th className="py-2 px-4 text-left">PHONE NUMBER</th>
              <th className="py-2 px-4 text-left">RATE</th>
              <th className="py-2 px-4 text-left">SELECTION STATUS</th>
              <th className="py-2 px-4 text-left">RESUME / CV</th>
              <th className="py-2 px-4 text-left">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCandidates.map((candidate, index) => (
              <tr key={candidate.id} className="border-t">
                <td className="py-2 px-4">
                  {candidate.firstName} {candidate.lastName}
                </td>
                <td className="py-2 px-4">{candidate.email}</td>
                <td className="py-2 px-4">{candidate.phoneNumber}</td>

                {/* Rate Column with Left & Right Arrows */}
                <td className="py-2 px-4  items-center gap-2">
                  <button
                    className="mr-2 p-1 bg-gray-200 rounded-full"
                    onClick={() => updateRating(index, -1)}
                    disabled={candidate.rating <= 0}
                  >
                    <MdKeyboardArrowLeft />
                  </button>
                  <span>{candidate.rating} / 10</span>
                  <button
                    className=" ml-2 p-1 bg-gray-200 rounded-full"
                    onClick={() => updateRating(index, 1)}
                    disabled={candidate.rating >= 10}
                  >
                    <MdKeyboardArrowRight />
                  </button>
                </td>

                {/* Selection Status Toggle */}
                <td className="py-2 px-4 flex items-center gap-2">
                  <span className="text-gray-600">
                    {candidate.selected === "Yes" ? "Yes" : "No"}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={candidate.selected === "Yes"}
                      onChange={() =>
                        handleToggleSelection(candidate.id, candidate.selected)
                      }
                    />
                    <div
                      className="w-10 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 
            peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full 
            peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white 
            after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white 
            after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 
            after:transition-all peer-checked:bg-green-500"
                    ></div>
                  </label>
                </td>

                {/* Resume / CV */}
                <td className="py-2 px-4  items-center gap-2">
                  <FaFilePdf className="text-red-600 text-xl" />
                  <a
                    href={`${API_URL}/${candidate.filepath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {candidate.filepath.split("/").pop()}
                  </a>
                </td>

                {/* Actions (View & Download) */}
                <td className="py-2 px-4 space-x-4">
                  {/* Actions (View & Download) */}
                  <td className="py-2 px-4 space-x-4">
                    <button className="bg-blue-400 text-white p-1 rounded-md">
                      <FaEye />
                    </button>
                    <a
                      href={`${API_URL}/v1/hris/employees/get-file-url/${
                        candidate.email
                      }/${candidate.filepath.split("/").pop()}`}
                      target="_blank"
                      headers={{ Authorization: `Bearer ${token}` }}
                      rel="noopener noreferrer"
                      className="bg-blue-700 text-white p-1 rounded-md inline-flex items-center"
                    >
                      <FaDownload />
                    </a>
                  </td>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <span className="text-gray-600">
          Showing {paginatedCandidates.length} of {candidates.length} entries
        </span>

        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="bg-gray-200 px-3 py-1 rounded-lg"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded-lg ${
                currentPage === page ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="bg-gray-200 px-3 py-1 rounded-lg"
          >
            Next
          </button>
        </div>
      </div>

      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[450px]">
            <h2 className="text-lg font-semibold mb-3">CVs Shortlisting</h2>
            <p className="text-gray-600 text-sm mb-4">
              If you want to continue, please assign it to a Supervisor 1 and
              Supervisor 2.
            </p>

            {/* Supervisor 1 Dropdown */}
            <label className="block text-sm font-medium text-gray-700">
              Supervisor 01
            </label>
            <select
              value={supervisorOne}
              onChange={(e) => setSupervisorOne(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 mb-3"
            >
              <option value="">Select Supervisor</option>
              {supervisors.map((supervisor) => (
                <option
                  key={supervisor.employee_no}
                  value={supervisor.employee_no}
                >
                  {supervisor.employee_calling_name} ({supervisor.employee_no})
                </option>
              ))}
            </select>

            {/* Supervisor 2 Dropdown */}
            <label className="block text-sm font-medium text-gray-700">
              Supervisor 02
            </label>
            <select
              value={supervisorTwo}
              onChange={(e) => setSupervisorTwo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 mb-4"
            >
              <option value="">Select Supervisor</option>
              {supervisors.map((supervisor) => (
                <option
                  key={supervisor.employee_no}
                  value={supervisor.employee_no}
                >
                  {supervisor.employee_calling_name} ({supervisor.employee_no})
                </option>
              ))}
            </select>

            {/* Buttons */}
            <div className="flex justify-center gap-2">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg"
                onClick={togglePopup}
              >
                Back
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                onClick={handleSendToHR}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenJobsView;
