import React from "react";

const Delete_item = () => {
  return (
    <div className="items-center mx-[100px]">
      <div className="items-center text-black mx-[100px] ">
        <p> Are you sure want to delete this item?</p>
      </div>
      <div className=" flex gap-10 w-[500px] p-[100px] ">
        <div className="items-center ">
          <button className=" bg-gray-500 text-white border border-black px-4  py-2 rounded-full shadow-sm p-[10px] w-[200px]">
            No
          </button>
        </div>
        <div className="items-center ">
          <button className=" bg-red-600 text-white border border-black px-4  py-2 rounded-full shadow-sm p-[10px] w-[200px]">
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Delete_item;
