import React, { useState } from 'react';
import { IoIosSearch, IoIosArrowDown } from "react-icons/io";
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';

const View_Employees_Performance = () => {
    const [criteriaList, setCriteriaList] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [scores, setScores] = useState([0, 0, 0, 0]); // 4 items, one for each criterion
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const performanceTypeId = queryParams.get('performance_type_id');
    const employeeNo = Cookies.get('employee_no');
    const [fetchedEmployees, setFetchedEmployees] = useState([]);
    const [popupMessage, setPopupMessage] = useState("");
  const API_URL = process.env.REACT_APP_FRONTEND_URL;


    useEffect(() => {
        const fetchCriteria = async () => {
            if (!performanceTypeId) return;

            try {
                const response = await fetch(
                    `${API_URL}/v1/hris/performance/get-criteria-by-performance-type?performance_type_id=${performanceTypeId}`
                );
                const result = await response.json();
                if (result.success) {
                    setCriteriaList(result.data);
                    setScores(Array(result.data.length).fill(0)); // reset scores to match criteria count
                } else {
                    console.error("Failed to fetch criteria:", result.message);
                }
            } catch (error) {
                console.error("Error fetching criteria:", error);
            }
        };

        fetchCriteria();
    }, [performanceTypeId]);


    useEffect(() => {
        const fetchEmployees = async () => {
            const employeeNo = Cookies.get('employee_no');
            if (!performanceTypeId || !employeeNo) return;

            try {
                const response = await fetch(
                    `${API_URL}/v1/hris/performance/get-employees-according-to-performance?performance_type_id=${performanceTypeId}&supervisor_id=${employeeNo}`
                );
                const result = await response.json();
                if (result.success) {
                    setFetchedEmployees(result.data);
                } else {
                    console.error("Failed to fetch employees:", result.message);
                }
            } catch (error) {
                console.error("Error fetching employees:", error);
            }
        };

        fetchEmployees();
    }, [performanceTypeId]);


    useEffect(() => {
        if (showModal) {
            setScores([0, 0, 0, 0]);
        }
    }, [showModal]);

    const submitScores = async () => {
        if (!selectedEmployee || !employeeNo || criteriaList.length === 0) return;

        const payload = {
            employee_id: selectedEmployee.employee_no,
            supervisor_id: employeeNo,
            criteriaUpdates: criteriaList.map((crit, index) => ({
                criteria_id: crit.criteria_id,
                score: scores[index]
            }))
        };

        try {
            const response = await fetch(`${API_URL}/v1/hris/performance/update-score`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (response.ok && result.success) {
                setPopupMessage(result.message || "Scores submitted.");

                const updatedEmployees = fetchedEmployees.map(emp =>
                    emp.employee_no === selectedEmployee.employee_no
                        ? { ...emp, status: "Completed" }
                        : emp
                );
                setFetchedEmployees(updatedEmployees);

                setScores(Array(criteriaList.length).fill(0));
                setShowModal(false);
            }

        } catch (error) {
            console.error("Error submitting scores:", error);
            alert("Something went wrong while submitting scores.");
        }
    };


    return (
        <div className='h-screen overflow-y-auto px-4 pb-12'>
            <div className='mx-10 '>
                <p className="text-[24px] mb-5">
                    Performance / Others Performance Sheet / Monthly Performance / IT Intern Team
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
                                            PHONE <IoIosArrowDown className="inline text-sm ml-1" />

                                        </th>

                                        {/* Supervisor 2 with custom tooltip */}
                                        <th className="px-4 py-3 relative group">
                                            DESIGNATION <IoIosArrowDown className="inline text-sm ml-1" />

                                        </th>

                                        <th className="px-4 py-3">DEPARTMENT <IoIosArrowDown className="inline ml-1" /></th>
                                        <th className="px-4 py-3">ACTION <IoIosArrowDown className="inline ml-1" /></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-gray-700">
                                    {fetchedEmployees.map((emp, index) => (

                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center font-bold text-pink-600">
                                                    {emp.employee_fullname?.split(" ").map(w => w[0]).join("")}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{emp.employee_fullname}</p>
                                                    <p className="text-xs text-gray-500">{emp.employee_no}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{emp.employee_contact_no || emp.phone_number || '-'}</td>
                                            <td className="px-4 py-3">{emp.designation}</td>
                                            <td className="px-4 py-3 font-semibold">{emp.department}</td>
                                            <td className="px-4 py-3 flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedEmployee(emp);
                                                        setShowModal(true);
                                                    }}
                                                    className='cursor-pointer border border-gray-500 bg-blue-200 text-black p-2 rounded-md w-[120px] justify-center flex'
                                                >
                                                    Evaluate
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

                        {showModal && selectedEmployee && (
                            <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
                                <div className="bg-white rounded-lg w-[1280px] p-6 shadow-xl relative">
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="absolute top-1 right-1 text-gray-400 rounded-full hover:text-gray-700 text-3xl"
                                    >
                                        &times;
                                    </button>

                                    <div className="flex justify-between items-center mb-4 border border-gray-300 p-3 rounded-md mx-[50px]">
                                        <div>
                                            <p><strong>Employee :</strong> {selectedEmployee.employee_fullname}</p>
                                            <p><strong>Emp No :</strong> {selectedEmployee.employee_no}</p>
                                        </div>
                                        <div>
                                            <p><strong>Department :</strong> {selectedEmployee.department || "Not specified department"}</p>
                                            <p><strong>Designation :</strong> {selectedEmployee.designation || "Not specified designation"}</p>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-semibold mb-4">Performance Criteria</h3>

                                    <div className="border rounded-lg">
                                        <div className="flex bg-gray-100 font-semibold p-2 border-b">
                                            <div className="w-1/2">CRITERIA</div>
                                            <div className="w-1/2 text-center">SUPERVISOR 1</div>
                                        </div>

                                        {criteriaList.map((criterion, idx) => (
                                            <div key={criterion.criteria_id} className="flex items-center border-b p-2">
                                                <div className="w-1/2">{criterion.name}</div>
                                                <div className="w-1/2 flex justify-center items-center gap-2">
                                                    <button
                                                        className="px-2 py-1 border bg-gray-200 rounded-full"
                                                        onClick={() => {
                                                            if (scores[idx] > 0) {
                                                                const updated = [...scores];
                                                                updated[idx] -= 1;
                                                                setScores(updated);
                                                            }
                                                        }}
                                                    >
                                                        &lt;
                                                    </button>
                                                    <span className="font-semibold">{scores[idx]} / 5</span>
                                                    <button
                                                        className="px-2 py-1 border bg-gray-200 rounded-full"
                                                        onClick={() => {
                                                            if (scores[idx] < 5) {
                                                                const updated = [...scores];
                                                                updated[idx] += 1;
                                                                setScores(updated);
                                                            }
                                                        }}
                                                    >
                                                        &gt;
                                                    </button>
                                                </div>
                                            </div>

                                        ))}

                                    </div>

                                    <div className="mt-6 text-right">
                                        <button
                                            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
                                            onClick={submitScores}
                                        >
                                            Submit →
                                        </button>

                                    </div>
                                </div>
                            </div>
                        )}




                    </div>
                </div>
            </div>

            {popupMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-[400px] text-center">
                        <h2 className="text-lg font-semibold text-green-700 mb-2">Success</h2>
                        <p className="text-gray-800">{popupMessage}</p>
                        <button
                            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                            onClick={() => setPopupMessage("")}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default View_Employees_Performance;
