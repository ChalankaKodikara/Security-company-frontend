import React, { useEffect, useState } from 'react';
import { LuFileSpreadsheet, LuLink } from "react-icons/lu";
import { FiUsers } from "react-icons/fi";
import { FaRegBuilding } from "react-icons/fa";
import { IoBagOutline } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import { useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import Emplty_Performance from "../../../../assets/empty-performance.png";

const View_Others_Performance_Sheet = () => {
    const [supervisorPerformances, setSupervisorPerformances] = useState([]);
    const [activeTab, setActiveTab] = useState('supervisor');
    const [supervisorStatusTab, setSupervisorStatusTab] = useState("pending");
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const type = queryParams.get('type');
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

    useEffect(() => {
        const fetchSupervisorPerformances = async () => {
            const employeeNo = Cookies.get('employee_no');
            if (!employeeNo || !type || !supervisorStatusTab) return;

            try {
                const response = await fetch(
                    `${API_URL}/v1/hris/performance/performance-type-by-supervisor?supervisor=${employeeNo}&type=${type}&status=${supervisorStatusTab}`
                );
                const result = await response.json();
                if (result.success) {
                    setSupervisorPerformances(result.data);
                } else {
                    console.error("Failed to load supervisor performances:", result.message);
                }
            } catch (error) {
                console.error("Error fetching performances:", error);
            }
        };

        fetchSupervisorPerformances();
    }, [type, supervisorStatusTab]);

    const renderEmptyState = () => (
        <div className="flex flex-col justify-center items-center h-[500px] shadow-md rounded-md text-center">
            <img
                src={Emplty_Performance}
                alt="No Performance Found"
                className="w-[500px] h-[300px] opacity-70 mb-4"
            />
            <p className='text-gray-500'>
                No performance evaluations available. Start by creating a new performance.
                <div>Once submitted, it will appear here for review.</div>
            </p>
        </div>

    );

    return (
        <div className='mx-10'>
            <p className='text-[24px] mb-6'>Performance / Performance Evaluation / view performance</p>

            <div className='flex items-center space-x-5'>
                <div
                    onClick={() => setActiveTab('supervisor')}
                    className={`flex items-center rounded-md gap-4 border p-3 mt-2 w-[250px] cursor-pointer ${activeTab === 'supervisor' ? 'bg-blue-500 text-white font-semibold' : 'border-gray-300 text-gray-600'}`}
                >
                    <LuFileSpreadsheet /> Start from Supervisor
                </div>

                <div
                    onClick={() => setActiveTab('employee')}
                    className={`flex items-center rounded-md gap-4 border p-3 mt-2 w-[250px] cursor-pointer ${activeTab === 'employee' ? 'bg-blue-500 text-white font-semibold' : 'border-gray-300 text-gray-600'}`}
                >
                    <LuLink /> Start from Employee
                </div>
            </div>

            <div className="">
                {activeTab === 'supervisor' && (
                    <div>
                        <div className='flex items-center justify-between mb-6'>
                            <p className='font-semibold text-[18px] my-3'>Available Monthly Performances</p>
                            <div className='items-center flex gap-4'>
                                <button
                                    onClick={() => setSupervisorStatusTab("pending")}
                                    className={`border-2 px-4 py-2 rounded-md ${supervisorStatusTab === 'pending' ? 'border-blue-500 text-blue-500 font-semibold' : 'border-gray-300 text-gray-500'}`}
                                >Pending</button>
                                <button
                                    onClick={() => setSupervisorStatusTab("completed")}
                                    className={`border-2 px-4 py-2 rounded-md ${supervisorStatusTab === 'completed' ? 'border-blue-500 text-blue-500 font-semibold' : 'border-gray-300 text-gray-500'}`}
                                >Completed</button>
                            </div>
                        </div>

                        {supervisorPerformances.length === 0
                            ? renderEmptyState()
                            : (
                                <div className="grid grid-cols-4 gap-6">
                                    {supervisorPerformances.map((performance, index) => (
                                        <div key={index} className="border border-gray-200 rounded-lg p-4 shadow-lg relative cursor-pointer hover:shadow-xl transition-all">
                                            <div className='flex items-center justify-between flex-wrap'>
                                                <div className='min-w-[150px] space-y-[-10px]'>
                                                    <p className='text-black text-[16px] font-bold'>{performance.name}</p>
                                                    <p className='text-gray-400 text-[15px] font-semibold'>Performance Evaluation</p>
                                                </div>
                                                <div className='flex items-center gap-6 flex-shrink-0'>
                                                    <div className='flex items-center gap-2'>
                                                        <FiUsers />
                                                        <p className='mt-4'>{performance.supervisors?.length || 0}</p>
                                                    </div>
                                                    <div className='flex items-center gap-2'>
                                                        <FaRegBuilding />
                                                        <p className='mt-4'>{performance.department_count || 0}</p>
                                                    </div>
                                                    <div className='flex items-center gap-2'>
                                                        <IoBagOutline />
                                                        <p className='mt-4'>{performance.designation_count || 0}</p>
                                                    </div>
                                                </div>
                                                <p className='text-gray-500 mt-2 text-sm'>Performance evaluation | {performance.month}, {performance.year}</p>
                                            </div>

                                            <div className='flex items-center justify-between mt-4 mb-4'>
                                                <p className='text-[13px] text-gray-400 font-semibold'>Start From</p>
                                                <div className='flex items-center gap-4'>
                                                    <span className='bg-blue-100 text-blue-500 p-2 rounded-lg'>{performance.start_from}</span>
                                                    <span className='bg-gray-100 text-gray-500 p-2 rounded-lg'>{performance.evaluation_type}</span>
                                                </div>
                                            </div>

                                            <hr className="border-t-1 border-gray-300" />

                                            <div className='flex items-center justify-between mt-4 mb-4'>
                                                <p className='text-gray-500 font-medium'>Supervisor</p>
                                            </div>

                                            {performance.supervisors?.map((sup, idx) => (
                                                <div key={idx} className='flex items-center gap-4 mt-2'>
                                                    <div className='bg-blue-100 text-blue-500 rounded-full p-2'>
                                                        <FaUser />
                                                    </div>
                                                    <div>
                                                        <p className='text-[15px] font-semibold text-gray-600'>{sup.name}</p>
                                                        <p className='text-[13px] text-gray-400'>{sup.email}</p>
                                                    </div>
                                                </div>
                                            ))}

                                            <div className='mt-4'>
                                                <button
                                                    onClick={() => navigate(`/view-employees-performance?performance_type_id=${performance.performance_type_id}`)}
                                                    className="bg-blue-500 text-white p-2 rounded-lg w-full hover:bg-blue-600 transition duration-200"
                                                >
                                                    Open
                                                </button>
                                            </div>

                                        </div>
                                    ))}
                                </div>

                            )}

                    </div>
                )}

                {activeTab === 'employee' && (
                    <div className="space-y-4 shadow-md p-2 rounded-md max-h-[65%] overflow-y-auto">
                        COMING SOON!!!
                    </div>
                )}
            </div>
        </div>
    );
};

export default View_Others_Performance_Sheet;