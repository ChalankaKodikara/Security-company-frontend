import moment from "moment";
import Navbar from "../../navbar/navbar";
import React, { useState, useEffect } from "react";

const Permission = () => {
  const currentDate = moment().format("MMMM Do YYYY");
  const [currentTime, setCurrentTime] = useState(moment().format("h:mm:ss a"));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment().format("h:mm:ss a"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mx-10 mt-5">
      <Navbar />

      <div className="flex justify-between items-center mt-6">
        <div>
          <p className="text-[30px] font-semibold">Permission </p>
          <p className="text-[15px] font-semibold text-primary_purple">
            Permission
          </p>
        </div>
        <div className="flex gap-6 items-center">
          <div>
            <div className="text-[#3D0B5E] text-[20px] font-bold">
              {currentDate}
            </div>
          </div>
          <div className="text-[20px] font-bold">{currentTime}</div>
        </div>
      </div>
      <div className="flex gap-6 items-center mt-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 ">
            Role:
          </label>
        </div>

        <div>
          {" "}
          <input
            type="text"
            className="mt-1 block  px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-purple-500"
          />
        </div>

        <div>
          {" "}
          <label className="block text-sm font-medium text-gray-700">
            Role Description:
          </label>
        </div>

        <div>
          {" "}
          <input
            type="text"
            className="mt-1 block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-purple-500"
          />
        </div>
      </div>

      {/* //grid section */}
      <div className="grid grid-cols-3 gap-4 mt-8 text-center">
        <div>
          <div className="border border-shadow bg-gray-50 w-21 rounded-md p-4">
            Employee
          </div>

          <div className="flex items-center mt-8 text-purple-600">
            <input type="checkbox" className="mr-2" />
            <label className="block text-sm font-medium ">
              Employee Quick OnBoard:
            </label>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center mt-8 text-black">
              <input type="checkbox" className="mr-2" />
              <label className="block text-sm font-medium ">Create</label>
            </div>
            <div className="flex items-center mt-8 text-black">
              <input type="checkbox" className="mr-2" />
              <label className="block text-sm font-medium ">
                <> action</>
              </label>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center mt-8 text-black">
              <input type="checkbox" className="mr-2" />
              <label className="block text-sm font-medium ">action</label>
            </div>
            <div className="flex items-center mt-8 text-black">
              <input type="checkbox" className="mr-2" />
              <label className="block text-sm font-medium ">
                <> action</>
              </label>
            </div>
          </div>
        </div>
        <div>
          <div className="border border-shadow bg-gray-50 w-21 rounded-md p-4">
            Attendance
          </div>
          <div className="flex items-center mt-8 text-purple-600">
            <input type="checkbox" className="mr-2" />
            <label className="block text-sm font-medium ">
              Employee Quick OnBoard:
            </label>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center mt-8 text-black">
              <input type="checkbox" className="mr-2" />
              <label className="block text-sm font-medium ">Create</label>
            </div>
            <div className="flex items-center mt-8 text-black">
              <input type="checkbox" className="mr-2" />
              <label className="block text-sm font-medium ">
                <> action</>
              </label>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center mt-8 text-black">
              <input type="checkbox" className="mr-2" />
              <label className="block text-sm font-medium ">action</label>
            </div>
            <div className="flex items-center mt-8 text-black">
              <input type="checkbox" className="mr-2" />
              <label className="block text-sm font-medium ">
                <> action</>
              </label>
            </div>
          </div>
        </div>
        <div>
          <div className="border border-shadow bg-gray-50 w-21 rounded-md p-4">
            Payroll
          </div>
          <div className="flex items-center mt-8 text-purple-600">
            <input type="checkbox" className="mr-2" />
            <label className="block text-sm font-medium ">
              Employee Quick OnBoard:
            </label>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center mt-8 text-black">
              <input type="checkbox" className="mr-2" />
              <label className="block text-sm font-medium ">Create</label>
            </div>
            <div className="flex items-center mt-8 text-black">
              <input type="checkbox" className="mr-2" />
              <label className="block text-sm font-medium ">
                <> action</>
              </label>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center mt-8 text-black">
              <input type="checkbox" className="mr-2" />
              <label className="block text-sm font-medium ">action</label>
            </div>
            <div className="flex items-center mt-8 text-black">
              <input type="checkbox" className="mr-2" />
              <label className="block text-sm font-medium ">
                <> action</>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* // button section */}
      <div className="flex gap-5 mt-10 text-center">
        <button className="text-purple-600 bg-white border border-black px-4  py-2 rounded-md shadow-sm ">
          Cancel
        </button>
        <button className="px-4 py-2 bg-[#8764A0] text-white rounded-md shadow-sm hover:bg-purple-600">
          save
        </button>
      </div>
    </div>
  );
};

export default Permission;
