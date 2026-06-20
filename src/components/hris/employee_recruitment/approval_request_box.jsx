import React from 'react';
import { FiBox } from "react-icons/fi";
import { ImProfile } from "react-icons/im";
import { Link } from 'react-router-dom';

const ApprovalRequestBox = () => {
    return (
        <div className="mx-10 mt-5">
            {/* Breadcrumb Navigation */}
            <p className="text-gray-500 text-lg">
                Employee Recruitment Settings <span className="text-black font-semibold"> / Approval Request Box</span>
            </p>

            {/* Request Section */}
            <div className="bg-white shadow-lg rounded-lg p-6 mt-4">
                <h2 className="text-lg font-semibold text-gray-800">Pending Request - for Approval</h2>

                <div className='grid grid-flow-row grid-cols-4 gap-4'>
                    {/* Card Section */}
                    <div className="mt-4 flex">
                        <div className="bg-white shadow-md rounded-lg p-4 w-[349px] h-[306px] border">
                            {/* Placeholder for Image */}
                            <div className="bg-blue-100 flex items-center justify-center h-20 rounded-lg">
                                <span className="text-gray-600  text-3xl border-2 border-black border-dashed p-4 rounded-full"><ImProfile />
                                </span>
                            </div>

                            {/* Job Posting Info */}
                            <div className="mt-3">
                                <h3 className="text-gray-800 text-[22px] font-regular">Job Posting</h3>

                                {/* Pending Requests */}
                                <div className="flex items-center mt-3">
                                    <FiBox
                                        className="text-blue-500 bg-blue-100 rounded-md p-2 w-8 h-8 text-xl" />
                                    <div className="ml-2">
                                        <p className="text-gray-700 font-medium">01</p>
                                        <p className="text-orange-500 text-sm">Pending Requests</p>
                                    </div>
                                </div>
                            </div>
                            <Link to= "/supervisor-approval">

                                {/* View Button */}
                                <button className="w-full bg-blue-500 text-white mt-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition">
                                    View
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApprovalRequestBox;
