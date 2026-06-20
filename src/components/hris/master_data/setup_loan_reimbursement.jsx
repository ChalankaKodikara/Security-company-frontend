import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-date-range';
import { format, parseISO } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { FaRegCalendarAlt } from 'react-icons/fa';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from "framer-motion";

const Setup_Loan_Reimbursement = () => {
  const [range, setRange] = useState([
    {
      startDate: null,
      endDate: null,
      key: 'selection',
    },
  ]);
  const [showPicker, setShowPicker] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [masterId, setMasterId] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  const getUsernameFromCookies = () => {
    const match = document.cookie.match(/username=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  };

  const handleChange = (item) => {
    setRange([item.selection]);
    setHasChanges(true);
    if (
      item.selection.startDate &&
      item.selection.endDate &&
      item.selection.startDate !== item.selection.endDate
    ) {
      setShowPicker(false);
    }
  };

  const fetchActiveReimbursement = async () => {
    try {
      const res = await axios.get(`${API_URL}/v1/hris/reimbursement-master/active`);
      if (res.data?.success && res.data.data?.length > 0) {
        const data = res.data.data[0]; //  pick first element from array
        setName(data.name || '');
        setAmount(data.considered_loan_limit || '');
        setMasterId(data.id);
        setRange([
          {
            startDate: parseISO(data.start_date),
            endDate: parseISO(data.end_date),
            key: 'selection',
          },
        ]);
        setIsEditing(true);
        setHasChanges(false);
      } else {
        setIsEditing(false); // no record → allow Save
      }
    } catch (error) {
      console.warn('No active reimbursement master found:', error?.response?.status);
      setIsEditing(false);
    }
  };


  const handleSubmit = async () => {
    const startDate = range[0].startDate ? format(range[0].startDate, 'yyyy-MM-dd') : null;
    const endDate = range[0].endDate ? format(range[0].endDate, 'yyyy-MM-dd') : null;

    if (!name || !amount || !startDate || !endDate) {
      toast.error('Please fill in all fields.');
      return;
    }

    const payload = {
      name,
      considered_loan_limit: parseFloat(amount),
      start_date: startDate,
      end_date: endDate,
      is_active: true,
    };

    try {
      if (isEditing && masterId) {
        const res = await axios.put(`${API_URL}/v1/hris/reimbursement-master/update/${masterId}`, payload);
        toast.success(res.data.message || 'Updated successfully.');
      } else {
        const created_by = getUsernameFromCookies();
        const res = await axios.post(`${API_URL}/v1/hris/reimbursement-master/add`, {
          ...payload,
          created_by,
        });
        toast.success(res.data.message || 'Added successfully.');
      }

      await fetchActiveReimbursement(); // reload state
    } catch (error) {
      console.error('Error submitting data:', error);
      toast.error(error?.response?.data?.message || 'Failed to submit reimbursement master.');
    }
  };

  const handleButtonClick = () => {
    if (isEditing && hasChanges) {
      setShowConfirmModal(true);
    } else {
      handleSubmit();
    }
  };

  useEffect(() => {
    fetchActiveReimbursement();
  }, []);


  return (

    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mx-5 mt-5 font-montserrat">
        <ToastContainer position="top-right" autoClose={3000} />
        <p className="text-[22px] mb-8">
          <span className="text-gray-400">Master Data</span> / Setup Bank Loan Reimbursement
        </p>

        <div className="shadow-md p-4 rounded-md">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="text-gray-500">Name</label>
              <input
                type="text"
                className="border border-gray-300 p-2 rounded-md bg-white"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setHasChanges(true);
                }}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-gray-500">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rs</span>
                <input
                  type="number"
                  className="border border-gray-300 p-2 pl-10 rounded-md bg-white w-full"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setHasChanges(true);
                  }}
                  placeholder="Enter amount"
                />
              </div>
            </div>


            <div className="flex flex-col relative">
              <label className="text-gray-500 mb-1">Time Duration</label>
              <div className="relative w-full">
                <input
                  type="text"
                  readOnly
                  onClick={() => setShowPicker(!showPicker)}
                  value={
                    range[0].startDate && range[0].endDate
                      ? `${format(range[0].startDate, 'yyyy-MM-dd')} to ${format(
                        range[0].endDate,
                        'yyyy-MM-dd'
                      )}`
                      : ''
                  }
                  placeholder="Select date range"
                  className="border border-gray-300 p-2 pr-10 rounded-md cursor-pointer bg-white w-full"
                />
                <FaRegCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>

              {showPicker && (
                <div className="absolute z-50 mt-2">
                  <DateRange
                    ranges={range}
                    onChange={handleChange}
                    moveRangeOnFirstSelection={false}
                    editableDateInputs={true}
                    showDateDisplay={false}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="justify-end mt-5 flex">
            {/* Show nothing if editing and no changes */}
            {!(isEditing && !hasChanges) && (
              <button
                onClick={handleButtonClick}
                className="bg-[#2495FE] text-white p-3 rounded-md hover:bg-blue-600 transition"
              >
                {isEditing ? 'Update' : 'Save'}
              </button>
            )}
          </div>

        </div>

        {/*  Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg w-[400px] shadow-md text-center relative">
              <button
                className="absolute top-2 right-3 text-gray-500 text-xl"
                onClick={() => setShowConfirmModal(false)}
              >
                &times;
              </button>
              <h2 className="text-xl font-semibold mb-3">Update?</h2>
              <p className="text-gray-600 mb-5">Are you sure you want to apply these changes?</p>
              <div className="flex justify-center gap-4">
                <button
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md"
                  onClick={() => setShowConfirmModal(false)}
                >
                  No
                </button>
                <button
                  className="bg-[#2495FE] text-white px-4 py-2 rounded-md hover:bg-blue-600"
                  onClick={() => {
                    setShowConfirmModal(false);
                    handleSubmit();
                  }}
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </motion.div>

  );
};

export default Setup_Loan_Reimbursement;
