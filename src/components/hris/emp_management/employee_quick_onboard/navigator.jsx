/** @format */

import React from "react";
import { FaRegUser } from "react-icons/fa";
import { TbUsers } from "react-icons/tb";
import { IoBriefcaseOutline } from "react-icons/io5";
import { HiOutlineBuildingLibrary } from "react-icons/hi2";
import { TiDocumentAdd } from "react-icons/ti";

const Navigator = ({ currentStep, completedSteps }) => {
  const steps = [
    { id: 1, label: "Personal Details" },
    { id: 2, label: "Next of Kings" },
    { id: 3, label: "Employment Details" },
    { id: 4, label: "Bank Details" },
    { id: 5, label: "Personal Documents" },
  ];

  // console.log("currentStep", currentStep);
  // console.log("completedSteps", completedSteps);
  return (
    <div className="bg-white shadow-md rounded-lg p-4 w-full max-w-xs mx-0">
      <div className="space-y-4">
        <div
          className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer`}
        >
          <div
            className={`p-2 rounded-lg ${
              completedSteps.includes(1)
                ? currentStep === 1
                  ? "bg-blue-100 text-blue-800"
                  : "bg-blue-500 text-white"
                : "bg-white text-gray-800"
            }`}
          >
            <FaRegUser />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Personal Details</h2>
            <p className="text-sm text-gray-500">Name/Email/Contact</p>
          </div>
        </div>

        <div
          className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer`}
        >
          <div
            className={`p-2 rounded-lg ${
              completedSteps.includes(2)
                ? currentStep === 2
                  ? "bg-blue-100 text-blue-800"
                  : "bg-blue-500 text-white"
                : "bg-white text-gray-800"
            }`}
          >
            <TbUsers />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Next Of Kin 1 Details</h2>
            <p className="text-sm text-gray-500">Relationship</p>
          </div>
        </div>

        <div
          className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer`}
        >
          <div
            className={`p-2 rounded-lg ${
              completedSteps.includes(3)
                ? currentStep === 3
                  ? "bg-blue-100 text-blue-800"
                  : "bg-blue-500 text-white"
                : "bg-white text-gray-800"
            }`}
          >
            <IoBriefcaseOutline />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Employment Details</h2>
            <p className="text-sm text-gray-500">Department/Supervisor</p>
          </div>
        </div>

        <div
          className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer`}
        >
          <div
            className={`p-2 rounded-lg ${
              completedSteps.includes(4)
                ? currentStep === 4
                  ? "bg-blue-100 text-blue-800"
                  : "bg-blue-500 text-white"
                : "bg-white text-gray-800"
            }`}
          >
            <HiOutlineBuildingLibrary />
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              Bank Details & Visa Details
            </h2>
            <p className="text-sm text-gray-500">Account Details</p>
          </div>
        </div>

        <div
          className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer`}
        >
          <div
            className={`p-2 rounded-lg ${
              completedSteps.includes(5)
                ? currentStep === 5
                  ? "bg-blue-100 text-blue-800"
                  : "bg-blue-500 text-white"
                : "bg-white text-gray-800"
            }`}
          >
            <TiDocumentAdd />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Personal Documents</h2>
            <p className="text-sm text-gray-500">Files/Documents</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigator;
