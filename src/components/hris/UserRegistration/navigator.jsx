/** @format */
import React from "react";
import { FaRegUser } from "react-icons/fa";
import { TbUsers } from "react-icons/tb";
import { IoBriefcaseOutline } from "react-icons/io5";
import { HiOutlineBuildingLibrary } from "react-icons/hi2";
import { IoIosArrowForward } from "react-icons/io";
import { LuFileStack } from "react-icons/lu"; // 📑 New icon for Personal Docs

const Navigator = ({ currentStep, completedSteps = [] }) => {
  const steps = [
    {
      id: 1,
      label: "Personal Details",
      desc: "Name/Email/Contact",
      icon: <FaRegUser />,
    },
    {
      id: 2,
      label: "Official Details",
      desc: "Designation/Membership",
      icon: <IoBriefcaseOutline />,
    },
    {
      id: 3,
      label: "Next of Kin Details",
      desc: "Relationship/Details",
      icon: <TbUsers />,
    },
    {
      id: 4,
      label: "Bank Details",
      desc: "Account/Branch Info",
      icon: <HiOutlineBuildingLibrary />,
    },
    {
      id: 5,
      label: "Personal Documents",
      desc: "NIC/Passport/Other Docs",
      icon: <LuFileStack />,
    },
  ];

  return (
    <div className="flex flex-wrap md:flex-nowrap items-center justify-start gap-6 overflow-x-auto p-4">
      {steps.map((step, index) => {
        const isActive = currentStep === step.id;
        const isCompleted = completedSteps.includes(step.id);

        return (
          <div key={step.id} className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 px-4 py-2 rounded-md transition-all duration-150 min-w-[180px] text-gray-700">
              {/* Step ID with conditional red highlight */}
              <div
                className={`flex items-center justify-center p-2 w-8 h-8 rounded-lg font-semibold text-sm border transition-all duration-200
                  ${isActive
                    ? "bg-blue-300 text-white border-blue-600"
                    : isCompleted
                      ? "bg-white text-blue-500 border-blue-500"
                      : "bg-gray-100 text-gray-500 border-gray-300"
                  }
                  hover:bg-blue-600 hover:text-white cursor-pointer
                `}
              >
                {step.id}
              </div>

              {/* Static label and desc */}
              <div className="flex flex-col">
                <span className="text-sm font-semibold flex items-center gap-1">
                  {step.icon} {step.label}
                </span>
                <span className="text-xs">{step.desc}</span>
              </div>
            </div>

            {/* Arrow between steps */}
            {index < steps.length - 1 && (
              <div className="text-blue-400 text-xl">
                <IoIosArrowForward />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Navigator;
