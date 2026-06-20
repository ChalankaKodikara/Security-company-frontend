import React from "react";
import Logo from "../../../../../assets/logo.png";

const hr_report_pdf = () => {
  return (
    <div className="mx-[10%] mt-[5%]">
      <div>
        <div className="flex justify-between items-center">
          <p className="text-[30px] font-bold"> HR Report </p>
          <img src={Logo} alt="logo" className="h-[150px] w-[150px]" />
        </div>

        <div>
          <p>Report genarated Date : {new Date().toLocaleDateString()}</p>
          <hr className="mt-8" />
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-4 ">
            <div>
              <p className="text-gray-600 font-bold">ID :</p>
              <p className="text-black">Test</p>
            </div>
            <div>
              <p className="text-gray-600 font-bold">Employee Name :</p>
              <p className="text-black">Test</p>
            </div>
            <div>
              <p className="text-gray-600 font-bold">Name With Initials :</p>
              <p className="text-black">Test</p>
            </div>
            <div>
              <p className="text-gray-600 font-bold">Calling Name :</p>
              <p className="text-black">Test</p>
            </div>
            <div>
              <p className="text-gray-600 font-bold">NIC :</p>
              <p className="text-black">Test</p>
            </div>
            <div>
              <p className="text-gray-600 font-bold">Date Of Birth :</p>
              <p className="text-black">Test</p>
            </div>
            <div>
              <p className="text-gray-600 font-bold">Gender :</p>
              <p className="text-black">Test</p>
            </div>
            <div>
              <p className="text-gray-600 font-bold">Marital Status :</p>
              <p className="text-black">Test</p>
            </div>
            <div>
              <p className="text-gray-600 font-bold">Contact Number :</p>
              <p className="text-black">Test</p>
            </div>
            <div>
              <p className="text-gray-600 font-bold">Permanent Address :</p>
              <p className="text-black">Test</p>
            </div>
            <div>
              <p className="text-gray-600 font-bold">Temporary Address :</p>
              <p className="text-black">Test</p>
            </div>
            <div>
              <p className="text-gray-600 font-bold">Email Address :</p>
              <p className="text-black">Test</p>
            </div>
          </div>
        </div>
        <p>
          These data & information are strictly under the regulation of British
          School. Please do not alter data.
        </p>
      </div>
    </div>
  );
};

export default hr_report_pdf;
