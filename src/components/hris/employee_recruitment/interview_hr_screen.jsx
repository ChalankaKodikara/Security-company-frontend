import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Interview_Img from "../../../assets/interview-image.png";
import { SlLayers } from "react-icons/sl";
import { FiUsers } from "react-icons/fi";
import Empty_Img from "../../../assets/empty.png";

const Interviews_By_Hr = () => {
    const [interviews, setInterviews] = useState([]);
    const navigate = useNavigate();
    const API_URL = process.env.REACT_APP_FRONTEND_URL;

    useEffect(() => {
        fetch(`${API_URL}/v1/hris/interviewprocess/complete-stages`)
            .then(response => response.json())
            .then(data => {
                if (data.success && Array.isArray(data.data)) {
                    setInterviews(data.data); // Store the interviews array
                } else {
                    setInterviews([]); // Ensure it's an empty array if no data is found
                }
            })
            .catch(error => console.error("Error fetching interview data:", error));
    }, []);

    const handleViewClick = (interview) => {
        navigate("/interviews-stages-hr", { state: { interviewProcessId: interview.id, name: interview.name } });
    };

    return (
        <div className='mx-10 mt-5'>
            <p className='text-[22px]'>Employee Recruitment Settings / Interview Process /
                <span className='font-semibold'> Interview</span>
            </p>

            {interviews.length > 0 ? (
                <div className='grid grid-flow-row grid-cols-4 gap-4 mt-6'>
                    {interviews.map((interview) => (
                        <div key={interview.id} className="bg-white shadow-lg rounded-2xl p-6 w-96">
                            <div className="flex justify-center">
                                <img src={Interview_Img} alt="interview-img" className="w-full h-40 object-cover rounded-lg" />
                            </div>

                            <div className="mt-4">
                                <h2 className="text-lg font-semibold text-gray-800 capitalize">{interview.name}</h2>
                            </div>

                            <div className="flex items-center space-x-3 mt-4">
                                <div className='bg-blue-100 p-2 rounded-lg'>
                                    <FiUsers className="text-blue-500 text-lg" />
                                </div>
                                <div>
                                    <p className="text-gray-700 font-medium text-lg">12</p>
                                    <span className="text-gray-500 text-sm">Confirmed Candidates</span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 mt-4">
                                <div className='bg-blue-100 p-2 rounded-lg'>
                                    <SlLayers className="text-blue-500 text-lg" />
                                </div>
                                <div>
                                    <p className="text-gray-700 font-medium text-lg">12</p>
                                    <span className="text-gray-500 text-sm">Candidates who applied</span>
                                </div>
                            </div>

                            <div className="mt-4">
                                <button
                                    onClick={() => handleViewClick(interview)}
                                    className="w-full text-white bg-blue-500 py-3 rounded-lg font-semibold"
                                >
                                    View
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (

                <div className="flex justify-center items-center h-[60vh]">
                    <img src={Empty_Img} alt="empty-img" className="w-80 h-auto opacity-75" />
                </div>
            )}
        </div>
    );
};

export default Interviews_By_Hr;
