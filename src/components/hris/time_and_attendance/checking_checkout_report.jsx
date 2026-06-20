import React from "react";
import { motion } from "framer-motion";
import CheckinCheckoutReportTable from "./checking_checkout_report_table";

const CheckinCheckoutReport = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mt-5 overflow-y-auto font-montserrat">
        <div>
          <CheckinCheckoutReportTable />
        </div>
      </div>
    </motion.div>
  );
};

export default CheckinCheckoutReport;