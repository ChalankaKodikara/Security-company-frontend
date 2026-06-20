/** @format */

import { configureStore } from "@reduxjs/toolkit";
import employeeReducer from "../reducers/employeeSlice";

const store = configureStore({
  reducer: {
    employee: employeeReducer,
  },
});

export default store;
