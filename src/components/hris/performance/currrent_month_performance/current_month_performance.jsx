import React, { useState } from 'react';
import { TbPointFilled } from "react-icons/tb";
import "./current_performance.css";
import { FiUserCheck, FiUsers } from "react-icons/fi";
import { FaUserAlt, FaUser, FaRegBuilding } from "react-icons/fa";
import { IoBagOutline } from "react-icons/io5";
import { Link } from "react-router-dom";

const Current_Month_Performance = () => {
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [activeTab, setActiveTab] = useState('supervisor');
    const [deleteModal, setDeleteModal] = useState(false);

    //  Separate Data
    const supervisorPerformances = [
        { id: 1, period: "2025 January", submittedDate: "2025.01.04" },
        { id: 2, period: "2025 February", submittedDate: "2025.02.03" },
        { id: 3, period: "2025 March", submittedDate: "2025.03.02" },
        { id: 4, period: "2025 April", submittedDate: "2025.04.01" },
        { id: 5, period: "2025 May", submittedDate: "2025.05.05" },
    ];

    const employeePerformances = [
        { id: 6, period: "2025 June", submittedDate: "2025.06.06" },
        { id: 7, period: "2025 July", submittedDate: "2025.07.08" },
        { id: 8, period: "2025 August", submittedDate: "2025.08.09" },
        { id: 9, period: "2025 September", submittedDate: "2025.09.10" },
        { id: 10, period: "2025 October", submittedDate: "2025.10.11" },
    ];

    //  Helper Renderer for Performance Cards
    const renderCards = () => (
        <div className="grid grid-cols-4 gap-4 row-span-3 col-span-4">
            {[1, 2, 3, 4].map((_, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 shadow-lg relative cursor-pointer hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between flex-wrap">
                        <div className="min-w-[150px]">
                            <p className="text-gray-400 text-[15px] font-semibold">Performance Evaluation</p>
                        </div>
                        <div className="flex items-center gap-6 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <FiUsers />
                                <p className="mt-4">10</p>
                            </div>
                            <div className="flex items-center gap-2 cursor-pointer relative">
                                <FaRegBuilding />
                                <p className="mt-4">03</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <IoBagOutline />
                                <p className="mt-4">29</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 mb-4">
                        <p className="text-[13px] text-gray-400 font-semibold">Start From</p>
                        <div className="flex items-center gap-4">
                            <span className="bg-blue-100 text-blue-500 p-2 rounded-lg">Supervisor</span>
                            <span className="bg-gray-100 text-gray-500 p-2 rounded-lg">Employee</span>
                        </div>
                    </div>

                    <hr className="border-t-1 border-gray-300" />

                    <div className="flex items-center justify-between mt-4 mb-4">
                        <p className="text-gray-500 font-medium">Supervisor</p>
                    </div>

                    <div className="flex items-center gap-6 mb-2">
                        <div className="bg-blue-100 text-blue-500 p-3 rounded-md">
                            <FaUser />
                        </div>
                        <div className="text-sm space-y-[-10px]">
                            <p>W.G Frernando</p>
                            <p>A.B Perea</p>
                        </div>
                    </div>
                    <Link to="/view-current-month-performance">
                        <div className="flex items-center mt-4 ">

                            <button className="bg-blue-500 text-white p-2 rounded-lg w-full hover:bg-blue-600 transition duration-200">
                                Open
                            </button>
                        </div>
                    </Link>
                </div>
            ))}
        </div>
    );

    return (
        <div className='mx-10'>
            <p className='text-[22px] font-semibold mb-4'>Performance Sheet</p>

            {/* Tabs */}
            <div className='flex items-center space-x-5'>
                <div
                    onClick={() => setActiveTab('supervisor')}
                    className={`flex items-center rounded-md gap-4 border p-3 mt-2 w-[250px] cursor-pointer 
                        ${activeTab === 'supervisor' ? 'bg-blue-500 text-white font-semibold' : 'border-gray-300 text-gray-600'}
                    `}
                >
                    <FiUserCheck />
                    Start from Supervisor
                </div>

                <div
                    onClick={() => setActiveTab('employee')}
                    className={`flex items-center rounded-md gap-4 border p-3 mt-2 w-[250px] cursor-pointer 
                        ${activeTab === 'employee' ? 'bg-blue-500 text-white font-semibold' : 'border-gray-300 text-gray-600'}
                    `}
                >
                    <FiUsers />
                    Start from Employee
                </div>
            </div>

            {/* Supervisor Tab */}
            {activeTab === 'supervisor' && (
                <div className="space-y-4 shadow-md p-2 rounded-md max-h-[65%] overflow-y-auto">
                    <div className="grid grid-cols-5 grid-rows-6 gap-4">
                        <div className="row-span-6 shadow-md rounded-md p-3 overflow-y-auto max-h-[650px] scroll-smooth scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent">
                            <p className='text-gray-500 text-medium'>All Submitted Performances ({supervisorPerformances.length})</p>
                            <input className='border border-gray-400 rounded-md p-2 w-full mb-3' placeholder='Select month' type='date' />
                            {supervisorPerformances.map((item) => (
                                <div key={item.id} className='flex items-center gap-4 p-2 hover:bg-gray-100 rounded-md cursor-pointer'>
                                    <div className='bg-blue-100 text-blue-500 p-1 rounded-full mt-[-10px]'><TbPointFilled /></div>
                                    <div>
                                        <p className='font-semibold'>{item.period}</p>
                                        <p className='text-sm mt-[-10px] text-gray-600'>Submitted Date: {item.submittedDate}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Cards */}
                        {renderCards()}
                    </div>
                </div>
            )}

            {/* Employee Tab */}
            {activeTab === 'employee' && (
                <div className="space-y-4 shadow-md p-2 rounded-md max-h-[65%] overflow-y-auto">
                    <div className="grid grid-cols-5 grid-rows-6 gap-4">
                        <div className="row-span-6 shadow-md rounded-md p-3 overflow-y-auto max-h-[650px] scroll-smooth scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent">
                            <p className='text-gray-500 text-medium'>All Submitted Performances ({employeePerformances.length})</p>
                            <input className='border border-gray-400 rounded-md p-2 w-full mb-3' placeholder='Select month' type='date' />
                            {employeePerformances.map((item) => (
                                <div key={item.id} className='flex items-center gap-4 p-2 hover:bg-gray-100 rounded-md cursor-pointer'>
                                    <div className='bg-blue-100 text-blue-500 p-1 rounded-full mt-[-10px]'><TbPointFilled /></div>
                                    <div>
                                        <p className='font-semibold'>{item.period}</p>
                                        <p className='text-sm mt-[-10px] text-gray-600'>Submitted Date: {item.submittedDate}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Cards */}
                        {renderCards()}
                    </div>
                </div>
            )}


        </div>
    );
};

export default Current_Month_Performance;
