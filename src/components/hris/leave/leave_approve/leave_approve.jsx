import React, { useState, useEffect } from "react";
import moment from "moment";
import Leave_approve_table from "./leave_approve_table";
import { motion } from "framer-motion";


const Leave_approve = () => {

  const currentDate = moment().format("MMMM Do YYYY");
  const [currentTime, setCurrentTime] = useState(moment().format("h:mm:ss a"));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment().format("h:mm:ss a"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
 


  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
    >
      <div className=" mt-5 font-montserrat">

        <div>
          <Leave_approve_table />
        </div>
      </div>

    </motion.div>

  );
};

export default Leave_approve;
