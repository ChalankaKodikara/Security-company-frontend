import React from "react";

import { FaRegCalendarAlt } from "react-icons/fa";
import { FaBagShopping } from "react-icons/fa6";

const Report_popup = () => {
  return (
    <div className="flex justify-center items-center bg-gray-100 h-full">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full ">
        <h2 className="text-2xl font-semibold mb-6">Action</h2>
        <form className="">
          <div className="flex  gap-6">
            <div className="flex gap-20">
              <label className="block text-sm font-medium text-gray-700 ">
                Employee ID:
              </label>
              <input
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-purple-500"
              />
            </div>
            <div className="flex gap-20">
              <label className="block text-sm font-medium text-gray-700">
                Employee Name:
              </label>
              <input
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-purple-500"
              />
            </div>

            <div className="flex gap-20">
              <label className="block text-sm font-medium text-gray-700 ">
                Department:
              </label>
              <input
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="flex  gap-6 mt-6">
            <div className="flex gap-20">
              <label className="block text-sm font-medium text-gray-700 ">
                Date of Leave Applied :
              </label>
              <input
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-purple-500"
              />
            </div>
            <div className="flex gap-20">
              <label className="block text-sm font-medium text-gray-700">
                Leave Category:
              </label>
              <input
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-purple-500"
              />
            </div>

            <div className="flex gap-20">
              <label className="block text-sm font-medium text-gray-700 ">
                Leave Requested Date:
              </label>
              <input
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="mt-5">
            <div className="flex gap-20">
              <label className="block text-sm font-medium text-gray-700 ">
                Reason:
              </label>
              <input
                type="text"
                className="border border-gray-300 p-2 w-full rounded-md shadow-sm focus:outline-none focus:ring focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex gap-6 mt-6 items-center justify-between">
            {/* left content */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-6">
                <label className="block text-sm font-medium text-gray-700">
                  Action:
                </label>

                <div className="flex items-center gap-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Approve:
                  </label>
                  <input
                    type="checkbox"
                    className="w-5 h-5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Communicate:
                  </label>
                  <input
                    type="checkbox"
                    className="w-5 h-5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Reject:
                  </label>
                  <input
                    type="checkbox"
                    className="w-5 h-5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* right content */}
            <div className="flex">
              <button className="text-white bg-purple-700 font-[12px] py-2 px-4 border border-purple-600 rounded-md shadow-sm hover:bg-purple-600 hover:text-white transition duration-300">
                Add head off the department
              </button>
            </div>
          </div>
          <div className="flex">
            <button className="text-white bg-purple-600  font-[12px] py-4 px-2 border border-purple-600 rounded-md shadow-sm hover:bg-purple-600 hover:text-white transition duration-300">
              Request additional documents or information
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Report_popup;
