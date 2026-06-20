import React, { useState } from 'react';
import { LuFileSpreadsheet, LuLink } from "react-icons/lu";
import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import { TbPointFilled } from "react-icons/tb";
import "./performance.css";
import { RiDeleteBin5Line } from "react-icons/ri";

// Dummy criteria data
const criteriaData = [
    "Teamwork", "Punctuality", "Quality of Work", "Communication",
    "Problem Solving", "Adaptability", "Leadership", "Creativity",
    "Technical Knowledge", "Meeting Deadlines", "Reliability", "Time Management"
];

const PerformanceSheet = () => {
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [deleteModal, setDeleteModal] = useState(false);
    const totalPages = Math.ceil(criteriaData.length / itemsPerPage);
    const currentItems = criteriaData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    const submittedPerformances = [
        { id: 1, period: "2025 January", submittedDate: "2025.01.04" },
        { id: 2, period: "2025 February", submittedDate: "2025.02.03" },
        { id: 3, period: "2025 March", submittedDate: "2025.03.02" },
        { id: 4, period: "2025 April", submittedDate: "2025.04.01" },
        { id: 5, period: "2025 May", submittedDate: "2025.05.05" },
        { id: 6, period: "2025 June", submittedDate: "2025.06.06" },
        { id: 7, period: "2025 July", submittedDate: "2025.07.08" },
        { id: 8, period: "2025 August", submittedDate: "2025.08.09" },
        { id: 9, period: "2025 September", submittedDate: "2025.09.10" },
        { id: 10, period: "2025 October", submittedDate: "2025.10.11" },
        { id: 11, period: "2025 November", submittedDate: "2025.11.13" },
        { id: 12, period: "2025 December", submittedDate: "2025.12.15" },
        { id: 13, period: "2026 January", submittedDate: "2026.01.04" },
        { id: 14, period: "2026 February", submittedDate: "2026.02.05" },
        { id: 15, period: "2026 March", submittedDate: "2026.03.06" },
        { id: 16, period: "2026 April", submittedDate: "2026.04.07" },
        { id: 17, period: "2026 May", submittedDate: "2026.05.08" },
    ];

    return (
        <div className='mx-10 pb-[350px]'>
            <p className='text-[22px] font-semibold mb-4'>Performance Sheet</p>
            {/* Tabs */}
            <div className='flex items-center space-x-5'>
                <div
                    onClick={() => setActiveTab('pending')}
                    className={`flex items-center rounded-md gap-4 border p-3 mt-2 w-[200px] cursor-pointer 
                        ${activeTab === 'pending' ? 'bg-blue-500 text-white font-semibold' : 'border-gray-300 text-gray-600'}
                    `}
                >
                    <LuFileSpreadsheet />
                    Pending Sheet 
                </div>

                <div
                    onClick={() => setActiveTab('submitted')}
                    className={`flex items-center rounded-md gap-4 border p-3 mt-2 w-[200px] cursor-pointer 
                        ${activeTab === 'submitted' ? 'bg-blue-500 text-white font-semibold' : 'border-gray-300 text-gray-600'}
                    `}
                >
                    <LuLink />
                    Submitted Sheet
                </div>
            </div>

            {/* Main Content */}
            <div className="">
                {activeTab === 'pending' && (
                    <div>
                        {/* Employee Form */}
                        <div className="space-y-4 shadow-md p-5 rounded-md mb-10">
                            <h2 className="text-lg font-semibold text-gray-700">Employee Details</h2>

                            <div className="grid grid-cols-4 gap-4">
                                {[
                                    "Employee Number", "Name", "Department",
                                    "Email", "Phone Number", "Employee Category",
                                    "Designation", "Type of Appraisal"
                                ].map((label, idx) => (
                                    <div key={idx} className='flex flex-col'>
                                        <label className='mb-1 text-sm text-gray-600'>{label}</label>
                                        <input className='border border-gray-400 p-2 rounded-md w-full' />
                                    </div>
                                ))}
                            </div>
                            <div className='flex items-center mt-6 gap-3'>
                                <div>
                                    <label className="text-sm text-gray-700 font-medium">Period Covered by this Appraisal
                                    </label>
                                </div>
                                <div className='flex items-center gap-6'>
                                    <div className='flex flex-col'>
                                        <label className="mb-1 text-sm text-gray-600">Start Date</label>
                                        <input className='border w-[320px] border-gray-500 p-2 rounded-md' type='date' />
                                    </div>

                                    <div className='flex flex-col'>
                                        <label className="mb-1 text-sm text-gray-600">End Date</label>
                                        <input className='w-[320px] border border-gray-500 p-2 rounded-md' type='date' />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className='shadow-lg p-5 rounded-md mt-[-50px]'>
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">Performance Criteria</h3>
                            <table className="w-full border-collapse text-sm">
                                <thead className="bg-gray-100 text-gray-700">
                                    <tr>
                                        <th className="py-3 px-4 text-left">Criteria</th>
                                        <th className="py-3 px-4 text-left">My Vote</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((item, index) => (
                                        <tr key={index} className="border-t">
                                            <td className="py-3 px-4">{item}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center ml-4">
                                                    <button className="bg-gray-200 text-gray-500 p-2 rounded-full"><IoIosArrowBack /></button>
                                                    <span className="mx-3"> / 10</span>
                                                    <button className="bg-gray-200 text-gray-500 p-2 rounded-full"><IoIosArrowForward /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination Controls */}
                            <div className="flex justify-between items-center mt-6">
                                <button
                                    onClick={handlePrev}
                                    disabled={currentPage === 1}
                                    className={`px-4 py-2 rounded-md ${currentPage === 1 ? 'bg-gray-200 text-gray-400' : 'bg-blue-500 text-white'}`}
                                >
                                    Previous
                                </button>

                                <span className="text-sm text-gray-600">
                                    Page {currentPage} of {totalPages}
                                </span>

                                <button
                                    onClick={handleNext}
                                    disabled={currentPage === totalPages}
                                    className={`px-4 py-2 rounded-md ${currentPage === totalPages ? 'bg-gray-200 text-gray-400' : 'bg-blue-500 text-white'}`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>

                        <div className='flex justify-end mt-5 gap-4 '>
                            <button className='bg-gray-200 text-gray-600 p-3 rounded-lg '>Cancel</button>
                            <button className='bg-blue-500 text-white p-3 rounded-lg'>Submit</button>
                        </div>
                    </div>
                )}

                {/* Submitted Tab */}
                {activeTab === 'submitted' && (
                    <div className="space-y-4 shadow-md p-2 rounded-md max-h-[65%] overflow-y-auto">
                        <div className="grid grid-cols-5 grid-rows-6 gap-4">

                            <div className="row-span-6 shadow-md rounded-md p-3 overflow-y-auto max-h-[650px] scroll-smooth scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent">
                                <p className='text-gray-500 text-medium'>All Submitted Performances ({submittedPerformances.length})</p>
                                <input
                                    className='border border-gray-400 rounded-md p-2 w-full mb-3'
                                    placeholder='Select month'
                                    type='date'
                                />

                                {submittedPerformances.map((item) => (
                                    <div
                                        key={item.id}
                                        className='flex items-center gap-4 p-2 hover:bg-gray-100 rounded-md cursor-pointer'
                                    >
                                        <div className='bg-blue-100 text-blue-500 p-1 rounded-full mt-[-10px]'>
                                            <TbPointFilled />
                                        </div>
                                        <div>
                                            <p className='font-semibold'>{item.period}</p>
                                            <p className='text-sm mt-[-10px] text-gray-600'>
                                                Submitted Date: {item.submittedDate}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="row-span-3 col-span-4 overflow-y-fixed">
                                {/* Employee Form */}
                                <div className="space-y-4 shadow-md p-2 rounded-md">
                                    <div className='flex justify-between items-center gap-4'>
                                        <h2 className="text-lg font-semibold text-gray-700">Employee Details</h2>
                                        <div className='flex items-center gap-4'>
                                            <div className='flex items-center gap-3 mt-3'>
                                                <p>Date</p>
                                                <p className='text-blue-500 font-medium'>2025.01.04</p>
                                            </div>
                                            <div className='border border-gray-500 rounded-md p-2' onClick={() => {

                                                setDeleteModal(true);
                                            }}>
                                                <RiDeleteBin5Line />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-4">
                                        {[
                                            "Employee Number", "Name", "Department",
                                            "Email", "Phone Number", "Employee Category",
                                            "Designation", "Type of Appraisal"
                                        ].map((label, idx) => (
                                            <div key={idx} className='flex flex-col'>
                                                <label className='mb-1 text-sm text-gray-600'>{label}</label>
                                                <input className='border border-gray-400 p-2 rounded-md w-full' />
                                            </div>
                                        ))}
                                    </div>

                                    <div className='flex items-center mt-6 gap-3'>
                                        <div>
                                            <label className="text-sm text-gray-700 font-medium">Period Covered by this Appraisal
                                            </label>
                                        </div>
                                        <div className='flex items-center gap-6'>
                                            <div className='flex flex-col'>
                                                <label className="mb-1 text-sm text-gray-600">Start Date</label>
                                                <input className='border w-[320px] border-gray-500 p-2 rounded-md' type='date' />
                                            </div>

                                            <div className='flex flex-col'>
                                                <label className="mb-1 text-sm text-gray-600">End Date</label>
                                                <input className='w-[320px] border border-gray-500 p-2 rounded-md' type='date' />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-4 row-span-3 col-start-2 row-start-4 mt-[-58px]">
                                <div className='shadow-lg p-1 mt-[-20px] rounded-md'>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Performance Criteria</h3>
                                    <table className="w-full border-collapse text-sm h-[150px] overflow-y-auto">
                                        <thead className="bg-gray-100 text-gray-700">
                                            <tr>
                                                <th className="py-3 px-4 text-left">Criteria</th>
                                                <th className="py-3 px-4 text-left">My Vote</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((item, index) => (
                                                <tr key={index} className="border-t">
                                                    <td className="py-3 px-4">{item}</td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center ml-4">
                                                            <button className="bg-gray-200 text-gray-500 p-2 rounded-full"><IoIosArrowBack /></button>
                                                            <span className="mx-3"> / 10</span>
                                                            <button className="bg-gray-200 text-gray-500 p-2 rounded-full"><IoIosArrowForward /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Pagination Controls */}
                                    <div className="flex justify-between items-center mt-6">
                                        <button
                                            onClick={handlePrev}
                                            disabled={currentPage === 1}
                                            className={`px-4 py-2 rounded-md ${currentPage === 1 ? 'bg-gray-200 text-gray-400' : 'bg-blue-500 text-white'}`}
                                        >
                                            Previous
                                        </button>

                                        <span className="text-sm text-gray-600">
                                            Page {currentPage} of {totalPages}
                                        </span>

                                        <button
                                            onClick={handleNext}
                                            disabled={currentPage === totalPages}
                                            className={`px-4 py-2 rounded-md ${currentPage === totalPages ? 'bg-gray-200 text-gray-400' : 'bg-blue-500 text-white'}`}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                )}

                {deleteModal && (
                    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
                        <div className="bg-white rounded-lg shadow-xl w-[400px] max-w-[90%] p-6 text-center border border-blue-200">
                            <h2 className="text-2xl font-bold text-red-500 mb-2">Remove?</h2>
                            <p className="text-gray-600 text-md mb-2">Do you really want to remove This Performance?</p>
                            <p className="text-lg text-gray-700 font-semibold mb-6">{selectedPeriod}</p>

                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => setDeleteModal(false)}
                                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md"
                                >
                                    No
                                </button>
                                <button
                                    onClick={() => {
                                        setDeleteModal(false);
                                        
                                    }}
                                    className="bg-blue-500 text-white px-6 py-2 rounded-md"
                                >
                                    Yes
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default PerformanceSheet;
