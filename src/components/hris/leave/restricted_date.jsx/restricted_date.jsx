import React, { useMemo, useState, useEffect } from "react";
import moment from "moment";
import Modal from "react-modal";
import "animate.css";
import "./calendar.css";
import Date_Restriction_Img from "../../../../assets/date_restriction.jpg";
import Cookies from "js-cookie";
import Select from "react-select";
import { FaCalendarAlt, FaTrash, FaBan, FaStar, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { motion } from "framer-motion";
import { apiFetch } from "../../../../utils/apiClient";

import {
  addMonths,
  subMonths,
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

Modal.setAppElement("#root");

const buildMonths = (year) => {
  return Array.from({ length: 12 }, (_, i) => ({
    label: format(new Date(year, i, 1), "MMMM"),
    fullLabel: format(new Date(year, i, 1), "yyyy MMMM"),
    idx: i,
  }));
};

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

const HOLIDAY_TYPES = [
  { value: "Holiday", label: "Holiday" },
  { value: "Restricted", label: "Restricted" },
  { value: "Public", label: "Public" },
  { value: "Bank", label: "Bank" },
];

const Restricted_Date = () => {
  const [restrictedDates, setRestrictedDates] = useState([]);
  const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false);
  const [holidayModalIsOpen, setHolidayModalIsOpen] = useState(false);
  const [year, setYear] = useState(2025);
  const [months, setMonths] = useState(buildMonths(year));
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedRid, setSelectedRid] = useState(null);
  const [holidayName, setHolidayName] = useState("");
  const [holidayType, setHolidayType] = useState(HOLIDAY_TYPES[0]);
  const [successMessage, setSuccessMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 6, 1));
  const [anchorDate, setAnchorDate] = useState(null);
  const [pendingDates, setPendingDates] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState(null);

  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const rowsPerPage = 25;
  const token = Cookies.get("accessToken");

  const restrictedMap = useMemo(() => {
    const m = new Map();
    for (const r of restrictedDates) {
      m.set(moment(r.date).format("YYYY-MM-DD"), r);
    }
    return m;
  }, [restrictedDates]);

  const HOLIDAY_COLORS = {
    holiday: "bg-gradient-to-br from-yellow-400 to-orange-500 text-white",
    restricted: "bg-gradient-to-br from-gray-500 to-gray-700 text-white",
    public: "bg-gradient-to-br from-blue-500 to-blue-600 text-white",
    bank: "bg-gradient-to-br from-red-500 to-red-600 text-white",
  };



  // Fetch Organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await apiFetch(`${API_URL}/v1/hris/organizations/organization`);
        const result = await response.json();

        if (result?.success && result?.data) {
          const orgOptions = result.data.map((org) => ({
            value: org.id,
            label: org.organization_name,
          }));
          setOrganizations(orgOptions);
          if (orgOptions.length > 0) {
            setSelectedOrganization(orgOptions[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching organizations:", error);
      }
    };

    fetchOrganizations();
  }, [API_URL, token]);

  useEffect(() => {
    if (!selectedOrganization || !year) return;

    const fetchHolidayCalendar = async () => {
      try {
        const params = new URLSearchParams({
          organization_id: selectedOrganization.value,
          year: year,
        });

        const response = await apiFetch(
          `${API_URL}/v1/hris/holiday-calendar/get?${params.toString()}`,
         
        );

        const result = await response.json();

        if (result?.success && result?.data) {
          const formatted = result.data.map((item) => ({
            id: item.id,
            date: new Date(item.holiday_date),
            name: item.holiday_name,
            type: item.type, // PUBLIC | BANK | OPTIONAL
          }));

          setRestrictedDates(formatted);
        }
      } catch (error) {
        console.error("Error fetching holiday calendar:", error);
      }
    };

    fetchHolidayCalendar();
  }, [selectedOrganization, year, refetchTrigger, API_URL, token]);


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

  const tableData = useMemo(() => {
    if (!restrictedDates.length) return [];
    return restrictedDates.filter((d) =>
      format(d.date, "yyyy-MM") === format(currentMonth, "yyyy-MM")
    );
  }, [restrictedDates, currentMonth]);

  const onDayClick = (day, evt) => {
    const k = dayKey(day);
    const existing = restrictedMap.get(k);

    if (existing) {
      setHolidayName(existing.reason || "");
      setSelectedRid(existing.rid);
      setSelectedDate(k);
      setDeleteModalIsOpen(true);
      setAnchorDate(null);
      return;
    }

    if (evt?.ctrlKey && anchorDate) {
      const a = isBefore(day, anchorDate) ? day : anchorDate;
      const b = isBefore(day, anchorDate) ? anchorDate : day;

      const toAdd = [];
      let d = a;
      while (sameOrBefore(a, d) && sameOrBefore(d, b)) {
        const dk = dayKey(d);
        if (!restrictedMap.has(dk)) toAdd.push(dk);
        d = addDays(d, 1);
      }

      if (toAdd.length === 0) return;
      setPendingDates(toAdd);
      setHolidayName("");
      setHolidayType(HOLIDAY_TYPES[0]);
      setHolidayModalIsOpen(true);
      setAnchorDate(null);
      return;
    }

    setPendingDates([k]);
    setHolidayName("");
    setHolidayType(HOLIDAY_TYPES[0]);
    setHolidayModalIsOpen(true);
    setAnchorDate(day);
  };

  const saveHoliday = async () => {
    if (!pendingDates?.length) {
      setSuccessMessage("Please select date(s) before saving.");
      return;
    }

    if (!holidayName.trim()) {
      setSuccessMessage("Please enter a holiday name.");
      return;
    }

    if (!selectedOrganization) {
      setSuccessMessage("Please select an organization.");
      return;
    }

    try {
      for (const iso of pendingDates) {
        const data = {
          organization_id: selectedOrganization.value,
          holiday_date: iso,
          holiday_name: holidayName.trim(),
          type: holidayType.value,
        };

        const res = await apiFetch(`${API_URL}/v1/hris/holiday-calendar/upsertHoliday`, {
          method: "POST",
          
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const errorText = await res.json().catch(() => ({}));
          throw new Error(errorText?.error || `Failed to add ${iso}`);
        }
      }

      setSuccessMessage(
        `Holiday${pendingDates.length > 1 ? "s" : ""} added successfully!`
      );
      setHolidayModalIsOpen(false);
      setPendingDates([]);
      setHolidayName("");
      setHolidayType(HOLIDAY_TYPES[0]);
      setRefetchTrigger((p) => p + 1);
    } catch (error) {
      setSuccessMessage(
        `An error occurred while saving the holiday: ${error.message}`
      );
    }
  };

  const deleteDate = async () => {
    if (!selectedDate || !selectedOrganization) return;

    try {
      const params = new URLSearchParams({
        organization_id: selectedOrganization.value,
        holiday_date: selectedDate, // yyyy-MM-dd
      });

      const response = await apiFetch(
        `${API_URL}/v1/hris/holiday-calendar/delete?${params.toString()}`,
        {
          method: "DELETE",
         
        }
      );

      const result = await response.json();

      if (response.ok && result?.success) {
        setSuccessMessage("Holiday deleted successfully!");
        setDeleteModalIsOpen(false);
        setSelectedDate(null);
        setRefetchTrigger((p) => p + 1);
      } else {
        setSuccessMessage(result?.message || "Failed to delete holiday.");
      }
    } catch (error) {
      console.error(error);
      setSuccessMessage("An error occurred while deleting the holiday.");
    }
  };


  const getPageNumbers = () => {
    const pageNumbers = [];
    let start = Math.max(currentPage - 2, 1);
    let end = Math.min(start + 4, totalPages);
    if (end - start < 4) start = Math.max(end - 4, 1);
    for (let i = start; i <= end; i++) pageNumbers.push(i);
    return pageNumbers;
  };

  const monthTitle = format(currentMonth, "MMMM yyyy");
  const currentYear = format(currentMonth, "yyyy");
  const Legend = ({ color, label }) => (
    <div className="flex items-center gap-1.5">
      <div className={`w-3 h-3 rounded bg-gradient-to-br ${color}`} />
      <span className="text-xs text-gray-600 font-medium">{label}</span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mt-5 font-montserrat">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[25px] text-gray-800 mb-2">Date Restrictions</h1>
          <p className="text-gray-500">Manage restricted dates and special holidays</p>
        </div>

        {/* Organization Filter */}
        <div className="mb-6 bg-white rounded-2xl shadow-lg p-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Organization Filter
          </label>
          <Select
            value={selectedOrganization}
            onChange={setSelectedOrganization}
            options={organizations}
            className="text-sm"
            placeholder="Select Organization..."
            isClearable
          />
        </div>

        {/* Main Layout */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          {/* LEFT SECTION: Calendar */}
          <div className="space-y-6">
            {/* Year Navigator & Month Selector */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {/* Year Controls */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={goPrev}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                >
                  <FaChevronLeft /> <span className="font-semibold">{year - 1}</span>
                </button>

                <div className="flex items-center gap-3">
                  <FaCalendarAlt className="text-blue-600 text-2xl" />
                  <h2 className="text-2xl font-bold text-gray-800">{currentYear}</h2>
                </div>

                <button
                  onClick={goNext}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                >
                  <span className="font-semibold">{year + 1}</span> <FaChevronRight />
                </button>
              </div>

              {/* Month Grid */}
              <div className="grid grid-cols-4 gap-3">
                {months.map((m) => {
                  const active = format(currentMonth, "yyyy-MM") === format(new Date(year, m.idx, 1), "yyyy-MM");
                  return (
                    <button
                      key={m.idx}
                      onClick={() => setCurrentMonth(new Date(year, m.idx, 1))}
                      className={`
                      px-4 py-3 rounded-xl font-semibold text-sm transition-all
                      ${active
                          ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg scale-105"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md"
                        }
                    `}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Calendar Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3">
                <h3 className="text-lg font-bold text-white">{monthTitle}</h3>
                <p className="text-blue-100 text-xs">Click dates to assign holidays</p>
              </div>

              {/* Calendar Body */}
              <div className="p-4">
                {/* Days Header */}
                <div className="grid grid-cols-7 mb-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                    <div
                      key={d}
                      className={`text-center py-1 text-xs font-semibold ${i === 0 || i === 6 ? "text-blue-600" : "text-gray-600"
                        }`}
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar Dates */}
                <div className="space-y-1">
                  {weeks.map((week, widx) => (
                    <div key={widx} className="grid grid-cols-7 gap-1">
                      {week.map((day) => {
                        const inMonth = isSameMonth(day, currentMonth);
                        const k = dayKey(day);
                        const existing = restrictedMap.get(k);
                        const holidayType = existing?.type?.toLowerCase();
                        const isToday = isSameDay(day, new Date());

                        return (
                          <button
                            key={k}
                            onClick={(e) => onDayClick(day, e)}
                            className={`
  relative h-12 rounded-lg p-1 text-xs font-medium transition-all
  ${!inMonth ? "bg-gray-50 text-gray-300" : ""}
  ${inMonth && !existing ? "bg-white hover:bg-blue-50 hover:shadow-md text-gray-700" : ""}
  ${existing ? HOLIDAY_COLORS[holidayType] : ""}
  ${isToday && !existing ? "ring-2 ring-blue-500 ring-offset-1" : ""}
`}

                          >
                            <span className="relative z-10">{format(day, "d")}</span>

                            {/* Today Indicator */}
                            {isToday && !existing && (
                              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
                            )}

                            {existing && (
                              <div className="absolute top-0.5 right-0.5">
                                {holidayType === "restricted" ? (
                                  <FaBan className="text-white text-[8px]" />
                                ) : (
                                  <FaStar className="text-white text-[8px]" />
                                )}

                              </div>
                            )}

                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="mt-3 flex flex-wrap gap-4 justify-center">
                  <Legend color="bg-gradient-to-br from-yellow-400 to-orange-500 text-white" label="holiday" />
                  <Legend color="bg-gradient-to-br from-gray-500 to-gray-700 text-white" label="restricted" />
                  <Legend color="bg-gradient-to-br from-blue-500 to-blue-600 text-white" label="public" />
                  <Legend color="bg-gradient-to-br from-red-500 to-red-600 text-white" label="bank" />

                </div>

              </div>
            </div>

            {/* Assigned Dates Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-3">
                <h3 className="text-lg font-bold text-white">Assigned Dates for {monthTitle}</h3>
                <p className="text-purple-100 text-xs">All holidays this month</p>
              </div>

              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Holiday Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-sm">
                          No dates assigned for this month
                        </td>
                      </tr>
                    ) : (
                      tableData.map((date, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2">
                            <span className="font-semibold text-gray-800 text-sm">
                              {moment(date.date).format("DD/MM/YYYY")}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white bg-gradient-to-r from-yellow-500 to-orange-500">
                              <FaStar className="text-[8px]" /> Holiday
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-600 text-sm">
                            {date.name || "No name provided"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 px-4 py-3 bg-gray-50 border-t">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>

                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`
                      px-3 py-1.5 text-sm rounded-lg font-medium transition-all
                      ${currentPage === page
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }
                    `}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SECTION: Illustration */}
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 shadow-lg">
                <img
                  src={Date_Restriction_Img}
                  alt="date-restriction-img"
                  className="w-full rounded-lg floating-image"
                />

                <div className="mt-6 space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                    <FaStar className="text-yellow-500 mt-1" />
                    <div>
                      <p className="font-semibold text-sm text-gray-800">Holidays</p>
                      <p className="text-xs text-gray-500">Mark holidays and special days</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODALS */}
        {/* Delete Modal */}
        <Modal
          isOpen={deleteModalIsOpen}
          onRequestClose={() => setDeleteModalIsOpen(false)}
          contentLabel="Delete Holiday"
          className="modal-content max-w-md mx-auto mt-20 bg-white rounded-2xl shadow-2xl p-6"
          overlayClassName="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaTrash className="text-red-600 text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Delete Date?</h2>
            <p className="text-gray-500">This action cannot be undone</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Date to delete:</p>
            <p className="text-xl font-bold text-red-600">
              {selectedDate ? moment(selectedDate).format("DD/MM/YYYY") : ""}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setDeleteModalIsOpen(false)}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              onClick={deleteDate}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
            >
              Delete
            </button>
          </div>
        </Modal>

        {/* Holiday Modal */}
        <Modal
          isOpen={holidayModalIsOpen}
          onRequestClose={() => setHolidayModalIsOpen(false)}
          contentLabel="Add Holiday"
          className="modal-content max-w-lg mx-auto mt-20 bg-white rounded-2xl shadow-2xl p-6"
          overlayClassName="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center"
        >
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FaStar className="text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Add Holiday</h2>
            </div>
            <p className="text-gray-500 text-sm ml-13">
              {pendingDates.length > 1
                ? `Marking ${pendingDates.length} dates as holidays`
                : "Mark this date as a holiday"
              }
            </p>
          </div>

          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-medium">{successMessage}</p>
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Holiday Name *
              </label>
              <input
                type="text"
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
                placeholder="e.g., Christmas Day, Thai Pongal Day"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Holiday Type *
              </label>
              <Select
                value={holidayType}
                onChange={setHolidayType}
                options={HOLIDAY_TYPES}
                className="text-sm"
                placeholder="Select holiday type..."
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setHolidayModalIsOpen(false)}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              onClick={saveHoliday}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:shadow-lg transition-all font-medium"
            >
              Save Holiday
            </button>
          </div>
        </Modal>
      </div>
    </motion.div>
  );
};

export default Restricted_Date;