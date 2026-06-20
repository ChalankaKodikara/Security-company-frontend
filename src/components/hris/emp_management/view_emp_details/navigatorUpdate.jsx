/** @format */

import React from "react";
import { FaRegUser } from "react-icons/fa";
import { TbUsers } from "react-icons/tb";
import { IoBriefcaseOutline } from "react-icons/io5";
import { HiOutlineBuildingLibrary } from "react-icons/hi2";
import { TiDocumentAdd } from "react-icons/ti";
import { IoIosArrowForward, IoMdClose } from "react-icons/io";

const NavigatorUpdate = ({ currentStep, completedSteps, isClosed }) => {
  const steps = [
    { id: 1, label: "Personal Details" },
    { id: 2, label: "Next of Kin Details" },
    { id: 3, label: "Employment Details" },
    { id: 4, label: "Bank Details" },
    { id: 5, label: "Personal Documents" },
  ];

  return (
    <div className="bg-white p-4 w-full mx-auto relative">
      {/* Close Button */}
      <div className="absolute top-4 right-4 cursor-pointer">
        <IoMdClose
          className="text-2xl text-gray-500 hover:text-gray-800"
          onClick={() => isClosed(false)}
        />
      </div>

      {/* Navigator Content */}
      <div className="flex items-center space-x-6">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Individual Step */}
            <div className={`flex items-center cursor-pointer`}>
              <div
                className={`flex items-center p-4 rounded-lg ${
                  completedSteps.includes(step.id)
                    ? currentStep === step.id
                      ? "bg-blue-100 text-blue-800"
                      : "bg-blue-500 text-white"
                    : "bg-blue-100 text-gray-800"
                }`}
              >
                {/* Icons can be mapped here dynamically if desired */}
                {index === 0 && <FaRegUser className="text-xl" />}
                {index === 1 && <TbUsers className="text-xl" />}
                {index === 2 && <IoBriefcaseOutline className="text-xl" />}
                {index === 3 && (
                  <HiOutlineBuildingLibrary className="text-xl" />
                )}
                {index === 4 && <TiDocumentAdd className="text-xl" />}
              </div>
              <div className="ml-2">
                <h2 className="text-xl font-semibold">
                  {step.label.split(" ")[0]}
                </h2>
                <p className="text-xl font-semibold">
                  {step.label.split(" ")[1]} {step.label.split(" ")[2]}
                </p>
              </div>
            </div>

            {/* Arrow except for the last step */}
            {index < steps.length - 1 && (
              <IoIosArrowForward className="text-xl mr-2" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default NavigatorUpdate;
