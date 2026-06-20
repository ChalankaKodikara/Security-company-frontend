

import React from 'react';

const LeavesData = [
  { color: 'bg-[#7E22CE]', label: 'Annual Leaves' },
  { color: 'bg-[#FA0BA9]', label: 'Casual Leaves' },
  { color: 'bg-[#F2E56F]', label: 'Medical Leave' },
  { color: 'bg-[#B0F07A]', label: 'Special Leaves' },
  { color: 'bg-[#FF8A00]', label: 'Nopay Leaves' },

];
const Detailsofleaves = () => {
  return (
    <div className="border-2 border-black p-4 w-[200px] rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Leaves</h2>
      <ul>
        {LeavesData.map((leave, index) => (
          <li key={index} className="flex items-center mb-2">
            <span className={`w-4 h-4 rounded-full ${leave.color} mr-2`} />
            {/* <span className={`w-4 h-4 rounded-full ${leave.color.startsWith('#') ? '' : leave.color} mr-2`} 
                  style={leave.color.startsWith('#') ? { backgroundColor: leave.color } : {}} /> */}
            <span>{leave.label}</span>
            
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Detailsofleaves;
