import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUserAlt } from "react-icons/fa";
import { MdDeleteOutline } from "react-icons/md";
import { IoIosArrowRoundForward } from "react-icons/io";
import { FiUsers } from "react-icons/fi";
import { FaRegBuilding } from "react-icons/fa";
import { IoBagOutline } from "react-icons/io5";
import Emplty_Performance from "../../../../assets/empty-performance.png";

const ViewMonthlyPerformance = () => {
    const [tooltip, setTooltip] = useState({ visible: false, text: "", x: 0, y: 0 });
    const [popupMessage, setPopupMessage] = useState(null); // message content
    const [popupType, setPopupType] = useState("success"); // "success" | "error"
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState("January");
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [performances, setPerformances] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const type = queryParams.get("type");
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [selectedPerformance, setSelectedPerformance] = useState(null);
    const [selectedEditPerformance, setSelectedEditPerformance] = useState(null);
    const buildingRefs = useRef([]);
    buildingRefs.current = [];
    const addToRefs = (el) => {
        if (el && !buildingRefs.current.includes(el)) {
            buildingRefs.current.push(el);
        }
    };
    const API_URL = process.env.REACT_APP_FRONTEND_URL;

    useEffect(() => {
        if (!type) return;

        const fetchPerformanceData = async () => {
            try {
                const response = await fetch(`${API_URL}/v1/hris/performance/performance-type-counts-by-type?type=${type}`);
                const result = await response.json();
                if (result.success) {
                    setPerformances(result.data);
                } else {
                    console.error("API error:", result.message);
                }
            } catch (err) {
                console.error("Fetch error:", err);
            }
        };

        fetchPerformanceData();
    }, [type]);

    const typeDisplayMap = {
        monthly: "Monthly Performance",
        year_april: "Yearly 1st Performance",
        year_december: "Yearly 2nd Performance",
    };
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const generateYearRange = (start, end) => {
        const years = [];
        for (let i = start; i <= end; i++) {
            years.push(i);
        }
        return years;
    };

    const currentYear = new Date().getFullYear();
    const years = generateYearRange(currentYear - 10, currentYear + 15);


    const handlePublish = async () => {
        if (!selectedPerformance || !selectedPerformance.performance_type_id) {
            alert("Missing performance type ID");
            return;
        }

        const payload = {
            performance_type_id: selectedPerformance.performance_type_id,
            month: selectedMonth.toLowerCase(),
            year: Number(selectedYear),
        };

        try {
            const response = await fetch(
                `${API_URL}/v1/hris/performance/create-performance-instance`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );

            const result = await response.json();

            if (result.success) {
                setPopupType("success");
                setPopupMessage(result.message || "Performance sheet sent successfully!");
                setShowPublishModal(false);
            } else {
                setPopupType("error");
                setPopupMessage(result.message || "Failed to send performance sheet.");
            }
        } catch (err) {
            setPopupType("error");
            setPopupMessage("Something went wrong while publishing.");
            console.error("Request failed:", err);
        }
    };

    const handleDeletePerformance = async () => {
        if (!selectedPerformance || !selectedPerformance.performance_type_id) {
            setPopupType("error");
            setPopupMessage("No performance selected to delete.");
            return;
        }

        const payload = {
            performance_type_id: selectedPerformance.performance_type_id,
            status: "inactive"
        };

        try {
            const response = await fetch(
                `${API_URL}/v1/hris/performance/update-performance-status`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                }
            );

            const result = await response.json();

            if (result.success) {
                setPopupType("success");
                setPopupMessage(result.message || "Performance deleted successfully.");
                setShowModal(false);
                setPerformances(prev =>
                    prev.filter(p => p.performance_type_id !== selectedPerformance.performance_type_id)
                );
            } else {
                setPopupType("error");
                setPopupMessage(result.message || "Failed to delete performance.");
            }
        } catch (error) {
            console.error("Delete failed:", error);
            setPopupType("error");
            setPopupMessage("Something went wrong while deleting.");
        }
    };

    const handleIconHover = (e, text) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({
            visible: true,
            text,
            x: rect.left + window.scrollX + rect.width / 2,
            y: rect.top + window.scrollY - 10,
        });
    };

    const handleIconLeave = () => {
        setTooltip({ ...tooltip, visible: false });
    };

    useEffect(() => {
        if (!type) return;

        const fetchPerformanceData = async () => {
            try {
                const response = await fetch(
                    `${API_URL}/v1/hris/performance/performance-type-counts-by-type?type=${type}`
                );
                const result = await response.json();
                if (result.success) {
                    setPerformances(result.data);
                } else {
                    console.error("API error:", result.message);
                }
            } catch (err) {
                console.error("Fetch error:", err);
            }
        };

        fetchPerformanceData();
    }, [type]);

    return (
        <div className='mx-5 mt-10 relative'>
            <p className='text-[24px] mb-6'>
                Performance / Performance Evaluation / {typeDisplayMap[type] || "Unknown Type"}
            </p>

            {performances.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center shadow-lg p-4 rounded-lg">
                    <img src={Emplty_Performance} alt="No Performance" className="w-96 mb-4" />
                    <p className="text-gray-500 text-lg font-medium">No performance evaluations available</p>
                    <p className="text-gray-500 text-lg font-small mt-[-20px]">Start by creating a new Performance. Once submitted, it will appear here for send.</p>
                </div>
            ) : (
                <div className="grid grid-cols-4 gap-6">
                    {performances.map((performance, index) => (
                        <div
                            key={index}
                            onClick={() => navigate("/open-performance-evaluation")}
                            className="border border-gray-200 rounded-lg p-4 shadow-lg relative cursor-pointer hover:shadow-xl transition-all"
                        >

                            <div className='flex items-center justify-between flex-wrap'>
                                <div className='min-w-[150px] space-y-[-10px]'>
                                    <p className='text-black text-[16px] font-bold'>{performance.name}</p>
                                    <p className='text-gray-400 text-[15px] font-semibold'>Performance Evaluation</p>
                                </div>
                                <div className='flex items-center gap-6 flex-shrink-0'>
                                    <div
                                        className='flex items-center gap-2 cursor-pointer'
                                        onMouseEnter={(e) => handleIconHover(e, "Employees")}
                                        onMouseLeave={handleIconLeave}
                                    >
                                        <FiUsers />
                                        <p className='mt-4'>{performance.employee_count || 0}</p>
                                    </div>
                                    <div
                                        className='flex items-center gap-2 cursor-pointer'
                                        onMouseEnter={(e) => handleIconHover(e, "Departments")}
                                        onMouseLeave={handleIconLeave}
                                    >
                                        <FaRegBuilding />
                                        <p className='mt-4'>{performance.department_count || 0}</p>
                                    </div>
                                    <div
                                        className='flex items-center gap-2 cursor-pointer'
                                        onMouseEnter={(e) => handleIconHover(e, "Designations")}
                                        onMouseLeave={handleIconLeave}
                                    >
                                        <IoBagOutline />
                                        <p className='mt-4'>{performance.designation_count || 0}</p>
                                    </div>
                                </div>


                            </div>

                            <div className='flex items-center justify-between mt-4 mb-4'>
                                <p className='text-[13px] text-gray-400 font-semibold'>Start From</p>
                                <div className='flex items-center gap-4'>
                                    <span className='bg-blue-100 text-blue-500 p-2 rounded-lg'>{performance.start_from}</span>
                                    {/* <span className='bg-gray-100 text-gray-500 p-2 rounded-lg'> {typeDisplayMap[type]}</span> */}
                                </div>
                            </div>

                            <hr className="border-t-1 border-gray-300" />

                            <div className='flex items-center justify-between mt-4 mb-4'>
                                <p className='text-gray-500 font-medium'>Supervisor</p>
                                <p
                                    className='font-semibold text-sm text-blue-500 cursor-pointer hover:underline'
                                    onClick={(e) => {
                                        e.stopPropagation(); // prevent card click nav
                                        setSelectedEditPerformance(performance); // optional
                                        setShowEditModal(true);
                                    }}
                                >
                                    Edit
                                </p>
                            </div>
                            {performance.supervisors?.length > 0 && performance.supervisors.map((sup, idx) => (
                                <div key={idx} className='flex items-center gap-4 mt-2'>
                                    <div className='bg-blue-100 text-blue-500 rounded-full p-2'>
                                        <FaUserAlt />
                                    </div>
                                    <div>
                                        <p className='text-[15px] font-semibold text-gray-600'>{sup.name}</p>
                                        <p className='text-[13px] text-gray-400'>{sup.email}</p>
                                    </div>
                                </div>
                            ))}

                            <div className='flex justify-between items-center mt-4'>
                                <div
                                    className='border border-gray-500 rounded-lg p-2 cursor-pointer'
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowModal(true);
                                    }}
                                >
                                    <MdDeleteOutline className="text-gray-500 text-xl"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedPerformance(performance); //  track selected performance
                                            setShowModal(true);
                                        }}

                                    />
                                </div>

                                <button
                                    className="bg-blue-500 text-white p-2 rounded-lg w-[280px]"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedPerformance(performance);
                                        setShowPublishModal(true);
                                    }}
                                >
                                    Publish
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal - Delete Confirmation */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] text-center">
                        <h2 className="text-red-500 text-xl font-bold">Remove?</h2>
                        <p className="text-gray-500 mt-2">Do you really want to remove This Performance?</p>
                        <p className="font-semibold mt-2">IT Intern Team</p>
                        <div className="flex justify-center gap-4 mt-6">
                            <button
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
                                onClick={() => setShowModal(false)}
                            >
                                No
                            </button>
                            <button
                                className="bg-red-500 text-white px-4 py-2 rounded-lg"
                                onClick={handleDeletePerformance}
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal - Create/Edit Performance */}
            {showEditModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-[750px] relative">
                        <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700" onClick={() => setShowEditModal(false)}>
                            ✕
                        </button>
                        <div className="border-b pb-3">
                            <h2 className="text-blue-500 text-xl font-bold">Edit Performance</h2>
                        </div>
                        <div className="mt-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-gray-600">Employee Type</label>
                                    <select className="border border-gray-300 rounded-lg p-2 w-full mt-1">
                                        <option>Select type</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-gray-600">Supervisors Count</label>
                                    <select className="border border-gray-300 rounded-lg p-2 w-full mt-1">
                                        <option>Select count</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-gray-600">Supervisor 01</label>
                                    <select className="border border-gray-300 rounded-lg p-2 w-full mt-1">
                                        <option>Select supervisor</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-gray-600">Supervisor 02</label>
                                    <select className="border border-gray-300 rounded-lg p-2 w-full mt-1">
                                        <option>Select supervisor</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end mt-6">
                            <button className="bg-blue-500 text-white p-2 rounded-lg flex items-center gap-2">
                                Submit <IoIosArrowRoundForward />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPublishModal && selectedPerformance && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-xl px-6 py-6 w-[450px] max-w-[90%] text-center">
                        <h2 className="text-xl font-bold text-blue-600 mb-4">Send Performance Sheet</h2>

                        <p className="text-gray-800 text-md font-semibold mb-1">
                            {selectedPerformance.team_name || "IT Intern Team"}{" "}

                            <select
                                className="ml-2 px-2 py-1 border rounded-md"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                            >
                                {years.map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>

                            <select
                                className="ml-2 px-2 py-1 border rounded-md"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                            >
                                {months.map((month) => (
                                    <option key={month} value={month}>{month}</option>
                                ))}
                            </select>
                        </p>


                        <p className="text-gray-600 mb-6 mt-4">
                            Are you sure you want to share the Performance Sheet for Employees?
                        </p>

                        <div className="text-left text-sm text-gray-700 space-y-1 mb-6">
                            <p><strong>Start from :</strong> <span className="text-blue-600 capitalize">{selectedPerformance.start_from}</span></p>
                            <p><strong>Performance :</strong> <span className="text-blue-600">{typeDisplayMap[type]}</span></p>
                            <p><strong>Employee Count :</strong> <span className="text-blue-600">{selectedPerformance?.employee_count || 132}</span></p>
                        </div>

                        <div className="flex justify-center gap-4">
                            <button
                                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg"
                                onClick={() => setShowPublishModal(false)}
                            >
                                No
                            </button>
                            <button
                                className="bg-blue-500 text-white px-5 py-2 rounded-lg"
                                onClick={handlePublish}
                            >
                                Yes
                            </button>

                        </div>
                    </div>
                </div>
            )}

            {popupMessage && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className={`bg-white rounded-lg p-6 shadow-lg w-[400px] text-center border ${popupType === "success" ? "border-green-500" : "border-red-500"}`}>
                        <h2 className={`text-xl font-bold mb-2 ${popupType === "success" ? "text-green-600" : "text-red-600"}`}>
                            {popupType === "success" ? "Success" : "Error"}
                        </h2>
                        <p className="text-gray-700 mb-4">{popupMessage}</p>
                        <button
                            className={`px-4 py-2 rounded-lg text-white ${popupType === "success" ? "bg-green-600" : "bg-red-600"}`}
                            onClick={() => setPopupMessage(null)}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {tooltip.visible && (
                <div
                    className="fixed bg-gray-800 text-white text-sm rounded-md px-3 py-1 z-50 transition-opacity duration-200"
                    style={{
                        top: `${tooltip.y}px`,
                        left: `${tooltip.x}px`,
                        transform: "translate(-50%, -100%)"
                    }}
                >
                    {tooltip.text}
                </div>
            )}

        </div>
    );
};

export default ViewMonthlyPerformance;
