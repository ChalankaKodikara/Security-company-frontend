import React from 'react';
import { IoIosSearch, IoIosArrowDown } from "react-icons/io";
import { FaCheck, FaTimes } from "react-icons/fa";

const view_current_month_performance = () => {
    const employees = [
        {
            id: "Emp8743",
            name: "Devonne Wallbridge",
            img: "https://randomuser.me/api/portraits/men/10.jpg",
            supervisor1: 90,
            supervisor2: 86,
            total: 92,
        },
        {
            id: "Emp2345",
            name: "Raynell Clendenenn",
            img: "https://randomuser.me/api/portraits/men/15.jpg",
            supervisor1: 90,
            supervisor2: 90,
            total: 90,
        },
        {
            id: "Emp7583",
            name: "Jamal Kerrod",
            img: "",
            initials: "JK",
            supervisor1: 90,
            supervisor2: 86,
            total: 95,
        },
        {
            id: "Emp9807",
            name: "Shamus Tuttle",
            img: "https://randomuser.me/api/portraits/men/30.jpg",
            supervisor1: 75,
            supervisor2: 90,
            total: 80,
        },
        {
            id: "Emp8743",
            name: "Ariella Filippyev",
            img: "https://randomuser.me/api/portraits/women/25.jpg",
            supervisor1: 80,
            supervisor2: 90,
            total: 90,
        },
        {
            id: "Emp1143",
            name: "Lutero Aloshechkin",
            initials: "LA",
            img: "",
            supervisor1: 89,
            supervisor2: 90,
            total: 80,
        },
        {
            id: "Emp8433",
            name: "Lorine Hischke",
            img: "https://randomuser.me/api/portraits/women/50.jpg",
            supervisor1: 80,
            supervisor2: 90,
            total: 80,
        },
    ];

    return (
        <div className='h-screen overflow-y-auto px-4 pb-12'>
            <div className='mx-10 '>
                <p className="text-[24px] mb-5">
                    Performance / Current Month Performance / Monthly Performance / <span className='font-semibold'>IT Intern Team</span>
                </p>

                <div className='shadow-lg p-3 rounded-lg w-full overflow-y-auto'>
                    <p className='text-[18px]'>Employee Name List - Total Performance</p>
                    <p className='text-sm text-gray-500 mt-[-15px]'>2024 Dec 25 - 2025 Jan 25</p>

                    {/* Search Section */}
                    <div className="shadow-lg p-5 rounded-lg grid grid-cols-5 gap-8 mx-[10%] mt-5">
                        {/* Name Search */}
                        <div className="relative w-full max-w-[300px]">
                            <input
                                type="text"
                                placeholder="Employee name"
                                className="border border-gray-500 p-2 pr-10 rounded-md w-full"
                            />
                            <IoIosSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl pointer-events-none" />
                        </div>

                        {/* Number Search */}
                        <div className="relative w-full max-w-[300px]">
                            <input
                                type="text"
                                placeholder="Employee number"
                                className="border border-gray-500 p-2 pr-10 rounded-md w-full"
                            />
                            <IoIosSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl pointer-events-none" />
                        </div>

                        {/* Department Dropdown */}
                        <div className="relative w-full max-w-[300px]">
                            <select className="appearance-none w-full border border-gray-500 bg-white p-2 pr-10 rounded-md">
                                <option value="">Select department</option>
                                <option value="hr">HR</option>
                                <option value="sales">Sales</option>
                                <option value="engineering">Engineering</option>
                            </select>
                            <IoIosArrowDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl pointer-events-none" />
                        </div>

                        {/* Designation Dropdown */}
                        <div className="relative w-full max-w-[300px]">
                            <select className="appearance-none w-full border border-gray-500 bg-white p-2 pr-10 rounded-md">
                                <option value="">Select designation</option>
                                <option value="test1">Test 1</option>
                                <option value="test2">Test 2</option>
                                <option value="test3">Test 3</option>
                            </select>
                            <IoIosArrowDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl pointer-events-none" />
                        </div>

                        {/* Search Button */}
                        <div>
                            <button className='bg-blue-500 p-2 rounded-md text-white w-[95px]'>Search</button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="mt-8  mx-auto px-6 py-8">
                        <div className="overflow-x-auto shadow border rounded-lg">
                            <table className="w-full table-auto text-left text-sm">
                                <thead className=" text-gray-600 font-semibold border-b">
                                    <tr>
                                        <th className="px-4 py-3">EMPLOYEE NAME <IoIosArrowDown className="inline ml-1" /></th>

                                        {/* Supervisor 1 with custom tooltip */}
                                        <th className="px-4 py-3 relative group">
                                            SUPERVISOR 1 <IoIosArrowDown className="inline text-sm ml-1" />
                                            <div className="absolute z-10 left-0 mt-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1">
                                                Score given by 1st supervisor
                                            </div>
                                        </th>

                                        {/* Supervisor 2 with custom tooltip */}
                                        <th className="px-4 py-3 relative group">
                                            SUPERVISOR 2 <IoIosArrowDown className="inline text-sm ml-1" />
                                            <div className="absolute z-10 left-0 mt-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1">
                                                Score given by 2nd supervisor
                                            </div>
                                        </th>

                                        <th className="px-4 py-3">TOTAL AVG <IoIosArrowDown className="inline ml-1" /></th>
                                        <th className="px-4 py-3">ACTION <IoIosArrowDown className="inline ml-1" /></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-gray-700">
                                    {employees.map((emp, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 flex items-center gap-3">
                                                {emp.img ? (
                                                    <img src={emp.img} alt={emp.name} className="w-10 h-10 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center font-bold text-pink-600">
                                                        {emp.initials}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium">{emp.name}</p>
                                                    <p className="text-xs text-gray-500">{emp.id}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{emp.supervisor1}%</td>
                                            <td className="px-4 py-3">{emp.supervisor2}%</td>
                                            <td className="px-4 py-3 font-semibold">{emp.total}%</td>
                                            <td className="px-4 py-3 flex gap-2">
                                                <button className="bg-green-100 text-green-600 p-2 rounded-full hover:bg-green-200 transition">
                                                    <FaCheck />
                                                </button>
                                                <button className="bg-red-100 text-red-600 p-2 rounded-full hover:bg-red-200 transition">
                                                    <FaTimes />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                            <p>Showing 1 to 7 of 100 entries</p>
                            <div className="flex items-center gap-1">
                                <button className="px-3 py-1 border rounded">Previous</button>
                                {[1, 2, 3, 4, 5].map((pg) => (
                                    <button
                                        key={pg}
                                        className={`px-3 py-1 rounded ${pg === 1 ? "bg-blue-700 text-white" : "border"}`}
                                    >
                                        {pg}
                                    </button>
                                ))}
                                <button className="px-3 py-1 border rounded">Next</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default view_current_month_performance;
