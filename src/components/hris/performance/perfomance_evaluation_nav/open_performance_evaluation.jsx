import React, { useState } from 'react'
import { IoIosArrowForward } from "react-icons/io";
import { IoIosArrowBack } from "react-icons/io";
import { IoMdClose } from "react-icons/io";
import { Link } from 'react-router-dom';
import { FiPlusCircle } from "react-icons/fi";
import Select from 'react-select';

const Open_Performance_Evaluation = () => {

    const departmentOptions = [
        { value: 'it', label: 'IT Department' },
        { value: 'finance', label: 'Finance Department' },
        { value: 'hr', label: 'HR Department' },
    ];

    const designationOptions = [
        { value: 'frontend', label: 'Frontend Developer' },
        { value: 'backend', label: 'Backend Developer' },
        { value: 'pm', label: 'Project Manager' },
    ];

    const [selectedDepartments, setSelectedDepartments] = useState([]);
    const [selectedDesignations, setSelectedDesignations] = useState([]);
    const [problemSolving, setProblemSolving] = useState(5);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    
    return (
        <div className='mx-5 mt-10'>
            <p className='text-[24px]'>Performance / Performance Evaluation / Monthly Performance / IT Intern Team</p>

            <div className='flex justify-between items-center mt-8 gap-3'>
                <p className='text-[18px]'>Performance Criteria</p>
                <div className='flex items-center gap-3'>
                    <Link to="/view-employees">
                        <button className='bg-blue-500 text-white p-2 rounded-lg' >Employees</button></Link>
                    <button className='border border-gray-400 rounded-md p-2 w-[100px]' onClick={() => setShowModal(true)}>Edit</button>
                </div>
            </div>

            <div className="mt-5 bg-white rounded-lg shadow-lg p-3">
                <table className="w-full border-collapse text-sm">
                    <thead className="bg-gray-100 text-gray-700">
                        <tr>
                            <th className="py-3 px-4 text-left">Criteria</th>
                            <th className="py-3 px-4 text-left">Employee</th>
                            <th className="py-3 px-4 text-left">Supervisor 1 Rating </th>
                            <th className="py-3 px-4 text-left"> Supervisor 2 Rating </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-t">
                            <td className="py-3 px-4">

                            </td>
                            <td className="py-3 px-4">
                                <div className="flex items-center ml-4">
                                    <button onClick={() => setProblemSolving(Math.max(0, problemSolving - 1))} className="bg-gray-200 text-gray-400 p-2 rounded-full"><IoIosArrowBack /></button>
                                    <span className="mx-3">{problemSolving} / 10</span>
                                    <button onClick={() => setProblemSolving(Math.min(10, problemSolving + 1))} className="bg-gray-200 gray-gray-400 p-2 rounded-full"><IoIosArrowForward /></button>
                                </div>
                            </td>
                            <td className="py-3 px-4">
                                <div className="flex items-center ml-4">
                                    <button onClick={() => setProblemSolving(Math.max(0, problemSolving - 1))} className="bg-gray-200 text-gray-400 p-2 rounded-full"><IoIosArrowBack /></button>
                                    <span className="mx-3">{problemSolving} / 10</span>
                                    <button onClick={() => setProblemSolving(Math.min(10, problemSolving + 1))} className="bg-gray-200 gray-gray-400 p-2 rounded-full"><IoIosArrowForward /></button>
                                </div>
                            </td>
                            <td className="py-3 px-4">
                                <div className="flex items-center ml-4">
                                    <button onClick={() => setProblemSolving(Math.max(0, problemSolving - 1))} className="bg-gray-200 text-gray-400 p-2 rounded-full"><IoIosArrowBack /></button>
                                    <span className="mx-3">{problemSolving} / 10</span>
                                    <button onClick={() => setProblemSolving(Math.min(10, problemSolving + 1))} className="bg-gray-200 gray-gray-400 p-2 rounded-full"><IoIosArrowForward /></button>
                                </div>
                            </td>
                        </tr>
                    </tbody>

                </table>
            </div>
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-[750px] text-center relative">
                        {/* Close Button */}
                        <button
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                            onClick={() => setShowModal(false)}
                        >
                            <IoMdClose className="text-2xl" />
                        </button>

                        {/* Modal Header */}
                        <div className='flex justify-start'>
                            <h2 className="text-blue-500 text-xl font-bold">Edit</h2>
                        </div>

                        {/* Form Fields */}
                        <div className="mt-4">
                            <div className='flex flex-col justify-start'>
                                <label className="text-left text-gray-600">
                                    Department <span className='ml-[8px] text-gray-400 font-thin text-[15px]'>*multiple</span>
                                </label>
                                <Select
                                    isMulti
                                    options={departmentOptions}
                                    className="mt-2"
                                    classNamePrefix="select"
                                    value={selectedDepartments}
                                    onChange={setSelectedDepartments}
                                />
                            </div>

                            <div className='flex flex-col justify-start mt-5'>
                                <label className="text-left text-gray-600">
                                    Designation <span className='ml-[8px] text-gray-400 font-thin text-[15px]'>*multiple</span>
                                </label>
                                <Select
                                    isMulti
                                    options={designationOptions}
                                    className="mt-2"
                                    classNamePrefix="select"
                                    value={selectedDesignations}
                                    onChange={setSelectedDesignations}
                                />
                            </div>


                            <div className='flex flex-col justify-start mt-4'>
                                <label className="text-left text-gray-600">Label Name</label>
                                <input type="text" className="border border-gray-300 rounded-lg p-2 mt-2" />
                            </div>

                            <div className='flex flex-col justify-start mt-4'>
                                <label className="text-left text-gray-600">Label Name</label>
                                <input type="text" className="border border-gray-300 rounded-lg p-2 mt-2" />
                            </div>
                        </div>

                        <div className='flex justify-between mt-5'>
                            {/* Buttons */}



                            <button className="shadow-lg text-black p-3 rounded-lg flex items-center gap-4">
                                <FiPlusCircle />
                                Add more

                            </button>

                            <div className="flex justify-end gap-4 ">
                                <button className="bg-blue-500 text-white p-3 rounded-lg w-[150px]">Update</button>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    )
}

export default Open_Performance_Evaluation