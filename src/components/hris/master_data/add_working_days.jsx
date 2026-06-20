import React, { useMemo, useState } from "react";
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
    parseISO,
} from "date-fns";

/** Tailwind assumptions:
 * - page bg: gray-50
 * - cards: white with rounded-lg and shadow
 * - primary: #2495FE (adjust below if you use a CSS var/class)
 */

const MONTHS_2025 = [
    { label: "2025 January", idx: 0 },
    { label: "2025 February", idx: 1 },
    { label: "2025 March", idx: 2 },
    { label: "2025 April", idx: 3 },
    { label: "2025 May", idx: 4 },
    { label: "2025 June", idx: 5 },
    { label: "2025 July", idx: 6 },
];

const dayKey = (d) => format(d, "yyyy-MM-dd");

const sameOrBefore = (a, b) => !isBefore(b, a);

const getMonthMatrix = (current) => {
    const monthStart = startOfMonth(current);
    const monthEnd = endOfMonth(current);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
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

const AddWorkingDays = () => {
    // Default to July 2025 to match screenshot
    const [currentMonth, setCurrentMonth] = useState(new Date(2025, 6, 1)); // 0-based month
    const [anchorDate, setAnchorDate] = useState(null); // first click before Ctrl+click
    const [selected, setSelected] = useState(() => new Set()); // Set of 'yyyy-MM-dd'

    const weeks = useMemo(() => getMonthMatrix(currentMonth), [currentMonth]);

    const toggleDay = (day) => {
        const k = dayKey(day);
        const next = new Set(selected);
        if (next.has(k)) next.delete(k);
        else next.add(k);
        setSelected(next);
    };

    const selectRange = (start, end) => {
        const a = isBefore(end, start) ? end : start;
        const b = isBefore(end, start) ? start : end;
        const days = [];
        let d = a;
        while (sameOrBefore(a, b)) {
            days.push(d);
            d = addDays(d, 1);
            if (isBefore(b, d) && !isSameDay(b, d)) break;
        }
        const next = new Set(selected);
        for (const dt of days) next.add(dayKey(dt));
        setSelected(next);
    };

    const onDayClick = (day, evt) => {
        if (evt?.ctrlKey && anchorDate) {
            selectRange(anchorDate, day);
            setAnchorDate(null);
            return;
        }
        // Normal click:
        // - If the clicked day already selected -> toggle off
        // - Else set anchor for potential Ctrl+click range, and toggle on
        const k = dayKey(day);
        const isAlready = selected.has(k);
        if (isAlready) {
            toggleDay(day);
            setAnchorDate(null);
        } else {
            toggleDay(day);
            setAnchorDate(day);
        }
    };

    const goPrev = () => setCurrentMonth((m) => subMonths(m, 1));
    const goNext = () => setCurrentMonth((m) => addMonths(m, 1));

    const jumpToMonth = (zeroBasedMonthIndex) => {
        setCurrentMonth(new Date(2025, zeroBasedMonthIndex, 1));
    };

    const onCreateDates = () => {
        // You can open a modal to paste/import dates—stub for now
        alert("Create Dates clicked");
    };

    const onUpdate = () => {
        // You’ll likely POST/PUT these dates to your API
        const payload = Array.from(selected.values()); // ['2025-07-01', ...]
        console.log("Selected working days:", payload);
        alert(`${payload.length} day(s) selected.\n\n${payload.join(", ")}`);
    };

    const monthTitle = format(currentMonth, "yyyy MMMM");

    return (
        <div className="p-6">
            <h1 className="text-[22px] text-gray-500 mb-4">
                <span className="font-medium">Time & Attendance</span>{" "}
                <span className="text-gray-400">/ Working Dates Selection</span>
            </h1>

            <div className="grid grid-cols-[260px_1fr] gap-4">
                {/* LEFT: Month List + Create */}
                <div className="bg-white rounded-lg shadow p-3">
                    <button
                        onClick={onCreateDates}
                        className="w-full h-10 rounded-md bg-[#2495FE] text-white font-medium flex items-center justify-center mb-3"
                    >
                        + Create Dates
                    </button>

                    <div className="border rounded-md overflow-hidden">
                        {MONTHS_2025.map((m) => {
                            const active =
                                format(currentMonth, "yyyy-MM") ===
                                format(new Date(2025, m.idx, 1), "yyyy-MM");
                            return (
                                <button
                                    key={m.idx}
                                    className={`w-full text-left px-3 py-3 text-sm border-b last:border-b-0 flex items-center justify-between ${active
                                            ? "bg-[#2495FE]/10 text-[#2495FE] font-semibold"
                                            : "hover:bg-gray-50 text-gray-700"
                                        }`}
                                    onClick={() => jumpToMonth(m.idx)}
                                >
                                    {m.label}
                                    <span className="text-gray-400">›</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                        <button className="hover:underline" onClick={goPrev}>
                            ← Previous
                        </button>
                        <button className="hover:underline" onClick={goNext}>
                            Next →
                        </button>
                    </div>
                </div>

                {/* RIGHT: Calendar */}
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-400">
                                <span className="text-red-500 font-medium mr-1">Note:</span>
                                Click a start date, hold <kbd className="px-1 py-0.5 border rounded">Ctrl</kbd> and
                                click an end date to select a period (click again to unselect).
                            </p>
                        </div>
                        <button
                            onClick={onUpdate}
                            className="h-9 px-4 rounded-md border border-[#2495FE] text-[#2495FE] hover:bg-[#2495FE] hover:text-white transition"
                        >
                            Update
                        </button>
                    </div>

                    <div className="mt-3 mb-2 text-[15px] font-medium text-gray-600">
                        {monthTitle}
                    </div>

                    {/* Calendar Grid */}
                    <div className="border rounded-md overflow-hidden">
                        {/* Header: days of week */}
                        <div className="grid grid-cols-7 bg-gray-50 text-gray-500 text-sm">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                                <div key={d} className="px-3 py-2 text-center border-b">
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Weeks */}
                        <div>
                            {weeks.map((week, widx) => (
                                <div key={widx} className="grid grid-cols-7">
                                    {week.map((day) => {
                                        const inMonth = isSameMonth(day, currentMonth);
                                        const k = dayKey(day);
                                        const isSelected = selected.has(k);

                                        return (
                                            <button
                                                key={k}
                                                onClick={(e) => onDayClick(day, e)}
                                                className={[
                                                    "h-20 border p-2 text-left relative transition",
                                                    inMonth ? "bg-white" : "bg-gray-50 text-gray-400",
                                                    isSelected
                                                        ? "bg-blue-100 hover:bg-blue-200"
                                                        : "hover:bg-gray-50",
                                                ].join(" ")}
                                                title={k}
                                            >
                                                <span
                                                    className={[
                                                        "text-sm",
                                                        inMonth ? "text-gray-700" : "text-gray-400",
                                                    ].join(" ")}
                                                >
                                                    {format(day, "d")}
                                                </span>

                                                {/* selection cue (optional) */}
                                                {isSelected && (
                                                    <span className="absolute inset-1 rounded border border-blue-300 pointer-events-none" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Legend (optional) */}
                    <div className="mt-3 flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-4 bg-blue-100 border border-blue-300 rounded inline-block" />
                            <span className="text-gray-600">Working Day</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-4 bg-gray-50 border rounded inline-block" />
                            <span className="text-gray-600">Other Month</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddWorkingDays;
