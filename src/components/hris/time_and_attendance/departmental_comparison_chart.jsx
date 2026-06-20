import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const DepartmentalComparisonChart = ({ data }) => {
  // Map the data to the structure needed for the chart
  const chartData = data.map((department) => ({
    name: department.department || "Unknown",
    AttendanceRate: parseFloat(department.attendance_rate),
    AbsenteeismRate: parseFloat(department.absenteeism_rate),
  }));

  return (
    <ResponsiveContainer width="100%" height={450}>
      <BarChart data={chartData} layout="vertical" barCategoryGap="15%">
        <XAxis type="number" />
        <YAxis type="category" dataKey="name" />
        <Tooltip />
        <Legend />
        <Bar dataKey="AttendanceRate" fill="#8884d8" barSize={25} />
        <Bar dataKey="AbsenteeismRate" fill="#82ca9d" barSize={25} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default DepartmentalComparisonChart;
