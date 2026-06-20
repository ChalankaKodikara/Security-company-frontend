import React, { useEffect, useState } from 'react';
import { FaRegUser } from "react-icons/fa6";
import { BsBox } from "react-icons/bs";
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const Others_Performance_Sheet = () => {
    const [counts, setCounts] = useState({
        monthly_count: 0,
        yearly_april_count: 0,
        yearly_december_count: 0,
        probation_count: 0,
        ftc_count: 0,
    });
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

    const navigate = useNavigate();

    useEffect(() => {
        const fetchCounts = async () => {
            const employeeNo = Cookies.get('employee_no');
            if (!employeeNo) return;

            try {
                const response = await fetch(`${API_URL}/v1/hris/performance/performance-by-supervisor-counts?employee_no=${employeeNo}`);
                const result = await response.json();

                if (result.success) {
                    setCounts(result.data);
                } else {
                    console.error("Error fetching counts:", result.message);
                }
            } catch (error) {
                console.error("Network error while fetching counts:", error);
            }
        };

        fetchCounts();
    }, []);

    const cards = [
        {
            title: "Monthly Performance",
            count: counts.monthly_count,
            label: "Assigned Employees",
            bgColor: "bg-blue-50",
            iconBg: "border-blue-400",
            icon: <FaRegUser className="text-blue-500 text-2xl" />,
            route: "/view-others-performance",
            type: "Monthly",
        },
        {
            title: "Yearly 1st Performance",
            count: counts.yearly_april_count,
            label: "Assigned Employees",
            bgColor: "bg-blue-50",
            iconBg: "border-blue-400",
            icon: <FaRegUser className="text-blue-500 text-2xl" />,
            route: "/view-others-performance",
            type: "Yearly | April",
        },
        {
            title: "Yearly 2nd Performance",
            count: counts.yearly_december_count,
            label: "Salary Components",
            bgColor: "bg-blue-50",
            iconBg: "border-blue-400",
            icon: <FaRegUser className="text-blue-500 text-2xl" />,
            route: "/view-others-performance",
            type: "Yearly | December",
        },
        {
            title: "End Of FTC",
            count: counts.ftc_count,
            label: "Salary Components",
            bgColor: "bg-blue-50",
            iconBg: "border-blue-400",
            icon: <FaRegUser className="text-blue-500 text-2xl" />,
            route: "/view-others-performance",
            type: "End Of FTC",
        },
        {
            title: "End of Probation",
            count: counts.probation_count,
            label: "Salary Components",
            bgColor: "bg-blue-50",
            iconBg: "border-blue-400",
            icon: <FaRegUser className="text-blue-500 text-2xl" />,
            route: "/view-others-performance",
            type: "End of Probation",
        },
    ];

    return (
        <div className='mx-10 mt-5'>
            <p className='text-[22px] font-semibold mb-4'>Performance / Others Performance Sheet</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-5 shadow-lg p-4 rounded-md">
                {cards.map((card, index) => (
                    <div key={index} className="rounded-lg border shadow-md p-6 flex flex-col cursor-pointer">
                        <div className={`${card.bgColor} p-5 rounded-lg`}>
                            <div className={`flex items-center justify-center border-dashed border-2 rounded-full h-16 w-16 mx-auto mb-4 ${card.iconBg}`}>
                                {card.icon}
                            </div>
                        </div>
                        <h3 className="text-center font-semibold text-lg mb-2">{card.title}</h3>
                        <div className="text-center text-gray-500 mb-4 flex gap-4 items-center">
                            <div className="bg-blue-100 text-blue-500 p-2 rounded-md "><BsBox className="w-5 h-5" /></div>
                            <div className="text-left mt-4">
                                <span className="block font-bold">{card.count}</span>
                                <p className="text-orange-400">Performance</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate(`${card.route}?type=${card.type}`)}
                            className="mt-auto bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 w-full"
                        >
                            View
                        </button>
                    </div>
                ))}

            </div>
        </div>
    );
};

export default Others_Performance_Sheet;
