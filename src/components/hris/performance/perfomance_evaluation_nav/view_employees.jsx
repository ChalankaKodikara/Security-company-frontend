import React, { useState } from "react";
import { GoPlus } from "react-icons/go";
import { MdDeleteOutline } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import 'animate.css';

const View_Employees = () => {
    const employees = [
        { id: "Emp8743", name: "Devonne Wallbridge", phone: "+45 42 32 72 73", designation: "Intern SE" },
        { id: "Emp2345", name: "Raynell Clendennen", phone: "+45 42 32 72 73", designation: "Intern BA" },
        { id: "Emp7583", name: "Jamal Kerrod", phone: "+45 42 32 72 73", designation: "Intern QA" },
        { id: "Emp9807", name: "Shamus Tuttle", phone: "+45 42 32 72 73", designation: "Intern UI Designer" },
        { id: "Emp8743", name: "Ariella Filippyev", phone: "+45 42 32 72 73", designation: "Intern SE" },
        { id: "Emp1143", name: "Lutero Aloshechkin", phone: "+45 42 32 72 73", designation: "Intern SE" },
        { id: "Emp8433", name: "Lorine Hischke", phone: "+45 42 32 72 73", designation: "Intern SE" },
    ];

    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 5;
    const totalPages = Math.ceil(employees.length / recordsPerPage);
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentEmployees = employees.slice(indexOfFirstRecord, indexOfLastRecord);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAddEmployee, setShowAddEmployee] = useState(false);

    const handleDelete = (id) => {
        console.log("Delete Employee ID:", id);
    };

    return (
        <div className='mx-5 mt-10'>
            <p className='text-[24px]'>Performance / Performance Evaluation / Monthly Performance / IT Intern Team / Employees</p>

            {/* Header with Add & Send Buttons */}
            <div className='flex justify-between items-center mt-8'>
                <p className='text-[18px]'>Employee name list</p>
                <div className='flex items-center gap-6'>
                    {/* Add Employee Button */}
                    <div
                        className='flex items-center gap-3 bg-blue-500 text-white p-2 rounded-lg cursor-pointer'
                        onClick={() => setShowAddEmployee(true)}
                    >
                        <GoPlus />
                        <button>Add Employee</button>
                    </div>
                    <div className='border border-gray-500 p-2 rounded-lg cursor-pointer' onClick={() => setShowEditModal(true)}>Send</div>
                </div>
            </div>

            {/* Table */}
            <div className='mt-8 shadow-lg p-3 rounded-lg bg-white'>
                <table className="w-full border-collapse text-sm">
                    <thead className="bg-gray-100 text-gray-700">
                        <tr>
                            <th className="py-2 px-2 text-left">Employee Name</th>
                            <th className="py-2 px-2 text-left">Phone</th>
                            <th className="py-2 px-2 text-left">Designation</th>
                            <th className="py-2 px-2 text-left">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {currentEmployees.map((employee, index) => (
                            <tr key={index} className="border-t">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-300 flex items-center justify-center text-white font-bold">
                                            {(employee.name || "N/A")
                                                .split(" ")
                                                .map((name) => name[0])
                                                .join("")
                                                .toUpperCase()}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{employee.name || "N/A"}</div>
                                            <div className="text-sm text-gray-500">{employee.id || "N/A"}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-2 px-2">{employee.phone}</td>
                                <td className="py-2 px-2">{employee.designation}</td>
                                <td className="py-2 px-2">
                                    <button onClick={() => handleDelete(employee.id)} className="text-gray-500 hover:text-red-500">
                                        <MdDeleteOutline className='h-5 w-5' />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination Controls */}
                <div className="flex justify-between items-center mt-4">
                    <button className="px-3 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}>
                        Previous
                    </button>

                    <span className="text-gray-700">Page {currentPage} of {totalPages}</span>

                    <button className="px-3 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}>
                        Next
                    </button>
                </div>
            </div>


            {showAddEmployee && (
                <div className="fixed inset-0 flex justify-end bg-black bg-opacity-30 animate__animated animate__slideInRight">
                    <div className="bg-white w-[400px] h-full shadow-lg p-6 overflow-y-auto transition-transform transform translate-x-0">


                        <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                            onClick={() => setShowAddEmployee(false)}>
                            <IoMdClose className="text-2xl" />
                        </button>

                        <h2 className="text-blue-500 text-xl font-bold mb-4">Add New Employee</h2>


                        <div className="space-y-4">
                            <input type="text" placeholder="Emp Name" className="border p-2 w-full rounded-lg" />
                            <input type="text" placeholder="Emp ID" className="border p-2 w-full rounded-lg" />
                            <input type="text" placeholder="Designation" className="border p-2 w-full rounded-lg" />
                        </div>


                        <h3 className="mt-4 text-gray-600 font-semibold">Result</h3>
                        <div className="mt-2 space-y-2 shadow-lg p-2 rounded-lg">
                            {["Cecilia Payne", "Curtis Fletcher", "Alice Stone", "Darrell Barnes", "Eugenia Moore"].map((name, index) => (
                                <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                                    <div className="h-8 w-8 rounded-full bg-blue-300 flex items-center justify-center text-white font-bold">
                                        {name[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{name}</p>
                                        <p className="text-xs text-gray-500">MRD: {Math.floor(234400 + index)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>


                        <div className="flex justify-end gap-4 mt-6">
                            <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg" onClick={() => setShowAddEmployee(false)}>Back</button>
                            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg">Add</button>
                        </div>
                    </div>
                </div>
            )}

            {showEditModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                    <div className="bg-white p-8 rounded-xl shadow-lg w-[450px] animate__animated animate__zoomIn relative">

                        {/* Close Button */}
                        <button
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                            onClick={() => setShowEditModal(false)}
                        >
                            <IoMdClose className="text-2xl" />
                        </button>

                        {/* Header */}
                        <h2 className="text-blue-500 text-2xl font-bold text-center mb-4">Send Performance Sheet</h2>

                        {/* Subheader */}
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <p className="text-lg font-semibold text-gray-700">IT Intern Team</p>
                            <select className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none">
                                <option>2025 January</option>
                                <option>2025 February</option>
                            </select>
                        </div>

                        <p className="text-center text-gray-500 text-sm mb-6">
                            Are you sure you want to share the Performance Sheet for Employees?
                        </p>

                        {/* Details */}
                        <div className="space-y-2 text-sm text-gray-600 mb-6">
                            <div className="flex justify-between">
                                <p>Start from :</p>
                                <p className="text-blue-500 font-medium">Employee</p>
                            </div>
                            <div className="flex justify-between">
                                <p>Performance :</p>
                                <p className="text-blue-500 font-medium">Monthly</p>
                            </div>
                            <div className="flex justify-between">
                                <p>Employee Count :</p>
                                <p className="text-blue-500 font-medium">132</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-center gap-4">
                            <button
                                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg"
                                onClick={() => setShowEditModal(false)}
                            >
                                No
                            </button>
                            <button
                                className="bg-blue-500 text-white px-6 py-2 rounded-lg"
                                onClick={() => {
                                    setShowEditModal(false);
                                    console.log("Performance Sheet Sent!");
                                }}
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
}

export default View_Employees;
