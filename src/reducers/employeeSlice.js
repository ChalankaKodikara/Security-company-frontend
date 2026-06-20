/** @format */

// employeeSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  employee_details: {}, // Store employee details temporarily
};

const employeeSlice = createSlice({
  name: "employee",
  initialState,
  reducers: {
    saveEmployeeData: (state, action) => {
      Object.assign(state.employee_details, action.payload);
    },
    updateEmployeeData: (state, action) => {
      const { key, value } = action.payload; // Payload contains key and value
      state.employee_details[key] = value; // Update specific field
    },
    resetEmployeeState: (state) => {
      return initialState; // Reset state to initial
    },
  },
});

export const { saveEmployeeData, updateEmployeeData, resetEmployeeState } =
  employeeSlice.actions;

export default employeeSlice.reducer;
