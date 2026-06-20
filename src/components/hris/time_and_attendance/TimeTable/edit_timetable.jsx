import React from "react";

import { useState } from "react";
import Navbar from "../../navbar/navbar";
import { CiSearch } from "react-icons/ci";

const Edit_timetable = () => {
  const [nextOfKinSections, setNextOfKinSections] = useState([{}]);
  const [isModalOpen, setIsModalOpen] = useState(false); // State to manage modal visibility

  const handleAddSection = () => {
    if (nextOfKinSections.length < 5) {
      setNextOfKinSections([...nextOfKinSections, {}]); 
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="mx-10 mt-5">
    
      <div className="max-w-6xl p-8">
        <h1 className="text-[30px] font-bold mb-8">Edit Timetable</h1>
        <div className="grid grid-cols-2 gap-y-[60px] gap-x-[60px] text-[20px] items-center ">
          <div>
            <label className="block text-gray-700">Time Table Name</label>
            <input
              type="text"
              className="w-full border border-gray-300 p-2 rounded mt-2"
              value=""
              readOnly
            />
          </div>
          <div>
            <label className="block text-gray-700">Check-in*</label>
            <input
              type="text"
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>
          <div>
            <label className="block text-gray-700">Check-in Start Time*</label>
            <input
              type="time"
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>
          <div>
            <label className="block text-gray-700">Check-in End Time*</label>
            <input
              type="time"
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>

          <div>
            <label className="block text-gray-700">Check-Out*</label>
            <input
              type="time"
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>
          <div>
            <label className="block text-gray-700">Check-Out Start Time*</label>
            <input
              type="time"
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>

          <div>
            <label className="block text-gray-700">Check-Out End Time*</label>
            <input
              type="time"
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>
          <div>
            <label className="block text-gray-700">
              Grace Period Start Time*
            </label>
            <input
              type="time"
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>

          <div>
            <label className="block text-gray-700">
              Grace Period End Time*
            </label>
            <input
              type="time"
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>
          <div>
            <label className="block text-gray-700">
            Medical Leave Start Time*
            </label>
            <input
              type="time"
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>

          <div>
            <label className="block text-gray-700">
              {" "}
              Medical Leave End Time*
            </label>
            <input
              type="time"
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>
          <div>
            <label className="block text-gray-700">Half day Start Time*</label>
            <input
              type="time"
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>

          <div>
            <label className="block text-gray-700">Half Day End Time*</label>
            <input
              type="time"
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>
          <div>
            <label className="block text-gray-700">
              Required Medical Leave Hours*
            </label>
            <input
              type="time"
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>

          <div>
            <label className="block text-gray-700">
              Required Half Day Leave Hours*
            </label>
            <input
              type="time"
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-2xl font-bold font-[#071C50]">
            Assign Employees to Timetable
          </h2>
          <div className="">
            <div className="grid grid-cols-2 gap-4 ">
              <div className="mt-5">
                <div className="form relative w-[60%] rounded-xl mb-5">
                  <button className="absolute left-2 -translate-y-1/2 top-1/2 p-1">
                    <svg
                      className="w-5 h-5 text-gray-700"
                      aria-labelledby="search"
                      role="img"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      height="16"
                      width="17"
                    >
                      <path
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        strokeWidth="1.333"
                        stroke="currentColor"
                        d="M7.667 12.667A5.333 5.333 0 107.667 2a5.333 5.333 0 000 10.667zM14.334 14l-2.9-2.9"
                      ></path>
                    </svg>
                  </button>
                  <input
                    type="text"
                    required=""
                    placeholder="Search by Employee"
                    className="input rounded-xl border-none h-10 px-8 py-3  m-2 placeholder-gray-400"
                    // value={searchQuery}
                    // onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="overflow-y-auto max-h-64">
                  <table className="table-auto w-full">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 bg-[#F5F5F5] rounded-l-xl">
                          Employee ID
                        </th>
                        <th className="px-4 py-2 bg-[#F5F5F5] rounded-r-xl">
                          First Name
                        </th>
                      </tr>
                    </thead>
                    <tbody></tbody>
                  </table>
                </div>
              </div>
              <div className="mt-[10%] h-64 overflow-y-auto">
                <h3 className="text-xl font-bold text-[#344054] mb-4">
                  Selected Employees
                </h3>
                <table className="table-auto w-full">
                  <thead>
                    <tr className="">
                      <th className="px-4 py-2 bg-[#F5F5F5] rounded-l-xl">
                        Employee ID
                      </th>
                      <th className="px-4 py-2 bg-[#F5F5F5] rounded-r-xl">
                        First Name
                      </th>
                    </tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-4">
            <div className="flex justify-start mt-10">
              <button className="bg-gray-500 text-white px-4 py-2 rounded-[22px]">
                Assign Employees to Timetable
              </button>
            </div>
            <div className="flex justify-end mt-10">
              <button className="bg-[#797C80] text-white px-4 py-2 rounded-[22px] mr-2">
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#5B6D49] text-white px-4 py-2 rounded-[22px]"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>

        {/* // button section */}
        <div className="flex justify-between items-center mt-8 mb-6">
          {/* <div>left content</div> */}
          <div className="flex gap-5 mt-10 text-center">
            <button className="text-black bg-white border border-black px-4  py-2 rounded-md shadow-sm ">
              save
            </button>
          </div>
          {/* <div>right content</div> */}
          <div className="flex gap-5 mt-10 text-center">
            <button className="text-purple-600 bg-white border border-black px-4  py-2 rounded-md shadow-sm ">
              Cancel
            </button>
            <button className="px-4 py-2 bg-purple-500 text-white rounded-md shadow-sm hover:bg-purple-600">
              save
            </button>
          </div>
        </div>

        {/* Modal for uploading files */}
        {isModalOpen && (
          <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-200 bg-opacity-80 z-50">
            <div className="bg-white rounded-lg p-8">
              {/* <Upload_File onClose={handleCloseModal} /> */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Edit_timetable;
