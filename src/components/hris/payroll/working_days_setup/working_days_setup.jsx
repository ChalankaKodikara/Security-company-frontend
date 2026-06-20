/** @format */
import React, { useMemo, useState, useEffect } from "react";
import moment from "moment";
import Modal from "react-modal";
import "animate.css";
import {
  FaCalendarAlt,
  FaTrash,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  format,
  isBefore,
} from "date-fns";
import { motion } from "framer-motion";
import { apiFetch } from "../../../../utils/apiClient";

Modal.setAppElement("#root");

// helpers
const buildMonths = (year) =>
  Array.from({ length: 12 }, (_, i) => ({
    label: format(new Date(year, i, 1), "MMMM"),
    idx: i,
  }));

const dayKey = (d) => format(d, "yyyy-MM-dd");
const sameOrBefore = (a, b) => !isBefore(b, a);

const getMonthMatrix = (current) => {
  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const weeks = [];
  let day = gridStart;
  while (day <= gridEnd) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }
  return weeks;
};

const WorkingDaysSetup = () => {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  const [workDays, setWorkDays] = useState([]);
  const [pendingDates, setPendingDates] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [months, setMonths] = useState(buildMonths(year));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const workDayMap = useMemo(() => {
    const m = new Map();
    for (const r of workDays) {
      m.set(moment(r.date).format("YYYY-MM-DD"), r);
    }
    return m;
  }, [workDays]);

  // Fetch existing working days
  useEffect(() => {
    const fetchWorkDays = async () => {
      try {
        const yearParam = currentMonth.getFullYear();
        const monthParam = currentMonth.getMonth() + 1; // JS months start at 0

        const res = await apiFetch(
          `${API_URL}/v1/hris/work-dates/get-work-dates?year=${yearParam}&month=${monthParam}`,
          {
            credentials: "include",
          },
        );

        if (!res.ok) throw new Error("Failed to fetch work dates");
        const json = await res.json();

        if (json?.success && Array.isArray(json.items)) {
          const formatted = json.items.map((d) => ({
            id: d.id,
            date: new Date(d.date),
          }));
          setWorkDays(formatted);
        } else {
          setWorkDays([]);
        }
      } catch (err) {
        console.error("Error fetching work days:", err);
        setWorkDays([]);
      }
    };

    fetchWorkDays();
  }, [currentMonth, refetchTrigger]);

  const weeks = useMemo(() => getMonthMatrix(currentMonth), [currentMonth]);

  const goPrev = () => {
    setYear((y) => y - 1);
    setMonths(buildMonths(year - 1));
    setCurrentMonth(new Date(year - 1, 0, 1));
  };
  const goNext = () => {
    setYear((y) => y + 1);
    setMonths(buildMonths(year + 1));
    setCurrentMonth(new Date(year + 1, 0, 1));
  };

  const onDayClick = (day) => {
    const k = dayKey(day);
    const existing = workDayMap.get(k);

    // 🗑 If already saved date, open delete modal
    if (existing) {
      setSelectedDate(k);
      setDeleteModalIsOpen(true);
      return;
    }

    // 🟡 Toggle selection for new pending date
    setPendingDates((prev) => {
      const already = prev.includes(k);
      if (already) {
        return prev.filter((d) => d !== k); // deselect
      } else {
        return [...prev, k]; // select
      }
    });
  };

  const saveWorkDays = async () => {
    if (pendingDates.length === 0) return;

    try {
      // Get year & month from the first selected date
      const firstDate = new Date(pendingDates[0]);
      const payload = {
        year: firstDate.getFullYear(),
        month: firstDate.getMonth() + 1, // JS months are 0-indexed
        date: pendingDates, // <-- your array of ISO strings
      };

      const res = await apiFetch(
        `${API_URL}/v1/hris/work-dates/create-work-dates`,
        {
          method: "POST",
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );

      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.message || "Failed to add working days");

      setSuccessMessage(
        `Added ${pendingDates.length} working day${pendingDates.length > 1 ? "s" : ""} successfully!`,
      );
      setPendingDates([]);
      setRefetchTrigger((p) => p + 1);
    } catch (err) {
      console.error("Error adding working days:", err);
      setSuccessMessage("Error adding working days: " + err.message);
    }
  };

  const deleteWorkDay = async () => {
    if (!selectedDate) return;
    try {
      const dateToDelete = selectedDate;
      const res = await apiFetch(
        `${API_URL}/v1/hris/work-dates/deleteWorkDate?date=${dateToDelete}`,
        { method: "DELETE", credentials: "include" },
      );
      if (res.ok) {
        setSuccessMessage("Working day deleted successfully!");
        setDeleteModalIsOpen(false);
        setRefetchTrigger((p) => p + 1);
      } else {
        setSuccessMessage("Failed to delete the date.");
      }
    } catch (err) {
      setSuccessMessage("Error deleting working day.");
    }
  };

  const monthTitle = format(currentMonth, "MMMM yyyy");
  const currentYear = format(currentMonth, "yyyy");

  const tableData = useMemo(() => {
    return workDays.filter(
      (d) => format(d.date, "yyyy-MM") === format(currentMonth, "yyyy-MM"),
    );
  }, [workDays, currentMonth]);

  const getPageNumbers = () => {
    const pageNumbers = [];
    let start = Math.max(currentPage - 2, 1);
    let end = Math.min(start + 4, totalPages);
    if (end - start < 4) start = Math.max(end - 4, 1);
    for (let i = start; i <= end; i++) pageNumbers.push(i);
    return pageNumbers;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mt-5 font-montserrat">
        <div className="mb-8">
          <h1 className="text-[25px] text-gray-800 mb-2 flex items-center gap-2">
            <FaCalendarAlt className="text-blue-600" /> Working Days Setup
          </h1>
          <p className="text-gray-500">
            Configure and manage official working days
          </p>
        </div>

        <div className="">
          {/* Calendar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={goPrev}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <FaChevronLeft /> <span>{year - 1}</span>
                </button>
                <div className="flex items-center gap-3">
                  <FaCalendarAlt className="text-blue-600 text-2xl" />
                  <h2 className="text-2xl font-bold text-gray-800">
                    {currentYear}
                  </h2>
                </div>
                <button
                  onClick={goNext}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <span>{year + 1}</span> <FaChevronRight />
                </button>
              </div>

              {/* Month selector */}
              <div className="grid grid-cols-4 gap-3">
                {months.map((m) => {
                  const active =
                    format(currentMonth, "yyyy-MM") ===
                    format(new Date(year, m.idx, 1), "yyyy-MM");
                  return (
                    <button
                      key={m.idx}
                      onClick={() => setCurrentMonth(new Date(year, m.idx, 1))}
                      className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                        active
                          ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg scale-105"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Calendar grid */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3">
                <h3 className="text-lg font-bold text-white">{monthTitle}</h3>
                <p className="text-blue-100 text-xs">
                  Click on a date to mark or remove working days
                </p>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-7 mb-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (d, i) => (
                      <div
                        key={d}
                        className={`text-center py-1 text-xs font-semibold ${
                          i === 0 || i === 6 ? "text-blue-600" : "text-gray-600"
                        }`}
                      >
                        {d}
                      </div>
                    ),
                  )}
                </div>

                <div className="space-y-1">
                  {getMonthMatrix(currentMonth).map((week, widx) => (
                    <div key={widx} className="grid grid-cols-7 gap-1">
                      {week.map((day) => {
                        const inMonth = isSameMonth(day, currentMonth);
                        const k = dayKey(day);
                        const existing = workDayMap.get(k);
                        const isToday = isSameDay(day, new Date());
                        const isPending = pendingDates.includes(k); //  Move it here

                        return (
                          <button
                            key={k}
                            onClick={() => onDayClick(day)}
                            className={`relative h-12 rounded-lg p-1 text-xs font-medium transition-all
        ${
          !inMonth
            ? "bg-gray-50 text-gray-300"
            : existing
              ? "bg-gradient-to-br from-green-400 to-green-500 text-white"
              : isPending
                ? "bg-yellow-100 border border-yellow-400 text-gray-700"
                : "bg-white hover:bg-blue-50 text-gray-700"
        }
        ${isToday && !existing ? "ring-2 ring-blue-500" : ""}`}
                          >
                            <span className="relative z-10">
                              {format(day, "d")}
                            </span>
                            {existing && (
                              <div className="absolute top-0.5 right-0.5">
                                <FaCheckCircle className="text-white text-[10px]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex justify-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gradient-to-br from-green-400 to-green-500" />
                    <span className="text-xs text-gray-600 font-medium">
                      Working Day
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gray-50 border border-gray-300" />
                    <span className="text-xs text-gray-600 font-medium">
                      Other Month
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-3">
                <h3 className="text-lg font-bold text-white">
                  Working Days for {monthTitle}
                </h3>
              </div>

              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={2}
                          className="px-4 py-6 text-center text-gray-400 text-sm"
                        >
                          No working days added for this month
                        </td>
                      </tr>
                    ) : (
                      tableData.map((d, i) => (
                        <tr
                          key={i}
                          className="border-b border-gray-100 hover:bg-gray-50 transition"
                        >
                          <td className="px-4 py-2 text-sm font-semibold text-gray-800">
                            {moment(d.date).format("DD/MM/YYYY")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {pendingDates.length > 0 && (
                  <div className="fixed bottom-6 right-6 z-50">
                    <button
                      onClick={saveWorkDays}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full shadow-lg transition-all"
                    >
                      Save {pendingDates.length} Working Day
                      {pendingDates.length > 1 ? "s" : ""}
                    </button>
                  </div>
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 px-4 py-3 bg-gray-50 border-t">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 text-sm rounded-lg ${
                        currentPage === page
                          ? "bg-green-600 text-white"
                          : "bg-white border text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Modal */}
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={() => setModalIsOpen(false)}
          className="modal-content max-w-md mx-auto mt-20 bg-white rounded-2xl shadow-2xl p-6"
          overlayClassName="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Add Working Day
          </h2>
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {successMessage}
            </div>
          )}
          <div className="text-sm mb-4 text-gray-600">
            You are adding {pendingDates.length} working day(s).
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setModalIsOpen(false)}
              className="flex-1 py-3 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={saveWorkDays}
              className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg"
            >
              Save
            </button>
          </div>
        </Modal>

        {/* Delete Modal */}
        <Modal
          isOpen={deleteModalIsOpen}
          onRequestClose={() => setDeleteModalIsOpen(false)}
          className="modal-content max-w-md mx-auto mt-20 bg-white rounded-2xl shadow-2xl p-6"
          overlayClassName="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaTrash className="text-red-600 text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Remove Working Day?
            </h2>
            <p className="text-gray-500 mb-6">
              {selectedDate && moment(selectedDate).format("DD/MM/YYYY")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalIsOpen(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={deleteWorkDay}
                className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </motion.div>
  );
};

export default WorkingDaysSetup;
