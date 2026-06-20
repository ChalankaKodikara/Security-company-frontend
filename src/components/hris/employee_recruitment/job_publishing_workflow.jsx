import React, { useState, useEffect } from "react";
import { AiOutlineClose } from "react-icons/ai";
import View_Job_Details from "./view_job_details";
import Empty_Img from "../../../assets/empty.png";
import { useRef } from "react";

const JobPostingManagement = () => {
  const [approvedJobs, setApprovedJobs] = useState([]);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState(null);
  const [isCollectJobDetailsOpen, setIsCollectJobDetailsOpen] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState({});
  const [descOverflow, setDescOverflow] = useState({});
  const descRefs = useRef({});
  const API_URL = process.env.REACT_APP_FRONTEND_URL;


  useEffect(() => {
    const newOverflow = {};
    Object.keys(descRefs.current).forEach((key) => {
      const el = descRefs.current[key];
      if (el && el.scrollHeight > el.clientHeight + 5) {
        newOverflow[key] = true;
      }
    });
    setDescOverflow(newOverflow);
  }, [approvedJobs]);


  useEffect(() => {
    fetchApprovedJobs();
  }, []);

  const fetchApprovedJobs = async () => {
    try {
      const response = await fetch(`${API_URL}/v1/hris/jobpost/get-published-jobposts`);
      const data = await response.json();
      if (data.success) setApprovedJobs(data.data);
    } catch (error) {
      console.error("Error fetching approved job posts:", error);
    }
  };

  const renderEmptyState = (message) => (
    <div className="flex flex-col items-center justify-center w-full h-80 col-span-3 mt-4">
      <img src={Empty_Img} alt="No jobs available" className="w-80 h-80 mx-auto mt-9" />
      <p className="text-gray-500 mt-3 text-lg">{message}</p>
    </div>
  );

  return (
    <div className="mx-10 mt-5 font-montserrat">
      <div className="flex space-x-6 items-center">
        {/* <div className="border border-gray-300 flex items-center space-x-2 cursor-pointer p-2 rounded-lg bg-blue-600 text-white">
          <span className="font-medium">Approved</span>
        </div> */}
      </div>
      <div className="grid grid-cols-4 gap-4 mt-5">
        {approvedJobs.map((job) => {
          const jobKey = job.id.toString();
          return (
            <div key={job.id} className="shadow-lg p-4 rounded-md">
              <p className="text-lg mt-4 mb-4 font-semibold">Approved Job Vacancy</p>
              <div>
                <p className="text-lg font-medium">{job.title}</p>
                <p className="text-sm">
                  {job.location}, {job.city}, {job.country}
                </p>

                <div
                  ref={(el) => (descRefs.current[jobKey] = el)}
                  className={`mt-3 text-sm mb-2 ${showFullDesc[jobKey] ? "" : "line-clamp-2 overflow-hidden"
                    }`}
                >
                  {job.description || "No description provided."}
                </div>

                {descOverflow[jobKey] && (
                  <button
                    className="text-blue-500 text-sm border border-blue-500 p-1 rounded-full mb-2"
                    onClick={() =>
                      setShowFullDesc((prev) => ({
                        ...prev,
                        [jobKey]: !prev[jobKey],
                      }))
                    }
                  >
                    {showFullDesc[jobKey] ? "View Less" : "View More"}
                  </button>
                )}

                <p>LKR {job.salaryRange || "(Not specified)"}</p>
                <hr />
                <div className="flex items-center space-x-2 mt-3">
                  <div className="bg-green-400 w-3 h-3 rounded-full mb-4"></div>
                  <p className="text-gray-700">Approved</p>
                </div>

                <div className="flex justify-between gap-4 mt-3 items-center">
                  <div>
                    <p>{job.approved_one_designation}</p>
                    <p className="text-sm ">{job.approved_one_employee}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[11px]">
                      {new Date(job.updatedAt).toISOString().slice(2, 10).replace(/-/g, "/")}
                    </p>
                    <p className="text-sm text-yellow-400 font-bold text-[11px]">
                      {job.approve_status_one}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between gap-4 mt-3 items-center">
                  <div>
                    <p>{job.approved_two_designation}</p>
                    <p className="text-sm ">{job.approved_two_employee}</p>
                  </div>
                  <div>
                    <p className="text-sm text-yellow-400 font-bold text-[11px]">
                      {job.approve_status_two}
                    </p>
                  </div>
                </div>

                <button
                  className="border w-full border-blue-400 font-semibold text-blue-400 px-4 py-2 rounded-lg mt-3"
                  onClick={() => {
                    setSelectedJobForDetails({ id: job.id, title: job.title });
                    setIsCollectJobDetailsOpen(true);
                  }}
                >
                  View Job Details
                </button>

                <button className="bg-green-400 w-full text-white font-semibold px-4 py-2 rounded-lg mt-3">
                  Complete
                </button>
              </div>
            </div>
          );
        })}

      </div>
      {isCollectJobDetailsOpen && selectedJobForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="relative bg-white p-6 rounded-lg shadow-lg max-w-7xl w-full overflow-y-auto h-[90%]">
            <button className="absolute top-4 right-4 text-gray-600 hover:text-gray-900" onClick={() => setIsCollectJobDetailsOpen(false)}>
              <AiOutlineClose size={20} />
            </button>
            <View_Job_Details jobId={selectedJobForDetails.id} title={selectedJobForDetails.title} />
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPostingManagement;
