import React, { useEffect } from 'react';
import Logo from "../../../../assets/LOGO HRIS 6.png"

const EmployeeInformation = () => {
  const reportDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto p-[80px] bg-white shadow-lg">
      <header className="flex justify-between items-center border-b pb-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Employee Information</h1>
          <p className="text-sm">Report Generated Date: <span>{reportDate}</span></p>
        </div>
        <div>
          <img src={Logo} alt="HRIS Logo" className="h-16" />
        </div>
      </header>
      <main>
        <div className="grid grid-cols-2 gap-4">
          <div>ID : <span>xxxxxxxxx</span></div>
          <div>Full Name : <span>xxxxxxxxx</span></div>
          <div>Name With Initials : <span>xxxxxxxxx</span></div>
          <div>Calling Name : <span>xxxxxxxxx</span></div>
          <div>NIC : <span>xxxxxxxxx</span></div>
          <div>Date Of Birth : <span>xxxxxxxxx</span></div>
          <div>Gender : <span>xxxxxxxxx</span></div>
          <div>Marital Status : <span>xxxxxxxxx</span></div>
          <div>Contact Number : <span>xxxxxxxxx</span></div>
          <div>Permanent Address : <span>xxxxxxxxx</span></div>
          <div>Temporary Address : <span>xxxxxxxxx</span></div>
          <div>Email Address : <span>xxxxxxxxx</span></div>
          <div>Date Of Appointment : <span>xxxxxxxxx</span></div>
          <div>Status : <span>xxxxxxxxx</span></div>
        </div>
      </main>
      <footer className="mt-8">
        <p className="text-xs">These data & information are strictly under the regulation of British School. Please do not alter data.</p>
      </footer>
    </div>
  );
};

export default EmployeeInformation;
