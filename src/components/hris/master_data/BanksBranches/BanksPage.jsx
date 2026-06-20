/** @format */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { TbBuildingBank } from "react-icons/tb";
import { TbBuildingSkyscraper } from "react-icons/tb";
import BankSetup from "./BankSetup";
import BranchesPage from "./BranchesPage";
import usePermissions from "../../../permissions/permission";

function BanksPage() {

  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState("banks"); // Start with 'banks' active


  const allTabs = [
    { key: "banks", label: "Bank Setup", permissionId: 1021 },
    { key: "branches", label: "Branch Setup", permissionId: 1022 },
  ];

  // Filter tabs based on permissions
  const tabs = allTabs.filter((tab) => hasPermission(tab.permissionId));

  const handleTabClick = (tabKey) => {
    setActiveTab(tabKey);
  };

  const sampleData = [
    { bank_name: "Bank of Ceylon", bank_code: "343433" },
    { bank_name: "Commercial Bank", bank_code: "343433" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-2xl text-gray-400 mb-4 font-montserrat mt-5">
        Settings / Master Data /
        <span className="text-gray-700"> Banks & Branches </span>
      </h1>

      {/* TABS */}
      <div className="flex gap-3 justify-start mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabClick(tab.key)}
            className={`flex items-center gap-2 text-sm px-4 py-1.5 rounded-md font-medium ${
              activeTab === tab.key ? "bg-blue-500 text-white" : "text-gray-400"
            }`}
          >
            {tab.key === "banks" && <TbBuildingBank className="text-base" />}
            {tab.key === "branches" && (
              <TbBuildingSkyscraper className="text-base" />
            )}
            {tab.label} {tab.count ? `(${tab.count})` : ""}
          </button>
        ))}
      </div>

      {/* Conditional Rendering of Content */}
      {activeTab === "banks" && hasPermission(1021) && <BankSetup />}
      {activeTab === "branches" && hasPermission(1022) && (
        <BranchesPage sampleData={sampleData} />
      )}
    </motion.div>
  );
}

export default BanksPage;
